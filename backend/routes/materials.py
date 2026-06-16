from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/materials", tags=["materials"])

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
    return doc


class MaterialCreate(BaseModel):
    name: str
    category: str  # leather, sole, lining, texture
    type: Optional[str] = None  # Premium, Semi Premium
    image_url: Optional[str] = None
    color_hex: Optional[str] = None
    price_modifier: int = 0  # additional cost in rupees
    description: Optional[str] = None
    available: bool = True


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    color_hex: Optional[str] = None
    price_modifier: Optional[int] = None
    description: Optional[str] = None
    available: Optional[bool] = None


@router.get("")
async def list_materials(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    cursor = db.materials.find(query).sort("name", 1)
    materials = []
    async for doc in cursor:
        materials.append(serialize(doc))
    return {"materials": materials, "total": len(materials)}


@router.get("/{material_id}")
async def get_material(material_id: str):
    doc = await db.materials.find_one({"_id": ObjectId(material_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Material not found")
    return serialize(doc)


@router.post("")
async def create_material(mat: MaterialCreate, request: Request):
    await require_admin(request)
    doc = mat.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.materials.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/{material_id}")
async def update_material(material_id: str, mat: MaterialUpdate, request: Request):
    await require_admin(request)
    update_data = {k: v for k, v in mat.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.materials.update_one({"_id": ObjectId(material_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material updated"}


@router.delete("/{material_id}")
async def delete_material(material_id: str, request: Request):
    await require_admin(request)
    result = await db.materials.delete_one({"_id": ObjectId(material_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted"}
