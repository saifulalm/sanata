/**
 * Assessment Service - clean implementation
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import type { WorkerGrade } from "./worker.service";

interface AssessmentInput {
  workerId: string;
  assessmentDate?: string;
  interviewer?: string;
  technicalScore?: number;
  interviewScore?: number;
  teamworkScore?: number;
  safetyScore?: number;
  overallScore?: number;
  grade?: string;
  recommendation?: string;
  notes?: string;
  evidenceUrl?: string;
}

export async function listAssessments(opts: { workerId?: string; page?: number; pageSize?: number } = {}) {
  const page = opts.page || 1;
  const take = opts.pageSize || 20;
  const skip = (page - 1) * take;
  const where = opts.workerId ? { workerId: opts.workerId } : {};

  const [items, total] = await Promise.all([
    prisma.workerAssessment.findMany({
      where,
      include: { worker: { select: { id: true, workerCode: true, name: true, role: true } } },
      orderBy: { assessmentDate: "desc" },
      skip,
      take,
    }),
    prisma.workerAssessment.count({ where }),
  ]);

  return { data: items, meta: { page, take, total, totalPages: Math.ceil(total / take) } };
}

export async function getAssessment(id: string) {
  const r = await prisma.workerAssessment.findUnique({ where: { id }, include: { worker: true } });
  if (!r) throw ApiError.notFound("Assessment tidak ditemukan");
  return r;
}

export async function createAssessment(data: AssessmentInput) {
  const worker = await prisma.worker.findUnique({ where: { id: data.workerId } });
  if (!worker) throw ApiError.badRequest("Worker tidak ditemukan");

  const prefix = "ASS";
  const counter = await prisma.santraCounter.upsert({
    where: { prefix },
    create: { prefix, lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
  });
  const year = new Date().getFullYear();
  const code = `${prefix}-${worker.workerCode}-${year}-${String(counter.lastSeq).padStart(4, "0")}`;

  const scores = [data.technicalScore, data.interviewScore, data.teamworkScore, data.safetyScore].filter((n): n is number => n !== undefined);
  const overall = data.overallScore ?? (scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined);

  let grade: WorkerGrade | undefined = data.grade as WorkerGrade;
  if (!grade && overall !== undefined) {
    if (overall >= 85) grade = "A";
    else if (overall >= 70) grade = "B";
    else if (overall >= 55) grade = "C";
    else grade = "D";
  }

  return prisma.workerAssessment.create({
    data: {
      assessmentCode: code,
      workerId: data.workerId,
      assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : new Date(),
      interviewer: data.interviewer,
      technicalScore: data.technicalScore,
      interviewScore: data.interviewScore,
      teamworkScore: data.teamworkScore,
      safetyScore: data.safetyScore,
      overallScore: overall,
      grade,
      recommendation: data.recommendation,
      notes: data.notes,
      evidenceUrl: data.evidenceUrl,
    },
  });
}

export async function updateAssessment(id: string, data: Partial<AssessmentInput>) {
  const existing = await prisma.workerAssessment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Assessment tidak ditemukan");

  return prisma.workerAssessment.update({
    where: { id },
    data: {
      ...(data.technicalScore !== undefined && { technicalScore: data.technicalScore }),
      ...(data.interviewScore !== undefined && { interviewScore: data.interviewScore }),
      ...(data.teamworkScore !== undefined && { teamworkScore: data.teamworkScore }),
      ...(data.safetyScore !== undefined && { safetyScore: data.safetyScore }),
      ...(data.overallScore !== undefined && { overallScore: data.overallScore }),
      ...(data.grade !== undefined && { grade: data.grade as WorkerGrade }),
      ...(data.recommendation !== undefined && { recommendation: data.recommendation }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.evidenceUrl !== undefined && { evidenceUrl: data.evidenceUrl }),
    },
  });
}

export async function deleteAssessment(id: string) {
  const existing = await prisma.workerAssessment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Assessment tidak ditemukan");
  await prisma.workerAssessment.delete({ where: { id } });
}

export async function getWorkerAssessments(workerId: string) {
  return prisma.workerAssessment.findMany({
    where: { workerId },
    orderBy: { assessmentDate: "desc" },
  });
}
