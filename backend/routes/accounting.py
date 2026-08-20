from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/accounting", tags=["accounting"])

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

# --- Schemas ---
class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: str
    role: str
    salary: float
    join_date: Optional[str] = None
    bank_name: Optional[str] = ""
    account_no: Optional[str] = ""
    ifsc_code: Optional[str] = ""
    address: Optional[str] = ""
    dob: Optional[str] = ""
    education: Optional[str] = ""
    aadhaar_no: Optional[str] = ""
    pan_no: Optional[str] = ""
    emergency_name: Optional[str] = ""
    emergency_phone: Optional[str] = ""

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[str] = None
    bank_name: Optional[str] = None
    account_no: Optional[str] = None
    ifsc_code: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None
    education: Optional[str] = None
    aadhaar_no: Optional[str] = None
    pan_no: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None

class EmployeeExit(BaseModel):
    exit_date: str
    fnf_amount: float
    notes: Optional[str] = ""

class AssetCreate(BaseModel):
    asset_type: str  # corporate_email, laptop, tools, other
    name: str
    serial_no: Optional[str] = ""
    assigned_date: Optional[str] = None

class ExpenseCreate(BaseModel):
    item_name: str
    expense_type: str  # material_procurement, product_purchase, accessories_purchase, other
    amount: float      # Total amount paid (including GST)
    gst_rate: Optional[float] = 18.0
    quantity: float
    supplier: Optional[str] = ""
    invoice_ref: Optional[str] = ""
    expense_date: Optional[str] = None
    material_id: Optional[str] = None  # Linkage to raw material inventory

class PayrollDisburse(BaseModel):
    month: str  # e.g. "August 2026"

def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    if "material_id" in doc and isinstance(doc["material_id"], ObjectId):
        doc["material_id"] = str(doc["material_id"])
    return doc

# --- Endpoints ---

