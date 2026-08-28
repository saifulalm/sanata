/**
 * Assessment Controller
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as assessmentService from "@/services/assessment.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await assessmentService.listAssessments({
    workerId: req.query.workerId as string,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.getAssessment(req.params.id);
  res.json({ success: true, data: assessment });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.createAssessment(req.body);
  res.status(201).json({ success: true, data: assessment });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.updateAssessment(req.params.id, req.body);
  res.json({ success: true, data: assessment });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await assessmentService.deleteAssessment(req.params.id);
  res.json({ success: true });
});

export const byWorker = asyncHandler(async (req: Request, res: Response) => {
  const assessments = await assessmentService.getWorkerAssessments(req.params.workerId);
  res.json({ success: true, data: assessments });
});
