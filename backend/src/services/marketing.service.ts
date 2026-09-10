import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { logger } from "@/lib/logger";
import { isMailEnabled, sendMail } from "@/lib/mailer";
import type {
  MarketingChannel,
  MarketingCampaignStatus,
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

// ============== Utility Functions =============

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
      throw new Error(detail || `HTTP ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}


// ============== WhatsApp Integration =============

async function sendWhatsAppMessage(config: Record<string, unknown>, recipient: string, message: string) {
  const baseUrl = cleanString(config.baseUrl as string);
  const session = cleanString(config.session as string) ?? "default";
  const apiKey = cleanString(config.apiKey as string);
  const endpoint = cleanString(config.endpoint as string) ?? `${baseUrl}/api/sendText`;

  if (!baseUrl) throw new Error("WhatsApp gateway baseUrl belum diisi.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
  };

  const payload = { session, chatId: `${recipient}@c.us`, text: message };

  const result = await requestJson(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return String((result as Record<string, unknown>).id ?? "");
}

async function sendWhatsAppOfficialMessage(
  config: Record<string, unknown>,
  recipient: string,
  message: string
) {
  const accessToken = cleanString(config.accessToken as string);
  const phoneNumberId = cleanString(config.phoneNumberId as string);
  const apiVersion = cleanString(config.apiVersion as string) ?? "v21.0";

  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Official membutuhkan phoneNumberId dan accessToken.");
  }

  const result = await requestJson(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    }
  );

  return String(((result as Record<string, unknown>).messages as Array<Record<string, unknown>> | undefined)?.[0]?.id ?? "");
}


// ============== Instagram Integration =============

async function sendInstagramMessage(
  config: Record<string, unknown>,
  recipient: string,
  message: string
) {
  const accessToken = cleanString(config.accessToken as string);
  const pageId = cleanString(config.pageId as string);
  const apiVersion = cleanString(config.apiVersion as string) ?? "v21.0";

  if (!accessToken || !pageId) {
    throw new Error("Instagram membutuhkan pageId dan accessToken.");
  }

  const result = await requestJson(
    `https://graph.facebook.com/${apiVersion}/${pageId}/messages?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "instagram",
        recipient: { id: recipient },
        message: { text: message },
      }),
    }
  );

  return String((result as Record<string, unknown>).message_id ?? "");
}

// ============== SMS Integration (Mock) =============

async function sendSmsMessage(config: Record<string, unknown>, recipient: string, message: string) {
  // Mock SMS sending - implement with actual SMS provider like Twilio
  logger.info("SMS sent", { recipient, messageLength: message.length });
  
  // Example Twilio integration:
  // const accountSid = config.accountSid;
  // const authToken = config.authToken;
  // const fromNumber = config.fromNumber;
  // if (!accountSid || !authToken || !fromNumber) {
  //   throw new Error("SMS configuration incomplete.");
  // }
  // const response = await requestJson(
  //   `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  //   {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
  //       "Content-Type": "application/x-www-form-urlencoded",
  //     },
  //     body: new URLSearchParams({ To: recipient, From: fromNumber, Body: message }).toString(),
  //   }
  // );
  // return String((response as Record<string, unknown>).sid ?? "");

  return `sms_${Date.now()}`;
}


// ============== Email Sending =============

async function sendEmailMessage(recipient: string, subject: string, html: string) {
  if (!isMailEnabled()) {
    logger.debug("SMTP not configured; skipping email", { subject });
    return `email_${Date.now()}`;
  }

  await sendMail({
    to: recipient,
    subject,
    html,
  });

  return `email_${Date.now()}`;
}

// ============== Send Through Channel =============

