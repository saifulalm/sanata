import { z } from "zod";

/** Pembuatan akun oleh admin — satu-satunya jalan membuat ADMIN/EDITOR. */
export const userCreateSchema = z.object({
  name: z.string().min(2).max(100),
  // Huruf kecil, sama seperti auth.validator: PostgreSQL case-sensitive.
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(72),
  role: z.enum(["ADMIN", "EDITOR", "USER"]).default("EDITOR"),
  isActive: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "EDITOR", "USER"]).optional(),
  isActive: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
