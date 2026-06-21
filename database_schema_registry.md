# Cobblyn Database Schema Registry

This document serves as the official registry for all MongoDB database collections used in the Cobblyn application. Since the database technology is MongoDB (NoSQL), documents are stored as flexible BSON objects. The field descriptions and data types below are derived directly from the backend FastAPI route schemas, database seeding scripts (`seed.py`), and Pydantic models.

---

## 1. Authentication & Session Management

### `users`
Stores user profile information, authentication hashes, and roles.
* **Fields:**
  * `_id` (`ObjectId`): Unique document identifier.
  * `name` (`string`): Full name of the user.
  * `email` (`string`): Registered email address (unique index).
  * `password_hash` (`string`): Hashed user password.
  * `role` (`string`): User role; must be one of `super_admin`, `admin`, `factory_worker`, `staff`, `vendor`, or `user`.
  * `is_verified` (`boolean`): Whether the email address has been verified.
  * `referral_code` (`string`): Unique user referral code (e.g. `COBBLYN-XXXXXX`).
  * `referred_by` (`string` / `null`): The referral code of the user who referred this account.
  * `wallet_balance` (`double`): Remaining referral/reward wallet balance.
  * `registration_ip` (`string`): Client IP address recorded at sign-up.
  * `registration_ua` (`string`): User-agent header recorded at sign-up.
  * `created_at` (`string`): ISO 8601 datetime format of creation.
  * `updated_at` (`string`, optional): ISO 8601 datetime format of last update.
  * `password_changed_at` (`string`, optional): ISO 8601 datetime format of the last password change.
  * `client_tier` (`string`, optional): Custom tier level for user; `regular`, `vip`, or `elite`.
  * `vip_membership` (`object` / `null`): Custom VIP plan details.
    * `is_active` (`boolean`): Whether VIP status is active.
    * `plan_id` (`string`): The subscribed plan ID (e.g., `monthly`, `quarterly`, `annual`).
    * `subscribed_at` (`string`): ISO 8601 signup date.
    * `expires_at` (`string`): ISO 8601 expiry date.
    * `status` (`string`): Status identifier (e.g., `active`, `expired`, `cancelled`).

### `login_attempts`
Used to prevent brute-force login attacks.
* **Fields:**
  * `_id` (`ObjectId`): Unique identifier.
  * `identifier` (`string`): Composite IP & email identifier (index).
  * `attempts` (`int`): Count of consecutive failed attempts.
  * `last_attempt` (`datetime`): Timestamp of the last failed attempt.
  * `lockout_until` (`datetime`, optional): Locked out timeframe expiry date.

### `email_verification_tokens`
Stores registration email verification verification tokens.
* **Fields:**
  * `_id` (`ObjectId`): Unique identifier.
  * `token` (`string`): Random URL-safe token.
  * `user_id` (`ObjectId`): Foreign reference to `users._id`.
  * `expires_at` (`datetime`): Verification token TTL expiry.

### `password_reset_tokens`
Stores password recovery reset tokens.
* **Fields:**
  * `_id` (`ObjectId`): Unique identifier.
  * `token` (`string`): Random URL-safe token.
  * `user_id` (`ObjectId`): Foreign reference to `users._id`.
  * `expires_at` (`datetime`): Token TTL expiry (TTL index).
  * `used` (`boolean`): Whether the token has been consumed.

### `blacklisted_tokens`
Stores expired or logged-out JWT tokens to prevent reuse.
* **Fields:**
  * `_id` (`ObjectId`): Unique identifier.
  * `jti` (`string`): Token ID (unique identifier from JWT payload).
  * `expires_at` (`datetime`): Expiration datetime (index).
  * `type` (`string`): Token type (`access` or `refresh`).
  * `created_at` (`datetime`): Registration timestamp.

### `rate_limits`
Stores request counts for registration/IP-based rate limits.
* **Fields:**
  * `_id` (`ObjectId`): Unique identifier.
  * `key` (`string`): Rate limiting identifier (e.g., `register:127.0.0.1`).
  * `count` (`int`): Rate count.
  * `first_at` (`string`): ISO 8601 timestamp of first request in window.

---

## 2. Product Catalog & Accessories

