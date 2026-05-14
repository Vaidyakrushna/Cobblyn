import bcrypt
import jwt
import os
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


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=False, samesite="lax",
        max_age=900, path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=False, samesite="lax",
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
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
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
