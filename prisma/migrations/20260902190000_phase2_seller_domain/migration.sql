-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RESTAURANT', 'HOTEL', 'BAKERY', 'CAFE', 'MESS', 'CATERER', 'WEDDING_EVENT', 'SUPERMARKET', 'CLOUD_KITCHEN', 'CORPORATE_CAFETERIA', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('EXACT', 'SURPRISE_BOX');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'VEGAN', 'JAIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'EXPIRED', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingUnit" AS ENUM ('PORTION', 'PIECE', 'BOX', 'KG', 'GRAM', 'LITER', 'PACK', 'ITEM');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fssaiDocumentUrl" TEXT,
ADD COLUMN     "fssaiNumber" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "type" "BusinessType",
ADD COLUMN     "verificationStatus" "SellerVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodListing" (
    "id" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "listingType" "ListingType" NOT NULL,
    "foodType" "FoodType" NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" "ListingUnit" NOT NULL,
    "preparedAt" TIMESTAMP(3),
    "pickupStart" TIMESTAMP(3) NOT NULL,
    "pickupEnd" TIMESTAMP(3) NOT NULL,
    "packagingInfo" TEXT,
    "allergenInfo" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodImage" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_slug_key" ON "FoodCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FoodListing_slug_key" ON "FoodListing"("slug");

-- CreateIndex
CREATE INDEX "FoodListing_sellerId_idx" ON "FoodListing"("sellerId");

-- CreateIndex
CREATE INDEX "FoodListing_categoryId_idx" ON "FoodListing"("categoryId");

-- CreateIndex
CREATE INDEX "FoodListing_status_idx" ON "FoodListing"("status");

-- CreateIndex
CREATE INDEX "FoodListing_foodType_idx" ON "FoodListing"("foodType");

-- CreateIndex
CREATE INDEX "FoodListing_pickupEnd_idx" ON "FoodListing"("pickupEnd");

-- CreateIndex
CREATE INDEX "FoodListing_createdAt_idx" ON "FoodListing"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_listingId_key" ON "Inventory"("listingId");

-- CreateIndex
CREATE INDEX "FoodImage_listingId_sortOrder_idx" ON "FoodImage"("listingId", "sortOrder");

-- AddForeignKey
ALTER TABLE "FoodListing" ADD CONSTRAINT "FoodListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodListing" ADD CONSTRAINT "FoodListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FoodCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "FoodListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodImage" ADD CONSTRAINT "FoodImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "FoodListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

