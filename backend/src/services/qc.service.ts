/**
 * QC Service - Quality Control Records
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export type QcResult = "PASS" | "FAIL" | "REWORK";

export interface QcRecordInput {
  assignmentId: string;
  workerId: string;
  itemDesc?: string;
  criteria?: string;
  measurement?: string;
  result: QcResult;
  defectDesc?: string;
}

export interface QcFilters {
  assignmentId?: string;
  workerId?: string;
  rabId?: string;
  result?: QcResult;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function listQcRecords(filters: QcFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (filters.assignmentId) {
    where.assignmentId = filters.assignmentId;
  }
  if (filters.workerId) {
    where.workerId = filters.workerId;
  }
  if (filters.rabId) {
    where.assignment = { rabId: filters.rabId };
  }
  if (filters.result) {
    where.result = filters.result;
  }
  if (filters.startDate || filters.endDate) {
    where.checkDate = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate + "T23:59:59") }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.qcRecord.findMany({
      where,
      include: {
        worker: {
          select: { id: true, workerCode: true, name: true, role: true },
        },
        assignment: {
          select: { id: true, assignmentCode: true, workItem: true },
        },
        photos: {
          orderBy: { order: "asc" },
          take: 5,
        },
      },
      orderBy: { checkDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.qcRecord.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, take: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getQcRecord(id: string) {
  const record = await prisma.qcRecord.findUnique({
    where: { id },
    include: {
      worker: true,
      assignment: {
        include: {
          rab: { select: { id: true, number: true, title: true } },
        },
      },
      photos: { orderBy: { order: "asc" } },
      reworkOf: true,
      reworkChain: {
        orderBy: { checkDate: "asc" },
        include: { photos: true },
      },
    },
  });

  if (!record) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  return record;
}

export async function createQcRecord(data: QcRecordInput, userId: string) {
  // Validate assignment exists
  const assignment = await prisma.jobAssignment.findUnique({
    where: { id: data.assignmentId },
  });
  if (!assignment) {
    throw ApiError.badRequest("Assignment tidak ditemukan");
  }

  // Validate worker exists
  const worker = await prisma.worker.findUnique({
    where: { id: data.workerId },
  });
  if (!worker) {
    throw ApiError.badRequest("Worker tidak ditemukan");
  }

  // Generate QC code
  const year = new Date().getFullYear();
  const counter = await prisma.santraCounter.upsert({
    where: { prefix: "QC" },
    create: { prefix: "QC", lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const qcCode = `QC-${year}-${String(counter.lastSeq).padStart(4, "0")}`;

  return prisma.qcRecord.create({
    data: {
      qcCode,
      assignmentId: data.assignmentId,
      workerId: data.workerId,
      itemDesc: data.itemDesc,
      criteria: data.criteria,
      measurement: data.measurement,
      result: data.result,
      defectDesc: data.defectDesc,
      isRework: data.result === "REWORK",
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
      photos: true,
    },
  });
}

export async function approveQcRecord(id: string, userId: string) {
  const record = await prisma.qcRecord.findUnique({
    where: { id },
  });

  if (!record) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  return prisma.qcRecord.update({
    where: { id },
    data: {
      approvedById: userId,
      approvedAt: new Date(),
    },
  });
}

export async function createRework(
  id: string,
  data: { defectDesc: string; workerId?: string },
  userId: string
) {
  const originalRecord = await prisma.qcRecord.findUnique({
    where: { id },
    include: { assignment: true },
  });

  if (!originalRecord) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  // Generate new QC code for rework
  const year = new Date().getFullYear();
  const counter = await prisma.santraCounter.upsert({
    where: { prefix: "QC" },
    create: { prefix: "QC", lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const qcCode = `QC-${year}-${String(counter.lastSeq).padStart(4, "0")}`;

  // Mark original as rework
  await prisma.qcRecord.update({
    where: { id },
    data: { isRework: true },
  });

  // Create new QC record for rework
  return prisma.qcRecord.create({
    data: {
      qcCode,
      assignmentId: originalRecord.assignmentId,
      workerId: data.workerId || originalRecord.workerId,
      itemDesc: originalRecord.itemDesc,
      criteria: originalRecord.criteria,
      result: "REWORK",
      defectDesc: data.defectDesc,
      isRework: true,
      reworkOfId: id,
      approvedById: userId,
      approvedAt: new Date(),
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
      reworkOf: true,
    },
  });
}

export async function getQcStats(rabId?: string) {
  const where = rabId
    ? { assignment: { rabId } }
    : {};

  const [total, pass, fail, rework] = await Promise.all([
    prisma.qcRecord.count({ where }),
    prisma.qcRecord.count({ where: { ...where, result: "PASS" } }),
    prisma.qcRecord.count({ where: { ...where, result: "FAIL" } }),
    prisma.qcRecord.count({ where: { ...where, result: "REWORK" } }),
  ]);

  return { total, pass, fail, rework };
}

export async function deleteQcRecord(id: string) {
  const record = await prisma.qcRecord.findUnique({
    where: { id },
  });

  if (!record) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  await prisma.qcRecord.delete({
    where: { id },
  });
}
