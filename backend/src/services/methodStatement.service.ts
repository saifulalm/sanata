/**
 * Method Statement Service
 * Master method statements per WBS stage following QC Flow PDF
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export interface MethodStatementInput {
  methodCode: string;
  wbsStage: string;
  workItem: string;
  scope?: string;
  reference?: string;
  tools?: string[];
  materials?: string[];
  precondition?: string;
  sequence?: object[];
  criticalPoints?: string;
  acceptanceCriteria: string;
  tolerance?: string;
  holdPoint?: boolean;
  safety?: string;
  evidenceRequirement?: string[];
  reworkProcedure?: string;
  responsibleRoles?: string[];
  lessonLearned?: string;
}

export interface MethodStatementFilters {
  wbsStage?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listMethodStatements(filters: MethodStatementFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    isActive: filters.isActive !== undefined ? filters.isActive : true,
  };

  if (filters.wbsStage) {
    where.wbsStage = filters.wbsStage;
  }

  if (filters.search) {
    where.OR = [
      { methodCode: { contains: filters.search, mode: "insensitive" } },
      { workItem: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.methodStatement.findMany({
      where,
      orderBy: [{ wbsStage: "asc" }, { methodCode: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.methodStatement.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, take: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getMethodStatement(id: string) {
  const statement = await prisma.methodStatement.findUnique({
    where: { id },
    include: {
      templates: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          jobAssignments: true,
          templates: true,
        },
      },
    },
  });

  if (!statement) {
    throw ApiError.notFound("Method statement tidak ditemukan");
  }

  return statement;
}

export async function getMethodStatementByCode(code: string) {
  const statement = await prisma.methodStatement.findUnique({
    where: { methodCode: code },
    include: {
      templates: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!statement) {
    throw ApiError.notFound("Method statement tidak ditemukan");
  }

  return statement;
}

export async function createMethodStatement(data: MethodStatementInput) {
  // Check for duplicate method code
  const existing = await prisma.methodStatement.findUnique({
    where: { methodCode: data.methodCode },
  });

  if (existing) {
    throw ApiError.badRequest("Method code sudah ada");
  }

  return prisma.methodStatement.create({
    data: {
      methodCode: data.methodCode,
      wbsStage: data.wbsStage as any,
      workItem: data.workItem,
      scope: data.scope,
      reference: data.reference,
      tools: data.tools || [],
      materials: data.materials || [],
      precondition: data.precondition,
      sequence: data.sequence ? data.sequence as any : undefined,
      criticalPoints: data.criticalPoints,
      acceptanceCriteria: data.acceptanceCriteria,
      tolerance: data.tolerance,
      holdPoint: data.holdPoint || false,
      safety: data.safety,
      evidenceRequirement: data.evidenceRequirement || [],
      reworkProcedure: data.reworkProcedure,
      responsibleRoles: data.responsibleRoles || [],
      lessonLearned: data.lessonLearned,
    },
  });
}

export async function updateMethodStatement(id: string, data: Partial<MethodStatementInput>) {
  const existing = await prisma.methodStatement.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Method statement tidak ditemukan");
  }

  // Check for duplicate method code if being changed
  if (data.methodCode && data.methodCode !== existing.methodCode) {
    const duplicate = await prisma.methodStatement.findUnique({
      where: { methodCode: data.methodCode },
    });
    if (duplicate) {
      throw ApiError.badRequest("Method code sudah ada");
    }
  }

  return prisma.methodStatement.update({
    where: { id },
    data: {
      ...(data.methodCode && { methodCode: data.methodCode }),
      ...(data.wbsStage && { wbsStage: data.wbsStage as any }),
      ...(data.workItem && { workItem: data.workItem }),
      ...(data.scope !== undefined && { scope: data.scope }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.tools !== undefined && { tools: data.tools }),
      ...(data.materials !== undefined && { materials: data.materials }),
      ...(data.precondition !== undefined && { precondition: data.precondition }),
      ...(data.sequence !== undefined && { sequence: data.sequence as any }),
      ...(data.criticalPoints !== undefined && { criticalPoints: data.criticalPoints }),
      ...(data.acceptanceCriteria && { acceptanceCriteria: data.acceptanceCriteria }),
      ...(data.tolerance !== undefined && { tolerance: data.tolerance }),
      ...(data.holdPoint !== undefined && { holdPoint: data.holdPoint }),
      ...(data.safety !== undefined && { safety: data.safety }),
      ...(data.evidenceRequirement !== undefined && { evidenceRequirement: data.evidenceRequirement }),
      ...(data.reworkProcedure !== undefined && { reworkProcedure: data.reworkProcedure }),
      ...(data.responsibleRoles !== undefined && { responsibleRoles: data.responsibleRoles }),
      ...(data.lessonLearned !== undefined && { lessonLearned: data.lessonLearned }),
      revision: existing.revision + 1,
    },
  });
}

export async function deleteMethodStatement(id: string) {
  const existing = await prisma.methodStatement.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          jobAssignments: true,
          templates: true,
        },
      },
    },
  });

  if (!existing) {
    throw ApiError.notFound("Method statement tidak ditemukan");
  }

  // Soft delete instead of hard delete if there are related records
  if (existing._count.jobAssignments > 0 || existing._count.templates > 0) {
    return prisma.methodStatement.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return prisma.methodStatement.delete({
    where: { id },
  });
}

export async function getMethodStatementsByWbsStage(wbsStage: string) {
  return prisma.methodStatement.findMany({
    where: {
      wbsStage: wbsStage as any,
      isActive: true,
    },
    orderBy: { methodCode: "asc" },
  });
}

// Get WBS stages with method count
export async function getWbsStagesOverview() {
  const stages = await prisma.methodStatement.groupBy({
    by: ["wbsStage"],
    _count: { id: true },
    where: { isActive: true },
  });

  return stages.map((stage) => ({
    wbsStage: stage.wbsStage,
    methodCount: stage._count.id,
  }));
}
