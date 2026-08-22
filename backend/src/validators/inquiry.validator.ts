import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().min(2).max(100),
  // Disamakan huruf kecil seperti email akun: PostgreSQL membedakan kapitalisasi,
  // sehingga kontak broadcast tidak terduplikasi hanya karena beda penulisan.
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  phone: z.string().max(30).optional().or(z.literal("")),
  service: z.string().max(150).optional().or(z.literal("")),
  message: z.string().min(10).max(2000),
  marketingConsent: z.boolean().optional().default(false),
  preferredChannel: z
    .enum(["EMAIL", "TELEGRAM", "WHATSAPP", "INSTAGRAM", "FACEBOOK"])
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const inquiryStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
