/**
 * Worker Controller
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { parsePagination, buildMeta } from "@/utils/pagination";
import * as workerService from "@/services/worker.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
  const filters = {
    role: req.query.role as string | undefined,
    status: req.query.status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | undefined,
    search: req.query.search as string | undefined,
    grade: req.query.grade as "A" | "B" | "C" | "D" | undefined,
  };

  const { workers, total } = await workerService.listWorkers(filters, { skip, take });
  const meta = buildMeta(page, pageSize, total);
  res.json({ success: true, data: workers, meta });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const worker = await workerService.getWorkerById(req.params.id);
  res.json({ success: true, data: worker });
});

export const getByCode = asyncHandler(async (req: Request, res: Response) => {
  const worker = await workerService.getWorkerByCode(req.params.code);
  res.json({ success: true, data: worker });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const worker = await workerService.createWorker(req.body);
  res.status(201).json({ success: true, data: worker });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const worker = await workerService.updateWorker(req.params.id, req.body);
  res.json({ success: true, data: worker });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await workerService.deleteWorker(req.params.id);
  res.json({ success: true });
});

export const available = asyncHandler(async (req: Request, res: Response) => {
  const workers = await workerService.getAvailableWorkers(req.query.role as string);
  res.json({ success: true, data: workers });
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await workerService.getWorkerStats();
  res.json({ success: true, data: stats });
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const { verified } = req.body;
  const worker = await workerService.verifyWorker(req.params.id, verified);
  res.json({ success: true, data: worker });
});
