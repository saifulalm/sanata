import { z } from "zod";

const paymentTermSchema = z.object({
  label: z.string().min(1).max(120),
  percent: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => v >= 0 && v <= 100, "Persentase harus antara 0 dan 100"),
});

const baseFields = {
  clientName: z.string().min(2).max(200),
  clientCompany: z.string().max(200).optional().nullable(),
  clientAddress: z.string().max(500).optional().nullable(),
  attentionTo: z.string().max(200).optional().nullable(),
  subject: z.string().min(2).max(255),
  openingNote: z.string().max(2000).optional().nullable(),
  closingNote: z.string().max(2000).optional().nullable(),
  terms: z.string().max(5000).optional().nullable(),
  paymentTerms: z.array(paymentTermSchema).optional(),
  validUntil: z.string().datetime().optional(),
  /** Alternatif praktis: masa berlaku dihitung dari hari ini. */
  validForDays: z.number().int().min(1).max(365).optional(),
  signerName: z.string().min(2).max(120),
  signerTitle: z.string().min(2).max(120),
  signatoryId: z.string().optional().nullable(),
  number: z.string().min(1).max(60).optional(),
};

export const quotationCreateSchema = z.object({
  rabId: z.string().min(1),
  ...baseFields,
});

/** Perubahan setelah dibuat hanya menyentuh teks surat, bukan angka. */
export const quotationUpdateSchema = z.object(baseFields).partial();

export const quotationStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELLED"]),
});

export type QuotationCreateInput = z.infer<typeof quotationCreateSchema>;
export type QuotationUpdateInput = z.infer<typeof quotationUpdateSchema>;
export type QuotationStatusInput = z.infer<typeof quotationStatusSchema>;
export type PaymentTerm = z.infer<typeof paymentTermSchema>;
