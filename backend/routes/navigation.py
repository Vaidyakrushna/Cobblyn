from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/navigation", tags=["navigation"])

db = None


def set_db(database):
    global db
    db = database


async def require_admin(request: Request):
    from auth_utils import get_current_user
    user = await get_current_user(request, db)
    if user.get("role") not in ("admin", "super_admin", "staff"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class NavLink(BaseModel):
    label: str
    href: str
    is_highlighted: Optional[bool] = False


class NavColumn(BaseModel):
    title: str
    links: List[NavLink] = []


class FeaturedCard(BaseModel):
    enabled: bool = True
    image_url: str = ""
    badge_text: Optional[str] = ""
    title: Optional[str] = ""
    cta_text: Optional[str] = "Shop Now →"
    link_url: Optional[str] = ""


class NavItemCreate(BaseModel):
    title: str
    nav_type: str = "mega_menu"  # mega_menu | dropdown | direct_link
    href: str = "/"
    order: int = 0
    is_active: bool = True
    badge: Optional[str] = None
    columns: List[NavColumn] = []
    featured_card: Optional[FeaturedCard] = None


class NavItemUpdate(BaseModel):
    title: Optional[str] = None
    nav_type: Optional[str] = None
    href: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    badge: Optional[str] = None
    columns: Optional[List[NavColumn]] = None
    featured_card: Optional[FeaturedCard] = None


class ReorderPayload(BaseModel):
    items: List[Dict[str, Any]]  # [{"id": "...", "order": 1}]


def _serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


def get_default_nav_items():
    return [
        {
            "title": "Men",
            "nav_type": "mega_menu",
            "href": "/men",
            "order": 1,
            "is_active": True,
            "badge": None,
            "columns": [
                {
                    "title": "Style",
                    "links": [
                        {"label": "Oxford", "href": "/men/style/oxford", "is_highlighted": False},
                        {"label": "Loafer", "href": "/men/style/loafer", "is_highlighted": False},
                        {"label": "Monk Strap", "href": "/men/style/monk-strap", "is_highlighted": False},
                        {"label": "Desert Boot/Chukka Boots", "href": "/men/style/desert-boot", "is_highlighted": False},
                        {"label": "Derby", "href": "/men/style/derby", "is_highlighted": False},
                        {"label": "Jutis", "href": "/men/style/jutis", "is_highlighted": False},
                        {"label": "Mojaris", "href": "/men/style/mojaris", "is_highlighted": False},
                        {"label": "Boat", "href": "/men/style/boat", "is_highlighted": False},
                    ]
                },
                {
                    "title": "Occasion",
                    "links": [
                        {"label": "Office", "href": "/men/occasion/office", "is_highlighted": False},
                        {"label": "Casual", "href": "/men/occasion/casual", "is_highlighted": False},
                        {"label": "Daily Wear", "href": "/men/occasion/daily-wear", "is_highlighted": False},
                        {"label": "Party", "href": "/men/occasion/party", "is_highlighted": False},
                        {"label": "Wedding", "href": "/men/occasion/wedding", "is_highlighted": False},
                        {"label": "Travel", "href": "/men/occasion/travel", "is_highlighted": False},
                    ]
                },
                {
                    "title": "Explore",
                    "links": [
                        {"label": "Ready to ship", "href": "/men?tag=ready-to-ship", "is_highlighted": False},
                        {"label": "Schedule Visit", "href": "/bespoke", "is_highlighted": False},
                        {"label": "Customisation", "href": "/customize/men", "is_highlighted": False},
                    ]
                }
            ],
            "featured_card": {
                "enabled": True,
                "image_url": "/wf-nav-men.png",
                "badge_text": "New Arrival",
                "title": "Classic Oxfords",
                "cta_text": "Shop Now →",
                "link_url": "/men"
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Women",
            "nav_type": "mega_menu",
            "href": "/women",
            "order": 2,
            "is_active": True,
            "badge": None,
            "columns": [
                {
                    "title": "Style",
                    "links": [
                        {"label": "Ballerina", "href": "/women/style/ballerina", "is_highlighted": False},
                        {"label": "Boots", "href": "/women/style/boots", "is_highlighted": False},
                        {"label": "Loafers", "href": "/women/style/loafers", "is_highlighted": False},
                        {"label": "Jutis", "href": "/women/style/jutis", "is_highlighted": False},
                        {"label": "Peep Toes", "href": "/women/style/peep-toes", "is_highlighted": False},
                    ]
                },
                {
                    "title": "Occasion",
                    "links": [
                        {"label": "Office", "href": "/women/occasion/office", "is_highlighted": False},
                        {"label": "Casual", "href": "/women/occasion/casual", "is_highlighted": False},
                        {"label": "Daily Wear", "href": "/women/occasion/daily-wear", "is_highlighted": False},
                        {"label": "Party", "href": "/women/occasion/party", "is_highlighted": False},
                        {"label": "Wedding", "href": "/women/occasion/wedding", "is_highlighted": False},
                        {"label": "Travel", "href": "/women/occasion/travel", "is_highlighted": False},
                    ]
                },
                {
                    "title": "Explore",
                    "links": [
                        {"label": "Ready to ship", "href": "/women?tag=ready-to-ship", "is_highlighted": False},
                        {"label": "Schedule Visit", "href": "/bespoke", "is_highlighted": False},
                        {"label": "Customisation", "href": "/customize/women", "is_highlighted": False},
                    ]
                }
            ],
            "featured_card": {
                "enabled": True,
                "image_url": "/wf-nav-women.png",
                "badge_text": "Trending",
                "title": "Evening Heels",
                "cta_text": "Shop Evening →",
                "link_url": "/women"
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Customize",
            "nav_type": "direct_link",
            "href": "/customize",
            "order": 3,
            "is_active": True,
            "badge": None,
            "columns": [],
            "featured_card": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Luxe Collection",
            "nav_type": "direct_link",
            "href": "/luxe-collection",
            "order": 4,
            "is_active": True,
            "badge": None,
            "columns": [],
            "featured_card": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Accessories",
            "nav_type": "dropdown",
            "href": "/accessories",
            "order": 5,
            "is_active": True,
            "badge": None,
            "columns": [
                {
                    "title": "Categories",
                    "links": [
                        {"label": "View All", "href": "/accessories", "is_highlighted": True},
                        {"label": "Belts", "href": "/accessories/belts", "is_highlighted": False},
                        {"label": "Socks", "href": "/accessories/socks", "is_highlighted": False},
                        {"label": "Wallets & Card Holders", "href": "/accessories/wallets", "is_highlighted": False},
                        {"label": "Lace", "href": "/accessories/lace", "is_highlighted": False},
                        {"label": "Key Rings", "href": "/accessories/key-rings", "is_highlighted": False},
                        {"label": "Travel Kit", "href": "/accessories/travel-kit", "is_highlighted": False},
                        {"label": "Shoe Care", "href": "/accessories/shoe-care", "is_highlighted": False},
                    ]
                }
            ],
            "featured_card": {
                "enabled": True,
                "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80&fit=crop",
                "badge_text": "New In",
                "title": "Premium Accessories",
                "cta_text": "Explore →",
                "link_url": "/accessories"
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]


async def _ensure_seeded():
    count = await db.navigation_menus.count_documents({})
    if count == 0:
        defaults = get_default_nav_items()
        await db.navigation_menus.insert_many(defaults)


# ---- Public Storefront API ----

@router.get("")
async def get_public_navigation():
    """Returns active navigation items for header rendering."""
    await _ensure_seeded()
    cursor = db.navigation_menus.find({"is_active": True}).sort("order", 1)
    items = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return {"items": items}


# ---- Admin API ----

@router.get("/admin/all")
async def get_admin_navigation(request: Request):
    """Admin: Get all navigation items including inactive."""
    await require_admin(request)
    await _ensure_seeded()
    cursor = db.navigation_menus.find({}).sort("order", 1)
    items = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return {"items": items}


@router.post("/admin")
async def create_nav_item(payload: NavItemCreate, request: Request):
    """Admin: Create a new top-level navigation item."""
    await require_admin(request)
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.navigation_menus.insert_one(doc)
    created = await db.navigation_menus.find_one({"_id": res.inserted_id})
    return _serialize(created)


@router.put("/admin/{item_id}")
async def update_nav_item(item_id: str, payload: NavItemUpdate, request: Request):
    """Admin: Update an existing navigation item."""
    await require_admin(request)
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.navigation_menus.update_one({"_id": oid}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Navigation item not found")

    updated = await db.navigation_menus.find_one({"_id": oid})
    return _serialize(updated)


@router.delete("/admin/{item_id}")
async def delete_nav_item(item_id: str, request: Request):
    """Admin: Delete a navigation item."""
    await require_admin(request)
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    res = await db.navigation_menus.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Navigation item not found")
    return {"message": "Navigation item deleted successfully"}


@router.post("/admin/reorder")
async def reorder_nav_items(payload: ReorderPayload, request: Request):
    """Admin: Update ordering of multiple navigation items."""
    await require_admin(request)
    for item in payload.items:
        try:
            oid = ObjectId(item["id"])
            await db.navigation_menus.update_one(
                {"_id": oid},
                {"$set": {"order": int(item["order"]), "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        except Exception:
            continue
    return {"message": "Navigation items reordered successfully"}


@router.post("/admin/reset")
async def reset_nav_items(request: Request):
    """Admin: Reset navigation menus to brand defaults."""
    await require_admin(request)
    await db.navigation_menus.delete_many({})
    defaults = get_default_nav_items()
    await db.navigation_menus.insert_many(defaults)
    return {"message": "Navigation reset to defaults successfully"}
