from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/inventory", tags=["inventory"])

db = None


def set_db(database):
    global db
    db = database


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("product_id"), ObjectId):
        doc["product_id"] = str(doc["product_id"])
    return doc


class StockUpdate(BaseModel):
    size_stock: dict  # {"6": 10, "7": 8, ...}
    low_stock_threshold: Optional[int] = 3
    notes: Optional[str] = None


class RestockRequest(BaseModel):
    size: str
    quantity: int
    notes: Optional[str] = None


# ===== Overview Stats =====

@router.get("/stats")
async def inventory_stats(request: Request):
    await require_admin(request)

    total_skus = await db.inventory.count_documents({})
    in_stock = await db.inventory.count_documents({"status": "in_stock"})
    low_stock = await db.inventory.count_documents({"status": "low_stock"})
    out_of_stock = await db.inventory.count_documents({"status": "out_of_stock"})

    # Total units across all inventory
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_stock"}}}]
    result = await db.inventory.aggregate(pipeline).to_list(1)
    total_units = result[0]["total"] if result else 0

    # Total inventory value (stock * product price or accessory price)
    value_pipeline = [
        {"$lookup": {"from": "products", "localField": "product_id", "foreignField": "_id", "as": "product"}},
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "accessories", "localField": "product_id", "foreignField": "_id", "as": "accessory"}},
        {"$unwind": {"path": "$accessory", "preserveNullAndEmptyArrays": True}},
        {"$project": {"value": {"$multiply": ["$total_stock", {"$ifNull": ["$product.price", "$accessory.price", 0]}]}}},
        {"$group": {"_id": None, "total": {"$sum": "$value"}}}
    ]
    value_result = await db.inventory.aggregate(value_pipeline).to_list(1)
    total_value = value_result[0]["total"] if value_result else 0

    return {
        "total_skus": total_skus,
        "in_stock": in_stock,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "total_units": total_units,
        "total_value": total_value
    }



# ===== List All Inventory =====

@router.get("")
async def list_inventory(
    request: Request,
    category: Optional[str] = None,
    status: Optional[str] = None,
    gender: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "name",
    limit: int = 50,
    skip: int = 0
):
    await require_admin(request)

    # Build aggregation pipeline to join product and accessory data
    pipeline = [
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {
            "from": "accessories",
            "localField": "product_id",
            "foreignField": "_id",
            "as": "accessory"
        }},
        {"$unwind": {"path": "$accessory", "preserveNullAndEmptyArrays": True}},
    ]

    # Filters
    match_conditions = {}
    if status:
        match_conditions["status"] = status
    if category:
        if category.lower() == "accessories":
            match_conditions["$or"] = [
                {"is_accessory": True},
                {"accessory": {"$ne": None}}
            ]
        else:
            import re
            match_conditions["$or"] = [
                {"product.style": {"$regex": re.escape(category), "$options": "i"}},
                {"accessory.category": {"$regex": re.escape(category), "$options": "i"}}
            ]
    if gender:
        match_conditions["product.gender"] = gender.lower()
    if search:
        import re
        escaped_search = re.escape(search)
        match_conditions["$or"] = [
            {"product.name": {"$regex": escaped_search, "$options": "i"}},
            {"accessory.name": {"$regex": escaped_search, "$options": "i"}},
            {"sku": {"$regex": escaped_search, "$options": "i"}},
            {"product.articleCode": {"$regex": escaped_search, "$options": "i"}},
            {"accessory.sku": {"$regex": escaped_search, "$options": "i"}}
        ]

    if match_conditions:
        pipeline.append({"$match": match_conditions})

    # Project clean/coalesced output before sort and count
    pipeline.append({"$project": {
        "_id": 0,
        "id": {"$toString": "$_id"},
        "product_id": {"$toString": "$product_id"},
        "sku": 1,
        "product_name": {"$ifNull": ["$product.name", "$accessory.name"]},
        "article_code": {"$ifNull": ["$product.articleCode", "$accessory.sku"]},
        "gender": {"$ifNull": ["$product.gender", "accessories"]},
        "style": {"$ifNull": ["$product.style", "$accessory.category"]},
        "price": {"$ifNull": ["$product.price", "$accessory.price"]},
        "tag": {"$ifNull": ["$product.tag", "$accessory.tag"]},
        "sizes": {"$ifNull": ["$product.sizes", "$accessory.sizes"]},
        "size_stock": 1,
        "total_stock": 1,
        "low_stock_threshold": 1,
        "status": 1,
        "last_restocked": 1,
        "restock_history": 1,
        "created_at": 1,
        "is_accessory": {"$ifNull": ["$is_accessory", {"$cond": [{"$not": ["$product"]}, True, False]}]}
    }})

    # Count total before pagination
    count_pipeline = pipeline + [{"$count": "total"}]
    count_result = await db.inventory.aggregate(count_pipeline).to_list(1)
    total = count_result[0]["total"] if count_result else 0

    # Sort on projected fields
    sort_map = {
        "name": {"product_name": 1},
        "stock_low": {"total_stock": 1},
        "stock_high": {"total_stock": -1},
        "price_low": {"price": 1},
        "price_high": {"price": -1},
    }
    sort_spec = sort_map.get(sort_by, {"product_name": 1})
    pipeline.append({"$sort": sort_spec})
    pipeline.append({"$skip": skip})
    pipeline.append({"$limit": limit})

    items = await db.inventory.aggregate(pipeline).to_list(limit)
    return {"items": items, "total": total}



