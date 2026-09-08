import { describe, expect, it } from "vitest";
import { canAccessRole, hasPermission } from "@/lib/authorization";
import { canTransitionOrder } from "@/lib/seller-order-domain";
import { canTransitionVerification } from "@/lib/admin-domain";

describe("Phase 5 security boundaries", () => {
  it("keeps privileged permissions explicit", () => {
    expect(hasPermission({ role: "MODERATOR", status: "ACTIVE" }, "LISTING_MODERATE")).toBe(true);
    expect(hasPermission({ role: "SUPPORT", status: "ACTIVE" }, "LISTING_MODERATE")).toBe(false);
    expect(hasPermission({ role: "ADMIN", status: "SUSPENDED" }, "AUDIT_READ")).toBe(false);
    expect(canAccessRole("BUYER", ["ADMIN", "SUPER_ADMIN"])).toBe(false);
  });

  it("allows only valid verification transitions", () => {
    expect(canTransitionVerification("UNDER_REVIEW", "VERIFIED")).toBe(true);
    expect(canTransitionVerification("VERIFIED", "PENDING")).toBe(false);
  });

  it("rejects arbitrary order status changes", () => {
    expect(canTransitionOrder("PAID", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("PAID", "COMPLETED")).toBe(false);
    expect(canTransitionOrder("READY_FOR_PICKUP", "PICKED_UP")).toBe(true);
  });
});
