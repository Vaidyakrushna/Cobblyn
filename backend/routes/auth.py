from fastapi import APIRouter, HTTPException, Request, Response, BackgroundTasks
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from bson import ObjectId
import secrets
import logging

from auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    set_auth_cookies, get_current_user, get_jwt_secret, JWT_ALGORITHM
)
import jwt
from email_utils import send_verification_email, send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Will be set from server.py
db = None


def set_db(database):
    global db
    db = database


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def user_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]) if isinstance(user.get("_id"), ObjectId) else user.get("_id", ""),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
    }


async def check_brute_force(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record and record.get("attempts", 0) >= 5:
        lockout_until = record.get("lockout_until")
        if lockout_until and datetime.now(timezone.utc) < lockout_until:
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})


async def record_failed_attempt(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record:
        new_attempts = record.get("attempts", 0) + 1
        update = {"$set": {"attempts": new_attempts, "last_attempt": datetime.now(timezone.utc)}}
        if new_attempts >= 5:
            update["$set"]["lockout_until"] = datetime.now(timezone.utc) + __import__("datetime").timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "attempts": 1,
            "last_attempt": datetime.now(timezone.utc)
        })


@router.post("/register")
async def register(req: RegisterRequest, request: Request, response: Response, background_tasks: BackgroundTasks):
    # Rate limit: 5 registration attempts per IP per hour
    client_ip = request.client.host if request.client else "unknown"
    rl_key = f"register:{client_ip}"
    rl_doc = await db.rate_limits.find_one({"key": rl_key})
    if rl_doc and rl_doc.get("count", 0) >= 5:
        ts = rl_doc.get("first_at")
        if ts and (datetime.now(timezone.utc) - datetime.fromisoformat(ts)).total_seconds() < 3600:
            raise HTTPException(status_code=429, detail="Too many registration attempts. Try again later.")
        await db.rate_limits.delete_one({"key": rl_key})
    await db.rate_limits.update_one(
        {"key": rl_key},
        {"$inc": {"count": 1}, "$setOnInsert": {"first_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    user_doc = {
        "name": req.name.strip(),
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    verify_token = secrets.token_urlsafe(32)
    await db.email_verification_tokens.insert_one({
        "token": verify_token,
        "user_id": result.inserted_id,
        "expires_at": datetime.now(timezone.utc) + __import__("datetime").timedelta(hours=24)
    })
    
    # Enqueue email to be sent silently in the background
    background_tasks.add_task(send_verification_email, email, verify_token)
    logger.info(f"Verification email task queued for {email}")

    return {"message": "Registration successful. Please check your email to verify your account."}


@router.post("/login")
async def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"

    await check_brute_force(identifier)

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_verified", True): # Assume True if missing (for older accounts)
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")

    await db.login_attempts.delete_one({"identifier": identifier})

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    return {"id": user_id, "name": user["name"], "email": email, "role": user.get("role", "user"), "token": access_token}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(request: Request):
    user = await get_current_user(request, db)
    return user_response({"_id": user["_id"], "name": user["name"], "email": user["email"], "role": user.get("role", "user")})


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        new_access = create_access_token(user_id, user["email"])
        new_refresh = create_refresh_token(user_id)
        
        response.set_cookie(
            key="access_token", value=new_access,
            httponly=True, secure=False, samesite="lax",
            max_age=900, path="/"
        )
        response.set_cookie(
            key="refresh_token", value=new_refresh,
            httponly=True, secure=False, samesite="lax",
            max_age=7*24*3600, path="/"
        )
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

class VerifyEmailRequest(BaseModel):
    token: str

@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    record = await db.email_verification_tokens.find_one({"token": req.token})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    if datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Verification token expired")
    
    await db.users.update_one({"_id": record["user_id"]}, {"$set": {"is_verified": True}})
    await db.email_verification_tokens.delete_many({"user_id": record["user_id"]})
    return {"message": "Email verified successfully"}


class ResendVerificationRequest(BaseModel):
    email: EmailStr

@router.post("/resend-verification")
async def resend_verification(req: ResendVerificationRequest, background_tasks: BackgroundTasks):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        # Prevent email enumeration
        return {"message": "If the email exists and is unverified, a new verification link has been sent."}
    
    if user.get("is_verified"):
        return {"message": "Email is already verified. You can log in."}
        
    verify_token = secrets.token_urlsafe(32)
    # Remove old tokens
    await db.email_verification_tokens.delete_many({"user_id": user["_id"]})
    
    await db.email_verification_tokens.insert_one({
        "token": verify_token,
        "user_id": user["_id"],
        "expires_at": datetime.now(timezone.utc) + __import__("datetime").timedelta(hours=24)
    })
    
    # Enqueue email to be sent silently in the background
    background_tasks.add_task(send_verification_email, email, verify_token)
    logger.info(f"Resend verification email task queued for {email}")

    return {"message": "A new verification link has been sent to your email."}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": user["_id"],
        "expires_at": datetime.now(timezone.utc) + __import__("datetime").timedelta(hours=1),
        "used": False
    })
    
    # Enqueue password reset email to be sent in the background
    background_tasks.add_task(send_password_reset_email, email, token)
    logger.info(f"Password reset email task queued for {email}")
    
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    record = await db.password_reset_tokens.find_one({"token": req.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset token expired")

    new_hash = hash_password(req.new_password)
    await db.users.update_one({"_id": record["user_id"]}, {"$set": {"password_hash": new_hash}})
    await db.password_reset_tokens.update_one({"token": req.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully"}
