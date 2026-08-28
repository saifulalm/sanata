/**
 * KPI Controller
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { parsePagination, buildMeta } from "@/utils/pagination";
import * as kpiService from "@/services/kpi.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
  const filters = {
    workerId: req.query.workerId as string | undefined,
    period: req.query.period as string | undefined,
  };
  const { records, total } = await kpiService.listKpis(filters, { skip, take });
  const meta = buildMeta(page, pageSize, total);
  res.json({ success: true, data: records, meta });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const record = await kpiService.getKpi(req.params.id);
  res.json({ success: true, data: record });
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const record = await kpiService.upsertKpi(req.body);
  res.json({ success: true, data: record });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await kpiService.deleteKpi(req.params.id);
  res.json({ success: true });
});

export const byWorker = asyncHandler(async (req: Request, res: Response) => {
  const records = await kpiService.getWorkerKpis(req.params.workerId);
  res.json({ success: true, data: records });
});

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  const leaders = await kpiService.getLeaderboard(req.query.period as string);
  res.json({ success: true, data: leaders });
});

export const periods = asyncHandler(async (_req: Request, res: Response) => {
  const periods = await kpiService.getPeriods();
  res.json({ success: true, data: periods });
});
