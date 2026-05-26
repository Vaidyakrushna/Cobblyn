import bcrypt
import jwt
import os
import re
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request
from bson import ObjectId

JWT_ALGORITHM = "HS256"


def get_jwt_secret():
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET is not configured. Set JWT_SECRET in backend/.env "
            "or via Emergent secrets, then restart the backend."
        )
    return secret


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    # 24 hours for managers and support agents performing modifications, 15 minutes for storefront users
    token_lifetime = timedelta(hours=24) if role in ("admin", "super_admin", "staff") else timedelta(minutes=15)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + token_lifetime,
        "type": "access",
        "jti": uuid.uuid4().hex,
        "iat": int(datetime.now(timezone.utc).timestamp())
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
        "jti": uuid.uuid4().hex,
        "iat": int(datetime.now(timezone.utc).timestamp())
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response, access_token: str, refresh_token: str):
    is_prod = os.environ.get("ENV") == "production"
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=is_prod, samesite="lax",
        max_age=86400, path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=is_prod, samesite="lax",
        max_age=604800, path="/"
    )


async def get_current_user(request: Request, db) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        # Decode without verifying expiration first to handle custom route/role based exceptions
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM], options={"verify_exp": False})
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Dynamic Token Expiration Enforcements:
        # 1. Normal users always expire after 15 minutes (900 seconds) from issued-at (iat)
        # 2. Staff/admin expire after 15 minutes on all endpoints EXCEPT order modification
        # 3. Staff/admin on order modification endpoints expire after 24 hours (86400 seconds) from issued-at (iat)
        role = payload.get("role", "user")
        iat = payload.get("iat")
        now_ts = int(datetime.now(timezone.utc).timestamp())
        token_age = now_ts - iat if iat else 0

        # Check if the requested endpoint is an order modification path
        path = request.url.path
        is_order_mod_path = any(
            p in path for p in [
                "/direct-modify",
                "/propose-modification",
                "/approve-modification",
                "/reject-modification"
            ]
        )

        if role in ("admin", "super_admin", "staff"):
            if is_order_mod_path:
                if token_age > 86400:
                    raise HTTPException(status_code=401, detail="Token expired (24h order modification limit)")
            else:
                if token_age > 900:
                    raise HTTPException(status_code=401, detail="Token expired")
        else:
            if token_age > 900:
                raise HTTPException(status_code=401, detail="Token expired")
        
        # 1. Blacklist Check (JTI verification)
        jti = payload.get("jti")
        if jti:
            blacklisted = await db.blacklisted_tokens.find_one({"jti": jti})
            if blacklisted:
                raise HTTPException(status_code=401, detail="Token is revoked")

        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # 2. Password Reset / Change Check (Issued-At validation)
        pwd_changed = user.get("password_changed_at")
        if pwd_changed and iat:
            if isinstance(pwd_changed, str):
                try:
                    dt = datetime.fromisoformat(pwd_changed.replace("Z", "+00:00"))
                    pwd_changed_ts = int(dt.timestamp())
                except Exception:
                    pwd_changed_ts = 0
            else:
                pwd_changed_ts = int(pwd_changed)
            
            if iat < pwd_changed_ts:
                raise HTTPException(status_code=401, detail="Token is revoked due to credentials update")

        user["_id"] = str(user["_id"])
        user["id"] = user["_id"]  # convenience alias used across routes
        user.pop("password_hash", None)
        # Block check
        if user.get("blocked"):
            raise HTTPException(status_code=403, detail="Account is blocked. Contact support.")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(request: Request, db):
    """Returns user dict if authenticated, None otherwise."""
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character")


async def log_security_event(db, actor_id: str, actor_email: str, action: str, target: str, details: dict):
    await db.security_audit_logs.insert_one({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": actor_id,
        "actor_email": actor_email,
        "action": action,
        "target": target,
        "details": details
    })

