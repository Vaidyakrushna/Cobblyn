from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from auth_utils import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/vip", tags=["vip"])

db = None


def set_db(database):
    global db
    db = database


class SubscribeRequest(BaseModel):
    plan_id: str
    payment_method: str  # e.g., "mock_card" or "upi", reject "wallet"


class PlanConfig(BaseModel):
    plan_id: str
    name: str
    price: float
    months: int
    discount_percent: float
    is_active: bool = True
    details: List[str] = ["10% off all products", "Free express shipping", "Priority customer support"]


class VipConfigUpdate(BaseModel):
    plans: List[PlanConfig]
    free_shipping: bool


class AdminGrantVipRequest(BaseModel):
    plan_id: str
    months: int
    discount_percent: float


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/plans")
async def get_vip_plans():
    """Retrieve available VIP subscription plans."""
    config = await db.vip_config.find_one({"_id": "global"})
    if not config:
        # Fallback default seeding if config does not exist
        config = {
            "_id": "global",
            "plans": [
                {
                    "plan_id": "monthly",
                    "name": "Monthly VIP",
                    "price": 299.0,
                    "months": 1,
                    "discount_percent": 10.0,
                    "is_active": True,
                    "details": ["10% off all products", "Free express shipping", "Priority customer support"]
                },
                {
                    "plan_id": "quarterly",
                    "name": "Quarterly VIP",
                    "price": 799.0,
                    "months": 3,
                    "discount_percent": 10.0,
                    "is_active": True,
                    "details": ["10% off all products", "Free express shipping", "Priority customer support", "Exclusive quarterly gift"]
                },
                {
                    "plan_id": "annual",
                    "name": "Annual VIP",
                    "price": 2499.0,
                    "months": 12,
                    "discount_percent": 15.0,
                    "is_active": True,
                    "details": ["15% off all products", "Free express shipping", "Priority customer support", "VIP dedicated account manager"]
                }
            ],
            "free_shipping": True
        }
        await db.vip_config.insert_one(config)
    
    config["id"] = str(config.get("_id"))
    
    # Filter active plans for customers
    config["plans"] = [p for p in config.get("plans", []) if p.get("is_active", True)]
    
    return config