### `products`
The core shoes catalog database.
* **Fields:**
  * `_id` (`ObjectId`): Unique product identifier.
  * `numericId` (`int`): Legacy numerical ID (index).
  * `name` (`string`): Product display name.
  * `style` (`string`): Footwear style (e.g. `Oxford`, `Loafer`, `Monk Strap`, `Derby`, `Jutis`, `Boat`, `Ballerina`, `Boots`).
  * `occasion` (`string`): Product style classification (e.g. `Office`, `Casual`, `Daily Wear`, `Party`, `Wedding`, `Travel`).
  * `material` (`string`): Primary upper material description.
  * `gender` (`string`): Targeted gender (`men` or `women`).
  * `price` (`int`): Base price of the product (INR).
  * `tag` (`string` / `null`): Promotional product tag (e.g. `BESTSELLER`, `NEW`, `PREMIUM`, `POPULAR`, `FESTIVE`, `TRENDING`).
  * `articleCode` (`string`): Unique product SKU code.
  * `description` (`string`): Long text description.
  * `colors` (`array` of `object`): Color swatch variants.
    * `name` (`string`): Color name.
    * `hex` (`string`): Hex code representation (e.g., `#1a1a1a`).
  * `sizes` (`array` of `string`): Size options available.
  * `images` (`array` of `string`): Array of image URLs.
  * `features` (`array` of `string`): Highlighting product bullets.
  * `specifications` (`object`): Detailed metadata.
    * `Upper` (`string`): Upper material details.
    * `Lining` (`string`): Inner lining details.
    * `Sole` (`string`): Outer sole details.
    * `Construction` (`string`): Shoemaking method (e.g., `Goodyear Welt`, `Blake Stitch`).
    * `MRP` (`string`): Formatted retail price.
    * `Heel Height` (`string`, optional): Height specs for heels.
  * `customized` (`boolean`, optional): Whether this is a customized derivative.
  * `review_count` (`int`, optional): Aggregated count of reviews.
  * `avg_rating` (`double`, optional): Aggregated average rating (1.0 - 5.0).

### `accessories`
Stores non-footwear products such as belts, wallets, and socks.
* **Fields:**
  * `_id` (`ObjectId`): Unique identifier.
  * `sku` (`string`): Unique accessory SKU (unique index).
  * `name` (`string`): Accessory name.
  * `category` (`string`): E.g., `belts`, `socks`, `wallets`.
  * `subcategory` (`string`): E.g., `Dress Belts`, `Luxury Socks`.
  * `material` (`string`): Outer material.
  * `price` (`int`): Retail price.
  * `tag` (`string`): Product tag.
  * `description` (`string`): Product description.
  * `colors` (`array` of `object`): Swatch variant color options.
    * `name` (`string`): Color name.
    * `hex` (`string`): Hex code.
  * `sizes` (`array` of `string`): Size configurations.
  * `images` (`array` of `string`): Bullet array of image URLs.
  * `features` (`array` of `string`): Highlight bullets.
  * `specifications` (`object`): Technical specifications.
  * `in_stock` (`boolean`): Stock status.
  * `stock_qty` (`int`): Quantity remaining in stock.

---

## 3. Order Processing & Cart/Wishlist

