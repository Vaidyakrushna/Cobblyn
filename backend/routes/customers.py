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


async def require_staff_or_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin", "staff"):
        raise HTTPException(status_code=403, detail="Staff or Admin access required")
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
    # VIP Clienteling & Deep Fit Customization Profiles
    fit_preference: Optional[str] = None
    last_preference: Optional[str] = None
    podiatry_notes: Optional[str] = None
    heatmap_image: Optional[str] = None
    arch_imprint_image: Optional[str] = None


class TicketCreate(BaseModel):
    subject: str
    message: str
    category: Optional[str] = "general"  # general, fit_issue, design_query, order_issue, return
    update_order_request: Optional[bool] = False
    order_id: Optional[str] = None
    order_number: Optional[str] = None


class TicketReply(BaseModel):
    message: str


class CustomerTierUpdate(BaseModel):
    client_tier: str  # regular, vip, elite


# ===== Customer List (Admin) =====

@router.get("")
async def list_customers(request: Request, search: Optional[str] = None, limit: int = 50, skip: int = 0):
    await require_admin(request)
    query = {"role": "user"}
    import re
    if search:
        escaped_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": escaped_search, "$options": "i"}},
            {"email": {"$regex": escaped_search, "$options": "i"}}
        ]
    cursor = db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    customers = []
    async for doc in cursor:
        cid = doc["_id"]
        doc["id"] = str(doc.pop("_id"))
        doc["order_count"] = await db.orders.count_documents({"user_id": cid})
        doc["has_fit_profile"] = await db.fit_profiles.count_documents({"user_id": cid}) > 0
        
        # Calculate Customer Lifetime Value (CLV) dynamically based on delivered orders
        clv_pipeline = [
            {"$match": {"user_id": cid, "status": "delivered"}},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]
        clv_res = await db.orders.aggregate(clv_pipeline).to_list(1)
        clv = float(clv_res[0]["total"]) if clv_res else 0.0
        doc["clv"] = round(clv, 2)
        
        # Resolve client tier
        tier = doc.get("client_tier")
        if not tier:
            if clv >= 25000:
                tier = "elite"
            elif clv >= 10000:
                tier = "vip"
            else:
                tier = "regular"
        doc["client_tier"] = tier
        
        customers.append(doc)
    total = await db.users.count_documents(query)
    return {"customers": customers, "total": total}


