from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime, timezone

from auth_utils import hash_password, verify_password
from routes import auth as auth_routes
from routes import products as product_routes
from routes import cart as cart_routes
from routes import wishlist as wishlist_routes
from routes import admin as admin_routes
from routes import materials as material_routes
from routes import rules as rules_routes
from routes import orders as order_routes
from routes import customers as customer_routes
from routes import account as account_routes
from routes import inventory as inventory_routes
from routes import production as production_routes
from routes import visits as visit_routes
from routes import banners as banner_routes
from routes import uploads as upload_routes
from routes import reviews as review_routes
from routes import coupons as coupon_routes
from routes import returns as return_routes
from routes import analytics as analytics_routes
from routes import bulk as bulk_routes
from routes import admin_users as admin_user_routes
from routes import wishlist_extra as wishlist_extra_routes
from routes import categories as category_routes
from routes import accessories as accessory_routes
from routes import vendors as vendor_routes
from routes import materials_planning as materials_planning_routes
from routes import audit_logs as audit_log_routes
from routes import jobs as jobs_routes
from routes import assets as asset_routes
from routes import vendor_portal as vendor_portal_routes
from routes import referrals as referral_routes
from routes import vip as vip_routes

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
print("SERVER RUNNING WITH TESTING =", os.environ.get("TESTING"))

# Set db on all route modules
auth_routes.set_db(db)
product_routes.set_db(db)
cart_routes.set_db(db)
wishlist_routes.set_db(db)
admin_routes.set_db(db)
material_routes.set_db(db)
rules_routes.set_db(db)
order_routes.set_db(db)
customer_routes.set_db(db)
account_routes.set_db(db)
inventory_routes.set_db(db)
production_routes.set_db(db)
visit_routes.set_db(db)
banner_routes.set_db(db)
upload_routes.set_db(db)
review_routes.set_db(db)
coupon_routes.set_db(db)
return_routes.set_db(db)
analytics_routes.set_db(db)
bulk_routes.set_db(db)
admin_user_routes.set_db(db)
wishlist_extra_routes.set_db(db)
category_routes.set_db(db)
accessory_routes.set_db(db)
vendor_routes.set_db(db)
materials_planning_routes.set_db(db)
audit_log_routes.set_db(db)
jobs_routes.set_db(db)
asset_routes.set_db(db)
vendor_portal_routes.set_db(db)
referral_routes.set_db(db)
vip_routes.set_db(db)


app = FastAPI()

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Security Headers Middleware
from fastapi import Request
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com;"
    )
    return response


# Include routers
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(cart_routes.router)
app.include_router(wishlist_routes.router)
app.include_router(admin_routes.router)
app.include_router(material_routes.router)
app.include_router(rules_routes.router)
app.include_router(order_routes.router)
app.include_router(customer_routes.router)
app.include_router(account_routes.router)
app.include_router(inventory_routes.router)
app.include_router(production_routes.router)
app.include_router(visit_routes.router)
app.include_router(banner_routes.router)
app.include_router(upload_routes.router)
app.include_router(review_routes.router)
app.include_router(coupon_routes.router)
app.include_router(return_routes.router)
app.include_router(analytics_routes.router)
app.include_router(bulk_routes.router)
app.include_router(admin_user_routes.router)
app.include_router(wishlist_extra_routes.router)
app.include_router(category_routes.router)
app.include_router(accessory_routes.router)
app.include_router(vendor_routes.router)
app.include_router(materials_planning_routes.router)
app.include_router(audit_log_routes.router)
app.include_router(jobs_routes.router)
app.include_router(asset_routes.router)
app.include_router(vendor_portal_routes.router)
app.include_router(referral_routes.router)
app.include_router(vip_routes.router)


# ---- Rate limiting (slowapi) ----
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from rate_limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Serve uploaded images statically (admin uploads via /api/uploads/image)
from pathlib import Path as _PathStatic
_uploads_dir = _PathStatic(__file__).parent / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


@app.get("/api")
async def root():
    return {"message": "Cobblyn Shoes API"}


# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


from seed import seed_all

@app.on_event("startup")
async def startup():
    await seed_all(db)
    
    # Start the asyncio background jobs queue worker thread
    from jobs_queue import start_worker
    start_worker()

    # Write test credentials
    creds_path = Path("/app/memory/test_credentials.md")
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@cobblyn.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Cobblyn@2026")
    creds_path.write_text(
        f"# Test Credentials\n\n"
        f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n"
        f"## Test User\n- Email: test@cobblyn.com\n- Password: Test@1234\n- Role: user\n- (Create via /api/auth/register)\n\n"
        f"## Auth Endpoints\n"
        f"- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n"
        f"- GET /api/auth/me\n- POST /api/auth/refresh\n\n"
        f"## Product Endpoints\n"
        f"- GET /api/products\n- GET /api/products/:id\n"
        f"- POST /api/products (admin)\n- PUT /api/products/:id (admin)\n- DELETE /api/products/:id (admin)\n\n"
        f"## Cart Endpoints (auth required)\n"
        f"- GET /api/cart\n- POST /api/cart/add\n- PUT /api/cart/update\n- DELETE /api/cart/remove\n- DELETE /api/cart/clear\n\n"
        f"## Wishlist Endpoints (auth required)\n"
        f"- GET /api/wishlist\n- POST /api/wishlist/add\n- DELETE /api/wishlist/remove\n- GET /api/wishlist/check/:product_id\n"
    )
    logger.info("Test credentials written")


@app.on_event("shutdown")
async def shutdown():
    client.close()
