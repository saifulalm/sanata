import { z } from "zod";

export const twoFactorCodeSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, "Kode harus berupa 6 digit angka"),
});

export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;
