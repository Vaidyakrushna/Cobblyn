"""
Iteration 11 backend tests:
- GET /api/banners (public, with active_only filter)
- POST /api/banners (admin)
- PUT /api/banners/{id} (admin, including partial update)
- DELETE /api/banners/{id} (admin)
- POST /api/uploads/image (admin multipart, ext+size validation, non-admin rejection)
- GET /api/uploads/<filename> static serving
"""
import io
import requests
import pytest

BASE_URL = "https://proto-enhance-1.preview.emergentagent.com".rstrip("/")
ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"

# 1x1 PNG
PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0"
    b"\x00\x00\x00\x03\x00\x01\x5b\xed\xfa\xd5\x00\x00\x00\x00IEND\xaeB`\x82"
)


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
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- BANNERS ----------------

class TestBannersPublic:
    def test_list_public(self):
        r = requests.get(f"{BASE_URL}/api/banners", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data
        assert data["total"] >= 4, f"Expected >=4 seeded banners, got {data['total']}"
        # Validate fields on first banner
        b = data["items"][0]
        for f in ("id", "title", "image", "primary_cta", "primary_cta_link",
                  "secondary_cta", "secondary_cta_link", "sort_order", "active"):
            assert f in b, f"Missing field {f} in banner: {b}"

    def test_list_active_only(self):
        r = requests.get(f"{BASE_URL}/api/banners", params={"active_only": "true"}, timeout=15)
        assert r.status_code == 200
        for b in r.json()["items"]:
            assert b["active"] is True


class TestBannersAdmin:
    def test_create_requires_admin(self):
        # No auth
        r = requests.post(f"{BASE_URL}/api/banners",
                          json={"title": "TEST_x", "image": "https://x"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_create_update_delete(self, admin_headers):
        payload = {
            "eyebrow": "TEST",
            "title": "TEST_Iter11_Banner",
            "subtitle": "sub",
            "price": "₹0",
            "image": "https://example.com/test.jpg",
            "primary_cta": "Shop",
            "primary_cta_link": "/men",
            "secondary_cta": "Learn",
            "secondary_cta_link": "/about",
            "sort_order": 99,
            "active": True,
        }
        r = requests.post(f"{BASE_URL}/api/banners", json=payload,
                          headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        bid = created["id"]
        assert created["title"] == "TEST_Iter11_Banner"

        # Verify persistence
        r2 = requests.get(f"{BASE_URL}/api/banners", timeout=15)
        ids = [b["id"] for b in r2.json()["items"]]
        assert bid in ids

        # Partial update: just toggle active
        r3 = requests.put(f"{BASE_URL}/api/banners/{bid}",
                          json={"active": False}, headers=admin_headers, timeout=15)
        assert r3.status_code == 200, r3.text

        # Confirm not in active_only
        r4 = requests.get(f"{BASE_URL}/api/banners",
                          params={"active_only": "true"}, timeout=15)
        active_ids = [b["id"] for b in r4.json()["items"]]
        assert bid not in active_ids

        # Bad id update
        rbad = requests.put(f"{BASE_URL}/api/banners/notanid",
                            json={"active": True}, headers=admin_headers, timeout=15)
        assert rbad.status_code == 400

        # Delete
        rd = requests.delete(f"{BASE_URL}/api/banners/{bid}",
                             headers=admin_headers, timeout=15)
        assert rd.status_code == 200

        # Delete bad id
        rdb = requests.delete(f"{BASE_URL}/api/banners/notanid",
                              headers=admin_headers, timeout=15)
        assert rdb.status_code == 400

        # Delete missing valid-shaped id
        rdm = requests.delete(f"{BASE_URL}/api/banners/507f1f77bcf86cd799439011",
                              headers=admin_headers, timeout=15)
        assert rdm.status_code == 404


# ---------------- UPLOADS ----------------

class TestUploads:
    def test_upload_requires_admin(self):
        files = {"file": ("a.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(f"{BASE_URL}/api/uploads/image", files=files, timeout=20)
        assert r.status_code in (401, 403)

    def test_upload_png_and_fetch(self, admin_token):
        files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("filename", "url", "size", "content_type"):
            assert k in data
        assert data["size"] == len(PNG_BYTES)
        assert data["filename"].endswith(".png")
        # url is relative or absolute
        url = data["url"]
        assert url.startswith("/api/uploads/") or url.startswith("http")
        # Fetch the file via backend URL
        full = url if url.startswith("http") else f"{BASE_URL}{url}"
        rf = requests.get(full, timeout=15)
        assert rf.status_code == 200
        assert rf.content == PNG_BYTES
        ct = rf.headers.get("content-type", "")
        assert ct.startswith("image/"), f"Unexpected content-type: {ct}"

    def test_upload_unsupported_ext(self, admin_token):
        files = {"file": ("evil.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=20,
        )
        assert r.status_code == 400

    def test_upload_too_large(self, admin_token):
        big = b"\x00" * (5 * 1024 * 1024 + 100)
        files = {"file": ("big.png", io.BytesIO(big), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=30,
        )
        assert r.status_code == 413


# ---------------- Regression: sitemap/robots ----------------

class TestRegression:
    def test_sitemap(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=15)
        # sitemap is served by next.js (frontend), should be 200
        assert r.status_code in (200, 301, 302, 308)

    def test_robots(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
        assert r.status_code in (200, 301, 302, 308)
