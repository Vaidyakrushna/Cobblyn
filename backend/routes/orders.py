from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
import secrets

router = APIRouter(prefix="/api/orders", tags=["orders"])

db = None


def set_db(database):
    global db
    db = database


def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("user_id"), ObjectId):
        doc["user_id"] = str(doc["user_id"])
    return doc


ORDER_STATUSES = ["pending", "confirmed", "in_production", "quality_check", "shipped", "delivered", "cancelled", "returned"]


class OrderCreate(BaseModel):
    items: list  # [{product_id, name, size, color, quantity, price}]
    shipping_address: dict  # {name, phone, address, city, state, pincode}
    payment_method: str  # cod, online
    coupon_code: Optional[str] = None
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


async def _reserve_stock(items):
    """Atomically decrement size-stock for each item. Raises 400 if any size out of stock."""
    reserved = []  # for rollback
    for it in items:
        sku = it.get("articleCode") or it.get("article_code")
        size = it.get("size")
        qty = int(it.get("quantity", 1))
        if not sku or not size:
            continue  # skip unknown SKUs (custom designs etc.)
        # Atomic conditional update: only decrement if enough stock
        res = await db.inventory.find_one_and_update(
            {"articleCode": sku, "size": size, "stock_qty": {"$gte": qty}},
            {"$inc": {"stock_qty": -qty}}
        )
        if not res:
            # Rollback any reserved
            for r_sku, r_size, r_qty in reserved:
                await db.inventory.update_one({"articleCode": r_sku, "size": r_size}, {"$inc": {"stock_qty": r_qty}})
            from fastapi import HTTPException as _HE
            raise _HE(400, f"Out of stock: {it.get('name', sku)} (Size {size})")
        reserved.append((sku, size, qty))


@router.post("")
async def create_order(order: OrderCreate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)

    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in order.items)

    # Apply pricing rules (custom designs)
    for item in order.items:
        attributes = {
            "material": item.get("material", ""),
            "style": item.get("style", ""),
            "color": item.get("color", "")
        }
        rules_cursor = db.pricing_rules.find({"active": True})
        async for rule in rules_cursor:
            field = rule["condition_field"]
            value = rule["condition_value"]
            if attributes.get(field, "").lower() == value.lower():
                if rule["action"] == "add_price":
                    subtotal += rule["action_value"] * item.get("quantity", 1)

    # Apply coupon
    coupon_discount = 0
    coupon_code_applied = None
    if order.coupon_code:
        coupon_doc = await db.coupons.find_one({"code": order.coupon_code.strip().upper()})
        if coupon_doc:
            from routes.coupons import _is_valid_now, calculate_discount
            err = _is_valid_now(coupon_doc)
            if not err and subtotal >= (coupon_doc.get("min_purchase") or 0):
                coupon_discount = calculate_discount(coupon_doc, subtotal)
                coupon_code_applied = coupon_doc["code"]

    # Compute tax (Indian GST)
    from tax_utils import compute_tax
    tax_breakdown = compute_tax(order.items, dest_state=order.shipping_address.get("state"))

    total = round(subtotal - coupon_discount + tax_breakdown["total_tax"], 2)

    # Atomic stock reservation
    await _reserve_stock(order.items)

    order_number = f"BYD-{secrets.token_hex(3).upper()}"

    doc = {
        "order_number": order_number,
        "user_id": ObjectId(user["_id"]),
        "customer_name": user.get("name", ""),
        "customer_email": user.get("email", ""),
        "items": order.items,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "notes": order.notes,
        "subtotal": round(subtotal, 2),
        "coupon_code": coupon_code_applied,
        "coupon_discount": coupon_discount,
        "tax": tax_breakdown,
        "total_amount": total,
        "status": "pending",
        "status_history": [{"status": "pending", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Order placed"}],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    result = await db.orders.insert_one(doc)

    # Increment coupon usage
    if coupon_code_applied:
        await db.coupons.update_one({"code": coupon_code_applied}, {"$inc": {"used_count": 1}})

    # Clear cart after order
    await db.carts.update_one({"user_id": ObjectId(user["_id"])}, {"$set": {"items": []}})
    await db.cart_items.delete_many({"user_id": str(user["_id"])})

    return {"id": str(result.inserted_id), "order_number": order_number,
            "subtotal": round(subtotal, 2), "coupon_discount": coupon_discount,
            "tax": tax_breakdown, "total_amount": total, "status": "pending"}


@router.get("")
async def list_orders(request: Request, status: Optional[str] = None, limit: int = 50, skip: int = 0):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)

    query = {}
    if user.get("role") not in ("admin", "super_admin"):
        query["user_id"] = ObjectId(user["_id"])
    if status:
        query["status"] = status

    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = []
    async for doc in cursor:
        orders.append(serialize(doc))

    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}


@router.get("/{order_id}")
async def get_order(order_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)

    doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    if user.get("role") not in ("admin", "super_admin") and str(doc.get("user_id")) != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return serialize(doc)


@router.put("/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    if update.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {ORDER_STATUSES}")

    history_entry = {
        "status": update.status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": update.note or f"Status changed to {update.status}",
        "updated_by": user.get("name", "Admin")
    }

    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"status_history": history_entry}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": f"Order status updated to {update.status}"}
