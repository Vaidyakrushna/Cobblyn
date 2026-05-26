from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/admin/audit-logs", tags=["admin-audit-logs"])

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


@router.get("")
async def get_audit_logs(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    await require_admin(request)
    
    query = {}
    if action:
        query["action"] = action
    if search:
        query["$or"] = [
            {"actor_email": {"$regex": search, "$options": "i"}},
            {"action": {"$regex": search, "$options": "i"}},
            {"target": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = db.security_audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
        
    total = await db.security_audit_logs.count_documents(query)
    
    return {"items": items, "total": total}
