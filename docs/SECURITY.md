# Security baseline

## Implemented

Passwords are never stored in plaintext. The credentials flow uses bcrypt with cost 12, and password hashes are selected only on the server and are never returned in API responses. NextAuth manages signed HTTP-only session cookies and CSRF protection for authentication endpoints. Email addresses are normalized before uniqueness checks.

All signup input is parsed with Zod on the server. The signup schema accepts only `BUYER` and `SELLER`; an untrusted client cannot create an `ADMIN`, `SUPER_ADMIN`, `MODERATOR`, or `SUPPORT` user. `getCurrentUser()` resolves the session identity and then reads the current role and account status from the database. `requireRole()` and the profile endpoint enforce authorization server-side, while middleware provides early route redirects.

Authentication failures use generic user-facing messages to reduce account enumeration. Banned and deactivated accounts cannot authenticate, and protected server routes reject accounts that are not active. No real secrets, credentials, or `.env` files are committed.

## Planned

Add email verification, password reset, controlled privileged-user provisioning, login rate limiting, brute-force detection, structured security logging, and an audit log for role changes, suspensions, bans, seller verification, and admin actions. Redis is intentionally not introduced solely for Phase 1; the rate-limiting abstraction will be selected when operational requirements justify infrastructure.

## Future

Uploads, payments, webhook verification, and marketplace transactions must keep the backend as the source of truth and apply least privilege, validation, and auditable state transitions.
