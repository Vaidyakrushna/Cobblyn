from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/coupons", tags=["coupons"])

db = None


def set_db(database):
    global db
    db = database


async def _admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin only")
    return user


class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=24)
    type: str  # "percentage" | "fixed"
    value: float = Field(..., gt=0)
    min_purchase: float = 0
    max_discount: Optional[float] = None  # cap for percentage type
    usage_limit: Optional[int] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    description: Optional[str] = ""
    active: bool = True


class CouponUpdate(BaseModel):
    type: Optional[str] = None
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


def _ser(d):
    d["id"] = str(d.pop("_id"))
    return d


def _is_valid_now(coupon: dict) -> Optional[str]:
    """Returns None if valid, else error reason."""
    if not coupon.get("active", True):
        return "Coupon is not active"
    now = datetime.now(timezone.utc).isoformat()
    if coupon.get("valid_from") and now < coupon["valid_from"]:
        return "Coupon not yet active"
    if coupon.get("valid_until") and now > coupon["valid_until"]:
        return "Coupon has expired"
    if coupon.get("usage_limit") is not None and coupon.get("used_count", 0) >= coupon["usage_limit"]:
        return "Coupon usage limit reached"
    return None


def calculate_discount(coupon: dict, subtotal: float) -> float:
    if coupon["type"] == "percentage":
        d = subtotal * (coupon["value"] / 100.0)
        cap = coupon.get("max_discount")
        if cap is not None:
            d = min(d, cap)
        return round(d, 2)
    return round(min(coupon["value"], subtotal), 2)


# ---- Public ----

class ValidateBody(BaseModel):
    code: str
    subtotal: float


@router.post("/validate")
async def validate_coupon(payload: ValidateBody):
    code = payload.code.strip().upper()
    coupon = await db.coupons.find_one({"code": code})
    if not coupon:
        raise HTTPException(404, "Invalid coupon code")
    err = _is_valid_now(coupon)
    if err:
        raise HTTPException(400, err)
    if payload.subtotal < (coupon.get("min_purchase") or 0):
        raise HTTPException(400, f"Minimum purchase \u20b9{coupon['min_purchase']:.0f} required")
    discount = calculate_discount(coupon, payload.subtotal)
    return {
        "code": code,
        "type": coupon["type"],
        "value": coupon["value"],
        "discount": discount,
        "description": coupon.get("description", ""),
    }


# ---- Admin CRUD ----

@router.get("")
async def list_coupons(request: Request):
    await _admin(request)
    cursor = db.coupons.find({}).sort("created_at", -1)
    return {"items": [_ser(d) async for d in cursor]}


@router.post("")
async def create_coupon(payload: CouponCreate, request: Request):
    await _admin(request)
    if payload.type not in ("percentage", "fixed"):
        raise HTTPException(400, "Type must be 'percentage' or 'fixed'")
    if payload.type == "percentage" and payload.value > 100:
        raise HTTPException(400, "Percentage cannot exceed 100")
    code = payload.code.strip().upper()
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(400, "Coupon code already exists")
    doc = payload.model_dump()
    doc["code"] = code
    doc["used_count"] = 0
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.coupons.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/{coupon_id}")
async def update_coupon(coupon_id: str, payload: CouponUpdate, request: Request):
    await _admin(request)
    try:
        oid = ObjectId(coupon_id)
    except Exception:
        raise HTTPException(400, "Invalid coupon id")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.coupons.update_one({"_id": oid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Coupon not found")
    return {"message": "Coupon updated"}


@router.delete("/{coupon_id}")
async def delete_coupon(coupon_id: str, request: Request):
    await _admin(request)
    try:
        oid = ObjectId(coupon_id)
    except Exception:
        raise HTTPException(400, "Invalid coupon id")
    res = await db.coupons.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Coupon not found")
    return {"message": "Coupon deleted"}


async def consume_coupon(code: str):
    """Increment used_count after a successful order. Called from orders.py."""
    await db.coupons.update_one({"code": code.upper()}, {"$inc": {"used_count": 1}})
