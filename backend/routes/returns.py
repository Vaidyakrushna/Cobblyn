from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/returns", tags=["returns"])

db = None


def set_db(database):
    global db
    db = database


async def _user(request: Request):
    from auth_utils import get_current_user
    return await get_current_user(request, db)


async def _admin(request: Request):
    user = await _user(request)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin only")
    return user


class ReturnCreate(BaseModel):
    order_id: str
    product_id: str
    size: Optional[str] = None
    type: str  # "return" | "exchange"
    reason: str = Field(..., min_length=4, max_length=500)
    exchange_size: Optional[str] = None  # required if type == exchange


class ReturnStatusUpdate(BaseModel):
    status: str  # "pending" | "approved" | "rejected" | "completed"
    admin_notes: Optional[str] = None
    refund_amount: Optional[float] = None


def _ser(d):
    d["id"] = str(d.pop("_id"))
    return d


@router.post("")
async def create_return(payload: ReturnCreate, request: Request):
    user = await _user(request)
    user_id = user.get("id") or str(user.get("_id"))
    if payload.type not in ("return", "exchange"):
        raise HTTPException(400, "Type must be 'return' or 'exchange'")
    if payload.type == "exchange" and not payload.exchange_size:
        raise HTTPException(400, "exchange_size is required for exchange requests")
    # Verify order belongs to user and contains the product
    try:
        oid = ObjectId(payload.order_id)
    except Exception:
        raise HTTPException(400, "Invalid order id")
    order = await db.orders.find_one({"_id": oid, "user_id": user_id})
    if not order:
        raise HTTPException(404, "Order not found")
    if order.get("status") not in ("delivered", "shipped"):
        raise HTTPException(400, "Order must be shipped or delivered to request a return/exchange")
    has_item = any(it.get("product_id") == payload.product_id for it in order.get("items", []))
    if not has_item:
        raise HTTPException(400, "Product not found in this order")

    import html
    doc = payload.model_dump()
    doc["reason"] = html.escape(doc.get("reason", "").strip())
    doc["user_id"] = user_id
    doc["user_name"] = html.escape(user.get("name", "Customer"))
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.returns.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("")
async def list_returns(request: Request, status: Optional[str] = None, limit: int = 100):
    user = await _user(request)
    is_admin = user.get("role") in ("admin", "super_admin")
    query = {}
    if not is_admin:
        query["user_id"] = user.get("id") or str(user.get("_id"))
    if status:
        query["status"] = status
    cursor = db.returns.find(query).sort("created_at", -1).limit(limit)
    return {"items": [_ser(d) async for d in cursor]}


@router.patch("/{return_id}/status")
async def update_return_status(return_id: str, payload: ReturnStatusUpdate, request: Request):
    await _admin(request)
    if payload.status not in ("pending", "approved", "rejected", "completed"):
        raise HTTPException(400, "Invalid status")
    try:
        oid = ObjectId(return_id)
    except Exception:
        raise HTTPException(400, "Invalid return id")
    update = {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if payload.admin_notes is not None:
        import html
        update["admin_notes"] = html.escape(payload.admin_notes.strip())
    if payload.refund_amount is not None:
        update["refund_amount"] = payload.refund_amount
    res = await db.returns.update_one({"_id": oid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Return not found")
    return {"message": "Return updated", "status": payload.status}
