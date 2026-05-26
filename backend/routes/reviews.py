from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

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


class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=2, max_length=120)
    body: str = Field(..., min_length=4, max_length=2000)


def _ser(doc):
    doc["id"] = str(doc.pop("_id"))
    if "user_id" in doc and not isinstance(doc["user_id"], str):
        doc["user_id"] = str(doc["user_id"])
    return doc


async def _has_purchased(user_id: str, product_id: str) -> bool:
    """User has at least one delivered order containing this product."""
    return bool(await db.orders.find_one({
        "user_id": user_id,
        "status": "delivered",
        "items.product_id": product_id,
    }))


async def _refresh_aggregate(product_id: str):
    cursor = db.reviews.find({"product_id": product_id}, {"rating": 1})
    ratings = [r["rating"] async for r in cursor]
    if not ratings:
        await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": {"review_count": 0, "avg_rating": 0}})
        return
    avg = sum(ratings) / len(ratings)
    try:
        oid = ObjectId(product_id)
        await db.products.update_one({"_id": oid}, {"$set": {"review_count": len(ratings), "avg_rating": round(avg, 2)}})
    except Exception:
        pass


@router.get("/product/{product_id}")
async def list_reviews(product_id: str, limit: int = 50):
    cursor = db.reviews.find({"product_id": product_id}).sort("created_at", -1).limit(limit)
    items = [_ser(d) async for d in cursor]
    summary = {"count": len(items), "avg": round(sum(i["rating"] for i in items) / len(items), 2) if items else 0}
    # rating distribution
    dist = {str(i): 0 for i in range(1, 6)}
    for i in items:
        dist[str(i["rating"])] = dist.get(str(i["rating"]), 0) + 1
    summary["distribution"] = dist
    return {"items": items, "summary": summary}


@router.post("/product/{product_id}")
async def create_review(product_id: str, payload: ReviewCreate, request: Request):
    user = await _user(request)
    user_id = user.get("id") or str(user.get("_id"))
    # Prevent duplicates
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": user_id})
    if existing:
        raise HTTPException(400, "You have already reviewed this product")
    verified = await _has_purchased(user_id, product_id)
    
    import html
    doc = {
        "product_id": product_id,
        "user_id": user_id,
        "user_name": html.escape(user.get("name", "Customer")),
        "rating": payload.rating,
        "title": html.escape(payload.title.strip()),
        "body": html.escape(payload.body.strip()),
        "verified_purchase": verified,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.reviews.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    await _refresh_aggregate(product_id)
    return doc


@router.delete("/{review_id}")
async def delete_review(review_id: str, request: Request):
    user = await _user(request)
    try:
        oid = ObjectId(review_id)
    except Exception:
        raise HTTPException(400, "Invalid review id")
    review = await db.reviews.find_one({"_id": oid})
    if not review:
        raise HTTPException(404, "Review not found")
    is_admin = user.get("role") in ("admin", "super_admin")
    if not is_admin and review.get("user_id") != (user.get("id") or str(user.get("_id"))):
        raise HTTPException(403, "Cannot delete others' reviews")
    await db.reviews.delete_one({"_id": oid})
    await _refresh_aggregate(review["product_id"])
    return {"message": "Review deleted"}