# ===== Get Single Inventory Item =====

@router.get("/{inventory_id}")
async def get_inventory_item(inventory_id: str, request: Request):
    await require_admin(request)
    doc = await db.inventory.find_one({"_id": ObjectId(inventory_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Get product info or accessory info if not a shoe product
    product = await db.products.find_one({"_id": doc["product_id"]}, {"_id": 0, "name": 1, "articleCode": 1, "price": 1, "gender": 1, "style": 1, "sizes": 1, "images": 1})
    if not product:
        accessory = await db.accessories.find_one({"_id": doc["product_id"]})
        if accessory:
            product = {
                "name": accessory.get("name"),
                "articleCode": accessory.get("sku"),
                "price": accessory.get("price"),
                "gender": "accessories",
                "style": accessory.get("category"),
                "sizes": accessory.get("sizes", []),
                "images": accessory.get("images", [])
            }
    result = serialize(doc)
    result["product"] = product or {}
    return result



# ===== Update Stock Levels =====

@router.put("/{inventory_id}")
async def update_stock(inventory_id: str, data: StockUpdate, request: Request):
    await require_admin(request)

    doc = await db.inventory.find_one({"_id": ObjectId(inventory_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    total = sum(int(v) for v in data.size_stock.values())
    threshold = data.low_stock_threshold or doc.get("low_stock_threshold", 3)

    if total == 0:
        status = "out_of_stock"
    elif total <= threshold:
        status = "low_stock"
    else:
        status = "in_stock"

    update = {
        "$set": {
            "size_stock": data.size_stock,
            "total_stock": total,
            "low_stock_threshold": threshold,
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }

    if data.notes:
        update["$push"] = {
            "restock_history": {
                "action": "stock_update",
                "notes": data.notes,
                "new_total": total,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }

    await db.inventory.update_one({"_id": ObjectId(inventory_id)}, update)

    # Bidirectional Sync: Keep accessories collection updated
    if doc.get("is_accessory") or await db.accessories.find_one({"_id": doc["product_id"]}):
        await db.inventory.update_one({"_id": ObjectId(inventory_id)}, {"$set": {"is_accessory": True}})
        in_stock_bool = total > 0
        await db.accessories.update_one(
            {"_id": doc["product_id"]},
            {"$set": {
                "stock_qty": total,
                "in_stock": in_stock_bool,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

    return {"message": "Stock updated", "total_stock": total, "status": status}



# ===== Restock a Specific Size =====

@router.post("/{inventory_id}/restock")
async def restock_size(inventory_id: str, data: RestockRequest, request: Request):
    admin = await require_admin(request)

    doc = await db.inventory.find_one({"_id": ObjectId(inventory_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    size_stock = doc.get("size_stock", {})
    current = int(size_stock.get(data.size, 0))
    size_stock[data.size] = current + data.quantity

    total = sum(int(v) for v in size_stock.values())
    threshold = doc.get("low_stock_threshold", 3)
    if total == 0:
        status = "out_of_stock"
    elif total <= threshold:
        status = "low_stock"
    else:
        status = "in_stock"

    await db.inventory.update_one(
        {"_id": ObjectId(inventory_id)},
        {
            "$set": {
                "size_stock": size_stock,
                "total_stock": total,
                "status": status,
                "last_restocked": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "restock_history": {
                    "action": "restock",
                    "size": data.size,
                    "quantity": data.quantity,
                    "notes": data.notes or "",
                    "by": admin.get("name", "Admin"),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )

    # Bidirectional Sync: Keep accessories collection updated
    if doc.get("is_accessory") or await db.accessories.find_one({"_id": doc["product_id"]}):
        await db.inventory.update_one({"_id": ObjectId(inventory_id)}, {"$set": {"is_accessory": True}})
        in_stock_bool = total > 0
        await db.accessories.update_one(
            {"_id": doc["product_id"]},
            {"$set": {
                "stock_qty": total,
                "in_stock": in_stock_bool,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

    return {"message": f"Restocked size {data.size} with +{data.quantity}", "total_stock": total, "status": status}



# ===== Seed Inventory (for initial setup) =====

@router.post("/seed")
async def seed_inventory(request: Request):
    await require_admin(request)

    # Polymorphic incremental seeding: ensure all products and accessories have inventory records
    products = await db.products.find({}).to_list(200)
    accessories = await db.accessories.find({}).to_list(200)

    seeded_count = 0
    import random

    for p in products:
        existing = await db.inventory.find_one({"product_id": p["_id"]})
        if not existing:
            sizes = p.get("sizes", [])
            size_stock = {s: random.randint(0, 15) for s in sizes}
            total = sum(size_stock.values())
            status = "out_of_stock" if total == 0 else ("low_stock" if total <= 3 else "in_stock")

            await db.inventory.insert_one({
                "product_id": p["_id"],
                "sku": p.get("articleCode", f"BYD-{str(p['_id'])[-6:].upper()}"),
                "size_stock": size_stock,
                "total_stock": total,
                "low_stock_threshold": 3,
                "status": status,
                "is_accessory": False,
                "last_restocked": datetime.now(timezone.utc).isoformat(),
                "restock_history": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            seeded_count += 1

    for a in accessories:
        existing = await db.inventory.find_one({"product_id": a["_id"]})
        if not existing:
            sizes = a.get("sizes", [])
            if not sizes:
                sizes = ["One Size"]

            # Distribute existing stock_qty or random if 0
            stock_qty = a.get("stock_qty", 0)
            size_stock = {}
            if len(sizes) == 1:
                size_stock[sizes[0]] = stock_qty
            else:
                remaining = stock_qty
                for idx, s in enumerate(sizes):
                    if idx == len(sizes) - 1:
                        size_stock[s] = remaining
                    else:
                        val = random.randint(0, remaining)
                        size_stock[s] = val
                        remaining -= val

            total = sum(size_stock.values())
            status = "out_of_stock" if total == 0 else ("low_stock" if total <= 3 else "in_stock")

            await db.inventory.insert_one({
                "product_id": a["_id"],
                "sku": a.get("sku", f"ACC-{str(a['_id'])[-6:].upper()}"),
                "size_stock": size_stock,
                "total_stock": total,
                "low_stock_threshold": 3,
                "status": status,
                "is_accessory": True,
                "last_restocked": datetime.now(timezone.utc).isoformat(),
                "restock_history": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            seeded_count += 1

    return {"message": f"Successfully seeded/synchronized inventory records. Created {seeded_count} new entries."}

