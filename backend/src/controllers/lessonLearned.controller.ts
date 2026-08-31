/**
 * Lesson Learned Controller
 * CRUD endpoints for lesson learned records
 */
import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as lessonLearnedService from "@/services/lessonLearned.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await lessonLearnedService.listLessonLearned({
    wbsStage: req.query.wbsStage as string,
    severity: req.query.severity as string,
    isResolved: req.query.isResolved === "true" ? true : req.query.isResolved === "false" ? false : undefined,
    search: req.query.search as string,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonLearnedService.getLessonLearned(req.params.id);
  res.json({ success: true, data: lesson });
});

export const getByWbsStage = asyncHandler(async (req: Request, res: Response) => {
  const lessons = await lessonLearnedService.getLessonLearnedByWbsStage(req.params.wbsStage);
  res.json({ success: true, data: lessons });
});

export const getUnresolved = asyncHandler(async (req: Request, res: Response) => {
  const lessons = await lessonLearnedService.getUnresolvedLessonLearned(req.query.wbsStage as string);
  res.json({ success: true, data: lessons });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonLearnedService.createLessonLearned(req.body, req.user!.sub);
  res.status(201).json({ success: true, data: lesson });
});

export const createFromRework = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonLearnedService.createFromRework(req.params.qcId, req.user!.sub);
  res.status(201).json({ success: true, data: lesson });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonLearnedService.updateLessonLearned(req.params.id, req.body);
  res.json({ success: true, data: lesson });
});

export const resolve = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonLearnedService.resolveLessonLearned(req.params.id, req.user!.sub);
  res.json({ success: true, data: lesson });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await lessonLearnedService.deleteLessonLearned(req.params.id);
  res.json({ success: true, data: lesson });
});