@router.get("/{customer_id}")
async def get_customer(customer_id: str, request: Request):
    await require_staff_or_admin(request)
    doc = await db.users.find_one({"_id": ObjectId(customer_id)}, {"password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    cid = doc["_id"]
    doc["id"] = str(doc.pop("_id"))
    doc["order_count"] = await db.orders.count_documents({"user_id": cid})

    # Calculate Customer Lifetime Value (CLV) dynamically based on delivered orders
    clv_pipeline = [
        {"$match": {"user_id": cid, "status": "delivered"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    clv_res = await db.orders.aggregate(clv_pipeline).to_list(1)
    clv = float(clv_res[0]["total"]) if clv_res else 0.0
    doc["clv"] = round(clv, 2)
    
    # Resolve client tier
    tier = doc.get("client_tier")
    if not tier:
        if clv >= 25000:
            tier = "elite"
        elif clv >= 10000:
            tier = "vip"
        else:
            tier = "regular"
    doc["client_tier"] = tier

    # Get fit profile
    fit = await db.fit_profiles.find_one({"user_id": cid}, {"_id": 0, "user_id": 0})
    doc["fit_profile"] = fit

    # Get recent orders
    orders = []
    cursor = db.orders.find({"user_id": cid}, {"_id": 1, "order_number": 1, "total_amount": 1, "status": 1, "created_at": 1, "items": 1, "shipping_address": 1, "pending_modification": 1}).sort("created_at", -1).limit(10)
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


# ===== Customer Tier Management (Admin Override) =====

@router.put("/{customer_id}/tier")
async def update_customer_tier(customer_id: str, data: CustomerTierUpdate, request: Request):
    actor = await require_admin(request)
    if data.client_tier not in ("regular", "vip", "elite"):
        raise HTTPException(status_code=400, detail="client_tier must be 'regular', 'vip', or 'elite'")
        
    result = await db.users.update_one(
        {"_id": ObjectId(customer_id), "role": "user"},
        {"$set": {"client_tier": data.client_tier, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="override_customer_tier",
        target=customer_id,
        details={"new_tier": data.client_tier}
    )
    return {"message": f"Customer tier updated to {data.client_tier}"}


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
        "update_order_request": ticket.update_order_request,
        "order_id": ticket.order_id,
        "order_number": ticket.order_number,
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
    await require_staff_or_admin(request)
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
    admin = await require_staff_or_admin(request)
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
    admin = await require_staff_or_admin(request)
    body = await request.json()
    new_status = body.get("status", "closed")
    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": f"Ticket status updated to {new_status}"}


# ===== Conversational Ticket Customer-Facing Endpoints & Draft Modifications =====

@router.post("/me/tickets/{ticket_id}/reply")
async def customer_reply_ticket(ticket_id: str, reply: TicketReply, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    # Ensure ticket exists and belongs to the customer
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id), "user_id": ObjectId(user["_id"])})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = {
        "sender": "customer",
        "message": reply.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$push": {"messages": msg}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "status": "open"}}
    )
    return {"message": "Reply sent"}


@router.post("/admin/tickets/{ticket_id}/draft-modification")
async def admin_create_draft_modification(ticket_id: str, request: Request):
    # Support staff or Admin can save proposed draft changes
    admin = await require_staff_or_admin(request)
    body = await request.json()
    
    # Body validation
    items = body.get("items")
    shipping_address = body.get("shipping_address")
    notes = body.get("notes", "")
    order_id = body.get("order_id")
    order_number = body.get("order_number")
    
    if not items or not order_id:
        raise HTTPException(status_code=400, detail="Missing items or order_id in proposal draft")

    draft = {
        "proposed_by": admin.get("name", "Support Agent"),
        "proposed_email": admin.get("email"),
        "items": items,
        "shipping_address": shipping_address,
        "notes": notes,
        "order_id": order_id,
        "order_number": order_number,
        "status": "pending_customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "proposed_modification_draft": draft,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "messages": {
                    "sender": "admin",
                    "admin_name": "System / CRM",
                    "message": f"✏️ Support Agent has proposed a draft modification for Order #{order_number}. Customer review is required.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return {"message": "Draft modification successfully registered", "draft": draft}


@router.post("/me/tickets/{ticket_id}/confirm-draft")
async def customer_confirm_draft(ticket_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id), "user_id": ObjectId(user["_id"])})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    draft = ticket.get("proposed_modification_draft")
    if not draft:
        raise HTTPException(status_code=400, detail="No active draft modification found on this ticket")

    # Set draft status to confirmed
    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$set": {
                "proposed_modification_draft.status": "confirmed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "messages": {
                    "sender": "customer",
                    "message": f"✅ Customer has accepted the proposed draft modifications and the estimated new pricing for Order #{draft.get('order_number')}.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    return {"message": "Proposed modifications confirmed successfully"}


@router.post("/me/tickets/{ticket_id}/reject-draft")
async def customer_reject_draft(ticket_id: str, request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    ticket = await db.support_tickets.find_one({"_id": ObjectId(ticket_id), "user_id": ObjectId(user["_id"])})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    draft = ticket.get("proposed_modification_draft")
    if not draft:
        raise HTTPException(status_code=400, detail="No active draft modification found on this ticket")

    # Remove draft from ticket
    result = await db.support_tickets.update_one(
        {"_id": ObjectId(ticket_id)},
        {
            "$unset": {
                "proposed_modification_draft": ""
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "messages": {
                    "sender": "customer",
                    "message": f"❌ Customer has declined the proposed draft modifications for Order #{draft.get('order_number')}.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    return {"message": "Proposed modifications declined successfully"}
