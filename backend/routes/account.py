from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
import secrets

from auth_utils import get_current_user, hash_password, verify_password, validate_password_strength

router = APIRouter(prefix="/api/account", tags=["account"])

db = None


def set_db(database):
    global db
    db = database


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class AddressCreate(BaseModel):
    label: str  # home, office, other
    name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    is_default: Optional[bool] = False


class PaymentMethodCreate(BaseModel):
    type: str  # card, upi
    label: str  # e.g. "HDFC Visa ending 4242"
    last4: Optional[str] = None
    card_brand: Optional[str] = None
    upi_id: Optional[str] = None
    is_default: Optional[bool] = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        validate_password_strength(v)
        return v



# ===== Profile =====

@router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])

    # Get addresses
    addresses = []
    cursor = db.addresses.find({"user_id": uid})
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.pop("user_id", None)
        addresses.append(doc)

    # Get payment methods
    payment_methods = []
    cursor = db.payment_methods.find({"user_id": uid})
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.pop("user_id", None)
        payment_methods.append(doc)

    # Order count
    order_count = await db.orders.count_documents({"user_id": uid})

    return {
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at", ""),
        "addresses": addresses,
        "payment_methods": payment_methods,
        "order_count": order_count
    }


@router.put("/profile")
async def update_profile(data: ProfileUpdate, request: Request):
    user = await get_current_user(request, db)
    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name.strip()
    if data.phone is not None:
        update_fields["phone"] = data.phone.strip()
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": update_fields}
    )
    return {"message": "Profile updated"}


# ===== Change Password =====

@router.post("/change-password")
async def change_password(data: ChangePasswordRequest, request: Request):
    user = await get_current_user(request, db)
    # Re-fetch with password_hash
    full_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not full_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(data.new_password)
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"password_hash": new_hash, "password_changed_at": now_iso}}
    )
    return {"message": "Password changed successfully"}


# ===== Addresses =====

@router.get("/addresses")
async def list_addresses(request: Request):
    user = await get_current_user(request, db)
    cursor = db.addresses.find({"user_id": ObjectId(user["_id"])})
    addresses = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.pop("user_id", None)
        addresses.append(doc)
    return {"addresses": addresses}


