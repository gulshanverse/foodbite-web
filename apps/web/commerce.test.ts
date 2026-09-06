import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { checkoutSchema, cartItemSchema, pickupVerificationSchema } from "@foodbite/validation";
import { inventoryTotals, orderTransitionAllowed, verifyWebhookSignature } from "@/lib/commerce-domain";

describe("Phase 4 commerce invariants", () => {
  it("preserves inventory totals after a reservation", () => { expect(inventoryTotals(10, 7, 3, 0)).toBe(true); });
  it("rejects negative or unbalanced inventory", () => { expect(() => inventoryTotals(10, 7, 2, 0)).toThrow(); expect(() => inventoryTotals(10, -1, 8, 3)).toThrow(); });
  it("allows only the documented seller order transitions", () => { expect(orderTransitionAllowed("CONFIRMED", "PREPARING")).toBe(true); expect(orderTransitionAllowed("PREPARING", "READY_FOR_PICKUP")).toBe(true); expect(orderTransitionAllowed("CONFIRMED", "COMPLETED")).toBe(false); expect(orderTransitionAllowed("PENDING_PAYMENT", "PAID")).toBe(true); });
  it("rejects invalid cart, checkout, and pickup input", () => { expect(() => cartItemSchema.parse({ listingId: "not-an-id", quantity: 1 })).toThrow(); expect(() => cartItemSchema.parse({ listingId: "00000000-0000-0000-0000-000000000000", quantity: 0 })).toThrow(); expect(() => checkoutSchema.parse({ idempotencyKey: "short" })).toThrow(); expect(() => pickupVerificationSchema.parse({ pickupCode: "123" })).toThrow(); });
  it("verifies webhook signatures without exposing provider secrets", () => { const previous = process.env.PAYMENT_WEBHOOK_SECRET; process.env.PAYMENT_WEBHOOK_SECRET = "test-only-secret"; const body = JSON.stringify({ eventId: "evt_1" }); const signature = crypto.createHmac("sha256", "test-only-secret").update(body).digest("hex"); expect(verifyWebhookSignature(body, signature)).toBe(true); expect(verifyWebhookSignature(body, "bad")).toBe(false); process.env.PAYMENT_WEBHOOK_SECRET = previous; });
});
