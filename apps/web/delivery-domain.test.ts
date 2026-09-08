import { describe, expect, it } from "vitest";
import { calculateDeliveryFee, canTransitionDelivery, haversineKm } from "@/lib/delivery-domain";

describe("delivery foundation", () => {
  it("calculates straight-line distance server-side", () => { expect(haversineKm(28.6139, 77.209, 28.7041, 77.1025)).toBeGreaterThan(10); });
  it("calculates integer paise pricing without trusting client totals", () => { expect(calculateDeliveryFee(4000, 1000, 2.2)).toBe(6200); });
  it("allows only controlled delivery transitions", () => { expect(canTransitionDelivery("PENDING", "ASSIGNED")).toBe(true); expect(canTransitionDelivery("PENDING", "DELIVERED")).toBe(false); expect(canTransitionDelivery("FAILED", "PENDING")).toBe(true); });
});
