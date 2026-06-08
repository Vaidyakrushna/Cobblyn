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
    use_wallet: Optional[bool] = False
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class OrderOperationalUpdate(BaseModel):
    production_type: Optional[str] = None  # ready_to_ship, crafted
    crafted_by: Optional[str] = None      # inhouse, vendor, or None
    fulfillment_vendor: Optional[str] = None
    vendor_upfront_cost: Optional[float] = None
    courier_partner: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[str] = None
    shipping_cost_actual: Optional[float] = None
    package_weight_kg: Optional[float] = None
    transit_history: Optional[List[dict]] = None


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


async def _reserve_raw_materials(items):
    """Automatically reserve/decrement raw materials for custom orders."""
    import re
    for it in items:
        qty = int(it.get("quantity", 1))
        
        # 1. Custom Leather
        mat_name = it.get("material") or it.get("leather_type")
        if mat_name:
            mat_doc = await db.materials.find_one({"name": {"$regex": f"^{re.escape(mat_name)}$", "$options": "i"}})
            if mat_doc:
                await db.raw_materials_inventory.update_one(
                    {"material_id": mat_doc["_id"]},
                    {"$inc": {"stock_level": -1.5 * qty}}
                )
        
        # 2. Sole Type
        sole_name = it.get("sole_type") or it.get("sole")
        if sole_name:
            mat_doc = await db.materials.find_one({"name": {"$regex": f"^{re.escape(sole_name)}$", "$options": "i"}})
            if mat_doc:
                await db.raw_materials_inventory.update_one(
                    {"material_id": mat_doc["_id"]},
                    {"$inc": {"stock_level": -1.0 * qty}}
                )
                
        # 3. Lining
        lining_name = it.get("lining_type") or it.get("lining")
        if lining_name:
            mat_doc = await db.materials.find_one({"name": {"$regex": f"^{re.escape(lining_name)}$", "$options": "i"}})
            if mat_doc:
                await db.raw_materials_inventory.update_one(
                    {"material_id": mat_doc["_id"]},
                    {"$inc": {"stock_level": -0.8 * qty}}
                )


def _evaluate_condition(attributes: dict, cond: dict) -> bool:
    field = cond.get("field")
    operator = cond.get("operator", "equals")
    target_value = cond.get("value", "")
    
    attr_val = str(attributes.get(field, "")).lower()
    t_val = str(target_value).lower()
    
    if operator == "equals":
        return attr_val == t_val
    elif operator == "not_equals":
        return attr_val != t_val
    elif operator == "contains":
        return t_val in attr_val
    elif operator == "in":
        val_list = [v.strip() for v in t_val.split(",") if v.strip()]
        return attr_val in val_list
    return False


async def _apply_pricing_rules(items, database) -> int:
    """Evaluate and apply all active pricing rules on order items mathematically."""
    additional_surcharge = 0
    
    # Pre-fetch and sort rules to minimize DB roundtrips
    rules_cursor = database.pricing_rules.find({"active": True})
    rules = [r async for r in rules_cursor]
    # Sort: priority (ascending) first, and additions first (add_price)
    rules.sort(key=lambda r: (r.get("priority", 0), 0 if r.get("action") == "add_price" else 1))

    for item in items:
        # Support both Pydantic models and standard dictionaries
        item_dict = item.model_dump() if hasattr(item, "model_dump") else (item.dict() if hasattr(item, "dict") else item)
        
        attributes = {
            "material": item_dict.get("material", ""),
            "style": item_dict.get("style", ""),
            "color": item_dict.get("color", ""),
            "sole_type": item_dict.get("sole", ""),
            "sole": item_dict.get("sole", ""),
            "construction": item_dict.get("construction", "")
        }
        item_base = item_dict.get("price", 0)
        item_price = item_base
        
        for rule in rules:
            rule_conditions = rule.get("conditions")
            logical_op = rule.get("logical_operator", "AND").upper()
            
            is_matched = False
            if rule_conditions:
                cond_results = [_evaluate_condition(attributes, c) for c in rule_conditions]
                if logical_op == "OR":
                    is_matched = any(cond_results)
                else:
                    is_matched = all(cond_results)
            else:
                field = rule.get("condition_field")
                value = rule.get("condition_value")
                if field and value:
                    is_matched = attributes.get(field, "").lower() == value.lower()

            if is_matched:
                if rule["action"] == "add_price":
                    item_price += rule["action_value"]
                elif rule["action"] == "multiply_price":
                    adjustment = int(item_price * (rule["action_value"] / 100))
                    item_price += adjustment
        
        additional_surcharge += (item_price - item_base) * item_dict.get("quantity", 1)
        
    return additional_surcharge


