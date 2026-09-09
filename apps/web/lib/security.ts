import { timingSafeEqual } from "node:crypto";

export type RateLimitRule = { limit: number; windowMs: number };

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Compare untrusted signatures without leaking length/content timing information. */
export function safeEqualSecret(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Process-local limiter for MVP deployments. It intentionally fails open only when
 * the caller supplies an invalid rule; callers should still enforce authentication.
 * A shared store should replace this when multiple instances need coordinated limits.
 */
export function checkRateLimit(key: string, rule: RateLimitRule, now = Date.now()) {
  if (rule.limit < 1 || rule.windowMs < 1) return { allowed: true, remaining: rule.limit };
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
        if (buckets.size < MAX_BUCKETS) break;
      }
    }
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.limit - 1, resetAt: now + rule.windowMs };
  }
  if (current.count >= rule.limit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return { allowed: true, remaining: rule.limit - current.count, resetAt: current.resetAt };
}

export function resetRateLimitsForTests() {
  buckets.clear();
}

export function clientKey(request: Request, actor?: string | null) {
  if (actor) return `user:${actor}`;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return `ip:${forwarded || request.headers.get("x-real-ip") || "unknown"}`;
}

export function rateLimitResponse(result: { resetAt?: number }) {
  const retryAfter = result.resetAt ? Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)) : 60;
  return { "retry-after": String(retryAfter), "cache-control": "no-store" };
}

export function isSafeRedirectPath(value: string | null | undefined) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"));
}

export function resetSecurityStateForTests() {
  resetRateLimitsForTests();
}
