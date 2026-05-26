from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncio
from datetime import datetime, timezone
import uuid

# Import the background job objects from the jobs_queue module
from jobs_queue import JOBS_REGISTRY, jobs_queue, add_job

router = APIRouter(prefix="/api/admin/jobs", tags=["jobs"])

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

class MockJobCreate(BaseModel):
    type: str  # send_email, render_custom_preview, process_refund, order_workflow_escalation
    payload: dict

@router.get("")
async def list_jobs(request: Request):
    await require_admin(request)
    # Return all jobs sorted by creation timestamp descending
    jobs = list(JOBS_REGISTRY.values())
    jobs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Redact sensitive email/user data from the payload for secure audit displays
    safe_jobs = []
    for job in jobs:
        safe_job = job.copy()
        payload = safe_job.get("payload", {}).copy()
        if "password" in payload:
            payload["password"] = "********"
        if "token" in payload:
            payload["token"] = "********"
        safe_job["payload"] = payload
        safe_jobs.append(safe_job)
        
    return {"jobs": safe_jobs, "total": len(safe_jobs)}

@router.post("/retry/{job_id}")
async def retry_job(job_id: str, request: Request):
    await require_admin(request)
    if job_id not in JOBS_REGISTRY:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = JOBS_REGISTRY[job_id]
    if job["status"] not in ("failed", "completed"):
        raise HTTPException(status_code=400, detail=f"Cannot retry job in status: {job['status']}")
        
    # Reset job metrics and queue again
    job["status"] = "pending"
    job["progress"] = 0
    job["error"] = None
    job["started_at"] = None
    job["completed_at"] = None
    job["retries"] += 1
    job["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await jobs_queue.put(job_id)
    return {"message": "Job re-enqueued successfully", "job_id": job_id}

@router.post("/mock")
async def trigger_mock_job(mock_create: MockJobCreate, request: Request):
    await require_admin(request)
    allowed_types = {"send_email", "render_custom_preview", "process_refund", "order_workflow_escalation"}
    if mock_create.type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported mock task type. Supported: {allowed_types}")
        
    job_id = await add_job(mock_create.type, mock_create.payload)
    return {"message": "Mock background task created successfully", "job_id": job_id}
