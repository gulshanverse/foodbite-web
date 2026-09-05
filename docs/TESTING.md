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
