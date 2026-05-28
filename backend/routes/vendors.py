from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/vendors", tags=["vendors"])

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


def serialize_vendor(doc):
    doc["id"] = str(doc.pop("_id"))
    if "portal_token" not in doc:
        import secrets
        import asyncio
        token = "vt_" + secrets.token_urlsafe(16)
        doc["portal_token"] = token
        if db is not None:
            asyncio.create_task(db.vendors.update_one({"_id": ObjectId(doc["id"])}, {"$set": {"portal_token": token}}))
    return doc


def serialize_ledger(doc):
    doc["id"] = str(doc.pop("_id"))
    doc["vendor_id"] = str(doc["vendor_id"])
    if isinstance(doc.get("order_id"), ObjectId):
        doc["order_id"] = str(doc["order_id"])
    return doc


class VendorCreate(BaseModel):
    name: str
    contact_person: str
    email: str
    phone: str
    specialty: List[str]
    monthly_capacity: Optional[int] = 100
    average_lead_time_days: Optional[int] = 14
    address: Optional[str] = None
    gst_no: Optional[str] = None
    satisfaction_score: Optional[float] = 5.0
    blacklisted: Optional[bool] = False


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[List[str]] = None
    monthly_capacity: Optional[int] = None
    average_lead_time_days: Optional[int] = None
    active: Optional[bool] = None
    address: Optional[str] = None
    gst_no: Optional[str] = None
    satisfaction_score: Optional[float] = None
    blacklisted: Optional[bool] = None


class LedgerPayment(BaseModel):
    amount: float
    ref_number: str
    notes: Optional[str] = None


class FeedbackPayload(BaseModel):
    rating: int
    comment: str



