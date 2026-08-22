import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { rabSchema, rabUpdateSchema } from "@/validators/rab.validator";
import * as rabService from "@/services/rab.service";
import * as takeoffService from "@/services/takeoff.service";
import * as scheduleService from "@/services/schedule.service";
import * as dailyReportService from "@/services/dailyReport.service";
import * as billingService from "@/services/billing.service";
import {
  baselineSchema,
  billingSchema,
  billingStatusSchema,
  dailyReportSchema,
  progressReviewSchema,
  progressSchema,
  scheduleUpdateSchema,
} from "@/validators/schedule.validator";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await rabService.listRabs(req.query);
  res.json({ success: true, data: items, meta });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const rab = await rabService.getRabById(req.params.id);
  res.json({ success: true, data: { ...rab, sectionSummary: rabService.summarizeRab(rab) } });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const rab = await rabService.getRabById(req.params.id);
  const filename = `${rab.number.replace(/\//g, "-")}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(rabService.toCsv(rab));
});

export const takeoff = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await takeoffService.getRabTakeoff(req.params.id) });
});

export const exportTakeoffCsv = asyncHandler(async (req: Request, res: Response) => {
  const takeoff = await takeoffService.getRabTakeoff(req.params.id);
  const filename = `${takeoff.rab.number.replace(/\//g, "-")}-takeoff.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(takeoffService.takeoffToCsv(takeoff));
});

export const schedule = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await scheduleService.getRabSchedule(req.params.id) });
});

export const exportScheduleCsv = asyncHandler(async (req: Request, res: Response) => {
  const data = await scheduleService.getRabSchedule(req.params.id);
  const filename = `${data.rab.number.replace(/\//g, "-")}-kurva-s.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(scheduleService.scheduleToCsv(data));
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const input = scheduleUpdateSchema.parse(req.body);
  const data = await scheduleService.updateRabSchedule(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Rab",
    entityId: req.params.id,
    meta: { schedule: true, scheduleStart: input.scheduleStart, items: input.items.length },
  });
  res.json({ success: true, data });
});

export const addProgress = asyncHandler(async (req: Request, res: Response) => {
  const input = progressSchema.parse(req.body);
  const data = await scheduleService.recordProgress(req.params.itemId, input, req.user!.sub, req.user!.role);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Rab",
    entityId: data.rab.id,
    meta: { progressItem: req.params.itemId, date: input.date, percent: input.percent },
  });
  res.json({ success: true, data });
});

export const listProgress = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await scheduleService.listProgressEntries(req.params.id) });
});

export const reviewProgress = asyncHandler(async (req: Request, res: Response) => {
  const input = progressReviewSchema.parse(req.body);
  const data = await scheduleService.reviewProgress(
    req.params.progressId,
    input.decision,
    req.user!.sub,
    input.reason
  );
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Rab",
    entityId: data.rab.id,
    meta: { reviewProgress: req.params.progressId, decision: input.decision },
  });
  res.json({ success: true, data });
});

export const listBaselines = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await scheduleService.listBaselines(req.params.id) });
});

export const captureBaseline = asyncHandler(async (req: Request, res: Response) => {
  const input = baselineSchema.parse(req.body);
  const data = await scheduleService.captureBaseline(req.params.id, input.name, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "Rab",
    entityId: req.params.id,
    meta: { baseline: input.name },
  });
  res.json({ success: true, data });
});

export const removeBaseline = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await scheduleService.deleteBaseline(req.params.baselineId) });
});

// --- Laporan harian ---------------------------------------------------------

export const listDailyReports = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await dailyReportService.listDailyReports(req.params.id) });
});

export const getDailyReport = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await dailyReportService.getDailyReport(req.params.reportId) });
});

export const createDailyReport = asyncHandler(async (req: Request, res: Response) => {
  const input = dailyReportSchema.parse(req.body);
  const data = await dailyReportService.createDailyReport(req.params.id, input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "DailyReport",
    entityId: data.id,
    meta: { rabId: req.params.id, date: input.date, photos: data.photos.length },
  });
  res.json({ success: true, data });
});

export const updateDailyReport = asyncHandler(async (req: Request, res: Response) => {
  const input = dailyReportSchema.parse(req.body);
  const data = await dailyReportService.updateDailyReport(req.params.reportId, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "DailyReport",
    entityId: req.params.reportId,
    meta: { date: input.date, photos: data.photos.length },
  });
  res.json({ success: true, data });
});

export const removeDailyReport = asyncHandler(async (req: Request, res: Response) => {
  await dailyReportService.deleteDailyReport(req.params.reportId);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "DailyReport",
    entityId: req.params.reportId,
  });
  res.json({ success: true, data: null });
});

// --- Ringkasan lintas proyek -------------------------------------------------

export const dailyReportSummary = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dailyReportService.getDailyReportSummary() });
});

// --- Termin / progress billing ----------------------------------------------

export const listBillings = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await billingService.listBillings(req.params.id) });
});

export const previewBilling = asyncHandler(async (req: Request, res: Response) => {
  const input = billingSchema.parse(req.body);
  const data = await billingService.previewBilling(
    req.params.id,
    input.periodEnd,
    input.retentionPct ?? 5,
    input.taxPct ?? 11
  );
  res.json({ success: true, data });
});

export const createBilling = asyncHandler(async (req: Request, res: Response) => {
  const input = billingSchema.parse(req.body);
  const data = await billingService.createBilling(req.params.id, input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "ProgressBilling",
    entityId: data.id,
    meta: { number: data.number, netAmount: data.netAmount },
  });
  res.json({ success: true, data });
});

export const getBillingDetail = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await billingService.getBilling(req.params.billingId) });
});

export const exportBillingCsv = asyncHandler(async (req: Request, res: Response) => {
  const billing = await billingService.getBilling(req.params.billingId);
  const filename = `${billing.number.replace(/\//g, "-")}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(billingService.billingToCsv(billing));
});

export const setBillingStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = billingStatusSchema.parse(req.body);
  const data = await billingService.setBillingStatus(req.params.billingId, input.status);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProgressBilling",
    entityId: data.id,
    meta: { number: data.number, status: data.status },
  });
  res.json({ success: true, data });
});

export const removeBilling = asyncHandler(async (req: Request, res: Response) => {
  await billingService.deleteBilling(req.params.billingId);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "ProgressBilling",
    entityId: req.params.billingId,
  });
  res.json({ success: true, data: null });
});

export const removeProgress = asyncHandler(async (req: Request, res: Response) => {
  const data = await scheduleService.deleteProgress(req.params.progressId);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Rab",
    entityId: data.rab.id,
    meta: { progressDeleted: req.params.progressId },
  });
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = rabSchema.parse(req.body);
  const rab = await rabService.createRab(input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "Rab",
    entityId: rab.id,
    meta: { number: rab.number, title: rab.title },
  });
  res.status(201).json({ success: true, data: rab });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = rabUpdateSchema.parse(req.body);
  const rab = await rabService.updateRab(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Rab",
    entityId: rab.id,
    meta: { number: rab.number, status: rab.status, total: String(rab.total) },
  });
  res.json({ success: true, data: rab });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await rabService.deleteRab(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Rab", entityId: req.params.id });
  res.json({ success: true, data: null });
});
