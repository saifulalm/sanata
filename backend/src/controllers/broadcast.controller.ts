import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { recordAudit } from "@/services/auditLog.service";
import * as broadcastService from "@/services/broadcast.service";
import {
  broadcastCampaignSchema,
  broadcastCampaignUpdateSchema,
  broadcastConnectionCreateSchema,
  broadcastConnectionUpdateSchema,
  broadcastContactSchema,
  broadcastContactUpdateSchema,
  broadcastPairingSchema,
  broadcastSendSchema,
  whatsappQuickConnectSchema,
} from "@/validators/broadcast.validator";

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await broadcastService.getOverview() });
});

export const listConnections = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await broadcastService.listConnections() });
});

export const createConnection = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastConnectionCreateSchema.parse(req.body);
  const connection = await broadcastService.createConnection(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "BroadcastConnection",
    entityId: connection.id,
    meta: {
      channel: connection.channel,
      provider: connection.provider,
      accountKey: connection.accountKey,
    },
  });

  res.status(201).json({ success: true, data: connection });
});

export const updateConnection = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastConnectionUpdateSchema.parse(req.body);
  const connection = await broadcastService.updateConnection(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastConnection",
    entityId: connection.id,
    meta: {
      channel: connection.channel,
      provider: connection.provider,
      isEnabled: connection.isEnabled,
    },
  });

  res.json({ success: true, data: connection });
});

export const quickConnectWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  const input = whatsappQuickConnectSchema.parse(req.body);
  const result = await broadcastService.quickConnectWhatsApp(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "BroadcastConnection",
    entityId: result.connection.id,
    meta: {
      channel: "WHATSAPP",
      provider: "WHATSAPP_BAILEYS",
      accountKey: result.connection.accountKey,
      state: result.session?.state ?? "UNKNOWN",
    },
  });

  res.status(201).json({ success: true, data: result });
});

export const deleteConnection = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.deleteConnection(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "BroadcastConnection",
    entityId: req.params.id,
  });

  res.json({ success: true, data: result });
});

export const requestConnectionPairingCode = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastPairingSchema.parse(req.body);
  const session = await broadcastService.requestConnectionPairingCode(req.params.id, input.phoneNumber);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastConnection",
    entityId: req.params.id,
    meta: { provider: "WHATSAPP_BAILEYS", sessionKey: session.sessionKey, state: session.state },
  });

  res.json({ success: true, data: session });
});

export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const connection = await broadcastService.testConnection(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastConnection",
    entityId: connection.id,
    meta: { channel: connection.channel, provider: connection.provider, status: connection.status },
  });

  res.json({ success: true, data: connection });
});

export const getConnectionSession = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await broadcastService.getConnectionSession(req.params.id) });
});

export const startConnectionSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await broadcastService.startConnectionSession(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastConnection",
    entityId: req.params.id,
    meta: { provider: "WHATSAPP_BAILEYS", sessionKey: session.sessionKey, state: session.state },
  });

  res.json({ success: true, data: session });
});

export const refreshConnectionSessionQr = asyncHandler(async (req: Request, res: Response) => {
  const session = await broadcastService.refreshConnectionSessionQr(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastConnection",
    entityId: req.params.id,
    meta: { provider: "WHATSAPP_BAILEYS", sessionKey: session.sessionKey, state: session.state },
  });

  res.json({ success: true, data: session });
});

export const disconnectConnectionSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await broadcastService.disconnectConnectionSession(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastConnection",
    entityId: req.params.id,
    meta: { provider: "WHATSAPP_BAILEYS", sessionKey: session.sessionKey, state: session.state },
  });

  res.json({ success: true, data: session });
});

export const listContacts = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await broadcastService.listContacts() });
});

export const createContact = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastContactSchema.parse(req.body);
  const contact = await broadcastService.createContact(input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "BroadcastContact",
    entityId: contact.id,
    meta: { name: contact.name, consent: contact.consent },
  });

  res.status(201).json({ success: true, data: contact });
});

export const updateContact = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastContactUpdateSchema.parse(req.body);
  const contact = await broadcastService.updateContact(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastContact",
    entityId: contact.id,
    meta: { name: contact.name, consent: contact.consent },
  });

  res.json({ success: true, data: contact });
});

export const deleteContact = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.deactivateContact(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "BroadcastContact",
    entityId: req.params.id,
  });

  res.json({ success: true, data: result });
});

export const deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.deleteCampaign(req.params.id);

  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "BroadcastCampaign",
    entityId: req.params.id,
  });

  res.json({ success: true, data: result });
});

export const listCampaigns = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await broadcastService.listCampaigns() });
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastCampaignSchema.parse(req.body);
  const campaign = await broadcastService.createCampaign(req.user!.sub, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "BroadcastCampaign",
    entityId: campaign.id,
    meta: { channel: campaign.channel, audienceType: campaign.audienceType },
  });

  res.status(201).json({ success: true, data: campaign });
});

export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastCampaignUpdateSchema.parse(req.body);
  const campaign = await broadcastService.updateCampaign(req.params.id, input);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastCampaign",
    entityId: campaign.id,
    meta: { channel: campaign.channel, status: campaign.status },
  });

  res.json({ success: true, data: campaign });
});

export const sendCampaign = asyncHandler(async (req: Request, res: Response) => {
  const input = broadcastSendSchema.parse(req.body ?? {});
  const campaign = await broadcastService.sendCampaign(req.params.id, input.force);

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "BroadcastCampaign",
    entityId: campaign.id,
    meta: {
      channel: campaign.channel,
      status: campaign.status,
      sent: campaign.deliveries.filter((delivery) => delivery.status === "SENT").length,
      failed: campaign.deliveries.filter((delivery) => delivery.status === "FAILED").length,
    },
  });

  res.json({ success: true, data: campaign });
});
