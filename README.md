# FoodBite

**Good Food. Less Waste.**

FoodBite is an India-first surplus food marketplace foundation. It is designed to help eligible food businesses turn surplus food into value through nearby, pickup-first discovery. Phase 0 establishes the production-oriented application shell and deliberately does not implement marketplace transactions.

## Users

The planned audiences are buyers, sellers, and platform admins, with NGO and bulk-buyer workflows reserved for later phases.

## Technology

The current foundation uses Next.js App Router, React, TypeScript strict mode, Tailwind CSS, Prisma with PostgreSQL configuration, Zod, React Hook Form, Vitest, Playwright, pnpm, and a modular-monolith structure.

## Repository structure

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js web application, route groups, UI shell, and tests |
| `packages/validation` | Shared Zod validation package |
| `prisma` | Prisma schema and future migration boundary |
| `docs` | Product, architecture, security, and delivery documentation |
| `.github/workflows` | Continuous integration |

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs at `http://localhost:3000`. The database is not required to view the Phase 0 shell; configure `DATABASE_URL` before using Prisma commands.

## Environment variables

`.env.example` documents the server-side integration points for PostgreSQL, authentication, storage, payments, maps, and email. Real secrets must remain in local or deployment secret stores and must never be committed.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Development philosophy

FoodBite is being built incrementally as a production-grade modular monolith. Core transactions will remain backend-authoritative, while AI and external integrations will remain optional layers. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for decisions and deferred infrastructure.
