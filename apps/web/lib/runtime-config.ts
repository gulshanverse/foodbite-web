import { z } from "zod";

const optionalUrl = z.string().url().optional();
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  NEXT_PUBLIC_APP_URL: optionalUrl,
  PAYMENT_PROVIDER: z.string().trim().min(1).optional(),
  PAYMENT_KEY_ID: z.string().trim().min(1).optional(),
  PAYMENT_KEY_SECRET: z.string().trim().min(1).optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  OPENAI_AI_ENABLED: z.enum(["true", "false"]).default("false"),
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  SLOW_REQUEST_MS: z.coerce.number().int().positive().max(60000).default(1000),
});

export type RuntimeConfig = z.infer<typeof schema>;
let cached: RuntimeConfig | null = null;

export function getRuntimeConfig(): RuntimeConfig {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Runtime configuration is invalid: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  const config = parsed.data;
  if (config.NODE_ENV === "production") {
    const required = ["DATABASE_URL", "AUTH_SECRET", "CRON_SECRET", "NEXT_PUBLIC_APP_URL"] as const;
    const missing = required.filter((key) => !config[key]);
    if (missing.length) throw new Error(`Missing production configuration: ${missing.join(", ")}`);
    if (config.PAYMENT_PROVIDER && (!config.PAYMENT_KEY_ID || !config.PAYMENT_KEY_SECRET || !config.PAYMENT_WEBHOOK_SECRET)) throw new Error("Payment provider configuration is incomplete.");
    if (config.OPENAI_AI_ENABLED === "true" && !config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required when AI is enabled.");
  }
  cached = config; return config;
}

export function checkRuntimeConfig() { try { getRuntimeConfig(); return { ok: true as const }; } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Runtime configuration is invalid." }; } }
export function resetRuntimeConfigForTests() { cached = null; }
