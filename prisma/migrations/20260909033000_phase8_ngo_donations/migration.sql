CREATE TYPE "DonationStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'ACCEPTED', 'READY_FOR_PICKUP', 'COLLECTED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED_COLLECTION');
CREATE TYPE "DonationReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COLLECTED', 'EXPIRED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_RESERVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_READY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_COLLECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DONATION_EXPIRED';

ALTER TABLE "Inventory" ADD COLUMN "donatedQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "NGOProfile" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "organizationName" TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  "phone" TEXT,
  "description" TEXT,
  "serviceArea" TEXT,
  "address" TEXT,
  "operatingHours" TEXT,
  "verificationStatus" "SellerVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NGOProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NGOProfile_userId_key" ON "NGOProfile"("userId");
CREATE INDEX "NGOProfile_verificationStatus_idx" ON "NGOProfile"("verificationStatus");
ALTER TABLE "NGOProfile" ADD CONSTRAINT "NGOProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Donation" (
  "id" UUID NOT NULL,
  "listingId" UUID NOT NULL,
  "sellerId" UUID NOT NULL,
  "status" "DonationStatus" NOT NULL DEFAULT 'DRAFT',
  "quantity" INTEGER NOT NULL,
  "availableQuantity" INTEGER NOT NULL,
  "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "collectedQuantity" INTEGER NOT NULL DEFAULT 0,
  "pickupCodeHash" TEXT,
  "pickupCodeLast4" TEXT,
  "qrTokenHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Donation_listingId_key" ON "Donation"("listingId");
CREATE UNIQUE INDEX "Donation_pickupCodeHash_key" ON "Donation"("pickupCodeHash");
CREATE UNIQUE INDEX "Donation_qrTokenHash_key" ON "Donation"("qrTokenHash");
CREATE INDEX "Donation_status_expiresAt_idx" ON "Donation"("status", "expiresAt");
CREATE INDEX "Donation_sellerId_createdAt_idx" ON "Donation"("sellerId", "createdAt");
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "FoodListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "DonationReservation" (
  "id" UUID NOT NULL,
  "donationId" UUID NOT NULL,
  "ngoId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "DonationReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DonationReservation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DonationReservation_donationId_ngoId_key" ON "DonationReservation"("donationId", "ngoId");
CREATE INDEX "DonationReservation_ngoId_status_createdAt_idx" ON "DonationReservation"("ngoId", "status", "createdAt");
ALTER TABLE "DonationReservation" ADD CONSTRAINT "DonationReservation_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DonationReservation" ADD CONSTRAINT "DonationReservation_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "NGOProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
