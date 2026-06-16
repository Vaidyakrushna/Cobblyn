"""
Cobblyn Shoes API Tests
Tests for: Products, Auth, Cart, Wishlist APIs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@cobblyn.com"
ADMIN_PASSWORD = "Cobblyn@2026"
TEST_USER_EMAIL = "test@cobblyn.com"
TEST_USER_PASSWORD = "Test@1234"


class TestHealthAndProducts:
    """Test product endpoints - no auth required"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Cobblyn Shoes API"
        print("✓ API root endpoint working")
    
    def test_get_all_products(self):
        """GET /api/products - Should return 14 seeded products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert data["total"] == 14, f"Expected 14 products, got {data['total']}"
        assert len(data["products"]) == 14
        print(f"✓ GET /api/products returns {data['total']} products")
    
    def test_get_men_products(self):
        """GET /api/products?gender=men - Should return 8 men's products"""
        response = requests.get(f"{BASE_URL}/api/products?gender=men")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 8, f"Expected 8 men's products, got {data['total']}"
        for product in data["products"]:
            assert product["gender"] == "men"
        print(f"✓ GET /api/products?gender=men returns {data['total']} products")
    
    def test_get_women_products(self):
        """GET /api/products?gender=women - Should return 6 women's products"""
        response = requests.get(f"{BASE_URL}/api/products?gender=women")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 6, f"Expected 6 women's products, got {data['total']}"
        for product in data["products"]:
            assert product["gender"] == "women"
        print(f"✓ GET /api/products?gender=women returns {data['total']} products")
    
    def test_get_products_sorted_by_price_low(self):
        """GET /api/products?sort=price-low - Products sorted by price ascending"""
        response = requests.get(f"{BASE_URL}/api/products?sort=price-low")
        assert response.status_code == 200
        data = response.json()
        products = data["products"]
        prices = [p["price"] for p in products]
        assert prices == sorted(prices), "Products not sorted by price ascending"
        print(f"✓ GET /api/products?sort=price-low returns sorted products (lowest: {prices[0]}, highest: {prices[-1]})")
    
    def test_get_products_sorted_by_price_high(self):
        """GET /api/products?sort=price-high - Products sorted by price descending"""
        response = requests.get(f"{BASE_URL}/api/products?sort=price-high")
        assert response.status_code == 200
        data = response.json()
        products = data["products"]
        prices = [p["price"] for p in products]
        assert prices == sorted(prices, reverse=True), "Products not sorted by price descending"
        print(f"✓ GET /api/products?sort=price-high returns sorted products (highest: {prices[0]}, lowest: {prices[-1]})")
    
    def test_get_single_product(self):
        """GET /api/products/:id - Should return a single product with all fields"""
        # First get all products to get a valid ID
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()["products"]
        product_id = products[0]["id"]
        
        # Get single product
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        product = response.json()
        
        # Verify all required fields
        required_fields = ["id", "name", "price", "colors", "sizes", "images", "features", "specifications", "gender", "style", "material"]
        for field in required_fields:
            assert field in product, f"Missing field: {field}"
        
        assert isinstance(product["colors"], list)
        assert isinstance(product["sizes"], list)
        assert isinstance(product["images"], list)
        assert isinstance(product["features"], list)
        assert isinstance(product["specifications"], dict)
        print(f"✓ GET /api/products/{product_id} returns product with all fields: {product['name']}")
    
    def test_get_product_not_found(self):
        """GET /api/products/:id - Should return 404 for non-existent product"""
        response = requests.get(f"{BASE_URL}/api/products/000000000000000000000000")
        assert response.status_code == 404
        print("✓ GET /api/products/invalid_id returns 404")


