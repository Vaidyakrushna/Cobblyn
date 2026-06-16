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


class PincodeCreate(BaseModel):
    pin_code: str = Field(..., min_length=4, max_length=10)
    capacity: int = Field(3, gt=0, lt=100)
    city: Optional[str] = "Metropolis"


class PincodeUpdate(BaseModel):
    capacity: Optional[int] = Field(None, gt=0, lt=100)
    active: Optional[bool] = None
    city: Optional[str] = None


@router.post("/schedule")
async def schedule_visit(payload: ScheduleVisitCreate, request: Request):
    # Retrieve pincode settings from serviceable_pincodes collection
    pin = payload.pin_code.strip()
    pincode_doc = await db.serviceable_pincodes.find_one({"pin_code": pin})
    if not pincode_doc or not pincode_doc.get("active", True):
        # Fallback seeder check: If the collection is empty, lazy-seed default pincodes
        total_pincodes = await db.serviceable_pincodes.count_documents({})
        if total_pincodes == 0:
            default_pins = [
                {"pin_code": "400001", "capacity": 3, "city": "Mumbai (South)", "active": True},
                {"pin_code": "400002", "capacity": 3, "city": "Mumbai (Central)", "active": True},
                {"pin_code": "110001", "capacity": 3, "city": "New Delhi (Connaught Place)", "active": True},
                {"pin_code": "110002", "capacity": 3, "city": "New Delhi (Central)", "active": True},
                {"pin_code": "560001", "capacity": 3, "city": "Bangalore (MG Road)", "active": True},
                {"pin_code": "560002", "capacity": 3, "city": "Bangalore (Central)", "active": True}
            ]
            for p_doc in default_pins:
                p_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                p_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.serviceable_pincodes.insert_many(default_pins)
            pincode_doc = await db.serviceable_pincodes.find_one({"pin_code": pin})

        if not pincode_doc or not pincode_doc.get("active", True):
            raise HTTPException(
                status_code=400,
                detail=f"We do not serve pin code {payload.pin_code} yet. Please select a serviceable region."
            )

    capacity_limit = pincode_doc.get("capacity", 3)

    # Double-booking slots capacity check (max capacity visits per pincode per day)
    existing_slots = await db.scheduled_visits.count_documents({
        "visit_date": payload.visit_date,
        "pin_code": payload.pin_code,
        "status": {"$ne": "cancelled"}
    })
    if existing_slots >= capacity_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Atelier slots for pin code {payload.pin_code} on {payload.visit_date} are fully booked (max {capacity_limit} slots). Please select another date."
        )

    doc = payload.model_dump()
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    # Link to authenticated user if logged in
    from auth_utils import get_optional_user
    user = await get_optional_user(request, db)
    if user:
        doc["user_id"] = ObjectId(user["_id"])

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


@router.get("/settings/pincodes")
async def get_pincodes_settings(request: Request):
    # Retrieve all serviceable pincodes, sorting by pincode ascending
    cursor = db.serviceable_pincodes.find({}).sort("pin_code", 1)
    pincodes = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        pincodes.append(doc)
    
    # Lazy default seed if empty so the UI doesn't load blank
    if len(pincodes) == 0:
        default_pins = [
            {"pin_code": "400001", "capacity": 3, "city": "Mumbai (South)", "active": True},
            {"pin_code": "400002", "capacity": 3, "city": "Mumbai (Central)", "active": True},
            {"pin_code": "110001", "capacity": 3, "city": "New Delhi (Connaught Place)", "active": True},
            {"pin_code": "110002", "capacity": 3, "city": "New Delhi (Central)", "active": True},
            {"pin_code": "560001", "capacity": 3, "city": "Bangalore (MG Road)", "active": True},
            {"pin_code": "560002", "capacity": 3, "city": "Bangalore (Central)", "active": True}
        ]
        for pin in default_pins:
            pin["created_at"] = datetime.now(timezone.utc).isoformat()
            pin["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.serviceable_pincodes.insert_many(default_pins)
        
        cursor = db.serviceable_pincodes.find({}).sort("pin_code", 1)
        pincodes = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            doc.pop("_id", None)
            pincodes.append(doc)
            
    return {"pincodes": pincodes}


@router.post("/settings/pincodes")
async def add_pincode_settings(payload: PincodeCreate, request: Request):
    await require_admin(request)
    pin = payload.pin_code.strip()
    existing = await db.serviceable_pincodes.find_one({"pin_code": pin})
    if existing:
        raise HTTPException(status_code=400, detail=f"Pin code {pin} already exists in registry.")
    
    doc = {
        "pin_code": pin,
        "capacity": payload.capacity,
        "city": payload.city.strip() if payload.city else "Metropolis",
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.serviceable_pincodes.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"message": "Serviceable pin code registered successfully", "pincode": doc}


@router.put("/settings/pincodes/{pin_code}")
async def update_pincode_settings(pin_code: str, payload: PincodeUpdate, request: Request):
    await require_admin(request)
    existing = await db.serviceable_pincodes.find_one({"pin_code": pin_code})
    if not existing:
        raise HTTPException(status_code=404, detail="Pin code not registered")
    
    update_fields = {}
    if payload.capacity is not None:
        update_fields["capacity"] = max(1, payload.capacity)
    if payload.active is not None:
        update_fields["active"] = payload.active
    if payload.city is not None:
        update_fields["city"] = payload.city.strip()
        
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.serviceable_pincodes.update_one({"pin_code": pin_code}, {"$set": update_fields})
        
    return {"message": "Pin code settings updated successfully"}


@router.delete("/settings/pincodes/{pin_code}")
async def delete_pincode_settings(pin_code: str, request: Request):
    await require_admin(request)
    result = await db.serviceable_pincodes.delete_one({"pin_code": pin_code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pin code not found in registry")
    return {"message": "Pin code removed from registry"}
