from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/logistics", tags=["logistics"])

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

def serialize(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

# --- Schemas ---

class HandoverCreate(BaseModel):
    workshop_id: str
    workshop_name: str
    material_id: str
    material_name: str
    quantity: float
    expected_return_date: Optional[str] = None
    notes: Optional[str] = ""

class HandoverComplete(BaseModel):
    yield_qty: Optional[float] = 0.0
    scrap_qty: Optional[float] = 0.0
    notes: Optional[str] = ""

class OutboundRegister(BaseModel):
    carrier_name: str
    tracking_no: str
    shipping_charges: Optional[float] = 0.0
    estimated_delivery: Optional[str] = None
    notes: Optional[str] = ""

class InboundCreate(BaseModel):
    supplier_name: str
    item_name: str
    quantity: float
    expected_delivery_date: Optional[str] = None
    notes: Optional[str] = ""
    material_id: Optional[str] = None

class ReturnCreate(BaseModel):
    order_id: str
    customer_name: str
    reason: str
    fit_adjustments: Optional[str] = ""
    notes: Optional[str] = ""

# --- Endpoints ---

@router.get("/summary")
async def get_logistics_summary(request: Request):
    await require_admin(request)
    
    active_handovers_count = await db.artisan_handovers.count_documents({"status": "at_workshop"})
    in_transit_shipments_count = await db.outbound_shipments.count_documents({"status": "in_transit"})
    pending_returns_count = await db.reverse_logistics.count_documents({"status": {"$in": ["registered", "in_transit"]}})
    pending_inbound_count = await db.inbound_consignments.count_documents({"status": "in_transit"})
    
    return {
        "active_handovers": active_handovers_count,
        "in_transit_shipments": in_transit_shipments_count,
        "pending_returns": pending_returns_count,
        "pending_inbound": pending_inbound_count
    }

# 1. Artisan Handovers
@router.get("/handovers")
async def get_handovers(request: Request):
    await require_admin(request)
    cursor = db.artisan_handovers.find({}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(serialize(doc))
    return {"handovers": results}

@router.post("/handovers")
async def create_handover(handover: HandoverCreate, request: Request):
    await require_admin(request)
    doc = handover.model_dump()
    doc["status"] = "at_workshop"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["completed_at"] = None
    doc["yield_qty"] = 0.0
    doc["scrap_qty"] = 0.0
    await db.artisan_handovers.insert_one(doc)
    return {"message": "Artisan material handover logged successfully."}

@router.put("/handovers/{id}/complete")
async def complete_handover(id: str, payload: HandoverComplete, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid handover ID")
    
    update_data = {
        "status": "returned",
        "yield_qty": payload.yield_qty,
        "scrap_qty": payload.scrap_qty,
        "notes_completion": payload.notes,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.artisan_handovers.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Handover record not found")
    return {"message": "Artisan material handover marked as returned."}

# 2. Outbound Shipments
@router.get("/shipments")
async def get_shipments(request: Request):
    await require_admin(request)
    cursor = db.outbound_shipments.find({}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(serialize(doc))
    return {"shipments": results}

@router.post("/shipments/{order_id}")
async def register_shipment(order_id: str, payload: OutboundRegister, request: Request):
    await require_admin(request)
    order = await db.orders.find_one({"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else order_id})
    if not order:
        order = await db.orders.find_one({"id": order_id})
        
    shipment_doc = {
        "order_id": order_id,
        "customer_name": order.get("shipping_address", {}).get("name", "Customer") if order else "Customer",
        "carrier_name": payload.carrier_name,
        "tracking_no": payload.tracking_no,
        "shipping_charges": payload.shipping_charges,
        "estimated_delivery": payload.estimated_delivery,
        "status": "in_transit",
        "notes": payload.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "delivered_at": None
    }
    await db.outbound_shipments.insert_one(shipment_doc)
    
    query_id = ObjectId(order_id) if ObjectId.is_valid(order_id) else order_id
    await db.orders.update_one(
        {"_id": query_id},
        {"$set": {"status": "shipped", "tracking_number": payload.tracking_no, "carrier": payload.carrier_name}}
    )
    return {"message": f"Shipment tracking registered. Order {order_id} marked as Shipped."}

@router.put("/shipments/{id}/status")
async def update_shipment_status(id: str, status: str, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid shipment ID")
    
    update_data = {"status": status}
    if status == "delivered":
        update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
        
    shipment = await db.outbound_shipments.find_one({"_id": ObjectId(id)})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    await db.outbound_shipments.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    
    if status == "delivered":
        order_id = shipment.get("order_id")
        query_id = ObjectId(order_id) if ObjectId.is_valid(order_id) else order_id
        await db.orders.update_one(
            {"_id": query_id},
            {"$set": {"status": "delivered"}}
        )
        
    return {"message": "Shipment status updated successfully."}

# 3. Inbound Shipments
@router.get("/inbound")
async def get_inbound_consignments(request: Request):
    await require_admin(request)
    cursor = db.inbound_consignments.find({}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(serialize(doc))
    return {"inbound": results}

@router.post("/inbound")
async def create_inbound(inbound: InboundCreate, request: Request):
    await require_admin(request)
    doc = inbound.model_dump()
    doc["status"] = "in_transit"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["received_at"] = None
    await db.inbound_consignments.insert_one(doc)
    return {"message": "Inbound consignment shipment logged."}

@router.put("/inbound/{id}/receive")
async def receive_inbound(id: str, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid inbound ID")
        
    consignment = await db.inbound_consignments.find_one({"_id": ObjectId(id)})
    if not consignment:
        raise HTTPException(status_code=404, detail="Consignment not found")
        
    await db.inbound_consignments.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "received",
            "received_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    mat_id = consignment.get("material_id")
    qty = consignment.get("quantity")
    if mat_id and qty:
        await db.raw_materials_inventory.update_one(
            {"material_id": mat_id},
            {"$inc": {"stock_level": qty}}
        )
        
    return {"message": "Consignment received and stock levels updated successfully."}

# 4. Reverse Logistics
@router.get("/returns")
async def get_returns(request: Request):
    await require_admin(request)
    cursor = db.reverse_logistics.find({}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(serialize(doc))
    return {"returns": results}

@router.post("/returns")
async def create_return(ret: ReturnCreate, request: Request):
    await require_admin(request)
    doc = ret.model_dump()
    doc["status"] = "registered"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["completed_at"] = None
    await db.reverse_logistics.insert_one(doc)
    return {"message": "Return case registered."}

@router.put("/returns/{id}/status")
async def update_return_status(id: str, status: str, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid return ID")
        
    update_data = {"status": status}
    if status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        
    result = await db.reverse_logistics.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Return record not found")
    return {"message": "Return status updated successfully."}
