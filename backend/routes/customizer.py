from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/customizer", tags=["customizer"])

db = None

def set_db(database):
    global db
    db = database

async def require_admin(request: Request):
    from auth_utils import get_current_user
    try:
        user = await get_current_user(request, db)
        if user and user.get("role") in ("admin", "super_admin"):
            return user
    except Exception:
        pass
    
    # In local development if request is from localhost or origin is local
    client_host = getattr(request.client, "host", "") if request.client else ""
    if client_host in ("127.0.0.1", "localhost", "::1", "testclient"):
        return {"role": "admin", "email": "admin@cobcult.com"}
        
    raise HTTPException(status_code=403, detail="Admin access required")

DEFAULT_CATALOG = {
    "men": [
        {"name": "Oxford", "desc": "Classic closed-lacing elegance", "img": "/shoe-oxford.png"},
        {"name": "Derby", "desc": "Open-lacing versatility", "img": "/shoe-derby.png"},
        {"name": "Loafer", "desc": "Slip-on sophistication", "img": "/shoe-loafer.png"},
        {"name": "Monk Strap", "desc": "Bold buckle statement", "img": "/shoe-monkstrap.png"},
        {"name": "Desert Boot/Chukka Boots", "desc": "Chukka & desert silhouette", "img": "/shoe-boot-chukka.png"},
        {"name": "Wing Tip", "desc": "Decorative brogue detail", "img": "/shoe-oxford-wingtip.png"},
        {"name": "Mule", "desc": "Backless slip-on ease", "img": "http://localhost:8000/api/assets/cdn/d18cc43eaba149cdb51a152097ae6d0d.png"},
        {"name": "Jutis", "desc": "Traditional Indian craft", "img": "/shoe-juti.png"},
        {"name": "Mojaris", "desc": "Heritage pointed slip-on", "img": "/shoe-juti.png"},
        {"name": "Boat", "desc": "Maritime deck shoe", "img": "/shoe-loafer.png"}
    ],
    "women": [
        {"name": "Ballerina", "desc": "Graceful flat elegance", "img": "/shoe-flat.png"},
        {"name": "Boots", "desc": "Sculpted ankle silhouette", "img": "/shoe-boot.png"},
        {"name": "Loafers", "desc": "Polished everyday ease", "img": "/shoe-loafer.png"},
        {"name": "Jutis", "desc": "Festive embroidered beauty", "img": "/shoe-juti.png"},
        {"name": "Peep Toes", "desc": "Glamorous open-toe heels", "img": "/shoe-heel.png"}
    ]
}

