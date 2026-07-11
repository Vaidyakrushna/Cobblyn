import os
import asyncio
from datetime import datetime, timezone
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('.env')

async def create_dummy_order():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]

    # Get the admin user or create a test user
    user = await db.users.find_one({"email": "admin@cobblyn.com"})
    if not user:
        print("No admin user found, finding any user...")
        user = await db.users.find_one({})
    
    if not user:
        print("No users found in database.")
        return

    # Find a product to add to the order
    product = await db.products.find_one({})
    
    order_number = f"BYD-TEST-{random.randint(1000, 9999)}"
    
    dummy_order = {
        "order_number": order_number,
        "user_id": user["_id"],
        "customer_name": user.get("name", "Test User"),
        "customer_email": user.get("email", "admin@cobblyn.com"),
        "items": [
            {
                "product_id": str(product["_id"]),
                "name": product["name"],
                "size": "8",
                "color": "Black",
                "quantity": 1,
                "price": float(product["price"])
            }
        ],
        "shipping_address": {
            "name": "Dummy Recipient",
            "phone": "9876543210",
            "address": "123 Dummy Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        },
        "payment_method": "cod",
        "notes": "This is an automated dummy order for testing.",
        "subtotal": float(product["price"]),
        "vip_discount": 0.0,
        "coupon_code": None,
        "coupon_discount": 0.0,
        "wallet_discount": 0.0,
        "tax": {
            "cgst": round(float(product["price"]) * 0.09, 2),
            "sgst": round(float(product["price"]) * 0.09, 2),
            "total_tax": round(float(product["price"]) * 0.18, 2)
        },
        "total_amount": round(float(product["price"]) * 1.18, 2),
        "status": "pending",
        "status_history": [
            {
                "status": "pending",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Order placed",
                "updated_by": "system"
            }
        ],
        "production_type": "crafted",
        "crafted_by": None,
        "fulfillment_vendor": None,
        "vendor_upfront_cost": 0.0,
        "courier_partner": None,
        "tracking_number": None,
        "estimated_delivery_date": None,
        "shipping_cost_actual": 0.0,
        "package_weight_kg": 1.5,
        "transit_history": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.orders.insert_one(dummy_order)
    print(f"Successfully created dummy order! Order Number: {order_number}, ID: {result.inserted_id}")

if __name__ == "__main__":
    asyncio.run(create_dummy_order())