# ===== List All Vendors =====
@router.get("")
async def list_vendors(request: Request):
    await require_admin(request)
    cursor = db.vendors.find({}).sort("name", 1)
    vendors = []
    async for doc in cursor:
        v = serialize_vendor(doc)
        v["assigned_orders"] = await db.production_jobs.count_documents({
            "crafted_by": "vendor",
            "fulfillment_vendor": v["name"],
            "status": {"$ne": "completed"}
        })
        v["completed_orders"] = await db.production_jobs.count_documents({
            "crafted_by": "vendor",
            "fulfillment_vendor": v["name"],
            "status": "completed"
        })

        # Calculate dynamic average completion time (assigned_at to completed_at)
        completed_cursor = db.production_jobs.find({
            "crafted_by": "vendor",
            "fulfillment_vendor": v["name"],
            "status": "completed",
            "assigned_at": {"$ne": None},
            "completed_at": {"$ne": None}
        })
        total_time_seconds = 0.0
        count_completed = 0
        async for job in completed_cursor:
            try:
                a_str = job.get("assigned_at")
                c_str = job.get("completed_at")
                if a_str and c_str:
                    if a_str.endswith("Z"):
                        a_str = a_str[:-1] + "+00:00"
                    if c_str.endswith("Z"):
                        c_str = c_str[:-1] + "+00:00"
                    a_dt = datetime.fromisoformat(a_str)
                    c_dt = datetime.fromisoformat(c_str)
                    diff = c_dt - a_dt
                    total_time_seconds += diff.total_seconds()
                    count_completed += 1
            except Exception:
                pass

        if count_completed > 0:
            avg_seconds = total_time_seconds / count_completed
            avg_days = int(avg_seconds // 86400)
            avg_hours = int((avg_seconds % 86400) // 3600)
            v["avg_completion_time"] = {
                "days": avg_days,
                "hours": avg_hours,
                "formatted": f"{avg_days}d {avg_hours}h"
            }
        else:
            v["avg_completion_time"] = {
                "days": 0,
                "hours": 0,
                "formatted": "N/A"
            }

        vendors.append(v)
    return {"vendors": vendors}


# ===== Get Single Vendor =====
@router.get("/{vendor_id}")
async def get_vendor(vendor_id: str, request: Request):
    await require_admin(request)
    doc = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return serialize_vendor(doc)


# ===== Create Vendor =====
@router.post("")
async def create_vendor(vendor: VendorCreate, request: Request):
    actor = await require_admin(request)
    
    existing = await db.vendors.find_one({"name": vendor.name.strip()})
    if existing:
        raise HTTPException(status_code=400, detail=f"Vendor '{vendor.name}' already exists")
        
    doc = vendor.model_dump()
    doc["name"] = doc["name"].strip()
    doc["active"] = True
    import secrets
    doc["portal_token"] = "vt_" + secrets.token_urlsafe(16)
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.vendors.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="create_vendor",
        target=doc["id"],
        details={"vendor_name": doc["name"]}
    )
    return doc


# ===== Update Vendor =====
@router.put("/{vendor_id}")
async def update_vendor(vendor_id: str, data: VendorUpdate, request: Request):
    actor = await require_admin(request)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.vendors.update_one({"_id": ObjectId(vendor_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="update_vendor",
        target=vendor_id,
        details={"updated_fields": update_data}
    )
    return {"message": "Vendor details updated successfully"}


# ===== Delete/Deactivate Vendor =====
@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id: str, request: Request):
    await require_admin(request)
    
    # Soft delete: set active = False
    result = await db.vendors.update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    return {"message": "Vendor deactivated successfully"}


# ===== Get Vendor Ledger/Statements =====
@router.get("/{vendor_id}/ledger")
async def get_vendor_ledger(vendor_id: str, request: Request):
    await require_admin(request)
    
    # Verify vendor exists
    vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    cursor = db.vendor_ledgers.find({"vendor_id": ObjectId(vendor_id)}).sort("created_at", -1)
    ledger_entries = []
    total_due = 0.0
    total_paid = 0.0
    
    async for doc in cursor:
        entry = serialize_ledger(doc)
        ledger_entries.append(entry)
        total_due += entry.get("amount_due", 0.0)
        total_paid += entry.get("amount_paid", 0.0)
        
    balance_outstanding = round(total_due - total_paid, 2)
    
    return {
        "vendor": serialize_vendor(vendor),
        "ledger": ledger_entries,
        "total_due": round(total_due, 2),
        "total_paid": round(total_paid, 2),
        "balance_outstanding": balance_outstanding
    }


# ===== Post Vendor Payment =====
@router.post("/{vendor_id}/payments/{ledger_id}")
async def post_vendor_payment(vendor_id: str, ledger_id: str, payment: LedgerPayment, request: Request):
    actor = await require_admin(request)
    
    # Verify vendor exists
    vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    ledger_entry = await db.vendor_ledgers.find_one({"_id": ObjectId(ledger_id), "vendor_id": ObjectId(vendor_id)})
    if not ledger_entry:
        raise HTTPException(status_code=404, detail="Ledger billing record not found")
        
    amount_paid = float(ledger_entry.get("amount_paid", 0.0))
    amount_due = float(ledger_entry.get("amount_due", 0.0))
    new_amount_paid = round(amount_paid + payment.amount, 2)
    
    if new_amount_paid > amount_due:
        raise HTTPException(status_code=400, detail=f"Overpayment not allowed. Max due is {round(amount_due - amount_paid, 2)}")
        
    payment_status = "settled" if new_amount_paid == amount_due else "partially_paid"
    
    payment_record = {
        "amount": payment.amount,
        "ref_number": payment.ref_number,
        "notes": payment.notes or "",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendor_ledgers.update_one(
        {"_id": ObjectId(ledger_id)},
        {
            "$set": {
                "amount_paid": new_amount_paid,
                "payment_status": payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "payments": payment_record
            }
        }
    )
    
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="log_vendor_payment",
        target=ledger_id,
        details={
            "vendor_id": vendor_id,
            "amount_paid": payment.amount,
            "ref_number": payment.ref_number,
            "new_balance_due": round(amount_due - new_amount_paid, 2)
        }
    )
    return {"message": "Payment logged successfully", "payment_status": payment_status, "balance_due": round(amount_due - new_amount_paid, 2)}


# ===== Get Vendor Fulfilled/Completed Jobs =====
@router.get("/{vendor_id}/fulfilled")
async def get_vendor_fulfilled_jobs(vendor_id: str, request: Request):
    await require_admin(request)
    
    vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    cursor = db.production_jobs.find({
        "crafted_by": "vendor",
        "fulfillment_vendor": vendor["name"],
        "status": "completed"
    }).sort("completed_at", -1)
    
    fulfilled_jobs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("order_id"), ObjectId):
            doc["order_id"] = str(doc["order_id"])
        fulfilled_jobs.append(doc)
        
    return {"fulfilled_jobs": fulfilled_jobs}


# ===== Post Vendor Customer Feedback =====
@router.post("/{vendor_id}/fulfilled/{job_id}/feedback")
async def post_vendor_feedback(vendor_id: str, job_id: str, payload: FeedbackPayload, request: Request):
    actor = await require_admin(request)
    
    vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    job = await db.production_jobs.find_one({
        "_id": ObjectId(job_id),
        "crafted_by": "vendor",
        "fulfillment_vendor": vendor["name"],
        "status": "completed"
    })
    if not job:
        raise HTTPException(status_code=404, detail="Completed production job not found for this vendor")
        
    feedback = {
        "rating": payload.rating,
        "comment": payload.comment,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Save feedback on the production job
    await db.production_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"customer_feedback": feedback}}
    )
    
    # Recalculate average rating of all completed, rated jobs for this vendor
    cursor = db.production_jobs.find({
        "crafted_by": "vendor",
        "fulfillment_vendor": vendor["name"],
        "status": "completed",
        "customer_feedback.rating": {"$exists": True}
    })
    
    total_rating = 0.0
    count_rating = 0
    async for j in cursor:
        fb = j.get("customer_feedback")
        if fb and "rating" in fb:
            total_rating += float(fb["rating"])
            count_rating += 1
            
    if count_rating > 0:
        new_score = round(total_rating / count_rating, 2)
    else:
        new_score = float(payload.rating)
        
    # Update vendor's overall satisfaction score
    await db.vendors.update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": {
            "satisfaction_score": new_score,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="add_vendor_feedback",
        target=vendor_id,
        details={
            "job_id": job_id,
            "rating": payload.rating,
            "new_satisfaction_score": new_score
        }
    )
    
    return {"message": "Feedback submitted successfully", "new_satisfaction_score": new_score}

