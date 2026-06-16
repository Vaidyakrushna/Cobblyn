from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from bson import ObjectId
import csv
import io
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accessories", tags=["accessories"])

db = None


def set_db(database):
    global db
    db = database


def serialize_acc(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Pydantic models ────────────────────────────────────────────────────────────

class AccessoryCreate(BaseModel):
    name: str
    sku: str
    category: str
    subcategory: Optional[str] = ""
    material: str
    price: int
    tag: Optional[str] = ""
    description: Optional[str] = ""
    colors: Optional[List[Dict[str, Any]]] = []
    sizes: Optional[List[str]] = []
    images: Optional[List[str]] = []
    features: Optional[List[str]] = []
    specifications: Optional[Dict[str, Any]] = {}
    in_stock: Optional[bool] = True
    stock_qty: Optional[int] = 0


class AccessoryUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    material: Optional[str] = None
    price: Optional[int] = None
    tag: Optional[str] = None
    description: Optional[str] = None
    colors: Optional[List[Dict[str, Any]]] = None
    sizes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    features: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    in_stock: Optional[bool] = None
    stock_qty: Optional[int] = None


# ── GET all ────────────────────────────────────────────────────────────────────

@router.get("")
async def list_accessories(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    limit: int = Query(100),
    skip: int = Query(0),
):
    query: Dict[str, Any] = {}

    import re
    if category:
        query["category"] = {"$regex": f"^{re.escape(category)}$", "$options": "i"}
    if tag:
        query["tag"] = {"$regex": re.escape(tag), "$options": "i"}
    if in_stock is not None:
        query["in_stock"] = in_stock
    if search:
        escaped_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": escaped_search, "$options": "i"}},
            {"sku": {"$regex": escaped_search, "$options": "i"}},
            {"material": {"$regex": escaped_search, "$options": "i"}},
            {"category": {"$regex": escaped_search, "$options": "i"}},
        ]

    sort_spec = [("_id", -1)]
    if sort == "price-low":
        sort_spec = [("price", 1)]
    elif sort == "price-high":
        sort_spec = [("price", -1)]
    elif sort == "name":
        sort_spec = [("name", 1)]

    cursor = db.accessories.find(query).sort(sort_spec).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(serialize_acc(doc))

    total = await db.accessories.count_documents(query)
    return {"accessories": items, "total": total}


# ── GET single ─────────────────────────────────────────────────────────────────

