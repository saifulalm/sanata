/**
 * Execution Log Controller
 * Complete execution documentation endpoints
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as executionService from "@/services/execution.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await executionService.listExecutions({
    assignmentId: req.query.assignmentId as string,
    workerId: req.query.workerId as string,
    rabId: req.query.rabId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const log = await executionService.getExecution(req.params.id);
  res.json({ success: true, data: log });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const log = await executionService.createExecution(req.body, req.user!.sub);
  res.status(201).json({ success: true, data: log });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const log = await executionService.updateExecution(req.params.id, req.body);
  res.json({ success: true, data: log });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await executionService.deleteExecution(req.params.id);
  res.json({ success: true });
});

export const addPhoto = asyncHandler(async (req: Request, res: Response) => {
  const photo = await executionService.addExecutionPhoto(req.params.id, req.body);
  res.status(201).json({ success: true, data: photo });
});

export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  await executionService.deleteExecutionPhoto(req.params.photoId);
  res.json({ success: true });
});

export const byWorker = asyncHandler(async (req: Request, res: Response) => {
  const logs = await executionService.getWorkerExecutions(req.params.workerId);
  res.json({ success: true, data: logs });
});

export const byAssignment = asyncHandler(async (req: Request, res: Response) => {
  const logs = await executionService.getExecutionsByAssignment(req.params.assignmentId);
  res.json({ success: true, data: logs });
});

export const dailySummary = asyncHandler(async (req: Request, res: Response) => {
  const { rabId, date } = req.query as { rabId: string; date: string };
  const summary = await executionService.getDailyExecutionSummary(rabId, date);
  res.json({ success: true, data: summary });
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await executionService.getExecutionStats(req.query.rabId as string);
  res.json({ success: true, data: stats });
});
