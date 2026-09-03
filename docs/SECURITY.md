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
