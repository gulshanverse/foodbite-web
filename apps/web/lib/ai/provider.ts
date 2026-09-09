import { z } from "zod";

export type AIFailureCategory = "disabled" | "timeout" | "provider" | "rate_limit" | "invalid_output" | "unsafe_input" | "unknown";
export class AIOperationError extends Error { constructor(public category: AIFailureCategory, message = "AI assistance is temporarily unavailable.") { super(message); } }
const MAX_INPUT = 6000;
const timeoutMs = 4500;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const enabled = process.env.OPENAI_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
const buckets = new Map<string, { count: number; resetAt: number }>();

export function aiConfig() { return { enabled, model }; }
export function assertBoundedInput(input: string) { if (input.length > MAX_INPUT) throw new AIOperationError("unsafe_input", "Please shorten the text before requesting AI assistance."); if (/<script|ignore previous|reveal .*secret|api key|password|token/i.test(input)) throw new AIOperationError("unsafe_input", "This text cannot be sent for AI assistance."); }
export function consumeAIRateLimit(actorId: string, operation: string, limit = 8) { const key = `${actorId}:${operation}`; const now = Date.now(); const current = buckets.get(key); if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + 60_000 }); return true; } if (current.count >= limit) return false; current.count += 1; return true; }
export async function generateStructured<T>(input: { actorId: string; operation: string; system: string; user: string; schema: z.ZodType<T>; jsonSchema: Record<string, unknown> }): Promise<{ value: T; model: string }> {
  assertBoundedInput(input.user); if (!enabled) throw new AIOperationError("disabled"); if (!consumeAIRateLimit(input.actorId, input.operation)) throw new AIOperationError("rate_limit", "AI assistance has reached its short-term limit. Please try again soon.");
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs); const started = Date.now();
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal: controller.signal, headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model, temperature: 0.2, max_tokens: 700, response_format: { type: "json_schema", json_schema: { name: input.operation.replace(/[^a-z0-9_]/gi, "_"), strict: true, schema: input.jsonSchema } }, messages: [{ role: "system", content: input.system }, { role: "user", content: input.user }] }) });
    if (response.status === 429) throw new AIOperationError("rate_limit"); if (!response.ok) throw new AIOperationError("provider");
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> }; const content = body.choices?.[0]?.message?.content; if (!content) throw new AIOperationError("invalid_output"); const parsed = input.schema.safeParse(JSON.parse(content)); if (!parsed.success) throw new AIOperationError("invalid_output"); console.info(JSON.stringify({ operation: input.operation, model, durationMs: Date.now() - started, outcome: "success" })); return { value: parsed.data, model };
  } catch (error) { const normalized = error instanceof AIOperationError ? error : error instanceof Error && error.name === "AbortError" ? new AIOperationError("timeout") : new AIOperationError("unknown"); console.info(JSON.stringify({ operation: input.operation, model, durationMs: Date.now() - started, outcome: "fallback", category: normalized.category })); throw normalized; } finally { clearTimeout(timer); }
}