### `orders`
Stores customer sales transactions, payment information, and shipping details.
* **Fields:**
  * `_id` (`ObjectId`): Unique transaction ID.
  * `order_number` (`string`): High-entropy unique invoice code (e.g. `BYD-XXXXXX`).
  * `user_id` (`ObjectId`): Foreign reference to `users._id`.
  * `customer_name` (`string`): Sanitized purchaser name.
  * `customer_email` (`string`): Email address of the purchaser.
  * `items` (`array` of `object`): Purchased products.
    * `product_id` (`string`): ID of product or accessory.
    * `name` (`string`): Display name.
    * `size` (`string`): Purchased size.
    * `color` (`string`): Selected color.
    * `quantity` (`int`): Purchased count.
    * `price` (`double`): Single unit transaction price.
    * `style` (`string`, optional): Selected shoe style.
    * `material` (`string`, optional): Custom material type.
    * `sole` (`string`, optional): Custom sole selection.
    * `construction` (`string`, optional): Custom shoe construction method.
  * `shipping_address` (`object`): Handover shipping destination.
    * `name` (`string`): Consignee name.
    * `phone` (`string`): Consignee phone number.
    * `address` (`string`): Street address details.
    * `city` (`string`): Target city.
    * `state` (`string`): Target state.
    * `pincode` (`string`): Delivery postal code.
  * `payment_method` (`string`): Billing type (`cod` or `online`).
  * `notes` (`string` / `null`): Buyer instructions.
  * `subtotal` (`double`): Sum of items pre-discount.
  * `vip_discount` (`double`): Applied VIP percent discount savings.
  * `coupon_code` (`string` / `null`): Redeemed coupon code.
  * `coupon_discount` (`double`): Coupon discount value.
  * `wallet_discount` (`double`): Applied referral wallet credit.
  * `tax` (`object`): GST tax breakdown calculations.
  * `total_amount` (`double`): Final checkout payment.
  * `status` (`string`): Core transaction workflow status (`pending`, `confirmed`, `in_production`, `quality_check`, `shipped`, `delivered`, `cancelled`, `returned`).
  * `status_history` (`array` of `object`): Step audit trail.
    * `status` (`string`): Transitioned status.
    * `timestamp` (`string`): ISO 8601 datetime.
    * `note` (`string`): Description notes.
    * `updated_by` (`string`, optional): Actor who updated status.
  * `production_type` (`string`): Production workflow allocation (`crafted` or `ready_to_ship`).
  * `crafted_by` (`string` / `null`): Fulfillment queue routing (`inhouse`, `vendor`, or `null`).
  * `fulfillment_vendor` (`string` / `null`): Partner vendor name if fulfilled externally.
  * `vendor_upfront_cost` (`double`): Contract price paid to external vendor.
  * `courier_partner` (`string` / `null`): Handed courier courier name (e.g. BlueDart).
  * `tracking_number` (`string` / `null`): Courier consignment number.
  * `estimated_delivery_date` (`string` / `null`): Expected handover date.
  * `shipping_cost_actual` (`double`): Courier transit invoice cost.
  * `package_weight_kg` (`double`): Shipping weight.
  * `transit_history` (`array` of `object`): Dynamic shipping checkpoints.
  * `created_at` (`string`): ISO 8601 sign-off timestamp.
  * `updated_at` (`string`): ISO 8601 update timestamp.

### `carts`
Stores active shopping cart items.
* **Fields:**
  * `_id` (`ObjectId`): Unique cart document ID.
  * `user_id` (`ObjectId`): Foreign reference to `users._id` (unique index).
  * `items` (`array` of `object`): Shopping cart items list.
    * `product_id` (`string`): Shoe ID or accessory SKU.
    * `size` (`string`): Selected size.
    * `color` (`string`): Selected color.
    * `quantity` (`int`): Quantity.

### `wishlists`
Stores user's saved wishlist products.
* **Fields:**
  * `_id` (`ObjectId`): Unique document ID.
  * `user_id` (`ObjectId`): Foreign reference to `users._id` (unique index).
  * `product_ids` (`array` of `string`): List of saved product IDs.

---

## 4. Operational Materials & Inventory

### `materials`
Design systems catalog for custom bespoke footwear customizations.
* **Fields:**
  * `_id` (`ObjectId`): Unique material ID.
  * `name` (`string`): Material label name (e.g. `Shell Cordovan`, `Dainite Rubber`).
  * `category` (`string`): Design category classification (`leather`, `sole`, `lining`, `texture`).
  * `type` (`string`): Tier rating (`Premium`, `Semi Premium`).
  * `image_url` (`string`): Texture preview image URL.
  * `color_hex` (`string`): Representational color hex.
  * `price_modifier` (`int`): Custom price surcharge in INR.
  * `description` (`string`): Description copy.
  * `available` (`boolean`): Serviceability status flag.
  * `created_at` (`string`): ISO 8601 timestamp.

