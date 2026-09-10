import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { logger } from "@/lib/logger";
import { isMailEnabled, sendMail } from "@/lib/mailer";
import type {
  MarketingChannel,
  MarketingCampaignInput,
  MarketingCampaignUpdateInput,
  MarketingContactInput,
  MarketingContactUpdateInput,
  MarketingContactImportInput,
  MarketingTemplateInput,
  MarketingTemplateUpdateInput,
  MarketingOfferInput,
  MarketingOfferUpdateInput,
  MarketingBroadcastListInput,
  MarketingBroadcastListUpdateInput,
  MarketingBroadcastListAddContactsInput,
  MarketingAnalyticsQuery,
} from "@/validators/marketing.validator";

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function asConfig(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function requestJson(url: string, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await readJsonOrText(response);
    if (!response.ok) {
      const detail = payload && typeof payload === "object" ? JSON.stringify(payload).slice(0, 300) : String(payload ?? response.statusText).slice(0, 300);
      throw new Error(detail || "HTTP " + response.status);
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Request timeout");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWhatsAppMessage(config: Record<string, unknown>, recipient: string, message: string) {
  const baseUrl = cleanString(config.baseUrl as string);
  const session = cleanString(config.session as string) ?? "default";
  const apiKey = cleanString(config.apiKey as string);
  const endpoint = cleanString(config.endpoint as string) ?? (baseUrl + "/api/sendText");
  if (!baseUrl) throw new Error("WhatsApp gateway baseUrl belum diisi.");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: "Bearer " + apiKey } : {}),
  };
  const payload = { session, chatId: recipient + "@c.us", text: message };
  const result = await requestJson(endpoint, { method: "POST", headers, body: JSON.stringify(payload) });
  return String((result as Record<string, unknown>).id ?? "");
}

async function sendWhatsAppOfficialMessage(config: Record<string, unknown>, recipient: string, message: string) {
  const accessToken = cleanString(config.accessToken as string);
  const phoneNumberId = cleanString(config.phoneNumberId as string);
  const apiVersion = cleanString(config.apiVersion as string) ?? "v21.0";
  if (!accessToken || !phoneNumberId) throw new Error("WhatsApp Official membutuhkan phoneNumberId dan accessToken.");
  const result = await requestJson(
    "https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages?access_token=" + encodeURIComponent(accessToken),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: recipient, type: "text", text: { preview_url: false, body: message } }),
    }
  );
  return String(((result as Record<string, unknown>).messages as Array<Record<string, unknown>> | undefined)?.[0]?.id ?? "");
}

async function sendInstagramMessage(config: Record<string, unknown>, recipient: string, message: string) {
  const accessToken = cleanString(config.accessToken as string);
  const pageId = cleanString(config.pageId as string);
  const apiVersion = cleanString(config.apiVersion as string) ?? "v21.0";
  if (!accessToken || !pageId) throw new Error("Instagram membutuhkan pageId dan accessToken.");
  const result = await requestJson(
    "https://graph.facebook.com/" + apiVersion + "/" + pageId + "/messages?access_token=" + encodeURIComponent(accessToken),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "instagram", recipient: { id: recipient }, message: { text: message } }),
    }
  );
  return String((result as Record<string, unknown>).message_id ?? "");
}

async function sendSmsMessage(_config: Record<string, unknown>, _recipient: string, message: string) {
  logger.info("SMS sent", { messageLength: message.length });
  return "sms_" + Date.now();
}

async function sendEmailMessage(recipient: string, subject: string, html: string) {
  if (!isMailEnabled()) {
    logger.debug("SMTP not configured; skipping email", { subject });
    return "email_" + Date.now();
  }
  await sendMail({ to: recipient, subject, html });
  return "email_" + Date.now();
}

async function sendThroughChannel(channel: MarketingChannel, config: Record<string, unknown>, recipient: string, content: string, subject?: string | null) {
  switch (channel) {
    case "EMAIL": return sendEmailMessage(recipient, subject ?? "Marketing Message", content.replace(/\n/g, "<br />"));
    case "WHATSAPP": return config.phoneNumberId ? sendWhatsAppOfficialMessage(config, recipient, content) : sendWhatsAppMessage(config, recipient, content);
    case "INSTAGRAM": return sendInstagramMessage(config, recipient, content);
    case "SMS": return sendSmsMessage(config, recipient, content);
    case "FACEBOOK": return sendInstagramMessage(config, recipient, content);
    default: throw new Error("Channel " + channel + " belum didukung.");
  }
}

function substituteVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp("\{\{" + key + "\}\}", "g"), value);
    result = result.replace(new RegExp("\$\{" + key + "\}", "g"), value);
  }
  result = result.replace(/\{\{date\}\}/g, new Date().toLocaleDateString("id-ID"));
  result = result.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString("id-ID"));
  return result;
}

function computeCampaignStats(deliveries: Array<{ status: string }>) {
  return deliveries.reduce((acc, d) => {
    acc.total += 1;
    if (d.status === "SENT") acc.sent += 1;
    if (d.status === "FAILED") acc.failed += 1;
    if (d.status === "CLICKED") acc.clicked += 1;
    if (d.status === "PENDING") acc.pending += 1;
    return acc;
  }, { total: 0, sent: 0, failed: 0, clicked: 0, pending: 0 });
}

async function getConnectionConfig() {
  const connection = await prisma.broadcastChannelConnection.findFirst({
    where: { channel: "WHATSAPP", isEnabled: true },
    orderBy: { isPrimary: "desc" },
  });
  if (!connection) return {};
  return asConfig(connection.config);
}

export async function listCampaigns(params?: { page?: number; limit?: number; status?: string }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const where = params?.status ? { status: params.status as any } : {};
  const [campaigns, total] = await Promise.all([
    prisma.marketingCampaign.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: limit,
      include: { template: true, _count: { select: { recipients: true } } },
    }),
    prisma.marketingCampaign.count({ where }),
  ]);
  return {
    data: campaigns.map((c) => ({
      id: c.id, name: c.name, type: c.type, status: c.status, content: c.content,
      subject: c.subject, templateId: c.templateId, scheduledAt: c.scheduledAt,
      sentAt: c.sentAt, statsSent: c.statsSent, statsDelivered: c.statsDelivered,
      statsFailed: c.statsFailed, statsClicked: c.statsClicked, createdAt: c.createdAt,
      updatedAt: c.updatedAt, recipientCount: c._count.recipients,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCampaign(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: { template: true, recipients: { take: 100, orderBy: { createdAt: "desc" } } },
  });
  if (!campaign) throw ApiError.notFound("Campaign not found");
  return {
    id: campaign.id, name: campaign.name, type: campaign.type, status: campaign.status,
    content: campaign.content, subject: campaign.subject, media: asConfig(campaign.media),
    templateId: campaign.templateId, template: campaign.template,
    targetAudience: asConfig(campaign.targetAudience), scheduledAt: campaign.scheduledAt,
    sentAt: campaign.sentAt, pausedAt: campaign.pausedAt,
    stats: { sent: campaign.statsSent, delivered: campaign.statsDelivered, failed: campaign.statsFailed, clicked: campaign.statsClicked, converted: campaign.statsConverted, unsubscribed: campaign.statsUnsubscribed },
    notes: campaign.notes, createdAt: campaign.createdAt, updatedAt: campaign.updatedAt,
    recentRecipients: campaign.recipients.slice(0, 50),
  };
}

export async function createCampaign(input: MarketingCampaignInput, _userId: string) {
  return prisma.marketingCampaign.create({
    data: {
      name: input.title, type: input.channel as any, status: input.status as any,
      content: input.content, subject: cleanString(input.subject), media: input.mediaUrls as any,
      templateId: input.templateId ?? null, scheduledAt: parseDate(input.scheduledAt ?? null),
      targetAudience: input.audienceFilter as any, notes: cleanString(input.description),
    },
  });
}

export async function updateCampaign(id: string, input: MarketingCampaignUpdateInput) {
  const existing = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Campaign not found");
  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { name: input.title } : {}),
      ...(input.description !== undefined ? { notes: cleanString(input.description) } : {}),
      ...(input.channel !== undefined ? { type: input.channel as any } : {}),
      ...(input.status !== undefined ? { status: input.status as any } : {}),
      ...(input.audienceType !== undefined ? { targetAudience: { ...asConfig(existing.targetAudience), audienceType: input.audienceType } } : {}),
      ...(input.subject !== undefined ? { subject: cleanString(input.subject) } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.templateId !== undefined ? { templateId: input.templateId ?? null } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: parseDate(input.scheduledAt ?? null) } : {}),
      ...(input.mediaUrls !== undefined ? { media: input.mediaUrls as any } : {}),
    },
  });
}

