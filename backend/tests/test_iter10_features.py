"""
Iteration 10 backend tests:
- PATCH /api/visits/{id}/status (admin auth + validation)
- DELETE /api/visits/{id} (admin auth)
- GET /api/visits with ?status= filter
"""
import os
import requests
import pytest

BASE_URL = "https://proto-enhance-1.preview.emergentagent.com".rstrip("/")

ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def created_visit_id():
    """Create a fresh visit so tests are idempotent."""
    payload = {
        "first_name": "TEST_Iter10",
        "last_name": "Visitor",
        "email": "TEST_iter10_visit@cobblyn.com",
        "contact_number": "9999999999",
        "visit_date": "2026-02-15",
        "style": "Oxford",
        "material": "Leather",
        "material_type": "Calf",
        "visit_for": "men",
        "pin_code": "560001",
        "notes": "iter10 test visit",
    }
    r = requests.post(f"{BASE_URL}/api/visits/schedule", json=payload, timeout=20)
    assert r.status_code == 200, f"Schedule visit failed: {r.text}"
    return r.json()["id"]


# ---------------- GET /api/visits ----------------
class TestListVisits:
    def test_list_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/visits", timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_list_as_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/visits", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "items" in body and isinstance(body["items"], list)
        assert "total" in body
        # Each item must have id and not _id
        for it in body["items"]:
            assert "id" in it
            assert "_id" not in it
            assert "status" in it

    def test_list_filter_pending(self, admin_headers, created_visit_id):
        r = requests.get(
            f"{BASE_URL}/api/visits?status=pending", headers=admin_headers, timeout=15
        )
        assert r.status_code == 200
        items = r.json()["items"]
        assert all(v["status"] == "pending" for v in items)
        # The newly created visit must be in the pending list
        assert any(v["id"] == created_visit_id for v in items)


# ---------------- PATCH /api/visits/{id}/status ----------------
class TestUpdateVisitStatus:
    def test_no_auth_returns_401_or_403(self, created_visit_id):
        r = requests.patch(
            f"{BASE_URL}/api/visits/{created_visit_id}/status",
            json={"status": "confirmed"},
            timeout=15,
        )
        assert r.status_code in (401, 403)

    def test_invalid_status_returns_400(self, admin_headers, created_visit_id):
        r = requests.patch(
            f"{BASE_URL}/api/visits/{created_visit_id}/status",
            headers=admin_headers,
            json={"status": "in-progress"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_invalid_id_returns_400(self, admin_headers):
        r = requests.patch(
            f"{BASE_URL}/api/visits/not-a-valid-objectid/status",
            headers=admin_headers,
            json={"status": "confirmed"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_nonexistent_id_returns_404(self, admin_headers):
        # Valid ObjectId format but doesn't exist
        fake_id = "507f1f77bcf86cd799439011"
        r = requests.patch(
            f"{BASE_URL}/api/visits/{fake_id}/status",
            headers=admin_headers,
            json={"status": "confirmed"},
            timeout=15,
        )
        assert r.status_code == 404

    @pytest.mark.parametrize("status", ["pending", "confirmed", "visited", "cancelled"])
    def test_valid_status_updates(self, admin_headers, created_visit_id, status):
        r = requests.patch(
            f"{BASE_URL}/api/visits/{created_visit_id}/status",
            headers=admin_headers,
            json={"status": status},
            timeout=15,
        )
        assert r.status_code == 200, f"{status}: {r.text}"
        body = r.json()
        assert body["status"] == status

        # Verify persistence via GET
        g = requests.get(
            f"{BASE_URL}/api/visits?status={status}",
            headers=admin_headers,
            timeout=15,
        )
        assert g.status_code == 200
        ids = [v["id"] for v in g.json()["items"]]
        assert created_visit_id in ids


# ---------------- DELETE /api/visits/{id} ----------------
class TestDeleteVisit:
    def test_no_auth(self, created_visit_id):
        r = requests.delete(f"{BASE_URL}/api/visits/{created_visit_id}", timeout=15)
        assert r.status_code in (401, 403)

    def test_invalid_id_returns_400(self, admin_headers):
        r = requests.delete(
            f"{BASE_URL}/api/visits/not-an-objectid", headers=admin_headers, timeout=15
        )
        assert r.status_code == 400

    def test_nonexistent_id_returns_404(self, admin_headers):
        fake_id = "507f1f77bcf86cd799439011"
        r = requests.delete(
            f"{BASE_URL}/api/visits/{fake_id}", headers=admin_headers, timeout=15
        )
        assert r.status_code == 404

    def test_delete_and_verify_removal(self, admin_headers, created_visit_id):
        r = requests.delete(
            f"{BASE_URL}/api/visits/{created_visit_id}",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        # verify no longer in list
        g = requests.get(f"{BASE_URL}/api/visits", headers=admin_headers, timeout=15)
        ids = [v["id"] for v in g.json()["items"]]
        assert created_visit_id not in ids
        # second delete should now 404
        r2 = requests.delete(
            f"{BASE_URL}/api/visits/{created_visit_id}",
            headers=admin_headers,
            timeout=15,
        )
        assert r2.status_code == 404


# ---------------- SEO endpoints ----------------
class TestSEOEndpoints:
    def test_robots_txt(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=20)
        assert r.status_code == 200, f"robots.txt {r.status_code}"
        text = r.text
        assert "User-Agent: *" in text or "User-agent: *" in text
        assert "Allow: /" in text
        assert "Disallow: /admin" in text
        assert "Sitemap:" in text and "/sitemap.xml" in text

    def test_sitemap_xml(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=30)
        assert r.status_code == 200, f"sitemap.xml {r.status_code}"
        body = r.text
        assert "<urlset" in body or "<sitemapindex" in body
        # static routes
        for path in ["/men", "/women", "/luxe-collection", "/customize"]:
            assert path in body, f"{path} missing in sitemap"
        # at least one product URL
        assert ("/men/product/" in body) or ("/women/product/" in body), \
            "No product URLs in sitemap"
