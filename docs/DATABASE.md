# Database

## Implemented
Prisma is configured for PostgreSQL in `prisma/schema.prisma`, with no production marketplace models or fake seed records.

## Planned
Add domain models through reviewed migrations. Preserve auditability for order, payment, moderation, and administrative changes.

## Phase 1 authentication schema

The Phase 1 migration adds `User`, `BuyerProfile`, `SellerProfile`, and the minimal `Business` relationship, plus the standard `Account`, `Session`, and `VerificationToken` tables retained for Auth.js compatibility. `User.email`, `BuyerProfile.userId`, and `SellerProfile.userId` are unique. User records use soft deletion through `deletedAt`; application code excludes deleted records from authentication.

The migration is stored at `prisma/migrations/20260902171500_phase1_auth/migration.sql`. Apply it to a local PostgreSQL database with `pnpm prisma migrate deploy`; do not modify a production database directly. No fake users or seed records are included.

Enums include `UserRole`, `AccountStatus`, and `SellerVerificationStatus`. Required self-service roles are `BUYER` and `SELLER`; privileged and future roles are represented in the type foundation but cannot be selected during signup.

## Phase 2 seller domain

Phase 2 stores INR money as integer paise. For example, ₹120.50 is stored as `12050`; the UI converts rupees to paise before a server mutation, and the server calculates any derived discount rather than accepting a client-supplied percentage.

`FoodListing` is seller-owned through `SellerProfile`, references a `FoodCategory`, and uses controlled `ListingStatus` transitions. Drafts do not create inventory. Activation creates an `Inventory` row with `availableQuantity = totalQuantity` and zero reserved/sold quantity. Inventory mutations are isolated in `seller-domain.ts`, use a Prisma transaction, increment an optimistic `version`, prevent negative values, and preserve `total = available + reserved + sold`. Reservation and purchase operations are intentionally not implemented before checkout exists.

The `prisma/seed.ts` script contains only explicit development food categories. It creates no seller, listing, inventory, order, or buyer records. Expiration is available through the server-side `expireListings()` operation, which marks active or paused listings expired once `pickupEnd` has passed. A future background job can call the same operation.

Images are represented by `FoodImage` metadata rather than PostgreSQL binary data. The storage abstraction validates JPEG, PNG, and WebP metadata, limits files to 5 MB, requires safe filenames and meaningful alt text, and refuses to claim upload success until an S3-compatible provider adapter is configured.
