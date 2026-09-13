-- Reconcile the schema field used by seller-scoped order and analytics queries.
ALTER TABLE "OrderItem" ADD COLUMN "sellerId" UUID;

UPDATE "OrderItem" AS oi
SET "sellerId" = fl."sellerId"
FROM "FoodListing" AS fl
WHERE oi."listingId" = fl."id";

ALTER TABLE "OrderItem" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "OrderItem_sellerId_createdAt_idx" ON "OrderItem"("sellerId", "createdAt");
