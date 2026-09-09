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

## Phase 9 seller and business operations

Phase 9 extends the existing seller boundary without adding team roles or a separate service. Business settings remain owned through `User → SellerProfile → Business`; updates derive the seller from the authenticated session, validate with Zod, and record safe audit metadata. Business records now include pickup availability, delivery configuration in integer INR paise, and normalized operating-hour rows (`BusinessOperatingHour`) for day-of-week windows. Verification status remains administrator-controlled.

Seller operations use `seller-operations-domain.ts` for seller-owned listing search/filter/pagination, transactional bulk listing state changes, real inventory and donation summaries, and seller-scoped CSV exports. `seller-order-operations.ts` adds status, fulfillment, search, and pagination filters without exposing unrelated seller or buyer data. Dashboard indicators are database-backed operational counts only; revenue, ratings, conversion, forecasting, AI, and advanced analytics remain deferred.

The seller APIs repeat active-account and role checks, derive seller ownership server-side, validate mutations with Zod, and keep inventory changes behind existing transaction and invariant logic. Export responses omit payment credentials, pickup secrets, and unrelated resources. The Phase 9 migration is forward-only: `20260909083000_phase9_seller_tools` adds `BusinessOperatingHour` and the pickup-availability setting.

## Phase 10 AI and intelligent marketplace

Phase 10 adds AI as an optional enhancement layer inside the existing modular monolith. `apps/web/lib/ai/provider.ts` is the single provider boundary. It reads the server-only `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_AI_ENABLED` settings, uses a bounded OpenAI Chat Completions request, applies a short timeout, limits output size, validates structured JSON with Zod, normalizes failures, and applies an application-level per-actor operation limit. Provider-specific calls are not scattered through route handlers.

Seller assistance is available within listing creation through protected endpoints for listing copy suggestions, listing quality review, and surplus optimization insights. Suggestions are explicitly labeled, can be regenerated, accepted into editable fields, or rejected; they never publish listings or mutate inventory, prices, orders, donations, moderation, verification, or food-safety state. When AI is disabled or unavailable, deterministic seller-written fallbacks remain available.

Buyer recommendations are optional and use only the authenticated buyer's own favorites to derive marketplace-relevant food type and category signals. The recommendation endpoint returns only currently eligible database listings and fails silently to ordinary browsing. Natural-language search interpretation is exposed separately as an optional intent endpoint; the existing marketplace search remains deterministic and authoritative, so AI cannot fabricate a result or claim availability.

AI requests receive bounded, minimum necessary, untrusted seller/buyer text only. Prompt-injection patterns are rejected before provider calls. Secrets, passwords, tokens, payment data, pickup secrets, audit payloads, exact buyer coordinates, and unrelated records are not sent. Raw prompts and responses are not persisted. Safe operational metadata is logged and successful seller assistance is audit-marked without storing model content.

AI is not authoritative for inventory, payments, refunds, order state, donation state, verification, moderation, food safety, freshness, allergen absence, nutrition, or regulatory compliance. There is no vector database, chatbot history, microservice, analytics platform, or autonomous business decision system in Phase 10. Normal tests use deterministic fallbacks and do not require live provider access.