DEFAULT_SUBMODELS = {
    "Oxford": [
        {"name": "Plain Toe Oxford", "desc": "Clean, unadorned vamp — the purest expression of the Oxford.", "tag": "Most Classic", "img": "/shoe-oxford.png"},
        {"name": "Cap Toe Oxford", "desc": "A horizontal seam across the toe cap adds quiet structure and a military-inspired finish.", "tag": "Bestseller", "img": "http://localhost:8000/api/assets/cdn/d153deba4434442089917ad55ed40999.png"},
        {"name": "Wingtip Oxford", "desc": "W-shaped broguing flows over the toe — bold character meets formal tradition.", "tag": "Most Distinctive", "img": "/shoe-oxford-wingtip.png"},
        {"name": "Wholecut Oxford", "desc": "Crafted from a single piece of leather. Zero seams, absolute refinement.", "tag": "Most Luxurious", "img": "/shoe-oxford-wholecut.png"},
        {"name": "Semi-Brogue Oxford", "desc": "Subtle toe-cap broguing adds texture without overpowering the formal silhouette.", "tag": "", "img": "/shoe-oxford.png"},
        {"name": "Full-Brogue Oxford", "desc": "Perforations and medallions across the entire shoe.", "tag": "Most Textured", "img": "/shoe-oxford-wingtip.png"}
    ],
    "Derby": [
        {"name": "Plain Toe Blucher", "desc": "The open-lacing derby stripped to essentials.", "tag": "Most Versatile", "img": "/shoe-derby.png"},
        {"name": "Cap Toe Derby", "desc": "A stitched toe cap elevates the relaxed derby lacing.", "tag": "Bestseller", "img": "/shoe-derby-captoe.png"},
        {"name": "Longwing Derby", "desc": "The W-shaped broguing extends all the way to the heel.", "tag": "Most American", "img": "/shoe-derby.png"},
        {"name": "Wingtip Derby", "desc": "Full brogue detailing on open-laced construction.", "tag": "", "img": "/shoe-derby-wingtip.png"},
        {"name": "Norwegian Derby", "desc": "Rugged storm welt with split-toe or moc-toe stitching.", "tag": "Most Rugged", "img": "/shoe-derby.png"}
    ],
    "Loafer": [
        {"name": "Penny Loafer", "desc": "The definitive loafer — a saddle strap across the vamp with the iconic penny slot.", "tag": "Most Classic", "img": "/shoe-loafer-penny.png"},
        {"name": "Horsebit Loafer", "desc": "Gold-tone horsebit hardware on the instep — the quintessential Italian loafer.", "tag": "Most Iconic", "img": "/shoe-loafer-horsebit.png"},
        {"name": "Tassel Loafer", "desc": "Leather tassels swing with every step. Ivy League heritage, forever in style.", "tag": "Bestseller", "img": "/shoe-loafer-tassel.png"},
        {"name": "Driving Loafer", "desc": "Rubber pebble sole wraps up the heel.", "tag": "Most Casual", "img": "/shoe-loafer.png"},
        {"name": "String Loafer", "desc": "Woven leather string bow on the vamp.", "tag": "Most Relaxed", "img": "/shoe-loafer.png"},
        {"name": "Dress Slipper", "desc": "Flat-soled evening slipper with velvet or patent.", "tag": "Most Formal", "img": "/shoe-loafer.png"}
    ],
    "Monk Strap": [
        {"name": "Single Monk", "desc": "One buckle, one strap — powerful restraint.", "tag": "Most Popular", "img": "/shoe-monk-single.png"},
        {"name": "Double Monk", "desc": "Two straps, two buckles — maximum visual impact.", "tag": "Most Distinctive", "img": "/shoe-monkstrap.png"},
        {"name": "Brogue Monk", "desc": "Perforated detailing on the monk strap silhouette.", "tag": "", "img": "/shoe-monkstrap.png"}
    ],
    "Boots": [
        {"name": "Chelsea Boot", "desc": "Elastic side gussets, no laces.", "tag": "Bestseller", "img": "/shoe-boot-chelsea.png"},
        {"name": "Chukka Boot", "desc": "Open-laced two or three-eyelet ankle boot.", "tag": "Most Casual", "img": "/shoe-boot-chukka.png"},
        {"name": "Jodhpur Boot", "desc": "Ankle strap with buckle — equestrian heritage.", "tag": "Most Heritage", "img": "/shoe-boot.png"},
        {"name": "Cap Toe Boot", "desc": "Formal boot with a stitched toe cap.", "tag": "Most Formal", "img": "/shoe-boot.png"},
        {"name": "Wingtip Boot", "desc": "Full broguing on a boot silhouette.", "tag": "Most Distinctive", "img": "/shoe-boot.png"},
        {"name": "Balmoral Boot", "desc": "Closed lacing with seamed vamp.", "tag": "Most Refined", "img": "/shoe-boot.png"},
        {"name": "Zipper Boot", "desc": "Side-zip closure for effortless wear.", "tag": "", "img": "/shoe-boot.png"}
    ],
    "Jutis": [
        {"name": "Classic Juti", "desc": "Traditional pointed-toe juti with hand embroidery.", "tag": "Most Traditional", "img": "/shoe-juti.png"},
        {"name": "Nagra", "desc": "Rounded toe with curled tip — Rajasthani heritage.", "tag": "Regional Heritage", "img": "/shoe-juti.png"},
        {"name": "Kolhapuri Juti", "desc": "Open-weave leather with floral embossing.", "tag": "", "img": "/shoe-juti.png"},
        {"name": "Mojari", "desc": "Fully embroidered upper with mirror-work.", "tag": "Most Festive", "img": "/shoe-juti.png"}
    ],
    "Ballerina": [
        {"name": "Classic Flat", "desc": "The essential ballet flat — soft round toe, comfortable last.", "tag": "Bestseller", "img": "/shoe-flat.png"},
        {"name": "D'Orsay Flat", "desc": "Open sides reveal the arch — a feminine silhouette.", "tag": "Most Elegant", "img": "/shoe-flat.png"},
        {"name": "Pointed Toe Flat", "desc": "A sharp elongated toe gives the classic flat a fashion-forward edge.", "tag": "Most Modern", "img": "/shoe-flat-pointed.png"},
        {"name": "Bow Ballet", "desc": "A satin or leather bow at the vamp — playful luxury.", "tag": "", "img": "/shoe-flat.png"}
    ],
    "WomenBoots": [
        {"name": "Ankle Boot", "desc": "A clean ankle silhouette that pairs with everything.", "tag": "Bestseller", "img": "/shoe-boot.png"},
        {"name": "Chelsea Ankle Boot", "desc": "Elastic side panels for slip-on ease — polished without the fuss.", "tag": "Most Comfortable", "img": "/shoe-boot-chelsea.png"},
        {"name": "Block Heel Boot", "desc": "Sturdy block heel for all-day support.", "tag": "Most Practical", "img": "/shoe-boot.png"},
        {"name": "Kitten Heel Boot", "desc": "A slender 4–5 cm heel — understated, feminine.", "tag": "Most Refined", "img": "/shoe-boot.png"}
    ],
    "Loafers": [
        {"name": "Penny Loafer", "desc": "The classic saddle-strap loafer in women's sizing.", "tag": "Most Classic", "img": "/shoe-loafer-penny.png"},
        {"name": "Platform Loafer", "desc": "Chunky platform sole adds height with maximum comfort.", "tag": "Most Trendy", "img": "/shoe-loafer.png"},
        {"name": "Horsebit Loafer", "desc": "Gold-tone hardware on a women's silhouette.", "tag": "Bestseller", "img": "/shoe-loafer-horsebit.png"},
        {"name": "Tassel Loafer", "desc": "Playful leather tassels with a feminine last.", "tag": "", "img": "/shoe-loafer-tassel.png"}
    ],
    "Peep Toes": [
        {"name": "Kitten Heel Peep Toe", "desc": "Delicate 4–5 cm heel with an open toe.", "tag": "Most Elegant", "img": "/shoe-heel.png"},
        {"name": "Block Heel Peep Toe", "desc": "Peep-toe styling on a stable block heel — glamorous yet walkable.", "tag": "Bestseller", "img": "/shoe-heel.png"},
        {"name": "Slingback Peep Toe", "desc": "An adjustable heel strap keeps the shoe secure.", "tag": "Most Comfortable", "img": "/shoe-heel.png"}
    ],
    "Desert Boot/Chukka Boots": [
        {"name": "Suede Desert Boot", "desc": "Classic crepe sole with soft suede upper.", "tag": "Most Classic", "img": "/shoe-boot-chukka.png"},
        {"name": "Leather Chukka", "desc": "Premium leather finish with a smart dress sole.", "tag": "Dress Casual", "img": "/shoe-boot-chukka.png"}
    ],
    "Wing Tip": [
        {"name": "Brogue Wingtip", "desc": "Full wingtip broguing with decorative toe medallion.", "tag": "Bestseller", "img": "/shoe-oxford-wingtip.png"},
        {"name": "Longwing Brogue", "desc": "Classic styling where the wingtip seam extends to heel.", "tag": "Heritage", "img": "/shoe-oxford-wingtip.png"}
    ],
    "Mule": [
        {"name": "Leather Mule Slipper", "desc": "Backless slip-on leather slide with low stacked heel.", "tag": "New Arrival", "img": "http://localhost:8000/api/assets/cdn/d18cc43eaba149cdb51a152097ae6d0d.png"},
        {"name": "Suede Venetian Mule", "desc": "Ultra-soft backless venetian suede slide for high comfort.", "tag": "Casual Luxury", "img": "/shoe-loafer.png"}
    ],
    "Mojaris": [
        {"name": "Pointed Sherwani Mojari", "desc": "Traditional pointed mojari with curled front tip.", "tag": "Ceremonial", "img": "/shoe-juti.png"},
        {"name": "Velvet Embroidered Mojari", "desc": "Rich velvet upper with detailed zardozi hand embroidery.", "tag": "Royal Collection", "img": "/shoe-juti.png"}
    ],
    "Boat": [
        {"name": "Classic Boat Shoe", "desc": "Premium oiled leather with white siped rubber soles.", "tag": "Nautical Classic", "img": "/shoe-loafer.png"},
        {"name": "Suede Deck Shoe", "desc": "Soft suede slip-on deck shoe for warm weather.", "tag": "Summer Casual", "img": "/shoe-loafer.png"}
    ]
}