@router.get("/status")
async def get_vip_status(request: Request):
    """Retrieve active VIP membership status for the logged-in user."""
    user = await get_current_user(request, db)
    user_db = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    vip_info = user_db.get("vip_membership", {
        "is_active": False,
        "plan_id": None,
        "subscribed_at": None,
        "expires_at": None,
        "status": "inactive"
    })
    
    # Check if membership expired
    if vip_info.get("is_active") and vip_info.get("expires_at"):
        try:
            expires_at = datetime.fromisoformat(vip_info["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                # Expired
                vip_info["is_active"] = False
                vip_info["status"] = "expired"
                await db.users.update_one(
                    {"_id": user_db["_id"]},
                    {"$set": {"vip_membership": vip_info}}
                )
        except Exception:
            pass

    return vip_info


@router.post("/subscribe")
async def subscribe_vip(payload: SubscribeRequest, request: Request):
    """Purchase/Subscribe to a VIP membership plan."""
    user = await get_current_user(request, db)
    user_db = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Restrict paying with referral wallet balance
    if payload.payment_method.lower().strip() == "wallet":
        raise HTTPException(
            status_code=400,
            detail="Referral wallet balance cannot be used to purchase VIP subscriptions. Please pay with credit card."
        )

    # Fetch configuration plans
    config = await db.vip_config.find_one({"_id": "global"})
    plans = config.get("plans") if config else []
    
    matched_plan = None
    for plan in plans:
        if plan.get("plan_id") == payload.plan_id:
            matched_plan = plan
            break
            
    if not matched_plan:
        raise HTTPException(status_code=400, detail="Invalid VIP plan selected")

    duration_months = int(matched_plan.get("months", 1))
    
    # Extension logic: stack duration if already an active VIP
    current_expiry = None
    user_vip = user_db.get("vip_membership")
    if user_vip and user_vip.get("is_active") and user_vip.get("expires_at"):
        try:
            parsed_expiry = datetime.fromisoformat(user_vip["expires_at"].replace("Z", "+00:00"))
            if parsed_expiry > datetime.now(timezone.utc):
                current_expiry = parsed_expiry
        except Exception:
            pass
            
    start_date = current_expiry or datetime.now(timezone.utc)
    expires_at = start_date + timedelta(days=30 * duration_months)

    vip_membership = {
        "is_active": True,
        "plan_id": matched_plan["plan_id"],
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
        "status": "active"
    }

    # Update customer profile
    await db.users.update_one(
        {"_id": user_db["_id"]},
        {"$set": {"vip_membership": vip_membership}}
    )

    # Insert transaction receipt log
    sub_doc = {
        "user_id": user_db["_id"],
        "user_email": user_db["email"],
        "plan_id": matched_plan["plan_id"],
        "amount": float(matched_plan["price"]),
        "payment_method": payload.payment_method,
        "status": "active",
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    await db.vip_subscriptions.insert_one(sub_doc)

    # Log security/audit trail event
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=str(user_db["_id"]),
        actor_email=user_db["email"],
        action="vip_subscription_purchased",
        target=matched_plan["plan_id"],
        details={"amount": matched_plan["price"], "payment_method": payload.payment_method}
    )

    return {"message": "Subscribed successfully", "vip_membership": vip_membership}


# ===== ADMIN ENDPOINTS =====

@router.get("/admin/config")
async def get_admin_vip_config(request: Request):
    """Retrieve global VIP plans configurations."""
    await require_admin(request)
    config = await db.vip_config.find_one({"_id": "global"})
    if not config:
        config = {
            "_id": "global",
            "plans": [
                {
                    "plan_id": "monthly",
                    "name": "Monthly VIP",
                    "price": 299.0,
                    "months": 1,
                    "discount_percent": 10.0,
                    "is_active": True,
                    "details": ["10% off all products", "Free express shipping", "Priority customer support"]
                },
                {
                    "plan_id": "quarterly",
                    "name": "Quarterly VIP",
                    "price": 799.0,
                    "months": 3,
                    "discount_percent": 10.0,
                    "is_active": True,
                    "details": ["10% off all products", "Free express shipping", "Priority customer support", "Exclusive quarterly gift"]
                },
                {
                    "plan_id": "annual",
                    "name": "Annual VIP",
                    "price": 2499.0,
                    "months": 12,
                    "discount_percent": 15.0,
                    "is_active": True,
                    "details": ["15% off all products", "Free express shipping", "Priority customer support", "VIP dedicated account manager"]
                }
            ],
            "free_shipping": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.vip_config.insert_one(config)
    
    config["id"] = str(config.get("_id"))
    return config


@router.put("/admin/config")
async def update_admin_vip_config(payload: VipConfigUpdate, request: Request):
    """Update dynamic VIP plans, pricing, and month configurations."""
    user = await require_admin(request)
    
    plans_list = []
    for plan in payload.plans:
        plans_list.append({
            "plan_id": plan.plan_id,
            "name": plan.name,
            "price": plan.price,
            "months": plan.months,
            "discount_percent": plan.discount_percent,
            "is_active": plan.is_active,
            "details": plan.details
        })

    update_doc = {
        "plans": plans_list,
        "free_shipping": payload.free_shipping,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.vip_config.update_one(
        {"_id": "global"},
        {"$set": update_doc},
        upsert=True
    )

    # Log audit event
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=str(user["_id"]),
        actor_email=user["email"],
        action="vip_config_updated",
        target="global",
        details={"updated_by": user["email"]}
    )

    return {"message": "VIP configuration updated successfully"}


@router.get("/admin/members")
async def get_admin_vip_members(request: Request):
    """Retrieve all users with active VIP status."""
    await require_admin(request)
    
    vip_config = await db.vip_config.find_one({"_id": "global"})
    plan_discounts = {}
    if vip_config:
        for p in vip_config.get("plans", []):
            plan_discounts[p.get("plan_id")] = p.get("discount_percent", 0.0)

    users_cursor = db.users.find({"vip_membership.is_active": True})
    members = []
    async for u in users_cursor:
        vip_info = u.get("vip_membership", {})
        if vip_info:
            vip_info["discount_percent"] = plan_discounts.get(vip_info.get("plan_id"), 0.0)
            
        members.append({
            "id": str(u["_id"]),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "wallet_balance": u.get("wallet_balance", 0.0),
            "vip_membership": vip_info
        })
    return members


@router.post("/admin/members/{user_id}/grant")
async def grant_admin_vip_status(user_id: str, payload: AdminGrantVipRequest, request: Request):
    """Manually grant/extend a user's VIP status."""
    admin_user = await require_admin(request)
    
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    expires_at = datetime.now(timezone.utc) + timedelta(days=30 * payload.months)
    vip_membership = {
        "is_active": True,
        "plan_id": payload.plan_id,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
        "status": "active"
    }

    await db.users.update_one(
        {"_id": target_user["_id"]},
        {"$set": {"vip_membership": vip_membership}}
    )

    # Log grant audit log
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=str(admin_user["_id"]),
        actor_email=admin_user["email"],
        action="vip_manually_granted",
        target=user_id,
        details={"plan_id": payload.plan_id, "months": payload.months, "granted_by": admin_user["email"]}
    )

    return {"message": f"VIP membership manually granted to {target_user['email']}"}


@router.post("/admin/members/{user_id}/cancel")
async def cancel_admin_vip_status(user_id: str, request: Request):
    """Manually cancel a user's VIP membership."""
    admin_user = await require_admin(request)
    
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    vip_membership = target_user.get("vip_membership", {})
    vip_membership["is_active"] = False
    vip_membership["status"] = "cancelled"

    await db.users.update_one(
        {"_id": target_user["_id"]},
        {"$set": {"vip_membership": vip_membership}}
    )

    # Log cancel audit log
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=str(admin_user["_id"]),
        actor_email=admin_user["email"],
        action="vip_manually_cancelled",
        target=user_id,
        details={"cancelled_by": admin_user["email"]}
    )

    return {"message": f"VIP membership revoked for {target_user['email']}"}
