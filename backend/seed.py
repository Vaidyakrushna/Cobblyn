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
        "colors": [{"name": "Gold", "hex": "#C9A84C"}, {"name": "Maroon", "hex": "#800000"}, {"name": "Royal Blue", "hex": "#002366"}],
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
        "colors": [{"name": "Pink", "hex": "#FF69B4"}, {"name": "Gold", "hex": "#C9A84C"}, {"name": "Silver", "hex": "#C0C0C0"}],
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
        "colors": [{"name": "Gold", "hex": "#C9A84C"}, {"name": "Silver", "hex": "#C0C0C0"}, {"name": "Rose Gold", "hex": "#B76E79"}],
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
    {"name": "Silk Brocade", "category": "texture", "type": "Premium", "image_url": "", "color_hex": "#C9A84C", "price_modifier": 2000, "description": "Handwoven silk brocade for traditional styles", "available": True},
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
    logger.info("MongoDB indexes created")

async def seed_admin(db):
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@byond.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Byond@2026")
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
    count = await db.inventory.count_documents({})
    if count == 0:
        import random
        products = await db.products.find({}).to_list(100)
        docs = []
        for p in products:
            sizes = p.get("sizes", [])
            size_stock = {}
            for s in sizes:
                size_stock[s] = random.randint(0, 15)
            total = sum(size_stock.values())
            if total == 0:
                status = "out_of_stock"
            elif total <= 3:
                status = "low_stock"
            else:
                status = "in_stock"
            docs.append({
                "product_id": p["_id"],
                "sku": p.get("articleCode", f"BYD-{str(p['_id'])[-6:].upper()}"),
                "size_stock": size_stock,
                "total_stock": total,
                "low_stock_threshold": 3,
                "status": status,
                "last_restocked": datetime.now(timezone.utc).isoformat(),
                "restock_history": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        if docs:
            await db.inventory.insert_many(docs)
            logger.info(f"Seeded inventory for {len(docs)} products")

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

async def seed_all(db):
    await create_indexes(db)
    await seed_admin(db)
    await seed_products(db)
    await seed_materials(db)
    await seed_rules(db)
    await seed_inventory(db)
    await seed_banners(db)
    await seed_coupons(db)
