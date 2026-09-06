## Implemented

Vitest covers the landing page contract, Phase 1 authentication foundations, Phase 2 seller-domain invariants, and Phase 3 marketplace helpers. Marketplace tests cover safe query normalization, bounded integer discounts, and Haversine distance behavior. The tests do not create production users or require a live database.

Playwright covers the public landing page, public `/explore` browsing without login, and unauthenticated redirects from protected routes. The public explore page also has a friendly database-unavailable state rather than exposing Prisma errors or stack traces.

The marketplace query layer structurally enforces active status, positive `Inventory.availableQuantity`, future `pickupEnd`, active seller account, business presence, pagination, validated URL state, and selective public projection. Buyer favorite mutations are restricted to active buyers and use a database uniqueness constraint.

Seller business and listing E2E journeys, buyer favorite E2E, and real database eligibility integration tests remain fixture-dependent because this repository does not yet provide a CI PostgreSQL fixture or committed test credentials.

## Planned

Add isolated PostgreSQL integration fixtures for seller ownership, listing eligibility, expired and sold-out exclusion, search/filter/sort behavior, public detail availability, favorite uniqueness, and buyer-only authorization. Add controlled Playwright fixtures for buyer login → save listing and seller login → dashboard → listing management.

Run the current suite with:

```bash
pnpm db:validate
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Phase 4 commerce coverage

Vitest covers cart quantity and checkout input validation, order transition policy, inventory invariant enforcement, pickup-code format validation, and payment webhook signature verification. The domain service uses conditional Prisma inventory updates and unique idempotency keys; database-backed concurrency tests should run only against an isolated PostgreSQL fixture.

Playwright covers unauthenticated protection for `/buyer/cart` and `/buyer/orders` in addition to the public marketplace flows. Authenticated cart → checkout → verified payment and seller pickup flows require isolated buyer/seller fixtures and a configured test database. The current repository includes the deterministic payment-provider interface and webhook contract but intentionally does not fake production payment success.

Reservation expiry and webhook processing are designed to be idempotent. A future isolated PostgreSQL suite should prove two simultaneous reservations for one available portion result in one success, duplicate webhook delivery finalizes inventory once, reservation expiry releases inventory once, and duplicate pickup verification completes once.
