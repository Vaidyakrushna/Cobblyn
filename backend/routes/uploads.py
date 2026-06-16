from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from pathlib import Path
import uuid
import os

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

db = None


def set_db(database):
    global db
    db = database


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _public_url(filename: str, request: Request) -> str:
    """Return URL for the uploaded file. Prefer PUBLIC_BACKEND_URL env, else absolute URL based on request."""
    base = os.environ.get("PUBLIC_BACKEND_URL")
    if base:
        return f"{base.rstrip('/')}/api/uploads/{filename}"
    return f"{str(request.base_url).rstrip('/')}/api/uploads/{filename}"


@router.post("/image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    await require_admin(request)

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {sorted(ALLOWED_EXTS)}")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_BYTES // (1024*1024)} MB")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Verify structural integrity of image file content using Pillow (PIL)
    from PIL import Image
    import io
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image content or corrupt file")

    new_name = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / new_name
    dest.write_bytes(contents)

    return {
        "filename": new_name,
        "url": _public_url(new_name, request),
        "size": len(contents),
        "content_type": file.content_type,
    }
