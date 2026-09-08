import { describe, expect, it } from "vitest";
import { canTransitionDonation, canTransitionNgoVerification } from "@/lib/donation-domain";
import { assertInventoryInvariant } from "@/lib/seller-domain";
describe("donation recovery security", () => {
  it("requires controlled NGO verification transitions", () => { expect(canTransitionNgoVerification("UNDER_REVIEW", "VERIFIED")).toBe(true); expect(canTransitionNgoVerification("VERIFIED", "PENDING")).toBe(false); });
  it("allows only controlled donation lifecycle transitions", () => { expect(canTransitionDonation("AVAILABLE", "RESERVED")).toBe(true); expect(canTransitionDonation("AVAILABLE", "COMPLETED")).toBe(false); expect(canTransitionDonation("READY_FOR_PICKUP", "COLLECTED")).toBe(true); });
  it("preserves donated inventory accounting", () => { expect(() => assertInventoryInvariant(20, 5, 3, 7, 5)).not.toThrow(); expect(() => assertInventoryInvariant(20, 5, 3, 7, 4)).toThrow(); });
});
