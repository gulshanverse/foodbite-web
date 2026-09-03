import { describe, expect, it } from "vitest";
import { assertInventoryInvariant, calculateDiscount, canTransitionListing, slugify } from "@/lib/seller-domain";

describe("seller domain", () => {
  it("calculates discount from integer paise values", () => { expect(calculateDiscount(12000, 9000)).toBe(25); });
  it("creates URL-safe listing slugs", () => { expect(slugify("Paneer Butter Masala — Surplus")).toBe("paneer-butter-masala-surplus"); });
  it("allows only controlled listing transitions", () => { expect(canTransitionListing("DRAFT", "ACTIVE")).toBe(true); expect(canTransitionListing("DRAFT", "PENDING_REVIEW")).toBe(true); expect(canTransitionListing("ACTIVE", "PAUSED")).toBe(true); });
  it("rejects inconsistent inventory", () => { expect(() => assertInventoryInvariant(10, 5, 3, 2)).not.toThrow(); expect(() => assertInventoryInvariant(10, 8, 3, 2)).toThrow(); });
});
