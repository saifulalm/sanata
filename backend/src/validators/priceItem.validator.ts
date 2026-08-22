import { z } from "zod";

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d+)?$/.test(v.trim()), "Must be a non-negative number");

export const priceItemSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(2).max(200),
  type: z.enum(["LABOR", "MATERIAL", "EQUIPMENT"]),
  unit: z.string().min(1).max(20),
  unitPrice: decimalString,
  region: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const priceItemUpdateSchema = priceItemSchema.partial();

export type PriceItemInput = z.infer<typeof priceItemSchema>;
export type PriceItemUpdateInput = z.infer<typeof priceItemUpdateSchema>;
