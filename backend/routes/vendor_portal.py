from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
from auth_utils import hash_password, verify_password, create_access_token, create_refresh_token, set_auth_cookies

router = APIRouter(prefix="/api/vendor/portal", tags=["vendor-portal"])

db = None


def set_db(database):
    global db
    db = database


class StageUpdate(BaseModel):
    stage: str
    status: str  # pending | in_progress | completed | skipped
    notes: Optional[str] = None


class RejectPayload(BaseModel):
    reason: Optional[str] = "No reason specified"
    details: Optional[str] = None


# ===== Secure Authentication & Management Endpoints (Defined first so paths don't get hijacked by /{token} wildcard) =====

async def get_current_vendor(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        import jwt
        from auth_utils import get_jwt_secret, JWT_ALGORITHM
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "vendor":
            raise HTTPException(status_code=401, detail="Invalid role context")
            
        vendor = await db.vendors.find_one({"_id": ObjectId(payload["sub"]), "active": True})
        if not vendor:
            raise HTTPException(status_code=401, detail="Vendor not found or inactive")
        return vendor
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class VendorLoginRequest(BaseModel):
    identifier: str  # Email or Phone number
    secret: str      # Password or PIN


class VendorResetSecurityRequest(BaseModel):
    token: str
    new_password: Optional[str] = None
    new_pin: Optional[str] = None


class VendorProfileUpdate(BaseModel):
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


@router.post("/login")
async def vendor_login(req: VendorLoginRequest, response: Response):
    # Lookup active vendor by email or phone number
    vendor = await db.vendors.find_one({
        "$or": [{"email": req.identifier}, {"phone": req.identifier}],
        "active": True
    })
    if not vendor:
        raise HTTPException(status_code=401, detail="Invalid credentials or inactive account")

    # Check pin or password hash
    pin_hash = vendor.get("pin_hash")
    password_hash = vendor.get("password_hash")

    verified = False
    if pin_hash and verify_password(req.secret, pin_hash):
        verified = True
    elif password_hash and verify_password(req.secret, password_hash):
        verified = True

    if not verified:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create tokens with role="vendor"
    access_token = create_access_token(str(vendor["_id"]), vendor["email"], role="vendor")
    refresh_token = create_refresh_token(str(vendor["_id"]))

    set_auth_cookies(response, access_token, refresh_token)
    return {
        "message": "Login successful",
        "vendor": {
            "name": vendor["name"],
            "contact_person": vendor["contact_person"],
            "email": vendor["email"],
            "phone": vendor["phone"],
            "address": vendor.get("address", "")
        }
    }


@router.post("/logout")
async def vendor_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logout successful"}


@router.post("/reset-security")
async def vendor_reset_security(req: VendorResetSecurityRequest):
    if not req.token.startswith("vt_"):
        raise HTTPException(status_code=401, detail="Invalid magic token")

    vendor = await db.vendors.find_one({"portal_token": req.token, "active": True})
    if not vendor:
        raise HTTPException(status_code=401, detail="Unauthorized magic token")

    updates = {}
    if req.new_password:
        updates["password_hash"] = hash_password(req.new_password)
    if req.new_pin:
        updates["pin_hash"] = hash_password(req.new_pin)

    if not updates:
        raise HTTPException(status_code=400, detail="Must provide new password or PIN")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.vendors.update_one({"_id": vendor["_id"]}, {"$set": updates})
    return {"message": "Security credentials updated successfully"}


@router.get("/me")
async def get_vendor_profile(request: Request):
    vendor = await get_current_vendor(request)
    return {
        "vendor": {
            "name": vendor["name"],
            "contact_person": vendor["contact_person"],
            "email": vendor["email"],
            "phone": vendor["phone"],
            "address": vendor.get("address", ""),
            "specialty": vendor.get("specialty", []),
            "has_pin": "pin_hash" in vendor,
            "has_password": "password_hash" in vendor
        }
    }


@router.put("/me")
async def update_vendor_profile(req: VendorProfileUpdate, request: Request):
    vendor = await get_current_vendor(request)
    
    update_data = {}
    if req.contact_person is not None:
        update_data["contact_person"] = req.contact_person
    if req.email is not None:
        update_data["email"] = req.email
    if req.phone is not None:
        update_data["phone"] = req.phone
    if req.address is not None:
        update_data["address"] = req.address

    if not update_data:
        raise HTTPException(status_code=400, detail="No profile fields provided to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.vendors.update_one({"_id": vendor["_id"]}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}


@router.get("/jobs/secure")
async def get_vendor_secure_jobs(request: Request):
    vendor = await get_current_vendor(request)
    
    # Completed jobs history
    cursor_comp = db.production_jobs.find({
        "crafted_by": "vendor",
        "fulfillment_vendor": vendor["name"],
        "status": "completed"
    }).sort("completed_at", -1)
    
    completed_jobs = []
    async for doc in cursor_comp:
        completed_jobs.append({
            "id": str(doc["_id"]),
            "order_number": doc.get("order_number", ""),
            "customer_name": doc.get("customer_name", ""),
            "customer_email": doc.get("customer_email", ""),
            "completed_at": doc.get("completed_at"),
            "items": doc.get("items", []),
            "rating": doc.get("customer_feedback", {}).get("rating"),
            "feedback_comment": doc.get("customer_feedback", {}).get("comment"),
            "feedback_submitted_at": doc.get("customer_feedback", {}).get("submitted_at")
        })

    # Declined/rejected jobs history
    cursor_decl = db.production_jobs.find({
        "activity_log": {
            "$elemMatch": {
                "action": {"$regex": f"actively REJECTED by vendor '{vendor['name']}'", "$options": "i"}
            }
        }
    }).sort("updated_at", -1)
    
    declined_jobs = []
    async for doc in cursor_decl:
        reason = "Declined"
        for log in doc.get("activity_log", []):
            if "actively REJECTED" in log.get("action", ""):
                reason = log.get("action", "Declined")
                break
        declined_jobs.append({
            "id": str(doc["_id"]),
            "order_number": doc.get("order_number", "") or f"COBBLYN-W-{str(doc['_id'])[-5:].upper()}",
            "items": doc.get("items", []),
            "declined_at": doc.get("updated_at"),
            "reason": reason
        })

    return {
        "completed_jobs": completed_jobs,
        "declined_jobs": declined_jobs
    }


@router.get("/ledger")
async def get_vendor_secure_ledger(request: Request):
    vendor = await get_current_vendor(request)
    
    cursor = db.vendor_ledgers.find({"vendor_id": vendor["_id"]}).sort("created_at", -1)
    ledger_entries = []
    total_due = 0.0
    total_paid = 0.0
    
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["vendor_id"] = str(doc["vendor_id"])
        if isinstance(doc.get("order_id"), ObjectId):
            doc["order_id"] = str(doc["order_id"])
        
        ledger_entries.append(doc)
        total_due += doc.get("amount_due", 0.0)
        total_paid += doc.get("amount_paid", 0.0)
        
    balance_outstanding = round(total_due - total_paid, 2)
    
    return {
        "ledger": ledger_entries,
        "total_due": round(total_due, 2),
        "total_paid": round(total_paid, 2),
        "balance_outstanding": balance_outstanding
    }


# ===== JIT Magic-Token Access Endpoints (Wildcards placed at end) =====

@router.get("/{token}")
async def get_vendor_portal(token: str):
    """
    Passwordless login endpoint for third-party workshops using high-entropy magic tokens.
    Returns the vendor's active job queue and historic completed logs.
    """
    if not token.startswith("vt_"):
        raise HTTPException(status_code=401, detail="Invalid token format")

    vendor = await db.vendors.find_one({"portal_token": token, "active": True})
    if not vendor:
        raise HTTPException(status_code=401, detail="Unauthorized access token")

    # Enforce JIT SLA reversion to clear any overdue, unconfirmed jobs back to inhouse
    from routes.production import resolve_sla_reversions
    await resolve_sla_reversions(db)

    # Fetch active and completed jobs assigned to this vendor
    cursor = db.production_jobs.find({
        "crafted_by": "vendor",
        "fulfillment_vendor": vendor["name"]
    }).sort([("priority_order", 1), ("created_at", -1)])

    jobs = []
    async for doc in cursor:
        # Archive completed jobs older than 7 days to protect customer details exposure
        if doc.get("status") == "completed":
            comp_at_str = doc.get("completed_at") or doc.get("updated_at")
            if comp_at_str:
                try:
                    comp_at = datetime.fromisoformat(comp_at_str)
                    now_utc = datetime.now(timezone.utc)
                    age = now_utc - comp_at
                    if age.total_seconds() > 7 * 24 * 3600:
                        continue # Skip historical completed jobs older than 7 days
                except Exception:
                    pass

        items_with_images = []
        for item in doc.get("items", []):
            item_copy = dict(item)
            prod = None
            pid = item.get("product_id")
            if pid:
                try:
                    prod = await db.products.find_one({"_id": ObjectId(pid)})
                except Exception:
                    pass
            if not prod:
                prod = await db.products.find_one({"name": item.get("name")})

            if prod and prod.get("images"):
                item_copy["images"] = prod["images"]
            else:
                single_img = item.get("image")
                if single_img:
                    item_copy["images"] = [single_img]
                else:
                    item_copy["images"] = [
                        "/api/uploads/blueprints/blueprint_profile.png",
                        "/api/uploads/blueprints/blueprint_top.png",
                        "/api/uploads/blueprints/blueprint_sole.png",
                        "/api/uploads/blueprints/blueprint_quarter.png"
                    ]
            items_with_images.append(item_copy)

        # Secure dynamic filters based on confirmation and stage progress
        is_confirmed = doc.get("vendor_confirmed", False)
        stage = doc.get("current_stage", "order_received")
        
        # Customer details displayed ONLY when ready for dispatch
        show_customer = is_confirmed and stage in ["ready_to_ship", "delivered"]
        
        filtered_customer_name = doc.get("customer_name", "") if show_customer else ("Confidential (Awaiting Acceptance)" if not is_confirmed else "Confidential (In Production)")
        filtered_customer_email = doc.get("customer_email", "") if show_customer else "Hidden"
        filtered_shipping_address = doc.get("shipping_address", {}) if show_customer else {}
        
        # Order specifications displayed ONLY when order is confirmed/accepted
        if is_confirmed:
            filtered_tech_pack = doc.get("tech_pack", {})
        else:
            raw_tp = doc.get("tech_pack", {})
            filtered_tech_pack = {
                "material_specs": raw_tp.get("material_specs", []),
                "measurements": {},
                "design_notes": "",
                "color_code": "",
                "construction": "",
                "last_type": "",
                "special_instructions": ""
            }

        job = {
            "id": str(doc["_id"]),
            "order_number": doc.get("order_number", "") if is_confirmed else f"COBBLYN-W-{str(doc['_id'])[-5:].upper()}",

            "customer_name": filtered_customer_name,
            "customer_email": filtered_customer_email,
            "items": items_with_images,
            "shipping_address": filtered_shipping_address,
            "priority": doc.get("priority", "normal"),
            "status": doc.get("status", "in_progress"),
            "current_stage": stage,
            "stages": doc.get("stages", []),
            "tech_pack": filtered_tech_pack,
            "vendor_confirmed": is_confirmed,
            "assigned_at": doc.get("assigned_at"),
            "vendor_confirmed_at": doc.get("vendor_confirmed_at"),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at")
        }
        jobs.append(job)

    return {
        "vendor": {
            "name": vendor["name"],
            "contact_person": vendor["contact_person"],
            "email": vendor["email"],
            "phone": vendor["phone"],
            "address": vendor.get("address", ""),
            "specialty": vendor.get("specialty", []),
        },
        "jobs": jobs
    }


@router.post("/{token}/jobs/{job_id}/confirm")
async def confirm_vendor_job(token: str, job_id: str):
    """
    Allows vendor to confirm receipt and crafting commission for an order within the 12h SLA window.
    """
    vendor = await db.vendors.find_one({"portal_token": token, "active": True})
    if not vendor:
        raise HTTPException(status_code=401, detail="Unauthorized access token")

    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.production_jobs.find_one({"_id": oid, "crafted_by": "vendor", "fulfillment_vendor": vendor["name"]})
    if not job:
        raise HTTPException(status_code=404, detail="Assigned production job not found")

    if job.get("vendor_confirmed"):
        return {"message": "Job already confirmed", "vendor_confirmed": True}

    assigned_at_str = job.get("assigned_at")
    if assigned_at_str:
        assigned_at = datetime.fromisoformat(assigned_at_str)
        now = datetime.now(timezone.utc)
        diff = now - assigned_at
        if diff.total_seconds() > 12 * 3600:
            from routes.production import resolve_sla_reversions
            await resolve_sla_reversions(db)
            raise HTTPException(status_code=400, detail="Confirmation window expired (12h SLA missed). Reverted to In-House.")

    now_iso = datetime.now(timezone.utc).isoformat()
    await db.production_jobs.update_one(
        {"_id": oid},
        {
            "$set": {
                "vendor_confirmed": True,
                "vendor_confirmed_at": now_iso,
                "updated_at": now_iso
            },
            "$push": {
                "activity_log": {
                    "action": f"Crafting order confirmed by vendor '{vendor['name']}'",
                    "by": "Vendor Workshop",
                    "timestamp": now_iso
                }
            }
        }
    )

    if job.get("order_id"):
        await db.orders.update_one(
            {"_id": ObjectId(str(job["order_id"]))},
            {
                "$push": {
                    "status_history": {
                        "status": "in_production",
                        "timestamp": now_iso,
                        "note": f"Crafting order received and confirmed by partner workshop '{vendor['name']}'."
                    }
                }
            }
        )

    # Check if a vendor ledger entry already exists for this order, create one if not!
    # Upfront vendor cost could be set, let's use a dummy crafting fee (e.g. INR 4500.0)
    existing_ledger = await db.vendor_ledgers.find_one({"order_id": job["order_id"]})
    if not existing_ledger:
        ledger_doc = {
            "vendor_id": vendor["_id"],
            "vendor_name": vendor["name"],
            "order_id": job["order_id"],
            "order_number": job.get("order_number", ""),
            "amount_due": 4500.0,
            "amount_paid": 0.0,
            "payment_status": "pending",
            "payments": [],
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await db.vendor_ledgers.insert_one(ledger_doc)

    return {"message": "Crafting order confirmed successfully", "vendor_confirmed": True}


@router.post("/{token}/jobs/{job_id}/reject")
async def reject_vendor_job(token: str, job_id: str, payload: Optional[RejectPayload] = None):
    """
    Allows vendor to actively reject/decline receipt of a crafting commission before 12h SLA.
    Instantly reverts the active job and parent order back to the in-house queue.
    """
    vendor = await db.vendors.find_one({"portal_token": token, "active": True})
    if not vendor:
        raise HTTPException(status_code=401, detail="Unauthorized access token")

    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.production_jobs.find_one({"_id": oid, "crafted_by": "vendor", "fulfillment_vendor": vendor["name"]})
    if not job:
        raise HTTPException(status_code=404, detail="Assigned production job not found")

    if job.get("vendor_confirmed"):
        raise HTTPException(status_code=400, detail="Job is already confirmed and in production; cannot reject now.")

    reason_str = "No reason specified"
    details_str = ""
    if payload:
        reason_str = payload.reason or "No reason specified"
        details_str = payload.details or ""

    reason_log = f" Reason: {reason_str}"
    if details_str:
        reason_log += f" ({details_str})"

    now_iso = datetime.now(timezone.utc).isoformat()

    await db.production_jobs.update_one(
        {"_id": oid},
        {
            "$set": {
                "crafted_by": "inhouse",
                "fulfillment_vendor": None,
                "assigned_at": None,
                "vendor_confirmed": False,
                "vendor_confirmed_at": None,
                "current_stage": "order_received",
                "updated_at": now_iso
            },
            "$push": {
                "activity_log": {
                    "action": f"Crafting order actively REJECTED by vendor '{vendor['name']}'. Reverted to In-House.{reason_log}",
                    "by": f"Vendor ({vendor['name']})",
                    "timestamp": now_iso
                }
            }
        }
    )

    job_doc = await db.production_jobs.find_one({"_id": oid})
    if job_doc and job_doc.get("stages"):
        stages = job_doc["stages"]
        for idx, s in enumerate(stages):
            s["status"] = "in_progress" if s["name"] == "order_received" else "pending"
            s["started_at"] = now_iso if s["name"] == "order_received" else None
            s["completed_at"] = None
        await db.production_jobs.update_one(
            {"_id": oid},
            {"$set": {"stages": stages}}
        )

    order_id = job.get("order_id")
    if order_id:
        await db.orders.update_one(
            {"_id": ObjectId(str(order_id))},
            {
                "$set": {
                    "crafted_by": "inhouse",
                    "fulfillment_vendor": None,
                    "updated_at": now_iso
                },
                "$push": {
                    "status_history": {
                        "status": "confirmed",
                        "timestamp": now_iso,
                        "note": f"Crafting assignment declined by vendor '{vendor['name']}'. Reverted back to In-House production queue.{reason_log}"
                    }
                }
            }
        )

    return {"message": "Order successfully declined and reverted to in-house queue", "rejected": True}


@router.put("/{token}/jobs/{job_id}/stage")
async def update_vendor_job_stage(token: str, job_id: str, data: StageUpdate):
    """
    Updates the production job stage progress from the craftsman's workshop portal.
    Syncs automatically with parent order status and completes preceding milestones.
    """
    vendor = await db.vendors.find_one({"portal_token": token, "active": True})
    if not vendor:
        raise HTTPException(status_code=401, detail="Unauthorized access token")

    from routes.production import STAGE_NAMES
    if data.stage not in STAGE_NAMES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {STAGE_NAMES}")

    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    doc = await db.production_jobs.find_one({"_id": oid, "crafted_by": "vendor", "fulfillment_vendor": vendor["name"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Assigned production job not found")

    if not doc.get("vendor_confirmed"):
        raise HTTPException(status_code=400, detail="Please confirm order receipt before advancing stages")

    stages = doc.get("stages", [])
    now = datetime.now(timezone.utc).isoformat()

    target_idx = STAGE_NAMES.index(data.stage)
    for idx, s in enumerate(stages):
        if idx < target_idx:
            if s["status"] != "completed":
                s["status"] = "completed"
                s["started_at"] = s.get("started_at") or now
                s["completed_at"] = s.get("completed_at") or now
        elif idx == target_idx:
            s["status"] = data.status
            if data.status == "in_progress":
                s["started_at"] = s.get("started_at") or now
            elif data.status == "completed":
                s["started_at"] = s.get("started_at") or now
                s["completed_at"] = now
            if data.notes:
                s["notes"] = data.notes

    current_stage = "delivered"
    job_status = "in_progress"
    for s in stages:
        if s["status"] != "completed" and s["status"] != "skipped":
            current_stage = s["name"]
            break
    else:
        job_status = "completed"

    activity_entry = {
        "action": f"Stage '{data.stage}' marked as {data.status} via Vendor Portal",
        "by": f"Vendor Workshop ({vendor['name']})",
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
        {"_id": oid},
        {"$set": update_fields, "$push": {"activity_log": activity_entry}}
    )

    order_id = doc.get("order_id")
    if order_id:
        safe_oid = ObjectId(str(order_id))
        if data.stage == "quality_check" and data.status == "completed":
            await db.orders.update_one(
                {"_id": safe_oid},
                {
                    "$set": {"status": "shipped", "updated_at": now},
                    "$push": {"status_history": {
                        "status": "shipped",
                        "timestamp": now,
                        "note": f"Crafting Quality Check completed by vendor '{vendor['name']}'. Dispatched to customer."
                    }}
                }
            )
        elif data.stage == "ready_to_ship" and data.status == "completed":
            await db.orders.update_one(
                {"_id": safe_oid},
                {
                    "$set": {"status": "shipped", "updated_at": now},
                    "$push": {"status_history": {
                        "status": "shipped",
                        "timestamp": now,
                        "note": f"Order marked as dispatched by workshop '{vendor['name']}'."
                    }}
                }
            )
        elif data.stage == "delivered" and data.status == "completed":
            await db.orders.update_one(
                {"_id": safe_oid},
                {
                    "$set": {"status": "delivered", "updated_at": now},
                    "$push": {"status_history": {
                        "status": "delivered",
                        "timestamp": now,
                        "note": f"Order successfully delivered to customer by partner workshop '{vendor['name']}'."
                    }}
                }
            )

    return {"message": "Vendor job stage updated successfully", "current_stage": current_stage, "status": job_status}
