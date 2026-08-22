import { z } from "zod";

/**
 * Email disimpan dan dicari dalam huruf kecil.
 *
 * PostgreSQL membandingkan teks secara case-sensitive. Tanpa normalisasi ini
 * "Admin@sanata.id" akan lolos sebagai akun kedua, dan login dengan kapitalisasi
 * berbeda dari saat pendaftaran akan gagal.
 */
const emailSchema = z
  .string()
  .email()
  .transform((value) => value.trim().toLowerCase());

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
