/**
 * QC Service - Quality Control Records
 * Extended with WBS Stage, Method Statement, Hold Point, GPS/Weather tracking
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export type QcResult = "PASS" | "FAIL" | "REWORK";
export type CheckType = "PRE_CHECK" | "POST_CHECK" | "FINAL_CHECK";

export interface QcRecordInput {
  assignmentId: string;
  workerId: string;
  itemDesc?: string;
  criteria?: string;
  measurement?: string;
  tolerance?: string;
  result: QcResult;
  defectDesc?: string;
  // WBS & Method
  wbsStage?: string;
  methodCode?: string;
  checkType?: CheckType;
  templateId?: string;
  // Hold Point
  holdPoint?: boolean;
  // Traceable Data
  latitude?: number;
  longitude?: number;
  weather?: string;
  temperature?: number;
  notes?: string;
}

export interface QcFilters {
  assignmentId?: string;
  workerId?: string;
  rabId?: string;
  result?: QcResult;
  wbsStage?: string;
  methodCode?: string;
  checkType?: CheckType;
  holdPoint?: boolean;
  isReleased?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface QcChecklistItem {
  itemDesc: string;
  criteria: string;
  measurement?: string;
  tolerance?: string;
  result?: QcResult;
  isMandatory: boolean;
  notes?: string;
}

export interface QcChecklistInput {
  assignmentId: string;
  workerId: string;
  wbsStage: string;
  methodCode?: string;
  templateId?: string;
  checkType: CheckType;
  holdPoint?: boolean;
  latitude?: number;
  longitude?: number;
  weather?: string;
  temperature?: number;
  items: QcChecklistItem[];
  notes?: string;
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
  // WBS & Method filters
  if (filters.wbsStage) {
    where.wbsStage = filters.wbsStage;
  }
  if (filters.methodCode) {
    where.methodCode = filters.methodCode;
  }
  if (filters.checkType) {
    where.checkType = filters.checkType;
  }
  if (filters.holdPoint !== undefined) {
    where.holdPoint = filters.holdPoint;
  }
  if (filters.isReleased !== undefined) {
    where.isReleased = filters.isReleased;
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
          select: {
            id: true,
            assignmentCode: true,
            workItem: true,
            wbsStage: true,
            methodCode: true,
            responsiblePerson: {
              select: { id: true, name: true, workerCode: true }
            }
          },
        },
        photos: {
          orderBy: { order: "asc" },
          take: 5,
        },
        reworkOf: {
          select: { id: true, qcCode: true },
        },
        methodStatement: {
          select: { methodCode: true, workItem: true, wbsStage: true },
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
      methodStatement: true,
      template: true,
      approvalLogs: {
        orderBy: { createdAt: "desc" },
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
      tolerance: data.tolerance,
      result: data.result,
      defectDesc: data.defectDesc,
      isRework: data.result === "REWORK",
      // WBS & Method
      wbsStage: data.wbsStage as any,
      methodCode: data.methodCode,
      checkType: data.checkType as any || "POST_CHECK",
      templateId: data.templateId,
      // Hold Point
      holdPoint: data.holdPoint || false,
      // Traceable Data
      latitude: data.latitude,
      longitude: data.longitude,
      weather: data.weather,
      temperature: data.temperature,
      notes: data.notes,
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
      photos: true,
      methodStatement: {
        select: { methodCode: true, workItem: true, wbsStage: true },
      },
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

// ============================================================
// Hold Point & Release System
// ============================================================

export async function releaseHoldPoint(id: string, userId: string, note?: string) {
  const record = await prisma.qcRecord.findUnique({
    where: { id },
  });

  if (!record) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  if (!record.holdPoint) {
    throw ApiError.badRequest("QC ini bukan hold point");
  }

  if (record.isReleased) {
    throw ApiError.badRequest("QC ini sudah di-release");
  }

  // Update QC record
  const updated = await prisma.qcRecord.update({
    where: { id },
    data: {
      isReleased: true,
      releasedById: userId,
      releasedAt: new Date(),
    },
  });

  // Create approval log
  await prisma.qcApprovalLog.create({
    data: {
      qcId: id,
      approverId: userId,
      approverName: "System",
      approverRole: "QC_RELEASE",
      status: "APPROVED",
      note: note || "Hold point released",
    },
  });

  return updated;
}

// ============================================================
// Approval Log System
// ============================================================

export async function addApprovalLog(
  qcId: string,
  data: {
    approverId: string;
    approverName?: string;
    approverRole?: string;
    status: string;
    note?: string;
  }
) {
  const record = await prisma.qcRecord.findUnique({
    where: { id: qcId },
  });

  if (!record) {
    throw ApiError.notFound("QC record tidak ditemukan");
  }

  return prisma.qcApprovalLog.create({
    data: {
      qcId,
      approverId: data.approverId,
      approverName: data.approverName,
      approverRole: data.approverRole,
      status: data.status,
      note: data.note,
    },
  });
}

export async function getApprovalLogs(qcId: string) {
  return prisma.qcApprovalLog.findMany({
    where: { qcId },
    orderBy: { createdAt: "desc" },
  });
}

// ============================================================
// Extended Stats
// ============================================================

export async function getQcStatsExtended(rabId?: string) {
  const where = rabId
    ? { assignment: { rabId } }
    : {};

  const [total, pass, fail, rework, pending, released, holdPoints] = await Promise.all([
    prisma.qcRecord.count({ where }),
    prisma.qcRecord.count({ where: { ...where, result: "PASS" } }),
    prisma.qcRecord.count({ where: { ...where, result: "FAIL" } }),
    prisma.qcRecord.count({ where: { ...where, result: "REWORK" } }),
    prisma.qcRecord.count({ where: { ...where, approvedById: null } }),
    prisma.qcRecord.count({ where: { ...where, isReleased: true } }),
    prisma.qcRecord.count({ where: { ...where, holdPoint: true } }),
  ]);

  return {
    total,
    pass,
    fail,
    rework,
    pending,
    released,
    holdPoints,
    passRate: total > 0 ? Math.round((pass / total) * 100) : 0,
    reworkRate: total > 0 ? Math.round((rework / total) * 100) : 0,
  };
}

export async function getQcStatsByWbsStage(rabId?: string) {
  const where = rabId
    ? { assignment: { rabId } }
    : {};

  const stats = await prisma.qcRecord.groupBy({
    by: ["wbsStage"],
    where: {
      ...where,
      wbsStage: { not: null },
    },
    _count: { id: true },
  });

  const result: Record<string, { total: number; pass: number; fail: number; rework: number }> = {};

  for (const stat of stats) {
    const passCount = await prisma.qcRecord.count({
      where: {
        ...where,
        wbsStage: stat.wbsStage,
        result: "PASS",
      },
    });
    const failCount = await prisma.qcRecord.count({
      where: {
        ...where,
        wbsStage: stat.wbsStage,
        result: "FAIL",
      },
    });
    const reworkCount = await prisma.qcRecord.count({
      where: {
        ...where,
        wbsStage: stat.wbsStage,
        result: "REWORK",
      },
    });

    result[stat.wbsStage!] = {
      total: stat._count.id,
      pass: passCount,
      fail: failCount,
      rework: reworkCount,
    };
  }

  return result;
}

// ============================================================
// QC Checklist - Batch Create from Template
// ============================================================

export async function createQcFromTemplate(data: QcChecklistInput, userId: string) {
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

  // Create single QC record with all checklist items in notes
  const notes = JSON.stringify({
    checklistItems: data.items,
    notes: data.notes,
  });

  return prisma.qcRecord.create({
    data: {
      qcCode,
      assignmentId: data.assignmentId,
      workerId: data.workerId,
      wbsStage: data.wbsStage as any,
      methodCode: data.methodCode,
      templateId: data.templateId,
      checkType: data.checkType as any,
      holdPoint: data.holdPoint || false,
      latitude: data.latitude,
      longitude: data.longitude,
      weather: data.weather,
      temperature: data.temperature,
      notes,
      result: data.items.every(item => item.result === "PASS") ? "PASS" : "FAIL",
      defectDesc: data.items.some(item => item.result === "FAIL")
        ? `Found ${data.items.filter(item => item.result === "FAIL").length} failed items`
        : undefined,
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
      methodStatement: {
        select: { methodCode: true, workItem: true, wbsStage: true },
      },
    },
  });
}
