# Testing

## Implemented

Vitest covers the landing page contract and Phase 1 authentication foundations: bcrypt password hashing and verification, self-service role validation, profile validation, and explicit role-access decisions. The tests do not create production users or require a live database.

Playwright covers the public landing page and verifies that an unauthenticated request to `/admin` is redirected to `/login`. The browser suite uses accessible headings and URLs rather than brittle implementation selectors.

## Planned

Add database-backed integration tests with an isolated PostgreSQL test database for valid buyer and seller signup, duplicate email handling, login failure states, account statuses, profile ownership, and server-side role enforcement. Add an end-to-end signup → login → protected route → logout journey once CI has a reproducible test database environment.

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
