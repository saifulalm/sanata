import { Request, Response } from "express";
import type { LetterStatus, LetterType, MemoStatus } from "@prisma/client";
import { asyncHandler } from "@/utils/asyncHandler";
import { recordAudit } from "@/services/auditLog.service";
import * as submissionService from "@/services/submission.service";
import * as logbookService from "@/services/logbook.service";
import * as memoService from "@/services/siteMemo.service";
import * as letterService from "@/services/letter.service";
import * as periodicService from "@/services/periodicReport.service";
import {
  letterDefaultsSchema,
  letterSchema,
  letterStatusSchema,
  letterUpdateSchema,
  logbookSchema,
  memoSchema,
  memoStatusSchema,
  memoUpdateSchema,
  submissionClientDecisionSchema,
  submissionReviewSchema,
  submissionSchema,
  submissionUpdateSchema,
} from "@/validators/projectDoc.validator";

/** Nama berkas unduhan yang aman — nomor dokumen memuat garis miring. */
function attachCsv(res: Response, filename: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/\//g, "-")}"`);
}

// --- Pengajuan ---------------------------------------------------------------

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await submissionService.listSubmissions(req.query as Record<string, string>);
  res.json({ success: true, data: items, meta });
});

export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await submissionService.getSubmission(req.params.id) });
});

export const createSubmission = asyncHandler(async (req: Request, res: Response) => {
  const input = submissionSchema.parse(req.body);
  const data = await submissionService.createSubmission(input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, type: data.type },
  });
  res.status(201).json({ success: true, data });
});

export const updateSubmission = asyncHandler(async (req: Request, res: Response) => {
  const input = submissionUpdateSchema.parse(req.body);
  const data = await submissionService.updateSubmission(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number },
  });
  res.json({ success: true, data });
});

export const submitSubmission = asyncHandler(async (req: Request, res: Response) => {
  const data = await submissionService.submitSubmission(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, status: data.status },
  });
  res.json({ success: true, data });
});

export const reviewSubmission = asyncHandler(async (req: Request, res: Response) => {
  const input = submissionReviewSchema.parse(req.body);
  const data = await submissionService.reviewSubmission(req.params.id, input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, decision: input.decision },
  });
  res.json({ success: true, data });
});

export const forwardSubmission = asyncHandler(async (req: Request, res: Response) => {
  const data = await submissionService.forwardSubmission(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, forwarded: true },
  });
  res.json({ success: true, data });
});

export const clientDecision = asyncHandler(async (req: Request, res: Response) => {
  const input = submissionClientDecisionSchema.parse(req.body);
  const data = await submissionService.recordClientDecision(req.params.id, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, clientDecision: input.decision },
  });
  res.json({ success: true, data });
});

export const applyTimeExtension = asyncHandler(async (req: Request, res: Response) => {
  const data = await submissionService.applyTimeExtension(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, appliedDays: data.requestedDays },
  });
  res.json({ success: true, data });
});

export const cancelSubmission = asyncHandler(async (req: Request, res: Response) => {
  const data = await submissionService.cancelSubmission(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectSubmission",
    entityId: data.id,
    meta: { number: data.number, cancelled: true },
  });
  res.json({ success: true, data });
});

export const removeSubmission = asyncHandler(async (req: Request, res: Response) => {
  await submissionService.deleteSubmission(req.params.id);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "ProjectSubmission",
    entityId: req.params.id,
  });
  res.json({ success: true });
});

// --- Logbook -----------------------------------------------------------------

export const listLogbook = asyncHandler(async (req: Request, res: Response) => {
  const data = await logbookService.listLogbook(req.params.id, req.query as Record<string, string>);
  res.json({ success: true, data });
});

export const exportLogbookCsv = asyncHandler(async (req: Request, res: Response) => {
  const data = await logbookService.listLogbook(req.params.id, req.query as Record<string, string>);
  attachCsv(res, `${data.rab.number}-logbook.csv`);
  res.send(logbookService.logbookToCsv(data.entries));
});

export const createLogbookEntry = asyncHandler(async (req: Request, res: Response) => {
  const input = logbookSchema.parse(req.body);
  const data = await logbookService.createLogbookEntry(req.params.id, input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "LogbookEntry",
    entityId: data.id,
    meta: { rabId: req.params.id, category: data.category, date: data.date },
  });
  res.status(201).json({ success: true, data });
});

export const updateLogbookEntry = asyncHandler(async (req: Request, res: Response) => {
  const input = logbookSchema.parse(req.body);
  const data = await logbookService.updateLogbookEntry(req.params.entryId, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "LogbookEntry",
    entityId: data.id,
  });
  res.json({ success: true, data });
});

