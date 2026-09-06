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

## Phase 2 seller domain

The seller domain is organized around `User → SellerProfile → Business` and `SellerProfile → FoodListing → Inventory`. Seller API routes resolve the authenticated user first, require the `SELLER` role and active account status, then query resources with the seller's own profile ID. Client-supplied seller, business, or listing identifiers are never trusted as ownership proof.

Listings use integer paise for INR money, explicit category/listing/food-type enums, and a controlled state machine: `DRAFT → PENDING_REVIEW → ACTIVE → PAUSED → ACTIVE`, with terminal `SOLD_OUT`, `EXPIRED`, `BLOCKED`, or `CANCELLED` paths. Phase 2 uses direct seller activation as a temporary development policy after business presence and pickup-window validation; there is no claim that moderation or regulatory verification occurred.

Inventory is created atomically only on activation and is mutated through `seller-domain.ts`, not directly from pages. The service preserves `total = available + reserved + sold`, rejects negative quantities, and increments an optimistic version in a transaction. Reservation and purchase operations are intentionally absent until checkout exists. Expiration is represented by the shared `expireListings()` operation; a future background job can invoke it.

Images use metadata rows and an S3-compatible storage abstraction. The current environment validates type, size, filename, and alt text, but refuses to pretend an upload succeeded while a provider adapter is not configured. Buyer purchasing, cart, checkout, payments, and orders are not part of Phase 2.

## Phase 3 buyer marketplace

The marketplace query layer in `apps/web/lib/marketplace.ts` is the server-side source for `/explore`, `/buyer/explore`, and `/food/[slug]`. It uses Prisma-safe filters for search, category, food type, price bounds, city, and pagination, and defensively requires `ACTIVE`, positive inventory, `pickupEnd > now`, an active seller account, and an attached business. Cards use `Inventory.availableQuantity`, not the original listing quantity. Distance is optional and uses Haversine only when both buyer and business coordinates exist.

Public browsing does not require login. Favorites are the only Phase 3 buyer mutation and are restricted to active BUYER accounts with a unique database constraint. The design deliberately excludes purchasing behavior: there is no cart, checkout, reservation, order, payment, delivery, or pickup-QR layer.

## Phase 4 transactional commerce

Phase 4 extends the modular monolith with `Cart → CartItem`, `Order → OrderItem`, `Reservation`, `Payment`, `PaymentWebhook`, and `Pickup` models. `apps/web/lib/commerce-domain.ts` is the domain boundary for cart ownership, single-seller checkout, server-calculated INR totals, conditional inventory reservation, order transitions, cancellation, reservation expiry, webhook idempotency, and pickup verification.

Checkout is intentionally server-authoritative. It recalculates totals from current listing prices, revalidates active seller/business/listing state and pickup expiry, performs conditional inventory updates inside a transaction, and records an idempotency key per buyer. A payment-provider interface exists separately from the domain; the current non-test environment reports `UNCONFIGURED` instead of claiming a payment succeeded. Verified provider webhooks are the only path that confirms payment and finalizes reserved inventory.

Orders are scoped by buyer or seller relation at query time. Sellers can move confirmed orders through preparation to ready-for-pickup, while pickup completion requires a server-validated hashed code. Reservation expiry, payment failure, and cancellation release inventory only from active reservations. The invariant `totalQuantity = availableQuantity + reservedQuantity + soldQuantity` remains the core inventory safety rule.
