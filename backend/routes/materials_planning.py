from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/raw-materials", tags=["raw-materials"])

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


class MaterialInventoryUpdate(BaseModel):
    stock_level: Optional[float] = None
    reorder_point: Optional[float] = None
    cost_per_unit: Optional[float] = None
    supplier_name: Optional[str] = None
    unit: Optional[str] = None


class MaterialReceipt(BaseModel):
    material_id: str
    quantity: float
    cost_per_unit: float
    supplier_name: Optional[str] = None
    notes: Optional[str] = None


# ===== List Raw Materials Inventory =====
@router.get("")
async def list_raw_materials(
    request: Request,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),  # e.g., "low_stock"
    search: Optional[str] = Query(None)
):
    await require_admin(request)
    
    pipeline = [
        {"$lookup": {
            "from": "materials",
            "localField": "material_id",
            "foreignField": "_id",
            "as": "material_details"
        }},
        {"$unwind": {"path": "$material_details", "preserveNullAndEmptyArrays": True}}
    ]
    
    match_conditions = {}
    if category:
        match_conditions["material_details.category"] = category
    if status == "low_stock":
        match_conditions["$expr"] = {"$lte": ["$stock_level", "$reorder_point"]}
    if search:
        import re
        escaped_search = re.escape(search)
        match_conditions["$or"] = [
            {"name": {"$regex": escaped_search, "$options": "i"}},
            {"supplier_name": {"$regex": escaped_search, "$options": "i"}},
            {"material_details.type": {"$regex": escaped_search, "$options": "i"}}
        ]
        
    if match_conditions:
        pipeline.append({"$match": match_conditions})
        
    pipeline.append({"$project": {
        "id": {"$toString": "$_id"},
        "material_id": {"$toString": "$material_id"},
        "name": {"$ifNull": ["$name", "$material_details.name"]},
        "category": "$material_details.category",
        "type": "$material_details.type",
        "color_hex": "$material_details.color_hex",
        "supplier_name": 1,
        "stock_level": 1,
        "unit": 1,
        "reorder_point": 1,
        "cost_per_unit": 1,
        "is_low_stock": {"$cond": [{"$lte": ["$stock_level", "$reorder_point"]}, True, False]},
        "created_at": 1,
        "updated_at": 1
    }})
    
    pipeline.append({"$sort": {"name": 1}})
    
    items = await db.raw_materials_inventory.aggregate(pipeline).to_list(100)
    return {"materials": items}


# ===== Get Low Stock Reorder Alerts =====
@router.get("/alerts")
async def get_reorder_alerts(request: Request):
    await require_admin(request)
    
    pipeline = [
        {"$match": {"$expr": {"$lte": ["$stock_level", "$reorder_point"]}}},
        {"$lookup": {
            "from": "materials",
            "localField": "material_id",
            "foreignField": "_id",
            "as": "details"
        }},
        {"$unwind": "$details"},
        {"$project": {
            "id": {"$toString": "$_id"},
            "material_id": {"$toString": "$material_id"},
            "name": 1,
            "category": "$details.category",
            "supplier_name": 1,
            "stock_level": 1,
            "unit": 1,
            "reorder_point": 1,
            "cost_per_unit": 1
        }},
        {"$sort": {"stock_level": 1}}
    ]
    
    alerts = await db.raw_materials_inventory.aggregate(pipeline).to_list(100)
    return {"alerts": alerts, "count": len(alerts)}


# ===== Update Raw Material Tracking Details =====
@router.put("/{material_id}")
async def update_raw_material(material_id: str, data: MaterialInventoryUpdate, request: Request):
    user = await require_admin(request)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    try:
        query = {"_id": ObjectId(material_id)}
        res = await db.raw_materials_inventory.find_one(query)
    except Exception:
        res = None
        
    if not res:
        try:
            query = {"material_id": ObjectId(material_id)}
            res = await db.raw_materials_inventory.find_one(query)
        except Exception:
            raise HTTPException(status_code=404, detail="Raw material inventory document not found")
            
    if not res:
        raise HTTPException(status_code=404, detail="Raw material inventory document not found")
        
    await db.raw_materials_inventory.update_one({"_id": res["_id"]}, {"$set": update_data})
    
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="update_raw_material",
        target=material_id,
        details={"updated_fields": update_data}
    )
    return {"message": "Raw material inventory updated successfully"}


# ===== Log Material Receipt =====
@router.post("/receive")
async def receive_material_shipment(receipt: MaterialReceipt, request: Request):
    user = await require_admin(request)
    
    inv_doc = await db.raw_materials_inventory.find_one({"material_id": ObjectId(receipt.material_id)})
    if not inv_doc:
        mat_doc = await db.materials.find_one({"_id": ObjectId(receipt.material_id)})
        if not mat_doc:
            raise HTTPException(status_code=404, detail="Material design definition not found")
            
        inv_doc = {
            "material_id": ObjectId(receipt.material_id),
            "name": mat_doc.get("name"),
            "supplier_name": receipt.supplier_name or "General Craft Supplier",
            "stock_level": 0.0,
            "unit": "sq_ft" if mat_doc.get("category") == "leather" else "pieces",
            "reorder_point": 20.0,
            "cost_per_unit": receipt.cost_per_unit,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        res_ins = await db.raw_materials_inventory.insert_one(inv_doc)
        inv_doc["_id"] = res_ins.inserted_id
 
    current_stock = float(inv_doc.get("stock_level", 0.0))
    current_cost = float(inv_doc.get("cost_per_unit", 0.0))
    
    new_stock = round(current_stock + receipt.quantity, 2)
    if new_stock > 0 and current_stock >= 0:
        new_cost = round(((current_stock * current_cost) + (receipt.quantity * receipt.cost_per_unit)) / new_stock, 2)
    else:
        new_cost = receipt.cost_per_unit
        
    update_fields = {
        "stock_level": new_stock,
        "cost_per_unit": new_cost,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if receipt.supplier_name:
        update_fields["supplier_name"] = receipt.supplier_name
        
    await db.raw_materials_inventory.update_one({"_id": inv_doc["_id"]}, {"$set": update_fields})
    
    from auth_utils import log_security_event
    await log_security_event(
        db,
        actor_id=user["id"],
        actor_email=user["email"],
        action="receive_raw_material_shipment",
        target=receipt.material_id,
        details={
            "quantity": receipt.quantity,
            "cost_per_unit": receipt.cost_per_unit,
            "supplier_name": receipt.supplier_name,
            "notes": receipt.notes,
            "stock_after": new_stock
        }
    )
    return {"message": "Shipment received and stock catalog updated", "new_stock_level": new_stock, "average_unit_cost": new_cost}