@router.post("/addresses")
async def add_address(data: AddressCreate, request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])

    # If setting as default, unset others
    if data.is_default:
        await db.addresses.update_many({"user_id": uid}, {"$set": {"is_default": False}})

    doc = {
        "user_id": uid,
        "label": data.label,
        "name": data.name,
        "phone": data.phone,
        "address_line1": data.address_line1,
        "address_line2": data.address_line2 or "",
        "city": data.city,
        "state": data.state,
        "pincode": data.pincode,
        "is_default": data.is_default or False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.addresses.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Address added"}


@router.put("/addresses/{address_id}")
async def update_address(address_id: str, data: AddressCreate, request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])

    existing = await db.addresses.find_one({"_id": ObjectId(address_id), "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Address not found")

    if data.is_default:
        await db.addresses.update_many({"user_id": uid}, {"$set": {"is_default": False}})

    await db.addresses.update_one(
        {"_id": ObjectId(address_id)},
        {"$set": {
            "label": data.label, "name": data.name, "phone": data.phone,
            "address_line1": data.address_line1, "address_line2": data.address_line2 or "",
            "city": data.city, "state": data.state, "pincode": data.pincode,
            "is_default": data.is_default or False
        }}
    )
    return {"message": "Address updated"}


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, request: Request):
    user = await get_current_user(request, db)
    result = await db.addresses.delete_one({"_id": ObjectId(address_id), "user_id": ObjectId(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted"}


# ===== Payment Methods =====

@router.get("/payment-methods")
async def list_payment_methods(request: Request):
    user = await get_current_user(request, db)
    cursor = db.payment_methods.find({"user_id": ObjectId(user["_id"])})
    methods = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.pop("user_id", None)
        methods.append(doc)
    return {"payment_methods": methods}


@router.post("/payment-methods")
async def add_payment_method(data: PaymentMethodCreate, request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])

    if data.is_default:
        await db.payment_methods.update_many({"user_id": uid}, {"$set": {"is_default": False}})

    doc = {
        "user_id": uid,
        "type": data.type,
        "label": data.label,
        "last4": data.last4 or "",
        "card_brand": data.card_brand or "",
        "upi_id": data.upi_id or "",
        "is_default": data.is_default or False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.payment_methods.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Payment method added"}


@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(method_id: str, request: Request):
    user = await get_current_user(request, db)
    result = await db.payment_methods.delete_one({"_id": ObjectId(method_id), "user_id": ObjectId(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return {"message": "Payment method deleted"}


# ===== Orders (Customer view) =====

@router.get("/orders")
async def list_my_orders(request: Request, status: Optional[str] = None, limit: int = 20, skip: int = 0):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])
    query = {"user_id": uid}
    if status:
        query["status"] = status

    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["user_id"] = str(doc["user_id"]) if isinstance(doc.get("user_id"), ObjectId) else doc.get("user_id", "")
        
        # Securely lookup matching production job from db.production_jobs
        try:
            prod_job = await db.production_jobs.find_one({"order_id": ObjectId(doc["id"])})
            if not prod_job:
                prod_job = await db.production_jobs.find_one({"order_id": doc["id"]})
        except Exception:
            prod_job = None
            
        if prod_job:
            doc["production_stages"] = prod_job.get("stages", [])
            doc["current_production_stage"] = prod_job.get("current_stage", "")
        else:
            doc["production_stages"] = []
            doc["current_production_stage"] = ""
            
        orders.append(doc)

    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}


@router.get("/orders/{order_id}")
async def get_my_order(order_id: str, request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])

    doc = await db.orders.find_one({"_id": ObjectId(order_id), "user_id": uid})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"]) if isinstance(doc.get("user_id"), ObjectId) else doc.get("user_id", "")
    
    # Securely lookup matching production job from db.production_jobs
    try:
        prod_job = await db.production_jobs.find_one({"order_id": ObjectId(doc["id"])})
        if not prod_job:
            prod_job = await db.production_jobs.find_one({"order_id": doc["id"]})
    except Exception:
        prod_job = None
        
    if prod_job:
        doc["production_stages"] = prod_job.get("stages", [])
        doc["current_production_stage"] = prod_job.get("current_stage", "")
    else:
        doc["production_stages"] = []
        doc["current_production_stage"] = ""

    return doc


@router.get("/orders/{order_id}/invoice")
async def get_order_invoice(order_id: str, request: Request):
    user = await get_current_user(request, db)
    uid = ObjectId(user["_id"])

    doc = await db.orders.find_one({"_id": ObjectId(order_id), "user_id": uid})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    # Build invoice data
    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in doc.get("items", []))
    gst = round(subtotal * 0.18, 2)
    total = doc.get("total_amount", subtotal + gst)

    invoice = {
        "invoice_number": f"INV-{doc.get('order_number', 'N/A')}",
        "order_number": doc.get("order_number", ""),
        "order_date": doc.get("created_at", ""),
        "customer_name": doc.get("customer_name", user.get("name", "")),
        "customer_email": doc.get("customer_email", user.get("email", "")),
        "shipping_address": doc.get("shipping_address", {}),
        "items": doc.get("items", []),
        "subtotal": subtotal,
        "gst": gst,
        "total": total,
        "payment_method": doc.get("payment_method", ""),
        "status": doc.get("status", ""),
        "company": {
            "name": "Cobblyn Shoes Pvt. Ltd.",
            "address": "123 Fashion Street, Mumbai, Maharashtra 400001",
            "gstin": "27AABCU9603R1ZM",
            "email": "orders@cobblyn.com",
            "phone": "+91 98765 43210"
        }
    }
    return invoice
