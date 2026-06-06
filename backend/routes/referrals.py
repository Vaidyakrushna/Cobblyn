from fastapi import APIRouter, HTTPException, Request
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
    """Generate a unique 6-character alphanumeric referral code prefixed with BYOND-."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "BYOND-" + "".join(secrets.choice(chars) for _ in range(6))
        existing = await database.users.find_one({"referral_code": code})
        if not existing:
            return code


async def trigger_referral_reward(database, referee_id) -> None:
    """Check if there is a pending referral for this referee, complete it, and reward the referrer."""
    referee_obj_id = ObjectId(referee_id) if isinstance(referee_id, str) else referee_id
    
    referral = await database.referrals.find_one({
        "referee_id": referee_obj_id,
        "status": "pending"
    })
    
    if referral:
        # Update referral status to completed
        await database.referrals.update_one(
            {"_id": referral["_id"]},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        referrer_id = referral["referrer_id"]
        reward_amount = referral.get("reward_amount", 500.0)
        
        # Credit referrer's wallet
        await database.users.update_one(
            {"_id": referrer_id},
            {
                "$inc": {"wallet_balance": reward_amount},
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        # Log transaction ledger
        await database.wallet_transactions.insert_one({
            "user_id": referrer_id,
            "amount": reward_amount,
            "type": "credit",
            "description": f"Referral reward for inviting {referral.get('referee_name', 'a friend')}",
            "created_at": datetime.now(timezone.utc).isoformat()
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
