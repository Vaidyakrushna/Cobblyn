from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/logistics", tags=["logistics"])

db = None

async def seed_courier_partners():
    count = await db.courier_partners.count_documents({})
    if count == 0:
        default_couriers = [
            {"name": "Shiprocket", "model": "prepaid", "wallet_balance": 5000.0, "outstanding_dues": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Delhivery", "model": "prepaid", "wallet_balance": 2500.0, "outstanding_dues": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "Blue Dart", "model": "postpaid", "wallet_balance": 0.0, "outstanding_dues": 0.0, "created_at": datetime.now(timezone.utc).isoformat()},
            {"name": "DHL Express", "model": "postpaid", "wallet_balance": 0.0, "outstanding_dues": 0.0, "created_at": datetime.now(timezone.utc).isoformat()}
        ]
        await db.courier_partners.insert_many(default_couriers)
        
        recharges = [
            {
                "expense_type": "logistics_payment",
                "amount": 5000.0,
                "expense_date": datetime.now(timezone.utc).isoformat(),
                "supplier_name": "Shiprocket",
                "notes": "Initial wallet balance seed",
                "gst_amount": 5000.0 - (5000.0 / 1.18)
            },
            {
                "expense_type": "logistics_payment",
                "amount": 2500.0,
                "expense_date": datetime.now(timezone.utc).isoformat(),
                "supplier_name": "Delhivery",
                "notes": "Initial wallet balance seed",
                "gst_amount": 2500.0 - (2500.0 / 1.18)
            }
        ]
        await db.procurement_expenses.insert_many(recharges)

def set_db(database):
    global db
    db = database
    import asyncio
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(seed_courier_partners())
    except RuntimeError:
        pass

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
    pickup_type: str = "factory"  # factory, vendor
    pickup_vendor_id: Optional[str] = None
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

class CourierCreate(BaseModel):
    name: str
    model: str  # prepaid, postpaid
    wallet_balance: Optional[float] = 0.0
    outstanding_dues: Optional[float] = 0.0

class CourierPay(BaseModel):
    amount: float
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
        
    pickup_vendor_name = None
    if payload.pickup_type == "vendor" and payload.pickup_vendor_id:
        v_id = payload.pickup_vendor_id
        vendor = await db.vendors.find_one({"_id": ObjectId(v_id) if ObjectId.is_valid(v_id) else v_id})
        if not vendor:
            vendor = await db.vendors.find_one({"id": v_id})
        if vendor:
            pickup_vendor_name = vendor.get("name")

    shipment_doc = {
        "order_id": order_id,
        "customer_name": order.get("shipping_address", {}).get("name", "Customer") if order else "Customer",
        "carrier_name": payload.carrier_name,
        "tracking_no": payload.tracking_no,
        "shipping_charges": payload.shipping_charges,
        "estimated_delivery": payload.estimated_delivery,
        "pickup_type": payload.pickup_type,
        "pickup_vendor_id": payload.pickup_vendor_id,
        "pickup_vendor_name": pickup_vendor_name,
        "status": "in_transit",
        "notes": payload.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "delivered_at": None
    }
    await db.outbound_shipments.insert_one(shipment_doc)
    
    # Adjust courier wallet/outstanding dues
    carrier = await db.courier_partners.find_one({"name": payload.carrier_name})
    if carrier:
        c_id = carrier.get("_id")
        c_model = carrier.get("model", "prepaid")
        charges = float(payload.shipping_charges or 0.0)
        if c_model == "prepaid":
            await db.courier_partners.update_one({"_id": c_id}, {"$inc": {"wallet_balance": -charges}})
        else:
            await db.courier_partners.update_one({"_id": c_id}, {"$inc": {"outstanding_dues": charges}})
    
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

# 5. Courier Partners & Billing Accounts
@router.get("/couriers")
async def list_couriers(request: Request):
    await require_admin(request)
    cursor = db.courier_partners.find({}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(serialize(doc))
    return {"couriers": results}

@router.post("/couriers")
async def create_courier(payload: CourierCreate, request: Request):
    await require_admin(request)
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.courier_partners.insert_one(doc)
    return {"message": "Courier partner created successfully."}

@router.post("/couriers/{courier_id}/pay")
async def pay_courier(courier_id: str, payload: CourierPay, request: Request):
    await require_admin(request)
    c_id = ObjectId(courier_id) if ObjectId.is_valid(courier_id) else courier_id
    
    courier = await db.courier_partners.find_one({"_id": c_id})
    if not courier:
        raise HTTPException(status_code=404, detail="Courier partner not found")
        
    c_model = courier.get("model", "prepaid")
    c_name = courier.get("name")
    
    expense_doc = {
        "expense_type": "logistics_payment",
        "amount": float(payload.amount),
        "expense_date": datetime.now(timezone.utc).isoformat(),
        "supplier_name": c_name,
        "notes": payload.notes or f"Logistics payment ({c_model.upper()})",
        "gst_amount": float(payload.amount) - (float(payload.amount) / 1.18)
    }
    await db.procurement_expenses.insert_one(expense_doc)
    
    if c_model == "prepaid":
        await db.courier_partners.update_one({"_id": c_id}, {"$inc": {"wallet_balance": float(payload.amount)}})
    else:
        await db.courier_partners.update_one({"_id": c_id}, {"$inc": {"outstanding_dues": -float(payload.amount)}})
        
    return {"message": f"Payment of {payload.amount} recorded for {c_name}."}
