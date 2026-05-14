from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/production", tags=["production"])

db = None


def set_db(database):
    global db
    db = database


async def require_admin_or_worker(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin", "factory_worker"):
        raise HTTPException(status_code=403, detail="Access denied. Admin or factory worker required.")
    return user


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("order_id"), ObjectId):
        doc["order_id"] = str(doc["order_id"])
    return doc


PRODUCTION_STAGES = [
    {"name": "order_received", "label": "Order Received"},
    {"name": "pattern_cutting", "label": "Pattern Cutting"},
    {"name": "upper_assembly", "label": "Upper Assembly"},
    {"name": "sole_attachment", "label": "Sole Attachment"},
    {"name": "finishing", "label": "Finishing & Polishing"},
    {"name": "quality_check", "label": "Quality Check"},
    {"name": "ready_to_ship", "label": "Ready to Ship"},
]

STAGE_NAMES = [s["name"] for s in PRODUCTION_STAGES]


class ProductionJobCreate(BaseModel):
    order_id: str
    priority: Optional[str] = "normal"  # normal, rush, express
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class StageUpdate(BaseModel):
    stage: str
    status: str  # completed, in_progress, skipped
    notes: Optional[str] = None


class WorkerAssign(BaseModel):
    worker_name: str
    worker_id: Optional[str] = None


class TechPackUpdate(BaseModel):
    material_specs: Optional[List[dict]] = None
    measurements: Optional[dict] = None
    design_notes: Optional[str] = None
    color_code: Optional[str] = None
    construction: Optional[str] = None
    last_type: Optional[str] = None
    special_instructions: Optional[str] = None


# ===== Production Stats =====

@router.get("/stats")
async def production_stats(request: Request):
    await require_admin_or_worker(request)

    total_jobs = await db.production_jobs.count_documents({})
    active_jobs = await db.production_jobs.count_documents({"status": {"$in": ["in_progress", "pending"]}})
    completed_today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    completed_today = await db.production_jobs.count_documents({
        "status": "completed",
        "completed_at": {"$gte": completed_today_start}
    })

    # Count per stage
    stage_counts = {}
    for s in STAGE_NAMES:
        count = await db.production_jobs.count_documents({"current_stage": s, "status": {"$ne": "completed"}})
        stage_counts[s] = count

    # Priority breakdown
    rush = await db.production_jobs.count_documents({"priority": "rush", "status": {"$ne": "completed"}})
    express = await db.production_jobs.count_documents({"priority": "express", "status": {"$ne": "completed"}})

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_today": completed_today,
        "stage_counts": stage_counts,
        "rush_orders": rush,
        "express_orders": express,
        "stages": PRODUCTION_STAGES
    }


# ===== List Production Jobs =====

@router.get("/jobs")
async def list_jobs(
    request: Request,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    await require_admin_or_worker(request)

    query = {}
    if status:
        query["status"] = status
    if stage:
        query["current_stage"] = stage
    if priority:
        query["priority"] = priority
    if assigned_to:
        query["assigned_to"] = {"$regex": assigned_to, "$options": "i"}
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
        ]

    cursor = db.production_jobs.find(query).sort([
        ("priority_order", 1),
        ("created_at", 1)
    ]).skip(skip).limit(limit)

    jobs = []
    async for doc in cursor:
        jobs.append(serialize(doc))

    total = await db.production_jobs.count_documents(query)
    return {"jobs": jobs, "total": total}


# ===== Get Single Job =====

