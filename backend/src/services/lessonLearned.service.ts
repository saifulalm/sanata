/**
 * Lesson Learned Service
 * Continuous improvement from rework data
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export interface LessonLearnedInput {
  wbsStage?: string;
  qcRecordId?: string;
  title: string;
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  severity?: string;
  occurredAt?: Date;
}

export interface LessonLearnedFilters {
  wbsStage?: string;
  severity?: string;
  isResolved?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listLessonLearned(filters: LessonLearnedFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (filters.wbsStage) {
    where.wbsStage = filters.wbsStage;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }

  if (filters.isResolved !== undefined) {
    where.isResolved = filters.isResolved;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.lessonLearned.findMany({
      where,
      include: {
        qcRecord: {
          select: {
            id: true,
            qcCode: true,
            result: true,
            checkDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.lessonLearned.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, take: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getLessonLearned(id: string) {
  const lesson = await prisma.lessonLearned.findUnique({
    where: { id },
    include: {
      qcRecord: {
        select: {
          id: true,
          qcCode: true,
          result: true,
          wbsStage: true,
          checkDate: true,
          worker: {
            select: { id: true, name: true, workerCode: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    throw ApiError.notFound("Lesson learned tidak ditemukan");
  }

  return lesson;
}

export async function createLessonLearned(data: LessonLearnedInput, userId: string) {
  return prisma.lessonLearned.create({
    data: {
      wbsStage: data.wbsStage as any,
      qcRecordId: data.qcRecordId,
      title: data.title,
      description: data.description,
      rootCause: data.rootCause,
      correctiveAction: data.correctiveAction,
      preventiveAction: data.preventiveAction,
      severity: (data.severity || "MEDIUM") as any,
      occurredAt: data.occurredAt,
      createdById: userId,
    },
  });
}

export async function createFromRework(qcRecordId: string, userId: string) {
  // Get the QC record details
  const qcRecord = await prisma.qcRecord.findUnique({
    where: { id: qcRecordId },
    include: {
      worker: true,
      assignment: true,
    },
  });

  if (!qcRecord) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  // Create lesson learned from rework
  return prisma.lessonLearned.create({
    data: {
      wbsStage: qcRecord.wbsStage,
      qcRecordId: qcRecord.id,
      title: `Rework: ${qcRecord.itemDesc || qcRecord.qcCode}`,
      description: qcRecord.defectDesc || "Defect ditemukan saat QC inspection",
      rootCause: "Belum teridentifikasi",
      severity: "MEDIUM",
      occurredAt: qcRecord.checkDate,
      createdById: userId,
    },
  });
}

export async function updateLessonLearned(id: string, data: Partial<LessonLearnedInput>) {
  const existing = await prisma.lessonLearned.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Lesson learned tidak ditemukan");
  }

  return prisma.lessonLearned.update({
    where: { id },
    data: {
      ...(data.wbsStage !== undefined && { wbsStage: data.wbsStage as any }),
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.rootCause !== undefined && { rootCause: data.rootCause }),
      ...(data.correctiveAction !== undefined && { correctiveAction: data.correctiveAction }),
      ...(data.preventiveAction !== undefined && { preventiveAction: data.preventiveAction }),
      ...(data.severity && { severity: data.severity as any }),
    },
  });
}

export async function resolveLessonLearned(id: string, userId: string) {
  const existing = await prisma.lessonLearned.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Lesson learned tidak ditemukan");
  }

  return prisma.lessonLearned.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
    },
  });
}

export async function deleteLessonLearned(id: string) {
  const existing = await prisma.lessonLearned.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Lesson learned tidak ditemukan");
  }

  return prisma.lessonLearned.delete({
    where: { id },
  });
}

export async function getLessonLearnedByWbsStage(wbsStage: string) {
  return prisma.lessonLearned.findMany({
    where: {
      wbsStage: wbsStage as any,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnresolvedLessonLearned(wbsStage?: string) {
  const where: Record<string, unknown> = {
    isResolved: false,
  };

  if (wbsStage) {
    where.wbsStage = wbsStage;
  }

  return prisma.lessonLearned.findMany({
    where,
    orderBy: [
      { severity: "desc" },
      { createdAt: "desc" },
    ],
  });
}
