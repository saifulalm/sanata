import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import type { ToolCondition } from "@prisma/client";

// ============================================
// TYPES
// ============================================

interface ToolFilters {
  category?: string;
  owner?: string;
  condition?: ToolCondition;
  status?: "available" | "borrowed" | "needs_maintenance";
  search?: string;
}

interface CreateToolInput {
  name: string;
  category: string;
  trade?: string;
  minQuantity?: number;
  unit?: string;
  condition?: ToolCondition;
  owner?: string;
  personalOwnerId?: string;
  notes?: string;
  imageUrl?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  purchasePrice?: number;
  needsMaintenance?: boolean;
  maintenanceIntervalDays?: number;
  currentLocation?: string;
}

interface UpdateToolInput {
  name?: string;
  category?: string;
  trade?: string;
  minQuantity?: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  needsMaintenance?: boolean;
  maintenanceIntervalDays?: number;
  nextMaintenanceDate?: Date;
  currentLocation?: string;
}

// ============================================
// TOOL CRUD
// ============================================

async function listTools(filters: ToolFilters = {}): Promise<unknown[]> {
  const where: Record<string, unknown> = { isActive: true };

  if (filters.category) where.category = filters.category;
  if (filters.owner) where.owner = filters.owner;
  if (filters.condition) where.currentCondition = filters.condition;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { toolCode: { contains: filters.search } },
      { brand: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status === "borrowed") {
    where.loans = { some: { status: "OPEN" } };
  } else if (filters.status === "available") {
    where.loans = { none: { status: { in: ["OPEN", "OVERDUE"] } } };
  } else if (filters.status === "needs_maintenance") {
    where.AND = [
      {
        OR: [
          { needsMaintenance: true },
          { currentCondition: { in: ["FAIR", "DAMAGED"] } },
        ],
      },
    ];
  }

  return prisma.masterTool.findMany({
    where,
    include: {
      personalOwner: { select: { id: true, workerCode: true, name: true } },
      photos: { where: { isPrimary: true }, take: 1 },
      loans: {
        where: { status: { in: ["OPEN", "OVERDUE"] } },
        include: { worker: { select: { id: true, name: true, role: true } } },
        take: 1,
      },
      _count: { select: { loans: true, photos: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

async function getTool(id: string): Promise<unknown> {
  return prisma.masterTool
    .findUnique({
      where: { id },
      include: {
        personalOwner: true,
        photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        loans: {
          where: { status: { in: ["OPEN", "OVERDUE"] } },
          include: { worker: { select: { id: true, workerCode: true, name: true, role: true } } },
          orderBy: { issuedAt: "desc" },
          take: 1,
        },
        maintenanceLogs: { orderBy: { performedDate: "desc" }, take: 5 },
      },
    })
    .then((t) => {
      if (!t) throw ApiError.notFound("Alat tidak ditemukan");
      return t;
    });
}

async function getToolByCode(code: string): Promise<unknown> {
  return prisma.masterTool
    .findUnique({
      where: { toolCode: code },
      include: { personalOwner: true },
    })
    .then((t) => {
      if (!t) throw ApiError.notFound("Alat tidak ditemukan");
      return t;
    });
}

async function createTool(data: CreateToolInput, userId: string): Promise<unknown> {
  const prefix = "TL";
  const counter = await prisma.santraCounter.upsert({
    where: { prefix },
    create: { prefix, lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const year = new Date().getFullYear();
  const toolCode =
    prefix + "-" + year + "-" + String(counter.lastSeq).padStart(4, "0");

  const nextMaintenanceDate = data.maintenanceIntervalDays
    ? new Date(Date.now() + data.maintenanceIntervalDays * 24 * 60 * 60 * 1000)
    : null;

  const tool = await prisma.masterTool.create({
    data: {
      toolCode,
      name: data.name,
      category: data.category,
      trade: data.trade,
      minQuantity: data.minQuantity,
      unit: data.unit,
      condition: data.condition,
      owner: data.owner,
      personalOwnerId: data.personalOwnerId,
      notes: data.notes,
      imageUrl: data.imageUrl || null,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      purchaseDate: data.purchaseDate,
      warrantyExpiry: data.warrantyExpiry,
      purchasePrice: data.purchasePrice,
      needsMaintenance: data.needsMaintenance,
      maintenanceIntervalDays: data.maintenanceIntervalDays,
      nextMaintenanceDate,
      currentLocation: data.currentLocation,
    },
  });

  await prisma.toolActivity.create({
    data: {
      toolId: tool.id,
      type: "CREATED",
      description: `Alat "${tool.name}" (${tool.toolCode}) ditambahkan ke inventory`,
      metadata: { createdBy: userId },
    },
  });

  return tool;
}

async function updateTool(
  id: string,
  data: UpdateToolInput,
  userId?: string
): Promise<unknown> {
  const existing = await prisma.masterTool
    .findUnique({ where: { id } })
    .then((e) => {
      if (!e) throw ApiError.notFound("Alat tidak ditemukan");
      return e;
    });

  const nextMaintenanceDate =
    data.maintenanceIntervalDays != null
      ? data.maintenanceIntervalDays > 0
        ? new Date(
            Date.now() + data.maintenanceIntervalDays * 24 * 60 * 60 * 1000
          )
        : null
      : undefined;

  const updated = await prisma.masterTool.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      trade: data.trade,
      minQuantity: data.minQuantity,
      unit: data.unit,
      notes: data.notes,
      imageUrl: data.imageUrl || null,
      needsMaintenance: data.needsMaintenance,
      maintenanceIntervalDays: data.maintenanceIntervalDays,
      nextMaintenanceDate,
      currentLocation: data.currentLocation,
    },
  });

  if (data.imageUrl !== undefined && data.imageUrl !== existing.imageUrl) {
    await prisma.toolActivity.create({
      data: {
        toolId: id,
        type: "IMAGE_UPDATED",
        description: "Foto alat diupdate",
        performedById: userId,
        metadata: { oldImage: existing.imageUrl, newImage: data.imageUrl },
      },
    });
  }

  return updated;
}

async function updateCondition(
  id: string,
  condition: ToolCondition,
  userId?: string
): Promise<unknown> {
  const existing = await prisma.masterTool
    .findUnique({ where: { id } })
    .then((e) => {
      if (!e) throw ApiError.notFound("Alat tidak ditemukan");
      return e;
    });

  const updated = await prisma.masterTool.update({
    where: { id },
    data: { currentCondition: condition },
  });

  await prisma.toolActivity.create({
    data: {
      toolId: id,
      type: "CONDITION_UPDATE",
      description: `Kondisi diubah dari ${existing.currentCondition} ke ${condition}`,
      performedById: userId,
      metadata: { before: existing.currentCondition, after: condition },
    },
  });

  return updated;
}

async function deleteTool(id: string): Promise<{ success: boolean }> {
  const existing = await prisma.masterTool
    .findUnique({ where: { id } })
    .then((e) => {
      if (!e) throw ApiError.notFound("Alat tidak ditemukan");
      return e;
    });

  await prisma.masterTool.update({ where: { id }, data: { isActive: false } });

  await prisma.toolActivity.create({
    data: {
      toolId: id,
      type: "STOCK_UPDATE",
      description: `Alat "${existing.name}" (${existing.toolCode}) dinonaktifkan dari inventory`,
      metadata: { action: "deactivated" },
    },
  });

  return { success: true };
}

// ============================================
// TOOL BORROWING / LOANS
// ============================================

async function borrowTool(
  toolId: string,
  data: {
    quantity: number;
    borrowerName: string;
    dueDate?: Date;
    notes?: string;
  },
  borrowerId: string
): Promise<unknown> {
  const tool = await prisma.masterTool
    .findUnique({ where: { id: toolId } })
    .then((t) => {
      if (!t) throw ApiError.notFound("Alat tidak ditemukan");
      return t;
    });

  const existingLoan = await prisma.toolLoan.findFirst({
    where: { toolId, status: { in: ["OPEN", "OVERDUE"] } },
  });
  if (existingLoan) {
    throw ApiError.conflict(
      "Alat sedang dipinjam oleh " + existingLoan.borrowerName
    );
  }

  const loan = await prisma.toolLoan.create({
    data: {
      toolId,
      borrowerId,
      borrowerName: data.borrowerName,
      quantity: data.quantity,
      issuedById: borrowerId,
      dueDate: data.dueDate,
      notes: data.notes,
    },
  });

  await prisma.toolActivity.create({
    data: {
      toolId,
      type: "LOAN_ISSUED",
      description: `Dipinjamkan ${data.quantity}x ke ${data.borrowerName}`,
      performedById: borrowerId,
      metadata: { loanId: loan.id, quantity: data.quantity },
    },
  });

  return loan;
}

async function returnTool(
  loanId: string,
  condition: ToolCondition,
  notes: string,
  userId: string
): Promise<unknown> {
  const loan = await prisma.toolLoan
    .findUnique({ where: { id: loanId } })
    .then((l) => {
      if (!l) throw ApiError.notFound("Pinjaman tidak ditemukan");
      return l;
    });

  if (loan.status === "RETURNED") {
    throw ApiError.conflict("Alat sudah dikembalikan");
  }

  const updatedLoan = await prisma.toolLoan.update({
    where: { id: loanId },
    data: {
      status: "RETURNED",
      returnedAt: new Date(),
      returnedCondition: condition,
      returnNotes: notes,
    },
  });

  await prisma.masterTool.update({
    where: { id: loan.toolId },
    data: { currentCondition: condition },
  });

  await prisma.toolActivity.create({
    data: {
      toolId: loan.toolId,
      type: "LOAN_RETURNED",
      description: `Dikembalikan dalam kondisi ${condition}`,
      performedById: userId,
      metadata: { loanId, condition },
    },
  });

  return updatedLoan;
}

interface LoanFilters {
  toolId?: string;
  workerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

async function listLoans(filters: LoanFilters = {}): Promise<{ data: unknown[]; meta: { page: number; pageSize: number; total: number } }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (filters.toolId) where.toolId = filters.toolId;
  if (filters.workerId) where.workerId = filters.workerId;
  if (filters.status) where.status = filters.status;

  const [loans, total] = await Promise.all([
    prisma.toolLoan.findMany({
      where,
      include: {
        tool: { select: { id: true, name: true, toolCode: true } },
        worker: { select: { id: true, name: true, workerCode: true, role: true } },
      },
      orderBy: { issuedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.toolLoan.count({ where }),
  ]);

  return {
    data: loans,
    meta: { page, pageSize, total },
  };
}

async function getLoan(id: string): Promise<unknown> {
  const loan = await prisma.toolLoan.findUnique({
    where: { id },
    include: {
      tool: true,
      worker: true,
    },
  });
  if (!loan) throw ApiError.notFound("Pinjaman tidak ditemukan");
  return loan;
}

async function getActiveLoans(toolId?: string): Promise<unknown[]> {
  const where: Record<string, unknown> = { status: { in: ["OPEN", "OVERDUE"] } };
  if (toolId) where.toolId = toolId;

  return prisma.toolLoan.findMany({
    where,
    include: {
      tool: {
        select: { id: true, name: true, toolCode: true, currentCondition: true },
      },
      worker: { select: { id: true, name: true, role: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}

async function getLoanHistory(toolId: string, limit = 50): Promise<unknown[]> {
  return prisma.toolLoan.findMany({
    where: { toolId },
    include: {
      worker: { select: { id: true, name: true } },
    },
    orderBy: { issuedAt: "desc" },
    take: limit,
  });
}

// ============================================
// MAINTENANCE
// ============================================

async function scheduleMaintenance(
  toolId: string,
  data: { scheduledDate: Date; type: string; notes?: string },
  userId: string
): Promise<unknown> {
  const tool = await prisma.masterTool
    .findUnique({ where: { id: toolId } })
    .then((t) => {
      if (!t) throw ApiError.notFound("Alat tidak ditemukan");
      return t;
    });

  const maintenance = await prisma.toolMaintenance.create({
    data: {
      toolId,
      type: data.type,
      scheduledDate: data.scheduledDate,
      notes: data.notes,
      status: "SCHEDULED",
      performedById: userId,
    },
  });

  await prisma.masterTool.update({
    where: { id: toolId },
    data: { needsMaintenance: true },
  });

  await prisma.toolActivity.create({
    data: {
      toolId,
      type: "MAINTENANCE_SCHEDULED",
      description: `Maintenance terjadwal pada ${data.scheduledDate
        .toISOString()
        .split("T")[0]}`,
      performedById: userId,
      metadata: { maintenanceId: maintenance.id },
    },
  });

  return maintenance;
}

async function completeMaintenance(
  maintenanceId: string,
  data: {
    performedDate: Date;
    notes: string;
    nextDate?: Date;
    cost?: number;
  },
  userId: string
): Promise<unknown> {
  const maintenance = await prisma.toolMaintenance
    .findUnique({ where: { id: maintenanceId } })
    .then((m) => {
      if (!m) throw ApiError.notFound("Maintenance tidak ditemukan");
      return m;
    });

  const updated = await prisma.toolMaintenance.update({
    where: { id: maintenanceId },
    data: {
      status: "COMPLETED",
      performedDate: data.performedDate,
      completedById: userId,
      notes: data.notes,
      cost: data.cost,
    },
  });

  const toolUpdate: Record<string, unknown> = { needsMaintenance: false };
  if (data.nextDate) {
    toolUpdate.nextMaintenanceDate = data.nextDate;
  }

  await prisma.masterTool.update({
    where: { id: maintenance.toolId },
    data: toolUpdate,
  });

  await prisma.toolActivity.create({
    data: {
      toolId: maintenance.toolId,
      type: "MAINTENANCE_COMPLETED",
      description: `Maintenance ${maintenance.type} selesai`,
      performedById: userId,
      metadata: { maintenanceId, cost: data.cost },
    },
  });

  return updated;
}

async function getMaintenanceHistory(toolId: string): Promise<unknown[]> {
  return prisma.toolMaintenance.findMany({
    where: { toolId },
    include: { completedBy: { select: { id: true, name: true } } },
    orderBy: { performedDate: "desc" },
  });
}

// ============================================
// TOOL ACTIVITY / AUDIT LOG
// ============================================

async function getToolActivities(toolId: string, limit = 50): Promise<unknown[]> {
  return prisma.toolActivity.findMany({
    where: { toolId },
    include: { performedBy: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ============================================
// DASHBOARD / STATS
// ============================================

async function getToolStats(): Promise<unknown> {
  const [total, available, borrowed, overdue, maintenance] = await Promise.all([
    prisma.masterTool.count({ where: { isActive: true } }),
    prisma.masterTool.count({
      where: {
        isActive: true,
        loans: { none: { status: { in: ["OPEN", "OVERDUE"] } } },
      },
    }),
    prisma.toolLoan.count({ where: { status: { in: ["OPEN", "OVERDUE"] } } }),
    prisma.toolLoan.count({ where: { status: "OVERDUE" } }),
    prisma.masterTool.count({
      where: {
        isActive: true,
        OR: [
          { needsMaintenance: true },
          { currentCondition: { in: ["FAIR", "DAMAGED"] } },
        ],
      },
    }),
  ]);

  return { total, available, borrowed, overdue, needsMaintenance: maintenance };
}

async function markOverdueLoans(): Promise<number> {
  const now = new Date();
  const result = await prisma.toolLoan.updateMany({
    where: {
      status: "OPEN",
      issuedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // older than 7 days
    },
    data: { status: "OVERDUE" },
  });
  return result.count;
}

// ============================================
// LOAN STATS
// ============================================

async function getLoanStats(): Promise<unknown> {
  const [total, open, returned, overdue, byTool] = await Promise.all([
    prisma.toolLoan.count(),
    prisma.toolLoan.count({ where: { status: "OPEN" } }),
    prisma.toolLoan.count({ where: { status: "RETURNED" } }),
    prisma.toolLoan.count({ where: { status: "OVERDUE" } }),
    prisma.toolLoan.groupBy({
      by: ["toolId"],
      _count: true,
      where: { status: { in: ["OPEN", "OVERDUE"] } },
    }),
  ]);

  const borrowedTools = byTool.length;

  return {
    total,
    open,
    returned,
    overdue,
    borrowedTools,
  };
}

async function getUpcomingMaintenance(days = 30): Promise<unknown[]> {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return prisma.masterTool.findMany({
    where: {
      isActive: true,
      nextMaintenanceDate: { lte: cutoff, not: null },
    },
    include: {
      personalOwner: { select: { id: true, name: true } },
      _count: {
        select: { loans: { where: { status: { in: ["OPEN", "OVERDUE"] } } } },
      },
    },
    orderBy: { nextMaintenanceDate: "asc" },
  });
}

// ============================================
// PHOTO MANAGEMENT
// ============================================

async function getCategories(): Promise<unknown[]> {
  const categories = await prisma.masterTool.groupBy({
    by: ["category"],
    _count: true,
    where: { isActive: true },
    orderBy: { category: "asc" },
  });
  return categories.map((c) => ({
    category: c.category,
    count: c._count,
  }));
}

async function addToolPhoto(
  toolId: string,
  data: { url: string; isPrimary?: boolean }
): Promise<unknown> {
  if (data.isPrimary) {
    await prisma.toolPhoto.updateMany({
      where: { toolId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.toolPhoto.create({
    data: { toolId, url: data.url, isPrimary: data.isPrimary ?? false },
  });
}

async function deleteToolPhoto(photoId: string): Promise<{ success: boolean }> {
  await prisma.toolPhoto.delete({ where: { id: photoId } });
  return { success: true };
}

// ============================================
// EXPORT
// ============================================

export {
  // CRUD
  listTools,
  getTool,
  getToolByCode,
  createTool,
  updateTool,
  updateCondition,
  deleteTool,
  // Borrowing
  listLoans,
  getLoan,
  borrowTool,
  returnTool,
  getActiveLoans,
  getLoanHistory,
  markOverdueLoans,
  // Maintenance
  scheduleMaintenance,
  completeMaintenance,
  getMaintenanceHistory,
  // Activity
  getToolActivities,
  // Dashboard
  getToolStats,
  getLoanStats,
  getUpcomingMaintenance,
  getCategories,
  // Photos
  addToolPhoto,
  deleteToolPhoto,
};
