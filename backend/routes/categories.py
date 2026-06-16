from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
import logging
from auth_utils import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/categories", tags=["categories"])

db = None

def set_db(database):
    global db
    db = database

async def get_admin_user(request: Request):
    user = await get_current_user(request, db)
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    parent_id: Optional[str] = None
    image_url: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None

def category_response(cat: dict) -> dict:
    return {
        "id": str(cat["_id"]),
        "name": cat.get("name", ""),
        "slug": cat.get("slug", ""),
        "description": cat.get("description", ""),
        "parent_id": str(cat["parent_id"]) if cat.get("parent_id") else None,
        "image_url": cat.get("image_url", ""),
        "created_at": cat.get("created_at")
    }

@router.get("/")
async def get_categories():
    cursor = db.categories.find({})
    categories = await cursor.to_list(length=1000)
    return [category_response(c) for c in categories]

@router.get("/{id}")
async def get_category(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    category = await db.categories.find_one({"_id": ObjectId(id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category_response(category)

@router.post("/")
async def create_category(category: CategoryCreate, admin=Depends(get_admin_user)):
    existing = await db.categories.find_one({"slug": category.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    doc = category.dict()
    if doc.get("parent_id"):
        if not ObjectId.is_valid(doc["parent_id"]):
            raise HTTPException(status_code=400, detail="Invalid parent ID")
        parent = await db.categories.find_one({"_id": ObjectId(doc["parent_id"])})
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")
        doc["parent_id"] = ObjectId(doc["parent_id"])
    
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.categories.insert_one(doc)
    
    new_cat = await db.categories.find_one({"_id": result.inserted_id})
    return category_response(new_cat)

@router.put("/{id}")
async def update_category(id: str, updates: CategoryUpdate, admin=Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    if updates.slug:
        existing = await db.categories.find_one({"slug": updates.slug, "_id": {"$ne": ObjectId(id)}})
        if existing:
            raise HTTPException(status_code=400, detail="Category slug already exists")
            
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if "parent_id" in update_data:
        if update_data["parent_id"]:
            if not ObjectId.is_valid(update_data["parent_id"]):
                raise HTTPException(status_code=400, detail="Invalid parent ID")
            if update_data["parent_id"] == id:
                raise HTTPException(status_code=400, detail="Category cannot be its own parent")
            update_data["parent_id"] = ObjectId(update_data["parent_id"])
        else:
            update_data["parent_id"] = None
            
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = await db.categories.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
        
    updated = await db.categories.find_one({"_id": ObjectId(id)})
    return category_response(updated)

@router.delete("/{id}")
async def delete_category(id: str, admin=Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    # Check if category has children
    children = await db.categories.count_documents({"parent_id": ObjectId(id)})
    if children > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with sub-categories. Delete or move them first.")
        
    result = await db.categories.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
        
    return {"message": "Category deleted successfully"}