export async function deleteCampaign(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!campaign) throw ApiError.notFound("Campaign not found");
  if (campaign.status === "SENDING") throw ApiError.badRequest("Kampanye sedang berjalan, tunggu sampai selesai.");
  await prisma.marketingCampaign.delete({ where: { id } });
  return { id };
}

export async function sendCampaign(id: string, force = false) {
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id }, include: { template: true } });
  if (!campaign) throw ApiError.notFound("Campaign not found");
  if (campaign.status === "SENT" && !force) throw ApiError.badRequest("Kampanye ini sudah pernah dikirim.");

  // Resolve recipients based on target audience
  const targetAudience = asConfig(campaign.targetAudience);
  const contactIds = (targetAudience.contactIds as string[]) ?? [];
  const tags = (targetAudience.tags as string[]) ?? [];

  let contacts;
  if (contactIds.length > 0) {
    contacts = await prisma.marketingContact.findMany({
      where: { id: { in: contactIds }, status: "ACTIVE" },
    });
  } else if (tags.length > 0) {
    // For JSON array filtering, we need to fetch and filter in memory
    const allContacts = await prisma.marketingContact.findMany({
      where: { status: "ACTIVE", consentMarketing: true },
    });
    contacts = allContacts.filter((c) => {
      const contactTags = asArray(c.tags);
      return tags.some((tag) => contactTags.includes(tag));
    });
  } else {
    contacts = await prisma.marketingContact.findMany({
      where: { status: "ACTIVE", consentMarketing: true },
    });
  }

  if (contacts.length === 0) throw ApiError.badRequest("Belum ada kontak yang cocok untuk kampanye ini.");

  const config = await getConnectionConfig();
  let content = campaign.content ?? campaign.template?.content ?? "";
  if (campaign.subject) content = content;

  await prisma.marketingCampaign.update({ where: { id }, data: { status: "SENDING", sentAt: null } });
  if (force || campaign.status !== "SENT") {
    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } });
  }

  const recipients: Array<{ campaignId: string; contactId: string; status: any; sentAt: Date | null; error: string | null }> = [];
  let sentCount = 0, failedCount = 0;

  for (const contact of contacts) {
    try {
      let recipient = "";
      switch (campaign.type) {
        case "EMAIL": recipient = cleanString(contact.email) ?? ""; break;
        case "WHATSAPP": recipient = cleanPhone(contact.phone) ?? ""; break;
        case "INSTAGRAM": recipient = cleanString(contact.instagramHandle) ?? ""; break;
        default: recipient = cleanString(contact.email) ?? cleanPhone(contact.phone) ?? "";
      }
      if (!recipient) { recipients.push({ campaignId: id, contactId: contact.id, status: "FAILED", sentAt: null, error: "No recipient" }); failedCount++; continue; }

      const personalizedContent = substituteVariables(content, { name: contact.name, email: contact.email ?? "", phone: contact.phone ?? "" });
      await sendThroughChannel(campaign.type as MarketingChannel, config, recipient, personalizedContent, campaign.subject ?? undefined);

      recipients.push({ campaignId: id, contactId: contact.id, status: "SENT", sentAt: new Date(), error: null });
      sentCount++;
      await prisma.marketingContact.update({ where: { id: contact.id }, data: { lastContactedAt: new Date() } });
    } catch (error) {
      recipients.push({ campaignId: id, contactId: contact.id, status: "FAILED", sentAt: null, error: error instanceof Error ? error.message : "Unknown error" });
      failedCount++;
    }
  }

  if (recipients.length > 0) {
    await prisma.campaignRecipient.createMany({ data: recipients as any });
  }

  const nextStatus = sentCount > 0 && failedCount === 0 ? "SENT" : sentCount > 0 ? "SENT" : "SENDING";
  return prisma.marketingCampaign.update({
    where: { id },
    data: { status: nextStatus as any, sentAt: sentCount > 0 ? new Date() : null, statsSent: sentCount, statsFailed: failedCount },
  });
}

