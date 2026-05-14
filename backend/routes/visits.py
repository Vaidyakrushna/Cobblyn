from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/visits", tags=["visits"])

db = None


def set_db(database):
    global db
    db = database


class ScheduleVisitCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    contact_number: str = Field(..., min_length=6, max_length=20)
    visit_date: str  # ISO date "YYYY-MM-DD"
    style: Optional[str] = None
    material: Optional[str] = None
    material_type: Optional[str] = None
    visit_for: Optional[str] = None  # men | women
    pin_code: str = Field(..., min_length=4, max_length=10)
    notes: Optional[str] = None


@router.post("/schedule")
async def schedule_visit(payload: ScheduleVisitCreate):
    doc = payload.model_dump()
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.scheduled_visits.insert_one(doc)
    return {
        "message": "Visit scheduled. Our representative will contact you shortly to confirm.",
        "id": str(result.inserted_id),
        "status": "pending",
    }


@router.get("/my")
async def my_visits(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    email = user.get("email", "")
    cursor = db.scheduled_visits.find({"email": email}).sort("created_at", -1).limit(50)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return {"items": items, "total": len(items)}


@router.patch("/my/{visit_id}/cancel")
async def cancel_my_visit(visit_id: str, request: Request):
    """Customer cancels their own visit."""
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    email = user.get("email", "")
    try:
        oid = ObjectId(visit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid visit id")
    visit = await db.scheduled_visits.find_one({"_id": oid, "email": email})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    if visit.get("status") == "cancelled":
        return {"message": "Visit is already cancelled", "status": "cancelled"}
    await db.scheduled_visits.update_one(
        {"_id": oid},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Visit cancelled successfully", "status": "cancelled"}


class RescheduleBody(BaseModel):
    new_visit_date: str  # ISO date "YYYY-MM-DD"
    notes: Optional[str] = None


@router.patch("/my/{visit_id}/reschedule")
async def reschedule_my_visit(visit_id: str, payload: RescheduleBody, request: Request):
    """Customer reschedules their own visit. Creates a new visit and marks the old one as rescheduled."""
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    email = user.get("email", "")
    try:
        oid = ObjectId(visit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid visit id")
    visit = await db.scheduled_visits.find_one({"_id": oid, "email": email})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    if visit.get("status") in ("cancelled", "visited", "delivered", "rescheduled"):
        raise HTTPException(status_code=400, detail=f"Cannot reschedule a {visit['status']} visit")

    now = datetime.now(timezone.utc).isoformat()
    # Create the new visit copying all details but with the new date
    new_doc = {
        "first_name": visit["first_name"],
        "last_name": visit["last_name"],
        "email": visit["email"],
        "contact_number": visit["contact_number"],
        "visit_date": payload.new_visit_date,
        "style": visit["style"],
        "material": visit["material"],
        "material_type": visit.get("material_type", ""),
        "visit_for": visit["visit_for"],
        "pin_code": visit["pin_code"],
        "notes": payload.notes if payload.notes is not None else visit.get("notes"),
        "status": "pending",
        "created_at": now,
        "rescheduled_from": visit_id,
        "original_visit_date": visit["visit_date"],
    }
    result = await db.scheduled_visits.insert_one(new_doc)
    new_id = str(result.inserted_id)

    # Mark the old visit as rescheduled with a link to the new one
    await db.scheduled_visits.update_one(
        {"_id": oid},
        {"$set": {
            "status": "rescheduled",
            "rescheduled_to": new_id,
            "rescheduled_date": payload.new_visit_date,
            "updated_at": now,
        }}
    )
    return {
        "message": "Visit rescheduled successfully",
        "old_visit_id": visit_id,
        "new_visit_id": new_id,
        "new_visit_date": payload.new_visit_date,
    }


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("")
async def list_visits(request: Request, status: Optional[str] = None, limit: int = 100):
    await require_admin(request)
    query = {}
    if status:
        query["status"] = status
    cursor = db.scheduled_visits.find(query, {"_id": 1, "first_name": 1, "last_name": 1, "email": 1,
                                              "contact_number": 1, "visit_date": 1, "style": 1, "material": 1,
                                              "material_type": 1, "visit_for": 1, "pin_code": 1, "notes": 1,
                                              "status": 1, "created_at": 1, "updated_at": 1,
                                              "rescheduled_from": 1, "rescheduled_to": 1,
                                              "rescheduled_date": 1, "original_visit_date": 1
                                              }).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return {"items": items, "total": len(items)}


class StatusUpdate(BaseModel):
    status: str  # pending | confirmed | visited | cancelled


@router.patch("/{visit_id}/status")
async def update_visit_status(visit_id: str, payload: StatusUpdate, request: Request):
    await require_admin(request)
    allowed = {"pending", "confirmed", "visited", "cancelled", "rescheduled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {sorted(allowed)}")
    try:
        oid = ObjectId(visit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid visit id")
    result = await db.scheduled_visits.update_one(
        {"_id": oid},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"message": "Status updated", "status": payload.status}


@router.delete("/{visit_id}")
async def delete_visit(visit_id: str, request: Request):
    await require_admin(request)
    try:
        oid = ObjectId(visit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid visit id")
    result = await db.scheduled_visits.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"message": "Visit deleted"}