async function sendThroughChannel(
  channel: MarketingChannel,
  config: Record<string, unknown>,
  recipient: string,
  content: string,
  subject?: string | null
) {
  switch (channel) {
    case "EMAIL":
      return sendEmailMessage(recipient, subject ?? "Marketing Message", content.replace(/\n/g, "<br />"));
    case "WHATSAPP":
      // Check if using official WhatsApp API or gateway
      if (config.phoneNumberId) {
        return sendWhatsAppOfficialMessage(config, recipient, content);
      }
      return sendWhatsAppMessage(config, recipient, content);
    case "INSTAGRAM":
      return sendInstagramMessage(config, recipient, content);
    case "SMS":
      return sendSmsMessage(config, recipient, content);
    case "FACEBOOK":
      // Facebook uses same integration as Instagram
      return sendInstagramMessage(config, recipient, content);
    default:
      throw new Error(`Channel ${channel} belum didukung.`);
  }
}

// ============== Variable Substitution =============

function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
  }
  // Add default variables
  result = result.replace(/\{\{date\}\}/g, new Date().toLocaleDateString("id-ID"));
  result = result.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString("id-ID"));
  return result;
}

// ============== Campaign Stats =============

function computeCampaignStats(deliveries: Array<{ status: string }>) {
  return deliveries.reduce(
    (acc, delivery) => {
      acc.total += 1;
      if (delivery.status === "SENT") acc.sent += 1;
      if (delivery.status === "FAILED") acc.failed += 1;
      if (delivery.status === "SKIPPED") acc.skipped += 1;
      if (delivery.status === "PENDING") acc.pending += 1;
      return acc;
    },
    { total: 0, sent: 0, failed: 0, skipped: 0, pending: 0 }
  );
}

// ============== Resolve Contacts for Campaign =============

async function resolveContactsForCampaign(campaign: {
  channel: MarketingChannel;
  audienceType: string;
  audienceFilter: Prisma.JsonValue | null;
}) {
  const filter = asConfig(campaign.audienceFilter);
  const tagFilter = Array.isArray(filter.tags) ? filter.tags as string[] : [];

  let whereClause: any = { isSubscribed: true };

  if (campaign.audienceType === "SUBSCRIBERS") {
    whereClause.isSubscribed = true;
  }

  if (campaign.audienceType === "TAGGED" && tagFilter.length > 0) {
    whereClause.tags = { hasSome: tagFilter };
  }

  const contacts = await prisma.marketingContact.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  return contacts
    .map((contact) => {
      let recipient: string | null = null;
      switch (campaign.channel) {
        case "EMAIL":
          recipient = cleanString(contact.email);
          break;
        case "WHATSAPP":
        case "SMS":
          recipient = cleanPhone(contact.whatsapp || contact.phone);
          break;
        case "INSTAGRAM":
          recipient = cleanString(contact.instagram);
          break;
        case "FACEBOOK":
          recipient = cleanString(contact.facebook);
          break;
      }
      return { contactId: contact.id, recipient, contact };
    })
    .filter((item) => Boolean(item.recipient));
}

// ============== Get Connection Config =============

async function getConnectionConfig(connectionId: string | null | undefined) {
  if (!connectionId) return {};
  
  const connection = await prisma.broadcastChannelConnection.findUnique({
    where: { id: connectionId },
  });
  
  if (!connection) return {};
  return asConfig(connection.config);
}

// ============== CAMPAIGN OPERATIONS =============

