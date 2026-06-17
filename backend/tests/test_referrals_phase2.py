"""Integration tests for Refer & Earn Phase 2 features."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
from bson import ObjectId

# Load env variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "cobblyn_shoes")

ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=20)
    return r


def verify_user_in_db(email):
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    db.users.update_one({"email": email.lower()}, {"$set": {"is_verified": True}})
    client.close()


@pytest.fixture
def admin_headers():
    r = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def test_referral_config_endpoints(admin_headers):
    # 1. Fetch config (should return seeded defaults)
    r_get = requests.get(f"{BASE_URL}/api/referrals/admin/config", headers=admin_headers, timeout=15)
    assert r_get.status_code == 200, f"Failed to get config: {r_get.text}"
    config = r_get.json()
    assert "welcome_credit" in config
    assert "max_wallet_shoes_amount" in config

    # 2. Update config
    payload = {
        "welcome_credit": 300.0,
        "referral_reward": 600.0,
        "min_purchase_amount": 1000.0,
        "hold_days": 2,
        "max_wallet_shoes_amount": 400.0,
        "max_wallet_accessories_amount": 80.0
    }
    r_put = requests.put(f"{BASE_URL}/api/referrals/admin/config", json=payload, headers=admin_headers, timeout=15)
    assert r_put.status_code == 200, f"Failed to put config: {r_put.text}"

    # Verify updated values
    r_get_updated = requests.get(f"{BASE_URL}/api/referrals/admin/config", headers=admin_headers, timeout=15)
    updated_config = r_get_updated.json()
    assert updated_config["welcome_credit"] == 300.0
    assert updated_config["referral_reward"] == 600.0
    assert updated_config["min_purchase_amount"] == 1000.0
    assert updated_config["hold_days"] == 2
    assert updated_config["max_wallet_shoes_amount"] == 400.0
    assert updated_config["max_wallet_accessories_amount"] == 80.0

    # Reset config back to defaults for other tests
    reset_payload = {
        "welcome_credit": 250.0,
        "referral_reward": 500.0,
        "min_purchase_amount": 0.0,
        "hold_days": 0,
        "max_wallet_shoes_amount": 500.0,
        "max_wallet_accessories_amount": 100.0
    }
    requests.put(f"{BASE_URL}/api/referrals/admin/config", json=reset_payload, headers=admin_headers, timeout=15)


def test_fraud_flag_matching_ip(admin_headers):
    # Set config to defaults
    reset_payload = {
        "welcome_credit": 250.0,
        "referral_reward": 500.0,
        "min_purchase_amount": 0.0,
        "hold_days": 0,
        "max_wallet_shoes_amount": 500.0,
        "max_wallet_accessories_amount": 100.0
    }
    requests.put(f"{BASE_URL}/api/referrals/admin/config", json=reset_payload, headers=admin_headers, timeout=15)

    # 1. Register Referrer and force an IP address in database
    suffix = uuid.uuid4().hex[:6]
    referrer_email = f"ref_ip_{suffix}@cobblyn.com"
    r_ref = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"name": "Referrer IP", "email": referrer_email, "password": "TestPassword@123"},
        timeout=15
    )
    assert r_ref.status_code == 200
    verify_user_in_db(referrer_email)

    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    db.users.update_one({"email": referrer_email}, {"$set": {"registration_ip": "192.168.9.99"}})
    ref_user = db.users.find_one({"email": referrer_email})
    referrer_code = ref_user["referral_code"]

    # 2. Register referee with referee's IP matching referrer's IP in headers/headers mock if we could,
    # or we can mock/set headers on request or test system check
    # Let's perform registration
    referee_email = f"referee_ip_{suffix}@cobblyn.com"
    
    # We will invoke register. We can set headers or manually adjust referee's IP in DB to match,
    # but let's test if the check works when they match.
    # Since headers client IP comes from request.client.host, requests call from localhost will have IP 127.0.0.1.
    # Let's set referrer's IP to 127.0.0.1 (which matches localhost requests IP)!
    db.users.update_one({"email": referrer_email}, {"$set": {"registration_ip": "127.0.0.1"}})
    
    r_referee = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"name": "Referee IP Match", "email": referee_email, "password": "TestPassword@123", "referral_code": referrer_code},
        timeout=15
    )
    assert r_referee.status_code == 200
    verify_user_in_db(referee_email)

    # 3. Query ledger database for this referral and confirm it was flagged is_flagged = True, status = "held"
    referral_doc = db.referrals.find_one({"referee_email": referee_email})
    assert referral_doc is not None
    assert referral_doc["is_flagged"] is True
    assert referral_doc["status"] == "held"
    assert "Matching registration IP with referrer" in referral_doc["flag_reasons"]

    # 4. Check that audit log has been written
    audit_log = db.referral_audit_logs.find_one({"referee_email": referee_email, "action": "flagged_fraud"})
    assert audit_log is not None

    client.close()


def test_category_wallet_caps_and_admin_actions(admin_headers):
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    # 1. Update config to set category limits: Shoes capped at ₹300, Accessories capped at ₹50
    config_payload = {
        "welcome_credit": 250.0,
        "referral_reward": 500.0,
        "min_purchase_amount": 0.0,
        "hold_days": 0,
        "max_wallet_shoes_amount": 300.0,
        "max_wallet_accessories_amount": 50.0
    }
    requests.put(f"{BASE_URL}/api/referrals/admin/config", json=config_payload, headers=admin_headers, timeout=15)

    # 2. Get a shoe and an accessory product id from DB
    shoe = db.products.find_one({})
    accessory = db.accessories.find_one({})
    assert shoe is not None, "Please run seed.py first"
    assert accessory is not None, "Please run seed.py first"

    # 3. Create referee user and give them ₹1,000 wallet balance
    suffix = uuid.uuid4().hex[:6]
    referee_email = f"referee_cap_{suffix}@cobblyn.com"
    r_reg = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"name": "Referee Cap", "email": referee_email, "password": "TestPassword@123"},
        timeout=15
    )
    assert r_reg.status_code == 200
    verify_user_in_db(referee_email)
    
    # Login referee
    r_login = _login(referee_email, "TestPassword@123")
    ref_token = r_login.json()["token"]
    ref_headers = {"Authorization": f"Bearer {ref_token}", "Content-Type": "application/json"}
    ref_id = r_login.json()["id"]

    # Give referee ₹1,000 balance
    db.users.update_one({"email": referee_email}, {"$set": {"wallet_balance": 1000.0}})

    # 4. Request price calculation for: 1 Shoe (₹8500) and 1 Accessory (₹999)
    calc_payload = {
        "items": [
            {
                "product_id": str(shoe["_id"]),
                "name": shoe["name"],
                "size": "9",
                "color": "Black",
                "quantity": 1,
                "price": float(shoe["price"])
            },
            {
                "product_id": str(accessory["_id"]),
                "name": accessory["name"],
                "size": "One Size",
                "color": "Black",
                "quantity": 1,
                "price": float(accessory["price"])
            }
        ],
        "use_wallet": True
    }
    
    # We need an order first to call calculate-price, or we can place the order directly and check deduction.
    # Let's create an order
    order_payload = {
        "items": calc_payload["items"],
        "shipping_address": {
            "name": "Referee Cap",
            "phone": "9900001111",
            "address": "123 Cap St",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        },
        "payment_method": "cod",
        "use_wallet": True
    }

    r_order = requests.post(f"{BASE_URL}/api/orders", json=order_payload, headers=ref_headers, timeout=15)
    assert r_order.status_code == 200, f"Order placement failed: {r_order.text}"
    order_data = r_order.json()

    # The wallet deduction should be capped: shoe cap (300) + accessory cap (50) = ₹350!
    assert order_data["wallet_discount"] == 350.0
    
    # Referee balance should be 1000 - 350 = 650
    ref_user = db.users.find_one({"email": referee_email})
    assert ref_user["wallet_balance"] == 650.0

    # 5. Test manual wallet adjustment (Adjust referee's wallet by +₹100)
    adjust_payload = {
        "amount": 100.0,
        "reason": "Test adjustment for Phase 2"
    }
    r_adjust = requests.post(f"{BASE_URL}/api/referrals/admin/customers/{ref_id}/adjust-wallet", json=adjust_payload, headers=admin_headers, timeout=15)
    assert r_adjust.status_code == 200

    ref_user_after = db.users.find_one({"email": referee_email})
    assert ref_user_after["wallet_balance"] == 750.0

    client.close()
