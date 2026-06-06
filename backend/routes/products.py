from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/products", tags=["products"])

db = None


def set_db(database):
    global db
    db = database


def serialize_product(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


class ProductCreate(BaseModel):
    name: str
    style: str
    occasion: str
    material: str
    gender: str
    price: int
    tag: Optional[str] = None
    articleCode: str
    description: str
    colors: list
    sizes: list
    images: list
    features: list
    specifications: dict
    customized: Optional[bool] = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    style: Optional[str] = None
    occasion: Optional[str] = None
    material: Optional[str] = None
    price: Optional[int] = None
    tag: Optional[str] = None
    description: Optional[str] = None
    colors: Optional[list] = None
    sizes: Optional[list] = None
    images: Optional[list] = None
    features: Optional[list] = None
    specifications: Optional[dict] = None
    customized: Optional[bool] = None


@router.get("")
async def get_products(
    gender: Optional[str] = Query(None),
    style: Optional[str] = Query(None),
    occasion: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    limit: int = Query(50),
    skip: int = Query(0)
):
    import re
    query = {}
    if gender:
        query["gender"] = gender.lower()
    if style:
        query["style"] = {"$regex": re.escape(style), "$options": "i"}
    if occasion:
        query["occasion"] = {"$regex": re.escape(occasion), "$options": "i"}
    if search:
        escaped_search = re.escape(search)
        # Full-text search across name, style, articleCode, material
        query["$or"] = [
            {"name": {"$regex": escaped_search, "$options": "i"}},
            {"style": {"$regex": escaped_search, "$options": "i"}},
            {"articleCode": {"$regex": escaped_search, "$options": "i"}},
            {"material": {"$regex": escaped_search, "$options": "i"}},
        ]

    sort_spec = [("_id", -1)]
    if sort == "price-low":
        sort_spec = [("price", 1)]
    elif sort == "price-high":
        sort_spec = [("price", -1)]
    elif sort == "rating":
        sort_spec = [("avg_rating", -1), ("review_count", -1)]

    cursor = db.products.find(query).sort(sort_spec).skip(skip).limit(limit)
    products = []
    async for doc in cursor:
        products.append(serialize_product(doc))

    total = await db.products.count_documents(query)
    return {"products": products, "total": total}


@router.get("/{product_id}")
async def get_product(product_id: str):
    try:
        doc = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        # Fallback: try finding by numeric id field
        doc = await db.products.find_one({"numericId": int(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Coalesce and merge real-time inventory size stock
    inv = await db.inventory.find_one({"product_id": doc["_id"]})
    if inv:
        doc["size_stock"] = inv.get("size_stock", {})
    else:
        # Graceful fallback: seed standard stock levels for sizes if inventory record is missing
        doc["size_stock"] = {str(s): 10 for s in doc.get("sizes", [])}
        
    return serialize_product(doc)


@router.post("")
async def create_product(product: ProductCreate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    doc = product.model_dump()
    result = await db.products.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}
