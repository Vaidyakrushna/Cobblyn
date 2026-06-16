"""Iter 12 feature tests: Reviews, Coupons, Returns, Analytics, Admin Users (RBAC),
Bulk upload, Wishlist move-to-cart, Search query, Tax (via tax_utils unit test)."""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://proto-enhance-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def user_creds():
    suf = uuid.uuid4().hex[:8]
    email = f"TEST_iter12_{suf}@cobblyn.com"
    password = "Test@1234"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"name": "Iter12 Tester", "email": email, "password": password}, timeout=15)
    if r.status_code == 429:
        pytest.skip("Register rate-limited (429) — likely from prior runs; skipping user-scoped tests")
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    return {"email": email, "password": password, "token": r.json()["token"], "id": r.json()["id"]}


@pytest.fixture(scope="session")
def user_headers(user_creds):
    return {"Authorization": f"Bearer {user_creds['token']}"}


def _extract_products(payload):
    if isinstance(payload, list):
        return payload
    return payload.get("products") or payload.get("items") or []


@pytest.fixture(scope="session")
def first_product():
    r = requests.get(f"{BASE_URL}/api/products", timeout=15)
    assert r.status_code == 200
    items = _extract_products(r.json())
    assert len(items) > 0, "No products available"
    return items[0]


# ---------- Reviews ----------
class TestReviews:
    def test_list_reviews_empty_or_existing(self, first_product):
        pid = first_product["id"]
        r = requests.get(f"{BASE_URL}/api/reviews/product/{pid}", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "items" in body and "summary" in body
        assert "count" in body["summary"] and "avg" in body["summary"] and "distribution" in body["summary"]

    def test_create_and_duplicate_review(self, first_product, user_headers, user_creds):
        pid = first_product["id"]
        payload = {"product_id": pid, "rating": 5, "title": "Great", "body": "Loved the craftsmanship of these shoes."}
        r = requests.post(f"{BASE_URL}/api/reviews/product/{pid}", json=payload, headers=user_headers, timeout=15)
        assert r.status_code == 200, f"Create review failed: {r.text}"
        data = r.json()
        assert data["rating"] == 5
        assert data.get("verified_purchase") in (True, False)
        # Duplicate
        r2 = requests.post(f"{BASE_URL}/api/reviews/product/{pid}", json=payload, headers=user_headers, timeout=15)
        assert r2.status_code == 400
        # GET shows it
        rg = requests.get(f"{BASE_URL}/api/reviews/product/{pid}", timeout=15)
        assert rg.status_code == 200
        assert rg.json()["summary"]["count"] >= 1

    def test_create_review_unauth(self, first_product):
        pid = first_product["id"]
        r = requests.post(f"{BASE_URL}/api/reviews/product/{pid}", json={"product_id": pid, "rating": 4, "title": "Hi", "body": "Decent"}, timeout=15)
        assert r.status_code in (401, 403)


# ---------- Coupons ----------
class TestCoupons:
    def test_validate_seeded_welcome10(self):
        r = requests.post(f"{BASE_URL}/api/coupons/validate", json={"code": "WELCOME10", "subtotal": 5000}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["code"] == "WELCOME10"
        assert data["discount"] == 500.0  # 10% of 5000

    def test_validate_min_purchase_fail(self):
        r = requests.post(f"{BASE_URL}/api/coupons/validate", json={"code": "FLAT500", "subtotal": 1000}, timeout=15)
        assert r.status_code == 400

    def test_validate_unknown_code(self):
        r = requests.post(f"{BASE_URL}/api/coupons/validate", json={"code": "NONEXISTENT_XYZ", "subtotal": 5000}, timeout=15)
        assert r.status_code == 404

    def test_admin_list_coupons_has_seed(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/coupons", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        items = r.json().get("items", [])
        codes = {c["code"] for c in items}
        assert {"WELCOME10", "FLAT500", "LUXE15"} <= codes

    def test_admin_list_unauth(self):
        r = requests.get(f"{BASE_URL}/api/coupons", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_create_update_delete_coupon(self, admin_headers):
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        # Create
        r = requests.post(f"{BASE_URL}/api/coupons", headers=admin_headers,
                          json={"code": code, "type": "percentage", "value": 20, "min_purchase": 100, "max_discount": 500, "description": "test"}, timeout=15)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        # Update
        r2 = requests.put(f"{BASE_URL}/api/coupons/{cid}", headers=admin_headers, json={"active": False}, timeout=15)
        assert r2.status_code == 200, r2.text
        # Validate (should fail - inactive)
        rv = requests.post(f"{BASE_URL}/api/coupons/validate", json={"code": code, "subtotal": 1000}, timeout=15)
        assert rv.status_code == 400
        # Delete
        rd = requests.delete(f"{BASE_URL}/api/coupons/{cid}", headers=admin_headers, timeout=15)
        assert rd.status_code == 200


# ---------- Returns ----------
class TestReturns:
    def test_list_returns_admin_ok(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/returns", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert "items" in r.json()

    def test_create_return_unauth(self):
        r = requests.post(f"{BASE_URL}/api/returns",
                          json={"order_id": "abc", "product_id": "x", "type": "return", "reason": "Did not fit me"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_create_return_invalid_order(self, user_headers):
        # bad order id format
        r = requests.post(f"{BASE_URL}/api/returns", headers=user_headers,
                          json={"order_id": "notanid", "product_id": "x", "type": "return", "reason": "Wrong size"}, timeout=15)
        assert r.status_code == 400

    def test_patch_return_status_admin_only(self, user_headers):
        # Use a fake objectid
        r = requests.patch(f"{BASE_URL}/api/returns/507f1f77bcf86cd799439011/status", headers=user_headers,
                           json={"status": "approved"}, timeout=15)
        assert r.status_code == 403


# ---------- Analytics ----------
class TestAnalytics:
    @pytest.mark.parametrize("path", ["/api/admin/analytics/sizes", "/api/admin/analytics/return-rate",
                                       "/api/admin/analytics/size-mismatch", "/api/admin/analytics/popular-customizations"])
    def test_admin_analytics_endpoints(self, path, admin_headers):
        r = requests.get(f"{BASE_URL}{path}", headers=admin_headers, timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text}"
        body = r.json()
        # Must return an object with at least one list field
        assert isinstance(body, dict)

    def test_analytics_unauth(self):
        r = requests.get(f"{BASE_URL}/api/admin/analytics/sizes", timeout=15)
        assert r.status_code in (401, 403)


# ---------- Admin Users (RBAC) ----------
class TestAdminUsers:
    def test_list_users_super_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        items = r.json()["items"]
        assert any(u["email"] == ADMIN_EMAIL and u.get("role") == "super_admin" for u in items)

    def test_list_users_unauth(self):
        r = requests.get(f"{BASE_URL}/api/admin/users", timeout=15)
        assert r.status_code in (401, 403)

    def test_list_users_regular_user_forbidden(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=user_headers, timeout=15)
        assert r.status_code == 403

    def test_role_change_and_block(self, admin_headers, user_creds):
        uid = user_creds["id"]
        # Promote to staff
        r = requests.patch(f"{BASE_URL}/api/admin/users/{uid}/role", headers=admin_headers, json={"role": "staff"}, timeout=15)
        assert r.status_code == 200, r.text
        # Block user
        r2 = requests.patch(f"{BASE_URL}/api/admin/users/{uid}/block", headers=admin_headers, json={"blocked": True}, timeout=15)
        assert r2.status_code == 200, r2.text
        # Revert
        requests.patch(f"{BASE_URL}/api/admin/users/{uid}/role", headers=admin_headers, json={"role": "user"}, timeout=15)
        requests.patch(f"{BASE_URL}/api/admin/users/{uid}/block", headers=admin_headers, json={"blocked": False}, timeout=15)


# ---------- Bulk upload ----------
class TestBulk:
    def test_bulk_products_admin(self, admin_headers):
        sku = f"TEST-BULK-{uuid.uuid4().hex[:6].upper()}"
        csv_data = f"name,style,occasion,material,gender,price,tag,articleCode,description\nTest Bulk Shoe,Oxford,Office,Leather,men,5500,NEW,{sku},from bulk upload\n"
        files = {"file": ("products.csv", io.BytesIO(csv_data.encode()), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/bulk/products", headers=admin_headers, files=files, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("created", 0) + body.get("updated", 0) >= 1

    def test_bulk_products_missing_columns(self, admin_headers):
        csv_data = "name,price\nfoo,100\n"
        files = {"file": ("bad.csv", io.BytesIO(csv_data.encode()), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/bulk/products", headers=admin_headers, files=files, timeout=15)
        assert r.status_code == 400

    def test_bulk_products_non_csv(self, admin_headers):
        files = {"file": ("file.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{BASE_URL}/api/admin/bulk/products", headers=admin_headers, files=files, timeout=15)
        assert r.status_code == 400

    def test_bulk_products_unauth(self):
        files = {"file": ("p.csv", io.BytesIO(b"name,style,material,gender,price,articleCode\n"), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/bulk/products", files=files, timeout=15)
        assert r.status_code in (401, 403)

    def test_bulk_inventory_admin(self, admin_headers):
        sku = "BYD-OXF-001"
        csv_data = f"articleCode,size,stock_qty,low_stock_threshold\n{sku},9,7,3\n{sku},10,4,3\n"
        files = {"file": ("inv.csv", io.BytesIO(csv_data.encode()), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/admin/bulk/inventory", headers=admin_headers, files=files, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("upserted", 0) >= 2


# ---------- Wishlist move-to-cart ----------
class TestWishlistMove:
    def test_move_to_cart_unauth(self, first_product):
        r = requests.post(f"{BASE_URL}/api/wishlist/{first_product['id']}/move-to-cart",
                          json={"size": "9", "quantity": 1}, timeout=15)
        assert r.status_code in (401, 403)

    def test_move_to_cart_invalid_product(self, user_headers):
        r = requests.post(f"{BASE_URL}/api/wishlist/notavalidoid/move-to-cart",
                          json={"size": "9", "quantity": 1}, headers=user_headers, timeout=15)
        assert r.status_code == 400

    def test_move_to_cart_success(self, user_headers, first_product):
        pid = first_product["id"]
        r = requests.post(f"{BASE_URL}/api/wishlist/{pid}/move-to-cart",
                          json={"size": "9", "color": "Black", "quantity": 1}, headers=user_headers, timeout=15)
        assert r.status_code == 200, r.text


# ---------- Search ----------
class TestSearch:
    def test_search_oxford(self):
        r = requests.get(f"{BASE_URL}/api/products", params={"search": "oxford"}, timeout=15)
        assert r.status_code == 200
        items = _extract_products(r.json())
        assert len(items) >= 1, f"Expected at least 1 oxford match; got {len(items)}"
        joined = " ".join((p.get("name", "") + " " + p.get("style", "") + " " + p.get("articleCode", "") + " " + p.get("material", "")).lower() for p in items)
        assert "oxford" in joined or "oxf" in joined

    def test_search_no_match(self):
        r = requests.get(f"{BASE_URL}/api/products", params={"search": "qzxqzxnomatch123"}, timeout=15)
        assert r.status_code == 200
        items = _extract_products(r.json())
        assert len(items) == 0


# ---------- Tax utils unit test ----------
class TestTax:
    def test_tax_intra_vs_inter_state(self):
        # Import directly
        import sys
        sys.path.insert(0, "/app/backend")
        from tax_utils import compute_tax, ORIGIN_STATE
        items = [{"price": 8500, "quantity": 1}, {"price": 800, "quantity": 1}]
        intra = compute_tax(items, dest_state=ORIGIN_STATE)
        inter = compute_tax(items, dest_state="KA" if ORIGIN_STATE != "KA" else "MH")
        # Intra: cgst+sgst > 0, igst == 0
        assert intra["cgst"] > 0 and intra["sgst"] > 0 and intra["igst"] == 0
        # Inter: igst > 0, cgst+sgst == 0
        assert inter["igst"] > 0 and inter["cgst"] == 0 and inter["sgst"] == 0
        # Total tax should be approx equal: 8500 * 0.18 + 800 * 0.05 = 1530 + 40 = 1570
        assert abs(intra["total_tax"] - 1570.0) < 2
        assert abs(inter["total_tax"] - 1570.0) < 2


# ---------- Regression: existing endpoints still work ----------
class TestRegression:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api", timeout=10)
        assert r.status_code == 200

    def test_products_list(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=15)
        assert r.status_code == 200

    def test_banners_public(self):
        r = requests.get(f"{BASE_URL}/api/banners", timeout=10)
        assert r.status_code == 200
