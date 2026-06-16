from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
import secrets
import string
from auth_utils import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

db = None


def set_db(database):
    global db
    db = database


async def generate_referral_code(database) -> str:
    """Generate a unique 6-character alphanumeric referral code prefixed with COBBLYN-."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "COBBLYN-" + "".join(secrets.choice(chars) for _ in range(6))
        existing = await database.users.find_one({"referral_code": code})
        if not existing:
            return code


async def trigger_referral_reward(database, referee_id, order_doc=None) -> None:
    """Check if there is a pending or held referral for this referee, validate rules, and reward the referrer."""
    referee_obj_id = ObjectId(referee_id) if isinstance(referee_id, str) else referee_id
    
    # Find active referral record
    referral = await database.referrals.find_one({
        "referee_id": referee_obj_id,
        "status": {"$in": ["pending", "held"]}
    })
    
    if not referral:
        return

    # Check if order_doc is provided, otherwise find the referee's first confirmed/delivered order
    if not order_doc:
        order_doc = await database.orders.find_one({
            "user_id": referee_obj_id,
            "status": {"$in": ["confirmed", "delivered"]}
        }, sort=[("created_at", 1)])

    if not order_doc:
        return

    # Fetch configuration
    config = await database.referral_config.find_one({"_id": "global"})
    if not config:
        min_purchase = 0.0
        hold_days = 0
    else:
        min_purchase = float(config.get("min_purchase_amount", 0.0))
        hold_days = int(config.get("hold_days", 0))

    # Calculate subtotal / total order value for min purchase check (pre-wallet amount)
    order_val = float(order_doc.get("total_amount", 0.0)) + float(order_doc.get("wallet_discount", 0.0))

    if order_val < min_purchase:
        # Referee didn't meet the minimum purchase requirement, keep it pending
        return

    # Update referral with order info
    update_fields = {
        "order_id": order_doc["_id"],
        "order_number": order_doc.get("order_number")
    }

    # Decide status based on fraud flags and hold_days
    is_flagged = referral.get("is_flagged", False)

    if is_flagged:
        # If flagged, keep it held
        update_fields["status"] = "held"
        # Log to audit logs if not already done
        audit_exist = await database.referral_audit_logs.find_one({
            "referral_id": referral["_id"],
            "action": "flagged_fraud"
        })
        if not audit_exist:
            await database.referral_audit_logs.insert_one({
                "referral_id": referral["_id"],
                "referrer_email": referral.get("referrer_email", "unknown"),
                "referee_email": referral.get("referee_email", "unknown"),
                "action": "flagged_fraud",
                "actor": "system",
                "details": f"Flagged referral {referral['_id']} for potential fraud during purchase verification: {', '.join(referral.get('flag_reasons', []))}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        await database.referrals.update_one({"_id": referral["_id"]}, {"$set": update_fields})
        return

    # If already completed (released manually or previously), do not process again
    if referral.get("status") == "completed":
        return

    if hold_days > 0 and not referral.get("eligible_at"):
        # Calculate eligible date
        from datetime import timedelta
        eligible_date = datetime.now(timezone.utc) + timedelta(days=hold_days)
        update_fields["status"] = "held"
        update_fields["eligible_at"] = eligible_date.isoformat()
        await database.referrals.update_one({"_id": referral["_id"]}, {"$set": update_fields})
        
        # Log hold audit log
        await database.referral_audit_logs.insert_one({
            "referral_id": referral["_id"],
            "referrer_email": referral.get("referrer_email", "unknown"),
            "referee_email": referral.get("referee_email", "unknown"),
            "action": "held_cooloff",
            "actor": "system",
            "details": f"Referral reward held for cool-off period of {hold_days} days. Eligible at {eligible_date.isoformat()}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return

    # If there is a cooloff eligibility and it hasn't passed, keep it held
    if referral.get("eligible_at"):
        eligible_dt = datetime.fromisoformat(referral["eligible_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) < eligible_dt:
            # Still in cooloff
            return

    # If clean and hold_days == 0 (or cool-off has expired), complete it immediately and release reward
    update_fields["status"] = "completed"
    update_fields["completed_at"] = datetime.now(timezone.utc).isoformat()
    update_fields["released_at"] = datetime.now(timezone.utc).isoformat()

    await database.referrals.update_one({"_id": referral["_id"]}, {"$set": update_fields})
    
    # Credit referrer
    referrer_id = referral["referrer_id"]
    reward_amount = referral.get("reward_amount", 500.0)
    
    await database.users.update_one(
        {"_id": referrer_id},
        {"$inc": {"wallet_balance": reward_amount}}
    )
    
    # Add transaction history
    await database.wallet_transactions.insert_one({
        "user_id": referrer_id,
        "amount": reward_amount,
        "type": "credit",
        "description": f"Referral reward for inviting {referral.get('referee_name', 'a friend')}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Log completion audit log
    await database.referral_audit_logs.insert_one({
        "referral_id": referral["_id"],
        "referrer_email": referral.get("referrer_email", "unknown"),
        "referee_email": referral.get("referee_email", "unknown"),
        "action": "completed",
        "actor": "system",
        "details": f"Referral completed automatically: ₹{reward_amount} credited to referrer.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@router.get("/stats")
async def get_referral_stats(request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])
    
    user_db = await db.users.find_one({"_id": uid})
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    referral_code = user_db.get("referral_code", "")
    if not referral_code:
        referral_code = await generate_referral_code(db)
        await db.users.update_one({"_id": uid}, {"$set": {"referral_code": referral_code}})
        
    wallet_balance = user_db.get("wallet_balance", 0.0)
    
    # Get user referrals
    referrals_cursor = db.referrals.find({"referrer_id": uid}).sort("created_at", -1)
    referrals_list = []
    async for ref in referrals_cursor:
        ref["id"] = str(ref.pop("_id"))
        ref["referrer_id"] = str(ref["referrer_id"])
        ref["referee_id"] = str(ref["referee_id"])
        if "order_id" in ref and ref["order_id"]:
            ref["order_id"] = str(ref["order_id"])
        referrals_list.append(ref)
        
    # Get transaction history
    tx_cursor = db.wallet_transactions.find({"user_id": uid}).sort("created_at", -1)
    transactions = []
    async for tx in tx_cursor:
        tx["id"] = str(tx.pop("_id"))
        tx["user_id"] = str(tx["user_id"])
        transactions.append(tx)
        
    # Stats summary
    total_earned = sum(tx["amount"] for tx in transactions if tx["type"] == "credit" and "Referral reward" in tx.get("description", ""))
    pending_count = sum(1 for r in referrals_list if r["status"] == "pending")
    completed_count = sum(1 for r in referrals_list if r["status"] == "completed")
    
    return {
        "referral_code": referral_code,
        "wallet_balance": wallet_balance,
        "referrals": referrals_list,
        "transactions": transactions,
        "stats": {
            "total_earned": total_earned,
            "pending_referrals": pending_count,
            "successful_referrals": completed_count
        }
    }


# ===== ADMIN ENDPOINTS =====

from pydantic import BaseModel

class ReferralConfigUpdate(BaseModel):
    welcome_credit: float
    referral_reward: float
    min_purchase_amount: float
    hold_days: int
    max_wallet_shoes_amount: float
    max_wallet_accessories_amount: float

class WalletAdjustmentRequest(BaseModel):
    amount: float
    reason: str


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/admin/config")
async def get_admin_config(request: Request):
    await require_admin(request)
    config = await db.referral_config.find_one({"_id": "global"})
    if not config:
        config = {
            "_id": "global",
            "welcome_credit": 250.0,
            "referral_reward": 500.0,
            "min_purchase_amount": 0.0,
            "hold_days": 0,
            "max_wallet_shoes_amount": 500.0,
            "max_wallet_accessories_amount": 100.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referral_config.insert_one(config)
    
    config["id"] = str(config.get("_id"))
    return config


@router.put("/admin/config")
async def update_admin_config(payload: ReferralConfigUpdate, request: Request):
    user = await require_admin(request)
    
    update_doc = {
        "welcome_credit": payload.welcome_credit,
        "referral_reward": payload.referral_reward,
        "min_purchase_amount": payload.min_purchase_amount,
        "hold_days": payload.hold_days,
        "max_wallet_shoes_amount": payload.max_wallet_shoes_amount,
        "max_wallet_accessories_amount": payload.max_wallet_accessories_amount,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.referral_config.update_one(
        {"_id": "global"},
        {"$set": update_doc},
        upsert=True
    )
    
    # Log configuration update in audit logs
    await db.referral_audit_logs.insert_one({
        "referral_id": None,
        "referrer_email": "",
        "referee_email": "",
        "action": "config_updated",
        "actor": user["email"],
        "details": f"Updated referral configurations to: {update_doc}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Configuration updated successfully"}


@router.get("/admin/ledger")
async def get_admin_ledger(
    request: Request,
    status: Optional[str] = Query(None),
    is_flagged: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    if is_flagged is not None:
        query["is_flagged"] = is_flagged
    if search:
        import re
        escaped = re.escape(search)
        query["$or"] = [
            {"referee_name": {"$regex": escaped, "$options": "i"}},
            {"referee_email": {"$regex": escaped, "$options": "i"}},
            {"order_number": {"$regex": escaped, "$options": "i"}}
        ]
        
    cursor = db.referrals.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["referrer_id"] = str(doc.get("referrer_id", ""))
        doc["referee_id"] = str(doc.get("referee_id", ""))
        if "order_id" in doc and doc["order_id"]:
            doc["order_id"] = str(doc["order_id"])
            
        # Resolve referrer details
        try:
            ref_user = await db.users.find_one({"_id": ObjectId(doc["referrer_id"])})
            if ref_user:
                doc["referrer_name"] = ref_user.get("name", "Unknown")
                doc["referrer_email"] = ref_user.get("email", "Unknown")
        except Exception:
            doc["referrer_name"] = "Unknown"
            doc["referrer_email"] = "Unknown"
        
        items.append(doc)
        
    total = await db.referrals.count_documents(query)
    return {"items": items, "total": total}


@router.post("/admin/ledger/{referral_id}/approve")
async def approve_admin_referral(referral_id: str, request: Request):
    admin_user = await require_admin(request)
    
    referral = await db.referrals.find_one({"_id": ObjectId(referral_id)})
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    if referral["status"] == "completed":
        raise HTTPException(status_code=400, detail="Referral already completed")
        
    referrer_id = referral["referrer_id"]
    reward_amount = referral.get("reward_amount", 500.0)
    
    # Credit referrer
    await db.users.update_one(
        {"_id": referrer_id},
        {"$inc": {"wallet_balance": reward_amount}}
    )
    
    # Log transaction
    await db.wallet_transactions.insert_one({
        "user_id": referrer_id,
        "amount": reward_amount,
        "type": "credit",
        "description": f"Manual Admin Approval of Referral for {referral.get('referee_name', 'a friend')}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update status
    await db.referrals.update_one(
        {"_id": referral["_id"]},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "released_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Audit log
    await db.referral_audit_logs.insert_one({
        "referral_id": referral["_id"],
        "referrer_email": referral.get("referrer_email", "unknown"),
        "referee_email": referral.get("referee_email", "unknown"),
        "action": "approved",
        "actor": admin_user["email"],
        "details": f"Manually approved referral {referral_id} (flagged: {referral.get('is_flagged', False)}). Credited ₹{reward_amount} to referrer.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Security log
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=admin_user["id"],
        actor_email=admin_user["email"],
        action="approve_referral_reward",
        target=referral_id,
        details={"referee_email": referral.get("referee_email"), "referrer_id": str(referrer_id)}
    )
    
    return {"message": "Referral approved successfully and reward released."}


@router.post("/admin/ledger/{referral_id}/void")
async def void_admin_referral(referral_id: str, request: Request):
    admin_user = await require_admin(request)
    
    referral = await db.referrals.find_one({"_id": ObjectId(referral_id)})
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    was_completed = referral["status"] == "completed"
    
    # If already completed, debit the referrer's wallet
    if was_completed:
        referrer_id = referral["referrer_id"]
        reward_amount = referral.get("reward_amount", 500.0)
        
        await db.users.update_one(
            {"_id": referrer_id},
            {"$inc": {"wallet_balance": -reward_amount}}
        )
        
        await db.wallet_transactions.insert_one({
            "user_id": referrer_id,
            "amount": reward_amount,
            "type": "debit",
            "description": f"Voided referral reward for inviting {referral.get('referee_name', 'a friend')}",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
    await db.referrals.update_one(
        {"_id": referral["_id"]},
        {
            "$set": {
                "status": "voided",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Audit log
    await db.referral_audit_logs.insert_one({
        "referral_id": referral["_id"],
        "referrer_email": referral.get("referrer_email", "unknown"),
        "referee_email": referral.get("referee_email", "unknown"),
        "action": "voided",
        "actor": admin_user["email"],
        "details": f"Manually voided referral {referral_id} (previously completed: {was_completed}).",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Security log
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=admin_user["id"],
        actor_email=admin_user["email"],
        action="void_referral_reward",
        target=referral_id,
        details={"referee_email": referral.get("referee_email"), "deducted": was_completed}
    )
    
    return {"message": "Referral voided successfully."}


@router.post("/admin/customers/{customer_id}/adjust-wallet")
async def adjust_customer_wallet(customer_id: str, payload: WalletAdjustmentRequest, request: Request):
    admin_user = await require_admin(request)
    
    customer = await db.users.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    amount = float(payload.amount)
    reason = payload.reason or "Manual Admin Adjustment"
    
    await db.users.update_one(
        {"_id": ObjectId(customer_id)},
        {"$inc": {"wallet_balance": amount}}
    )
    
    tx_type = "credit" if amount >= 0 else "debit"
    abs_amount = abs(amount)
    
    await db.wallet_transactions.insert_one({
        "user_id": ObjectId(customer_id),
        "amount": abs_amount,
        "type": tx_type,
        "description": f"Admin manual adjustment: {reason}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Security log
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=admin_user["id"],
        actor_email=admin_user["email"],
        action="adjust_customer_wallet",
        target=customer_id,
        details={"amount": amount, "reason": reason}
    )
    
    # Audit log
    await db.referral_audit_logs.insert_one({
        "referral_id": None,
        "referrer_email": customer.get("email", "unknown"),
        "referee_email": "",
        "action": "wallet_adjusted",
        "actor": admin_user["email"],
        "details": f"Manually adjusted customer wallet by ₹{amount:,.2f}. Reason: {reason}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Wallet adjusted successfully by ₹{amount:,.2f}."}


@router.get("/admin/audit-logs")
async def get_referral_audit_logs(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    await require_admin(request)
    cursor = db.referral_audit_logs.find({}).sort("timestamp", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if "referral_id" in doc and doc["referral_id"]:
            doc["referral_id"] = str(doc["referral_id"])
        items.append(doc)
        
    total = await db.referral_audit_logs.count_documents({})
    return {"items": items, "total": total}