### `inventory`
Stores the real-time finished goods stock levels for shoes and accessories.
* **Fields:**
  * `_id` (`ObjectId`): Unique record ID.
  * `product_id` (`ObjectId`): Foreign reference to `products._id` or `accessories._id` (unique index).
  * `sku` (`string`): Finished good article code (index).
  * `size_stock` (`object`): Dictionary of size-to-quantity stock (e.g. `{"6": 12, "7": 0}`).
  * `total_stock` (`int`): Calculated sum of all stock quantities.
  * `low_stock_threshold` (`int`): Trigger value to raise low stock alert.
  * `status` (`string`): Status (`in_stock`, `low_stock`, `out_of_stock`).
  * `is_accessory` (`boolean`): Whether the item refers to an accessory.
  * `last_restocked` (`string`): ISO 8601 restock datetime.
  * `restock_history` (`array` of `object`): Audit log trail.
  * `created_at` (`string`): ISO 8601 timestamp.

### `raw_materials_inventory`
Stores the raw materials stock levels (e.g., leather square footage, sole pairs) used in production.
* **Fields:**
  * `_id` (`ObjectId`): Unique record ID.
  * `material_id` (`ObjectId`): Foreign reference to `materials._id` (unique index).
  * `name` (`string`): Material design name.
  * `supplier_name` (`string`): Core supplier name.
  * `stock_level` (`double`): Current stock quantity remaining.
  * `unit` (`string`): Unit of measurement (`sq_ft` for leather, `pairs` for soles, `meters` for lining, `pieces`).
  * `reorder_point` (`double`): Reorder warning threshold level.
  * `cost_per_unit` (`double`): Weighted unit purchasing cost (INR).
  * `created_at` (`string`): ISO 8601 datetime.
  * `updated_at` (`string`): ISO 8601 datetime.

---

## 5. Factory Production & Vendors

### `production_jobs`
Fulfillment and factory staging tracker for crafted products.
* **Fields:**
  * `_id` (`ObjectId`): Unique staging job ID.
  * `order_id` (`ObjectId`): Foreign reference to `orders._id` (unique index).
  * `order_number` (`string`): Associated storefront order number.
  * `customer_name` (`string`): Customer name.
  * `customer_email` (`string`): Customer contact email.
  * `items` (`array` of `object`): Ordered items in crafting.
  * `shipping_address` (`object`): Destination shipping details.
  * `total_amount` (`double`): Order total.
  * `priority` (`string`): Job priority level (`normal`, `rush`, `express`).
  * `priority_order` (`int`): Numerical sort priority (0 for express, 1 for rush, 2 for normal).
  * `assigned_to` (`string`): Factory artisan/worker name.
  * `crafted_by` (`string`): Crafting type routing (`inhouse` or `vendor`).
  * `fulfillment_vendor` (`string` / `null`): External vendor workshop name if outsourced.
  * `status` (`string`): Production status (`in_progress`, `completed`, `pending`).
  * `current_stage` (`string`): Active production phase stage (`order_received`, `pattern_cutting`, `assembling_finishing`, `quality_check`, `ready_to_ship`, `delivered`).
  * `stages` (`array` of `object`): Tracking phases.
    * `name` (`string`): Staging key name.
    * `label` (`string`): Display label.
    * `status` (`string`): Completion status (`completed`, `in_progress`, `skipped`, `pending`).
    * `started_at` (`string`, optional): ISO 8601 timestamp.
    * `completed_at` (`string`, optional): ISO 8601 timestamp.
    * `notes` (`string`, optional): Stage logs notes.
  * `tech_pack` (`object`): Deep customization specifications.
    * `material_specs` (`array` of `object`): Material specification lists.
    * `measurements` (`object`): Foot sizing customizations.
    * `design_notes` (`string`): Dynamic design notes.
    * `color_code` (`string`): Color code specifications.
    * `construction` (`string`): Construction model (e.g. Goodyear Welt).
    * `last_type` (`string`): Shoe last model specs.
    * `special_instructions` (`string`): Customer comments or special directives.
  * `activity_log` (`array` of `object`): Action logs.
    * `action` (`string`): Triggered action.
    * `by` (`string`): Logged actor.
    * `timestamp` (`string`): ISO 8601 timestamp.
    * `notes` (`string`, optional): Action details.
  * `estimated_completion` (`string` / `null`): Target handover timeline.
  * `completed_at` (`string` / `null`): ISO 8601 completed timestamp.
  * `created_at` (`string`): ISO 8601 creation timestamp.
  * `updated_at` (`string`): ISO 8601 update timestamp.
  * `vendor_confirmed` (`boolean`, optional): Third-party vendor job acceptance confirmation flag.
  * `vendor_confirmed_at` (`string`, optional): ISO 8601 acceptance timestamp.
  * `assigned_at` (`string`, optional): ISO 8601 vendor assignment date (triggers 12-hour SLA window).
  * `customer_feedback` (`object`, optional): Completed job rating.
    * `rating` (`int`): Customer rating score (1-5).
    * `comment` (`string`): Feedback notes.
    * `submitted_at` (`string`): ISO 8601 timestamp.

