# FoodBite: The Food MarketPlace

**Good Food. Less Waste.**

FoodBite is an India-first surplus food marketplace foundation. It is designed to help eligible food businesses turn surplus food into value through nearby, pickup-first discovery. Phase 1 adds the foundational authentication, user, profile, session, and role-based authorization layer without implementing marketplace transactions.

## Users and roles

The current self-service roles are **Buyer** and **Seller**. **Admin** is represented in the authorization model but cannot be self-assigned during signup. NGO, moderator, support, and super-admin roles are reserved for controlled future workflows.

## Technology

The project uses Next.js App Router, React, TypeScript strict mode, Tailwind CSS, Prisma with PostgreSQL, Auth.js/NextAuth-compatible credentials authentication, bcrypt password hashing, Zod, React Hook Form, Vitest, Playwright, pnpm, and a modular-monolith structure.

## Repository structure

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js application, auth routes, protected route layouts, UI, and tests |
| `packages/validation` | Shared Zod schemas for signup, login, and profiles |
| `prisma` | Prisma schema and reviewed migration history |
| `docs` | Product, architecture, security, database, and delivery documentation |
| `.github/workflows` | Continuous integration |

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm dev
```

The app runs at `http://localhost:3000`. Authentication and profile persistence require PostgreSQL. Set `DATABASE_URL` and `AUTH_SECRET` in `.env.local`, then apply the migration:

```bash
pnpm db:migrate:deploy
```

The Phase 1 migration is `prisma/migrations/20260902171500_phase1_auth/migration.sql`. No fake users or seed records are included.

## Authentication and authorization

Use `/signup` to create a Buyer or Seller account, `/login` to sign in, `/logout` to sign out, and `/account` to view the authenticated application entry point. `/buyer/*`, `/seller/*`, and `/admin/*` are protected by middleware and repeated server-side role checks. The server reads the current user, role, and account status from the signed session and database; browser state, URL parameters, and client-selected roles are not authorization boundaries.

## Environment variables

`.env.example` documents the required `DATABASE_URL`, `AUTH_SECRET`, and public application URL. Integration variables remain optional until their corresponding features are implemented. Real secrets must remain in local or deployment secret stores and must never be committed.

## Quality checks

```bash
pnpm db:validate
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Development philosophy

FoodBite is being built incrementally as a production-grade modular monolith. Passwords are never stored in plaintext, privileged roles are never granted from untrusted signup input, authentication failures are intentionally generic, and core transactions will remain backend-authoritative. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/SECURITY.md`](docs/SECURITY.md) for the implemented decisions and deferred work.

## Phase 2 seller domain

Phase 2 adds the first real marketplace domain for authenticated sellers: `User → SellerProfile → Business` and `SellerProfile → FoodListing → Inventory`. Sellers can maintain business information, create drafts, publish eligible surplus listings, pause or resume listings, inspect seller-owned listings, and review inventory quantities. Listing prices are represented as integer INR paise, and inventory maintains `total = available + reserved + sold` through transactional domain operations.

Seller routes include `/seller`, `/seller/business`, `/seller/listings`, `/seller/listings/new`, and `/seller/inventory`. Seller APIs derive ownership from the authenticated session and do not trust client-provided seller IDs. Food categories are provided only through the explicit development seed:

```bash
pnpm prisma db seed
```

The seed creates categories only; it does not create fake sellers, listings, inventory, buyers, or orders. Object storage is intentionally an abstraction in this phase. Image metadata is validated, but uploads are not claimed as successful until an S3-compatible provider adapter is configured.

Buyer discovery, public marketplace pages, cart, checkout, reservations, orders, payments, delivery, and pickup QR workflows are deferred to later phases.
