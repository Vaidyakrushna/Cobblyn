from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])

db = None


def set_db(database):
    global db
    db = database


class WishlistAdd(BaseModel):
    product_id: str


@router.get("")
async def get_wishlist(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    wishlist = await db.wishlists.find_one({"user_id": user_id}, {"_id": 0})
    if not wishlist:
        return {"items": []}

    # Populate product details
    populated = []
    for pid in wishlist.get("product_ids", []):
        product = None
        try:
            product = await db.products.find_one({"_id": ObjectId(pid)})
        except Exception:
            pass
            
        if not product:
            try:
                product = await db.products.find_one({"numericId": int(pid)})
            except Exception:
                pass
                
        if product:
            populated.append({
                "product_id": pid,
                "name": product["name"],
                "price": product["price"],
                "image": product["images"][0] if product.get("images") else "",
                "material": product.get("material", ""),
                "colors": product.get("colors", []),
                "gender": product.get("gender", "men")
            })

    return {"items": populated}


@router.post("/add")
async def add_to_wishlist(item: WishlistAdd, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    wishlist = await db.wishlists.find_one({"user_id": user_id})
    if not wishlist:
        await db.wishlists.insert_one({
            "user_id": user_id,
            "product_ids": [item.product_id]
        })
        return {"message": "Added to wishlist"}

    if item.product_id in wishlist.get("product_ids", []):
        return {"message": "Already in wishlist"}

    await db.wishlists.update_one(
        {"user_id": user_id},
        {"$push": {"product_ids": item.product_id}}
    )
    return {"message": "Added to wishlist"}


@router.delete("/remove")
async def remove_from_wishlist(product_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    result = await db.wishlists.update_one(
        {"user_id": user_id},
        {"$pull": {"product_ids": product_id}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    return {"message": "Removed from wishlist"}


@router.get("/check/{product_id}")
async def check_wishlist(product_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    user_id = user["_id"]

    wishlist = await db.wishlists.find_one({"user_id": user_id})
    if not wishlist:
        return {"in_wishlist": False}
    return {"in_wishlist": product_id in wishlist.get("product_ids", [])}