### `vendors`
Outsourced vendor partners list.
* **Fields:**
  * `_id` (`ObjectId`): Unique vendor ID.
  * `name` (`string`): Workshop organization name (unique index).
  * `contact_person` (`string`): Rep primary name.
  * `email` (`string`): Notification email contact.
  * `phone` (`string`): Phone number.
  * `specialty` (`array` of `string`): List of craft specialties (e.g., `Goodyear Welt`, `Hand-painted patina`).
  * `monthly_capacity` (`int`): Maximum production capacity.
  * `average_lead_time_days` (`int`): Average production speed lead time.
  * `active` (`boolean`): Active indicator (index).
  * `address` (`string`, optional): Workshop physical location.
  * `gst_no` (`string`, optional): GST tax identification number.
  * `satisfaction_score` (`double`): Rolling satisfaction metric rating (1.0 - 5.0).
  * `blacklisted` (`boolean`): Fraud blacklist indicator.
  * `portal_token` (`string`): Magic login portal token (prefixed with `vt_`).
  * `created_at` (`string`): ISO 8601 timestamp.
  * `updated_at` (`string`): ISO 8601 timestamp.

### `vendor_ledgers`
Financial ledgers tracking outsourced production billing and payments.
* **Fields:**
  * `_id` (`ObjectId`): Unique ledger document ID.
  * `vendor_id` (`ObjectId`): Foreign reference to `vendors._id` (index).
  * `order_id` (`ObjectId`): Foreign reference to `orders._id` (unique index).
  * `order_number` (`string`): Associated storefront order number.
  * `amount_due` (`double`): Cost due for fulfillment job.
  * `amount_paid` (`double`): Running total of paid balance.
  * `payment_status` (`string`): Status (`unpaid`, `partially_paid`, `settled`).
  * `payments` (`array` of `object`): Transaction history ledger.
    * `amount` (`double`): Transferred amount.
    * `ref_number` (`string`): Payment bank transaction reference number.
    * `notes` (`string`): Notes.
    * `timestamp` (`string`): ISO 8601 transaction date.
  * `created_at` (`string`): ISO 8601 timestamp.
  * `updated_at` (`string`): ISO 8601 timestamp.

---

## 6. Referrals & Loyalty Rewards

### `referrals`
Referral signups ledger to track payouts and flag fraudulent activity.
* **Fields:**
  * `_id` (`ObjectId`): Unique record ID.
  * `referrer_id` (`ObjectId`): Foreign reference to `users._id` (inviting user).
  * `referee_id` (`ObjectId`): Foreign reference to `users._id` (invited user).
  * `referee_name` (`string`): Signup name.
  * `referee_email` (`string`): Signup email.
  * `status` (`string`): Referral payout status (`pending`, `held`, `completed`, `voided`).
  * `reward_amount` (`double`): Promised reward amount (INR).
  * `is_flagged` (`boolean`): Fraud indicator flag.
  * `flag_reasons` (`array` of `string`): List of detected fraud reasons.
  * `referee_ip` (`string`): Referee sign-up IP address.
  * `referee_ua` (`string`): Referee sign-up user-agent.
  * `referrer_ip` (`string`): Referrer sign-up IP address.
  * `referrer_ua` (`string`): Referrer sign-up user-agent.
  * `order_id` (`ObjectId`, optional): Referee's qualifying transaction ID.
  * `order_number` (`string`, optional): Qualifying transaction number.
  * `eligible_at` (`string`, optional): Calculated release eligibility date (cool-off window).
  * `released_at` (`string`, optional): ISO 8601 reward release date.
  * `completed_at` (`string`, optional): ISO 8601 completion date.
  * `created_at` (`string`): ISO 8601 registration date.

