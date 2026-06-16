import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
import time

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

@pytest.fixture
def user_setup():
    suffix = uuid.uuid4().hex[:6]
    email = f"testuser_{suffix}@cobblyn.com"
    password = "Test@1234"
    
    r_reg = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"name": "Test User", "email": email, "password": password},
        timeout=20
    )
    if r_reg.status_code == 429:
        pytest.skip("Register rate-limited (429), skipping test")
        
    verify_user_in_db(email)
    
    r_login = _login(email, password)
    assert r_login.status_code == 200
    token = r_login.json()["token"]
    
    return {
        "email": email,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    }

def test_get_vip_plans():
    r = requests.get(f"{BASE_URL}/api/vip/plans", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "plans" in data
    assert len(data["plans"]) >= 3
    assert any(p["plan_id"] == "monthly" for p in data["plans"])

def test_vip_subscription_wallet_rejection(user_setup):
    headers = user_setup["headers"]
    r = requests.post(f"{BASE_URL}/api/vip/subscribe", json={
        "plan_id": "monthly",
        "payment_method": "wallet"
    }, headers=headers, timeout=10)
    assert r.status_code == 400
    assert "wallet balance cannot be used" in r.json()["detail"].lower()

def test_vip_subscription_success(user_setup):
    headers = user_setup["headers"]
    
    # Test UPI
    r_upi = requests.post(f"{BASE_URL}/api/vip/subscribe", json={
        "plan_id": "monthly",
        "payment_method": "upi"
    }, headers=headers, timeout=10)
    assert r_upi.status_code == 200
    assert r_upi.json()["vip_membership"]["plan_id"] == "monthly"
    
    # Test Mock Card
    r = requests.post(f"{BASE_URL}/api/vip/subscribe", json={
        "plan_id": "quarterly",
        "payment_method": "mock_card"
    }, headers=headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "subscribed successfully" in data["message"].lower()
    assert data["vip_membership"]["plan_id"] == "quarterly"
    assert data["vip_membership"]["is_active"] is True

    # Check status endpoint
    r_status = requests.get(f"{BASE_URL}/api/vip/status", headers=headers, timeout=10)
    assert r_status.status_code == 200
    status_data = r_status.json()
    assert status_data["is_active"] is True
    assert status_data["plan_id"] == "quarterly"

def test_admin_vip_members(admin_headers, user_setup):
    # User subscribes
    requests.post(f"{BASE_URL}/api/vip/subscribe", json={
        "plan_id": "monthly",
        "payment_method": "mock_card"
    }, headers=user_setup["headers"], timeout=10)
    
    # Admin gets members
    r = requests.get(f"{BASE_URL}/api/vip/admin/members", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    members = r.json()
    assert isinstance(members, list)
    user_in_list = any(m["email"] == user_setup["email"] for m in members)
    assert user_in_list

def test_admin_manual_grant_and_cancel(admin_headers, user_setup):
    headers = user_setup["headers"]
    
    # Admin gets members to find user ID. Wait, we can get user ID from DB or we can query user by email from another endpoint.
    # Alternatively, the user_id might not be returned in login, let's get it from MongoDB.
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    user_doc = db.users.find_one({"email": user_setup["email"]})
    user_id = str(user_doc["_id"])
    client.close()

    # Grant
    r_grant = requests.post(f"{BASE_URL}/api/vip/admin/members/{user_id}/grant", json={
        "plan_id": "annual",
        "months": 12,
        "discount_percent": 15.0
    }, headers=admin_headers, timeout=10)
    assert r_grant.status_code == 200

    # User checks status
    r_status = requests.get(f"{BASE_URL}/api/vip/status", headers=headers, timeout=10)
    assert r_status.json()["plan_id"] == "annual"
    assert r_status.json()["is_active"] is True

    # Cancel
    r_cancel = requests.post(f"{BASE_URL}/api/vip/admin/members/{user_id}/cancel", headers=admin_headers, timeout=10)
    assert r_cancel.status_code == 200

    # User checks status
    r_status2 = requests.get(f"{BASE_URL}/api/vip/status", headers=headers, timeout=10)
    assert r_status2.json()["is_active"] is False
    assert r_status2.json()["status"] == "cancelled"

def test_admin_config_update(admin_headers):
    # Get current to restore later
    r_get = requests.get(f"{BASE_URL}/api/vip/admin/config", headers=admin_headers, timeout=10)
    assert r_get.status_code == 200
    original_config = r_get.json()

    new_config = {
        "plans": [
            {
                "plan_id": "monthly",
                "name": "Super Monthly VIP",
                "price": 399.0,
                "months": 1,
                "discount_percent": 12.0,
                "is_active": True,
                "details": ["Cool feature"]
            },
            {
                "plan_id": "hidden_plan",
                "name": "Hidden VIP",
                "price": 99.0,
                "months": 1,
                "discount_percent": 5.0,
                "is_active": False,
                "details": []
            }
        ],
        "free_shipping": True
    }

    # Update
    r_update = requests.put(f"{BASE_URL}/api/vip/admin/config", json=new_config, headers=admin_headers, timeout=10)
    assert r_update.status_code == 200

    # Verify admin sees both
    r_verify = requests.get(f"{BASE_URL}/api/vip/admin/config", headers=admin_headers, timeout=10)
    admin_plans = r_verify.json()["plans"]
    assert len(admin_plans) == 2
    assert admin_plans[0]["price"] == 399.0
    assert admin_plans[0]["details"][0] == "Cool feature"
    
    # Verify customer only sees active
    r_cust = requests.get(f"{BASE_URL}/api/vip/plans", timeout=10)
    cust_plans = r_cust.json()["plans"]
    assert len(cust_plans) == 1
    assert cust_plans[0]["plan_id"] == "monthly"

    # Restore
    original_config.pop("id", None)
    original_config.pop("_id", None)
    requests.put(f"{BASE_URL}/api/vip/admin/config", json=original_config, headers=admin_headers, timeout=10)