async def get_max_wallet_discount(database, items, available_balance: float, total_before_wallet: float) -> float:
    """Calculate the maximum allowed wallet discount based on shoe and accessory configuration rules."""
    config = await database.referral_config.find_one({"_id": "global"})
    if not config:
        max_shoes = 500.0
        max_acc = 100.0
    else:
        max_shoes = float(config.get("max_wallet_shoes_amount", 500.0))
        max_acc = float(config.get("max_wallet_accessories_amount", 100.0))

    shoe_total = 0.0
    acc_total = 0.0

    for item in items:
        prod_id = item.get("product_id")
        price = float(item.get("price", 0.0))
        qty = int(item.get("quantity", 1))
        item_val = price * qty

        is_shoe = False
        is_accessory = False

        if prod_id:
            try:
                # Check products
                p_doc = await database.products.find_one({"_id": ObjectId(prod_id)})
                if p_doc:
                    is_shoe = True
            except Exception:
                pass

            if not is_shoe:
                try:
                    p_doc = await database.products.find_one({"numericId": int(prod_id)})
                    if p_doc:
                        is_shoe = True
                except Exception:
                    pass

            if not is_shoe:
                try:
                    # Check accessories
                    a_doc = await database.accessories.find_one({"_id": ObjectId(prod_id)})
                    if a_doc:
                        is_accessory = True
                except Exception:
                    pass
                if not is_accessory:
                    try:
                        a_doc = await database.accessories.find_one({"sku": prod_id})
                        if a_doc:
                            is_accessory = True
                    except Exception:
                        pass

        # If not matched, default to shoe
        if not is_shoe and not is_accessory:
            is_shoe = True

        if is_shoe:
            shoe_total += item_val
        else:
            acc_total += item_val

    max_shoes_discount = min(shoe_total, max_shoes)
    max_acc_discount = min(acc_total, max_acc)
    max_allowed = max_shoes_discount + max_acc_discount

    # Ensure user cannot use 100% of order value using referral balance (cap at 90%)
    max_percentage_cap = total_before_wallet * 0.90
    return min(available_balance, max_percentage_cap, max_allowed)


