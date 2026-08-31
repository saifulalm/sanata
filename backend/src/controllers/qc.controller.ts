/**
 * QC Record Controller
 * Quality control documentation with rework tracking, hold point, and WBS integration
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
    wbsStage: req.query.wbsStage as string,
    methodCode: req.query.methodCode as string,
    checkType: req.query.checkType as "PRE_CHECK" | "POST_CHECK" | "FINAL_CHECK",
    holdPoint: req.query.holdPoint === "true" ? true : req.query.holdPoint === "false" ? false : undefined,
    isReleased: req.query.isReleased === "true" ? true : req.query.isReleased === "false" ? false : undefined,
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

export const createFromTemplate = asyncHandler(async (req: Request, res: Response) => {
  const record = await qcService.createQcFromTemplate(req.body, req.user!.sub);
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

export const release = asyncHandler(async (req: Request, res: Response) => {
  const record = await qcService.releaseHoldPoint(req.params.id, req.user!.sub, req.body.note);
  res.json({ success: true, data: record });
});

export const addApprovalLog = asyncHandler(async (req: Request, res: Response) => {
  const log = await qcService.addApprovalLog(req.params.id, {
    ...req.body,
    approverId: req.user!.sub,
  });
  res.status(201).json({ success: true, data: log });
});

export const getApprovalLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await qcService.getApprovalLogs(req.params.id);
  res.json({ success: true, data: logs });
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await qcService.getQcStats(req.query.rabId as string);
  res.json({ success: true, data: stats });
});

export const statsExtended = asyncHandler(async (req: Request, res: Response) => {
  const stats = await qcService.getQcStatsExtended(req.query.rabId as string);
  res.json({ success: true, data: stats });
});

export const statsByWbsStage = asyncHandler(async (req: Request, res: Response) => {
  const stats = await qcService.getQcStatsByWbsStage(req.query.rabId as string);
  res.json({ success: true, data: stats });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await qcService.deleteQcRecord(req.params.id);
  res.json({ success: true });
});
