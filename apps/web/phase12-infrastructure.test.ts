import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequestId, redact } from "@/lib/logger";
import { checkRuntimeConfig, resetRuntimeConfigForTests } from "@/lib/runtime-config";
const original = { ...process.env };
afterEach(() => { process.env = { ...original }; resetRuntimeConfigForTests(); });
describe("Phase 12 infrastructure boundaries", () => {
  it("redacts secrets and sensitive personal fields recursively", () => { const result = redact({ password: "secret", nested: { pickupCode: "123456", email: "person@example.com" }, safe: "value" }) as Record<string, unknown>; const nested = result.nested as Record<string, unknown>; expect(result.password).toBe("[REDACTED]"); expect(nested.pickupCode).toBe("[REDACTED]"); expect(nested.email).toBe("[REDACTED]"); expect(result.safe).toBe("value"); });
  it("accepts safe request IDs and replaces unsafe values", () => { expect(createRequestId("req_12345678")).toBe("req_12345678"); expect(createRequestId("bad id")).toMatch(/^req_/); });
  it("allows optional integrations to remain disabled outside production", () => { vi.stubEnv("NODE_ENV", "test"); delete process.env.DATABASE_URL; delete process.env.AUTH_SECRET; expect(checkRuntimeConfig().ok).toBe(true); });
  it("rejects incomplete production configuration without printing secrets", () => { vi.stubEnv("NODE_ENV", "production"); delete process.env.DATABASE_URL; delete process.env.AUTH_SECRET; delete process.env.CRON_SECRET; delete process.env.NEXT_PUBLIC_APP_URL; const result = checkRuntimeConfig(); expect(result.ok).toBe(false); if (!result.ok) { expect(result.error).toContain("DATABASE_URL"); expect(result.error).not.toContain("postgres"); } });
});
