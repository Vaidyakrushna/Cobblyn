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


class CartItemUpdate(BaseModel):
    quantity: int


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
            item_total = product["price"] * item["quantity"]
            total += item_total
            populated_items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "price": product["price"],
                "image": product["images"][0] if product.get("images") else "",
                "material": product.get("material", ""),
                "size": item["size"],
                "color": item["color"],
                "quantity": item["quantity"],
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
                "quantity": item.quantity
            }]
        })
        return {"message": "Item added to cart"}

    # Check if item already exists (same product + size + color)
    existing_idx = None
    for idx, ci in enumerate(cart.get("items", [])):
        if ci["product_id"] == item.product_id and ci["size"] == item.size and ci["color"] == item.color:
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
                "quantity": item.quantity
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
        if ci["product_id"] == item.product_id and ci["size"] == item.size and ci["color"] == item.color:
            if item.quantity <= 0:
                await db.carts.update_one(
                    {"user_id": user_id},
                    {"$pull": {"items": {"product_id": item.product_id, "size": item.size, "color": item.color}}}
                )
            else:
                await db.carts.update_one(
                    {"user_id": user_id},
                    {"$set": {f"items.{idx}.quantity": item.quantity}}
                )
            return {"message": "Cart updated"}

    raise HTTPException(status_code=404, detail="Item not found in cart")


@router.delete("/remove")
async def remove_from_cart(product_id: str, size: str, color: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    result = await db.carts.update_one(
        {"user_id": user_id},
        {"$pull": {"items": {"product_id": product_id, "size": size, "color": color}}}
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
