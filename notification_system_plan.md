# Cobblyn Notification System Implementation Plan

This document outlines the technical triggers required during development and the exact message templates for Cobblyn's Email and WhatsApp communication strategy.

## 1. Technical Implementation Requirements

To build this system, the development team needs to map specific backend events (triggers) to your communication APIs (e.g., Twilio/MessageBird for WhatsApp, SendGrid/Klaviyo for Email).

### Required Backend Triggers:
- `ORDER_CREATED`: Triggered on successful checkout.
- `PAYMENT_FAILED`: Triggered when a gateway declines a transaction.
- `CART_ABANDONED`: Triggered 4 hours after items are added to cart without checkout.
- `BESPOKE_MILESTONE_UPDATED`: Triggered manually by admins/artisans in the dashboard (e.g., status changes to *Cutting*, *Lasting*, *Polishing*).
- `ORDER_SHIPPED`: Triggered when AWB is generated.
- `APPOINTMENT_SCHEDULED`: Triggered when a Virtual Atelier booking is confirmed.
- `REFERRAL_GENERATED`: Triggered when a user clicks "Refer a Friend".

> [!TIP]
> **WhatsApp API Restriction:** WhatsApp requires businesses to use pre-approved "Message Templates" for business-initiated conversations. The templates below are formatted to pass Meta's strict approval guidelines (using `{{1}}`, `{{2}}` variables).

---

## 2. Customer Journey Templates

### A. Order Confirmation
**Trigger:** `ORDER_CREATED`

**Email Template (Formal Record):**
*Subject:* Your Cobblyn Order Confirmation: #{{1}}
*Body:* Beautiful HTML receipt featuring high-res images of the purchased shoes, billing details, and a link to track the order status.

**WhatsApp Template:**
> Hi {{1}}! Thank you for choosing Cobblyn. We have successfully received your order #{{2}}. 
> Our artisans are reviewing your specifications now. You can view your receipt here: {{3}}. We will notify you as soon as your shoes are ready for dispatch!

### B. The Bespoke Production Journey (High-Touch Luxury)
**Trigger:** `BESPOKE_MILESTONE_UPDATED`

**WhatsApp Template (Milestone 1 - Cutting):**
> Hi {{1}}, exciting news from the Cobblyn Atelier! Our master craftsmen have selected your premium {{2}} leather and the cutting process has officially begun. We will keep you updated on your pair's journey.

**WhatsApp Template (Milestone 2 - Finishing):**
> Hi {{1}}, your bespoke pair is currently undergoing its final hand-polishing and quality checks. It looks stunning. It will be carefully boxed and shipped to you within the next 48 hours!

### C. Shipping & Delivery
**Trigger:** `ORDER_SHIPPED`

**Email Template:**
*Subject:* Your Cobblyn Shoes Are On The Way
*Body:* HTML email with shipping partner details, AWB number, and an embedded tracking button.

**WhatsApp Template:**
> Hi {{1}}, the wait is almost over! Your Cobblyn shoes have been dispatched via {{2}}. 
> You can track your luxury package live here: {{3}}

### D. Abandoned Cart Recovery
**Trigger:** `CART_ABANDONED`

**WhatsApp Template:**
> Hi {{1}}, we noticed you left the {{2}} in your cart. Exceptional craft takes time, but securing your pair only takes a minute. 
> Complete your purchase here: {{3}}
> Reply to this message if you need any help with sizing or customization!

### E. Virtual Atelier / Consultations
**Trigger:** `APPOINTMENT_SCHEDULED` (Minus 1 Hour)

**Email Template:**
*Subject:* Calendar Invite: Your Cobblyn Virtual Fitting
*Body:* ICS calendar attachment, Zoom/Google Meet link, and instructions on how to prepare (e.g., having a measuring tape ready).

**WhatsApp Template:**
> Hi {{1}}, a quick reminder that your Virtual Atelier consultation with our master stylist begins in 1 hour. 
> Join the session here: {{2}}. See you soon!

### F. Refer & Earn
**Trigger:** `REFERRAL_GENERATED` (User clicks Share)

**Email Template:**
*Subject:* Give ₹1000, Get ₹1000. Welcome to Cobblyn Rewards.
*Body:* Detailed explanation of the referral program rules with a prominent "Share on WhatsApp" button.

**WhatsApp Template (Pre-filled for the user to send to friends):**
> Hey! I recently discovered Cobblyn's bespoke handcrafted shoes and thought of you. Use my private link to get ₹1000 off your first pair: {{1}}

### G. VIP Early Access (Sales & Launches)
**Trigger:** Manual Marketing Campaign

**Email Template:**
*Subject:* Early Access: The Winter Atelier Collection
*Body:* Lush, cinematic lookbook of the new collection.

**WhatsApp Template:**
> Hi {{1}}, as a valued Cobblyn client, we're giving you 24-hour early access to our new {{2}} collection before it opens to the public tomorrow. 
> Explore the new craft here: {{3}}

---

## 3. Vendor / Artisan Templates

### A. New Bespoke Order Alert
**Trigger:** `ORDER_CREATED` (If category == Bespoke)

**Email Template:**
*Subject:* NEW BESPOKE ORDER: #{{1}} - Action Required
*Body:* Attached PDF Blueprint, Customization Notes (Sole type, Monogram, Leather finish).

**WhatsApp Template (To internal group/artisan):**
> 🚨 *New Bespoke Order Received*
> Order: #{{1}}
> Style: {{2}}
> Please check your email for the detailed blueprint and specifications.

### B. Quality Control Approval
**Trigger:** Manual (Artisan uploads photo)

**WhatsApp Template:**
> QC CHECK REQUIRED: Order #{{1}} is finished. Please review the attached images for final sign-off before packaging.
