import { describe, expect, it } from "vitest";
import { resolveAnalyticsRange } from "@/lib/analytics-domain";
describe("analytics range semantics", () => {
  it("resolves bounded standard ranges in UTC", () => { const result = resolveAnalyticsRange({ range: "7d" }); expect(result.timezone).toBe("UTC"); expect(result.end.getTime() - result.start.getTime()).toBeGreaterThan(6 * 86400000); expect(result.end.getTime() - result.start.getTime()).toBeLessThan(8 * 86400000); });
  it("supports a valid custom range", () => { const result = resolveAnalyticsRange({ range: "custom", start: "2026-01-01T00:00:00.000Z", end: "2026-01-08T00:00:00.000Z" }); expect(result.start.toISOString()).toBe("2026-01-01T00:00:00.000Z"); });
  it("rejects unbounded and reversed ranges", () => { expect(() => resolveAnalyticsRange({ range: "custom", start: "2026-01-08T00:00:00.000Z", end: "2026-01-01T00:00:00.000Z" })).toThrow(); expect(() => resolveAnalyticsRange({ range: "custom", start: "2026-01-01T00:00:00.000Z", end: "2026-06-01T00:00:00.000Z" })).toThrow(); });
});
