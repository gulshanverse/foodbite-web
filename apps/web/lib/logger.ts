import { randomUUID } from "node:crypto";

type LogLevel = "info" | "warn" | "error";
const sensitiveKey = /(password|token|secret|authorization|cookie|api.?key|pickup.?code|qr.?token|signature|credential|prompt|response|address|phone|email)/i;

export function createRequestId(value?: string | null) { return value && /^[A-Za-z0-9._:-]{8,128}$/.test(value) ? value : `req_${randomUUID()}`; }
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : redact(child)]));
  if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}
export function safeErrorCategory(error: unknown) { if (error instanceof Error) return error.name === "AbortError" ? "timeout" : error.message.slice(0, 80).replace(/[^a-zA-Z0-9_.-]/g, "_"); return "unknown"; }
export function log(level: LogLevel, event: string, fields: Record<string, unknown> = {}) { const entry = { timestamp: new Date().toISOString(), level, event, environment: process.env.NODE_ENV ?? "development", component: "foodbite-web", ...redact(fields) as Record<string, unknown> }; const line = JSON.stringify(entry); if (level === "error") console.error(line); else if (level === "warn") console.warn(line); else console.info(line); }
export function logRequest(fields: { requestId: string; route: string; method: string; status: number; durationMs: number }) { log(fields.status >= 500 ? "error" : "info", "http_request", fields); }
