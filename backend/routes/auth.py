from fastapi import APIRouter, HTTPException, Request, Response, BackgroundTasks
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import secrets
import logging
import html

from auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    set_auth_cookies, get_current_user, get_jwt_secret, JWT_ALGORITHM,
    validate_password_strength
)
import jwt
from email_utils import send_verification_email, send_password_reset_email
from rate_limiter import limiter

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
    referral_code: Optional[str] = None

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        validate_password_strength(v)
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        validate_password_strength(v)
        return v



def user_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]) if isinstance(user.get("_id"), ObjectId) else user.get("_id", ""),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "referral_code": user.get("referral_code", ""),
        "wallet_balance": user.get("wallet_balance", 0.0),
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
@limiter.limit("5/minute")
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

    referred_by_code = None
    initial_wallet = 0.0
    referrer_user = None

    if req.referral_code:
        ref_code_clean = req.referral_code.strip().upper()
        referrer_user = await db.users.find_one({"referral_code": ref_code_clean})
        if not referrer_user:
            raise HTTPException(status_code=400, detail="Invalid referral code")
        referred_by_code = ref_code_clean
        initial_wallet = 250.0  # Referee welcome credit

    from routes.referrals import generate_referral_code
    new_ref_code = await generate_referral_code(db)

    hashed = hash_password(req.password)
    user_doc = {
        "name": html.escape(req.name.strip()),
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_verified": False,
        "referral_code": new_ref_code,
        "referred_by": referred_by_code,
        "wallet_balance": initial_wallet,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = result.inserted_id

    # If referred by someone, create a ledger record and add welcome transaction
    if referred_by_code and referrer_user:
        await db.referrals.insert_one({
            "referrer_id": referrer_user["_id"],
            "referee_id": user_id,
            "referee_name": user_doc["name"],
            "referee_email": user_doc["email"],
            "status": "pending",
            "reward_amount": 500.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.wallet_transactions.insert_one({
            "user_id": user_id,
            "amount": 250.0,
            "type": "credit",
            "description": "Welcome bonus for signing up via referral",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

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
@limiter.limit("5/minute")
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
    access_token = create_access_token(user_id, email, role=user.get("role", "user"))
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "id": user_id,
        "name": user["name"],
        "email": email,
        "role": user.get("role", "user"),
        "referral_code": user.get("referral_code", ""),
        "wallet_balance": user.get("wallet_balance", 0.0),
        "token": access_token
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    # Blacklist access token
    if access_token:
        try:
            payload = jwt.decode(access_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc) + timedelta(minutes=15)
                await db.blacklisted_tokens.insert_one({
                    "jti": jti,
                    "expires_at": expires_at,
                    "type": "access",
                    "created_at": datetime.now(timezone.utc)
                })
        except Exception:
            pass

    # Blacklist refresh token
    if refresh_token:
        try:
            payload = jwt.decode(refresh_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc) + timedelta(days=7)
                await db.blacklisted_tokens.insert_one({
                    "jti": jti,
                    "expires_at": expires_at,
                    "type": "refresh",
                    "created_at": datetime.now(timezone.utc)
                })
        except Exception:
            pass

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@router.get("/me")
async def get_me(request: Request):
    user = await get_current_user(request, db)
    # Ensure they have a referral code dynamically
    if not user.get("referral_code"):
        from routes.referrals import generate_referral_code
        ref_code = await generate_referral_code(db)
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"referral_code": ref_code}})
        user["referral_code"] = ref_code
    return user_response(user)


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
        new_access = create_access_token(user_id, user["email"], role=user.get("role", "user"))
        new_refresh = create_refresh_token(user_id)
        
        set_auth_cookies(response, new_access, new_refresh)
        return {"message": "Token refreshed", "token": new_access}
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
@limiter.limit("5/minute")
async def forgot_password(req: ForgotPasswordRequest, request: Request, background_tasks: BackgroundTasks):
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
@limiter.limit("5/minute")
async def reset_password(req: ResetPasswordRequest, request: Request):
    record = await db.password_reset_tokens.find_one({"token": req.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset token expired")

    new_hash = hash_password(req.new_password)
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"_id": record["user_id"]},
        {"$set": {"password_hash": new_hash, "password_changed_at": now_iso}}
    )
    await db.password_reset_tokens.update_one({"token": req.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully"}
