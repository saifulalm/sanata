import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { recordAudit } from "@/services/auditLog.service";
import * as marketingService from "@/services/marketing.service";
import {
  marketingCampaignCreateSchema,
  marketingCampaignUpdateSchema,
  marketingCampaignSendSchema,
  marketingContactSchema,
  marketingContactUpdateSchema,
  marketingContactImportSchema,
  marketingTemplateSchema,
  marketingTemplateUpdateSchema,
  marketingOfferSchema,
  marketingOfferUpdateSchema,
  marketingBroadcastListSchema,
  marketingBroadcastListUpdateSchema,
  marketingBroadcastListAddContactsSchema,
  marketingAnalyticsQuerySchema,
} from "@/validators/marketing.validator";

// ============== Campaign Controllers =============

export const listCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as any;
  const result = await marketingService.listCampaigns({ page, limit, status });
  res.json({ success: true, ...result });
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingCampaignCreateSchema.parse(req.body);
  const campaign = await marketingService.createCampaign(input, req.user!.sub);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "MarketingCampaign",
    entityId: campaign.id,
    meta: { name: campaign.name, type: campaign.type },
  });

  res.status(201).json({ success: true, data: campaign });
});

export const getCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await marketingService.getCampaign(req.params.id);
  res.json({ success: true, data: campaign });
});

export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingCampaignUpdateSchema.parse(req.body);
  const campaign = await marketingService.updateCampaign(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingCampaign",
    entityId: campaign.id,
    meta: { name: campaign.name, status: campaign.status },
  });

  res.json({ success: true, data: campaign });
});

export const deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
  const result = await marketingService.deleteCampaign(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "MarketingCampaign",
    entityId: req.params.id,
  });

  res.json({ success: true, ...result });
});

export const sendCampaign = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingCampaignSendSchema.parse(req.body ?? {});
  const campaign = await marketingService.sendCampaign(req.params.id, input.force);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingCampaign",
    entityId: campaign.id,
    meta: {
      name: campaign.name,
      status: campaign.status,
      action: "send",
    },
  });

  res.json({ success: true, data: campaign });
});

export const getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await marketingService.getCampaignStats(req.params.id);
  res.json({ success: true, data: stats });
});

// ============== Contact Controllers =============

export const listContacts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, tags } = req.query as any;
  const result = await marketingService.listContacts({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
  });
  res.json({ success: true, ...result });
});

export const createContact = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingContactSchema.parse(req.body);
  const contact = await marketingService.createContact(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "MarketingContact",
    entityId: contact.id,
    meta: { name: contact.name, source: contact.source },
  });

  res.status(201).json({ success: true, data: contact });
});

export const updateContact = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingContactUpdateSchema.parse(req.body);
  const contact = await marketingService.updateContact(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingContact",
    entityId: contact.id,
    meta: { name: contact.name },
  });

  res.json({ success: true, data: contact });
});

export const deleteContact = asyncHandler(async (req: Request, res: Response) => {
  const result = await marketingService.deleteContact(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "MarketingContact",
    entityId: req.params.id,
  });

  res.json({ success: true, ...result });
});

export const importContacts = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingContactImportSchema.parse(req.body);
  const result = await marketingService.importContacts(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "MarketingContact",
    meta: { action: "import", ...result },
  });

  res.status(201).json({ success: true, data: result });
});

// ============== Template Controllers =============

export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { type, page, limit } = req.query as any;
  const result = await marketingService.listTemplates({
    type,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, ...result });
});

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingTemplateSchema.parse(req.body);
  const template = await marketingService.createTemplate(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "MarketingTemplate",
    entityId: template.id,
    meta: { name: template.name, type: template.type },
  });

  res.status(201).json({ success: true, data: template });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingTemplateUpdateSchema.parse(req.body);
  const template = await marketingService.updateTemplate(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingTemplate",
    entityId: template.id,
    meta: { name: template.name },
  });

  res.json({ success: true, data: template });
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const result = await marketingService.deleteTemplate(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "MarketingTemplate",
    entityId: req.params.id,
  });

  res.json({ success: true, ...result });
});

// ============== Offer Controllers =============

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query as any;
  const result = await marketingService.listOffers({
    status,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, ...result });
});

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingOfferSchema.parse(req.body);
  const offer = await marketingService.createOffer(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "MarketingOffer",
    entityId: offer.id,
    meta: { title: offer.title, discountType: offer.discountType },
  });

  res.status(201).json({ success: true, data: offer });
});

export const updateOffer = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingOfferUpdateSchema.parse(req.body);
  const offer = await marketingService.updateOffer(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingOffer",
    entityId: offer.id,
    meta: { title: offer.title, status: offer.status },
  });

  res.json({ success: true, data: offer });
});

export const deleteOffer = asyncHandler(async (req: Request, res: Response) => {
  const result = await marketingService.deleteOffer(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "MarketingOffer",
    entityId: req.params.id,
  });

  res.json({ success: true, ...result });
});

// ============== Broadcast List Controllers =============

export const listBroadcastLists = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const result = await marketingService.listBroadcastLists({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, ...result });
});

export const createBroadcastList = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingBroadcastListSchema.parse(req.body);
  const list = await marketingService.createBroadcastList(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "MarketingBroadcastList",
    entityId: list.id,
    meta: { name: list.name },
  });

  res.status(201).json({ success: true, data: list });
});

export const updateBroadcastList = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingBroadcastListUpdateSchema.parse(req.body);
  const list = await marketingService.updateBroadcastList(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingBroadcastList",
    entityId: list.id,
    meta: { name: list.name },
  });

  res.json({ success: true, data: list });
});

export const addContactsToBroadcastList = asyncHandler(async (req: Request, res: Response) => {
  const input = marketingBroadcastListAddContactsSchema.parse(req.body);
  const result = await marketingService.addContactsToBroadcastList(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "MarketingBroadcastList",
    entityId: req.params.id,
    meta: { action: "addContacts", ...result },
  });

  res.json({ success: true, data: result });
});

// ============== Analytics Controller =============

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const query = marketingAnalyticsQuerySchema.parse(req.query);
  const analytics = await marketingService.getAnalytics(query);
  res.json({ success: true, data: analytics });
});
