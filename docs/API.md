# API

No API endpoints are implemented in Phase 0. Route handlers will be added only when a real domain workflow exists, with Zod validation and server-side authorization at the boundary.

## Phase 1 endpoints

`POST /api/auth/signup` validates name, email, password, and role. It accepts only `BUYER` or `SELLER`, stores a bcrypt password hash, creates the appropriate profile foundation, and returns only safe user fields. Duplicate or malformed requests receive generic errors.

NextAuth owns the credentials login, session, and sign-out endpoints. The application exposes `/login`, `/signup`, and `/logout` as user-facing routes. `PATCH /api/profile` requires an authenticated `BUYER`, validates the profile payload with Zod, and updates only the current user's buyer profile. It never accepts a user ID from the client and never serializes `passwordHash`.

## Planned

Add email verification, password reset, controlled admin provisioning, seller profile editing, and domain APIs only when their workflows are implemented.

## Phase 2 seller endpoints

`GET|PUT /api/seller/business` reads or updates the current seller's business. `GET /api/seller/categories` returns active development categories. `GET|POST /api/seller/listings` reads seller-owned listings or creates a validated draft. `GET|PATCH /api/seller/listings/:id` reads an owned listing or applies an allow-listed state transition (`PUBLISH`, `PAUSE`, `RESUME`, `CANCEL`). `GET /api/seller/inventory` returns seller-owned inventory. `POST /api/seller/listings/:id/images` validates image metadata and ownership before requesting a storage target; it returns an explicit unavailable response until an object-storage adapter is configured.

All seller endpoints require authentication, the `SELLER` role, an active account, and ownership checks where a resource identifier is supplied. Listing creation and activation use the seller domain service; inventory creation and updates use Prisma transactions. No buyer marketplace, reservation, checkout, order, or payment endpoint is implemented.
