/**
 * QC Template Controller
 * CRUD endpoints for QC checklist templates
 */
import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as qcTemplateService from "@/services/qcTemplate.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await qcTemplateService.listQcTemplates({
    wbsStage: req.query.wbsStage as string,
    methodCode: req.query.methodCode as string,
    isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 50,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const template = await qcTemplateService.getQcTemplate(req.params.id);
  res.json({ success: true, data: template });
});

export const getByWbsStage = asyncHandler(async (req: Request, res: Response) => {
  const templates = await qcTemplateService.getQcTemplateByWbsStage(req.params.wbsStage);
  res.json({ success: true, data: templates });
});

export const getWithItems = asyncHandler(async (req: Request, res: Response) => {
  const template = await qcTemplateService.getQcTemplateWithItems(req.params.id);
  res.json({ success: true, data: template });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const template = await qcTemplateService.createQcTemplate(req.body);
  res.status(201).json({ success: true, data: template });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const template = await qcTemplateService.updateQcTemplate(req.params.id, req.body);
  res.json({ success: true, data: template });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const template = await qcTemplateService.deleteQcTemplate(req.params.id);
  res.json({ success: true, data: template });
});