@router.get("/summary")
async def get_financial_summary(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    await require_admin(request)
    
    # 1. Total Sales and Output GST
    sales_query = {"status": {"$ne": "cancelled"}}
    if start_date or end_date:
        date_cond = {}
        if start_date:
            date_cond["$gte"] = start_date
        if end_date:
            date_cond["$lte"] = end_date
        sales_query["created_at"] = date_cond
        
    total_sales = 0.0
    output_gst = 0.0
    
    cursor = db.orders.find(sales_query)
    async for order in cursor:
        amt = float(order.get("total_amount", 0.0) or order.get("amount", 0.0))
        total_sales += amt
        gst = float(order.get("gst_amount", 0.0))
        if gst == 0.0 and amt > 0.0:
            gst = amt - (amt / 1.18)
        output_gst += gst
        
    # 2. Amount Given to Vendor (Fulfillment payouts) & Input Vendor GST
    payout_query = {}
    if start_date or end_date:
        date_cond = {}
        if start_date:
            date_cond["$gte"] = start_date
        if end_date:
            date_cond["$lte"] = end_date
        payout_query["created_at"] = date_cond
        
    vendor_payout_due = 0.0
    vendor_payout_paid = 0.0
    
    cursor = db.vendor_ledgers.find(payout_query)
    async for ledger in cursor:
        vendor_payout_due += float(ledger.get("amount_due", 0.0))
        vendor_payout_paid += float(ledger.get("amount_paid", 0.0))
        
    vendor_gst_paid = vendor_payout_paid - (vendor_payout_paid / 1.18)
        
    # 3. Procurement Expenses & Input Procurement GST
    expense_query = {}
    if start_date or end_date:
        date_cond = {}
        if start_date:
            date_cond["$gte"] = start_date
        if end_date:
            date_cond["$lte"] = end_date
        expense_query["expense_date"] = date_cond
        
    material_expenses = 0.0
    product_expenses = 0.0
    accessory_expenses = 0.0
    logistics_expenses = 0.0
    other_expenses = 0.0
    procurement_gst_paid = 0.0
    
    cursor = db.procurement_expenses.find(expense_query)
    async for exp in cursor:
        etype = exp.get("expense_type")
        amt = float(exp.get("amount", 0.0))
        
        # Calculate GST for each expense
        g_amt = exp.get("gst_amount")
        if g_amt is None:
            g_amt = amt - (amt / 1.18)
        procurement_gst_paid += float(g_amt)
        
        if etype == "material_procurement":
            material_expenses += amt
        elif etype == "product_purchase":
            product_expenses += amt
        elif etype == "accessories_purchase":
            accessory_expenses += amt
        elif etype == "logistics_payment":
            logistics_expenses += amt
        else:
            other_expenses += amt
            
    # Add raw materials inventory current value check
    mat_receipts_cost = 0.0
    cursor = db.raw_materials_inventory.find({})
    async for rm in cursor:
        stock = float(rm.get("stock_level", 0.0))
        cost = float(rm.get("cost_per_unit", 0.0))
        mat_receipts_cost += (stock * cost)
        
    # 4. Payroll Total
    payroll_query = {}
    if start_date or end_date:
        date_cond = {}
        if start_date:
            date_cond["$gte"] = start_date
        if end_date:
            date_cond["$lte"] = end_date
        payroll_query["paid_at"] = date_cond
    
    total_payroll = 0.0
    cursor = db.payroll.find(payroll_query)
    async for pay in cursor:
        total_payroll += float(pay.get("amount", 0.0))
        
    total_input_gst = vendor_gst_paid + procurement_gst_paid
    net_gst_payable = output_gst - total_input_gst
    
    # Internal vs External Cost Centers
    internal_factory_cost = material_expenses + total_payroll + mat_receipts_cost
    external_vendor_cost = vendor_payout_paid
    
    net_profit = total_sales - (vendor_payout_paid + material_expenses + product_expenses + accessory_expenses + logistics_expenses + other_expenses + total_payroll)
        
    return {
        "sales": {
            "total_sales": round(total_sales, 2),
            "output_gst": round(output_gst, 2),
            "cgst": round(output_gst / 2, 2),
            "sgst": round(output_gst / 2, 2)
        },
        "vendor_payouts": {
            "total_due": round(vendor_payout_due, 2),
            "total_paid": round(vendor_payout_paid, 2),
            "outstanding": round(vendor_payout_due - vendor_payout_paid, 2)
        },
        "gst_ledger": {
            "output_gst": round(output_gst, 2),
            "input_gst_procurement": round(procurement_gst_paid, 2),
            "input_gst_vendors": round(vendor_gst_paid, 2),
            "total_input_gst": round(total_input_gst, 2),
            "net_gst_payable": round(net_gst_payable, 2),
            "has_credit": net_gst_payable < 0
        },
        "cost_centers": {
            "internal_factory": round(internal_factory_cost, 2),
            "external_vendors": round(external_vendor_cost, 2)
        },
        "expenses": {
            "material_procurement": round(material_expenses + mat_receipts_cost, 2),
            "product_purchase": round(product_expenses, 2),
            "accessories_purchase": round(accessory_expenses, 2),
            "payroll": round(total_payroll, 2),
            "logistics": round(logistics_expenses, 2),
            "other": round(other_expenses, 2),
            "total_expenses": round(material_expenses + mat_receipts_cost + product_expenses + accessory_expenses + total_payroll + logistics_expenses + other_expenses, 2)
        },
        "net_profit": round(net_profit, 2)
    }

# --- Employee Management ---

@router.get("/employees")
async def list_employees(request: Request):
    await require_admin(request)
    cursor = db.employees.find({}).sort("name", 1)
    employees = []
    async for emp in cursor:
        employees.append(serialize(emp))
    return {"employees": employees}

@router.post("/employees")
async def create_employee(emp: EmployeeCreate, request: Request):
    await require_admin(request)
    doc = emp.model_dump()
    doc["status"] = "active"
    doc["join_date"] = doc["join_date"] or datetime.now(timezone.utc).isoformat()[:10]
    
    # Auto-generate sequential Employee ID
    count = await db.employees.count_documents({})
    emp_id_num = count + 1
    doc["employee_id"] = f"COB-EMP-{emp_id_num:03d}"
    
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.employees.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@router.put("/employees/{id}")
async def update_employee(id: str, updates: EmployeeUpdate, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.employees.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee details updated successfully"}

@router.post("/employees/{id}/exit")
async def settle_employee_exit(id: str, exit_payload: EmployeeExit, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid employee ID")
        
    emp = await db.employees.find_one({"_id": ObjectId(id)})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if emp.get("status") == "exited":
        raise HTTPException(status_code=400, detail="Employee has already exited")
        
    # Log FnF payment into expenses
    if exit_payload.fnf_amount > 0:
        fnf_expense = {
            "item_name": f"Full & Final Settlement for {emp['name']} ({emp.get('employee_id', 'N/A')})",
            "expense_type": "other",
            "amount": exit_payload.fnf_amount,
            "gst_rate": 0.0,
            "base_amount": exit_payload.fnf_amount,
            "gst_amount": 0.0,
            "quantity": 1.0,
            "supplier": "Internal Corporate HR",
            "invoice_ref": f"FNF-{id[:6].upper()}",
            "expense_date": exit_payload.exit_date,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.procurement_expenses.insert_one(fnf_expense)
        
    # Settle all unreturned assets
    assets = emp.get("assets", [])
    for asset in assets:
        if asset.get("status") == "assigned":
            if asset.get("asset_type") == "corporate_email":
                asset["status"] = "closed"
            else:
                asset["status"] = "recovered"
            asset["returned_date"] = exit_payload.exit_date

    # Update employee details
    update_data = {
        "status": "exited",
        "exit_date": exit_payload.exit_date,
        "fnf_settled": True,
        "fnf_amount": exit_payload.fnf_amount,
        "exit_notes": exit_payload.notes,
        "assets": assets,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.employees.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    return {"message": f"Full & Final exit settlement completed for {emp['name']}. Assigned corporate emails closed and assets recovered."}

@router.post("/employees/{id}/assets")
async def assign_employee_asset(id: str, asset: AssetCreate, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid employee ID")
        
    emp = await db.employees.find_one({"_id": ObjectId(id)})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    doc = asset.model_dump()
    doc["status"] = "assigned"
    doc["assigned_date"] = doc["assigned_date"] or datetime.now(timezone.utc).isoformat()[:10]
    
    await db.employees.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"assets": doc}}
    )
    return {"message": f"Asset '{asset.name}' assigned to {emp['name']} successfully."}

@router.put("/employees/{id}/assets/{index}")
async def update_employee_asset(id: str, index: int, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid employee ID")
        
    emp = await db.employees.find_one({"_id": ObjectId(id)})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    assets = emp.get("assets", [])
    if index < 0 or index >= len(assets):
        raise HTTPException(status_code=400, detail="Invalid asset index")
        
    asset = assets[index]
    if asset.get("asset_type") == "corporate_email":
        asset["status"] = "closed" if asset["status"] == "assigned" else "assigned"
    else:
        asset["status"] = "recovered" if asset["status"] == "assigned" else "assigned"
        
    asset["returned_date"] = datetime.now(timezone.utc).isoformat()[:10] if asset["status"] in ("recovered", "closed") else None
    
    await db.employees.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"assets": assets}}
    )
    return {"message": "Asset status updated successfully.", "asset": asset}

@router.delete("/employees/{id}")
async def delete_employee(id: str, request: Request):
    await require_admin(request)
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    result = await db.employees.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}

