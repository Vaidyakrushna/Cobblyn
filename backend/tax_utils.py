"""Indian GST helper for footwear.

Footwear GST (current rules):
- Items <= Rs. 1000: 5% GST
- Items > Rs. 1000: 18% GST

Intra-state (origin == destination): split into CGST + SGST (each = total/2).
Inter-state: full IGST.

We use an environment-set ORIGIN_STATE (default: MH/Maharashtra). The customer's
shipping state is taken from the order's shipping_address.state field.
"""
from typing import Dict
import os

ORIGIN_STATE = os.environ.get("STORE_ORIGIN_STATE", "MH").upper()


def gst_rate_for_price(unit_price: float) -> float:
    return 0.05 if unit_price <= 1000 else 0.18


def compute_tax(items: list, dest_state: str = None) -> Dict:
    """items: list of {price, quantity, ...}. Returns breakdown."""
    dest = (dest_state or "").upper()
    intra = bool(dest) and dest == ORIGIN_STATE
    cgst = sgst = igst = subtotal = 0.0
    line_taxes = []
    for it in items:
        price = float(it.get("price", 0))
        qty = int(it.get("quantity", 1))
        line_subtotal = price * qty
        rate = gst_rate_for_price(price)
        line_tax = round(line_subtotal * rate, 2)
        if intra:
            half = round(line_tax / 2, 2)
            cgst += half
            sgst += line_tax - half
        else:
            igst += line_tax
        subtotal += line_subtotal
        line_taxes.append({
            "product_id": it.get("product_id"),
            "rate_pct": round(rate * 100, 2),
            "tax_amount": line_tax,
        })
    total_tax = round(cgst + sgst + igst, 2)
    return {
        "subtotal": round(subtotal, 2),
        "cgst": round(cgst, 2),
        "sgst": round(sgst, 2),
        "igst": round(igst, 2),
        "total_tax": total_tax,
        "intra_state": intra,
        "origin_state": ORIGIN_STATE,
        "destination_state": dest or None,
        "line_taxes": line_taxes,
    }