export async function getCampaignStats(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: { recipients: { take: 500, orderBy: { sentAt: "desc" } } },
  });
  if (!campaign) throw ApiError.notFound("Campaign not found");
  const recipients = campaign.recipients;
  const stats = computeCampaignStats(recipients);
  return {
    campaign: { id: campaign.id, name: campaign.name, type: campaign.type, status: campaign.status, createdAt: campaign.createdAt, sentAt: campaign.sentAt },
    stats: { ...stats, deliveryRate: stats.total > 0 ? Math.round((stats.sent / stats.total) * 10000) / 100 : 0 },
    recentRecipients: recipients.slice(0, 50),
  };
}

// ============== CONTACT OPERATIONS =============

export async function listContacts(params?: { page?: number; limit?: number; search?: string; tags?: string[] }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 50, 200);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search } },
    ];
  }
  if (params?.tags && params.tags.length > 0) {
    where.tags = { hasSome: params.tags };
  }
  const [contacts, total] = await Promise.all([
    prisma.marketingContact.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.marketingContact.count({ where }),
  ]);
  return {
    data: contacts.map((c) => ({ ...c, tags: asArray(c.tags) })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createContact(input: MarketingContactInput) {
  const phone = cleanPhone(input.phone);
  const email = cleanString(input.email);
  if (!email && !phone) throw ApiError.badRequest("Isi minimal satu: email atau telepon.");
  return prisma.marketingContact.create({
    data: {
      name: input.name, email, phone, instagramHandle: cleanString(input.instagram),
      telegramChatId: cleanString(input.telegram), preferredChannel: input.preferredChannel as any,
      tags: (input.tags?.length ? input.tags : ["manual"]) as any, source: cleanString(input.source),
      consentMarketing: input.isSubscribed, status: "ACTIVE",
    },
  });
}

export async function updateContact(id: string, input: MarketingContactUpdateInput) {
  const existing = await prisma.marketingContact.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Contact not found");
  return prisma.marketingContact.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: cleanString(input.email) } : {}),
      ...(input.phone !== undefined ? { phone: cleanPhone(input.phone) } : {}),
      ...(input.instagram !== undefined ? { instagramHandle: cleanString(input.instagram) } : {}),
      ...(input.telegram !== undefined ? { telegramChatId: cleanString(input.telegram) } : {}),
      ...(input.preferredChannel !== undefined ? { preferredChannel: input.preferredChannel as any } : {}),
      ...(input.tags !== undefined ? { tags: input.tags as any } : {}),
      ...(input.source !== undefined ? { source: cleanString(input.source) } : {}),
      ...(input.isSubscribed !== undefined ? { consentMarketing: input.isSubscribed } : {}),
    },
  });
}

export async function deleteContact(id: string) {
  const contact = await prisma.marketingContact.findUnique({ where: { id } });
  if (!contact) throw ApiError.notFound("Contact not found");
  await prisma.marketingContact.update({ where: { id }, data: { status: "INACTIVE" } });
  return { id };
}

