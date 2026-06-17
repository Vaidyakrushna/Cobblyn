"""Tests for Refer & Earn (Option A) features."""
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
    import random
    fake_ip = f"1.2.3.{random.randint(10, 250)}"
    fake_ua = f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100.0.{random.randint(1,100)}"
    db.users.update_one({"email": email.lower()}, {"$set": {"is_verified": True, "registration_ip": fake_ip, "registration_ua": fake_ua}})
    client.close()


@pytest.fixture
def admin_headers():
    r = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def test_referrals_workflow(admin_headers):
    # 1. Register Referrer
    ref_suffix = uuid.uuid4().hex[:6]
    referrer_email = f"referrer_{ref_suffix}@cobblyn.com"
    referrer_password = "Test@1234"
    
    r_reg = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"name": "Referrer User", "email": referrer_email, "password": referrer_password},
        timeout=20
    )
    if r_reg.status_code == 429:
        pytest.skip("Register rate-limited (429), skipping integration workflow")
        
    assert r_reg.status_code == 200, f"Referrer registration failed: {r_reg.text}"
    
    # Verify Referrer email in DB so they can login
    verify_user_in_db(referrer_email)
    
    # Login Referrer
    r_login = _login(referrer_email, referrer_password)
    assert r_login.status_code == 200
    referrer_token = r_login.json()["token"]
    referrer_headers = {"Authorization": f"Bearer {referrer_token}", "Content-Type": "application/json"}
    
    # 2. Get Referrer's Referral Code
    r_stats = requests.get(f"{BASE_URL}/api/referrals/stats", headers=referrer_headers, timeout=15)
    assert r_stats.status_code == 200
    referrer_code = r_stats.json()["referral_code"]
    assert referrer_code.startswith("COBBLYN-")
    
    # 3. Register Referee using Referrer's Code
    referee_suffix = uuid.uuid4().hex[:6]
    referee_email = f"referee_{referee_suffix}@cobblyn.com"
    referee_password = "Test@1234"
    
    r_ref_reg = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "name": "Referee User",
            "email": referee_email,
            "password": referee_password,
            "referral_code": referrer_code
        },
        timeout=20
    )
    assert r_ref_reg.status_code == 200, f"Referee registration failed: {r_ref_reg.text}"
    
    # Verify Referee email in DB
    verify_user_in_db(referee_email)
    
    # Login Referee
    r_ref_login = _login(referee_email, referee_password)
    assert r_ref_login.status_code == 200
    referee_data = r_ref_login.json()
    referee_token = referee_data["token"]
    referee_headers = {"Authorization": f"Bearer {referee_token}", "Content-Type": "application/json"}
    
    # 4. Verify Referee got welcome credit immediately
    assert referee_data["wallet_balance"] == 250.0
    
    # Verify stats for referrer shows pending referral
    r_stats2 = requests.get(f"{BASE_URL}/api/referrals/stats", headers=referrer_headers, timeout=15).json()
    assert r_stats2["stats"]["pending_referrals"] == 1
    assert r_stats2["stats"]["successful_referrals"] == 0
    assert len(r_stats2["referrals"]) == 1
    assert r_stats2["referrals"][0]["status"] == "pending"
    
    # 5. Place order as Referee using Wallet Balance
    # Add a product to cart first
    prod_r = requests.get(f"{BASE_URL}/api/products", timeout=15)
    assert prod_r.status_code == 200
    products = prod_r.json()
    if isinstance(products, dict):
        products = products.get("products") or products.get("items") or []
    assert len(products) > 0, "No products to order"
    product = products[0]
    
    # Create order
    order_payload = {
        "items": [{
            "product_id": product["id"],
            "name": product["name"],
            "size": "9",
            "color": "Black",
            "quantity": 1,
            "price": 2000.0
        }],
        "shipping_address": {
            "name": "Referee User",
            "phone": "9900001111",
            "address": "123 Referee St",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        },
        "payment_method": "cod",
        "use_wallet": True
    }
    
    r_order = requests.post(f"{BASE_URL}/api/orders", json=order_payload, headers=referee_headers, timeout=15)
    assert r_order.status_code == 200, f"Order placement failed: {r_order.text}"
    order_data = r_order.json()
    order_id = order_data["id"]
    
    # Verify wallet deduction
    assert order_data["wallet_discount"] == 250.0
    # Remaining total = (2000 * 1.18) - 250 = 2360 - 250 = 2110
    assert order_data["total_amount"] == 2110.0
    
    # Verify Referee's wallet balance is now 0
    r_ref_me = requests.get(f"{BASE_URL}/api/auth/me", headers=referee_headers, timeout=15).json()
    assert r_ref_me["wallet_balance"] == 0.0
    
    # 6. Confirm Order as Admin
    r_confirm = requests.put(
        f"{BASE_URL}/api/orders/{order_id}/status",
        json={"status": "confirmed", "note": "Confirmed for testing"},
        headers=admin_headers,
        timeout=15
    )
    assert r_confirm.status_code == 200, f"Order confirmation failed: {r_confirm.text}"
    
    # 7. Verify Referrer gets ₹500 credit
    r_referrer_me = requests.get(f"{BASE_URL}/api/auth/me", headers=referrer_headers, timeout=15).json()
    assert r_referrer_me["wallet_balance"] == 500.0
    
    # Verify Referrer stats show completed referral
    r_stats3 = requests.get(f"{BASE_URL}/api/referrals/stats", headers=referrer_headers, timeout=15).json()
    assert r_stats3["stats"]["pending_referrals"] == 0
    assert r_stats3["stats"]["successful_referrals"] == 1
    assert r_stats3["referrals"][0]["status"] == "completed"
    
    # 8. Cancel Order and Verify Wallet Refund
    r_cancel = requests.put(
        f"{BASE_URL}/api/orders/{order_id}/status",
        json={"status": "cancelled", "note": "Cancelled for testing"},
        headers=admin_headers,
        timeout=15
    )
    assert r_cancel.status_code == 200
    
    # Verify Referee got their ₹250 back
    r_ref_me_after = requests.get(f"{BASE_URL}/api/auth/me", headers=referee_headers, timeout=15).json()
    assert r_ref_me_after["wallet_balance"] == 250.0
