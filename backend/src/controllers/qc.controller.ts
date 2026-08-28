/**
 * QC Record Controller
 * Quality control documentation with rework tracking
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as qcService from "@/services/qc.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await qcService.listQcRecords({
    assignmentId: req.query.assignmentId as string,
    workerId: req.query.workerId as string,
    rabId: req.query.rabId as string,
    result: req.query.result as "PASS" | "FAIL" | "REWORK",
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const record = await qcService.getQcRecord(req.params.id);
  res.json({ success: true, data: record });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const record = await qcService.createQcRecord(req.body, req.user!.sub);
  res.status(201).json({ success: true, data: record });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const record = await qcService.approveQcRecord(req.params.id, req.user!.sub);
  res.json({ success: true, data: record });
});

export const rework = asyncHandler(async (req: Request, res: Response) => {
  const record = await qcService.createRework(req.params.id, req.body, req.user!.sub);
  res.status(201).json({ success: true, data: record });
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await qcService.getQcStats(req.query.rabId as string);
  res.json({ success: true, data: stats });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await qcService.deleteQcRecord(req.params.id);
  res.json({ success: true });
});
