import { z } from "zod";

// ============== Campaign Schemas ==============

export const marketingCampaignStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "SENT",
  "PARTIAL",
  "FAILED",
  "CANCELLED",
]);

export const marketingChannelSchema = z.enum([
  "EMAIL",
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "SMS",
]);

export const marketingAudienceTypeSchema = z.enum([
  "ALL_CONTACTS",
  "SUBSCRIBERS",
  "TAGGED",
  "BROADCAST_LIST",
]);

export const marketingCampaignCreateSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(1000).optional().nullable(),
  channel: marketingChannelSchema,
  status: marketingCampaignStatusSchema.default("DRAFT"),
  audienceType: marketingAudienceTypeSchema.default("ALL_CONTACTS"),
  audienceFilter: z.object({
    tags: z.array(z.string()).optional(),
    broadcastListId: z.string().optional(),
    minEngagement: z.number().optional(),
  }).optional(),
  subject: z.string().max(200).optional().nullable(),
  content: z.string().min(5).max(50000),
  templateId: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  connectionId: z.string().optional().nullable(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  utmParams: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
  }).optional(),
});

export const marketingCampaignUpdateSchema = marketingCampaignCreateSchema.partial().extend({
  status: marketingCampaignStatusSchema.optional(),
});

export const marketingCampaignSendSchema = z.object({
  force: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

// ============== Contact Schemas ==============

export const marketingContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160).optional().nullable().or(z.literal("")),
  phone: z.string().max(30).optional().nullable().or(z.literal("")),
  whatsapp: z.string().max(30).optional().nullable().or(z.literal("")),
  instagram: z.string().max(60).optional().nullable().or(z.literal("")),
  facebook: z.string().max(60).optional().nullable().or(z.literal("")),
  telegram: z.string().max(60).optional().nullable().or(z.literal("")),
  preferredChannel: marketingChannelSchema.optional().nullable(),
  tags: z.array(z.string().min(1).max(60)).max(30).optional(),
  company: z.string().max(200).optional().nullable().or(z.literal("")),
  position: z.string().max(120).optional().nullable().or(z.literal("")),
  notes: z.string().max(2000).optional().nullable().or(z.literal("")),
  source: z.string().max(100).optional().nullable().or(z.literal("")),
  isSubscribed: z.boolean().default(true),
});

export const marketingContactUpdateSchema = marketingContactSchema.partial().extend({
  isSubscribed: z.boolean().optional(),
});

export const marketingContactImportSchema = z.object({
  contacts: z.array(z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(160).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    whatsapp: z.string().max(30).optional().nullable(),
    tags: z.array(z.string()).max(30).optional(),
    company: z.string().max(200).optional().nullable(),
    source: z.string().max(100).optional().nullable(),
  })).min(1).max(10000),
  duplicateHandling: z.enum(["SKIP", "UPDATE", "OVERWRITE"]).default("SKIP"),
  tags: z.array(z.string()).max(30).optional(),
});

// ============== Template Schemas ==============

export const marketingTemplateTypeSchema = z.enum([
  "EMAIL",
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "SMS",
]);

export const marketingTemplateSchema = z.object({
  name: z.string().min(3).max(120),
  type: marketingTemplateTypeSchema,
  subject: z.string().max(200).optional().nullable(),
  content: z.string().min(5).max(50000),
  thumbnailUrl: z.string().url().optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  isPublic: z.boolean().default(false),
  variables: z.array(z.object({
    name: z.string().min(1).max(60),
    description: z.string().max(200).optional(),
    required: z.boolean().default(true),
  })).max(50).optional(),
});

export const marketingTemplateUpdateSchema = marketingTemplateSchema.partial();

// ============== Offer Schemas ==============

export const marketingOfferTypeSchema = z.enum([
  "DISCOUNT",
  "PROMO",
  "BUNDLE",
  "FREE_TRIAL",
  "SPECIAL_PRICE",
]);

export const marketingOfferStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "EXPIRED",
  "PAUSED",
]);

export const marketingOfferSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional().nullable(),
  type: marketingOfferTypeSchema,
  status: marketingOfferStatusSchema.default("DRAFT"),
  code: z.string().min(3).max(60).optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM"]).optional(),
  discountValue: z.number().min(0).optional().nullable(),
  minPurchase: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  usedCount: z.number().int().min(0).default(0),
  targetAudience: z.enum(["ALL", "NEW_CUSTOMERS", "EXISTING_CUSTOMERS", "TAGGED"]).default("ALL"),
  audienceTags: z.array(z.string()).max(30).optional(),
  terms: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  ctaText: z.string().max(60).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
});

export const marketingOfferUpdateSchema = marketingOfferSchema.partial();

// ============== Broadcast List Schemas ==============

export const marketingBroadcastListSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().min(1).max(60)).max(30).optional(),
  isPublic: z.boolean().default(true),
});

export const marketingBroadcastListUpdateSchema = marketingBroadcastListSchema.partial();

export const marketingBroadcastListAddContactsSchema = z.object({
  contactIds: z.array(z.string()).min(1).max(10000),
  mode: z.enum(["ADD", "REMOVE"]).default("ADD"),
});

// ============== Analytics Schemas ==============

export const marketingAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  channel: marketingChannelSchema.optional(),
  campaignId: z.string().optional(),
  groupBy: z.enum(["day", "week", "month", "channel", "campaign"]).default("day"),
});

// ============== Type Exports ==============

export type MarketingCampaignStatus = z.infer<typeof marketingCampaignStatusSchema>;
export type MarketingChannel = z.infer<typeof marketingChannelSchema>;
export type MarketingAudienceType = z.infer<typeof marketingAudienceTypeSchema>;
export type MarketingCampaignInput = z.infer<typeof marketingCampaignCreateSchema>;
export type MarketingCampaignUpdateInput = z.infer<typeof marketingCampaignUpdateSchema>;
export type MarketingCampaignSendInput = z.infer<typeof marketingCampaignSendSchema>;

export type MarketingContactInput = z.infer<typeof marketingContactSchema>;
export type MarketingContactUpdateInput = z.infer<typeof marketingContactUpdateSchema>;
export type MarketingContactImportInput = z.infer<typeof marketingContactImportSchema>;

export type MarketingTemplateType = z.infer<typeof marketingTemplateTypeSchema>;
export type MarketingTemplateInput = z.infer<typeof marketingTemplateSchema>;
export type MarketingTemplateUpdateInput = z.infer<typeof marketingTemplateUpdateSchema>;

export type MarketingOfferType = z.infer<typeof marketingOfferTypeSchema>;
export type MarketingOfferStatus = z.infer<typeof marketingOfferStatusSchema>;
export type MarketingOfferInput = z.infer<typeof marketingOfferSchema>;
export type MarketingOfferUpdateInput = z.infer<typeof marketingOfferUpdateSchema>;

export type MarketingBroadcastListInput = z.infer<typeof marketingBroadcastListSchema>;
export type MarketingBroadcastListUpdateInput = z.infer<typeof marketingBroadcastListUpdateSchema>;
export type MarketingBroadcastListAddContactsInput = z.infer<typeof marketingBroadcastListAddContactsSchema>;

export type MarketingAnalyticsQuery = z.infer<typeof marketingAnalyticsQuerySchema>;
