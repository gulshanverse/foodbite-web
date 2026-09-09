import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_ENDPOINT: z.string().optional(), STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(), STORAGE_BUCKET: z.string().optional(),
  PAYMENT_PROVIDER: z.string().optional(), PAYMENT_KEY_ID: z.string().optional(), PAYMENT_KEY_SECRET: z.string().optional(),
  MAPS_API_KEY: z.string().optional(), EMAIL_API_KEY: z.string().optional(),
});
const parsed = envSchema.parse({ ...process.env, NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" });
if (process.env.NODE_ENV === "production") {
  if (!parsed.DATABASE_URL) throw new Error("DATABASE_URL must be configured in production.");
  if (!parsed.AUTH_SECRET) throw new Error("AUTH_SECRET must be configured with at least 32 characters in production.");
  if (parsed.NEXT_PUBLIC_APP_URL.startsWith("http://localhost")) throw new Error("NEXT_PUBLIC_APP_URL must be a deployed HTTPS URL in production.");
}
export const env = parsed;
