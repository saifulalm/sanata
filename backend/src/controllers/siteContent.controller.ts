import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import {
  collectionItemSchema,
  collectionItemUpdateSchema,
  settingsUpdateSchema,
} from "@/validators/siteContent.validator";
import * as siteContentService from "@/services/siteContent.service";
import { recordAudit } from "@/services/auditLog.service";
import { SITE_COLLECTIONS } from "@/config/siteContent";

export const publicContent = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await siteContentService.getPublicSiteContent() });
});

export const collections = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: SITE_COLLECTIONS });
});

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await siteContentService.listCollectionItems(String(req.params.collection));
  res.json({ success: true, data: items });
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const input = collectionItemSchema.parse(req.body);
  const item = await siteContentService.createCollectionItem(input);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "SiteContent",
    entityId: item.id,
    meta: { collection: item.collection, title: item.title },
  });
  res.status(201).json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const input = collectionItemUpdateSchema.parse(req.body);
  const item = await siteContentService.updateCollectionItem(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "SiteContent",
    entityId: item.id,
    meta: { collection: item.collection, title: item.title },
  });
  res.json({ success: true, data: item });
});

export const moveItem = asyncHandler(async (req: Request, res: Response) => {
  const direction = String(req.body?.direction ?? "");
  if (direction !== "up" && direction !== "down") {
    throw ApiError.badRequest('direction must be "up" or "down"');
  }
  const item = await siteContentService.moveCollectionItem(req.params.id, direction);
  res.json({ success: true, data: item });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  await siteContentService.deleteCollectionItem(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "SiteContent",
    entityId: req.params.id,
  });
  res.json({ success: true, data: null });
});

export const listSettings = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await siteContentService.listSettings() });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const input = settingsUpdateSchema.parse(req.body);
  const settings = await siteContentService.updateSettings(input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "SiteSetting",
    meta: { keys: input.settings.map((s) => s.key) },
  });
  res.json({ success: true, data: settings });
});
