from fastapi import APIRouter, HTTPException, Request, UploadFile, File
import csv
import io
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/bulk", tags=["bulk"])

db = None


def set_db(database):
    global db
    db = database


async def _admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin only")
    return user


@router.post("/products")
async def bulk_upload_products(request: Request, file: UploadFile = File(...)):
    """CSV columns: name,style,occasion,material,gender,price,tag,articleCode,description.
    Existing products with same articleCode are updated; new ones created."""
    await _admin(request)
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file")
    raw = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))
    required = {"name", "style", "material", "gender", "price", "articleCode"}
    missing = required - set(reader.fieldnames or [])
    if missing:
        raise HTTPException(400, f"Missing columns: {sorted(missing)}")

    created = updated = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            sku = (row.get("articleCode") or "").strip()
            if not sku:
                errors.append({"row": i, "error": "Missing articleCode"})
                continue
            doc = {
                "name": (row.get("name") or "").strip(),
                "style": (row.get("style") or "").strip(),
                "occasion": (row.get("occasion") or "Daily Wear").strip(),
                "material": (row.get("material") or "").strip(),
                "gender": (row.get("gender") or "men").strip().lower(),
                "price": int(float(row.get("price") or 0)),
                "tag": (row.get("tag") or "").strip(),
                "articleCode": sku,
                "description": (row.get("description") or "").strip(),
            }
            existing = await db.products.find_one({"articleCode": sku})
            if existing:
                await db.products.update_one({"_id": existing["_id"]}, {"$set": doc})
                updated += 1
            else:
                doc.update({"colors": [{"name": "Black", "hex": "#1a1a1a"}], "sizes": ["6","7","8","9","10"], "images": [], "features": [], "specifications": {},
                            "created_at": datetime.now(timezone.utc).isoformat()})
                await db.products.insert_one(doc)
                created += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    return {"created": created, "updated": updated, "errors": errors}


@router.post("/inventory")
async def bulk_upload_inventory(request: Request, file: UploadFile = File(...)):
    """CSV columns: articleCode,size,stock_qty,low_stock_threshold (optional).
    Updates the per-product `size_stock` map (matches existing inventory schema)."""
    await _admin(request)
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file")
    raw = (await file.read()).decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))
    required = {"articleCode", "size", "stock_qty"}
    missing = required - set(reader.fieldnames or [])
    if missing:
        raise HTTPException(400, f"Missing columns: {sorted(missing)}")

    upserted = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            sku = (row.get("articleCode") or "").strip()
            size = (row.get("size") or "").strip()
            qty = int(row.get("stock_qty") or 0)
            threshold = int(row.get("low_stock_threshold") or 5)
            if not sku or not size:
                errors.append({"row": i, "error": "Missing articleCode or size"})
                continue
            # Look up product_id from articleCode (per-product inventory doc with size_stock map)
            product = await db.products.find_one({"articleCode": sku}, {"_id": 1})
            if not product:
                errors.append({"row": i, "error": f"No product with articleCode '{sku}'"})
                continue
            product_id = str(product["_id"])
            await db.inventory.update_one(
                {"product_id": product_id},
                {"$set": {
                    f"size_stock.{size}": qty,
                    "low_stock_threshold": threshold,
                    "articleCode": sku,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }, "$setOnInsert": {"product_id": product_id}},
                upsert=True,
            )
            upserted += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    return {"upserted": upserted, "errors": errors}
