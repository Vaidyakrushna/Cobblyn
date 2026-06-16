"""Tests for inventory and production admin endpoints."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bespoke-sole.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"
TEST_USER_EMAIL = "test@cobblyn.com"
TEST_USER_PASSWORD = "Test@1234"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def user_session():
    s = requests.Session()
    # try login, else register
    r = s.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
    if r.status_code != 200:
        s.post(f"{API}/auth/register", json={
            "name": "Test User",
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        r = s.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
        assert r.status_code == 200
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------- Inventory ----------
class TestInventory:
    def test_inventory_stats(self, admin_session):
        r = admin_session.get(f"{API}/admin/inventory/stats")
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["total_skus", "in_stock", "low_stock", "out_of_stock", "total_units", "total_value"]:
            assert k in data, f"missing key {k}"
        assert isinstance(data["total_skus"], int)
        assert data["total_skus"] >= 0

    def test_list_inventory(self, admin_session):
        r = admin_session.get(f"{API}/admin/inventory")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "items" in data and "total" in data
        assert isinstance(data["items"], list)
        if data["items"]:
            item = data["items"][0]
            assert "id" in item
            assert "size_stock" in item
            assert "status" in item
            # must NOT include mongo _id
            assert "_id" not in item

    def test_filter_by_status(self, admin_session):
        r = admin_session.get(f"{API}/admin/inventory?status=in_stock")
        assert r.status_code == 200
        data = r.json()
        for item in data["items"]:
            assert item["status"] == "in_stock"

    def test_filter_by_gender(self, admin_session):
        r = admin_session.get(f"{API}/admin/inventory?gender=men")
        assert r.status_code == 200
        data = r.json()
        for item in data["items"]:
            if item.get("gender"):
                assert item["gender"].lower() == "men"

    def test_update_stock_and_verify(self, admin_session):
        # pick first item
        r = admin_session.get(f"{API}/admin/inventory?limit=1")
        assert r.status_code == 200
        items = r.json()["items"]
        if not items:
            pytest.skip("no inventory items")
        inv_id = items[0]["id"]
        new_stock = {"7": 5, "8": 2, "9": 0}
        r = admin_session.put(
            f"{API}/admin/inventory/{inv_id}",
            json={"size_stock": new_stock, "low_stock_threshold": 3, "notes": "TEST_update"}
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["total_stock"] == 7
        # status: total 7 > threshold 3 => in_stock
        assert body["status"] == "in_stock"

        # GET to verify persistence
        r2 = admin_session.get(f"{API}/admin/inventory/{inv_id}")
        assert r2.status_code == 200
        doc = r2.json()
        assert doc["total_stock"] == 7
        assert doc["size_stock"]["7"] == 5

    def test_restock(self, admin_session):
        r = admin_session.get(f"{API}/admin/inventory?limit=1")
        items = r.json()["items"]
        if not items:
            pytest.skip("no inventory items")
        inv_id = items[0]["id"]
        before = items[0].get("total_stock", 0)
        r = admin_session.post(
            f"{API}/admin/inventory/{inv_id}/restock",
            json={"size": "8", "quantity": 10, "notes": "TEST_restock"}
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["total_stock"] >= 10

    def test_inventory_requires_admin(self, user_session):
        r = user_session.get(f"{API}/admin/inventory/stats")
        assert r.status_code in (401, 403)


# ---------- Production ----------
class TestProduction:
    created_worker_id = None
    worker_email = None
    worker_password = "Work@1234"

    def test_production_stats(self, admin_session):
        r = admin_session.get(f"{API}/admin/production/stats")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "stage_counts" in data
        assert "stages" in data
        assert isinstance(data["stages"], list)
        assert len(data["stages"]) == 7
        stage_names = [s["name"] for s in data["stages"]]
        for needed in ["order_received", "pattern_cutting", "upper_assembly",
                       "sole_attachment", "finishing", "quality_check", "ready_to_ship"]:
            assert needed in stage_names

    def test_list_jobs(self, admin_session):
        r = admin_session.get(f"{API}/admin/production/jobs")
        assert r.status_code == 200
        data = r.json()
        assert "jobs" in data and "total" in data
        assert isinstance(data["jobs"], list)

    def test_list_workers(self, admin_session):
        r = admin_session.get(f"{API}/admin/production/workers")
        assert r.status_code == 200
        data = r.json()
        assert "workers" in data
        # admins must be in the list
        roles = {w.get("role") for w in data["workers"]}
        assert "admin" in roles
        for w in data["workers"]:
            assert "id" in w
            assert "_id" not in w
            assert "password_hash" not in w

    def test_create_worker(self, admin_session):
        unique = uuid.uuid4().hex[:8]
        email = f"test_worker_{unique}@cobblyn.com"
        TestProduction.worker_email = email
        r = admin_session.post(
            f"{API}/admin/production/workers",
            json={"name": f"TEST Worker {unique}", "email": email, "password": TestProduction.worker_password}
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        TestProduction.created_worker_id = data["id"]

        # verify they appear in workers list
        r2 = admin_session.get(f"{API}/admin/production/workers")
        emails = [w.get("email") for w in r2.json()["workers"]]
        assert email in emails

    def test_duplicate_worker_email(self, admin_session):
        if not TestProduction.worker_email:
            pytest.skip("no worker created")
        r = admin_session.post(
            f"{API}/admin/production/workers",
            json={"name": "dup", "email": TestProduction.worker_email, "password": "xxxxx1"}
        )
        assert r.status_code == 400

    def test_worker_can_login_and_access_production(self):
        if not TestProduction.worker_email:
            pytest.skip("no worker")
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={
            "email": TestProduction.worker_email,
            "password": TestProduction.worker_password
        })
        assert r.status_code == 200, r.text
        token = r.json().get("token") or r.json().get("access_token")
        if token:
            s.headers.update({"Authorization": f"Bearer {token}"})

        # Worker CAN access production stats
        r2 = s.get(f"{API}/admin/production/stats")
        assert r2.status_code == 200, r2.text

        # Worker CANNOT access inventory (admin only)
        r3 = s.get(f"{API}/admin/inventory/stats")
        assert r3.status_code == 403

        # Worker CANNOT list workers (admin only)
        r4 = s.get(f"{API}/admin/production/workers")
        assert r4.status_code == 403

    def test_production_requires_auth(self, user_session):
        r = user_session.get(f"{API}/admin/production/stats")
        assert r.status_code in (401, 403)

    def test_delete_worker(self, admin_session):
        if not TestProduction.created_worker_id:
            pytest.skip("no worker created")
        r = admin_session.delete(
            f"{API}/admin/production/workers/{TestProduction.created_worker_id}"
        )
        assert r.status_code == 200, r.text

        # verify removed
        r2 = admin_session.get(f"{API}/admin/production/workers")
        ids = [w["id"] for w in r2.json()["workers"]]
        assert TestProduction.created_worker_id not in ids

    def test_delete_worker_not_found(self, admin_session):
        r = admin_session.delete(f"{API}/admin/production/workers/507f1f77bcf86cd799439011")
        assert r.status_code == 404
