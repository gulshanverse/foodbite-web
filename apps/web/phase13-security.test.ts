import { afterEach, describe, expect, it } from "vitest";
import { safeEqualSecret, checkRateLimit, resetSecurityStateForTests } from "@/lib/security";

afterEach(() => resetSecurityStateForTests());

describe("Phase 13 security helpers", () => {
  it("compares equal secrets and rejects different lengths/content", () => {
    expect(safeEqualSecret("secret", "secret")).toBe(true);
    expect(safeEqualSecret("secret", "secreT")).toBe(false);
    expect(safeEqualSecret("secret", "secret-longer")).toBe(false);
  });

  it("enforces bounded per-key request limits", () => {
    const rule = { limit: 2, windowMs: 1_000 };
    expect(checkRateLimit("signup:ip", rule, 10).allowed).toBe(true);
    expect(checkRateLimit("signup:ip", rule, 10).allowed).toBe(true);
    expect(checkRateLimit("signup:ip", rule, 10).allowed).toBe(false);
    expect(checkRateLimit("signup:ip", rule, 1_011).allowed).toBe(true);
  });
});
