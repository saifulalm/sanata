/**
 * QC Template Service
 * Checklist templates per WBS stage following QC Flow PDF Page 4
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export interface QcTemplateItem {
  itemDesc: string;
  criteria: string;
  tolerance?: string;
  isMandatory: boolean;
  order: number;
}

export interface QcTemplateInput {
  wbsStage: string;
  methodCode?: string;
  name: string;
  description?: string;
  items: QcTemplateItem[];
}

export interface QcTemplateFilters {
  wbsStage?: string;
  methodCode?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listQcTemplates(filters: QcTemplateFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    isActive: filters.isActive !== undefined ? filters.isActive : true,
  };

  if (filters.wbsStage) {
    where.wbsStage = filters.wbsStage;
  }

  if (filters.methodCode) {
    where.methodCode = filters.methodCode;
  }

  const [items, total] = await Promise.all([
    prisma.qcTemplate.findMany({
      where,
      include: {
        methodStatement: {
          select: { methodCode: true, workItem: true, wbsStage: true },
        },
        _count: {
          select: { qcRecords: true },
        },
      },
      orderBy: [{ wbsStage: "asc" }, { name: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.qcTemplate.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, take: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getQcTemplate(id: string) {
  const template = await prisma.qcTemplate.findUnique({
    where: { id },
    include: {
      methodStatement: true,
      _count: {
        select: { qcRecords: true },
      },
    },
  });

  if (!template) {
    throw ApiError.notFound("QC template tidak ditemukan");
  }

  return template;
}

export async function getQcTemplateByWbsStage(wbsStage: string) {
  const templates = await prisma.qcTemplate.findMany({
    where: {
      wbsStage: wbsStage as any,
      isActive: true,
    },
    include: {
      methodStatement: {
        select: { methodCode: true, workItem: true, acceptanceCriteria: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return templates;
}

export async function createQcTemplate(data: QcTemplateInput) {
  return prisma.qcTemplate.create({
    data: {
      wbsStage: data.wbsStage as any,
      methodCode: data.methodCode,
      name: data.name,
      description: data.description,
      items: data.items as any,
    },
    include: {
      methodStatement: {
        select: { methodCode: true, workItem: true },
      },
    },
  });
}

export async function updateQcTemplate(id: string, data: Partial<QcTemplateInput>) {
  const existing = await prisma.qcTemplate.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("QC template tidak ditemukan");
  }

  return prisma.qcTemplate.update({
    where: { id },
    data: {
      ...(data.wbsStage && { wbsStage: data.wbsStage as any }),
      ...(data.methodCode !== undefined && { methodCode: data.methodCode }),
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.items && { items: data.items as any }),
    },
    include: {
      methodStatement: {
        select: { methodCode: true, workItem: true },
      },
    },
  });
}

export async function deleteQcTemplate(id: string) {
  const existing = await prisma.qcTemplate.findUnique({
    where: { id },
    include: {
      _count: {
        select: { qcRecords: true },
      },
    },
  });

  if (!existing) {
    throw ApiError.notFound("QC template tidak ditemukan");
  }

  // Soft delete if there are related QC records
  if (existing._count.qcRecords > 0) {
    return prisma.qcTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return prisma.qcTemplate.delete({
    where: { id },
  });
}

// Get template with items parsed
export async function getQcTemplateWithItems(id: string) {
  const template = await getQcTemplate(id);

  return {
    ...template,
    items: typeof template.items === "string"
      ? JSON.parse(template.items as string)
      : template.items,
  };
}