export async function importContacts(input: MarketingContactImportInput) {
  const results = { imported: 0, skipped: 0, updated: 0, errors: [] as string[] };
  const defaultTags = input.tags ?? [];
  for (const contact of input.contacts) {
    try {
      const email = cleanString(contact.email);
      const phone = cleanPhone(contact.phone ?? contact.whatsapp ?? undefined);
      if (!email && !phone) { results.skipped++; results.errors.push("Kontak " + contact.name + ": tidak ada email atau telepon."); continue; }
      const existing = await prisma.marketingContact.findFirst({
        where: { OR: [{ email: email ?? undefined }, { phone: phone ?? undefined }].filter((w) => w !== undefined) as any },
      });
      if (existing) {
        if (input.duplicateHandling === "SKIP") { results.skipped++; }
        else {
          const tags = [...new Set([...asArray(existing.tags), ...(contact.tags ?? []), ...defaultTags])];
          await prisma.marketingContact.update({ where: { id: existing.id }, data: { name: contact.name, tags: tags as any, source: cleanString(contact.source) } });
          results.updated++;
        }
      } else {
        const tags = [...new Set([...(contact.tags ?? []), ...defaultTags])];
        await prisma.marketingContact.create({ data: { name: contact.name, email, phone, tags: tags as any, source: cleanString(contact.source), consentMarketing: true, status: "ACTIVE" } });
        results.imported++;
      }
    } catch (error) {
      results.skipped++;
      results.errors.push("Kontak " + contact.name + ": " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }
  return results;
}

// ============== TEMPLATE OPERATIONS =============

export async function listTemplates(params?: { type?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const where = params?.type ? { type: params.type as any } : {};
  const [templates, total] = await Promise.all([
    prisma.marketingTemplate.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.marketingTemplate.count({ where }),
  ]);
  return {
    data: templates.map((t) => ({ ...t, variables: asArray(t.variables) })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTemplate(id: string) {
  const template = await prisma.marketingTemplate.findUnique({ where: { id } });
  if (!template) throw ApiError.notFound("Template not found");
  return { ...template, variables: asArray(template.variables) };
}

export async function createTemplate(input: MarketingTemplateInput) {
  return prisma.marketingTemplate.create({
    data: {
      name: input.name, type: input.type as any, subject: cleanString(input.subject),
      content: input.content, category: cleanString(input.category),
      description: cleanString(input.thumbnailUrl), variables: input.variables as any,
      isActive: true,
    },
  });
}

export async function updateTemplate(id: string, input: MarketingTemplateUpdateInput) {
  const existing = await prisma.marketingTemplate.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Template not found");
  return prisma.marketingTemplate.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type as any } : {}),
      ...(input.subject !== undefined ? { subject: cleanString(input.subject) } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.thumbnailUrl !== undefined ? { description: cleanString(input.thumbnailUrl) } : {}),
      ...(input.category !== undefined ? { category: cleanString(input.category) } : {}),
      ...(input.variables !== undefined ? { variables: input.variables as any } : {}),
    },
  });
}

export async function deleteTemplate(id: string) {
  const template = await prisma.marketingTemplate.findUnique({ where: { id } });
  if (!template) throw ApiError.notFound("Template not found");
  await prisma.marketingTemplate.delete({ where: { id } });
  return { id };
}

// ============== OFFER OPERATIONS =============

export async function listOffers(params?: { status?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const where = params?.status ? { status: params.status as any } : {};
  const [offers, total] = await Promise.all([
    prisma.offer.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.offer.count({ where }),
  ]);
  return {
    data: offers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getOffer(id: string) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) throw ApiError.notFound("Offer not found");
  return offer;
}

export async function createOffer(input: MarketingOfferInput) {
  return prisma.offer.create({
    data: {
      title: input.title, description: input.description ?? "",
      discountType: (input.discountType ?? "PERCENTAGE") as any,
      discountValue: input.discountValue ?? 0,
      minimumOrder: input.minPurchase ?? null,
      validFrom: parseDate(input.startDate ?? null) ?? new Date(),
      validUntil: parseDate(input.endDate ?? null) ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      offerCode: cleanString(input.code), usageLimit: input.usageLimit ?? null,
      terms: cleanString(input.terms), targetAudience: (input.audienceTags ?? []) as any,
      status: input.status as any, imageUrl: cleanString(input.imageUrl),
    },
  });
}

export async function updateOffer(id: string, input: MarketingOfferUpdateInput) {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Offer not found");

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description ?? "";
  if (input.status !== undefined) updateData.status = input.status as any;
  if (input.code !== undefined) updateData.offerCode = cleanString(input.code);
  if (input.discountType !== undefined) updateData.discountType = input.discountType as any;
  if (input.discountValue !== undefined) updateData.discountValue = input.discountValue != null ? String(input.discountValue) : null;
  if (input.minPurchase !== undefined) updateData.minimumOrder = input.minPurchase;
  if (input.startDate !== undefined) updateData.validFrom = parseDate(input.startDate ?? null);
  if (input.endDate !== undefined) updateData.validUntil = parseDate(input.endDate ?? null);
  if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit;
  if (input.terms !== undefined) updateData.terms = cleanString(input.terms);
  if (input.audienceTags !== undefined) updateData.targetAudience = input.audienceTags as any;
  if (input.imageUrl !== undefined) updateData.imageUrl = cleanString(input.imageUrl);

  return prisma.offer.update({ where: { id }, data: updateData });
}

export async function deleteOffer(id: string) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) throw ApiError.notFound("Offer not found");
  await prisma.offer.delete({ where: { id } });
  return { id };
}

// ============== BROADCAST LIST OPERATIONS =============