export const removeLogbookEntry = asyncHandler(async (req: Request, res: Response) => {
  await logbookService.deleteLogbookEntry(req.params.entryId);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "LogbookEntry",
    entityId: req.params.entryId,
  });
  res.json({ success: true });
});

// --- Site memo ---------------------------------------------------------------

export const listMemos = asyncHandler(async (req: Request, res: Response) => {
  const data = await memoService.listMemos(req.params.id, req.query as Record<string, string>);
  res.json({ success: true, data });
});

export const getMemo = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await memoService.getMemo(req.params.memoId) });
});

export const getMemoReplyDefaults = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await memoService.getReplyDefaults(req.params.memoId) });
});

export const createMemo = asyncHandler(async (req: Request, res: Response) => {
  const input = memoSchema.parse(req.body);
  const data = await memoService.createMemo(input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "SiteMemo",
    entityId: data.id,
    meta: { number: data.number, direction: data.direction },
  });
  res.status(201).json({ success: true, data });
});

export const updateMemo = asyncHandler(async (req: Request, res: Response) => {
  const input = memoUpdateSchema.parse(req.body);
  const data = await memoService.updateMemo(req.params.memoId, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "SiteMemo",
    entityId: data.id,
    meta: { number: data.number },
  });
  res.json({ success: true, data });
});

export const setMemoStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = memoStatusSchema.parse(req.body);
  const data = await memoService.setMemoStatus(req.params.memoId, input.status as MemoStatus);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "SiteMemo",
    entityId: data.id,
    meta: { number: data.number, status: input.status },
  });
  res.json({ success: true, data });
});

export const removeMemo = asyncHandler(async (req: Request, res: Response) => {
  await memoService.deleteMemo(req.params.memoId);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "SiteMemo",
    entityId: req.params.memoId,
  });
  res.json({ success: true });
});

// --- Surat-menyurat ----------------------------------------------------------

export const listLetters = asyncHandler(async (req: Request, res: Response) => {
  const data = await letterService.listLetters(req.params.id, req.query as Record<string, string>);
  res.json({ success: true, data });
});

export const getLetter = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await letterService.getLetter(req.params.letterId) });
});

export const getLetterDefaults = asyncHandler(async (req: Request, res: Response) => {
  const input = letterDefaultsSchema.parse(req.query);
  const data = await letterService.getLetterDefaults(input.rabId, input.type as LetterType, input.billingId);
  res.json({ success: true, data });
});

export const createLetter = asyncHandler(async (req: Request, res: Response) => {
  const input = letterSchema.parse(req.body);
  const data = await letterService.createLetter(input, req.user!.sub);
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "ProjectLetter",
    entityId: data.id,
    meta: { type: data.type, number: data.number },
  });
  res.status(201).json({ success: true, data });
});

export const updateLetter = asyncHandler(async (req: Request, res: Response) => {
  const input = letterUpdateSchema.parse(req.body);
  const data = await letterService.updateLetter(req.params.letterId, input);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectLetter",
    entityId: data.id,
    meta: { number: data.number },
  });
  res.json({ success: true, data });
});

export const issueLetter = asyncHandler(async (req: Request, res: Response) => {
  const data = await letterService.issueLetter(req.params.letterId);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectLetter",
    entityId: data.id,
    meta: { issued: true, number: data.number, total: data.totalAmount },
  });
  res.json({ success: true, data });
});

export const setLetterStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = letterStatusSchema.parse(req.body);
  const data = await letterService.setLetterStatus(req.params.letterId, input.status as LetterStatus);
  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "ProjectLetter",
    entityId: data.id,
    meta: { number: data.number, status: input.status },
  });
  res.json({ success: true, data });
});

export const removeLetter = asyncHandler(async (req: Request, res: Response) => {
  await letterService.deleteLetter(req.params.letterId);
  await recordAudit({
    userId: req.user!.sub,
    action: "DELETE",
    entity: "ProjectLetter",
    entityId: req.params.letterId,
  });
  res.json({ success: true });
});

// --- Laporan mingguan & bulanan ----------------------------------------------

export const weeklyReports = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await periodicService.getWeeklyReports(req.params.id) });
});

export const monthlyReports = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await periodicService.getMonthlyReports(req.params.id) });
});

export const exportWeeklyCsv = asyncHandler(async (req: Request, res: Response) => {
  const data = await periodicService.getWeeklyReports(req.params.id);
  attachCsv(res, `${data.rab.number}-laporan-mingguan.csv`);
  res.send(periodicService.periodicReportToCsv(data.periods));
});

export const exportMonthlyCsv = asyncHandler(async (req: Request, res: Response) => {
  const data = await periodicService.getMonthlyReports(req.params.id);
  attachCsv(res, `${data.rab.number}-laporan-bulanan.csv`);
  res.send(periodicService.periodicReportToCsv(data.periods));
});
