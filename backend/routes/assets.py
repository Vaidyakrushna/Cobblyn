from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from pathlib import Path
from datetime import datetime, timezone
import os

router = APIRouter(prefix="/api/assets", tags=["assets"])

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

class AssetCreate(BaseModel):
    name: str
    region: str  # leather, sole, vamp, lining, laces, upper, heel
    type: str    # texture, color, material
    image_url: Optional[str] = None
    color_hex: Optional[str] = None
    price_modifier: int = 0
    available: bool = True

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    color_hex: Optional[str] = None
    price_modifier: Optional[int] = None
    available: Optional[bool] = None

@router.get("")
async def list_assets(region: Optional[str] = None, type: Optional[str] = None):
    query = {}
    if region:
        query["region"] = region
    if type:
        query["type"] = type
        
    cursor = db.customizer_assets.find(query).sort("name", 1)
    assets = []
    async for doc in cursor:
        assets.append(serialize(doc))
    return {"assets": assets, "total": len(assets)}

@router.get("/{asset_id}")
async def get_asset(asset_id: str):
    try:
        doc = await db.customizer_assets.find_one({"_id": ObjectId(asset_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
        
    if not doc:
        raise HTTPException(status_code=404, detail="Asset not found")
    return serialize(doc)

@router.post("")
async def create_asset(asset: AssetCreate, request: Request):
    await require_admin(request)
    doc = asset.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.customizer_assets.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@router.put("/{asset_id}")
async def update_asset(asset_id: str, asset: AssetUpdate, request: Request):
    await require_admin(request)
    update_data = {k: v for k, v in asset.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    try:
        result = await db.customizer_assets.update_one({"_id": ObjectId(asset_id)}, {"$set": update_data})
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid asset ID format")
         
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset updated"}

@router.delete("/{asset_id}")
async def delete_asset(asset_id: str, request: Request):
    await require_admin(request)
    try:
        result = await db.customizer_assets.delete_one({"_id": ObjectId(asset_id)})
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid asset ID format")
         
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted"}

@router.get("/cdn/{filename}")
async def serve_cdn_asset(filename: str):
    """
    High-performance CDN-caching proxy for customizable shoe textures & materials.
    Injects immutable public cache policies, speeding up rendering of 3D customization layers.
    """
    uploads_dir = Path(__file__).parent.parent / "uploads"
    file_path = uploads_dir / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Texture asset file not found")
        
    headers = {
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-CDN-Cache": "HIT",
        "X-CDN-Provider": "Cobblyn-Atelier-Edge"
    }
    
    return FileResponse(path=str(file_path), headers=headers)
