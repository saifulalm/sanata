import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { priceItemSchema, priceItemUpdateSchema } from "@/validators/priceItem.validator";
import * as priceItemService from "@/services/priceItem.service";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await priceItemService.listPriceItems(req.query);
  res.json({ success: true, data: items, meta });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const item = await priceItemService.getPriceItemById(req.params.id);
  res.json({ success: true, data: item });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = priceItemSchema.parse(req.body);
  const item = await priceItemService.createPriceItem(input);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "PriceItem",
    entityId: item.id,
    meta: { code: item.code, name: item.name },
  });
  res.status(201).json({ success: true, data: item });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = priceItemUpdateSchema.parse(req.body);
  const item = await priceItemService.updatePriceItem(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "PriceItem",
    entityId: item.id,
    meta: input,
  });
  res.json({ success: true, data: item });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await priceItemService.deletePriceItem(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "PriceItem", entityId: req.params.id });
  res.json({ success: true, data: null });
});
