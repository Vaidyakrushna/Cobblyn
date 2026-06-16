import os
import logging
from datetime import datetime, timezone
from auth_utils import hash_password, verify_password

logger = logging.getLogger(__name__)

SEED_PRODUCTS = [
    {
        "numericId": 1, "name": "Classic Oxford", "style": "Oxford", "occasion": "Office",
        "material": "Full-Grain Leather", "gender": "men", "price": 8500, "tag": "BESTSELLER",
        "articleCode": "BYD-OXF-001",
        "description": "Handcrafted with the finest full-grain leather, our Classic Oxford represents the pinnacle of formal footwear. Each pair is bench-made using traditional Goodyear welt construction.",
        "colors": [{"name": "Black", "hex": "#1a1a1a"}, {"name": "Brown", "hex": "#5C4033"}, {"name": "Tan", "hex": "#C19A6B"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=900&q=85&fit=crop"
        ],
        "features": ["Goodyear Welt Construction", "Hand-stitched detailing", "Full leather lining", "Cushioned insole", "Blake-stitched sole option"],
        "specifications": {"Upper": "Full-Grain Leather", "Lining": "Leather", "Sole": "Leather with rubber heel", "Construction": "Goodyear Welt", "MRP": "₹8,500"}
    },
    {
        "numericId": 2, "name": "Penny Loafer", "style": "Loafer", "occasion": "Casual",
        "material": "Suede", "gender": "men", "price": 7200, "tag": "NEW",
        "articleCode": "BYD-LFR-002",
        "description": "The quintessential slip-on, reimagined with premium Italian suede. Perfect for the gentleman who values effortless sophistication.",
        "colors": [{"name": "Navy", "hex": "#1B2A4A"}, {"name": "Burgundy", "hex": "#722F37"}, {"name": "Olive", "hex": "#556B2F"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=900&q=85&fit=crop"
        ],
        "features": ["Hand-lasted construction", "Penny strap detail", "Cushioned footbed", "Flexible Blake-stitched sole", "Metal-free tanning process"],
        "specifications": {"Upper": "Italian Suede", "Lining": "Calf Leather", "Sole": "Leather", "Construction": "Blake Stitch", "MRP": "₹7,200"}
    },
    {
        "numericId": 3, "name": "Double Monk Strap", "style": "Monk Strap", "occasion": "Office",
        "material": "Italian Leather", "gender": "men", "price": 9200, "tag": "PREMIUM",
        "articleCode": "BYD-MNK-003",
        "description": "A statement of refined taste. Our Double Monk Strap features hand-burnished Italian leather with antique brass buckles.",
        "colors": [{"name": "Cognac", "hex": "#834A24"}, {"name": "Black", "hex": "#1a1a1a"}, {"name": "Mahogany", "hex": "#4E1609"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1770198408387-7f45e5d6c056?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop"
        ],
        "features": ["Antique brass buckles", "Hand-burnished finish", "Double monk strap design", "Leather sole with rubber injections", "Padded collar"],
        "specifications": {"Upper": "Italian Calfskin", "Lining": "Full Leather", "Sole": "Leather/Rubber combo", "Construction": "Goodyear Welt", "MRP": "₹9,200"}
    },
    {
        "numericId": 4, "name": "Derby Elegance", "style": "Derby", "occasion": "Daily Wear",
        "material": "Premium Calfskin", "gender": "men", "price": 7800, "tag": None,
        "articleCode": "BYD-DRB-004",
        "description": "An everyday classic with open-lacing for superior comfort. Crafted from premium calfskin with a hand-painted patina.",
        "colors": [{"name": "Dark Brown", "hex": "#3B2316"}, {"name": "Black", "hex": "#1a1a1a"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1616696038562-574c18066055?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop"
        ],
        "features": ["Open lacing system", "Hand-painted patina", "Memory foam insole", "Dainite rubber sole", "Storm welt option"],
        "specifications": {"Upper": "Premium Calfskin", "Lining": "Leather", "Sole": "Dainite Rubber", "Construction": "Goodyear Welt", "MRP": "₹7,800"}
    },
    {
        "numericId": 5, "name": "Wing Tip Brogue", "style": "Oxford", "occasion": "Party",
        "material": "Polished Leather", "gender": "men", "price": 8800, "tag": "POPULAR",
        "articleCode": "BYD-WNG-005",
        "description": "Bold broguing meets classic wing tip design. Hand-perforated patterns on polished leather for the connoisseur who appreciates detail.",
        "colors": [{"name": "Chestnut", "hex": "#954535"}, {"name": "Black", "hex": "#1a1a1a"}, {"name": "Oxblood", "hex": "#4A0000"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=900&q=85&fit=crop"
        ],
        "features": ["Full brogue perforations", "Wing tip medallion", "Double leather sole", "Fiddle back waist", "Channelled stitching"],
        "specifications": {"Upper": "Polished Leather", "Lining": "Full Leather", "Sole": "Double Leather", "Construction": "Goodyear Welt", "MRP": "₹8,800"}
    },
    {
        "numericId": 6, "name": "Desert Boot", "style": "Desert Boot/Chukka Boots", "occasion": "Casual",
        "material": "Suede", "gender": "men", "price": 6500, "tag": None,
        "articleCode": "BYD-DST-006",
        "description": "The timeless desert boot, reimagined in premium Italian suede. Two-eyelet lacing with crepe rubber sole for all-day comfort.",
        "colors": [{"name": "Sand", "hex": "#C2B280"}, {"name": "Grey", "hex": "#808080"}, {"name": "Tobacco", "hex": "#7B5B3A"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=85&fit=crop"
        ],
        "features": ["Two-eyelet lacing", "Natural crepe rubber sole", "Unlined for breathability", "Stitch-down construction", "Hand-finished edges"],
        "specifications": {"Upper": "Italian Suede", "Lining": "Unlined", "Sole": "Crepe Rubber", "Construction": "Stitch-down", "MRP": "₹6,500"}
    },
    {
        "numericId": 7, "name": "Embroidered Jutis", "style": "Jutis", "occasion": "Wedding",
        "material": "Silk & Leather", "gender": "men", "price": 6800, "tag": "FESTIVE",
        "articleCode": "BYD-JTS-007",
        "description": "Traditional Indian craftsmanship meets contemporary design. Hand-embroidered silk upper on a cushioned leather sole.",
        "colors": [{"name": "Gold", "hex": "#9d2706"}, {"name": "Maroon", "hex": "#800000"}, {"name": "Royal Blue", "hex": "#002366"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop"
        ],
        "features": ["Hand-embroidered silk", "Traditional Rajasthani threadwork", "Cushioned leather insole", "Pointed toe design", "Lightweight construction"],
        "specifications": {"Upper": "Silk with embroidery", "Lining": "Soft Leather", "Sole": "Leather", "Construction": "Hand-stitched", "MRP": "₹6,800"}
    },
    {
        "numericId": 8, "name": "Boat Shoe Classic", "style": "Boat", "occasion": "Travel",
        "material": "Nubuck Leather", "gender": "men", "price": 6200, "tag": None,
        "articleCode": "BYD-BOT-008",
        "description": "Nautical heritage meets Indian luxury. Premium nubuck leather with hand-sewn moccasin construction and 360-degree lacing.",
        "colors": [{"name": "Navy", "hex": "#1B2A4A"}, {"name": "Tan", "hex": "#C19A6B"}],
        "sizes": ["6", "7", "8", "9", "10", "11"],
        "images": [
            "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop"
        ],
        "features": ["360-degree lacing system", "Non-marking rubber sole", "Hand-sewn moccasin toe", "Rust-proof brass eyelets", "Drainage ports"],
        "specifications": {"Upper": "Nubuck Leather", "Lining": "Quick-dry textile", "Sole": "Siped rubber", "Construction": "Moccasin", "MRP": "₹6,200"}
    },
    {
        "numericId": 101, "name": "Ballet Flats", "style": "Ballerina", "occasion": "Daily Wear",
        "material": "Nappa Leather", "gender": "women", "price": 6200, "tag": "BESTSELLER",
        "articleCode": "BYD-BLT-101",
        "description": "Pure elegance in every step. Our Ballet Flats are crafted from butter-soft Nappa leather with an anatomically designed insole for all-day comfort.",
        "colors": [{"name": "Nude", "hex": "#E3BC9A"}, {"name": "Black", "hex": "#1a1a1a"}, {"name": "Red", "hex": "#8B0000"}],
        "sizes": ["3", "4", "5", "6", "7", "8"],
        "images": [
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop"
        ],
        "features": ["Butter-soft Nappa leather", "Anatomical insole", "Elasticated topline", "Hand-finished edges", "Lightweight construction"],
        "specifications": {"Upper": "Nappa Leather", "Lining": "Kid Leather", "Sole": "Leather with rubber pad", "Construction": "Turned", "MRP": "₹6,200"}
    },
    {
        "numericId": 102, "name": "Ankle Boots", "style": "Boots", "occasion": "Office",
        "material": "Full-Grain Leather", "gender": "women", "price": 8900, "tag": "NEW",
        "articleCode": "BYD-ANK-102",
        "description": "Commanding presence, refined design. These ankle boots feature a sculpted heel and hand-burnished leather that develops a rich patina over time.",
        "colors": [{"name": "Black", "hex": "#1a1a1a"}, {"name": "Cognac", "hex": "#834A24"}, {"name": "Burgundy", "hex": "#722F37"}],
        "sizes": ["3", "4", "5", "6", "7", "8"],
        "images": [
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop"
        ],
        "features": ["Sculpted 60mm heel", "Inside zip closure", "Hand-burnished finish", "Memory foam padding", "Anti-slip sole"],
        "specifications": {"Upper": "Full-Grain Leather", "Lining": "Full Leather", "Sole": "Leather with rubber", "Construction": "Blake Stitch", "Heel Height": "60mm", "MRP": "₹8,900"}
    },
    {
        "numericId": 103, "name": "Classic Loafers", "style": "Loafers", "occasion": "Casual",
        "material": "Patent Leather", "gender": "women", "price": 7400, "tag": None,
        "articleCode": "BYD-CLF-103",
        "description": "Effortless elegance meets everyday wearability. Patent leather finish with a modern silhouette designed for the modern woman.",
        "colors": [{"name": "Black", "hex": "#1a1a1a"}, {"name": "White", "hex": "#F5F5F5"}, {"name": "Forest", "hex": "#228B22"}],
        "sizes": ["3", "4", "5", "6", "7", "8"],
        "images": [
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop"
        ],
        "features": ["Mirror-finish patent leather", "Chain-link hardware", "Cushioned footbed", "Flexible sole", "Anti-fatigue technology"],
        "specifications": {"Upper": "Patent Leather", "Lining": "Sheep Leather", "Sole": "Rubber with leather", "Construction": "Cemented + Stitched", "MRP": "₹7,400"}
    },
    {
        "numericId": 104, "name": "Silk Jutis", "style": "Jutis", "occasion": "Wedding",
        "material": "Silk Brocade", "gender": "women", "price": 6800, "tag": "FESTIVE",
        "articleCode": "BYD-SJT-104",
        "description": "A bridal favourite. Woven silk brocade with zardozi embroidery, handcrafted by artisans in Jaipur. Perfect for sangeet to reception.",
        "colors": [{"name": "Pink", "hex": "#FF69B4"}, {"name": "Gold", "hex": "#9d2706"}, {"name": "Silver", "hex": "#C0C0C0"}],
        "sizes": ["3", "4", "5", "6", "7", "8"],
        "images": [
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop"
        ],
        "features": ["Silk brocade upper", "Zardozi embroidery", "Cushioned leather insole", "Pointed toe silhouette", "Lightweight padded sole"],
        "specifications": {"Upper": "Silk Brocade", "Lining": "Soft Leather", "Sole": "Leather padded", "Construction": "Hand-stitched", "MRP": "₹6,800"}
    },
    {
        "numericId": 105, "name": "Peep Toe Heels", "style": "Peep Toes", "occasion": "Party",
        "material": "Patent Leather", "gender": "women", "price": 7500, "tag": "TRENDING",
        "articleCode": "BYD-PTP-105",
        "description": "Make an entrance. Our Peep Toe Heels combine a flattering open-toe design with a stable block heel for confident strides.",
        "colors": [{"name": "Red", "hex": "#8B0000"}, {"name": "Black", "hex": "#1a1a1a"}, {"name": "Nude", "hex": "#E3BC9A"}],
        "sizes": ["3", "4", "5", "6", "7", "8"],
        "images": [
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop"
        ],
        "features": ["Block heel for stability", "Peep-toe opening", "Adjustable ankle strap", "Suede-lined footbed", "Non-slip sole"],
        "specifications": {"Upper": "Patent Leather", "Lining": "Suede", "Sole": "Leather/Rubber", "Construction": "Cemented", "Heel Height": "75mm", "MRP": "₹7,500"}
    },
    {
        "numericId": 106, "name": "Strappy Sandals", "style": "Ballerina", "occasion": "Party",
        "material": "Metallic Leather", "gender": "women", "price": 6500, "tag": None,
        "articleCode": "BYD-SND-106",
        "description": "Evening glamour redefined. Metallic leather straps hand-woven into an intricate pattern on a low heel. Adjustable buckle closure.",
        "colors": [{"name": "Gold", "hex": "#9d2706"}, {"name": "Silver", "hex": "#C0C0C0"}, {"name": "Rose Gold", "hex": "#B76E79"}],
        "sizes": ["3", "4", "5", "6", "7", "8"],
        "images": [
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop",
            "https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=900&q=85&fit=crop"
        ],
        "features": ["Hand-woven metallic straps", "Low kitten heel", "Adjustable buckle closure", "Padded footbed", "Anti-tarnish coating"],
        "specifications": {"Upper": "Metallic Leather", "Lining": "Kid Leather", "Sole": "Leather", "Construction": "Cemented", "Heel Height": "40mm", "MRP": "₹6,500"}
    }
]

SEED_MATERIALS = [
    {"name": "Full-Grain Leather", "category": "leather", "type": "Premium", "image_url": "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=120&h=120&fit=crop&q=80", "color_hex": "#3B2316", "price_modifier": 0, "description": "Top-quality hide with natural grain intact", "available": True},
    {"name": "Shell Cordovan", "category": "leather", "type": "Premium", "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=120&h=120&fit=crop&q=80", "color_hex": "#4E1609", "price_modifier": 5000, "description": "Rare horsehide leather, mirror-like finish", "available": True},
    {"name": "Suede", "category": "leather", "type": "Semi Premium", "image_url": "https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=120&h=120&fit=crop&q=80", "color_hex": "#8B7355", "price_modifier": 0, "description": "Soft napped leather with velvety texture", "available": True},
    {"name": "Nubuck", "category": "leather", "type": "Semi Premium", "image_url": "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=120&h=120&fit=crop&q=80", "color_hex": "#C19A6B", "price_modifier": 1000, "description": "Top-grain leather buffed for a soft surface", "available": True},
    {"name": "Patent Leather", "category": "leather", "type": "Premium", "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=120&h=120&fit=crop&q=80", "color_hex": "#1a1a1a", "price_modifier": 2000, "description": "High-gloss, lacquered finish leather", "available": True},
    {"name": "Italian Calfskin", "category": "leather", "type": "Premium", "image_url": "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=120&h=120&fit=crop&q=80", "color_hex": "#834A24", "price_modifier": 3000, "description": "Supple, fine-grained Italian calfskin", "available": True},
    {"name": "Leather Sole", "category": "sole", "type": "Premium", "image_url": "", "color_hex": "#8B6914", "price_modifier": 0, "description": "Traditional leather sole, elegant and breathable", "available": True},
    {"name": "Dainite Rubber", "category": "sole", "type": "Premium", "image_url": "", "color_hex": "#2F2F2F", "price_modifier": 1500, "description": "Premium rubber sole for wet weather grip", "available": True},
    {"name": "Crepe Rubber", "category": "sole", "type": "Semi Premium", "image_url": "", "color_hex": "#E8D5A3", "price_modifier": 0, "description": "Natural rubber, lightweight and cushioned", "available": True},
    {"name": "Full Leather Lining", "category": "lining", "type": "Premium", "image_url": "", "color_hex": "#D4A574", "price_modifier": 0, "description": "Breathable full leather interior lining", "available": True},
    {"name": "Silk Brocade", "category": "texture", "type": "Premium", "image_url": "", "color_hex": "#9d2706", "price_modifier": 2000, "description": "Handwoven silk brocade for traditional styles", "available": True},
]

SEED_RULES = [
    {"name": "Shell Cordovan Premium", "condition_field": "material", "condition_value": "Shell Cordovan", "action": "add_price", "action_value": 5000, "active": True, "description": "Add 5000 for Shell Cordovan leather"},
    {"name": "Patent Leather Surcharge", "condition_field": "material", "condition_value": "Patent Leather", "action": "add_price", "action_value": 2000, "active": True, "description": "Add 2000 for Patent Leather finish"},
    {"name": "Italian Calfskin Premium", "condition_field": "material", "condition_value": "Italian Calfskin", "action": "add_price", "action_value": 3000, "active": True, "description": "Add 3000 for Italian Calfskin"},
    {"name": "Dainite Sole Upgrade", "condition_field": "sole_type", "condition_value": "Dainite Rubber", "action": "add_price", "action_value": 1500, "active": True, "description": "Add 1500 for Dainite rubber sole upgrade"},
    {"name": "Goodyear Welt Premium", "condition_field": "construction", "condition_value": "Goodyear Welt", "action": "add_price", "action_value": 2000, "active": True, "description": "Add 2000 for Goodyear Welt construction"},
]

SEED_BANNERS = [
    {
        "eyebrow": "NEW COLLECTION", "title": "Crafted for the Discerning",
        "subtitle": "Bespoke footwear handcrafted to your exact specifications. Each pair a masterpiece of Italian leather and Indian craftsmanship.",
        "price": "₹6,000",
        "image": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1400&q=85&fit=crop",
        "primary_cta": "Customize Now", "primary_cta_link": "/customize",
        "secondary_cta": "View Collection", "secondary_cta_link": "/men",
        "sort_order": 0, "active": True,
    },
    {
        "eyebrow": "SIGNATURE COLLECTION", "title": "Oxford Elegance Redefined",
        "subtitle": "Classic Oxford silhouette meets contemporary comfort. Premium leather uppers with cushioned insoles for all-day wear.",
        "price": "₹8,500",
        "image": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1400&q=85&fit=crop",
        "primary_cta": "Shop Oxford", "primary_cta_link": "/men",
        "secondary_cta": "Learn More", "secondary_cta_link": "#",
        "sort_order": 1, "active": True,
    },
    {
        "eyebrow": "HERITAGE STYLES", "title": "Traditional Jutis, Modern Twist",
        "subtitle": "Celebrate heritage with handcrafted Jutis that blend traditional artistry with contemporary design sensibilities.",
        "price": "₹6,500",
        "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1400&q=85&fit=crop",
        "primary_cta": "Explore Jutis", "primary_cta_link": "/men",
        "secondary_cta": "Customization", "secondary_cta_link": "/customize",
        "sort_order": 2, "active": True,
    },
    {
        "eyebrow": "PREMIUM LEATHER", "title": "Monk Strap Sophistication",
        "subtitle": "Double monk strap design in full-grain leather. A statement piece for the modern gentleman who values tradition.",
        "price": "₹9,200",
        "image": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1400&q=85&fit=crop",
        "primary_cta": "View Details", "primary_cta_link": "/men",
        "secondary_cta": "Size Guide", "secondary_cta_link": "#",
        "sort_order": 3, "active": True,
    },
]

async def create_indexes(db):
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.categories.create_index("slug", unique=True)
    await db.products.create_index("gender")
    await db.products.create_index("style")
    await db.products.create_index("numericId")
    await db.carts.create_index("user_id", unique=True)
    await db.wishlists.create_index("user_id", unique=True)
    await db.orders.create_index("user_id")
    await db.orders.create_index("status")
    await db.orders.create_index("order_number", unique=True)
    await db.materials.create_index("category")
    await db.fit_profiles.create_index("user_id", unique=True)
    await db.support_tickets.create_index("user_id")
    await db.addresses.create_index("user_id")
    await db.payment_methods.create_index("user_id")
    await db.inventory.create_index("product_id", unique=True)
    await db.inventory.create_index("status")
    await db.inventory.create_index("sku")
    await db.production_jobs.create_index("order_id", unique=True)
    await db.production_jobs.create_index("status")
    await db.production_jobs.create_index("current_stage")
    await db.production_jobs.create_index("assigned_to")
    # New enterprise-scale indexes
    await db.vendors.create_index("name", unique=True)
    await db.vendors.create_index("active")
    await db.vendor_ledgers.create_index("vendor_id")
    await db.vendor_ledgers.create_index("order_id", unique=True)
    await db.vendor_ledgers.create_index("payment_status")
    await db.raw_materials_inventory.create_index("material_id", unique=True)
    await db.raw_materials_inventory.create_index("supplier_name")
    logger.info("MongoDB indexes created")

async def seed_admin(db):
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@cobblyn.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Cobblyn@2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "super_admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    else:
        updates = {"role": "super_admin"}
        if not verify_password(admin_password, existing["password_hash"]):
            updates["password_hash"] = hash_password(admin_password)
        await db.users.update_one({"email": admin_email}, {"$set": updates})
        logger.info("Admin user upgraded to super_admin")

async def seed_products(db):
    count = await db.products.count_documents({})
    if count == 0:
        result = await db.products.insert_many(SEED_PRODUCTS)
        logger.info(f"Seeded {len(result.inserted_ids)} products")
    else:
        logger.info(f"Products already seeded ({count} found)")

async def seed_materials(db):
    count = await db.materials.count_documents({})
    if count == 0:
        for mat in SEED_MATERIALS:
            mat["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.materials.insert_many(SEED_MATERIALS)
        logger.info(f"Seeded {len(SEED_MATERIALS)} materials")

async def seed_rules(db):
    count = await db.pricing_rules.count_documents({})
    if count == 0:
        for rule in SEED_RULES:
            rule["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.pricing_rules.insert_many(SEED_RULES)
        logger.info(f"Seeded {len(SEED_RULES)} pricing rules")

async def seed_inventory(db):
    import random
    from datetime import datetime, timezone
    
    # 1. Seed Shoes products
    products = await db.products.find({}).to_list(200)
    shoes_seeded = 0
    for p in products:
        existing = await db.inventory.find_one({"product_id": p["_id"]})
        if not existing:
            sizes = p.get("sizes", [])
            size_stock = {}
            for s in sizes:
                size_stock[s] = random.randint(0, 15)
            total = sum(size_stock.values())
            status = "out_of_stock" if total == 0 else ("low_stock" if total <= 3 else "in_stock")
            await db.inventory.insert_one({
                "product_id": p["_id"],
                "sku": p.get("articleCode", f"BYD-{str(p['_id'])[-6:].upper()}"),
                "size_stock": size_stock,
                "total_stock": total,
                "low_stock_threshold": 3,
                "status": status,
                "is_accessory": False,
                "last_restocked": datetime.now(timezone.utc).isoformat(),
                "restock_history": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            shoes_seeded += 1

    # 2. Seed Accessories
    accessories = await db.accessories.find({}).to_list(200)
    acc_seeded = 0
    for a in accessories:
        existing = await db.inventory.find_one({"product_id": a["_id"]})
        if not existing:
            sizes = a.get("sizes", [])
            if not sizes:
                sizes = ["One Size"]

            # Distribute defined stock_qty across defined sizes
            stock_qty = a.get("stock_qty", 0)
            size_stock = {}
            if len(sizes) == 1:
                size_stock[sizes[0]] = stock_qty
            else:
                remaining = stock_qty
                for idx, s in enumerate(sizes):
                    if idx == len(sizes) - 1:
                        size_stock[s] = remaining
                    else:
                        val = random.randint(0, remaining)
                        size_stock[s] = val
                        remaining -= val

            total = sum(size_stock.values())
            status = "out_of_stock" if total == 0 else ("low_stock" if total <= 3 else "in_stock")
            await db.inventory.insert_one({
                "product_id": a["_id"],
                "sku": a.get("sku", f"ACC-{str(a['_id'])[-6:].upper()}"),
                "size_stock": size_stock,
                "total_stock": total,
                "low_stock_threshold": 3,
                "status": status,
                "is_accessory": True,
                "last_restocked": datetime.now(timezone.utc).isoformat(),
                "restock_history": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            acc_seeded += 1

    if shoes_seeded > 0 or acc_seeded > 0:
        logger.info(f"Incremental seeding complete: added {shoes_seeded} shoes and {acc_seeded} accessories to inventory.")


async def seed_banners(db):
    count = await db.banners.count_documents({})
    if count == 0:
        for b in SEED_BANNERS:
            b["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.banners.insert_many(SEED_BANNERS)
        logger.info(f"Seeded {len(SEED_BANNERS)} banners")

async def seed_coupons(db):
    if await db.coupons.count_documents({}) > 0:
        return
    samples = [
        {"code": "WELCOME10", "type": "percentage", "value": 10, "min_purchase": 0, "max_discount": 1500,
         "description": "10% off your first order", "active": True, "used_count": 0,
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"code": "FLAT500", "type": "fixed", "value": 500, "min_purchase": 5000,
         "description": "₹500 off on orders >= ₹5,000", "active": True, "used_count": 0,
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"code": "LUXE15", "type": "percentage", "value": 15, "min_purchase": 10000, "max_discount": 3000,
         "description": "15% off on Luxe Collection (min ₹10,000)", "active": True, "used_count": 0,
         "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.coupons.insert_many(samples)
    logger.info(f"Seeded {len(samples)} coupons")

async def seed_vendors(db):
    if await db.vendors.count_documents({}) > 0:
        return
    vendors_data = [
        {
            "name": "Jaipur Heritage Artisans",
            "contact_person": "Rajesh Sharma",
            "email": "rajesh@jaipurheritage.com",
            "phone": "+91 98290 12345",
            "specialty": ["Goodyear Welt", "Hand-stitched detailing", "Jutis crafting"],
            "monthly_capacity": 150,
            "average_lead_time_days": 14,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "name": "Elite Patina Workshop",
            "contact_person": "Vikram Singh",
            "email": "vikram@elitepatina.com",
            "phone": "+91 98290 67890",
            "specialty": ["Hand-painted patina", "Upper assembly", "Suede burnishing"],
            "monthly_capacity": 100,
            "average_lead_time_days": 10,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "name": "Royal Accessories & Belts",
            "contact_person": "Amit Patel",
            "email": "amit@royalaccessories.com",
            "phone": "+91 79265 11223",
            "specialty": ["Premium Belts", "Leather Wallets", "Lacing manufacturing"],
            "monthly_capacity": 500,
            "average_lead_time_days": 7,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.vendors.insert_many(vendors_data)
    logger.info(f"Seeded {len(vendors_data)} vendors")

async def seed_raw_materials_inventory(db):
    materials = await db.materials.find({}).to_list(100)
    materials_seeded = 0
    import random
    for m in materials:
        existing = await db.raw_materials_inventory.find_one({"material_id": m["_id"]})
        if not existing:
            category = m.get("category", "leather")
            if category == "leather":
                unit = "sq_ft"
                stock_level = round(random.uniform(100, 300), 2)
                reorder_point = 50.0
                cost_per_unit = round(random.uniform(150, 400), 2)
            elif category == "sole":
                unit = "pairs"
                stock_level = float(random.randint(40, 100))
                reorder_point = 15.0
                cost_per_unit = round(random.uniform(200, 600), 2)
            elif category == "lining":
                unit = "meters"
                stock_level = round(random.uniform(50, 150), 2)
                reorder_point = 20.0
                cost_per_unit = round(random.uniform(80, 180), 2)
            else:
                unit = "pieces"
                stock_level = float(random.randint(50, 200))
                reorder_point = 25.0
                cost_per_unit = round(random.uniform(10, 50), 2)
                
            supplier_map = {
                "leather": "Horween Leather Co.",
                "sole": "Vibram Rubber Italy",
                "lining": "Soft Linings Ltd.",
                "texture": "Artisan Swatches Inc."
            }
            supplier_name = supplier_map.get(category, "General Craft Supplier")
            
            await db.raw_materials_inventory.insert_one({
                "material_id": m["_id"],
                "name": m.get("name"),
                "supplier_name": supplier_name,
                "stock_level": stock_level,
                "unit": unit,
                "reorder_point": reorder_point,
                "cost_per_unit": cost_per_unit,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            materials_seeded += 1
            
    if materials_seeded > 0:
        logger.info(f"Seeded raw materials inventory tracking for {materials_seeded} materials.")

async def seed_referral_config(db):
    """Seed the default global referral configuration if not exists."""
    config = await db.referral_config.find_one({"_id": "global"})
    if not config:
        from datetime import datetime, timezone
        await db.referral_config.insert_one({
            "_id": "global",
            "welcome_credit": 250.0,
            "referral_reward": 500.0,
            "min_purchase_amount": 0.0,
            "hold_days": 0,
            "max_wallet_shoes_amount": 500.0,
            "max_wallet_accessories_amount": 100.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Seeded default global referral configuration.")

async def seed_vip_config(db):
    """Seed the default global VIP membership configuration if not exists."""
    config = await db.vip_config.find_one({"_id": "global"})
    if not config:
        from datetime import datetime, timezone
        await db.vip_config.insert_one({
            "_id": "global",
            "plans": [
                {
                    "plan_id": "monthly",
                    "name": "Monthly VIP",
                    "price": 299.0,
                    "months": 1,
                    "discount_percent": 10.0
                },
                {
                    "plan_id": "quarterly",
                    "name": "Quarterly VIP",
                    "price": 799.0,
                    "months": 3,
                    "discount_percent": 10.0
                },
                {
                    "plan_id": "annual",
                    "name": "Annual VIP",
                    "price": 2499.0,
                    "months": 12,
                    "discount_percent": 15.0
                }
            ],
            "free_shipping": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Seeded default global VIP configurations.")

async def seed_all(db):
    await create_indexes(db)
    await seed_admin(db)
    await seed_products(db)
    await seed_materials(db)
    await seed_rules(db)
    await seed_accessories(db)
    await seed_inventory(db)
    await seed_banners(db)
    await seed_coupons(db)
    await seed_vendors(db)
    await seed_raw_materials_inventory(db)
    await seed_referral_config(db)
    await seed_vip_config(db)



# ── Accessories seed data (mirrors frontend/src/data/accessoriesData.js) ──────
SEED_ACCESSORIES = [
  # ── BELTS ─────────────────────────────────────────────────────────────────
  {"sku":"ACC-BLT-001","name":"Full-Grain Classic Belt","category":"belts","subcategory":"Dress Belts","material":"Full-Grain Italian Calf Leather","price":2999,"tag":"Bestseller","description":"Our signature dress belt, crafted from a single piece of full-grain Italian calf leather. A clean nickel buckle, hand-burnished edges, and a tapered profile make this the ideal companion for formal and business attire.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Tan","hex":"#D2B48C"}],"sizes":["28","30","32","34","36","38","40"],"images":["https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=800&q=85&fit=crop","https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=85&fit=crop"],"features":["Hand-burnished bevelled edges","Single-piece construction — no stitched joins","Hypoallergenic nickel buckle","Develops a beautiful patina over time","Fits standard belt loops (35 mm)"],"specifications":{"Width":"35 mm","Buckle":"Nickel Pin Buckle","Lining":"Vegetable-Tanned Calf","Construction":"Single Piece Full-Grain","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":45},
  {"sku":"ACC-BLT-002","name":"Cordovan Dress Belt","category":"belts","subcategory":"Dress Belts","material":"Shell Cordovan Leather","price":4499,"tag":"Premium","description":"Made from rare shell cordovan — the most prized leather in dress shoemaking. This belt develops an unmatched depth of shine with every polish.","colors":[{"name":"Burgundy","hex":"#800020"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["28","30","32","34","36","38","40"],"images":["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=85&fit=crop","https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=800&q=85&fit=crop"],"features":["Shell cordovan — the pinnacle of leather","Gold-tone solid brass buckle","Hand-polished to mirror shine","Slimmer 30 mm profile for formal wear"],"specifications":{"Width":"30 mm","Buckle":"Gold-Tone Pin Buckle","Material":"Shell Cordovan","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":18},
  {"sku":"ACC-BLT-003","name":"Suede Casual Belt","category":"belts","subcategory":"Casual Belts","material":"Nubuck Suede","price":1999,"tag":"","description":"A relaxed belt in smooth nubuck suede — ideal for weekend dressing, chinos, and smart-casual settings.","colors":[{"name":"Tan","hex":"#D2B48C"},{"name":"Olive","hex":"#556B2F"},{"name":"Navy","hex":"#1A1A40"}],"sizes":["28","30","32","34","36","38","40"],"images":["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85&fit=crop"],"features":["Soft nubuck suede finish","Wider casual profile","Matte silver hardware","Versatile for smart-casual dressing"],"specifications":{"Width":"38 mm","Buckle":"Matte Silver","Material":"Nubuck Suede","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":30},
  {"sku":"ACC-BLT-004","name":"Braided Leather Belt","category":"belts","subcategory":"Casual Belts","material":"Woven Full-Grain Leather","price":2499,"tag":"Most Distinctive","description":"Hand-braided strips of full-grain leather create a uniquely textured belt. No holes — the open weave allows infinite adjustment.","colors":[{"name":"Tan","hex":"#D2B48C"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["S","M","L","XL"],"images":["https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=800&q=85&fit=crop"],"features":["Hand-braided by artisans","Infinite adjustment — no holes","Roller buckle for easy fastening","Unique textured look"],"specifications":{"Width":"32 mm","Buckle":"Roller Buckle","Construction":"Hand-braided","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":22},
  {"sku":"ACC-BLT-005","name":"Double-Buckle Statement Belt","category":"belts","subcategory":"Dress Belts","material":"Full-Grain Calf Leather","price":3299,"tag":"","description":"Two refined gold buckles add drama and character to a classic belt silhouette. Inspired by the monk-strap shoe.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Cognac","hex":"#9A4E1C"}],"sizes":["28","30","32","34","36","38","40"],"images":["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=85&fit=crop"],"features":["Double buckle inspired by monk straps","Matching pair of gold-tone hardware","Premium calf leather","Standout accent for formal wear"],"specifications":{"Width":"35 mm","Buckle":"Double Gold-Tone","Material":"Full-Grain Calf","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":15},
  {"sku":"ACC-BLT-006","name":"Reversible Leather Belt","category":"belts","subcategory":"Dress Belts","material":"Full-Grain Calf (Reversible)","price":2799,"tag":"Most Versatile","description":"Two belts in one — flip the strap to switch between black and dark brown. A clever travel companion.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["28","30","32","34","36","38","40"],"images":["https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=800&q=85&fit=crop"],"features":["Reversible — Black one side, Brown other","Pivot buckle for easy side-switching","Perfect travel companion","2-in-1 value"],"specifications":{"Width":"35 mm","Buckle":"Reversible Pivot","Construction":"Two-Sided","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":28},
  # ── SOCKS ────────────────────────────────────────────────────────────────
  {"sku":"ACC-SOK-001","name":"Merino Wool Dress Socks","category":"socks","subcategory":"Dress Socks","material":"Fine Merino Wool","price":699,"tag":"Bestseller","description":"Spun from superfine merino wool, these dress socks offer warmth without bulk. Over-the-calf construction stays up all day.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Charcoal","hex":"#36454F"},{"name":"Navy","hex":"#1A1A40"},{"name":"Burgundy","hex":"#800020"}],"sizes":["S (UK 6-8)","M (UK 8-10)","L (UK 10-12)"],"images":["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=85&fit=crop"],"features":["Superfine 16-micron merino wool","Over-the-calf — stays up all day","Reinforced heel and toe","Temperature-regulating","Sold as a pair"],"specifications":{"Composition":"85% Merino Wool, 13% Nylon, 2% Elastane","Height":"Over-the-Calf","Weight":"Fine (16 micron)","Origin":"Italy"},"in_stock":True,"stock_qty":120},
  {"sku":"ACC-SOK-002","name":"Cashmere Blend Socks","category":"socks","subcategory":"Luxury Socks","material":"Cashmere & Silk Blend","price":1299,"tag":"Most Luxurious","description":"Scottish cashmere blended with silk creates an incomparably soft hand-feel and a subtle lustre.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Ivory","hex":"#FFFFF0"}],"sizes":["S (UK 6-8)","M (UK 8-10)","L (UK 10-12)"],"images":["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=85&fit=crop"],"features":["Scottish cashmere","Natural silk blended for lustre","Gift-ready packaging","Sold as a pair"],"specifications":{"Composition":"60% Cashmere, 30% Silk, 10% Nylon","Height":"Over-the-Calf","Weight":"Sheer-Fine","Origin":"Scotland"},"in_stock":True,"stock_qty":45},
  {"sku":"ACC-SOK-003","name":"Cotton Comfort Everyday Socks","category":"socks","subcategory":"Casual Socks","material":"Pima Cotton","price":399,"tag":"","description":"Long-staple Pima cotton keeps feet dry and comfortable for everyday wear.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Navy","hex":"#1A1A40"},{"name":"Charcoal","hex":"#36454F"},{"name":"White","hex":"#FFFFFF"}],"sizes":["S (UK 6-8)","M (UK 8-10)","L (UK 10-12)"],"images":["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=85&fit=crop"],"features":["Long-staple Pima cotton","Moisture-wicking","Cushioned foot bed","Anti-odour treated","Sold as a pair"],"specifications":{"Composition":"80% Pima Cotton, 18% Nylon, 2% Elastane","Height":"Mid-Calf","Origin":"India"},"in_stock":True,"stock_qty":200},
  {"sku":"ACC-SOK-004","name":"Banker-Stripe Dress Socks","category":"socks","subcategory":"Dress Socks","material":"Merino Wool & Nylon","price":799,"tag":"Most Classic","description":"Subtle vertical banker stripes add quiet distinction. A timeless pattern that reads as refined, never flashy.","colors":[{"name":"Navy","hex":"#1A1A40"},{"name":"Charcoal","hex":"#36454F"},{"name":"Burgundy","hex":"#800020"}],"sizes":["S (UK 6-8)","M (UK 8-10)","L (UK 10-12)"],"images":["https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=85&fit=crop"],"features":["Classic banker stripe pattern","Over-the-calf length","Superfine merino wool","Sold as a pair"],"specifications":{"Composition":"80% Merino, 18% Nylon, 2% Elastane","Pattern":"Banker Stripe","Height":"Over-the-Calf","Origin":"Italy"},"in_stock":True,"stock_qty":80},
  # ── WALLETS ──────────────────────────────────────────────────────────────
  {"sku":"ACC-WLT-001","name":"Bifold Wallet — Full Grain","category":"wallets","subcategory":"Bifold Wallets","material":"Full-Grain Italian Calf Leather","price":3499,"tag":"Bestseller","description":"Our classic bifold wallet. Six card slots, two cash compartments, and a slim profile.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Cognac","hex":"#9A4E1C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=85&fit=crop"],"features":["6 card slots","Full-width cash compartments","Slim profile — no bulk","Develops a rich patina over time","Presented in Cobblyn gift box"],"specifications":{"Card Slots":"6","Cash Compartments":"2","Dimensions":"11 × 9 cm (folded)","Material":"Full-Grain Calf","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":55},
  {"sku":"ACC-WLT-002","name":"Slim Card Holder","category":"wallets","subcategory":"Card Holders","material":"Full-Grain Calf Leather","price":1999,"tag":"Most Minimal","description":"For those who carry only the essentials. Three card slots, one central slip pocket, and the slimmest profile in our range.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Tan","hex":"#D2B48C"},{"name":"Burgundy","hex":"#800020"},{"name":"Navy","hex":"#1A1A40"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=85&fit=crop"],"features":["3 card slots + 1 slip pocket","Ultra-slim — 6 mm when loaded","Perfect for front-pocket carry","RFID shielded"],"specifications":{"Card Slots":"3","Slip Pocket":"1","Dimensions":"9.5 × 6.5 cm","Material":"Full-Grain Calf","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":70},
  {"sku":"ACC-WLT-003","name":"Zip-Around Wallet","category":"wallets","subcategory":"Zip Wallets","material":"Full-Grain Calf Leather","price":4499,"tag":"Most Secure","description":"Twelve card slots, a coin pouch, and two cash sections — all secured by a full perimeter zip.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=85&fit=crop"],"features":["Full perimeter zip","12 card slots","Dedicated coin pouch","Two full cash sections","Premium YKK zip pull"],"specifications":{"Card Slots":"12","Coin Pouch":"Yes","Cash Sections":"2","Closure":"Full Zip","Dimensions":"19 × 9.5 cm","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":30},
  {"sku":"ACC-WLT-004","name":"Money Clip Wallet","category":"wallets","subcategory":"Money Clips","material":"Calf Leather & Steel","price":2799,"tag":"","description":"A sleek hybrid of a leather card holder and a stainless-steel money clip. Holds 4 cards and clips cash neatly.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=85&fit=crop"],"features":["Stainless steel spring money clip","4 card slots","No-fold cash carry","Minimal front-pocket profile"],"specifications":{"Card Slots":"4","Clip":"Stainless Steel Spring Clip","Dimensions":"10 × 7 cm","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":40},
  {"sku":"ACC-WLT-005","name":"Passport Wallet","category":"wallets","subcategory":"Travel Wallets","material":"Full-Grain Calf Leather","price":3999,"tag":"Travel Essential","description":"Designed for the modern traveller. Fits a passport, boarding cards, foreign currency, and up to eight cards.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Cognac","hex":"#9A4E1C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85&fit=crop"],"features":["Full passport slot","8 card slots","2 currency pockets","RFID shielded lining","Boarding pass window"],"specifications":{"Card Slots":"8","Passport Slot":"Yes","Currency Pockets":"2","Dimensions":"14 × 10.5 cm","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":35},
  # ── LACE ─────────────────────────────────────────────────────────────────
  {"sku":"ACC-LCE-001","name":"Waxed Cotton Round Laces","category":"lace","subcategory":"Round Laces","material":"Waxed Cotton","price":349,"tag":"Bestseller","description":"The gold standard in dress shoe laces. Waxed cotton gives a firm, refined look that holds its shape and stays tied all day.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Tan","hex":"#D2B48C"},{"name":"Burgundy","hex":"#800020"}],"sizes":["45 cm","60 cm","75 cm","90 cm"],"images":["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop"],"features":["Waxed cotton stays tied all day","Solid brass aglets — no fraying","Classic round profile","Suited for all Oxford and Derby styles"],"specifications":{"Profile":"Round","Material":"Waxed Egyptian Cotton","Tip":"Solid Brass Aglet","Per Pack":"One Pair"},"in_stock":True,"stock_qty":150},
  {"sku":"ACC-LCE-002","name":"Flat Cotton Dress Laces","category":"lace","subcategory":"Flat Laces","material":"Flat-Woven Cotton","price":299,"tag":"","description":"A flat-woven lace that lies neatly in the eyelets and creates a streamlined vamp.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"White","hex":"#FFFFFF"}],"sizes":["45 cm","60 cm","75 cm"],"images":["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop"],"features":["Flat profile — flush eyelet fit","Clean, streamlined vamp","Ideal for formal wear"],"specifications":{"Profile":"Flat","Material":"Flat-Woven Cotton","Tip":"Metal Aglet","Per Pack":"One Pair"},"in_stock":True,"stock_qty":100},
  {"sku":"ACC-LCE-003","name":"Leather Dress Laces","category":"lace","subcategory":"Leather Laces","material":"Smooth Calf Leather","price":699,"tag":"Most Premium","description":"Replace your cloth laces with these slim calf leather laces — a subtle upgrade that elevates even the finest Oxfords.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Tan","hex":"#D2B48C"}],"sizes":["60 cm","75 cm","90 cm"],"images":["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop"],"features":["Full calf leather","Consistent slim diameter","Brass aglets","The ultimate lace upgrade"],"specifications":{"Profile":"Round Slim","Material":"Smooth Calf Leather","Tip":"Solid Brass Aglet","Per Pack":"One Pair"},"in_stock":True,"stock_qty":60},
  {"sku":"ACC-LCE-004","name":"Braided Casual Laces","category":"lace","subcategory":"Casual Laces","material":"Cotton Braid","price":249,"tag":"","description":"A casual braided lace that adds texture and character to loafers, chukka boots, and desert boots.","colors":[{"name":"Tan","hex":"#D2B48C"},{"name":"Navy","hex":"#1A1A40"},{"name":"Olive","hex":"#556B2F"}],"sizes":["75 cm","90 cm","120 cm"],"images":["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85&fit=crop"],"features":["Thick braided profile","Ideal for boots and casual shoes","Adds visual texture"],"specifications":{"Profile":"Round Thick","Material":"Cotton Braid","Tip":"Metal Tip","Per Pack":"One Pair"},"in_stock":True,"stock_qty":80},
  {"sku":"ACC-LCE-005","name":"Waxed Lace Set — 3 Pairs","category":"lace","subcategory":"Sets","material":"Waxed Cotton","price":899,"tag":"Best Value","description":"A curated set of three pairs of waxed round laces — one each in Black, Dark Brown, and Tan.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Tan","hex":"#D2B48C"}],"sizes":["60 cm","75 cm","90 cm"],"images":["https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=85&fit=crop"],"features":["Three colourways in one pack","Gift-ready packaging","Solid brass aglets","Save ₹150 vs buying separately"],"specifications":{"Pairs Included":"3","Colours":"Black, Dark Brown, Tan","Profile":"Round Waxed","Per Pack":"3 Pairs"},"in_stock":True,"stock_qty":50},
  # ── KEY RINGS ────────────────────────────────────────────────────────────
  {"sku":"ACC-KEY-001","name":"Classic Leather Key Fob","category":"key-rings","subcategory":"Key Fobs","material":"Full-Grain Calf Leather","price":999,"tag":"Bestseller","description":"A rectangular key fob in full-grain calf leather, finished with a solid brass D-ring and ring.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Tan","hex":"#D2B48C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop"],"features":["Full-grain calf leather","Solid brass hardware","Hand-stitched edges","Develops a natural patina"],"specifications":{"Ring":"Solid Brass Split Ring","Attachment":"Brass D-Ring","Dimensions":"8 × 3 cm","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":65},
  {"sku":"ACC-KEY-002","name":"Monogram Key Ring","category":"key-rings","subcategory":"Personalised","material":"Full-Grain Calf Leather","price":1499,"tag":"Gift Favourite","description":"A personalised leather key ring with your initials embossed in gold. Presented in a Cobblyn gift box.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Cognac","hex":"#9A4E1C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop"],"features":["Gold foil monogram embossing","Gift box and handwritten card included","Personalised on request","Full-grain leather"],"specifications":{"Embossing":"Gold Foil Monogram (up to 3 letters)","Ring":"Solid Brass","Packaging":"Cobblyn Gift Box","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":30},
  {"sku":"ACC-KEY-003","name":"Carabiner Key Organiser","category":"key-rings","subcategory":"Organisers","material":"Leather & Anodised Aluminium","price":1299,"tag":"Most Practical","description":"Organise up to 8 keys silently with this leather-wrapped carabiner system.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Tan","hex":"#D2B48C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop"],"features":["Silent key stacking","Aircraft-grade aluminium carabiner","Leather wrapped for elegance","Holds up to 8 keys"],"specifications":{"Capacity":"Up to 8 Keys","Carabiner":"Aircraft-Grade Aluminium","Leather":"Vegetable-Tanned","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":40},
  {"sku":"ACC-KEY-004","name":"Metal & Leather Key Fob","category":"key-rings","subcategory":"Key Fobs","material":"Calf Leather & Brass","price":1199,"tag":"","description":"A heavier, more substantial key fob with a solid brass bar and a full-grain leather strap.","colors":[{"name":"Dark Brown","hex":"#3E2723"},{"name":"Black","hex":"#0A0A0A"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop"],"features":["Solid brass barrel","Satisfying weight in hand","Unique design","Ages beautifully"],"specifications":{"Bar":"Solid Brass Barrel","Leather Strap":"Full-Grain Calf","Ring":"25mm Solid Ring","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":35},
  # ── TRAVEL KIT ───────────────────────────────────────────────────────────
  {"sku":"ACC-TRV-001","name":"Leather Dopp Kit","category":"travel-kit","subcategory":"Toiletry Bags","material":"Full-Grain Calf Leather","price":5999,"tag":"Bestseller","description":"A generously-sized toiletry bag in full-grain calf leather, with a waterproof canvas lining.","colors":[{"name":"Dark Brown","hex":"#3E2723"},{"name":"Black","hex":"#0A0A0A"},{"name":"Cognac","hex":"#9A4E1C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85&fit=crop"],"features":["Full-grain leather exterior","Waterproof canvas lining","YKK brass zip","3 organized pockets","Hanging hook"],"specifications":{"Dimensions":"28 × 14 × 14 cm","Lining":"Waterproof Canvas","Closure":"YKK Brass Zip","Pockets":"2 interior + 1 exterior","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":25},
  {"sku":"ACC-TRV-002","name":"Shoe Travel Bag — Set of 2","category":"travel-kit","subcategory":"Shoe Bags","material":"Waxed Canvas & Leather","price":1999,"tag":"Most Essential","description":"Protect your Cobblyn shoes in transit with these structured drawstring bags. Set of two.","colors":[{"name":"Charcoal","hex":"#36454F"},{"name":"Tan","hex":"#D2B48C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85&fit=crop"],"features":["Waxed canvas — weather resistant","Leather drawstring closure","Breathable weave","Set of 2 bags","Cobblyn embossed"],"specifications":{"Material":"Waxed Canvas","Closure":"Leather Drawstring","Pair":"2 Bags","Fits":"Up to UK 12","Origin":"India"},"in_stock":True,"stock_qty":50},
  {"sku":"ACC-TRV-003","name":"Leather Luggage Tag","category":"travel-kit","subcategory":"Luggage Tags","material":"Full-Grain Calf Leather","price":899,"tag":"","description":"A slim, elegant luggage tag in full-grain leather with a window for your details card.","colors":[{"name":"Tan","hex":"#D2B48C"},{"name":"Black","hex":"#0A0A0A"},{"name":"Cognac","hex":"#9A4E1C"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop"],"features":["Address card window","Brass buckle strap","Cobblyn embossed logo","Easy identification"],"specifications":{"Dimensions":"12 × 8 cm","Window":"Address card window","Strap":"Buckle closure","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":60},
  {"sku":"ACC-TRV-004","name":"Travel Wallet — Multi-Currency","category":"travel-kit","subcategory":"Travel Wallets","material":"Full-Grain Calf Leather","price":4999,"tag":"Travel Essential","description":"An all-in-one travel organiser for passport, boarding passes, 3 currencies, and 10 cards.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=85&fit=crop"],"features":["Full passport protection","3 separate currency sections","10 card slots","Boarding pass window","RFID shielded"],"specifications":{"Card Slots":"10","Passport Slot":"Yes","Currency Sections":"3","Boarding Pass Slot":"Yes","Origin":"Jaipur, India"},"in_stock":True,"stock_qty":20},
  {"sku":"ACC-TRV-005","name":"Leather Travel Roll","category":"travel-kit","subcategory":"Organisers","material":"Waxed Canvas & Leather","price":3499,"tag":"","description":"Roll up your belts, ties, or accessories in this handsome waxed canvas roll with leather trim.","colors":[{"name":"Charcoal","hex":"#36454F"},{"name":"Dark Brown","hex":"#3E2723"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85&fit=crop"],"features":["6 individual compartments","Full-length slip pocket","Compact when rolled","Leather tie closure"],"specifications":{"Compartments":"6 + 1 Full-length","Rolled Size":"30 × 12 cm","Material":"Waxed Canvas / Leather Trim","Origin":"India"},"in_stock":True,"stock_qty":18},
  # ── SHOE CARE ────────────────────────────────────────────────────────────
  {"sku":"ACC-SHC-001","name":"Complete Shoe Care Kit","category":"shoe-care","subcategory":"Kits","material":"Premium Care Essentials","price":2999,"tag":"Bestseller","description":"Everything you need to maintain your Cobblyn shoes in pristine condition. 5-piece kit in a Cobblyn wooden box.","colors":[{"name":"Standard Kit","hex":"#9d2706"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=85&fit=crop"],"features":["Premium horsehair brush","Two wax polish tins (Black + Dark Brown)","Natural leather conditioner","High-shine polishing cloth","Presented in Cobblyn wooden box"],"specifications":{"Contents":"5-piece Kit","Polish Colours":"Black & Dark Brown","Brush":"Horsehair","Conditioner":"100 ml","Packaging":"Cobblyn Wooden Box"},"in_stock":True,"stock_qty":40},
  {"sku":"ACC-SHC-002","name":"Natural Wax Polish","category":"shoe-care","subcategory":"Polish","material":"Natural Carnauba Wax","price":699,"tag":"","description":"A carnauba-based wax polish that feeds, protects, and shines in one application.","colors":[{"name":"Black","hex":"#0A0A0A"},{"name":"Dark Brown","hex":"#3E2723"},{"name":"Tan","hex":"#D2B48C"},{"name":"Neutral","hex":"#F5F5DC"}],"sizes":["50 ml","100 ml"],"images":["https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=85&fit=crop"],"features":["Natural carnauba wax base","Feeds and conditions as it polishes","No harsh solvents","Suitable for all smooth leathers","Long-lasting shine"],"specifications":{"Base":"Natural Carnauba Wax","Volume":"50 ml / 100 ml","Solvents":"None — water-based","Suitable For":"Full-Grain Leather"},"in_stock":True,"stock_qty":100},
  {"sku":"ACC-SHC-003","name":"Premium Horsehair Brush Set","category":"shoe-care","subcategory":"Brushes","material":"Horsehair & Beechwood","price":1499,"tag":"Most Essential","description":"A set of three horsehair brushes — a large dauber, a medium applicator, and a fine polishing brush.","colors":[{"name":"Natural","hex":"#D2B48C"}],"sizes":["Set of 3"],"images":["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=85&fit=crop"],"features":["3-brush set","Natural horsehair bristles","Solid beechwood handles","Canvas storage pouch included","Suitable for all leather types"],"specifications":{"Brushes":"3 (Dauber, Applicator, Polisher)","Handles":"Solid Beechwood","Bristles":"Natural Horsehair","Storage":"Canvas Pouch"},"in_stock":True,"stock_qty":55},
  {"sku":"ACC-SHC-004","name":"Leather Conditioner","category":"shoe-care","subcategory":"Conditioners","material":"Natural Oils & Lanolin","price":899,"tag":"","description":"A deeply penetrating conditioner made from natural mink oil, lanolin, and beeswax.","colors":[{"name":"150 ml Jar","hex":"#9d2706"}],"sizes":["150 ml"],"images":["https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=85&fit=crop"],"features":["Natural mink oil and lanolin","Deeply penetrating formula","Prevents cracking and drying","Use every 4-6 weeks","Neutral — does not affect colour"],"specifications":{"Active Ingredients":"Mink Oil, Lanolin, Beeswax","Volume":"150 ml","Application":"Cloth or Brush","Suitable For":"All Smooth & Waxed Leathers"},"in_stock":True,"stock_qty":75},
  {"sku":"ACC-SHC-005","name":"Suede & Nubuck Care Kit","category":"shoe-care","subcategory":"Kits","material":"Specialist Suede Care","price":1299,"tag":"","description":"Specialist kit for suede and nubuck: suede eraser, brass-wire suede brush, and waterproofing spray.","colors":[{"name":"Suede Kit","hex":"#8B7355"}],"sizes":["One Size"],"images":["https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=85&fit=crop"],"features":["Specialist suede eraser","Dual-side suede brush (brass + nylon)","Waterproofing spray — 200 ml","Safe for suede, nubuck, and velvet"],"specifications":{"Contents":"3-piece Kit","Brush":"Brass Wire + Nylon","Eraser":"Crepe Eraser","Spray":"200 ml Waterproofing Spray"},"in_stock":True,"stock_qty":35},
  {"sku":"ACC-SHC-006","name":"Cedar Shoe Trees — Pair","category":"shoe-care","subcategory":"Shoe Trees","material":"Aromatic Cedar Wood","price":1799,"tag":"Most Important","description":"Cedar shoe trees absorb moisture, eliminate odour, and maintain the perfect last shape of your shoes.","colors":[{"name":"Aromatic Cedar","hex":"#8B6914"}],"sizes":["UK 6-7","UK 8-9","UK 10-11","UK 12"],"images":["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=85&fit=crop"],"features":["Aromatic red cedar wood","Absorbs moisture after wear","Natural cedar scent eliminates odour","Maintains last shape","Spring-tension design"],"specifications":{"Material":"Aromatic Red Cedar","Type":"Split-Toe with Heel","Per Pack":"1 Pair","Scent":"Natural Cedar"},"in_stock":True,"stock_qty":45},
]


async def seed_accessories(db):
    """Seed accessories into MongoDB only if the collection is empty.
    Records are fully editable by the admin after seeding."""
    count = await db.accessories.count_documents({})
    if count > 0:
        logger.info(f"Accessories already seeded ({count} found) — skipping")
        return
    from datetime import datetime, timezone
    docs = []
    for acc in SEED_ACCESSORIES:
        doc = dict(acc)
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        docs.append(doc)
    result = await db.accessories.insert_many(docs)
    # Create indexes for the accessories collection
    await db.accessories.create_index("sku", unique=True)
    await db.accessories.create_index("category")
    await db.accessories.create_index("in_stock")
    logger.info(f"Seeded {len(result.inserted_ids)} accessories into MongoDB")

