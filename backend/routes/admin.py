from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/admin", tags=["admin"])

db = None


def set_db(database):
    global db
    db = database


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/dashboard")
async def get_dashboard_stats(request: Request, period: Optional[str] = None, value: Optional[str] = None):
    await require_admin(request)

    # Build orders date filter based on period
    order_date_filter = {}
    if period and value:
        try:
            if period == "day":
                # value: YYYY-MM-DD
                start = datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                end = start + timedelta(days=1)
                order_date_filter = {"created_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}}
            elif period == "month":
                # value: YYYY-MM
                start = datetime.strptime(value + "-01", "%Y-%m-%d").replace(tzinfo=timezone.utc)
                # next month
                if start.month == 12:
                    end = start.replace(year=start.year + 1, month=1)
                else:
                    end = start.replace(month=start.month + 1)
                order_date_filter = {"created_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}}
            elif period == "year":
                # value: YYYY
                start = datetime(int(value), 1, 1, tzinfo=timezone.utc)
                end = datetime(int(value) + 1, 1, 1, tzinfo=timezone.utc)
                order_date_filter = {"created_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}}
        except (ValueError, TypeError):
            order_date_filter = {}

    total_shoes = await db.products.count_documents({})
    total_accessories = await db.accessories.count_documents({})
    total_products = total_shoes + total_accessories
    total_users = await db.users.count_documents({"role": "user"})
    total_orders = await db.orders.count_documents(order_date_filter)
    pending_orders = await db.orders.count_documents({**order_date_filter, "status": {"$in": ["pending", "confirmed"]}})
    in_production = await db.orders.count_documents({**order_date_filter, "status": "in_production"})
    total_materials = await db.materials.count_documents({})
    total_rules = await db.pricing_rules.count_documents({})
    total_tickets = await db.support_tickets.count_documents({})
    open_tickets = await db.support_tickets.count_documents({"status": "open"})

    # Revenue from completed orders (within period)
    pipeline = [
        {"$match": {**order_date_filter, "status": "delivered"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    # Recent orders (within period)
    recent_orders = []
    cursor = db.orders.find(order_date_filter, {"_id": 1, "order_number": 1, "customer_name": 1, "total_amount": 1, "status": 1, "created_at": 1}).sort("created_at", -1).limit(5)
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        recent_orders.append(doc)

    return {
        "total_products": total_products,
        "total_users": total_users,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "in_production": in_production,
        "total_materials": total_materials,
        "total_rules": total_rules,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "period": period,
        "period_value": value,
    }
