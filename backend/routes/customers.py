from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/customers", tags=["customers"])

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


def serialize_user(doc):
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc


class FitProfileUpdate(BaseModel):
    foot_length_left: Optional[float] = None   # mm
    foot_length_right: Optional[float] = None
    foot_width_left: Optional[float] = None
    foot_width_right: Optional[float] = None
    foot_girth_left: Optional[float] = None
    foot_girth_right: Optional[float] = None
    arch_type: Optional[str] = None  # low, medium, high
    scan_date: Optional[str] = None
    scan_source: Optional[str] = None  # manual, lidar, 3d_scanner
    notes: Optional[str] = None
    uk_size: Optional[str] = None


class TicketCreate(BaseModel):
    subject: str
    message: str
    category: Optional[str] = "general"  # general, fit_issue, design_query, order_issue, return


class TicketReply(BaseModel):
    message: str


# ===== Customer List (Admin) =====

@router.get("")
async def list_customers(request: Request, search: Optional[str] = None, limit: int = 50, skip: int = 0):
    await require_admin(request)
    query = {"role": "user"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    cursor = db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    customers = []
    async for doc in cursor:
        cid = doc["_id"]
        doc["id"] = str(doc.pop("_id"))
        doc["order_count"] = await db.orders.count_documents({"user_id": cid})
        doc["has_fit_profile"] = await db.fit_profiles.count_documents({"user_id": cid}) > 0
        customers.append(doc)
    total = await db.users.count_documents(query)
    return {"customers": customers, "total": total}


@router.get("/{customer_id}")
async def get_customer(customer_id: str, request: Request):
    await require_admin(request)
    doc = await db.users.find_one({"_id": ObjectId(customer_id)}, {"password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    cid = doc["_id"]
    doc["id"] = str(doc.pop("_id"))
    doc["order_count"] = await db.orders.count_documents({"user_id": cid})

    # Get fit profile
    fit = await db.fit_profiles.find_one({"user_id": cid}, {"_id": 0, "user_id": 0})
    doc["fit_profile"] = fit

    # Get recent orders
    orders = []
    cursor = db.orders.find({"user_id": cid}, {"_id": 1, "order_number": 1, "total_amount": 1, "status": 1, "created_at": 1}).sort("created_at", -1).limit(10)
    async for o in cursor:
        o["id"] = str(o.pop("_id"))
        orders.append(o)
    doc["recent_orders"] = orders

    return doc


# ===== Fit Profile (Fit Vault) =====

@router.get("/{customer_id}/fit-profile")
async def get_fit_profile(customer_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    # Users can view their own, admin can view anyone's
    if user.get("role") not in ("admin", "super_admin") and user["_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    fit = await db.fit_profiles.find_one({"user_id": ObjectId(customer_id)}, {"_id": 0})
    if not fit:
        return {"fit_profile": None, "message": "No fit profile found"}
    fit.pop("user_id", None)
    return {"fit_profile": fit}


@router.put("/{customer_id}/fit-profile")
async def update_fit_profile(customer_id: str, profile: FitProfileUpdate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin") and user["_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.fit_profiles.update_one(
        {"user_id": ObjectId(customer_id)},
        {"$set": update_data, "$setOnInsert": {"user_id": ObjectId(customer_id), "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Fit profile updated"}


# ===== My Profile (Customer self-service) =====

@router.get("/me/profile")
async def get_my_profile(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])
    fit = await db.fit_profiles.find_one({"user_id": uid}, {"_id": 0, "user_id": 0})
    order_count = await db.orders.count_documents({"user_id": uid})
    return {"name": user.get("name"), "email": user.get("email"), "fit_profile": fit, "order_count": order_count}


# ===== Support Tickets =====

@router.post("/me/tickets")
async def create_ticket(ticket: TicketCreate, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    doc = {
        "user_id": ObjectId(user["_id"]),
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "subject": ticket.subject,
        "category": ticket.category,
        "status": "open",
        "messages": [{"sender": "customer", "message": ticket.message, "timestamp": datetime.now(timezone.utc).isoformat()}],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.support_tickets.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Ticket created", "status": "open"}


@router.get("/me/tickets")
async def list_my_tickets(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    cursor = db.support_tickets.find({"user_id": ObjectId(user["_id"])}).sort("created_at", -1)
    tickets = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.pop("user_id", None)
        tickets.append(doc)
    return {"tickets": tickets}


# ===== Admin Ticket Management =====

@router.get("/admin/tickets")
async def admin_list_tickets(request: Request, status: Optional[str] = None):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    cursor = db.support_tickets.find(query).sort("created_at", -1)
    tickets = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["user_id"] = str(doc["user_id"]) if isinstance(doc.get("user_id"), ObjectId) else doc.get("user_id", "")
        tickets.append(doc)
    return {"tickets": tickets, "total": len(tickets)}


@router.post("/admin/tickets/{ticket_id}/reply")
async def admin_reply_ticket(ticket_id: str, reply: TicketReply, request: Request):
    admin = await require_admin(request)
    msg = {"sender": "admin", "admin_name": admin.get("name", "Admin"), "message": reply.message, "timestamp": datetime.now(timezone.utc).isoformat()}
    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$push": {"messages": msg}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": "Reply sent"}


@router.put("/admin/tickets/{ticket_id}/status")
async def admin_update_ticket_status(ticket_id: str, request: Request):
    admin = await require_admin(request)
    body = await request.json()
    new_status = body.get("status", "closed")
    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": f"Ticket status updated to {new_status}"}