export async function listCampaigns(params?: { page?: number; limit?: number; status?: string }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where = params?.status ? { status: params.status as MarketingCampaignStatus } : {};

  const [campaigns, total] = await Promise.all([
    prisma.marketingCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { deliveries: true } },
        deliveries: { select: { status: true } },
      },
    }),
    prisma.marketingCampaign.count({ where }),
  ]);

  return {
    data: campaigns.map((campaign) => ({
      ...campaign,
      stats: computeCampaignStats(campaign.deliveries),
      _count: undefined,
      deliveries: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCampaign(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      template: true,
      _count: { select: { deliveries: true } },
      deliveries: { select: { status: true }, take: 100 },
    },
  });

  if (!campaign) throw ApiError.notFound("Campaign not found");

  return {
    ...campaign,
    stats: computeCampaignStats(campaign.deliveries),
    _count: undefined,
    deliveries: undefined,
  };
}

export async function createCampaign(input: MarketingCampaignInput, userId: string) {
  return prisma.marketingCampaign.create({
    data: {
      title: input.title,
      description: cleanString(input.description),
      channel: input.channel,
      status: input.status,
      audienceType: input.audienceType,
      audienceFilter: input.audienceFilter as Prisma.InputJsonValue,
      subject: cleanString(input.subject),
      content: input.content,
      templateId: input.templateId ?? null,
      scheduledAt: parseDate(input.scheduledAt ?? null),
      connectionId: input.connectionId ?? null,
      mediaUrls: input.mediaUrls as Prisma.InputJsonValue,
      utmParams: input.utmParams as Prisma.InputJsonValue,
      createdById: userId,
    },
  });
}

export async function updateCampaign(id: string, input: MarketingCampaignUpdateInput) {
  const existing = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Campaign not found");

  if (existing.status === "SENT" && input.status !== undefined) {
    throw ApiError.badRequest("Kampanye yang sudah terkirim tidak dapat diubah.");
  }

  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: cleanString(input.description) } : {}),
      ...(input.channel !== undefined ? { channel: input.channel } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.audienceType !== undefined ? { audienceType: input.audienceType } : {}),
      ...(input.audienceFilter !== undefined ? { audienceFilter: input.audienceFilter as Prisma.InputJsonValue } : {}),
      ...(input.subject !== undefined ? { subject: cleanString(input.subject) } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.templateId !== undefined ? { templateId: input.templateId ?? null } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: parseDate(input.scheduledAt ?? null) } : {}),
      ...(input.connectionId !== undefined ? { connectionId: input.connectionId ?? null } : {}),
      ...(input.mediaUrls !== undefined ? { mediaUrls: input.mediaUrls as Prisma.InputJsonValue } : {}),
      ...(input.utmParams !== undefined ? { utmParams: input.utmParams as Prisma.InputJsonValue } : {}),
    },
  });
}

export async function deleteCampaign(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!campaign) throw ApiError.notFound("Campaign not found");

  if (campaign.status === "SENDING") {
    throw ApiError.badRequest("Kampanye sedang berjalan, tunggu sampai selesai.");
  }

  await prisma.marketingCampaign.delete({ where: { id } });
  return { id };
}


export async function sendCampaign(id: string, force = false) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!campaign) throw ApiError.notFound("Campaign not found");

  if (campaign.status === "SENT" && !force) {
    throw ApiError.badRequest("Kampanye ini sudah pernah dikirim.");
  }

  const contacts = await resolveContactsForCampaign(campaign);
  if (contacts.length === 0) {
    throw ApiError.badRequest("Belum ada kontak yang cocok untuk channel kampanye ini.");
  }

  // Get connection config
  const config = await getConnectionConfig(campaign.connectionId);

  // Prepare content with UTM
  let content = campaign.content;
  if (campaign.utmParams) {
    const utm = asConfig(campaign.utmParams);
    const utmParams = new URLSearchParams({
      ...(utm.source ? { utm_source: String(utm.source) } : {}),
      ...(utm.medium ? { utm_medium: String(utm.medium) } : {}),
      ...(utm.campaign ? { utm_campaign: String(utm.campaign) } : {}),
    }).toString();
    if (utmParams) {
      content = content + (content.includes("?") ? "&" : "?") + utmParams;
    }
  }

  // Update status
  await prisma.marketingCampaign.update({
    where: { id },
    data: { status: "SENDING", sentAt: null },
  });

  // Delete old deliveries if force
  if (force || campaign.status !== "SENT") {
    await prisma.marketingDelivery.deleteMany({ where: { campaignId: id } });
  }

  const deliveries: Array<{
    campaignId: string;
    contactId: string;
    channel: string;
    recipient: string;
    status: string;
    sentAt: Date | null;
    errorMessage: string | null;
  }> = [];

  // Process each contact
  for (const contactItem of contacts) {
    try {
      // Substitute variables
      const personalizedContent = substituteVariables(content, {
        name: contactItem.contact.name,
        email: contactItem.contact.email || "",
        phone: contactItem.contact.phone || "",
        company: contactItem.contact.company || "",
      });

      await sendThroughChannel(
        campaign.channel,
        config,
        contactItem.recipient!,
        personalizedContent,
        campaign.subject
      );

      deliveries.push({
        campaignId: id,
        contactId: contactItem.contactId,
        channel: campaign.channel,
        recipient: contactItem.recipient!,
        status: "SENT",
        sentAt: new Date(),
        errorMessage: null,
      });
    } catch (error) {
      deliveries.push({
        campaignId: id,
        contactId: contactItem.contactId,
        channel: campaign.channel,
        recipient: contactItem.recipient!,
        status: "FAILED",
        sentAt: null,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Save all deliveries
  if (deliveries.length > 0) {
    await prisma.marketingDelivery.createMany({ data: deliveries as any });
  }

  // Update campaign status
  const sentCount = deliveries.filter((d) => d.status === "SENT").length;
  const failedCount = deliveries.filter((d) => d.status === "FAILED").length;

  const nextStatus =
    sentCount > 0 && failedCount === 0 ? "SENT" :
    sentCount > 0 ? "PARTIAL" : "FAILED";

  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      status: nextStatus,
      sentAt: sentCount > 0 ? new Date() : null,
    },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: { select: { status: true } },
    },
  });
}

