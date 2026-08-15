import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger("cobblyn.whatsapp")

async def send_whatsapp_order_notification(db, vendor_name: str, job_doc: dict):
    """
    Sends automated WhatsApp notification mockup when an order is routed or assigned to a vendor.
    Logs payload details to the database events, local logs, and terminal standard output.
    """
    try:
        # Fetch vendor details to obtain the phone number and magic token
        vendor = await db.vendors.find_one({"name": vendor_name})
        if not vendor:
            logger.error(f"WhatsApp Notification Failed: Vendor '{vendor_name}' not found.")
            return False

        phone = vendor.get("phone", "+91 98290 12345")
        contact_person = vendor.get("contact_person", "Artisan Lead")
        token = vendor.get("portal_token")
        
        if not token:
            logger.error(f"WhatsApp Notification Failed: Vendor '{vendor_name}' has no portal_token.")
            return False

        # Build absolute magic link URL path
        # In local setup we use localhost:3000, in prod we would check HOST header or configuration settings
        magic_link = f"http://localhost:3000/vendor/portal/{token}"
        order_number = job_doc.get("order_number", "Unknown Ref")
        items_summary = []
        
        for item in job_doc.get("items", []):
            name = item.get("name", "Bespoke Shoe")
            size = item.get("size", "N/A")
            color = item.get("color", "N/A")
            items_summary.append(f"{name} (Size: {size}, Color: {color})")
            
        items_str = ", ".join(items_summary)
        
        message_template = (
            f"================================================\n"
            f"[WHATSAPP NOTIFICATION DISPATCH (MOCKUP API)]\n"
            f"================================================\n"
            f"To: {contact_person} ({phone})\n"
            f"From: Cobblyn System\n"
            f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n\n"
            f"Greetings {contact_person},\n"
            f"A new custom shoe crafting assignment has been routed to your workshop.\n\n"
            f"- Order Reference: {order_number}\n"
            f"- Items: {items_str}\n"
            f"- SLA Confirmation Limit: 12 Hours\n\n"
            f"Access your secure workshop board with this magic link:\n"
            f"{magic_link}\n"
            f"================================================\n"
        )
        
        # 1. Output to backend application log
        logger.info(f"WhatsApp message dispatched to {phone} for order {order_number}")
        
        # 2. Output to standard stdout/stderr for immediate local console visibility
        print(message_template, flush=True)
        
        # 3. Log event under database logs (so that admins can audit notifications in the app history)
        event_doc = {
            "type": "whatsapp_dispatch",
            "vendor_id": vendor["_id"],
            "vendor_name": vendor_name,
            "phone": phone,
            "order_number": order_number,
            "message": message_template,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.whatsapp_notifications_log.insert_one(event_doc)
        return True
    except Exception as e:
        logger.exception(f"Error executing WhatsApp trigger: {str(e)}")
        return False
