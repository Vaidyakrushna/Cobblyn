# Cobblyn Shoes — PRD

## Original Problem Statement
> Migrate React.js prototype to Next.js + ongoing enhancement passes. Reference module list: e-commerce-modules.pdf attached by user. User selected Phases B/C/D from a 14-feature plan (skipped Phase A emails).

## Architecture
- **Framework**: Next.js 14.2.15 App Router (file-based SEO routes + catch-all for client-side pages).
- **Frontend**: React 18, react-router-dom v7 (inside catch-all), Tailwind v3, Radix/shadcn, lucide-react, `next/image` with optimizer.
- **Backend**: FastAPI 0.110 + Motor + bcrypt + JWT + python-multipart + slowapi (rate limiting) + Indian GST tax engine.
- **Image uploads**: backend `/api/uploads/image` (multipart) → `/app/backend/uploads/` → served via FastAPI StaticFiles.
- **SEO**: dynamic sitemap.xml + robots.txt + per-route generateMetadata + SSR scaffold.
- **Database**: MongoDB — auto-seeds 14 products, 11 materials, 5 pricing rules, inventory, super-admin user, 4 hero banners, 3 sample coupons.

## User Personas
- **Customer (M / W)** — browses, schedules in-person visits, customises, places orders, writes reviews, uses coupons, requests returns/exchanges.
- **Super Admin** — full access (incl. Users & Roles).
- **Admin** — all back-office except user management.
- **Staff** — operational data only (orders, inventory, returns, production, visits, customers view, tickets view).
- **Factory Worker** — production jobs.

## What's Been Implemented

### Phase 1 (iter 8): Migration + JWT hardening + brand-safe imagery
### Phase 2 (iter 9): SEO file routes + Schedule Visit + PDP cart interstitial + Admin Dashboard period filter + Admin Products CRUD + Inventory category filter
### Phase 3 (iter 10): Admin Visits + next/image + sitemap.xml + robots.txt
### Phase 4 (iter 11): Banner CMS + ImageUploader + PLP hover-rotation
### Phase 5 (iter 12): Reviews/Coupons/Returns/SizeGuide/Wishlist→Cart/RBAC/Analytics/Tax-GST/Stock-Reservation/Bulk-Upload/Search/RateLimit

#### Phase 5 Details
- **Reviews & Ratings**: `routes/reviews.py` — public GET, auth POST (rating 1-5, dedup, verified-purchase auto-set from delivered orders), product avg_rating + review_count auto-aggregated. Frontend `ProductReviews.js` on PDP with stars + write-modal.
- **Coupons**: `routes/coupons.py` (admin CRUD + public validate). 3 seeded (WELCOME10, FLAT500, LUXE15). Type=percentage/fixed, min_purchase, max_discount cap, usage_limit, validity window. Auto-applied at order creation (orders.py increments used_count). Frontend `AdminCoupons.js` + checkout coupon input.
- **Returns/Exchanges**: `routes/returns.py` — customer creates from delivered/shipped order (validates ownership + product in items), admin PATCH /status (pending/approved/rejected/completed) with refund_amount + admin_notes. Frontend `AdminReturns.js`.
- **Size Guide**: `SizeGuide.js` modal — UK/US/EU/India conversion tables for Men + Women, fit recommendation tips. Triggered from PDP via "Size Guide" link next to size selector.
- **Wishlist → Cart**: `routes/wishlist_extra.py` POST `/api/wishlist/{pid}/move-to-cart` — adds to cart_items + removes from wishlist atomically. Frontend Wishlist button now says "Move to Cart".
- **RBAC**: `permissions.py` (role→permission map: user/staff/admin/super_admin). `routes/admin_users.py` — list users, change role, block/unblock (super_admin only via `manage_users`). Seed admin auto-promoted to super_admin. AuthN now blocks `blocked` users with 403. Frontend `AdminUsers.js`.
- **Footwear Analytics**: `routes/analytics.py` — most-sold sizes, per-product return rate, size-mismatch (exchange original→requested), popular colours from catalogue. Frontend `AdminAnalytics.js`.
- **Tax / Indian GST**: `tax_utils.py` — 5% for items ≤₹1000, 18% above; intra-state CGST+SGST split, inter-state IGST. `STORE_ORIGIN_STATE` env (default MH). Integrated into `routes/orders.py` create_order; checkout shows GST + total breakdown.
- **Stock Reservation**: `routes/orders.py._reserve_stock` — atomic `find_one_and_update` per (articleCode, size) with rollback on partial failure (400 with item name + size).
- **Bulk Upload**: `routes/bulk.py` POST `/api/admin/bulk/products` (CSV upsert by articleCode) and `/inventory` (upserts per-product `size_stock` map by looking up product_id from articleCode). UI button on AdminProducts header.
- **Public Search**: `products.py` GET `?search=` matches name/style/articleCode/material. SearchOverlay redirects to `/men?search=...`; ProductListPage reads URL param and queries backend.
- **Rate Limiting**: slowapi installed at app level (200/min default). Manual per-IP throttle on POST /api/auth/register (5/hour via rate_limits collection). /api/auth/login still has its existing brute-force lockout.
- **CDN note**: documented in PRD only — no S3 integration; preview env uploads wipe on container redeploy.

### Verification (iter 12)
- Backend: 35/36 pytest pass (97%) — 1 issue caught + fixed by tester for inventory unique-index conflict; 3 user['id'] KeyErrors caught + fixed by tester (auth_utils now exposes both `_id` and `id` for consistency).
- Frontend: 100% on smoke-tested routes (9/9 admin + customer pages load, all key data-testids present, size-guide opens, coupon UI works on checkout).
- All 4 new admin pages render with seeded data.

## Backlog
- **P1**: Phase A (Forgot password, Order/Return/Refund emails) — skipped per user
- **P1**: Wire Checkout to call `api.createOrder` and pass `coupon_code` so server-side discount + tax persist (currently coupon is client-side preview only)
- **P1**: Add `slowapi @limiter.limit` decorators on individual routes for finer per-route limits
- **P2**: S3/Cloudinary for upload persistence + CDN
- **P2**: Save Custom Designs + reorder — skipped per user
- **P2**: Move admin auth check before Pydantic on POST /api/products
- **P3**: Email-based 2FA for super_admin actions
- **P3**: Reconcile inventory schema — currently `inventory` collection mixes per-product (size_stock map) and could use a flat collection migration
