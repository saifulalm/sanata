/**
 * Assignment Service
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export async function listAssignments(filters: {
  rabId?: string;
  status?: string;
  personId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const page = filters.page || 1;
  const take = filters.pageSize || 20;
  const skip = (page - 1) * take;

  const where: Record<string, unknown> = {};
  if (filters.rabId) where.rabId = filters.rabId;
  if (filters.status) where.status = filters.status;
  if (filters.personId) {
    where.OR = [
      { responsiblePersonId: filters.personId },
      { responsibleMandorId: filters.personId },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.jobAssignment.findMany({
      where,
      include: {
        responsiblePerson: { select: { id: true, workerCode: true, name: true, role: true } },
        responsibleMandor: { select: { id: true, workerCode: true, name: true, role: true } },
        rab: { select: { id: true, number: true, title: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.jobAssignment.count({ where }),
  ]);

  return { data: items, meta: { page, take, total, totalPages: Math.ceil(total / take) } };
}

export async function getAssignment(id: string) {
  const r = await prisma.jobAssignment.findUnique({
    where: { id },
    include: {
      responsiblePerson: true,
      responsibleMandor: true,
      rab: true,
      executions: { orderBy: { logDate: "desc" }, take: 10 },
      qcRecords: { orderBy: { checkDate: "desc" }, take: 5 },
    },
  });
  if (!r) throw ApiError.notFound("Assignment tidak ditemukan");
  return r;
}

export async function createAssignment(data: {
  rabId?: string;
  wbsCode?: string;
  workItem: string;
  methodRef?: string;
  responsiblePersonId?: string;
  responsibleMandorId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  scopeDescription?: string;
  priority?: number;
}) {
  const counter = await prisma.santraCounter.upsert({
    where: { prefix: "JOB" },
    create: { prefix: "JOB", lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const year = new Date().getFullYear();

  return prisma.jobAssignment.create({
    data: {
      assignmentCode: `JOB-${year}-${String(counter.lastSeq).padStart(4, "0")}`,
      rabId: data.rabId,
      wbsCode: data.wbsCode,
      workItem: data.workItem,
      methodRef: data.methodRef,
      responsiblePersonId: data.responsiblePersonId,
      responsibleMandorId: data.responsibleMandorId,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
      plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
      scopeDescription: data.scopeDescription,
      priority: data.priority || 5,
    },
  });
}

export async function updateAssignment(id: string, data: Partial<{
  workItem?: string;
  methodRef?: string;
  responsiblePersonId?: string;
  responsibleMandorId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  status?: AssignmentStatus;
  progressPct?: number;
}>) {
  const existing = await prisma.jobAssignment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Assignment tidak ditemukan");

  const updateData: Record<string, unknown> = {};
  if (data.workItem) updateData.workItem = data.workItem;
  if (data.methodRef !== undefined) updateData.methodRef = data.methodRef;
  if (data.responsiblePersonId !== undefined) updateData.responsiblePersonId = data.responsiblePersonId;
  if (data.responsibleMandorId !== undefined) updateData.responsibleMandorId = data.responsibleMandorId;
  if (data.plannedStart !== undefined) updateData.plannedStart = new Date(data.plannedStart);
  if (data.plannedEnd !== undefined) updateData.plannedEnd = new Date(data.plannedEnd);
  if (data.status) updateData.status = data.status;
  if (data.progressPct !== undefined) updateData.progressPct = data.progressPct;

  return prisma.jobAssignment.update({ where: { id }, data: updateData });
}

export async function updateStatus(id: string, status: AssignmentStatus) {
  const existing = await prisma.jobAssignment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Assignment tidak ditemukan");

  const updateData: Record<string, unknown> = { status };
  if (status === "IN_PROGRESS" && !existing.actualStart) updateData.actualStart = new Date();
  if (status === "COMPLETED") { updateData.progressPct = 100; updateData.actualEnd = new Date(); }

  return prisma.jobAssignment.update({ where: { id }, data: updateData });
}

export async function assignPerson(id: string, personId: string, mandorId?: string) {
  return prisma.jobAssignment.update({
    where: { id },
    data: { responsiblePersonId: personId, responsibleMandorId: mandorId },
  });
}

export async function getByRab(rabId: string) {
  return prisma.jobAssignment.findMany({
    where: { rabId },
    include: {
      responsiblePerson: { select: { id: true, workerCode: true, name: true } },
      responsibleMandor: { select: { id: true, workerCode: true, name: true } },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function getWorkerAssignments(workerId: string) {
  return prisma.jobAssignment.findMany({
    where: {
      OR: [
        { responsiblePersonId: workerId },
        { responsibleMandorId: workerId },
      ],
    },
    include: { rab: { select: { id: true, number: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
}
