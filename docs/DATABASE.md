# Database

## Implemented
Prisma is configured for PostgreSQL in `prisma/schema.prisma`, with no production marketplace models or fake seed records.

## Planned
Add domain models through reviewed migrations. Preserve auditability for order, payment, moderation, and administrative changes.

## Phase 1 authentication schema

The Phase 1 migration adds `User`, `BuyerProfile`, `SellerProfile`, and the minimal `Business` relationship, plus the standard `Account`, `Session`, and `VerificationToken` tables retained for Auth.js compatibility. `User.email`, `BuyerProfile.userId`, and `SellerProfile.userId` are unique. User records use soft deletion through `deletedAt`; application code excludes deleted records from authentication.

The migration is stored at `prisma/migrations/20260902171500_phase1_auth/migration.sql`. Apply it to a local PostgreSQL database with `pnpm prisma migrate deploy`; do not modify a production database directly. No fake users or seed records are included.

Enums include `UserRole`, `AccountStatus`, and `SellerVerificationStatus`. Required self-service roles are `BUYER` and `SELLER`; privileged and future roles are represented in the type foundation but cannot be selected during signup.