class TestAuth:
    """Test authentication endpoints"""
    
    def test_register_new_user(self):
        """POST /api/auth/register - Register new user, returns token"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@cobblyn.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": unique_email,
            "password": "TestPass@123"
        })
        assert response.status_code == 200, f"Register failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "id" in data
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Test User"
        print(f"✓ POST /api/auth/register creates user and returns token")
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register - Should fail for duplicate email"""
        # First register
        unique_email = f"dup_{uuid.uuid4().hex[:8]}@cobblyn.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": unique_email,
            "password": "TestPass@123"
        })
        # Try to register again
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User 2",
            "email": unique_email,
            "password": "TestPass@456"
        })
        assert response.status_code == 400
        print("✓ POST /api/auth/register rejects duplicate email")
    
    def test_login_success(self):
        """POST /api/auth/login - Login with email/password, returns token and user"""
        # First register a user
        unique_email = f"login_{uuid.uuid4().hex[:8]}@cobblyn.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Login Test",
            "email": unique_email,
            "password": "LoginPass@123"
        })
        
        # Now login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "LoginPass@123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "id" in data
        assert data["email"] == unique_email.lower()
        print(f"✓ POST /api/auth/login returns token and user data")
    
    def test_login_admin(self):
        """POST /api/auth/login - Login as admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "admin"
        print(f"✓ POST /api/auth/login admin login successful")
    
    def test_login_wrong_password(self):
        """POST /api/auth/login with wrong password - Should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("✓ POST /api/auth/login with wrong password returns 401")
    
    def test_login_nonexistent_user(self):
        """POST /api/auth/login - Should return 401 for non-existent user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@cobblyn.com",
            "password": "SomePassword123"
        })
        assert response.status_code == 401
        print("✓ POST /api/auth/login with non-existent user returns 401")
    
    def test_get_me_with_token(self):
        """GET /api/auth/me with Bearer token - Should return user data"""
        # Register and get token
        unique_email = f"me_{uuid.uuid4().hex[:8]}@cobblyn.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Me Test",
            "email": unique_email,
            "password": "MePass@123"
        })
        token = reg_response.json()["token"]
        
        # Get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Me Test"
        print(f"✓ GET /api/auth/me returns user data")
    
    def test_get_me_without_token(self):
        """GET /api/auth/me without token - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ GET /api/auth/me without token returns 401")
    
    def test_logout(self):
        """POST /api/auth/logout - Should work"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ POST /api/auth/logout works")


class TestCart:
    """Test cart endpoints - auth required"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for cart tests"""
        unique_email = f"cart_{uuid.uuid4().hex[:8]}@cobblyn.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Cart Test User",
            "email": unique_email,
            "password": "CartPass@123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        """Get a valid product ID"""
        response = requests.get(f"{BASE_URL}/api/products")
        return response.json()["products"][0]["id"]
    
    def test_get_cart_empty(self, auth_token):
        """GET /api/cart with auth - Should return empty cart for new user"""
        response = requests.get(f"{BASE_URL}/api/cart", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["items"] == []
        print("✓ GET /api/cart returns empty cart for new user")
    
    def test_get_cart_without_auth(self):
        """GET /api/cart without auth - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("✓ GET /api/cart without auth returns 401")
    
    def test_add_to_cart(self, auth_token, product_id):
        """POST /api/cart/add with auth - Add item to cart"""
        response = requests.post(f"{BASE_URL}/api/cart/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "size": "9",
                "color": "Black",
                "quantity": 1
            }
        )
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        data = response.json()
        assert "message" in data
        print("✓ POST /api/cart/add adds item to cart")
    
    def test_add_to_cart_and_verify(self, auth_token, product_id):
        """POST /api/cart/add then GET /api/cart - Verify item persisted"""
        # Add item
        requests.post(f"{BASE_URL}/api/cart/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "size": "10",
                "color": "Brown",
                "quantity": 2
            }
        )
        
        # Get cart
        response = requests.get(f"{BASE_URL}/api/cart", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        
        # Find our item
        found = False
        for item in data["items"]:
            if item["product_id"] == product_id and item["size"] == "10" and item["color"] == "Brown":
                assert item["quantity"] == 2
                assert "name" in item  # Populated product details
                assert "price" in item
                found = True
                break
        assert found, "Added item not found in cart"
        print("✓ Cart item persisted with populated product details")
    
    def test_update_cart_item(self, auth_token, product_id):
        """PUT /api/cart/update with auth - Update item quantity"""
        # Add item first
        requests.post(f"{BASE_URL}/api/cart/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "size": "8",
                "color": "Tan",
                "quantity": 1
            }
        )
        
        # Update quantity
        response = requests.put(f"{BASE_URL}/api/cart/update", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "size": "8",
                "color": "Tan",
                "quantity": 5
            }
        )
        assert response.status_code == 200
        
        # Verify update
        cart_response = requests.get(f"{BASE_URL}/api/cart", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        items = cart_response.json()["items"]
        found = False
        for item in items:
            if item["product_id"] == product_id and item["size"] == "8" and item["color"] == "Tan":
                assert item["quantity"] == 5
                found = True
                break
        assert found, "Updated item not found"
        print("✓ PUT /api/cart/update updates item quantity")
    
    def test_remove_from_cart(self, auth_token, product_id):
        """DELETE /api/cart/remove with auth - Remove item from cart"""
        # Add item first
        requests.post(f"{BASE_URL}/api/cart/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "size": "7",
                "color": "Navy",
                "quantity": 1
            }
        )
        
        # Remove item
        response = requests.delete(
            f"{BASE_URL}/api/cart/remove?product_id={product_id}&size=7&color=Navy",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify removal
        cart_response = requests.get(f"{BASE_URL}/api/cart", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        items = cart_response.json()["items"]
        for item in items:
            if item["product_id"] == product_id and item["size"] == "7" and item["color"] == "Navy":
                pytest.fail("Item should have been removed")
        print("✓ DELETE /api/cart/remove removes item from cart")


class TestWishlist:
    """Test wishlist endpoints - auth required"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for wishlist tests"""
        unique_email = f"wish_{uuid.uuid4().hex[:8]}@cobblyn.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Wishlist Test User",
            "email": unique_email,
            "password": "WishPass@123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        """Get a valid product ID"""
        response = requests.get(f"{BASE_URL}/api/products")
        return response.json()["products"][0]["id"]
    
    def test_get_wishlist_empty(self, auth_token):
        """GET /api/wishlist with auth - Should return empty wishlist for new user"""
        response = requests.get(f"{BASE_URL}/api/wishlist", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["items"] == []
        print("✓ GET /api/wishlist returns empty wishlist for new user")
    
    def test_get_wishlist_without_auth(self):
        """GET /api/wishlist without auth - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/wishlist")
        assert response.status_code == 401
        print("✓ GET /api/wishlist without auth returns 401")
    
    def test_add_to_wishlist(self, auth_token, product_id):
        """POST /api/wishlist/add with auth - Add to wishlist"""
        response = requests.post(f"{BASE_URL}/api/wishlist/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id}
        )
        assert response.status_code == 200, f"Add to wishlist failed: {response.text}"
        data = response.json()
        assert "message" in data
        print("✓ POST /api/wishlist/add adds item to wishlist")
    
    def test_add_to_wishlist_and_verify(self, auth_token, product_id):
        """POST /api/wishlist/add then GET /api/wishlist - Verify item persisted"""
        # Add item
        requests.post(f"{BASE_URL}/api/wishlist/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id}
        )
        
        # Get wishlist
        response = requests.get(f"{BASE_URL}/api/wishlist", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        
        # Find our item
        found = False
        for item in data["items"]:
            if item["product_id"] == product_id:
                assert "name" in item  # Populated product details
                assert "price" in item
                found = True
                break
        assert found, "Added item not found in wishlist"
        print("✓ Wishlist item persisted with populated product details")
    
    def test_check_wishlist_true(self, auth_token, product_id):
        """GET /api/wishlist/check/:id with auth - Check if product in wishlist (true)"""
        # Add item first
        requests.post(f"{BASE_URL}/api/wishlist/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id}
        )
        
        # Check
        response = requests.get(f"{BASE_URL}/api/wishlist/check/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] == True
        print("✓ GET /api/wishlist/check returns true for item in wishlist")
    
    def test_check_wishlist_false(self, auth_token):
        """GET /api/wishlist/check/:id with auth - Check if product in wishlist (false)"""
        # Get a product ID that's not in wishlist
        response = requests.get(f"{BASE_URL}/api/products")
        product_id = response.json()["products"][5]["id"]  # Use different product
        
        # Check
        response = requests.get(f"{BASE_URL}/api/wishlist/check/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] == False
        print("✓ GET /api/wishlist/check returns false for item not in wishlist")
    
    def test_remove_from_wishlist(self, auth_token, product_id):
        """DELETE /api/wishlist/remove with auth - Remove from wishlist"""
        # Add item first
        requests.post(f"{BASE_URL}/api/wishlist/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id}
        )
        
        # Remove item
        response = requests.delete(
            f"{BASE_URL}/api/wishlist/remove?product_id={product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify removal
        check_response = requests.get(f"{BASE_URL}/api/wishlist/check/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert check_response.json()["in_wishlist"] == False
        print("✓ DELETE /api/wishlist/remove removes item from wishlist")
    
    def test_add_duplicate_to_wishlist(self, auth_token, product_id):
        """POST /api/wishlist/add - Adding duplicate should not create duplicate"""
        # Add item twice
        requests.post(f"{BASE_URL}/api/wishlist/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id}
        )
        requests.post(f"{BASE_URL}/api/wishlist/add", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"product_id": product_id}
        )
        
        # Get wishlist
        response = requests.get(f"{BASE_URL}/api/wishlist", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        items = response.json()["items"]
        count = sum(1 for item in items if item["product_id"] == product_id)
        assert count == 1, f"Expected 1 item, found {count}"
        print("✓ Adding duplicate to wishlist doesn't create duplicate")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
