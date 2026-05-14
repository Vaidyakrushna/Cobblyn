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

    # Total inventory value (stock * product price)
    value_pipeline = [
        {"$lookup": {"from": "products", "localField": "product_id", "foreignField": "_id", "as": "product"}},
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
        {"$project": {"value": {"$multiply": ["$total_stock", {"$ifNull": ["$product.price", 0]}]}}},
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

    # Build aggregation pipeline to join product data
    pipeline = [
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
    ]

    # Filters
    match_conditions = {}
    if status:
        match_conditions["status"] = status
    if category:
        match_conditions["product.style"] = {"$regex": category, "$options": "i"}
    if gender:
        match_conditions["product.gender"] = gender.lower()
    if search:
        match_conditions["$or"] = [
            {"product.name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"product.articleCode": {"$regex": search, "$options": "i"}}
        ]

    if match_conditions:
        pipeline.append({"$match": match_conditions})

    # Count total before pagination
    count_pipeline = pipeline + [{"$count": "total"}]
    count_result = await db.inventory.aggregate(count_pipeline).to_list(1)
    total = count_result[0]["total"] if count_result else 0

    # Sort
    sort_map = {
        "name": {"product.name": 1},
        "stock_low": {"total_stock": 1},
        "stock_high": {"total_stock": -1},
        "price_low": {"product.price": 1},
        "price_high": {"product.price": -1},
    }
    sort_spec = sort_map.get(sort_by, {"product.name": 1})
    pipeline.append({"$sort": sort_spec})
    pipeline.append({"$skip": skip})
    pipeline.append({"$limit": limit})

    # Project clean output
    pipeline.append({"$project": {
        "_id": 0,
        "id": {"$toString": "$_id"},
        "product_id": {"$toString": "$product_id"},
        "sku": 1,
        "product_name": "$product.name",
        "article_code": "$product.articleCode",
        "gender": "$product.gender",
        "style": "$product.style",
        "price": "$product.price",
        "tag": "$product.tag",
        "sizes": "$product.sizes",
        "size_stock": 1,
        "total_stock": 1,
        "low_stock_threshold": 1,
        "status": 1,
        "last_restocked": 1,
        "restock_history": 1,
        "created_at": 1,
    }})

    items = await db.inventory.aggregate(pipeline).to_list(limit)
    return {"items": items, "total": total}


# ===== Get Single Inventory Item =====

@router.get("/{inventory_id}")
async def get_inventory_item(inventory_id: str, request: Request):
    await require_admin(request)
    doc = await db.inventory.find_one({"_id": ObjectId(inventory_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Get product info
    product = await db.products.find_one({"_id": doc["product_id"]}, {"_id": 0, "name": 1, "articleCode": 1, "price": 1, "gender": 1, "style": 1, "sizes": 1, "images": 1})
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
    return {"message": f"Restocked size {data.size} with +{data.quantity}", "total_stock": total, "status": status}


# ===== Seed Inventory (for initial setup) =====

@router.post("/seed")
async def seed_inventory(request: Request):
    await require_admin(request)

    count = await db.inventory.count_documents({})
    if count > 0:
        return {"message": f"Inventory already seeded ({count} items)"}

    products = await db.products.find({}).to_list(100)
    docs = []
    for p in products:
        sizes = p.get("sizes", [])
        # Random-ish stock for demo
        import random
        size_stock = {}
        for s in sizes:
            size_stock[s] = random.randint(0, 15)

        total = sum(size_stock.values())
        if total == 0:
            status = "out_of_stock"
        elif total <= 3:
            status = "low_stock"
        else:
            status = "in_stock"

        docs.append({
            "product_id": p["_id"],
            "sku": p.get("articleCode", f"BYD-{str(p['_id'])[-6:].upper()}"),
            "size_stock": size_stock,
            "total_stock": total,
            "low_stock_threshold": 3,
            "status": status,
            "last_restocked": datetime.now(timezone.utc).isoformat(),
            "restock_history": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    if docs:
        await db.inventory.insert_many(docs)

    return {"message": f"Seeded inventory for {len(docs)} products"}
