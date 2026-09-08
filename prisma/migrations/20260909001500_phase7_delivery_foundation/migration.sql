ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_IN_TRANSIT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_DELIVERED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_FAILED';

CREATE TYPE "FulfillmentMethod" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP_FROM_SELLER', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');
CREATE TYPE "DeliveryProviderMode" AS ENUM ('FOODBITE', 'SELLER', 'THIRD_PARTY');

ALTER TABLE "Business" ADD COLUMN "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "deliveryRadiusKm" DECIMAL(6,2);
ALTER TABLE "Business" ADD COLUMN "deliveryBaseFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN "deliveryPerKmFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "fulfillmentMethod" "FulfillmentMethod" NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "Order" ADD COLUMN "deliveryFee" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Address" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "phone" TEXT,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "locality" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Delivery" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "providerMode" "DeliveryProviderMode" NOT NULL,
  "providerReference" TEXT,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "recipientName" TEXT NOT NULL,
  "phone" TEXT,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "locality" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "assignedAt" TIMESTAMP(3),
  "pickedUpAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");
CREATE INDEX "Address_userId_updatedAt_idx" ON "Address"("userId", "updatedAt");
CREATE INDEX "Delivery_status_createdAt_idx" ON "Delivery"("status", "createdAt");
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