@router.get("/jobs/{job_id}")
async def get_job(job_id: str, request: Request):
    await require_admin_or_worker(request)
    doc = await db.production_jobs.find_one({"_id": ObjectId(job_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Production job not found")
    return serialize(doc)


# ===== Create Production Job (from order) =====

@router.post("/jobs")
async def create_job(data: ProductionJobCreate, request: Request):
    admin = await require_admin(request)

    # Check if job already exists for this order
    existing = await db.production_jobs.find_one({"order_id": ObjectId(data.order_id)})
    if existing:
        raise HTTPException(status_code=400, detail="Production job already exists for this order")

    # Get order info
    order = await db.orders.find_one({"_id": ObjectId(data.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    priority_map = {"express": 0, "rush": 1, "normal": 2}

    # Build stages
    stages = []
    for s in PRODUCTION_STAGES:
        stage_doc = {
            "name": s["name"],
            "label": s["label"],
            "status": "completed" if s["name"] == "order_received" else "pending",
        }
        if s["name"] == "order_received":
            stage_doc["started_at"] = datetime.now(timezone.utc).isoformat()
            stage_doc["completed_at"] = datetime.now(timezone.utc).isoformat()
        stages.append(stage_doc)

    # Build tech pack from order items
    tech_pack = {
        "material_specs": [],
        "measurements": {},
        "design_notes": data.notes or "",
        "color_code": "",
        "construction": "",
        "last_type": "",
        "special_instructions": order.get("notes", "")
    }
    for item in order.get("items", []):
        tech_pack["material_specs"].append({
            "item_name": item.get("name", ""),
            "material": item.get("material", ""),
            "color": item.get("color", ""),
            "size": item.get("size", ""),
            "quantity": item.get("quantity", 1)
        })

    doc = {
        "order_id": ObjectId(data.order_id),
        "order_number": order.get("order_number", ""),
        "customer_name": order.get("customer_name", ""),
        "customer_email": order.get("customer_email", ""),
        "items": order.get("items", []),
        "shipping_address": order.get("shipping_address", {}),
        "total_amount": order.get("total_amount", 0),
        "priority": data.priority or "normal",
        "priority_order": priority_map.get(data.priority or "normal", 2),
        "assigned_to": data.assigned_to or "",
        "status": "in_progress",
        "current_stage": "pattern_cutting",
        "stages": stages,
        "tech_pack": tech_pack,
        "activity_log": [{
            "action": "Job created",
            "by": admin.get("name", "Admin"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }],
        "estimated_completion": None,
        "completed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    result = await db.production_jobs.insert_one(doc)

    # Update order status to in_production
    await db.orders.update_one(
        {"_id": ObjectId(data.order_id)},
        {
            "$set": {"status": "in_production", "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"status_history": {
                "status": "in_production",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Sent to production"
            }}
        }
    )

    return {"id": str(result.inserted_id), "message": "Production job created"}


# ===== Update Stage =====

@router.put("/jobs/{job_id}/stage")
async def update_stage(job_id: str, data: StageUpdate, request: Request):
    user = await require_admin_or_worker(request)

    if data.stage not in STAGE_NAMES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {STAGE_NAMES}")

    doc = await db.production_jobs.find_one({"_id": ObjectId(job_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Production job not found")

    stages = doc.get("stages", [])
    now = datetime.now(timezone.utc).isoformat()

    # Update the specific stage
    for s in stages:
        if s["name"] == data.stage:
            s["status"] = data.status
            if data.status == "in_progress":
                s["started_at"] = s.get("started_at") or now
            elif data.status == "completed":
                s["started_at"] = s.get("started_at") or now
                s["completed_at"] = now
            if data.notes:
                s["notes"] = data.notes
            break

    # Determine next current_stage (first non-completed stage)
    current_stage = "ready_to_ship"
    job_status = "in_progress"
    for s in stages:
        if s["status"] != "completed" and s["status"] != "skipped":
            current_stage = s["name"]
            break
    else:
        # All stages completed
        job_status = "completed"

    activity_entry = {
        "action": f"Stage '{data.stage}' marked as {data.status}",
        "by": user.get("name", "Worker"),
        "notes": data.notes or "",
        "timestamp": now
    }

    update_fields = {
        "stages": stages,
        "current_stage": current_stage,
        "status": job_status,
        "updated_at": now
    }
    if job_status == "completed":
        update_fields["completed_at"] = now

    await db.production_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_fields, "$push": {"activity_log": activity_entry}}
    )

    # If ready_to_ship, update order status
    if current_stage == "ready_to_ship" and data.stage == "quality_check" and data.status == "completed":
        order_id = doc.get("order_id")
        if order_id:
            await db.orders.update_one(
                {"_id": order_id},
                {
                    "$set": {"status": "shipped", "updated_at": now},
                    "$push": {"status_history": {
                        "status": "shipped",
                        "timestamp": now,
                        "note": "Production complete, ready to ship"
                    }}
                }
            )

    return {"message": f"Stage updated", "current_stage": current_stage, "status": job_status}


# ===== Assign Worker =====

@router.put("/jobs/{job_id}/assign")
async def assign_worker(job_id: str, data: WorkerAssign, request: Request):
    admin = await require_admin(request)

    result = await db.production_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$set": {
                "assigned_to": data.worker_name,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "activity_log": {
                    "action": f"Assigned to {data.worker_name}",
                    "by": admin.get("name", "Admin"),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Production job not found")
    return {"message": f"Assigned to {data.worker_name}"}


# ===== Update Tech Pack =====

@router.put("/jobs/{job_id}/tech-pack")
async def update_tech_pack(job_id: str, data: TechPackUpdate, request: Request):
    await require_admin_or_worker(request)

    update_data = {}
    for field, value in data.model_dump().items():
        if value is not None:
            update_data[f"tech_pack.{field}"] = value

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.production_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Production job not found")
    return {"message": "Tech pack updated"}


# ===== Factory Workers Management =====

@router.get("/workers")
async def list_workers(request: Request):
    await require_admin(request)
    cursor = db.users.find({"role": {"$in": ["factory_worker", "admin"]}}, {"password_hash": 0})
    workers = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        # Count assigned active jobs
        doc["active_jobs"] = await db.production_jobs.count_documents({
            "assigned_to": doc.get("name", ""),
            "status": {"$ne": "completed"}
        })
        workers.append(doc)
    return {"workers": workers}


@router.post("/workers")
async def add_worker(request: Request):
    admin = await require_admin(request)
    body = await request.json()
    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    from auth_utils import hash_password
    doc = {
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "role": "factory_worker",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(doc)
    return {"id": str(result.inserted_id), "message": f"Factory worker '{name}' added"}


@router.delete("/workers/{worker_id}")
async def remove_worker(worker_id: str, request: Request):
    await require_admin(request)
    result = await db.users.delete_one({"_id": ObjectId(worker_id), "role": "factory_worker"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {"message": "Worker removed"}
