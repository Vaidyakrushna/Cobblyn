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

class ExpenseCreate(BaseModel):
    item_name: str
    expense_type: str # material_procurement, product_purchase, accessories_purchase, other
    amount: float
    quantity: float
    supplier: Optional[str] = ""
    invoice_ref: Optional[str] = ""
    expense_date: Optional[str] = None

class PayrollDisburse(BaseModel):
    month: str # e.g. "August 2026"

def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc

# --- Endpoints ---

@router.get("/summary")
async def get_financial_summary(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    await require_admin(request)
    
    # 1. Total Sales and GST
    sales_query = {"status": {"$ne": "cancelled"}}
    if start_date or end_date:
        date_cond = {}
        if start_date:
            date_cond["$gte"] = start_date
        if end_date:
            date_cond["$lte"] = end_date
        sales_query["created_at"] = date_cond
        
    total_sales = 0.0
    total_gst = 0.0
    
    cursor = db.orders.find(sales_query)
    async for order in cursor:
        amt = float(order.get("total_amount", 0.0) or order.get("amount", 0.0))
        total_sales += amt
        gst = float(order.get("gst_amount", 0.0))
        if gst == 0.0 and amt > 0.0:
            # Fallback calculation if not stored
            gst = amt - (amt / 1.18)
        total_gst += gst
        
    # 2. Amount Given to Vendor (Fulfillment payouts)
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
        
    # 3. Dynamic Material procurement from raw materials inventory receipts
    mat_receipt_query = {}
    if start_date or end_date:
        date_cond = {}
        if start_date:
            date_cond["$gte"] = start_date
        if end_date:
            date_cond["$lte"] = end_date
        mat_receipt_query["timestamp"] = date_cond
        
    mat_receipts_cost = 0.0
    # Also sum manually logged expenses of type material_procurement
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
    other_expenses = 0.0
    
    cursor = db.procurement_expenses.find(expense_query)
    async for exp in cursor:
        etype = exp.get("expense_type")
        amt = float(exp.get("amount", 0.0))
        if etype == "material_procurement":
            material_expenses += amt
        elif etype == "product_purchase":
            product_expenses += amt
        elif etype == "accessories_purchase":
            accessory_expenses += amt
        else:
            other_expenses += amt
            
    # Add material receipt costs if any are logged in raw material logs
    # (Checking raw_materials_inventory cost summaries as well)
    cursor = db.raw_materials_inventory.find({})
    async for rm in cursor:
        stock = float(rm.get("stock_level", 0.0))
        cost = float(rm.get("cost_per_unit", 0.0))
        # Initial inventory cost estimation
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
        
    net_profit = total_sales - (vendor_payout_paid + material_expenses + product_expenses + accessory_expenses + other_expenses + total_payroll)
        
    return {
        "sales": {
            "total_sales": round(total_sales, 2),
            "cgst": round(total_gst / 2, 2),
            "sgst": round(total_gst / 2, 2),
            "total_gst": round(total_gst, 2)
        },
        "vendor_payouts": {
            "total_due": round(vendor_payout_due, 2),
            "total_paid": round(vendor_payout_paid, 2),
            "outstanding": round(vendor_payout_due - vendor_payout_paid, 2)
        },
        "expenses": {
            "material_procurement": round(material_expenses + mat_receipts_cost, 2),
            "product_purchase": round(product_expenses, 2),
            "accessories_purchase": round(accessory_expenses, 2),
            "payroll": round(total_payroll, 2),
            "other": round(other_expenses, 2),
            "total_expenses": round(material_expenses + mat_receipts_cost + product_expenses + accessory_expenses + total_payroll + other_expenses, 2)
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
    user = await require_admin(request)
    month = payload.month.strip()
    
    # Check if payroll already disbursed for this month
    already_disbursed = await db.payroll.find_one({"month": month})
    if already_disbursed:
        raise HTTPException(status_code=400, detail=f"Payroll has already been disbursed for {month}")
        
    # Get active employees
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
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.procurement_expenses.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc
