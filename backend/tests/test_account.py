"""Tests for /api/account/* endpoints and /api/auth for the account feature."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bespoke-sole.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"
TEST_USER_EMAIL = "test@cobblyn.com"
TEST_USER_PASSWORD = "Test@1234"


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=20)
    return r


@pytest.fixture(scope="module")
def user_token():
    # Try login first, register if needed
    r = _login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    if r.status_code != 200:
        reg = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD, "name": "Test User"},
            timeout=20,
        )
        assert reg.status_code in (200, 201, 400, 409), f"Register failed {reg.status_code} {reg.text}"
        r = _login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    assert r.status_code == 200, f"User login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in login response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token
    return token


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ===== Profile =====
class TestAccountProfile:
    def test_get_profile_returns_user_data(self, user_token):
        r = requests.get(f"{BASE_URL}/api/account/profile", headers=_auth_headers(user_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == TEST_USER_EMAIL
        assert "name" in data
        assert "addresses" in data and isinstance(data["addresses"], list)
        assert "payment_methods" in data and isinstance(data["payment_methods"], list)
        assert "order_count" in data and isinstance(data["order_count"], int)

    def test_update_profile(self, user_token):
        new_name = f"Test User {uuid.uuid4().hex[:6]}"
        r = requests.put(
            f"{BASE_URL}/api/account/profile",
            headers=_auth_headers(user_token),
            json={"name": new_name, "phone": "+919900001111"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Verify
        p = requests.get(f"{BASE_URL}/api/account/profile", headers=_auth_headers(user_token), timeout=15)
        assert p.status_code == 200
        assert p.json()["name"] == new_name
        assert p.json()["phone"] == "+919900001111"

    def test_profile_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/account/profile", timeout=15)
        assert r.status_code in (401, 403)


# ===== Addresses =====
class TestAddresses:
    created_id = None

    def test_create_address(self, user_token):
        payload = {
            "label": "home",
            "name": "TEST User",
            "phone": "+919900001111",
            "address_line1": "123 Test Street",
            "address_line2": "Apt 4",
            "city": "Mumbai",
            "state": "MH",
            "pincode": "400001",
            "is_default": True,
        }
        r = requests.post(
            f"{BASE_URL}/api/account/addresses",
            headers=_auth_headers(user_token),
            json=payload,
            timeout=15,
        )
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert "id" in data
        TestAddresses.created_id = data["id"]

    def test_list_addresses(self, user_token):
        r = requests.get(f"{BASE_URL}/api/account/addresses", headers=_auth_headers(user_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "addresses" in data
        assert any(a["id"] == TestAddresses.created_id for a in data["addresses"])

    def test_update_address(self, user_token):
        assert TestAddresses.created_id
        payload = {
            "label": "office",
            "name": "TEST User Updated",
            "phone": "+919900002222",
            "address_line1": "456 Updated Lane",
            "city": "Mumbai",
            "state": "MH",
            "pincode": "400002",
            "is_default": False,
        }
        r = requests.put(
            f"{BASE_URL}/api/account/addresses/{TestAddresses.created_id}",
            headers=_auth_headers(user_token),
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Verify persistence
        lst = requests.get(f"{BASE_URL}/api/account/addresses", headers=_auth_headers(user_token), timeout=15).json()
        found = next((a for a in lst["addresses"] if a["id"] == TestAddresses.created_id), None)
        assert found and found["label"] == "office" and found["name"] == "TEST User Updated"

    def test_delete_address(self, user_token):
        assert TestAddresses.created_id
        r = requests.delete(
            f"{BASE_URL}/api/account/addresses/{TestAddresses.created_id}",
            headers=_auth_headers(user_token),
            timeout=15,
        )
        assert r.status_code == 200, r.text
        lst = requests.get(f"{BASE_URL}/api/account/addresses", headers=_auth_headers(user_token), timeout=15).json()
        assert not any(a["id"] == TestAddresses.created_id for a in lst["addresses"])


# ===== Payment Methods =====
class TestPaymentMethods:
    created_id = None

    def test_create_payment_method(self, user_token):
        payload = {
            "type": "card",
            "label": "TEST HDFC Visa ending 4242",
            "last4": "4242",
            "card_brand": "Visa",
            "is_default": True,
        }
        r = requests.post(
            f"{BASE_URL}/api/account/payment-methods",
            headers=_auth_headers(user_token),
            json=payload,
            timeout=15,
        )
        assert r.status_code in (200, 201), r.text
        TestPaymentMethods.created_id = r.json()["id"]

    def test_list_payment_methods(self, user_token):
        r = requests.get(f"{BASE_URL}/api/account/payment-methods", headers=_auth_headers(user_token), timeout=15)
        assert r.status_code == 200
        items = r.json().get("payment_methods", [])
        assert any(m["id"] == TestPaymentMethods.created_id for m in items)

    def test_delete_payment_method(self, user_token):
        r = requests.delete(
            f"{BASE_URL}/api/account/payment-methods/{TestPaymentMethods.created_id}",
            headers=_auth_headers(user_token),
            timeout=15,
        )
        assert r.status_code == 200, r.text


# ===== Change Password =====
class TestChangePassword:
    def test_change_password_wrong_current(self, user_token):
        r = requests.post(
            f"{BASE_URL}/api/account/change-password",
            headers=_auth_headers(user_token),
            json={"current_password": "WrongPass!!", "new_password": "NewPass@1234"},
            timeout=15,
        )
        assert r.status_code == 400, r.text

    def test_change_password_too_short(self, user_token):
        r = requests.post(
            f"{BASE_URL}/api/account/change-password",
            headers=_auth_headers(user_token),
            json={"current_password": TEST_USER_PASSWORD, "new_password": "123"},
            timeout=15,
        )
        assert r.status_code == 400, r.text

    def test_change_password_success_and_revert(self, user_token):
        new_pw = "NewTest@9999"
        r = requests.post(
            f"{BASE_URL}/api/account/change-password",
            headers=_auth_headers(user_token),
            json={"current_password": TEST_USER_PASSWORD, "new_password": new_pw},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Verify we can login with new password
        lr = _login(TEST_USER_EMAIL, new_pw)
        assert lr.status_code == 200
        new_token = lr.json().get("token") or lr.json().get("access_token")
        # Revert
        rv = requests.post(
            f"{BASE_URL}/api/account/change-password",
            headers=_auth_headers(new_token),
            json={"current_password": new_pw, "new_password": TEST_USER_PASSWORD},
            timeout=15,
        )
        assert rv.status_code == 200


# ===== Orders =====
class TestOrders:
    def test_list_my_orders(self, user_token):
        r = requests.get(f"{BASE_URL}/api/account/orders", headers=_auth_headers(user_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "orders" in data and isinstance(data["orders"], list)
        assert "total" in data

    def test_orders_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/account/orders", timeout=15)
        assert r.status_code in (401, 403)


# ===== Admin role =====
class TestAdminRole:
    def test_admin_profile_has_admin_role(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/account/profile", headers=_auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        assert r.json().get("role") == "admin"

    def test_user_profile_has_user_role(self, user_token):
        r = requests.get(f"{BASE_URL}/api/account/profile", headers=_auth_headers(user_token), timeout=15)
        assert r.status_code == 200
        assert r.json().get("role") in ("user", "customer", None) or r.json().get("role") != "admin"
