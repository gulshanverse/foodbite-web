import { describe, expect, it } from "vitest";
import { businessSchema, operatingHourSchema, operatingHoursSchema, sellerListingQuerySchema } from "@foodbite/validation";
import { assertInventoryInvariant, canTransitionListing } from "@/lib/seller-domain";
describe("seller business operations", () => {
  it("accepts valid fulfillment settings and rejects invalid fees", () => { expect(businessSchema.parse({ name: "Cafe", type: "CAFE", pickupAvailable: true, deliveryAvailable: true, deliveryRadiusKm: 8, deliveryBaseFee: 500, deliveryPerKmFee: 100 }).deliveryRadiusKm).toBe(8); expect(() => businessSchema.parse({ name: "Cafe", type: "CAFE", deliveryBaseFee: -1 })).toThrow(); });
  it("validates operating hours and duplicate windows", () => { expect(operatingHourSchema.parse({ dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" }).dayOfWeek).toBe(1); expect(() => operatingHourSchema.parse({ dayOfWeek: 1, openTime: "18:00", closeTime: "09:00" })).toThrow(); expect(() => operatingHoursSchema.parse({ hours: [{ dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" }, { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" }] })).toThrow(); });
  it("supports seller listing filters and preserves inventory accounting", () => { expect(sellerListingQuerySchema.parse({ status: "ACTIVE", page: "2" }).page).toBe(2); expect(canTransitionListing("ACTIVE", "PAUSED")).toBe(true); expect(() => assertInventoryInvariant(20, 5, 3, 7, 5)).not.toThrow(); });
});
