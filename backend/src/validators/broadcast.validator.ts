import { z } from "zod";

export const broadcastChannelSchema = z.enum([
  "EMAIL",
  "TELEGRAM",
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
]);

export const broadcastProviderSchema = z.enum([
  "EMAIL_SMTP",
  "TELEGRAM_BOT",
  "WHATSAPP_BAILEYS",
  "WHATSAPP_OFFICIAL",
  "WHATSAPP_WAHA",
  "WHATSAPP_EVOLUTION",
  "INSTAGRAM_META",
  "FACEBOOK_META",
]);

export const broadcastConnectionModeSchema = z.enum(["PRODUCTION", "EXPERIMENTAL"]);

export const broadcastAudienceTypeSchema = z.enum([
  "ALL_CONTACTS",
  "CONSENTED_ONLY",
  "TAGGED",
]);

const baseBroadcastConnectionSchema = z.object({
  channel: broadcastChannelSchema,
  provider: broadcastProviderSchema,
  mode: broadcastConnectionModeSchema.default("PRODUCTION"),
  accountKey: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-_]*$/i, "Gunakan huruf, angka, dash, atau underscore."),
  label: z.string().min(2).max(120),
  senderIdentity: z.string().max(120).optional().nullable(),
  isEnabled: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  priority: z.number().int().min(1).max(999).optional(),
  weight: z.number().int().min(1).max(20).optional(),
  dailyLimit: z.number().int().min(1).max(50000).optional().nullable(),
  hourlyLimit: z.number().int().min(1).max(5000).optional().nullable(),
  cooldownUntil: z.string().datetime().optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const broadcastConnectionCreateSchema = baseBroadcastConnectionSchema;

export const broadcastConnectionUpdateSchema = baseBroadcastConnectionSchema
  .omit({ channel: true, accountKey: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Setidaknya satu field koneksi harus dikirim.",
  });

/** Form "hubungkan WhatsApp": hanya nama perangkat yang wajib. */
export const whatsappQuickConnectSchema = z.object({
  label: z.string().min(2).max(120),
  senderIdentity: z.string().max(30).optional().nullable(),
  gatewayUrl: z.string().url().max(300).optional().nullable(),
  apiKey: z.string().max(300).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export const broadcastPairingSchema = z.object({
  phoneNumber: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Gunakan angka saja, contoh 62812xxxxxxx."),
});

const contactBaseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160).optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable().or(z.literal("")),
  telegramChatId: z.string().max(60).optional().nullable().or(z.literal("")),
  instagramHandle: z.string().max(60).optional().nullable().or(z.literal("")),
  facebookPageScopedId: z.string().max(60).optional().nullable().or(z.literal("")),
  preferredChannel: broadcastChannelSchema.optional().nullable(),
  consent: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable().or(z.literal("")),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
});

export const broadcastContactSchema = contactBaseSchema;

export const broadcastContactUpdateSchema = contactBaseSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Setidaknya satu field kontak harus dikirim.",
  });

export const broadcastCampaignSchema = z.object({
  title: z.string().min(3).max(160),
  channel: broadcastChannelSchema,
  connectionId: z.string().cuid().optional().nullable(),
  audienceType: broadcastAudienceTypeSchema.default("CONSENTED_ONLY"),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(5).max(10000),
});

export const broadcastCampaignUpdateSchema = broadcastCampaignSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Setidaknya satu field harus dikirim." }
);

export const broadcastSendSchema = z.object({
  force: z.boolean().optional(),
});

export type BroadcastChannelInput = z.infer<typeof broadcastChannelSchema>;
export type BroadcastProviderInput = z.infer<typeof broadcastProviderSchema>;
export type BroadcastConnectionModeInput = z.infer<typeof broadcastConnectionModeSchema>;
export type BroadcastConnectionCreateInput = z.infer<typeof broadcastConnectionCreateSchema>;
export type BroadcastConnectionUpdateInput = z.infer<typeof broadcastConnectionUpdateSchema>;
export type BroadcastContactInput = z.infer<typeof broadcastContactSchema>;
export type BroadcastContactUpdateInput = z.infer<typeof broadcastContactUpdateSchema>;
export type WhatsappQuickConnectInput = z.infer<typeof whatsappQuickConnectSchema>;
export type BroadcastPairingInput = z.infer<typeof broadcastPairingSchema>;
export type BroadcastCampaignInput = z.infer<typeof broadcastCampaignSchema>;
export type BroadcastCampaignUpdateInput = z.infer<typeof broadcastCampaignUpdateSchema>;
export type BroadcastSendInput = z.infer<typeof broadcastSendSchema>;
