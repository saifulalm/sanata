import { z } from "zod";

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d+)?$/.test(v.trim()), "Must be a non-negative number");

const componentSchema = z.object({
  priceItemId: z.string().min(1),
  coefficient: nonNegativeNumber,
  order: z.number().int().min(0).optional(),
});

export const ahspSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(2).max(255),
  unit: z.string().min(1).max(20),
  category: z.string().max(120).optional().nullable(),
  overheadPct: nonNegativeNumber.optional(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  components: z.array(componentSchema).default([]),
});

export const ahspUpdateSchema = ahspSchema.partial();

export type AhspInput = z.infer<typeof ahspSchema>;
export type AhspUpdateInput = z.infer<typeof ahspUpdateSchema>;
