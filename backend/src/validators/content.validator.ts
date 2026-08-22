import { z } from "zod";

/**
 * Gambar bisa berupa URL absolut (S3/CDN) atau path relatif hasil unggahan
 * lokal (`/uploads/..`). Validasi `.url()` saja akan menolak yang relatif.
 */
const imageRef = z
  .string()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
    "Harus URL absolut atau path yang diawali /"
  )
  .optional()
  .nullable();

export const contentSchema = z.object({
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  type: z.enum(["PAGE", "POST"]).default("POST"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  coverImage: imageRef,
  categoryId: z.string().optional().nullable(),

  // --- SEO ---
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  ogImage: imageRef,
  canonicalUrl: z
    .string()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Harus URL absolut")
    .optional()
    .nullable(),
  focusKeyword: z.string().max(120).optional().nullable(),
  noIndex: z.boolean().optional(),
});

export const contentUpdateSchema = contentSchema.partial();

/** Analisis SEO berjalan atas draf yang belum disimpan, jadi skemanya longgar. */
export const seoAnalyzeSchema = z.object({
  title: z.string().default(""),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  body: z.string().default(""),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  focusKeyword: z.string().optional().nullable(),
});

export type ContentInput = z.infer<typeof contentSchema>;
export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;
