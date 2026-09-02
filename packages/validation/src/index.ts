import { z } from "zod";

export const placeholderSchema = z.object({
  acknowledged: z.literal(true),
});

export type PlaceholderInput = z.infer<typeof placeholderSchema>;