### `referral_config`
Global configuration settings for referral reward parameters.
* **Fields:**
  * `_id` (`string`): Always `"global"`.
  * `welcome_credit` (`double`): Signup reward paid to referee.
  * `referral_reward` (`double`): Reward paid to referrer.
  * `min_purchase_amount` (`double`): Referee minimum purchase required to qualify.
  * `hold_days` (`int`): Cooloff hold days window.
  * `max_wallet_shoes_amount` (`double`): Maximum wallet discount cap for shoes category.
  * `max_wallet_accessories_amount` (`double`): Maximum wallet discount cap for accessories.
  * `created_at` (`string`): ISO 8601 registration date.
  * `updated_at` (`string`): ISO 8601 update date.

### `wallet_transactions`
History of credits and debits to user wallet balances.
* **Fields:**
  * `_id` (`ObjectId`): Unique transaction ID.
  * `user_id` (`ObjectId`): Foreign reference to `users._id`.
  * `amount` (`double`): Transaction credit/debit amount.
  * `type` (`string`): Transaction vector (`credit` or `debit`).
  * `description` (`string`): Audit notes description.
  * `created_at` (`string`): ISO 8601 timestamp.

### `referral_audit_logs`
Audit logs for admin actions and system rules matching on referral parameters.
* **Fields:**
  * `_id` (`ObjectId`): Unique record ID.
  * `referral_id` (`ObjectId` / `null`): Reference to related referral document.
  * `referrer_email` (`string`): Referrer email.
  * `referee_email` (`string`): Referee email.
  * `action` (`string`): Event type (`flagged_fraud`, `held_cooloff`, `completed`, `config_updated`, `approved`, `voided`, `wallet_adjusted`).
  * `actor` (`string`): System or Admin email who triggered event.
  * `details` (`string`): Long text description.
  * `timestamp` (`string`): ISO 8601 timestamp.

---

## 7. Customer Sizing & Fitting

### `fit_profiles`
The Fit Vault database storing user sizing measurements and customization parameters.
* **Fields:**
  * `user_id` (`ObjectId`): Foreign reference to `users._id` (unique index).
  * `foot_length_left` (`double`, optional): Left foot length (mm).
  * `foot_length_right` (`double`, optional): Right foot length (mm).
  * `foot_width_left` (`double`, optional): Left foot width (mm).
  * `foot_width_right` (`double`, optional): Right foot width (mm).
  * `foot_girth_left` (`double`, optional): Left foot girth (mm).
  * `foot_girth_right` (`double`, optional): Right foot girth (mm).
  * `arch_type` (`string`, optional): Sizing arch profile classification (`low`, `medium`, `high`).
  * `scan_date` (`string`, optional): Scan registration date.
  * `scan_source` (`string`, optional): Capture system type (`manual`, `lidar`, `3d_scanner`).
  * `notes` (`string`, optional): Fit notes.
  * `uk_size` (`string`, optional): Calculated sizing recommendation.
  * `fit_preference` (`string`, optional): Sizing preference (e.g. snug, relaxed).
  * `last_preference` (`string`, optional): Default last model preference.
  * `podiatry_notes` (`string`, optional): Health guidelines or orthotics comments.
  * `heatmap_image` (`string`, optional): URL to heat-map scanning plot.
  * `arch_imprint_image` (`string`, optional): URL to arch footprint imprint scan.
  * `created_at` (`string`): ISO 8601 timestamp.
  * `updated_at` (`string`): ISO 8601 timestamp.

