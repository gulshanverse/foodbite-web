# FoodBite Phase 13 Launch Hardening Report

**Scope:** Final production-readiness, security, reliability, and operational hardening pass for the existing Next.js modular monolith.

## Audit Findings

| Severity | Finding | Disposition |
|---|---|---|
| Critical | No critical exploitable issue was identified in the reviewed existing authorization, ownership, inventory-locking, or payment-signature paths. | Verified by code review and existing domain tests. |
| High | Payment signatures used ordinary string equality, which is not appropriate for secret comparisons. | Fixed with constant-time comparison. |
| High | Concurrent delivery of the same webhook event could race between lookup and insert. | Fixed with unique-event claiming; losing requests return an idempotent duplicate response. |
| High | Production configuration allowed missing/weak authentication and database settings. | Fixed with production fail-closed validation. |
| Medium | Security headers lacked CSP and cross-origin isolation signals. | Fixed in middleware with a production-compatible CSP and cross-origin headers. |
| Medium | Signup and seller AI endpoints had no local abuse guard. | Fixed with bounded process-local rate limits and input bounds. |
| Medium | Authentication middleware can retain stale JWT role claims until the token is refreshed. | API/server authorization already re-reads the current user from PostgreSQL; deployment should keep short JWT lifetimes and revoke sessions on emergency account actions. |
| Low | Image rendering uses plain `<img>` in three existing UI locations. | Existing performance warning; not changed because it is unrelated to the security pass. |
| Informational | `pnpm audit` reports seven vulnerabilities in the Prisma CLI dependency chain, including `deepmerge-ts` through Prisma configuration tooling. | Requires dependency upgrade validation; not force-upgraded during this pass because Prisma major upgrades can affect migrations and generated client behavior. |

## Changes Implemented

- Added `apps/web/lib/security.ts` with constant-time secret comparison, bounded process-local rate limiting, client-key derivation, safe retry headers, and redirect validation.
- Hardened authentication so inactive accounts cannot authenticate and `getCurrentUser()` returns only active users, preventing stale account-status claims from authorizing API operations.
- Added production-only environment checks requiring `DATABASE_URL`, a 32-character `AUTH_SECRET`, and a non-localhost public HTTPS URL.
- Added security headers in middleware: CSP, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, existing frame/content/referrer/permissions protections, and request correlation IDs.
- Changed payment checkout and webhook signature checks to constant-time comparison.
- Reworked payment webhook event claiming around the database unique `eventId` constraint, checked provider/order binding, and kept duplicate delivery idempotent.
- Added signup rate limiting and seller listing-assistant rate limiting with bounded user-controlled text.
- Added focused Phase 13 regression tests for secret comparison and rate-limit behavior.

## Security Posture

Server-side ownership and role checks were already present throughout the reviewed buyer, seller, NGO, admin, payment, pickup, and internal worker routes. Prisma raw SQL usage found in inventory reservation paths is parameterized through `Prisma.sql` and is used for row locks. Payment amounts and order totals are calculated server-side. Pickup secrets are hashed and pickup completion is conditional and transactional. No unrestricted authenticated CORS policy or unsafe HTML rendering was found in the reviewed application.

The new CSP intentionally permits HTTPS-hosted images and connections because the application uses external payment/storage providers. It permits inline styles and scripts for compatibility with the current Next.js/Auth UI; a nonce-based CSP should be considered when the application no longer requires these compatibility allowances.

## Performance and Reliability

The existing inventory reservation and checkout flows use serializable transactions and explicit inventory row locks. Payment and pickup state transitions are guarded by conditional state changes and unique provider/event constraints. The build output completed successfully, with API route first-load bundles reported at approximately 102 kB shared/server baseline and middleware at approximately 57.1 kB. No production database or staging load test was available in this sandbox, so database latency and multi-instance rate-limit behavior remain deployment validation items.

## Validation

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed |
| `DATABASE_URL=... pnpm prisma validate` | Passed |
| `DATABASE_URL=... pnpm prisma generate` | Passed |
| `pnpm lint` | Passed with three pre-existing `<img>` warnings |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed: **13 files, 37 tests** |
| `pnpm config:check` | Passed |
| `pnpm build` | Passed; 73 static pages generated |
| `git diff --check` | Passed |
| Secret-pattern scan | No committed credential/private-key pattern found; password test/schema matches were expected source text |
| `pnpm audit --audit-level=high` | Reports 7 dependency-chain vulnerabilities: 4 moderate, 3 high |

## Launch Checklist

### READY

- Server-side role and ownership authorization for reviewed mutations.
- Password hashing and generic authentication failure behavior.
- Payment webhook signature authentication and duplicate event protection.
- Inventory locking and serializable checkout/reservation transactions.
- Hashed pickup code and atomic pickup completion.
- Request IDs, structured logging/redaction foundation, health/readiness endpoints.
- Production build, typecheck, lint, tests, and Prisma schema validation.

### NEEDS HUMAN CONFIGURATION

- Set a strong production `AUTH_SECRET` of at least 32 characters.
- Set production `DATABASE_URL` and apply migrations before serving traffic.
- Set a deployed HTTPS `NEXT_PUBLIC_APP_URL`.
- Configure payment, webhook, storage, email, AI, and cron secrets in the deployment platform's secret manager.
- Configure managed PostgreSQL backups, retention, restore drills, alerting, and rollback ownership.
- Replace the process-local rate limiter with a shared store only if multiple instances require coordinated abuse controls.
- Review and remediate the seven `pnpm audit` findings through a tested Prisma/toolchain upgrade before launch policy approval.

### KNOWN LIMITATION

- Rate limits are process-local and reset on restart; they are not a distributed abuse-prevention control.
- No live provider, database failover, backup restore, or multi-instance load test was executed in the sandbox.
- The current webhook model safely rejects concurrent duplicate delivery, but operational replay/reconciliation for a handler that crashes after claiming an event should be provided by an operator/worker process before high-volume production use.
- CSP retains `unsafe-inline` compatibility allowances; nonce-based CSP is a future tightening step.
- Dependency audit warnings remain until the Prisma dependency chain is upgraded and regression-tested.

## Final Readiness Classification

FoodBite is **conditionally launch-ready as an MVP**, subject to the human configuration items and known limitations above. The repository-level validation is green; production launch should not be declared complete until deployment secrets, migrations, backups, provider webhooks, monitoring, dependency remediation, and a staging concurrency/failure-mode test are verified.
