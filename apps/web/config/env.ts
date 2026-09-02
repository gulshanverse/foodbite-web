import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_ENDPOINT: z.string().optional(), STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(), STORAGE_BUCKET: z.string().optional(),
  PAYMENT_PROVIDER: z.string().optional(), PAYMENT_KEY_ID: z.string().optional(), PAYMENT_KEY_SECRET: z.string().optional(),
  MAPS_API_KEY: z.string().optional(), EMAIL_API_KEY: z.string().optional(),
});
export const env = envSchema.parse({ ...process.env, NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" });