@router.get("/{acc_id}")
async def get_accessory(acc_id: str):
    try:
        doc = await db.accessories.find_one({"_id": ObjectId(acc_id)})
    except Exception:
        doc = await db.accessories.find_one({"sku": acc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Accessory not found")
    return serialize_acc(doc)


# ── POST create ────────────────────────────────────────────────────────────────

@router.post("")
async def create_accessory(acc: AccessoryCreate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    # Enforce unique SKU
    existing = await db.accessories.find_one({"sku": acc.sku})
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{acc.sku}' already exists")

    doc = acc.model_dump()
    result = await db.accessories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)

    # Sync inventory: auto-create inventory record for this new accessory
    sizes = acc.sizes or ["One Size"]
    stock_qty = acc.stock_qty or 0
    size_stock = {}
    if len(sizes) == 1:
        size_stock[sizes[0]] = stock_qty
    else:
        base_qty = stock_qty // len(sizes)
        rem = stock_qty % len(sizes)
        for idx, s in enumerate(sizes):
            size_stock[s] = base_qty + (1 if idx < rem else 0)

    total = sum(size_stock.values())
    status = "out_of_stock" if total == 0 else ("low_stock" if total <= 3 else "in_stock")

    from datetime import datetime, timezone
    await db.inventory.insert_one({
        "product_id": result.inserted_id,
        "sku": acc.sku,
        "size_stock": size_stock,
        "total_stock": total,
        "low_stock_threshold": 3,
        "status": status,
        "is_accessory": True,
        "last_restocked": datetime.now(timezone.utc).isoformat(),
        "restock_history": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return doc



# ── PUT update ─────────────────────────────────────────────────────────────────

@router.put("/{acc_id}")
async def update_accessory(acc_id: str, acc: AccessoryUpdate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    update_data = {k: v for k, v in acc.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        result = await db.accessories.update_one(
            {"_id": ObjectId(acc_id)}, {"$set": update_data}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Accessory not found")
    return {"message": "Accessory updated"}


# ── DELETE ─────────────────────────────────────────────────────────────────────

@router.delete("/{acc_id}")
async def delete_accessory(acc_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        # Delete corresponding inventory document
        await db.inventory.delete_one({"product_id": ObjectId(acc_id)})
        result = await db.accessories.delete_one({"_id": ObjectId(acc_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Accessory not found")
    return {"message": "Accessory deleted"}



# ── POST bulk CSV upload ───────────────────────────────────────────────────────

@router.post("/bulk/upload")
async def bulk_upload_accessories(request: Request):
    from auth_utils import get_current_user
    from fastapi import UploadFile, File
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    body = await request.body()
    try:
        text = body.decode("utf-8-sig")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode file. Use UTF-8 CSV.")

    reader = csv.DictReader(io.StringIO(text))
    created = 0
    updated = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        try:
            sku = (row.get("sku") or "").strip()
            if not sku:
                errors.append(f"Row {i}: missing SKU")
                continue

            doc = {
                "name": row.get("name", "").strip(),
                "sku": sku,
                "category": row.get("category", "").strip().lower(),
                "subcategory": row.get("subcategory", "").strip(),
                "material": row.get("material", "").strip(),
                "price": int(row.get("price", 0) or 0),
                "tag": row.get("tag", "").strip(),
                "description": row.get("description", "").strip(),
                "in_stock": (row.get("in_stock", "true") or "true").strip().lower() != "false",
                "stock_qty": int(row.get("stock_qty", 0) or 0),
                "colors": [],
                "sizes": [s.strip() for s in (row.get("sizes", "") or "").split("|") if s.strip()],
                "images": [s.strip() for s in (row.get("images", "") or "").split("|") if s.strip()],
                "features": [s.strip() for s in (row.get("features", "") or "").split("|") if s.strip()],
                "specifications": {},
            }

            existing = await db.accessories.find_one({"sku": sku})
            acc_id = None
            if existing:
                await db.accessories.update_one({"sku": sku}, {"$set": doc})
                acc_id = existing["_id"]
                updated += 1
            else:
                insert_res = await db.accessories.insert_one(doc)
                acc_id = insert_res.inserted_id
                created += 1

            # Sync inventory document
            if acc_id:
                sizes = doc.get("sizes") or ["One Size"]
                stock_qty = doc.get("stock_qty", 0)
                size_stock = {}
                if len(sizes) == 1:
                    size_stock[sizes[0]] = stock_qty
                else:
                    base_qty = stock_qty // len(sizes)
                    rem = stock_qty % len(sizes)
                    for idx, s in enumerate(sizes):
                        size_stock[s] = base_qty + (1 if idx < rem else 0)

                total = sum(size_stock.values())
                status = "out_of_stock" if total == 0 else ("low_stock" if total <= 3 else "in_stock")

                from datetime import datetime, timezone
                # Update or insert
                await db.inventory.update_one(
                    {"product_id": acc_id},
                    {
                        "$set": {
                            "sku": sku,
                            "size_stock": size_stock,
                            "total_stock": total,
                            "status": status,
                            "is_accessory": True,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        },
                        "$setOnInsert": {
                            "product_id": acc_id,
                            "low_stock_threshold": 3,
                            "last_restocked": datetime.now(timezone.utc).isoformat(),
                            "restock_history": [],
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                    },
                    upsert=True
                )

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    return {"created": created, "updated": updated, "errors": errors}

