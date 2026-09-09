ALTER TABLE "Business" ADD COLUMN "pickupAvailable" BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE "BusinessOperatingHour" (
  "id" UUID NOT NULL,
  "businessId" UUID NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "openTime" TEXT NOT NULL,
  "closeTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessOperatingHour_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessOperatingHour_businessId_dayOfWeek_openTime_closeTime_key" ON "BusinessOperatingHour"("businessId", "dayOfWeek", "openTime", "closeTime");
CREATE INDEX "BusinessOperatingHour_businessId_dayOfWeek_idx" ON "BusinessOperatingHour"("businessId", "dayOfWeek");
ALTER TABLE "BusinessOperatingHour" ADD CONSTRAINT "BusinessOperatingHour_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
