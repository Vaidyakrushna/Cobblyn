from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/cart", tags=["cart"])

db = None


def set_db(database):
    global db
    db = database


class CartItemAdd(BaseModel):
    product_id: str
    size: str
    color: str
    quantity: int = Field(1, gt=0)
    is_customized: bool = False
    custom_attributes: Optional[dict] = None


class CartItemUpdate(BaseModel):
    quantity: int
    is_customized: bool = False
    custom_attributes: Optional[dict] = None


def serialize_cart(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"]) if isinstance(doc.get("user_id"), ObjectId) else doc.get("user_id", "")
    return doc


@router.get("")
async def get_cart(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    cart = await db.carts.find_one({"user_id": user_id}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}

    # Populate product details for each item
    populated_items = []
    total = 0
    for item in cart.get("items", []):
        product = None
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            pass
        
        if not product:
            try:
                product = await db.products.find_one({"numericId": int(item["product_id"])})
            except Exception:
                pass
                
        if product:
            base_price = product["price"]
            final_price = base_price
            applied_rules = []
            
            if item.get("is_customized") and item.get("custom_attributes"):
                # Dynamically calculate price based on pricing rules
                rules = []
                async for doc in db.pricing_rules.find({"active": True}):
                    rules.append(doc)
                rules.sort(key=lambda r: (r.get("priority", 0), 0 if r.get("action") == "add_price" else 1))
                
                attributes = item["custom_attributes"]
                for rule in rules:
                    rule_conditions = rule.get("conditions")
                    logical_op = rule.get("logical_operator", "AND").upper()
                    is_matched = False
                    
                    if rule_conditions:
                        from routes.rules import _evaluate_condition
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
                            final_price += rule["action_value"]
                            applied_rules.append({"rule": rule["name"], "adjustment": f"+{rule['action_value']}"})
                        elif rule["action"] == "multiply_price":
                            adjustment = int(final_price * (rule["action_value"] / 100))
                            final_price += adjustment
                            applied_rules.append({"rule": rule["name"], "adjustment": f"+{rule['action_value']}%"})

            item_total = final_price * item["quantity"]
            total += item_total
            populated_items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "price": final_price,
                "base_price": base_price,
                "image": product["images"][0] if product.get("images") else "",
                "material": product.get("material", ""),
                "size": item["size"],
                "color": item["color"],
                "quantity": item["quantity"],
                "is_customized": item.get("is_customized", False),
                "custom_attributes": item.get("custom_attributes"),
                "applied_rules": applied_rules,
                "item_total": item_total
            })

    return {"items": populated_items, "total": total}


@router.post("/add")
async def add_to_cart(item: CartItemAdd, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        await db.carts.insert_one({
            "user_id": user_id,
            "items": [{
                "product_id": item.product_id,
                "size": item.size,
                "color": item.color,
                "quantity": item.quantity,
                "is_customized": item.is_customized,
                "custom_attributes": item.custom_attributes
            }]
        })
        return {"message": "Item added to cart"}

    # Check if item already exists (same product + size + color + custom_attributes)
    existing_idx = None
    for idx, ci in enumerate(cart.get("items", [])):
        if (ci["product_id"] == item.product_id and 
            ci["size"] == item.size and 
            ci["color"] == item.color and
            ci.get("is_customized", False) == item.is_customized and
            ci.get("custom_attributes") == item.custom_attributes):
            existing_idx = idx
            break

    if existing_idx is not None:
        await db.carts.update_one(
            {"user_id": user_id},
            {"$inc": {f"items.{existing_idx}.quantity": item.quantity}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user_id},
            {"$push": {"items": {
                "product_id": item.product_id,
                "size": item.size,
                "color": item.color,
                "quantity": item.quantity,
                "is_customized": item.is_customized,
                "custom_attributes": item.custom_attributes
            }}}
        )
    return {"message": "Item added to cart"}


@router.put("/update")
async def update_cart_item(item: CartItemAdd, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    for idx, ci in enumerate(cart.get("items", [])):
        if (ci["product_id"] == item.product_id and 
            ci["size"] == item.size and 
            ci["color"] == item.color and
            ci.get("is_customized", False) == item.is_customized and
            ci.get("custom_attributes") == item.custom_attributes):
            if item.quantity <= 0:
                # Update item by pulling at this exact state
                await db.carts.update_one(
                    {"user_id": user_id},
                    {"$pull": {"items": {
                        "product_id": item.product_id, 
                        "size": item.size, 
                        "color": item.color,
                        "is_customized": item.is_customized,
                        "custom_attributes": item.custom_attributes
                    }}}
                )
            else:
                await db.carts.update_one(
                    {"user_id": user_id},
                    {"$set": {f"items.{idx}.quantity": item.quantity}}
                )
            return {"message": "Cart updated"}

    raise HTTPException(status_code=404, detail="Item not found in cart")


@router.post("/remove")
async def remove_from_cart(item: CartItemAdd, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    result = await db.carts.update_one(
        {"user_id": user_id},
        {"$pull": {"items": {
            "product_id": item.product_id, 
            "size": item.size, 
            "color": item.color,
            "is_customized": item.is_customized,
            "custom_attributes": item.custom_attributes
        }}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    return {"message": "Item removed from cart"}


@router.delete("/clear")
async def clear_cart(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]
    await db.carts.update_one({"user_id": user_id}, {"$set": {"items": []}})
    return {"message": "Cart cleared"}
