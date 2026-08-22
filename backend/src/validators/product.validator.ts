import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  compareAtPrice: z.coerce.number().nonnegative().optional().nullable(),
  sku: z.string().max(64).optional().nullable(),
  stock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.coerce.boolean().default(true),
  categoryId: z.string().optional().nullable(),
});

export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
