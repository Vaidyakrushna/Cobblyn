"""Admin Users management — Super Admin can promote/demote staff and admins."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone
from permissions import ROLE_USER, ROLE_STAFF, ROLE_ADMIN, ROLE_SUPER_ADMIN, ADMIN_ROLES, has_permission

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

db = None


def set_db(database):
    global db
    db = database


async def _require_perm(request: Request, perm: str):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if not has_permission(user.get("role"), perm):
        raise HTTPException(403, f"Permission '{perm}' required")
    return user


def _ser(d):
    d["id"] = str(d.pop("_id"))
    d.pop("password", None)
    return d


class RoleUpdate(BaseModel):
    role: str  # user | staff | admin | super_admin


class BlockUpdate(BaseModel):
    blocked: bool


@router.get("")
async def list_users(request: Request):
    await _require_perm(request, "manage_users")
    cursor = db.users.find({}, {"password": 0}).sort("created_at", -1)
    return {"items": [_ser(d) async for d in cursor]}


@router.patch("/{user_id}/role")
async def update_role(user_id: str, payload: RoleUpdate, request: Request):
    actor = await _require_perm(request, "manage_users")
    valid = (ROLE_USER, ROLE_STAFF, ROLE_ADMIN, ROLE_SUPER_ADMIN)
    if payload.role not in valid:
        raise HTTPException(400, f"Role must be one of {valid}")
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "Invalid user id")
    if str(actor.get("id")) == user_id and payload.role != ROLE_SUPER_ADMIN:
        raise HTTPException(400, "Cannot demote yourself")
    res = await db.users.update_one({"_id": oid}, {"$set": {"role": payload.role,
                                                             "updated_at": datetime.now(timezone.utc).isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(404, "User not found")
        
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="update_user_role",
        target=user_id,
        details={"new_role": payload.role}
    )
    return {"message": "Role updated", "role": payload.role}


@router.patch("/{user_id}/block")
async def block_user(user_id: str, payload: BlockUpdate, request: Request):
    actor = await _require_perm(request, "block_customers")
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(400, "Invalid user id")
    res = await db.users.update_one({"_id": oid}, {"$set": {"blocked": payload.blocked,
                                                             "updated_at": datetime.now(timezone.utc).isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(404, "User not found")
        
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=actor["id"],
        actor_email=actor["email"],
        action="update_user_block_status",
        target=user_id,
        details={"blocked": payload.blocked}
    )
    return {"message": "Block status updated", "blocked": payload.blocked}
