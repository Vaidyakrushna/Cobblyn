# Authentication & Category Management Enhancements Plan

This document outlines the strategy for implementing the requested authentication improvements and category management features.

## Proposed Changes

### 1. Authentication Enhancements (`backend/routes/auth.py`)

- **Email Verification**:
  - Add an `is_verified` flag (default `False`) to users upon registration.
  - Create a new `[POST] /api/auth/verify-email` endpoint to validate a secure verification token generated during registration.
  - *Optional:* Prevent login if `is_verified` is false (can be toggled based on your preference).

- **Refresh-Token Rotation**:
  - Update the `[POST] /api/auth/refresh` endpoint to invalidate the previously used refresh token and issue a completely new one alongside the new access token. This prevents stolen refresh tokens from being reused indefinitely.

- **Forgot Password Updates**:
  - The backend already has `/api/auth/forgot-password` and `/api/auth/reset-password` endpoints generating secure tokens.
  - I will build the missing Frontend interfaces:
    - `[NEW] frontend/src/pages/ForgotPassword.js` (and Next.js route)
    - `[NEW] frontend/src/pages/ResetPassword.js` (and Next.js route)
    - `[NEW] frontend/src/pages/VerifyEmail.js` (and Next.js route)

### 2. Category Management CRUD

- **Backend Architecture**:
  - `[NEW] backend/routes/categories.py`: Establish full CRUD operations for a Category hierarchy (`GET`, `POST`, `PUT`, `DELETE`).
  - Model Fields: `name`, `slug`, `parent_id` (for sub-categories), `description`.
  - Update `backend/server.py` to mount the `/api/categories` routes.
  - Update `backend/seed.py` to create necessary database indexes for category slugs.

- **Frontend Admin Panel**:
  - `[NEW] frontend/src/pages/admin/AdminCategories.js`: A new admin page to view the category hierarchy, add new categories, and edit/delete existing ones.
  - `[NEW] frontend/app/admin/categories/page.js`: The Next.js route wrapper.
  - `[MODIFY] frontend/src/pages/admin/AdminLayout.js`: Add "Categories" to the admin navigation sidebar.

## User Review Required
> [!IMPORTANT]
> - Should unverified users be completely blocked from logging in, or just restricted from certain actions (like checkout)? I will block them from logging in by default unless you specify otherwise.
> - For emails (verification/forgot password), I will use simulated backend console logging (`logger.info`) for now since there isn't a live SMTP server configured.
> - Is the Category model sufficient with `name`, `slug`, and `parent_id` (to support infinite nesting), or do you need specific fields like `image_url`?

Please approve this plan so I can begin execution!