@router.post("")
async def create_order(order: OrderCreate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)

    for item in order.items:
        qty = int(item.get("quantity", 1))
        if qty <= 0:
            raise HTTPException(status_code=400, detail="Item quantities must be strictly positive.")
        price = float(item.get("price", 0.0))
        if price < 0:
            raise HTTPException(status_code=400, detail="Item prices cannot be negative.")

    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in order.items)

    # Apply pricing rules (custom designs)
    surcharge = await _apply_pricing_rules(order.items, db)
    subtotal += surcharge

    # Check VIP membership
    vip_discount = 0.0
    user_db = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if user_db:
        vip_info = user_db.get("vip_membership", {})
        if vip_info.get("is_active"):
            try:
                expires_at = datetime.fromisoformat(vip_info["expires_at"].replace("Z", "+00:00"))
                if expires_at > datetime.now(timezone.utc):
                    # VIP is active! Fetch discount percentage
                    vip_config = await db.vip_config.find_one({"_id": "global"})
                    discount_percent = 10.0  # default
                    if vip_config:
                        plans = vip_config.get("plans", [])
                        for p in plans:
                            if p.get("plan_id") == vip_info.get("plan_id"):
                                discount_percent = float(p.get("discount_percent", 10.0))
                                break
                    vip_discount = round(subtotal * (discount_percent / 100.0), 2)
            except Exception:
                pass

    # Apply coupon
    coupon_discount = 0
    coupon_code_applied = None
    subtotal_for_coupon = subtotal - vip_discount
    if order.coupon_code:
        coupon_doc = await db.coupons.find_one({"code": order.coupon_code.strip().upper()})
        if coupon_doc:
            from routes.coupons import _is_valid_now, calculate_discount
            err = _is_valid_now(coupon_doc)
            if not err and subtotal_for_coupon >= (coupon_doc.get("min_purchase") or 0):
                coupon_discount = calculate_discount(coupon_doc, subtotal_for_coupon)
                coupon_code_applied = coupon_doc["code"]

    # Compute tax (Indian GST)
    from tax_utils import compute_tax
    tax_breakdown = compute_tax(order.items, dest_state=order.shipping_address.get("state"))

    # Atomic stock reservation
    await _reserve_stock(order.items)
    await _reserve_raw_materials(order.items)

    # Determine production type based on order items
    is_crafted = False
    for item in order.items:
        sku = item.get("articleCode") or item.get("article_code") or ""
        if sku.startswith("BYD"):
            is_crafted = True
            break
        prod_id = item.get("product_id")
        if prod_id:
            try:
                p_doc = await db.products.find_one({"_id": ObjectId(prod_id)})
                if p_doc:
                    is_crafted = True
                    break
            except Exception:
                pass

    production_type = "crafted" if is_crafted else "ready_to_ship"
    crafted_by = "inhouse" if production_type == "crafted" else None
    fulfillment_vendor = None
    vendor_upfront_cost = 0.0
    
    # Advanced Shipping & Logistics Metadata
    courier_partner = None
    tracking_number = None
    estimated_delivery_date = None
    shipping_cost_actual = 0.0
    package_weight_kg = 0.0
    transit_history = []

    order_number = f"BYD-{secrets.token_hex(3).upper()}"

    import html
    # Sanitize shipping address strings
    safe_address = {}
    if order.shipping_address:
        for k, v in order.shipping_address.items():
            if isinstance(v, str):
                safe_address[k] = html.escape(v.strip())
            else:
                safe_address[k] = v

    notes_sanitized = html.escape(order.notes.strip()) if order.notes else None

    total = max(0.0, round(subtotal - vip_discount - coupon_discount + tax_breakdown.get("total_tax", 0.0), 2))

    wallet_discount = 0.0
    if order.use_wallet:
        if user_db:
            available_balance = user_db.get("wallet_balance", 0.0)
            if available_balance > 0:
                wallet_discount = await get_max_wallet_discount(db, order.items, available_balance, total)
                total = round(total - wallet_discount, 2)

    # Deduct from user's wallet
    if wallet_discount > 0:
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$inc": {"wallet_balance": -wallet_discount}}
        )
        await db.wallet_transactions.insert_one({
            "user_id": ObjectId(user["_id"]),
            "amount": wallet_discount,
            "type": "debit",
            "description": f"Applied to order {order_number}",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    doc = {
        "order_number": order_number,
        "user_id": ObjectId(user["_id"]),
        "customer_name": html.escape(user.get("name", "")),
        "customer_email": user.get("email", ""),
        "items": order.items,
        "shipping_address": safe_address,
        "payment_method": order.payment_method,
        "notes": notes_sanitized,
        "subtotal": round(subtotal, 2),
        "vip_discount": vip_discount,
        "coupon_code": coupon_code_applied,
        "coupon_discount": coupon_discount,
        "wallet_discount": wallet_discount,
        "tax": tax_breakdown,
        "total_amount": total,
        "status": "pending",
        "status_history": [{"status": "pending", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Order placed"}],
        "production_type": production_type,
        "crafted_by": crafted_by,
        "fulfillment_vendor": fulfillment_vendor,
        "vendor_upfront_cost": vendor_upfront_cost,
        "courier_partner": courier_partner,
        "tracking_number": tracking_number,
        "estimated_delivery_date": estimated_delivery_date,
        "shipping_cost_actual": shipping_cost_actual,
        "package_weight_kg": package_weight_kg,
        "transit_history": transit_history,
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
            "subtotal": round(subtotal, 2), "vip_discount": vip_discount, "coupon_discount": coupon_discount,
            "wallet_discount": wallet_discount,
            "tax": tax_breakdown, "total_amount": total, "status": "pending",
            "production_type": production_type, "crafted_by": crafted_by,
            "fulfillment_vendor": fulfillment_vendor, "vendor_upfront_cost": vendor_upfront_cost,
            "courier_partner": courier_partner, "tracking_number": tracking_number,
            "estimated_delivery_date": estimated_delivery_date, "shipping_cost_actual": shipping_cost_actual,
            "package_weight_kg": package_weight_kg, "transit_history": transit_history}


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

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

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

    # Automatically ingest confirmed order into the production pipeline (Order Received stage)
    if update.status == "confirmed":
        from routes.production import auto_create_production_job
        await auto_create_production_job(db, str(order_id))
        
        # Trigger referral reward if this was the referee's first purchase
        from routes.referrals import trigger_referral_reward
        await trigger_referral_reward(db, order["user_id"], order)

    # Refund wallet if order is cancelled
    if update.status == "cancelled" and order.get("wallet_discount", 0.0) > 0:
        wallet_refund = order["wallet_discount"]
        await db.users.update_one(
            {"_id": order["user_id"]},
            {"$inc": {"wallet_balance": wallet_refund}}
        )
        await db.wallet_transactions.insert_one({
            "user_id": order["user_id"],
            "amount": wallet_refund,
            "type": "credit",
            "description": f"Refund for cancelled order {order.get('order_number')}",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    return {"message": f"Order status updated to {update.status}"}


@router.put("/{order_id}/operational")
async def update_order_operational(order_id: str, update: OrderOperationalUpdate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    # Verify order exists
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_fields = {}
    if update.production_type is not None:
        if update.production_type not in ("ready_to_ship", "crafted"):
            raise HTTPException(status_code=400, detail="production_type must be 'ready_to_ship' or 'crafted'")
        update_fields["production_type"] = update.production_type
        
        # Automatically reset crafted fields if transitioning to ready_to_ship
        if update.production_type == "ready_to_ship":
            update_fields["crafted_by"] = None
            update_fields["fulfillment_vendor"] = None
            update_fields["vendor_upfront_cost"] = 0.0

    if update.crafted_by is not None:
        if update.crafted_by not in ("inhouse", "vendor", None):
            raise HTTPException(status_code=400, detail="crafted_by must be 'inhouse', 'vendor', or None")
        update_fields["crafted_by"] = update.crafted_by

    if update.fulfillment_vendor is not None:
        update_fields["fulfillment_vendor"] = update.fulfillment_vendor

    if update.vendor_upfront_cost is not None:
        update_fields["vendor_upfront_cost"] = round(update.vendor_upfront_cost, 2)

    # Advanced Shipping & Logistics updates
    if update.courier_partner is not None:
        update_fields["courier_partner"] = update.courier_partner

    if update.tracking_number is not None:
        update_fields["tracking_number"] = update.tracking_number

    if update.estimated_delivery_date is not None:
        update_fields["estimated_delivery_date"] = update.estimated_delivery_date

    if update.shipping_cost_actual is not None:
        update_fields["shipping_cost_actual"] = round(update.shipping_cost_actual, 2)

    if update.package_weight_kg is not None:
        update_fields["package_weight_kg"] = round(update.package_weight_kg, 2)

    if update.transit_history is not None:
        update_fields["transit_history"] = update.transit_history

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_fields}
    )
    
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="update_order_operational",
        target=order_id,
        details={"updated_fields": update_fields}
    )
    return {"message": "Order operational details updated successfully", "updated_fields": update_fields}


# =====================================================================
# ORDER MODIFICATIONS & SUPPORT CHANGE PROPOSAL PIPELINE
# =====================================================================

async def _release_stock(items):
    """Release size-stock for each item (increment stock)."""
    for it in items:
        sku = it.get("articleCode") or it.get("article_code")
        size = it.get("size")
        qty = int(it.get("quantity", 1))
        if not sku or not size:
            continue
        await db.inventory.update_one(
            {"articleCode": sku, "size": size},
            {"$inc": {"stock_qty": qty}}
        )


async def _release_raw_materials(items):
    """Automatically release/increment raw materials for custom orders."""
    import re
    for it in items:
        qty = int(it.get("quantity", 1))
        
        # 1. Custom Leather
        mat_name = it.get("material") or it.get("leather_type")
        if mat_name:
            mat_doc = await db.materials.find_one({"name": {"$regex": f"^{re.escape(mat_name)}$", "$options": "i"}})
            if mat_doc:
                await db.raw_materials_inventory.update_one(
                    {"material_id": mat_doc["_id"]},
                    {"$inc": {"stock_level": 1.5 * qty}}
                )
        
        # 2. Sole Type
        sole_name = it.get("sole_type") or it.get("sole")
        if sole_name:
            mat_doc = await db.materials.find_one({"name": {"$regex": f"^{re.escape(sole_name)}$", "$options": "i"}})
            if mat_doc:
                await db.raw_materials_inventory.update_one(
                    {"material_id": mat_doc["_id"]},
                    {"$inc": {"stock_level": 1.0 * qty}}
                )
                
        # 3. Lining
        lining_name = it.get("lining_type") or it.get("lining")
        if lining_name:
            mat_doc = await db.materials.find_one({"name": {"$regex": f"^{re.escape(lining_name)}$", "$options": "i"}})
            if mat_doc:
                await db.raw_materials_inventory.update_one(
                    {"material_id": mat_doc["_id"]},
                    {"$inc": {"stock_level": 0.8 * qty}}
                )


class OrderDirectModify(BaseModel):
    items: List[dict]
    shipping_address: dict
    notes: Optional[str] = None


class OrderModificationProposal(BaseModel):
    items: List[dict]
    shipping_address: dict
    notes: Optional[str] = None
    ticket_id: Optional[str] = None


@router.put("/{order_id}/direct-modify")
async def direct_modify_order(order_id: str, modification: OrderDirectModify, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("status") not in ("pending", "confirmed"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot modify order in status: {order.get('status')}. Only 'pending' and 'confirmed' orders can be modified."
        )

    # Release old inventory & materials
    old_items = order.get("items", [])
    await _release_stock(old_items)
    await _release_raw_materials(old_items)

    try:
        # Reserve new inventory & materials
        new_items = modification.items
        await _reserve_stock(new_items)
        await _reserve_raw_materials(new_items)
    except HTTPException as e:
        # Rollback: reserve old items again
        await _reserve_stock(old_items)
        await _reserve_raw_materials(old_items)
        raise e

    # Recalculate billing details
    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in new_items)

    # Apply pricing rules
    surcharge = await _apply_pricing_rules(new_items, db)
    subtotal += surcharge

    coupon_discount = 0
    coupon_code_applied = order.get("coupon_code")
    if coupon_code_applied:
        coupon_doc = await db.coupons.find_one({"code": coupon_code_applied.strip().upper()})
        if coupon_doc:
            from routes.coupons import calculate_discount
            coupon_discount = calculate_discount(coupon_doc, subtotal)

    # Sanitize shipping address
    import html
    safe_address = {}
    if modification.shipping_address:
        for k, v in modification.shipping_address.items():
            if isinstance(v, str):
                safe_address[k] = html.escape(v.strip())
            else:
                safe_address[k] = v

    from tax_utils import compute_tax
    tax_breakdown = compute_tax(new_items, dest_state=safe_address.get("state"))
    total = max(0.0, round(subtotal - coupon_discount + tax_breakdown.get("total_tax", 0.0), 2))

    notes_sanitized = html.escape(modification.notes.strip()) if modification.notes else None

    # Update database
    update_fields = {
        "items": new_items,
        "shipping_address": safe_address,
        "notes": notes_sanitized,
        "subtotal": round(subtotal, 2),
        "coupon_discount": coupon_discount,
        "tax": tax_breakdown,
        "total_amount": total,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    history_entry = {
        "status": order.get("status"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": "Order details directly modified by Admin",
        "updated_by": user.get("name", "Admin")
    }

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_fields, "$push": {"status_history": history_entry}}
    )

    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="direct_modify_order",
        target=order_id,
        details={"previous_items": old_items, "new_items": new_items, "total_amount": total}
    )

    return {"message": "Order directly modified successfully", "order_id": order_id, "total_amount": total}


@router.post("/{order_id}/propose-modification")
async def propose_order_modification(order_id: str, proposal: OrderModificationProposal, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    # Accessible to staff and admins
    if user.get("role") not in ("staff", "admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Staff and Admins only")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("status") not in ("pending", "confirmed"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot propose modification in status: {order.get('status')}. Only 'pending' and 'confirmed' orders can have proposals."
        )

    import html
    safe_address = {}
    if proposal.shipping_address:
        for k, v in proposal.shipping_address.items():
            if isinstance(v, str):
                safe_address[k] = html.escape(v.strip())
            else:
                safe_address[k] = v

    notes_sanitized = html.escape(proposal.notes.strip()) if proposal.notes else None

    # Save pending proposal in DB
    pending_mod = {
        "proposed_by": user.get("name", "Support Agent"),
        "proposed_email": user.get("email"),
        "items": proposal.items,
        "shipping_address": safe_address,
        "notes": notes_sanitized,
        "ticket_id": proposal.ticket_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"pending_modification": pending_mod, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="propose_order_modification",
        target=order_id,
        details={"proposed_by": user.get("name")}
    )

    return {"message": "Order modification proposed successfully", "order_id": order_id}


@router.post("/{order_id}/approve-modification")
async def approve_order_modification(order_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("status") not in ("pending", "confirmed"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve modification in status: {order.get('status')}. Only 'pending' and 'confirmed' orders can have proposals approved."
        )

    pending_mod = order.get("pending_modification")
    if not pending_mod:
        raise HTTPException(status_code=404, detail="No pending modification found for this order")

    # Release old inventory & materials
    old_items = order.get("items", [])
    await _release_stock(old_items)
    await _release_raw_materials(old_items)

    try:
        # Reserve new inventory & materials from proposal
        proposed_items = pending_mod.get("items", [])
        await _reserve_stock(proposed_items)
        await _reserve_raw_materials(proposed_items)
    except HTTPException as e:
        # Rollback: reserve old items again
        await _reserve_stock(old_items)
        await _reserve_raw_materials(old_items)
        raise e

    # Recalculate billing details
    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in proposed_items)

    # Apply pricing rules
    surcharge = await _apply_pricing_rules(proposed_items, db)
    subtotal += surcharge

    coupon_discount = 0
    coupon_code_applied = order.get("coupon_code")
    if coupon_code_applied:
        coupon_doc = await db.coupons.find_one({"code": coupon_code_applied.strip().upper()})
        if coupon_doc:
            from routes.coupons import calculate_discount
            coupon_discount = calculate_discount(coupon_doc, subtotal)

    from tax_utils import compute_tax
    proposed_address = pending_mod.get("shipping_address", {})
    tax_breakdown = compute_tax(proposed_items, dest_state=proposed_address.get("state"))
    total = max(0.0, round(subtotal - coupon_discount + tax_breakdown.get("total_tax", 0.0), 2))

    original_total = order.get("total_amount", 0.0)
    price_increased = total > original_total
    new_status = "waiting_for_payment" if price_increased else "confirmed"
    outstanding_amount = round(total - original_total, 2) if price_increased else 0.0

    # Update database
    update_fields = {
        "items": proposed_items,
        "shipping_address": proposed_address,
        "notes": pending_mod.get("notes"),
        "subtotal": round(subtotal, 2),
        "coupon_discount": coupon_discount,
        "tax": tax_breakdown,
        "total_amount": total,
        "status": new_status,
        "outstanding_amount": outstanding_amount,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    history_entry = {
        "status": new_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": f"Proposed order modification approved and applied by Admin (Proposed by {pending_mod.get('proposed_by')}). Status transitioned to {new_status}.",
        "updated_by": user.get("name", "Admin")
    }

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_fields, "$unset": {"pending_modification": ""}, "$push": {"status_history": history_entry}}
    )

    # Automatically ingest confirmed order into the production pipeline (Order Received stage)
    if new_status == "confirmed":
        from routes.production import auto_create_production_job
        await auto_create_production_job(db, str(order_id))
        
        from routes.referrals import trigger_referral_reward
        await trigger_referral_reward(db, order["user_id"], order)

    # Auto-update support ticket if associated
    ticket_id = pending_mod.get("ticket_id")
    if ticket_id:
        msg_text = f"✅ Admin has approved and applied the proposed order modifications for Order #{order.get('order_number')}. Total amount recalculated to ₹{total:,.2f}."
        if price_increased:
            msg_text += f"\n\n💵 Price has increased by ₹{outstanding_amount:,.2f}. The order status is now 'Waiting for Payment'. Please complete the extra payment to resume production."
        else:
            msg_text += "\n\n🎉 No extra payment is required. The order has been updated in confirmed status."
            
        await db.support_tickets.update_one(
            {"_id": ObjectId(ticket_id)},
            {
                "$push": {
                    "messages": {
                        "sender": "admin",
                        "admin_name": "System / CRM",
                        "message": msg_text,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                },
                "$set": {
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )

    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="approve_order_modification",
        target=order_id,
        details={"approved_by": user.get("name"), "total_amount": total}
    )

    return {"message": "Order modification approved and applied successfully", "order_id": order_id, "total_amount": total}


@router.post("/{order_id}/reject-modification")
async def reject_order_modification(order_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    pending_mod = order.get("pending_modification")
    if not pending_mod:
        raise HTTPException(status_code=404, detail="No pending modification found for this order")

    history_entry = {
        "status": order.get("status"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": f"Proposed order modification rejected and dismissed by Admin (Proposed by {pending_mod.get('proposed_by')})",
        "updated_by": user.get("name", "Admin")
    }

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$unset": {"pending_modification": ""}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}, "$push": {"status_history": history_entry}}
    )

    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="reject_order_modification",
        target=order_id,
        details={"rejected_by": user.get("name")}
    )

    return {"message": "Order modification proposal rejected successfully", "order_id": order_id}


class PriceCalculationRequest(BaseModel):
    items: List[dict]
    shipping_address: Optional[dict] = None
    coupon_code: Optional[str] = None
    use_wallet: Optional[bool] = False


@router.post("/{order_id}/calculate-price")
async def calculate_order_price(order_id: str, payload: PriceCalculationRequest, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in payload.items)

    # Apply pricing rules
    surcharge = await _apply_pricing_rules(payload.items, db)
    subtotal += surcharge

    # Check VIP membership
    vip_discount = 0.0
    user_db = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if user_db:
        vip_info = user_db.get("vip_membership", {})
        if vip_info.get("is_active"):
            try:
                expires_at = datetime.fromisoformat(vip_info["expires_at"].replace("Z", "+00:00"))
                if expires_at > datetime.now(timezone.utc):
                    vip_config = await db.vip_config.find_one({"_id": "global"})
                    discount_percent = 10.0  # default
                    if vip_config:
                        plans = vip_config.get("plans", [])
                        for p in plans:
                            if p.get("plan_id") == vip_info.get("plan_id"):
                                discount_percent = float(p.get("discount_percent", 10.0))
                                break
                    vip_discount = round(subtotal * (discount_percent / 100.0), 2)
            except Exception:
                pass

    coupon_discount = 0
    coupon_code_applied = payload.coupon_code or order.get("coupon_code")
    subtotal_for_coupon = subtotal - vip_discount
    if coupon_code_applied:
        coupon_doc = await db.coupons.find_one({"code": coupon_code_applied.strip().upper()})
        if coupon_doc:
            from routes.coupons import calculate_discount
            coupon_discount = calculate_discount(coupon_doc, subtotal_for_coupon)

    from tax_utils import compute_tax
    state = payload.shipping_address.get("state") if payload.shipping_address else order.get("shipping_address", {}).get("state")
    tax_breakdown = compute_tax(payload.items, dest_state=state)

    total = max(0.0, round(subtotal - vip_discount - coupon_discount + tax_breakdown.get("total_tax", 0.0), 2))

    wallet_discount = 0.0
    if payload.use_wallet:
        if user_db:
            available_balance = user_db.get("wallet_balance", 0.0)
            if available_balance > 0:
                wallet_discount = await get_max_wallet_discount(db, payload.items, available_balance, total)
                total = max(0.0, round(total - wallet_discount, 2))

    return {
        "subtotal": round(subtotal, 2),
        "vip_discount": vip_discount,
        "coupon_discount": coupon_discount,
        "wallet_discount": wallet_discount,
        "tax_total": tax_breakdown.get("total_tax", 0.0),
        "total_amount": total
    }


class CustomerPaymentRequest(BaseModel):
    payment_method: str


@router.post("/{order_id}/pay-outstanding")
async def customer_pay_outstanding(order_id: str, payload: CustomerPaymentRequest, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Ensure this belongs to the logged-in customer
    if str(order.get("user_id")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Unauthorized access to this order")

    outstanding = order.get("outstanding_amount", 0.0)
    if outstanding <= 0:
        return {"message": "No outstanding balance for this order.", "status": order.get("status")}

    history_entry = {
        "status": "confirmed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": f"Outstanding payment of ₹{outstanding:,.2f} settled by customer via {payload.payment_method.upper()}.",
        "updated_by": user.get("name", "Customer")
    }

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "outstanding_amount": 0.0,
                "status": "confirmed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "status_history": history_entry
            }
        }
    )

    from routes.production import auto_create_production_job
    await auto_create_production_job(db, str(order_id))

    from routes.referrals import trigger_referral_reward
    await trigger_referral_reward(db, order["user_id"], order)

    return {"message": "Payment recorded successfully", "status": "confirmed"}


class PaymentRecordRequest(BaseModel):
    amount_paid: float
    payment_method: str
    ticket_id: Optional[str] = None


@router.post("/{order_id}/record-payment")
async def record_order_payment(order_id: str, payload: PaymentRecordRequest, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    # Gated to staff or admin roles
    if user.get("role") not in ("staff", "admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Staff and Admins only")

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    outstanding = order.get("outstanding_amount", 0.0)
    
    # Update outstanding amount and reset status to confirmed
    history_entry = {
        "status": "confirmed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": f"Extra payment of ₹{payload.amount_paid:,.2f} recorded by {user.get('name')} via {payload.payment_method.upper()}.",
        "updated_by": user.get("name", "Support Staff")
    }

    new_outstanding = max(0.0, round(outstanding - payload.amount_paid, 2))
    
    update_data = {
        "outstanding_amount": new_outstanding,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if new_outstanding == 0.0:
        update_data["status"] = "confirmed"

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_data, "$push": {"status_history": history_entry}}
    )

    # Automatically ingest confirmed order into the production pipeline (Order Received stage)
    if new_outstanding == 0.0:
        from routes.production import auto_create_production_job
        await auto_create_production_job(db, str(order_id))

        from routes.referrals import trigger_referral_reward
        await trigger_referral_reward(db, order["user_id"], order)

    # Post chat confirmation if ticket_id is supplied
    if payload.ticket_id:
        await db.support_tickets.update_one(
            {"_id": ObjectId(payload.ticket_id)},
            {
                "$push": {
                    "messages": {
                        "sender": "admin",
                        "admin_name": "System / CRM",
                        "message": f"💵 Extra payment of ₹{payload.amount_paid:,.2f} received and recorded successfully via {payload.payment_method.upper()}! Outstanding balance cleared. Order is now fully Confirmed.",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                },
                "$set": {
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )

    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="record_order_extra_payment",
        target=order_id,
        details={"amount_paid": payload.amount_paid, "payment_method": payload.payment_method, "remaining_outstanding": new_outstanding}
    )

    return {"message": "Payment recorded successfully", "outstanding_amount": new_outstanding, "status": "confirmed" if new_outstanding == 0.0 else order.get("status")}


# ===== Customer Order Feedback =====
class FeedbackPayload(BaseModel):
    rating: int
    comment: Optional[str] = None


@router.post("/{order_id}/feedback")
async def submit_order_feedback(order_id: str, payload: FeedbackPayload, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)

    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if str(order.get("user_id")) != user["_id"] and user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to submit feedback for this order")

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    feedback = {
        "rating": payload.rating,
        "comment": payload.comment,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"customer_feedback": feedback, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Sync with production job if vendor-fulfilled
    job = await db.production_jobs.find_one({"order_id": ObjectId(order_id)})
    if job and job.get("crafted_by") == "vendor" and job.get("fulfillment_vendor"):
        vendor_name = job.get("fulfillment_vendor")
        await db.production_jobs.update_one(
            {"_id": job["_id"]},
            {"$set": {"customer_feedback": feedback}}
        )
        vendor = await db.vendors.find_one({"name": vendor_name})
        if vendor:
            jobs_cursor = db.production_jobs.find({
                "fulfillment_vendor": vendor_name,
                "crafted_by": "vendor",
                "customer_feedback.rating": {"$exists": True}
            })
            jobs_list = [j async for j in jobs_cursor]
            if jobs_list:
                ratings = [j["customer_feedback"]["rating"] for j in jobs_list]
                new_score = round(sum(ratings) / len(ratings), 2)
            else:
                new_score = float(payload.rating)
            await db.vendors.update_one(
                {"_id": vendor["_id"]},
                {"$set": {"satisfaction_score": new_score}}
            )

    return {"message": "Order feedback submitted successfully", "feedback": feedback}



