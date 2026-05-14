# Auth & Category Enhancements Tasks

- `[ ]` Auth Enhancements: Backend
  - `[ ]` Modify `register` to add `is_verified` and generate verification token.
  - `[ ]` Create `verify-email` endpoint.
  - `[ ]` Modify `login` to reject unverified users.
  - `[ ]` Update `refresh_token` endpoint to perform token rotation.
- `[ ]` Auth Enhancements: Frontend
  - `[ ]` Create `ForgotPassword.js`, `ResetPassword.js`, `VerifyEmail.js` pages in `src/pages`.
  - `[ ]` Setup Next.js routes for the new auth pages.
- `[ ]` Category Management: Backend
  - `[ ]` Create `categories.py` route for CRUD operations.
  - `[ ]` Mount categories route in `server.py`.
  - `[ ]` Add indexes for categories in `seed.py`.
- `[ ]` Category Management: Frontend
  - `[ ]` Create `AdminCategories.js` in `src/pages/admin`.
  - `[ ]` Add categories link to `AdminLayout.js`.
  - `[ ]` Setup Next.js route for admin categories.
