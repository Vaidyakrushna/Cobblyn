"""Wishlist Move-to-Cart endpoint.
Adds an item to the cart and removes it from the wishlist.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/wishlist", tags=["wishlist-extra"])

db = None


def set_db(database):
    global db
    db = database


async def _user(request: Request):
    from auth_utils import get_current_user
    return await get_current_user(request, db)


class MoveBody(BaseModel):
    size: str
    color: Optional[str] = None
    quantity: int = 1


@router.post("/{product_id}/move-to-cart")
async def move_to_cart(product_id: str, payload: MoveBody, request: Request):
    user = await _user(request)
    user_id = user.get("_id")  # ObjectId — matches cart.py & wishlist.py

    # Find product to validate
    from bson import ObjectId
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(400, "Invalid product id")
    product = await db.products.find_one({"_id": oid})
    if not product:
        raise HTTPException(404, "Product not found")

    # ── Add to cart using the same db.carts model as cart.py ──
    cart = await db.carts.find_one({"user_id": user_id})
    new_item = {
        "product_id": product_id,
        "size": payload.size,
        "color": payload.color or "Black",
        "quantity": payload.quantity,
    }

    if not cart:
        # Create a new cart document
        await db.carts.insert_one({"user_id": user_id, "items": [new_item]})
    else:
        # Check if same product+size+color already in cart
        existing_idx = None
        for idx, ci in enumerate(cart.get("items", [])):
            if (ci["product_id"] == product_id
                    and ci.get("size") == payload.size
                    and ci.get("color") == (payload.color or "Black")):
                existing_idx = idx
                break

        if existing_idx is not None:
            await db.carts.update_one(
                {"user_id": user_id},
                {"$inc": {f"items.{existing_idx}.quantity": payload.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user_id},
                {"$push": {"items": new_item}}
            )

    # ── Remove from wishlist using db.wishlists + $pull (matches wishlist.py) ──
    await db.wishlists.update_one(
        {"user_id": user_id},
        {"$pull": {"product_ids": product_id}}
    )
    return {"message": "Moved to cart"}
