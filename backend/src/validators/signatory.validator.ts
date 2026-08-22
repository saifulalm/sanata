import { z } from "zod";

export const signatorySchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().min(2).max(120),
  role: z
    .enum(["DIREKTUR_UTAMA", "DIREKTUR", "MANAGER_PROYEK", "SITE_MANAGER", "PIMPINAN_PROYEK", "STAF", "LAINNYA"])
    .optional()
    .nullable(),
  department: z.string().max(120).optional().nullable(),
});

export const signatoryUpdateSchema = signatorySchema.partial();

export type SignatoryCreateInput = z.infer<typeof signatorySchema>;
export type SignatoryUpdateInput = z.infer<typeof signatoryUpdateSchema>;
