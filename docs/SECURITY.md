# Security baseline

## Implemented

Passwords are never stored in plaintext. The credentials flow uses bcrypt with cost 12, and password hashes are selected only on the server and are never returned in API responses. NextAuth manages signed HTTP-only session cookies and CSRF protection for authentication endpoints. Email addresses are normalized before uniqueness checks.

All signup input is parsed with Zod on the server. The signup schema accepts only `BUYER` and `SELLER`; an untrusted client cannot create an `ADMIN`, `SUPER_ADMIN`, `MODERATOR`, or `SUPPORT` user. `getCurrentUser()` resolves the session identity and then reads the current role and account status from the database. `requireRole()` and the profile endpoint enforce authorization server-side, while middleware provides early route redirects.

Authentication failures use generic user-facing messages to reduce account enumeration. Banned and deactivated accounts cannot authenticate, and protected server routes reject accounts that are not active. No real secrets, credentials, or `.env` files are committed.

## Planned

Add email verification, password reset, controlled privileged-user provisioning, login rate limiting, brute-force detection, structured security logging, and an audit log for role changes, suspensions, bans, seller verification, and admin actions. Redis is intentionally not introduced solely for Phase 1; the rate-limiting abstraction will be selected when operational requirements justify infrastructure.

## Future

Uploads, payments, webhook verification, and marketplace transactions must keep the backend as the source of truth and apply least privilege, validation, and auditable state transitions.

## Phase 2 controls

Seller mutations follow the sequence authenticated user → seller role/status → ownership query → Zod validation → database mutation. Business, listing, inventory, and image routes all derive the seller profile from the session rather than accepting a trusted seller ID. Listing state changes are allow-listed; clients cannot set arbitrary statuses. Publishing rejects ended pickup windows and requires a seller business relationship.

Prices are validated as integer paise with `sellingPrice <= originalPrice`; the server does not accept a client-derived discount. Inventory changes are transactional, versioned, and invariant-checked. Image metadata is constrained to JPEG, PNG, or WebP, limited to 5 MB, requires safe filenames and alt text, and does not persist a fake URL when object storage is unavailable.

The Phase 2 storage route is a provider boundary only. Production upload signing and malware/content inspection remain planned work before enabling external uploads.

## Phase 3 marketplace controls

Public marketplace reads use a selective server-side Prisma projection and never return password hashes, session fields, private user information, or seller authentication data. The eligibility predicate requires an active listing, positive inventory availability, a future pickup end, an active seller account, and a valid business relationship; the query also defensively filters expired rows even if their stored status has not been updated.

Search and filter parameters are validated with Zod and translated into Prisma-safe conditions. Buyer favorites require an authenticated active BUYER account, re-check listing eligibility, and use a unique composite constraint to prevent duplicates. No purchase, reservation, order, checkout, payment, or delivery mutation exists in Phase 3.

## Phase 4 commerce controls

Cart and order ownership is derived from the authenticated session. Buyers can query only their own carts and orders; sellers can query and mutate only orders connected to their own seller profile. The browser cannot choose final price, seller ownership, payment state, inventory values, or pickup completion.

Checkout recalculates totals in integer paise and uses conditional inventory updates inside a Prisma transaction. Reservation state changes are idempotent: expiration, payment failure, and cancellation release inventory only when the reservation is still active. Payment success moves reserved quantity to sold quantity without modifying available quantity, preserving `total = available + reserved + sold`.

Payment provider secrets remain server-only. Webhooks require an HMAC signature and a unique provider event ID, so duplicate deliveries do not duplicate payment transitions or inventory finalization. The current environment intentionally returns an explicit unconfigured-provider state rather than faking payment success.

Pickup codes are hashed before storage. Pickup verification requires an active seller session, seller-owned order, `READY_FOR_PICKUP` state, a valid code, and an unverified pickup record. Repeated verification safely returns the completed state instead of applying a second completion side effect.
