import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { signatorySchema, signatoryUpdateSchema } from "@/validators/signatory.validator";
import * as signatoryService from "@/services/signatory.service";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await signatoryService.listSignatories(req.query);
  res.json({ success: true, data: items, meta });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const signatory = await signatoryService.getSignatoryById(req.params.id);
  res.json({ success: true, data: signatory });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = signatorySchema.parse(req.body);
  const signatory = await signatoryService.createSignatory(input);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "Signatory",
    entityId: signatory.id,
    meta: { name: signatory.name, title: signatory.title },
  });
  res.status(201).json({ success: true, data: signatory });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = signatoryUpdateSchema.parse(req.body);
  const signatory = await signatoryService.updateSignatory(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Signatory",
    entityId: signatory.id,
    meta: { name: signatory.name, title: signatory.title },
  });
  res.json({ success: true, data: signatory });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const signatory = await signatoryService.deleteSignatory(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "Signatory",
    entityId: req.params.id,
    meta: { name: signatory.name, wasActive: signatory.isActive },
  });
  res.json({ success: true, data: signatory });
});
