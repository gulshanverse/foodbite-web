-- Phase 4 recovery: upgrade the already-applied phase4_commerce schema in place.
-- The previous version of this migration attempted to recreate Phase 4 tables/enums
-- and failed on OrderStatus because 20260904100000_phase4_commerce already created them.
-- Keep legacy columns where practical to avoid data loss; make them nullable when the
-- current application no longer supplies them, and add/backfill the fields required by
-- the current Prisma contract.

-- OrderStatus gained DISPUTED after the original commerce migration.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

-- Reservation evolved from order-owned reservations to buyer-owned reservations.
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "userId" UUID;
UPDATE "Reservation" r
SET "userId" = o."buyerId"
FROM "Order" o
WHERE r."orderId" = o."id"
  AND r."userId" IS NULL;
ALTER TABLE "Reservation" ALTER COLUMN "orderId" DROP NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "userId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Reservation_userId_status_idx" ON "Reservation"("userId", "status");
ALTER TABLE "Reservation" DROP CONSTRAINT IF EXISTS "Reservation_userId_fkey";
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The current order contract no longer requires the legacy seller/idempotency columns.
ALTER TABLE "Order" ALTER COLUMN "sellerId" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "idempotencyKey" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "buyerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupPincode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
UPDATE "Order" o
SET "buyerName" = COALESCE(bp."name", u."email")
FROM "User" u
LEFT JOIN "BuyerProfile" bp ON bp."userId" = u."id"
WHERE o."buyerId" = u."id"
  AND o."buyerName" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "buyerName" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- OrderItem gained normalized listing snapshots while retaining the old snapshot columns.
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "listingName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "unit" "ListingUnit";
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "foodType" "FoodType";
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "originalUnitPrice" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "lineTotal" INTEGER;
UPDATE "OrderItem" oi
SET
  "listingName" = COALESCE(oi."listingName", fl."name"),
  "unit" = COALESCE(oi."unit", fl."unit"),
  "foodType" = COALESCE(oi."foodType", fl."foodType"),
  "originalUnitPrice" = COALESCE(oi."originalUnitPrice", fl."originalPrice"),
  "lineTotal" = COALESCE(oi."lineTotal", oi."totalPrice")
FROM "FoodListing" fl
WHERE oi."listingId" = fl."id";
ALTER TABLE "OrderItem" ALTER COLUMN "listingName" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "unit" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "foodType" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "originalUnitPrice" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "lineTotal" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "listingNameSnapshot" DROP NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "pickupStartSnapshot" DROP NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "pickupEndSnapshot" DROP NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "totalPrice" DROP NOT NULL;

-- Payment gained explicit failure and paid timestamps.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_orderId_key" ON "Payment"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerOrderId_key" ON "Payment"("providerOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- Webhook records evolved from hash-only payloads to durable JSON event records.
ALTER TABLE "PaymentWebhook" ADD COLUMN IF NOT EXISTS "payload" JSONB;
UPDATE "PaymentWebhook"
SET "payload" = '{}'::jsonb
WHERE "payload" IS NULL;
ALTER TABLE "PaymentWebhook" ALTER COLUMN "payload" SET NOT NULL;
ALTER TABLE "PaymentWebhook" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3);
UPDATE "PaymentWebhook"
SET "receivedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "receivedAt" IS NULL;
ALTER TABLE "PaymentWebhook" ALTER COLUMN "receivedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PaymentWebhook" ALTER COLUMN "receivedAt" SET NOT NULL;
ALTER TABLE "PaymentWebhook" ADD COLUMN IF NOT EXISTS "paymentId" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhook_eventId_key" ON "PaymentWebhook"("eventId");
CREATE INDEX IF NOT EXISTS "PaymentWebhook_paymentId_idx" ON "PaymentWebhook"("paymentId");
ALTER TABLE "PaymentWebhook" DROP CONSTRAINT IF EXISTS "PaymentWebhook_paymentId_fkey";
ALTER TABLE "PaymentWebhook" ADD CONSTRAINT "PaymentWebhook_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pickup gained an explicit lifecycle state and timestamps. Legacy verification columns
-- remain in place; the current application uses the new lifecycle and secret fields.
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'READY', 'PICKED_UP', 'CANCELLED');
ALTER TABLE "Pickup" ADD COLUMN "status" "PickupStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Pickup" ADD COLUMN "pickupCodeLast4" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Pickup" ADD COLUMN "readyAt" TIMESTAMP(3);
ALTER TABLE "Pickup" ADD COLUMN "pickedUpAt" TIMESTAMP(3);
UPDATE "Pickup"
SET "qrTokenHash" = 'legacy:' || "id"::text
WHERE "qrTokenHash" IS NULL;
ALTER TABLE "Pickup" ALTER COLUMN "qrTokenHash" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Pickup_pickupCodeHash_key" ON "Pickup"("pickupCodeHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Pickup_qrTokenHash_key" ON "Pickup"("qrTokenHash");

-- Match the current CartItem delete semantics without touching cart data.
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_listingId_fkey";
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "FoodListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
