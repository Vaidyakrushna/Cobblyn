from fastapi import APIRouter, HTTPException, Request
from typing import Optional

router = APIRouter(prefix="/api/admin/analytics", tags=["analytics"])

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


@router.get("/sizes")
async def most_sold_sizes(request: Request, gender: Optional[str] = None, limit: int = 10):
    """Returns size sales aggregated across delivered/shipped orders."""
    await _admin(request)
    match = {"status": {"$in": ["shipped", "delivered"]}}
    pipeline = [
        {"$match": match},
        {"$unwind": "$items"},
        {"$group": {"_id": {"size": "$items.size", "gender": "$items.gender"},
                    "count": {"$sum": "$items.quantity"},
                    "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    rows = []
    async for d in db.orders.aggregate(pipeline):
        size = d["_id"].get("size")
        g = d["_id"].get("gender")
        if gender and g != gender:
            continue
        rows.append({"size": size, "gender": g, "units": d["count"], "revenue": round(d.get("revenue", 0), 2)})
    return {"items": rows}


@router.get("/return-rate")
async def return_rate(request: Request):
    """Per-product return rate = returns / orders containing the product."""
    await _admin(request)
    # Count orders per product
    sold_pipeline = [
        {"$match": {"status": {"$in": ["shipped", "delivered"]}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "name": {"$first": "$items.name"}, "sold": {"$sum": "$items.quantity"}}},
    ]
    sold_map = {}
    async for d in db.orders.aggregate(sold_pipeline):
        sold_map[d["_id"]] = {"name": d.get("name") or "(unknown)", "sold": d["sold"]}

    returns_pipeline = [
        {"$group": {"_id": "$product_id", "returns": {"$sum": 1}}},
    ]
    returns_map = {}
    async for d in db.returns.aggregate(returns_pipeline):
        returns_map[d["_id"]] = d["returns"]

    rows = []
    for pid, info in sold_map.items():
        ret = returns_map.get(pid, 0)
        sold = info["sold"]
        rate = round((ret / sold) * 100, 2) if sold else 0
        rows.append({"product_id": pid, "name": info["name"], "sold": sold, "returns": ret, "return_rate_pct": rate})
    rows.sort(key=lambda r: r["return_rate_pct"], reverse=True)
    return {"items": rows}


@router.get("/size-mismatch")
async def size_mismatch(request: Request):
    """Exchange requests grouped by original size -> requested size."""
    await _admin(request)
    pipeline = [
        {"$match": {"type": "exchange"}},
        {"$group": {"_id": {"original": "$size", "requested": "$exchange_size"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    rows = []
    async for d in db.returns.aggregate(pipeline):
        rows.append({"original_size": d["_id"].get("original"), "requested_size": d["_id"].get("requested"), "count": d["count"]})
    return {"items": rows}


@router.get("/popular-customizations")
async def popular_customizations(request: Request):
    """Most-used colors and material combinations from custom orders."""
    await _admin(request)
    # Unique colors used
    colors_pipeline = [
        {"$unwind": "$colors"},
        {"$group": {"_id": "$colors.name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    colors = []
    async for d in db.products.aggregate(colors_pipeline):
        colors.append({"color": d["_id"], "count": d["count"]})
    return {"colors": colors}