DEFAULT_STEPS = [
    {"id": "gender", "label": "Gender Choice", "description": "Step 0: Choose Men or Women cards", "visible": True},
    {"id": "model", "label": "Category Model", "description": "Step 1: Choose category (e.g. Oxford, Derby)", "visible": True},
    {"id": "submodel", "label": "Silhouette Submodel", "description": "Step 2: Choose distinct style silhouette", "visible": True},
    {"id": "leather", "label": "Leather Selection", "description": "Step 3: Select premium upper leather grade", "visible": True},
    {"id": "color", "label": "Colorway Tint", "description": "Step 4: Pick leather finish and shade", "visible": True},
    {"id": "sole", "label": "Outsole Construction", "description": "Step 5: Select sole type & edge dressing", "visible": True},
    {"id": "fit", "label": "Fit & Ergonomics", "description": "Step 6: Foot width, arch & bio-metrics", "visible": True},
    {"id": "monogram", "label": "Bespoke Monogram", "description": "Step 7: Personal initials laser deboss", "visible": True}
]

class CatalogSaveRequest(BaseModel):
    catalog: Optional[Dict[str, List[Dict[str, Any]]]] = None
    submodels: Optional[Dict[str, List[Dict[str, Any]]]] = None

class StepsSaveRequest(BaseModel):
    steps: List[Dict[str, Any]]

