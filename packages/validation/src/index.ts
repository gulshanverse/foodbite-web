import { z } from "zod";
export const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(320), password: z.string().min(8).max(128), role: z.enum(["BUYER", "SELLER"]) });
export const loginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) });
export const buyerProfileSchema = z.object({ name: z.string().trim().min(2).max(80), city: z.string().trim().max(80).optional(), state: z.string().trim().max(80).optional(), pincode: z.string().regex(/^\d{6}$/).optional() });
export const sellerProfileSchema = z.object({ trustScore: z.never().optional() });
export const placeholderSchema = z.object({ acknowledged: z.literal(true) });
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const businessSchema = z.object({
  name: z.string().trim().min(2).max(160), type: z.enum(["RESTAURANT", "HOTEL", "BAKERY", "CAFE", "MESS", "CATERER", "WEDDING_EVENT", "SUPERMARKET", "CLOUD_KITCHEN", "CORPORATE_CAFETERIA", "OTHER"]),
  description: z.string().trim().max(2000).optional(), phone: z.string().trim().max(30).optional(), email: z.string().trim().email().max(320).optional(), address: z.string().trim().max(500).optional(), city: z.string().trim().max(80).optional(), state: z.string().trim().max(80).optional(), pincode: z.string().regex(/^\d{6}$/).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), fssaiNumber: z.string().trim().max(80).optional(),
});

export const listingSchema = z.object({
  name: z.string().trim().min(2).max(160), categoryId: z.string().uuid(), listingType: z.enum(["EXACT", "SURPRISE_BOX"]), foodType: z.enum(["VEGETARIAN", "NON_VEGETARIAN", "VEGAN", "JAIN", "OTHER"]), description: z.string().trim().max(2000).optional(), originalPrice: z.number().int().nonnegative(), sellingPrice: z.number().int().nonnegative(), quantity: z.number().int().positive(), unit: z.enum(["PORTION", "PIECE", "BOX", "KG", "GRAM", "LITER", "PACK", "ITEM"]), preparedAt: z.string().datetime().optional(), pickupStart: z.string().datetime(), pickupEnd: z.string().datetime(), packagingInfo: z.string().trim().max(1000).optional(), allergenInfo: z.string().trim().max(1000).optional(),
}).superRefine((value, ctx) => { if (value.sellingPrice > value.originalPrice) ctx.addIssue({ code: "custom", path: ["sellingPrice"], message: "Surplus price cannot exceed original price." }); if (new Date(value.pickupStart) >= new Date(value.pickupEnd)) ctx.addIssue({ code: "custom", path: ["pickupEnd"], message: "Pickup end must be after pickup start." }); if (value.preparedAt && new Date(value.preparedAt) > new Date(value.pickupStart)) ctx.addIssue({ code: "custom", path: ["preparedAt"], message: "Prepared time cannot be after pickup start." }); });

export const inventoryAdjustmentSchema = z.object({ totalQuantity: z.number().int().nonnegative() });