### `scheduled_visits`
Atelier sizing visit reservations list.
* **Fields:**
  * `_id` (`ObjectId`): Unique reservation ID.
  * `first_name` (`string`): Client first name.
  * `last_name` (`string`): Client last name.
  * `email` (`string`): Client notification contact.
  * `contact_number` (`string`): Client phone number.
  * `visit_date` (`string`): ISO date formatted booking (`YYYY-MM-DD`).
  * `style` (`string`, optional): Target customized shoe style code.
  * `material` (`string`, optional): Preferred material.
  * `material_type` (`string`, optional): Preferred material variants.
  * `visit_for` (`string`, optional): Sizing gender selection (`men` or `women`).
  * `pin_code` (`string`): Service address pincode.
  * `notes` (`string`, optional): Notes.
  * `status` (`string`): Staging status (`pending`, `confirmed`, `visited`, `cancelled`, `rescheduled`).
  * `created_at` (`string`): ISO 8601 creation date.
  * `updated_at` (`string`, optional): ISO 8601 status update date.
  * `user_id` (`ObjectId`, optional): Foreign reference to `users._id` (if authenticated).
  * `rescheduled_from` (`string`, optional): Parent reservation ID reference.
  * `original_visit_date` (`string`, optional): Previous booking date.
  * `rescheduled_to` (`string`, optional): New booking ID reference.
  * `rescheduled_date` (`string`, optional): New booking date.

### `serviceable_pincodes`
Atelier servicibility regions and daily capacity limits configuration registry.
* **Fields:**
  * `_id` (`ObjectId`): Unique record ID.
  * `pin_code` (`string`): Serviceable pincode (e.g., `400001`).
  * `capacity` (`int`): Maximum booking capacity slots per day.
  * `city` (`string`): Region/City label name.
  * `active` (`boolean`): Serviceability status flag.
  * `created_at` (`string`): ISO 8601 creation date.
  * `updated_at` (`string`): ISO 8601 update date.

---

## 8. Customer Support & Feedback

### `support_tickets`
Customer care ticketing system.
* **Fields:**
  * `_id` (`ObjectId`): Unique ticket ID.
  * `user_id` (`ObjectId`): Foreign reference to `users._id` (index).
  * `user_name` (`string`): Customer display name.
  * `user_email` (`string`): Customer contact email.
  * `subject` (`string`): Ticket subject header.
  * `category` (`string`): Ticket query classification (`general`, `fit_issue`, `design_query`, `order_issue`, `return`).
  * `update_order_request` (`boolean`): Whether this is an order modification request.
  * `order_id` (`string`, optional): Associated order ID string.
  * `order_number` (`string`, optional): Associated order number.
  * `status` (`string`): Ticketing status (`open`, `closed`, etc.).
  * `messages` (`array` of `object`): Chronological conversational log thread.
    * `sender` (`string`): Author role (`customer` or `admin`).
    * `admin_name` (`string`, optional): Supporting agent display name.
    * `message` (`string`): Conversational message body.
    * `timestamp` (`string`): ISO 8601 timestamp.
  * `proposed_modification_draft` (`object`, optional): CRM draft proposal changes to order pending customer review.
    * `proposed_by` (`string`): CRM agent name.
    * `proposed_email` (`string`): CRM agent email.
    * `items` (`array` of `object`): Proposed replacement order items structure.
    * `shipping_address` (`object`): Proposed replacement shipping address.
    * `notes` (`string`): Notes.
    * `order_id` (`string`): Target order ID.
    * `order_number` (`string`): Target order number.
    * `status` (`string`): Status (`pending_customer` or `confirmed`).
    * `created_at` (`string`): ISO 8601 timestamp.
  * `created_at` (`string`): ISO 8601 creation date.
  * `updated_at` (`string`): ISO 8601 update date.

### `reviews`
Product reviews and user ratings.
* **Fields:**
  * `_id` (`ObjectId`): Unique review ID.
  * `product_id` (`string`): Related product identifier.
  * `user_id` (`string`): Author user ID.
  * `user_name` (`string`): Author display name.
  * `rating` (`int`): Rating score rating integer (1-5).
  * `title` (`string`): Review header.
  * `body` (`string`): Review review body.
  * `verified_purchase` (`boolean`): True if user bought product and transaction status is delivered.
  * `created_at` (`string`): ISO 8601 date.