export async function getCampaignStats(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      deliveries: {
        orderBy: { sentAt: "desc" },
        take: 500,
      },
    },
  });

  if (!campaign) throw ApiError.notFound("Campaign not found");

  const stats = computeCampaignStats(campaign.deliveries);
  const totalContacts = campaign.deliveries.length;
  const deliveryRate = totalContacts > 0 ? (stats.sent / totalContacts) * 100 : 0;
  const openRate = totalContacts > 0 ? (stats.sent * 0.3 / totalContacts) * 100 : 0; // Mock open rate
  const clickRate = totalContacts > 0 ? (stats.sent * 0.1 / totalContacts) * 100 : 0; // Mock click rate

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      channel: campaign.channel,
      status: campaign.status,
      createdAt: campaign.createdAt,
      sentAt: campaign.sentAt,
    },
    stats: {
      ...stats,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    },
    recentDeliveries: campaign.deliveries.slice(0, 50),
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
      { company: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params?.tags && params.tags.length > 0) {
    where.tags = { hasSome: params.tags };
  }

  const [contacts, total] = await Promise.all([
    prisma.marketingContact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { deliveries: true } },
      },
    }),
    prisma.marketingContact.count({ where }),
  ]);

  return {
    data: contacts.map((contact) => ({
      ...contact,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createContact(input: MarketingContactInput) {
  const phone = cleanPhone(input.phone);
  const whatsapp = cleanPhone(input.whatsapp);
  const email = cleanString(input.email);

  if (!email && !phone && !whatsapp) {
    throw ApiError.badRequest("Isi minimal satu: email atau nomor telepon/WhatsApp.");
  }

  return prisma.marketingContact.create({
    data: {
      name: input.name,
      email,
      phone,
      whatsapp,
      instagram: cleanString(input.instagram),
      facebook: cleanString(input.facebook),
      telegram: cleanString(input.telegram),
      preferredChannel: input.preferredChannel ?? null,
      tags: (input.tags?.length ? input.tags : ["manual"]) as Prisma.InputJsonValue,
      company: cleanString(input.company),
      position: cleanString(input.position),
      notes: cleanString(input.notes),
      source: cleanString(input.source),
      isSubscribed: input.isSubscribed,
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
      ...(input.whatsapp !== undefined ? { whatsapp: cleanPhone(input.whatsapp) } : {}),
      ...(input.instagram !== undefined ? { instagram: cleanString(input.instagram) } : {}),
      ...(input.facebook !== undefined ? { facebook: cleanString(input.facebook) } : {}),
      ...(input.telegram !== undefined ? { telegram: cleanString(input.telegram) } : {}),
      ...(input.preferredChannel !== undefined ? { preferredChannel: input.preferredChannel ?? null } : {}),
      ...(input.tags !== undefined ? { tags: input.tags as Prisma.InputJsonValue } : {}),
      ...(input.company !== undefined ? { company: cleanString(input.company) } : {}),
      ...(input.position !== undefined ? { position: cleanString(input.position) } : {}),
      ...(input.notes !== undefined ? { notes: cleanString(input.notes) } : {}),
      ...(input.source !== undefined ? { source: cleanString(input.source) } : {}),
      ...(input.isSubscribed !== undefined ? { isSubscribed: input.isSubscribed } : {}),
    },
  });
}

export async function deleteContact(id: string) {
  const contact = await prisma.marketingContact.findUnique({ where: { id } });
  if (!contact) throw ApiError.notFound("Contact not found");

  await prisma.marketingContact.delete({ where: { id } });
  return { id };
}

export async function importContacts(input: MarketingContactImportInput) {
  const results = {
    imported: 0,
    skipped: 0,
    updated: 0,
    errors: [] as string[],
  };

  const defaultTags = input.tags ?? [];

  for (const contact of input.contacts) {
    try {
      const email = cleanString(contact.email);
      const phone = cleanPhone(contact.phone);
      const whatsapp = cleanPhone(contact.whatsapp);

      if (!email && !phone && !whatsapp) {
        results.skipped++;
        results.errors.push(`Kontak ${contact.name}: tidak ada email atau telepon.`);
        continue;
      }

      const existingWhere: any = {};
      if (email) existingWhere.email = email;
      if (phone) existingWhere.phone = phone;
      if (whatsapp) existingWhere.whatsapp = whatsapp;

      if (Object.keys(existingWhere).length === 0) {
        results.skipped++;
        continue;
      }

      const existing = await prisma.marketingContact.findFirst({
        where: { OR: [existingWhere] },
      });

      if (existing) {
        if (input.duplicateHandling === "SKIP") {
          results.skipped++;
        } else if (input.duplicateHandling === "UPDATE") {
          const tags = [...new Set([...(existing.tags as string[] || []), ...(contact.tags ?? []), ...defaultTags])];
          await prisma.marketingContact.update({
            where: { id: existing.id },
            data: {
              name: contact.name,
              company: cleanString(contact.company) ?? undefined,
              source: cleanString(contact.source) ?? undefined,
              tags: tags as Prisma.InputJsonValue,
            },
          });
          results.updated++;
        } else {
          // OVERWRITE
          const tags = [...new Set([...(contact.tags ?? []), ...defaultTags])];
          await prisma.marketingContact.update({
            where: { id: existing.id },
            data: {
              name: contact.name,
              email: email ?? undefined,
              phone: phone ?? undefined,
              whatsapp: whatsapp ?? undefined,
              company: cleanString(contact.company) ?? undefined,
              source: cleanString(contact.source) ?? undefined,
              tags: tags as Prisma.InputJsonValue,
            },
          });
          results.updated++;
        }
      } else {
        const tags = [...new Set([...(contact.tags ?? []), ...defaultTags])];
        await prisma.marketingContact.create({
          data: {
            name: contact.name,
            email: email ?? null,
            phone: phone ?? null,
            whatsapp: whatsapp ?? null,
            company: cleanString(contact.company) ?? null,
            source: cleanString(contact.source) ?? null,
            tags: tags as Prisma.InputJsonValue,
            isSubscribed: true,
          },
        });
        results.imported++;
      }
    } catch (error) {
      results.skipped++;
      results.errors.push(`Kontak ${contact.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return results;
}


// ============== TEMPLATE OPERATIONS =============

export async function listTemplates(params?: { type?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where = params?.type ? { type: params.type } : {};

  const [templates, total] = await Promise.all([
    prisma.marketingTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.marketingTemplate.count({ where }),
  ]);

  return {
    data: templates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTemplate(id: string) {
  const template = await prisma.marketingTemplate.findUnique({ where: { id } });
  if (!template) throw ApiError.notFound("Template not found");
  return template;
}

export async function createTemplate(input: MarketingTemplateInput) {
  return prisma.marketingTemplate.create({
    data: {
      name: input.name,
      type: input.type,
      subject: cleanString(input.subject),
      content: input.content,
      thumbnailUrl: cleanString(input.thumbnailUrl),
      category: cleanString(input.category),
      isPublic: input.isPublic,
      variables: input.variables as Prisma.InputJsonValue,
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
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.subject !== undefined ? { subject: cleanString(input.subject) } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: cleanString(input.thumbnailUrl) } : {}),
      ...(input.category !== undefined ? { category: cleanString(input.category) } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      ...(input.variables !== undefined ? { variables: input.variables as Prisma.InputJsonValue } : {}),
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

  const where: any = {};
  if (params?.status) where.status = params.status;

  const [offers, total] = await Promise.all([
    prisma.marketingOffer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.marketingOffer.count({ where }),
  ]);

  return {
    data: offers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOffer(id: string) {
  const offer = await prisma.marketingOffer.findUnique({ where: { id } });
  if (!offer) throw ApiError.notFound("Offer not found");
  return offer;
}

export async function createOffer(input: MarketingOfferInput) {
  return prisma.marketingOffer.create({
    data: {
      title: input.title,
      description: cleanString(input.description),
      type: input.type,
      status: input.status,
      code: cleanString(input.code),
      discountType: input.discountType ?? null,
      discountValue: input.discountValue ?? null,
      minPurchase: input.minPurchase ?? null,
      maxDiscount: input.maxDiscount ?? null,
      startDate: parseDate(input.startDate ?? null),
      endDate: parseDate(input.endDate ?? null),
      usageLimit: input.usageLimit ?? null,
      usedCount: 0,
      targetAudience: input.targetAudience,
      audienceTags: (input.audienceTags ?? []) as Prisma.InputJsonValue,
      terms: cleanString(input.terms),
      imageUrl: cleanString(input.imageUrl),
      ctaText: cleanString(input.ctaText),
      ctaUrl: cleanString(input.ctaUrl),
    },
  });
}

export async function updateOffer(id: string, input: MarketingOfferUpdateInput) {
  const existing = await prisma.marketingOffer.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Offer not found");

  return prisma.marketingOffer.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: cleanString(input.description) } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.code !== undefined ? { code: cleanString(input.code) } : {}),
      ...(input.discountType !== undefined ? { discountType: input.discountType } : {}),
      ...(input.discountValue !== undefined ? { discountValue: input.discountValue } : {}),
      ...(input.minPurchase !== undefined ? { minPurchase: input.minPurchase } : {}),
      ...(input.maxDiscount !== undefined ? { maxDiscount: input.maxDiscount } : {}),
      ...(input.startDate !== undefined ? { startDate: parseDate(input.startDate ?? null) } : {}),
      ...(input.endDate !== undefined ? { endDate: parseDate(input.endDate ?? null) } : {}),
      ...(input.usageLimit !== undefined ? { usageLimit: input.usageLimit } : {}),
      ...(input.usedCount !== undefined ? { usedCount: input.usedCount } : {}),
      ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
      ...(input.audienceTags !== undefined ? { audienceTags: input.audienceTags as Prisma.InputJsonValue } : {}),
      ...(input.terms !== undefined ? { terms: cleanString(input.terms) } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: cleanString(input.imageUrl) } : {}),
      ...(input.ctaText !== undefined ? { ctaText: cleanString(input.ctaText) } : {}),
      ...(input.ctaUrl !== undefined ? { ctaUrl: cleanString(input.ctaUrl) } : {}),
    },
  });
}

export async function deleteOffer(id: string) {
  const offer = await prisma.marketingOffer.findUnique({ where: { id } });
  if (!offer) throw ApiError.notFound("Offer not found");

  await prisma.marketingOffer.delete({ where: { id } });
  return { id };
}

