# Testing

## Implemented

Vitest covers the landing page contract, Phase 1 authentication foundations, and Phase 2 seller-domain invariants. Current domain tests cover integer-paise discount calculation, safe slugs, controlled listing transitions, and the inventory invariant. The tests do not create production users or require a live database.

Playwright covers the public landing page and verifies that an unauthenticated request to `/admin` is redirected to `/login`. Seller business and listing E2E journeys remain database-fixture dependent and are documented as the next integration-test layer because this repository does not yet provide a CI PostgreSQL fixture or committed test credentials.

The seller mutation boundary is covered structurally by the implementation: business, listing, inventory, and image routes derive ownership from the authenticated session; listing transitions are allow-listed; and inventory updates are transaction-scoped and invariant-checked.

## Planned

Add isolated PostgreSQL integration fixtures for creating and updating an owned business, rejecting cross-seller access, valid and invalid listing creation, publish/pause/resume/expiration, initial inventory, total-quantity constraints, optimistic-version conflicts, and image metadata validation. Add a controlled Playwright fixture for seller login → dashboard → business save → draft listing → publish, plus a buyer-denied-seller-route journey.

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
