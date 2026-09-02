import { describe, expect, it } from "vitest";
import { buyerProfileSchema, signupSchema } from "@foodbite/validation";
import { canAccessRole } from "@/lib/authorization";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("authentication foundation", () => {
  it("hashes passwords and verifies only the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("permits only buyer and seller self-service roles", () => {
    expect(signupSchema.safeParse({ name: "Asha Rao", email: "asha@example.com", password: "strong-pass-123", role: "BUYER" }).success).toBe(true);
    expect(signupSchema.safeParse({ name: "Asha Rao", email: "asha@example.com", password: "strong-pass-123", role: "ADMIN" }).success).toBe(false);
  });

  it("validates profile input and keeps role access explicit", () => {
    expect(buyerProfileSchema.safeParse({ name: "Asha Rao", pincode: "560001" }).success).toBe(true);
    expect(buyerProfileSchema.safeParse({ name: "A", pincode: "bad" }).success).toBe(false);
    expect(canAccessRole("BUYER", ["BUYER"])).toBe(true);
    expect(canAccessRole("BUYER", ["ADMIN"])).toBe(false);
  });
});
