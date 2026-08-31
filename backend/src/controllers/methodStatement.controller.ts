/**
 * Method Statement Controller
 * CRUD endpoints for method statements
 */
import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as methodStatementService from "@/services/methodStatement.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await methodStatementService.listMethodStatements({
    wbsStage: req.query.wbsStage as string,
    search: req.query.search as string,
    isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 50,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const statement = await methodStatementService.getMethodStatement(req.params.id);
  res.json({ success: true, data: statement });
});

export const getByCode = asyncHandler(async (req: Request, res: Response) => {
  const statement = await methodStatementService.getMethodStatementByCode(req.params.code);
  res.json({ success: true, data: statement });
});

export const getByWbsStage = asyncHandler(async (req: Request, res: Response) => {
  const statements = await methodStatementService.getMethodStatementsByWbsStage(req.params.wbsStage);
  res.json({ success: true, data: statements });
});

export const getWbsOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await methodStatementService.getWbsStagesOverview();
  res.json({ success: true, data: overview });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const statement = await methodStatementService.createMethodStatement(req.body);
  res.status(201).json({ success: true, data: statement });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const statement = await methodStatementService.updateMethodStatement(req.params.id, req.body);
  res.json({ success: true, data: statement });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const statement = await methodStatementService.deleteMethodStatement(req.params.id);
  res.json({ success: true, data: statement });
});
