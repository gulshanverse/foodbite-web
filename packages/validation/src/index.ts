import { z } from "zod";
export const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(320), password: z.string().min(8).max(128), role: z.enum(["BUYER", "SELLER"]) });
export const loginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) });
export const buyerProfileSchema = z.object({ name: z.string().trim().min(2).max(80), city: z.string().trim().max(80).optional(), state: z.string().trim().max(80).optional(), pincode: z.string().regex(/^\d{6}$/).optional() });
export const sellerProfileSchema = z.object({ trustScore: z.never().optional() });
export const placeholderSchema = z.object({ acknowledged: z.literal(true) });
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
