import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ahspSchema, ahspUpdateSchema } from "@/validators/ahsp.validator";
import * as ahspService from "@/services/ahsp.service";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await ahspService.listAhsp(req.query);
  res.json({ success: true, data: items, meta });
});

export const categories = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await ahspService.listAhspCategories() });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await ahspService.getAhspById(req.params.id) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = ahspSchema.parse(req.body);
  const ahsp = await ahspService.createAhsp(input);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "Ahsp",
    entityId: ahsp.id,
    meta: { code: ahsp.code, name: ahsp.name },
  });
  res.status(201).json({ success: true, data: ahsp });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = ahspUpdateSchema.parse(req.body);
  const ahsp = await ahspService.updateAhsp(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Ahsp",
    entityId: ahsp.id,
    meta: { code: ahsp.code, componentCount: ahsp.components.length },
  });
  res.json({ success: true, data: ahsp });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await ahspService.deleteAhsp(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Ahsp", entityId: req.params.id });
  res.json({ success: true, data: null });
});
