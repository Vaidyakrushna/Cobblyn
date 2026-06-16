from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/banners", tags=["banners"])

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


class BannerCreate(BaseModel):
    eyebrow: str = ""
    title: str
    subtitle: str = ""
    price: str = ""
    image: str
    primary_cta: str = ""
    primary_cta_link: str = ""
    secondary_cta: str = ""
    secondary_cta_link: str = ""
    sort_order: int = 0
    active: bool = True
    section: str = "slider"


class BannerUpdate(BaseModel):
    eyebrow: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    price: Optional[str] = None
    image: Optional[str] = None
    primary_cta: Optional[str] = None
    primary_cta_link: Optional[str] = None
    secondary_cta: Optional[str] = None
    secondary_cta_link: Optional[str] = None
    sort_order: Optional[int] = None
    active: Optional[bool] = None
    section: Optional[str] = None


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


# ---- Public ----

@router.get("")
async def list_banners(active_only: bool = False, section: Optional[str] = None):
    query = {"active": True} if active_only else {}
    if section:
        if section == "slider":
            query["$or"] = [
                {"section": "slider"},
                {"section": None},
                {"section": {"$exists": False}}
            ]
        else:
            query["section"] = section
    cursor = db.banners.find(query, {"_id": 1, "eyebrow": 1, "title": 1, "subtitle": 1, "price": 1,
                                     "image": 1, "primary_cta": 1, "primary_cta_link": 1,
                                     "secondary_cta": 1, "secondary_cta_link": 1, "sort_order": 1,
                                     "active": 1, "created_at": 1, "section": 1}).sort("sort_order", 1)
    items = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return {"items": items, "total": len(items)}


# ---- Admin CRUD ----

@router.post("")
async def create_banner(payload: BannerCreate, request: Request):
    await require_admin(request)
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.banners.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/{banner_id}")
async def update_banner(banner_id: str, payload: BannerUpdate, request: Request):
    await require_admin(request)
    try:
        oid = ObjectId(banner_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid banner id")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.banners.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner updated"}


@router.delete("/{banner_id}")
async def delete_banner(banner_id: str, request: Request):
    await require_admin(request)
    try:
        oid = ObjectId(banner_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid banner id")
    result = await db.banners.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted"}
