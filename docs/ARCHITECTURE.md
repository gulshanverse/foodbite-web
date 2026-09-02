# Architecture

FoodBite remains a **modular monolith** built on the Phase 0 Next.js App Router foundation. Phase 1 adds an Auth.js/NextAuth-compatible credentials provider, Prisma-backed user records, signed framework-managed sessions, and server-side authorization utilities. The browser can request a role, but the server accepts only `BUYER` or `SELLER` from the validated signup contract; privileged roles are never self-assignable.

## Authentication flow

Signup is handled by a domain-specific `POST /api/auth/signup` route. The request is validated with Zod, the normalized email is checked against the unique database constraint, and the password is stored only as a bcrypt hash with cost 12. Login is handled by NextAuth Credentials and exposes only a generic failure response for invalid, missing, banned, or deactivated accounts. Logout is available through `/logout` and the framework sign-out endpoint.

## Sessions and authorization

NextAuth signs the session cookie. `getCurrentUser()` resolves the session identity and then reads the current role and account status from PostgreSQL, preventing stale client state from becoming the source of truth. `requireAuth()` protects authenticated server components, and `requireRole()` composes authentication, current account status, and explicit role checks. Middleware provides early redirects for `/buyer/*`, `/seller/*`, `/admin/*`, and `/account/*`; sensitive server operations repeat authorization independently.

| Area | BUYER | SELLER | ADMIN |
| --- | ---: | ---: | ---: |
| Public landing | Yes | Yes | Yes |
| Login and signup | Yes | Yes | Yes |
| Buyer area | Yes | No | No |
| Seller area | No | Yes | No |
| Admin area | No | No | Yes |
| Own profile | Yes | Yes | Admin-managed later |

## Implemented, planned, and future

**Implemented:** email/password signup and login contracts, secure password hashing, session configuration, database-backed identity resolution, role/status checks, forbidden UI, buyer and seller profile foundations, and protected route layouts.

**Planned:** email verification, password reset, controlled admin provisioning, seller onboarding, and richer profile editing.

**Future:** OAuth, phone OTP, business onboarding, marketplace workflows, payments, and domain-specific operational modules. Microservices, Redis, Kubernetes, search infrastructure, and event streaming remain intentionally deferred.