### `returns`
Returns and exchanges ledger.
* **Fields:**
  * `_id` (`ObjectId`): Unique tracking ID.
  * `order_id` (`string`): Related purchase order ID.
  * `product_id` (`string`): Returned product ID.
  * `size` (`string`, optional): Sizing variants returned.
  * `type` (`string`): Ticket classification type (`return` or `exchange`).
  * `reason` (`string`): Return/Exchange explanation reason notes.
  * `exchange_size` (`string`, optional): Requested size (required for `exchange` types).
  * `user_id` (`string`): Customer user ID.
  * `user_name` (`string`): Customer display name.
  * `status` (`string`): Request status (`pending`, `approved`, `rejected`, `completed`).
  * `created_at` (`string`): ISO 8601 creation date.
  * `updated_at` (`string`, optional): ISO 8601 update date.
  * `admin_notes` (`string`, optional): Internal team auditing logs.
  * `refund_amount` (`double`, optional): Processed refund credit.

---

## 9. Marketing, Pricing & Security Audit

### `pricing_rules`
Dynamic pricing engine rules logic.
* **Fields:**
  * `_id` (`ObjectId`): Unique rule ID.
  * `name` (`string`): Rule descriptive name (e.g. `Shell Cordovan Premium`).
  * `condition_field` (`string`): Checked attribute matching target (e.g., `material`, `style`, `sole_type`).
  * `condition_value` (`string`): Target matching value.
  * `action` (`string`): Price formula action (`add_price`, `multiply_price`, `set_min_price`).
  * `action_value` (`int`): Surcharge price adjustment.
  * `active` (`boolean`): Active indicator.
  * `priority` (`int`): Priority sort order weight.
  * `conditions` (`array` of `object` / `null`): Extended conditions parameters list.
    * `field` (`string`): Field key.
    * `operator` (`string`): Evaluation operator (`equals`, `not_equals`, `contains`, `in`).
    * `value` (`string`): Target check value.
  * `logical_operator` (`string`): Logical combinator (`AND` or `OR`).
  * `description` (`string` / `null`): Pricing rule description.
  * `created_at` (`string`): ISO 8601 timestamp.

### `banners`
Home page image carousel and hero banners management.
* **Fields:**
  * `_id` (`ObjectId`): Unique banner ID.
  * `eyebrow` (`string`): Eyebrow header text.
  * `title` (`string`): Primary header title text.
  * `subtitle` (`string`): Secondary subtitle text.
  * `price` (`string`): Starting price callout text (e.g. `₹8,500`).
  * `image` (`string`): Cover image URL.
  * `primary_cta` (`string`): Primary button label.
  * `primary_cta_link` (`string`): Primary button destination link.
  * `secondary_cta` (`string`): Secondary button label.
  * `secondary_cta_link` (`string`): Secondary button destination link.
  * `sort_order` (`int`): Staging sort priority.
  * `active` (`boolean`): Carousel visibility status flag.
  * `section` (`string`): Page layout section target (`slider`, etc.).
  * `created_at` (`string`): ISO 8601 timestamp.
  * `updated_at` (`string`, optional): ISO 8601 update timestamp.

### `coupons`
Promo discount coupons code.
* **Fields:**
  * `_id` (`ObjectId`): Unique coupon ID.
  * `code` (`string`): Unique uppercase promo code (e.g., `WELCOME10`).
  * `type` (`string`): Discount type (`percentage` or `fixed`).
  * `value` (`double`): Discount value.
  * `min_purchase` (`double`): Minimum checkout transaction subtotal required.
  * `max_discount` (`double` / `null`): Percentage cap max discount.
  * `usage_limit` (`int` / `null`): Maximum allowed usages count.
  * `valid_from` (`string` / `null`): Validity start date.
  * `valid_until` (`string` / `null`): Validity expiry date.
  * `description` (`string`): Description copy.
  * `active` (`boolean`): Visibility status flag.
  * `used_count` (`int`): Count of successful coupon usages.
  * `created_at` (`string`): ISO 8601 timestamp.
  * `updated_at` (`string`, optional): ISO 8601 update timestamp.

### `security_audit_logs`
Stores security events, administrative activities, and authorization logs.
* **Fields:**
  * `_id` (`ObjectId`): Unique record ID.
  * `actor_id` (`string`): ID of user who triggered the action.
  * `actor_email` (`string`): Email of user who triggered the action.
  * `action` (`string`): Logged event action identifier.
  * `target` (`string`): Impacted target ID.
  * `details` (`object`): Detailed event payload.
  * `timestamp` (`string`): ISO 8601 timestamp.