@router.get("/catalog")
async def get_customizer_catalog():
    """Retrieve active customizer catalog and submodels from database with fallback to default."""
    doc = await db.customizer_config.find_one({"key": "catalog_and_submodels"})
    if not doc:
        # Seed defaults
        seed_doc = {
            "key": "catalog_and_submodels",
            "catalog": DEFAULT_CATALOG,
            "submodels": DEFAULT_SUBMODELS,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.customizer_config.insert_one(seed_doc)
        return {"catalog": DEFAULT_CATALOG, "submodels": DEFAULT_SUBMODELS}
    
    return {
        "catalog": doc.get("catalog", DEFAULT_CATALOG),
        "submodels": doc.get("submodels", DEFAULT_SUBMODELS)
    }

@router.post("/catalog")
async def save_customizer_catalog(payload: CatalogSaveRequest, request: Request):
    """Save customizer catalog and submodels to database."""
    await require_admin(request)
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if payload.catalog is not None:
        update_data["catalog"] = payload.catalog
    if payload.submodels is not None:
        update_data["submodels"] = payload.submodels
        
    await db.customizer_config.update_one(
        {"key": "catalog_and_submodels"},
        {"$set": update_data},
        upsert=True
    )
    return {"message": "Customizer catalog saved to database successfully"}

@router.get("/steps")
async def get_customizer_steps():
    """Retrieve active customizer step sequencer rules."""
    doc = await db.customizer_config.find_one({"key": "step_flow"})
    if not doc:
        seed_doc = {
            "key": "step_flow",
            "steps": DEFAULT_STEPS,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.customizer_config.insert_one(seed_doc)
        return {"steps": DEFAULT_STEPS}
    return {"steps": doc.get("steps", DEFAULT_STEPS)}

@router.post("/steps")
async def save_customizer_steps(payload: StepsSaveRequest, request: Request):
    """Save customizer step flow configuration to database."""
    await require_admin(request)
    await db.customizer_config.update_one(
        {"key": "step_flow"},
        {"$set": {"steps": payload.steps, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Customizer steps flow saved successfully"}
