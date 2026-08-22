import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  quotationCreateSchema,
  quotationUpdateSchema,
  quotationStatusSchema,
} from "@/validators/quotation.validator";
import * as quotationService from "@/services/quotation.service";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await quotationService.listQuotations(req.query);
  res.json({ success: true, data: items, meta });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await quotationService.getQuotationById(req.params.id) });
});

export const defaults = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await quotationService.getQuotationDefaults(String(req.query.rabId ?? "")) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = quotationCreateSchema.parse(req.body);
  const quotation = await quotationService.createQuotation(input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "Quotation",
    entityId: quotation.id,
    meta: { number: quotation.number, rabId: input.rabId, total: String(quotation.total) },
  });
  res.status(201).json({ success: true, data: quotation });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = quotationUpdateSchema.parse(req.body);
  const quotation = await quotationService.updateQuotation(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Quotation",
    entityId: quotation.id,
    meta: { number: quotation.number },
  });
  res.json({ success: true, data: quotation });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = quotationStatusSchema.parse(req.body);
  const quotation = await quotationService.updateQuotationStatus(req.params.id, input.status);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Quotation",
    entityId: quotation.id,
    meta: { number: quotation.number, status: quotation.status },
  });
  res.json({ success: true, data: quotation });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await quotationService.deleteQuotation(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Quotation", entityId: req.params.id });
  res.json({ success: true, data: null });
});
