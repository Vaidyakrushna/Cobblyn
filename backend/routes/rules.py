from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/rules", tags=["rules"])

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


def serialize(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


class RuleCondition(BaseModel):
    field: str
    operator: str = "equals"  # equals, not_equals, contains, in
    value: str


class RuleCreate(BaseModel):
    name: str
    condition_field: str   # material, style, sole_type, color, etc.
    condition_value: str   # "Shell Cordovan", "Goodyear Welt", etc.
    action: str            # add_price, multiply_price, set_min_price
    action_value: int      # amount in rupees or multiplier
    active: bool = True
    priority: int = 0      # evaluation order priority
    conditions: Optional[list[RuleCondition]] = None
    logical_operator: str = "AND"  # AND, OR
    description: Optional[str] = None


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    condition_field: Optional[str] = None
    condition_value: Optional[str] = None
    action: Optional[str] = None
    action_value: Optional[int] = None
    active: Optional[bool] = None
    priority: Optional[int] = None
    conditions: Optional[list[RuleCondition]] = None
    logical_operator: Optional[str] = None
    description: Optional[str] = None


@router.get("")
async def list_rules(request: Request):
    await require_admin(request)
    cursor = db.pricing_rules.find().sort([("priority", 1), ("name", 1)])
    rules = []
    async for doc in cursor:
        rules.append(serialize(doc))
    return {"rules": rules, "total": len(rules)}


@router.post("")
async def create_rule(rule: RuleCreate, request: Request):
    await require_admin(request)
    doc = rule.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.pricing_rules.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/{rule_id}")
async def update_rule(rule_id: str, rule: RuleUpdate, request: Request):
    await require_admin(request)
    update_data = {k: v for k, v in rule.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.pricing_rules.update_one({"_id": ObjectId(rule_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule updated"}


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str, request: Request):
    await require_admin(request)
    result = await db.pricing_rules.delete_one({"_id": ObjectId(rule_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}


def _evaluate_condition(attributes: dict, cond: dict) -> bool:
    field = cond.get("field")
    operator = cond.get("operator", "equals")
    target_value = cond.get("value", "")
    
    attr_val = str(attributes.get(field, "")).lower()
    t_val = str(target_value).lower()
    
    if operator == "equals":
        return attr_val == t_val
    elif operator == "not_equals":
        return attr_val != t_val
    elif operator == "contains":
        return t_val in attr_val
    elif operator == "in":
        val_list = [v.strip() for v in t_val.split(",") if v.strip()]
        return attr_val in val_list
    return False


@router.post("/calculate-price")
async def calculate_price(request: Request):
    """Calculate final price based on base price and applicable rules."""
    body = await request.json()
    base_price = body.get("base_price", 0)
    attributes = body.get("attributes", {})  # {material: "Shell Cordovan", style: "Oxford", ...}

    rules = []
    async for doc in db.pricing_rules.find({"active": True}):
        rules.append(doc)

    # Sort by priority (ascending) and then action type (additions first, multiplications second)
    rules.sort(key=lambda r: (r.get("priority", 0), 0 if r.get("action") == "add_price" else 1))

    final_price = base_price
    applied_rules = []

    for rule in rules:
        # Check conditions
        rule_conditions = rule.get("conditions")
        logical_op = rule.get("logical_operator", "AND").upper()
        
        is_matched = False
        if rule_conditions:
            cond_results = [_evaluate_condition(attributes, c) for c in rule_conditions]
            if logical_op == "OR":
                is_matched = any(cond_results)
            else:
                is_matched = all(cond_results)
        else:
            field = rule.get("condition_field")
            value = rule.get("condition_value")
            if field and value:
                is_matched = attributes.get(field, "").lower() == value.lower()

        if is_matched:
            if rule["action"] == "add_price":
                final_price += rule["action_value"]
                applied_rules.append({"rule": rule["name"], "adjustment": f"+{rule['action_value']}"})
            elif rule["action"] == "multiply_price":
                adjustment = int(final_price * (rule["action_value"] / 100))
                final_price += adjustment
                applied_rules.append({"rule": rule["name"], "adjustment": f"+{rule['action_value']}%"})

    return {"base_price": base_price, "final_price": final_price, "applied_rules": applied_rules}
