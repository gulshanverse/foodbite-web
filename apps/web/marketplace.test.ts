import { describe, expect, it } from "vitest";
import { discountPercent, haversineKm, parseMarketplaceQuery } from "@/lib/marketplace";

describe("marketplace discovery", () => {
  it("normalizes invalid query parameters to safe defaults", () => { const query = parseMarketplaceQuery(new URLSearchParams("page=0&sort=unknown&q=%20")); expect(query.page).toBe(1); expect(query.sort).toBe("recommended"); });
  it("derives bounded integer discounts", () => { expect(discountPercent(20000, 12000)).toBe(40); expect(discountPercent(100, 200)).toBe(0); });
  it("calculates geographic distance without pretending precision", () => { expect(haversineKm(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0); expect(haversineKm(12.9716, 77.5946, 13.0358, 77.5970)).toBeGreaterThan(0); });
});