# --- Payroll Processing ---

@router.get("/payroll")
async def get_payroll_history(request: Request):
    await require_admin(request)
    cursor = db.payroll.find({}).sort("paid_at", -1)
    history = []
    async for p in cursor:
        history.append(serialize(p))
    return {"payroll_history": history}

@router.post("/payroll/disburse")
async def disburse_monthly_payroll(payload: PayrollDisburse, request: Request):
    await require_admin(request)
    month = payload.month.strip()
    
    # Check if payroll already disbursed for this month
    already_disbursed = await db.payroll.find_one({"month": month})
    if already_disbursed:
        raise HTTPException(status_code=400, detail=f"Payroll has already been disbursed for {month}")
        
    # Query strictly active employees
    cursor = db.employees.find({"status": "active"})
    employees = await cursor.to_list(100)
    if not employees:
        raise HTTPException(status_code=400, detail="No active employees found to disburse payroll")
        
    disbursed_records = []
    for emp in employees:
        txn_ref = "PAYROLL-" + uuid_hash()
        record = {
            "employee_id": ObjectId(emp["_id"]),
            "employee_name": emp["name"],
            "role": emp["role"],
            "month": month,
            "amount": float(emp["salary"]),
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "txn_ref": txn_ref
        }
        await db.payroll.insert_one(record)
        disbursed_records.append(serialize(record))
        
    return {"message": f"Successfully disbursed payroll to {len(employees)} employees for {month}", "records": disbursed_records}

def uuid_hash():
    import uuid
    return uuid.uuid4().hex[:8].upper()

# --- Expenses Management ---

@router.get("/expenses")
async def list_expenses(request: Request):
    await require_admin(request)
    cursor = db.procurement_expenses.find({}).sort("expense_date", -1)
    expenses = []
    async for exp in cursor:
        expenses.append(serialize(exp))
    return {"expenses": expenses}

@router.post("/expenses")
async def create_expense(expense: ExpenseCreate, request: Request):
    await require_admin(request)
    doc = expense.model_dump()
    doc["expense_date"] = doc["expense_date"] or datetime.now(timezone.utc).isoformat()
    
    # Calculate tax details
    gst_rate = float(doc.get("gst_rate", 18.0) or 18.0)
    doc["base_amount"] = round(doc["amount"] / (1 + (gst_rate / 100)), 2)
    doc["gst_amount"] = round(doc["amount"] - doc["base_amount"], 2)
    
    if doc.get("material_id"):
        doc["material_id"] = ObjectId(doc["material_id"])
        
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.procurement_expenses.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    if "material_id" in doc:
        doc["material_id"] = str(doc["material_id"])
        
    # Synchronize Raw Materials Inventory if material_procurement
    if doc.get("expense_type") == "material_procurement" and doc.get("material_id"):
        mat_id = doc["material_id"]
        inv_doc = await db.raw_materials_inventory.find_one({"material_id": ObjectId(mat_id)})
        if inv_doc:
            current_stock = float(inv_doc.get("stock_level", 0.0))
            current_cost = float(inv_doc.get("cost_per_unit", 0.0))
            quantity_added = float(doc.get("quantity", 1.0))
            
            new_stock = round(current_stock + quantity_added, 2)
            cost_per_unit_procured = doc["base_amount"] / quantity_added if quantity_added > 0 else 0.0
            
            if new_stock > 0 and current_stock >= 0:
                new_cost = round(((current_stock * current_cost) + (quantity_added * cost_per_unit_procured)) / new_stock, 2)
            else:
                new_cost = cost_per_unit_procured
                
            await db.raw_materials_inventory.update_one(
                {"_id": inv_doc["_id"]},
                {
                    "$set": {
                        "stock_level": new_stock,
                        "cost_per_unit": new_cost,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
    return doc
