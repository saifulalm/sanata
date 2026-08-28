/**
 * Execution Service - Daily Work Documentation
 * Complete execution logging with GPS, photos, and progress tracking
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export type ExecutionInput = {
  assignmentId: string;
  workerId: string;
  logDate?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  progressPct?: number;
  photos?: Array<{ url: string; caption?: string; location?: string }>;
};

export type ExecutionFilters = {
  assignmentId?: string;
  workerId?: string;
  rabId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type DailyReportSummary = {
  date: string;
  totalExecutions: number;
  workersCount: number;
  assignmentsCount: number;
  averageProgress: number;
  executions: Array<{
    id: string;
    logCode: string;
    worker: { id: string; workerCode: string; name: string; role: string };
    assignment: { id: string; assignmentCode: string; workItem: string };
    progressPct: number;
    description?: string;
    locationName?: string;
  }>;
};

export async function listExecutions(filters: ExecutionFilters = {}) {
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
  if (filters.startDate || filters.endDate) {
    where.logDate = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate + "T23:59:59") }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.executionLog.findMany({
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
            rabId: true,
          },
        },
        photos: {
          orderBy: { order: "asc" },
          take: 5,
        },
      },
      orderBy: { logDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.executionLog.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, take: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getExecution(id: string) {
  const log = await prisma.executionLog.findUnique({
    where: { id },
    include: {
      worker: true,
      assignment: {
        include: {
          rab: { select: { id: true, number: true, title: true } },
        },
      },
      photos: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!log) {
    throw ApiError.notFound("Log tidak ditemukan");
  }

  return log;
}

export async function createExecution(data: ExecutionInput, userId: string) {
  // Validate assignment exists and get rabId
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

  // Generate log code
  const year = new Date().getFullYear();
  const counter = await prisma.santraCounter.upsert({
    where: { prefix: "LOG" },
    create: { prefix: "LOG", lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const logCode = `LOG-${year}-${String(counter.lastSeq).padStart(4, "0")}`;

  const logDate = data.logDate ? new Date(data.logDate) : new Date();
  const dateStr = data.logDate || new Date().toISOString().split("T")[0];

  // Create execution log
  const log = await prisma.executionLog.create({
    data: {
      logCode,
      assignmentId: data.assignmentId,
      workerId: data.workerId,
      logDate,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.locationName,
      progressPct: data.progressPct,
      photos: data.photos
        ? {
            create: data.photos.map((p, i) => ({
              url: p.url,
              caption: p.caption,
              location: p.location,
              order: i,
            })),
          }
        : undefined,
    },
    include: {
      photos: true,
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
    },
  });

  // Link to daily report if assignment has a rabId
  if (assignment.rabId && data.logDate) {
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        rabId: assignment.rabId,
        date: {
          gte: new Date(dateStr + "T00:00:00"),
          lte: new Date(dateStr + "T23:59:59"),
        },
      },
    });

    if (existingReport) {
      await prisma.executionLog.update({
        where: { id: log.id },
        data: { dailyReportId: existingReport.id },
      });
    }
  }

  // Update assignment progress if provided
  if (data.progressPct !== undefined && data.progressPct > assignment.progressPct) {
    await prisma.jobAssignment.update({
      where: { id: data.assignmentId },
      data: {
        progressPct: data.progressPct,
        status: data.progressPct >= 100 ? "COMPLETED" : data.progressPct > 0 ? "IN_PROGRESS" : "PENDING",
        actualStart: !assignment.actualStart ? new Date() : assignment.actualStart,
        actualEnd: data.progressPct >= 100 ? new Date() : undefined,
      },
    });
  }

  return log;
}

export async function updateExecution(
  id: string,
  data: Partial<ExecutionInput>
) {
  const existing = await prisma.executionLog.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Log tidak ditemukan");
  }

  return prisma.executionLog.update({
    where: { id },
    data: {
      description: data.description ?? existing.description,
      latitude: data.latitude ?? existing.latitude,
      longitude: data.longitude ?? existing.longitude,
      locationName: data.locationName ?? existing.locationName,
      progressPct: data.progressPct ?? existing.progressPct,
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
      photos: { orderBy: { order: "asc" } },
    },
  });
}

export async function deleteExecution(id: string) {
  const existing = await prisma.executionLog.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Log tidak ditemukan");
  }

  await prisma.executionLog.delete({ where: { id } });
  return { success: true };
}

export async function addExecutionPhoto(
  executionId: string,
  data: { url: string; caption?: string; location?: string }
) {
  const execution = await prisma.executionLog.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    throw ApiError.notFound("Execution tidak ditemukan");
  }

  // Get current photo count for ordering
  const photoCount = await prisma.executionPhoto.count({
    where: { logId: executionId },
  });

  return prisma.executionPhoto.create({
    data: {
      logId: executionId,
      url: data.url,
      caption: data.caption,
      location: data.location,
      order: photoCount,
    },
  });
}

export async function deleteExecutionPhoto(photoId: string) {
  const photo = await prisma.executionPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw ApiError.notFound("Photo tidak ditemukan");
  }

  await prisma.executionPhoto.delete({
    where: { id: photoId },
  });
}

export async function getWorkerExecutions(workerId: string, limit = 50) {
  return prisma.executionLog.findMany({
    where: { workerId },
    include: {
      assignment: {
        select: { assignmentCode: true, workItem: true },
      },
      photos: { orderBy: { order: "asc" }, take: 3 },
    },
    orderBy: { logDate: "desc" },
    take: limit,
  });
}

export async function getExecutionsByRab(rabId: string, limit = 100) {
  return prisma.executionLog.findMany({
    where: {
      assignment: { rabId },
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
      photos: {
        orderBy: { order: "asc" },
        take: 3,
      },
    },
    orderBy: { logDate: "desc" },
    take: limit,
  });
}

export async function getExecutionsByAssignment(assignmentId: string) {
  return prisma.executionLog.findMany({
    where: { assignmentId },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      photos: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { logDate: "asc" },
  });
}

export async function getDailyExecutionSummary(rabId: string, date: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const executions = await prisma.executionLog.findMany({
    where: {
      assignment: { rabId },
      logDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      worker: {
        select: { id: true, workerCode: true, name: true, role: true },
      },
      assignment: {
        select: { id: true, assignmentCode: true, workItem: true },
      },
    },
    orderBy: { logDate: "asc" },
  });

  const summary: DailyReportSummary = {
    date,
    totalExecutions: executions.length,
    workersCount: new Set(executions.map((e) => e.workerId)).size,
    assignmentsCount: new Set(executions.map((e) => e.assignmentId)).size,
    averageProgress:
      executions.length > 0
        ? Math.round(
            executions.reduce((sum, e) => sum + (e.progressPct || 0), 0) /
              executions.length
          )
        : 0,
    executions: executions.map((e) => ({
      id: e.id,
      logCode: e.logCode,
      worker: e.worker,
      assignment: e.assignment,
      progressPct: e.progressPct || 0,
      description: e.description || undefined,
      locationName: e.locationName || undefined,
    })),
  };

  return summary;
}

export async function getExecutionStats(rabId?: string) {
  const where = rabId ? { assignment: { rabId } } : {};

  const [total, withPhotos, withGps, avgProgress] = await Promise.all([
    prisma.executionLog.count({ where }),
    prisma.executionLog.count({
      where: { ...where, photos: { some: {} } },
    }),
    prisma.executionLog.count({
      where: { ...where, latitude: { not: null } },
    }),
    prisma.executionLog.aggregate({
      where: where,
      _avg: { progressPct: true },
    }),
  ]);

  return {
    total,
    withPhotos,
    withGps,
    avgProgress: Math.round(avgProgress._avg.progressPct || 0),
    photoCoverage: total > 0 ? Math.round((withPhotos / total) * 100) : 0,
    gpsCoverage: total > 0 ? Math.round((withGps / total) * 100) : 0,
  };
}
