"""
Iteration 9 backend feature tests:
- Visits/Schedule (POST /api/visits/schedule, GET /api/visits)
- Admin Dashboard period filters (year/month/day)
- Admin Inventory category=accessories filter
- Admin Products CRUD (POST/PUT/DELETE) - admin allowed, non-admin rejected
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://proto-enhance-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok, f"No token in admin login response: {r.json()}"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def user_token():
    email = f"TEST_iter9_{int(time.time())}@cobblyn.com"
    r = requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "Test@1234", "name": "Iter9 User"},
                      timeout=20)
    assert r.status_code in (200, 201), f"Register failed: {r.status_code} {r.text}"
    body = r.json()
    return body.get("token") or body.get("access_token")


@pytest.fixture(scope="module")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}


# ----- Visits -----
class TestVisitsSchedule:
    def test_schedule_visit_valid(self):
        payload = {
            "first_name": "TEST", "last_name": "Visitor",
            "email": "TEST_visit@example.com", "contact_number": "9999999999",
            "visit_date": "2026-02-15", "style": "Oxford",
            "material": "Full-Grain Leather", "material_type": "Premium",
            "visit_for": "men", "pin_code": "560001", "notes": "Iter9 test"
        }
        r = requests.post(f"{BASE_URL}/api/visits/schedule", json=payload, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert "message" in data
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert data["status"] == "pending"

    def test_schedule_visit_invalid(self):
        # Missing required fields
        r = requests.post(f"{BASE_URL}/api/visits/schedule",
                          json={"first_name": "Only"}, timeout=20)
        assert r.status_code == 422

    def test_schedule_visit_bad_email(self):
        payload = {
            "first_name": "T", "last_name": "V",
            "email": "not-an-email", "contact_number": "9999999999",
            "visit_date": "2026-02-15", "style": "Oxford",
            "material": "Leather", "material_type": "Premium",
            "visit_for": "men", "pin_code": "560001"
        }
        r = requests.post(f"{BASE_URL}/api/visits/schedule", json=payload, timeout=20)
        assert r.status_code == 422

    def test_list_visits_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/visits", headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)
        assert "total" in data

    def test_list_visits_unauth(self):
        r = requests.get(f"{BASE_URL}/api/visits", timeout=20)
        assert r.status_code in (401, 403)

    def test_list_visits_non_admin(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/visits", headers=user_headers, timeout=20)
        assert r.status_code == 403


# ----- Admin Dashboard period filter -----
class TestAdminDashboardFilter:
    def _check_shape(self, data, period, value):
        for k in ["total_products", "total_users", "total_orders",
                  "pending_orders", "in_production", "total_revenue", "recent_orders"]:
            assert k in data, f"Missing {k} in dashboard response"
        assert data.get("period") == period
        assert data.get("period_value") == value

    def test_dashboard_year(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard",
                         params={"period": "year", "value": "2026"},
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        self._check_shape(r.json(), "year", "2026")

    def test_dashboard_month(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard",
                         params={"period": "month", "value": "2026-01"},
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        self._check_shape(r.json(), "month", "2026-01")

    def test_dashboard_day(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard",
                         params={"period": "day", "value": "2026-01-25"},
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        self._check_shape(r.json(), "day", "2026-01-25")

    def test_dashboard_no_period(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard",
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["total_products"] >= 0


# ----- Inventory category filter -----
class TestInventoryCategory:
    def test_inventory_accessories_empty(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inventory",
                         params={"category": "accessories"},
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        # No products tagged as accessories should be present
        assert isinstance(data.get("items"), list)
        assert data.get("total", 0) == 0
        assert len(data["items"]) == 0

    def test_inventory_no_filter(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/inventory",
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json().get("items"), list)


# ----- Product CRUD -----
class TestProductCRUD:
    @pytest.fixture(scope="class")
    def created_product_id(self, admin_headers):
        payload = {
            "name": "TEST_Iter9 Product",
            "style": "Oxford",
            "occasion": "Office",
            "material": "Leather",
            "gender": "men",
            "price": 9999,
            "tag": "TEST",
            "articleCode": "BYD-TEST-IT9",
            "description": "Test product created during iter9 testing",
            "colors": [{"name": "Black", "hex": "#000000"}],
            "sizes": ["7", "8", "9"],
            "images": ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900"],
            "features": ["Test feature"],
            "specifications": {"Upper": "Leather"}
        }
        r = requests.post(f"{BASE_URL}/api/products", json=payload,
                          headers=admin_headers, timeout=20)
        assert r.status_code in (200, 201), f"create failed: {r.status_code} {r.text}"
        body = r.json()
        pid = body.get("id") or body.get("_id") or (body.get("product") or {}).get("id")
        assert pid, f"No product id returned: {body}"
        yield pid
        # cleanup
        requests.delete(f"{BASE_URL}/api/products/{pid}", headers=admin_headers, timeout=20)

    def test_create_product_non_admin(self, user_headers):
        payload = {
            "name": "TEST_NonAdmin", "style": "Oxford", "occasion": "Office",
            "material": "Leather", "gender": "men", "price": 1234, "tag": "TEST",
            "articleCode": "BYD-TEST-NA", "description": "non-admin",
            "colors": [{"name": "B", "hex": "#000"}], "sizes": ["8"],
            "images": ["https://x"], "features": [], "specifications": {}
        }
        r = requests.post(f"{BASE_URL}/api/products",
                          json=payload, headers=user_headers, timeout=20)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_create_product_admin(self, admin_headers, created_product_id):
        # Verify created via GET
        r = requests.get(f"{BASE_URL}/api/products/{created_product_id}", timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert data.get("name") == "TEST_Iter9 Product"
        assert data.get("price") == 9999

    def test_update_product_admin(self, admin_headers, created_product_id):
        r = requests.put(f"{BASE_URL}/api/products/{created_product_id}",
                         json={"price": 12345, "tag": "UPDATED"},
                         headers=admin_headers, timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        # Verify
        g = requests.get(f"{BASE_URL}/api/products/{created_product_id}", timeout=20)
        assert g.status_code == 200
        assert g.json().get("price") == 12345

    def test_update_product_non_admin(self, user_headers, created_product_id):
        r = requests.put(f"{BASE_URL}/api/products/{created_product_id}",
                         json={"price": 1}, headers=user_headers, timeout=20)
        assert r.status_code in (401, 403)

    def test_delete_product_non_admin(self, user_headers, created_product_id):
        r = requests.delete(f"{BASE_URL}/api/products/{created_product_id}",
                            headers=user_headers, timeout=20)
        assert r.status_code in (401, 403)

    def test_delete_product_admin(self, admin_headers):
        # create a separate one to delete
        payload = {
            "name": "TEST_Iter9 ToDelete", "style": "Oxford", "occasion": "Office",
            "material": "Leather", "gender": "men", "price": 1234, "tag": "TEST",
            "articleCode": "BYD-TEST-DEL", "description": "del",
            "colors": [{"name": "B", "hex": "#000"}], "sizes": ["8"],
            "images": ["https://x"], "features": [], "specifications": {}
        }
        c = requests.post(f"{BASE_URL}/api/products", json=payload,
                          headers=admin_headers, timeout=20)
        assert c.status_code in (200, 201), f"{c.status_code} {c.text}"
        pid = c.json().get("id") or c.json().get("_id")
        d = requests.delete(f"{BASE_URL}/api/products/{pid}",
                            headers=admin_headers, timeout=20)
        assert d.status_code in (200, 204)
        g = requests.get(f"{BASE_URL}/api/products/{pid}", timeout=20)
        assert g.status_code == 404