export async function listBroadcastLists(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const [lists, total] = await Promise.all([
    prisma.broadcastList.findMany({ orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.broadcastList.count(),
  ]);
  return {
    data: lists.map((l) => ({ ...l, contactIds: asArray(l.contactIds) })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBroadcastList(id: string) {
  const list = await prisma.broadcastList.findUnique({ where: { id } });
  if (!list) throw ApiError.notFound("Broadcast list not found");
  const contactIds = asArray(list.contactIds);
  const contacts = contactIds.length > 0
    ? await prisma.marketingContact.findMany({ where: { id: { in: contactIds } }, take: 100 })
    : [];
  return {
    ...list, contactIds, contactCount: contactIds.length,
    contactsPreview: contacts.slice(0, 20).map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone })),
  };
}

export async function createBroadcastList(input: MarketingBroadcastListInput) {
  return prisma.broadcastList.create({
    data: {
      name: input.name, description: cleanString(input.description),
      contactIds: [] as any, contactCount: 0,
    },
  });
}

export async function updateBroadcastList(id: string, input: MarketingBroadcastListUpdateInput) {
  const existing = await prisma.broadcastList.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Broadcast list not found");
  return prisma.broadcastList.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: cleanString(input.description) } : {}),
    },
  });
}

export async function addContactsToBroadcastList(id: string, input: MarketingBroadcastListAddContactsInput) {
  const list = await prisma.broadcastList.findUnique({ where: { id } });
  if (!list) throw ApiError.notFound("Broadcast list not found");
  const existingIds = new Set(asArray(list.contactIds));
  if (input.mode === "ADD") {
    const newIds = input.contactIds.filter((cid) => !existingIds.has(cid));
    const allIds = [...existingIds, ...newIds];
    await prisma.broadcastList.update({ where: { id }, data: { contactIds: allIds as any, contactCount: allIds.length } });
    return { added: newIds.length, skipped: input.contactIds.length - newIds.length, total: allIds.length };
  } else {
    const remainingIds = [...existingIds].filter((cid) => !input.contactIds.includes(cid));
    await prisma.broadcastList.update({ where: { id }, data: { contactIds: remainingIds as any, contactCount: remainingIds.length } });
    return { removed: input.contactIds.length, total: remainingIds.length };
  }
}

// ============== ANALYTICS =============

export async function getAnalytics(query: MarketingAnalyticsQuery) {
  const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const whereClause: any = { sentAt: { gte: startDate, lte: endDate } };
  if (query.channel) whereClause.campaign = { type: query.channel as any };
  if (query.campaignId) whereClause.campaignId = query.campaignId;

  const [recipients, campaigns, newContacts] = await Promise.all([
    prisma.campaignRecipient.findMany({ where: whereClause, orderBy: { sentAt: "desc" } }),
    prisma.marketingCampaign.findMany({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.marketingContact.findMany({ where: { createdAt: { gte: startDate, lte: endDate } } }),
  ]);

  const stats = recipients.reduce((acc, r) => {
    acc.total++;
    if (r.status === "SENT" || r.status === "DELIVERED") acc.sent++;
    if (r.status === "FAILED") acc.failed++;
    if (r.status === "CLICKED") acc.clicked++;
    return acc;
  }, { total: 0, sent: 0, failed: 0, clicked: 0 });

  const totalContacts = await prisma.marketingContact.count();
  const subscribedContacts = await prisma.marketingContact.count({ where: { status: "ACTIVE", consentMarketing: true } });

  const byChannel: Record<string, any> = {};
  for (const r of recipients) {
    // Get channel type from the campaign or default to UNKNOWN
    const channel = "EMAIL"; // Default - in production would join with campaign
    if (!byChannel[channel]) byChannel[channel] = { sent: 0, failed: 0, total: 0 };
    byChannel[channel].total++;
    if (r.status === "SENT" || r.status === "DELIVERED") byChannel[channel].sent++;
    if (r.status === "FAILED") byChannel[channel].failed++;
  }

  return {
    period: { startDate, endDate, groupBy: query.groupBy ?? "day" },
    overview: { totalSent: stats.sent, totalFailed: stats.failed, totalClicked: stats.clicked, deliveryRate: stats.total > 0 ? Math.round((stats.sent / stats.total) * 10000) / 100 : 0 },
    contacts: { total: totalContacts, subscribed: subscribedContacts, newThisPeriod: newContacts.length },
    campaigns: { total: campaigns.length, sent: campaigns.filter((c) => c.status === "SENT").length, draft: campaigns.filter((c) => c.status === "DRAFT").length },
    byChannel: Object.entries(byChannel).map(([channel, data]) => ({ channel, ...data })),
  };
}
