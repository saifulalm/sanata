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
      currentCondition: data.condition as ToolCondition || "GOOD" as ToolCondition,
      owner: data.owner as "COMPANY" | "PERSONAL" | "RENTED",
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

// Alias: issueTool is the same as borrowTool
async function issueTool(
  toolId: string,
  data: {
    workerId: string;
    quantity?: number;
    dueDate?: Date;
    notes?: string;
    issuedPhotoUrl?: string;
    issuedLocation?: string;
  },
  issuedById: string
): Promise<unknown> {
  return borrowTool(toolId, data, issuedById);
}

async function borrowTool(
  toolId: string,
  data: {
    workerId: string;
    quantity?: number;
    dueDate?: Date;
    notes?: string;
    issuedPhotoUrl?: string;
    issuedLocation?: string;
  },
  issuedById: string
): Promise<unknown> {
  const tool = await prisma.masterTool
    .findUnique({ where: { id: toolId } })
    .then((t) => {
      if (!t) throw ApiError.notFound("Alat tidak ditemukan");
      return t;
    });

  const worker = await prisma.worker
    .findUnique({ where: { id: data.workerId } })
    .then((w) => {
      if (!w) throw ApiError.notFound("Pekerja tidak ditemukan");
      return w;
    });

  const existingLoan = await prisma.toolLoan.findFirst({
    where: { toolId, status: { in: ["OPEN", "OVERDUE"] } },
  });
  if (existingLoan) {
    throw ApiError.conflict(
      "Alat sedang dipinjam"
    );
  }

  // Generate loan code
  const loanPrefix = "LN";
  const loanCounter = await prisma.santraCounter.upsert({
    where: { prefix: loanPrefix },
    create: { prefix: loanPrefix, lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const year = new Date().getFullYear();
  const loanCode = loanPrefix + "-" + year + "-" + String(loanCounter.lastSeq).padStart(4, "0");

  const loan = await prisma.toolLoan.create({
    data: {
      toolId,
      workerId: data.workerId,
      loanCode,
      issuedById,
      notes: data.notes,
      issuedPhotoUrl: data.issuedPhotoUrl,
      issuedLocation: data.issuedLocation,
    },
  });

  await prisma.toolActivity.create({
    data: {
      toolId,
      type: "LOAN_ISSUED",
      description: `Dipinjamkan ke ${worker.name}`,
      performedById: issuedById,
      metadata: { loanId: loan.id, workerId: data.workerId },
    },
  });

  return loan;
}

async function returnTool(
  loanId: string,
  condition: ToolCondition,
  notes: string,
  _userId: string,
  photoUrl?: string,
  returnLocation?: string
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
      notes: notes || (returnLocation ? `Lokasi: ${returnLocation}` : undefined),
      returnedPhotoUrl: photoUrl || null,
      returnLocation: returnLocation || null,
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
      performedById: _userId,
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

async function getLoansByTool(toolId: string): Promise<unknown[]> {
  return prisma.toolLoan.findMany({
    where: { toolId },
    include: {
      tool: { select: { id: true, name: true, toolCode: true } },
      worker: { select: { id: true, name: true, workerCode: true, role: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}

async function getLoansByWorker(workerId: string): Promise<unknown[]> {
  return prisma.toolLoan.findMany({
    where: { workerId },
    include: {
      tool: { select: { id: true, name: true, toolCode: true } },
      worker: { select: { id: true, name: true, workerCode: true, role: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}

// ============================================
// MAINTENANCE
// ============================================

async function scheduleMaintenance(
  data: { toolId: string; scheduledDate: Date; type: string; notes?: string },
  performedById?: string
): Promise<unknown> {
  const { toolId, ...rest } = data;
  const tool = await prisma.masterTool
    .findUnique({ where: { id: toolId } })
    .then((t) => {
      if (!t) throw ApiError.notFound("Alat tidak ditemukan");
      return t;
    });

  // Generate maintenance code
  const maintPrefix = "MT";
  const maintCounter = await prisma.santraCounter.upsert({
    where: { prefix: maintPrefix },
    create: { prefix: maintPrefix, lastSeq: 0 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  const year = new Date().getFullYear();
  const maintenanceCode = maintPrefix + "-" + year + "-" + String(maintCounter.lastSeq).padStart(4, "0");

  const maintenance = await prisma.toolMaintenance.create({
    data: {
      toolId,
      maintenanceCode,
      type: rest.type as "PREVENTIVE" | "CORRECTIVE" | "INSPECTION",
      description: rest.notes || `Maintenance scheduled`,
      scheduledDate: rest.scheduledDate,
      notes: rest.notes,
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
      description: `Maintenance terjadwal pada ${rest.scheduledDate
        .toISOString()
        .split("T")[0]}`,
      performedById,
      metadata: { maintenanceId: maintenance.id },
    },
  });

  return maintenance;
}

async function completeMaintenance(
  maintenanceId: string,
  data: {
    performedDate: Date;
    notes?: string;
    nextDate?: Date;
    cost?: number;
    conditionAfter?: ToolCondition;
  },
  _userId?: string
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
      performedDate: data.performedDate,
      notes: data.notes,
      cost: data.cost,
      conditionAfter: data.conditionAfter,
      performedById: _userId,
    },
  });

  const toolUpdate: Record<string, unknown> = { needsMaintenance: false };
  if (data.nextDate) {
    toolUpdate.nextMaintenanceDate = data.nextDate;
  }
  if (data.conditionAfter) {
    toolUpdate.currentCondition = data.conditionAfter;
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
      performedById: _userId,
      metadata: { maintenanceId, cost: data.cost },
    },
  });

  return updated;
}

async function getMaintenanceHistory(toolId: string): Promise<unknown[]> {
  return prisma.toolMaintenance.findMany({
    where: { toolId },
    orderBy: { performedDate: "desc" },
  });
}

// Alias for controller compatibility
async function getToolMaintenance(toolId: string): Promise<unknown[]> {
  return getMaintenanceHistory(toolId);
}

// ============================================
// MAINTENANCE CALENDAR
// ============================================

interface MaintenanceCalendarFilters {
  month: number;
  year: number;
}

async function getMaintenanceCalendar(
  month: number,
  year: number
): Promise<unknown> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const scheduled = await prisma.toolMaintenance.findMany({
    where: {
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      tool: { select: { id: true, name: true, toolCode: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const completed = await prisma.toolMaintenance.findMany({
    where: {
      performedDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      tool: { select: { id: true, name: true, toolCode: true } },
    },
    orderBy: { performedDate: "asc" },
  });

  return {
    month,
    year,
    scheduled,
    completed,
    totalScheduled: scheduled.length,
    totalCompleted: completed.length,
  };
}

// ============================================
// TOOL ACTIVITY / AUDIT LOG
// ============================================

interface ActivityFilters {
  toolId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

async function getToolActivities(filters: ActivityFilters): Promise<{ data: unknown[]; meta: { page: number; pageSize: number; total: number } }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (filters.toolId) where.toolId = filters.toolId;
  if (filters.type) where.type = filters.type;

  const [activities, total] = await Promise.all([
    prisma.toolActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.toolActivity.count({ where }),
  ]);

  return {
    data: activities,
    meta: { page, pageSize, total },
  };
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

  return { total, available, borrowed, overdue, needsMaintenance: maintenance, open: borrowed };
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
  const tools = await prisma.masterTool.findMany({
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

  // Add computed fields
  const now = new Date();
  return tools.map(tool => {
    const nextDate = new Date(tool.nextMaintenanceDate!);
    const diffTime = nextDate.getTime() - now.getTime();
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDue < 0;

    return {
      ...tool,
      toolName: tool.name,
      toolCode: tool.toolCode,
      category: tool.category,
      isOverdue,
      daysUntilDue,
      type: tool.needsMaintenance ? 'MAINTENANCE_NEEDED' : 'SCHEDULED',
    };
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

async function getToolPhotos(toolId: string): Promise<unknown[]> {
  return prisma.toolPhoto.findMany({
    where: { toolId },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
}

async function addToolPhoto(
  data: { toolId: string; url: string; caption?: string; isPrimary?: boolean; order?: number }
): Promise<unknown> {
  if (data.isPrimary) {
    await prisma.toolPhoto.updateMany({
      where: { toolId: data.toolId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.toolPhoto.create({
    data: {
      toolId: data.toolId,
      url: data.url,
      caption: data.caption,
      isPrimary: data.isPrimary ?? false,
      order: data.order ?? 0,
    },
  });
}

async function deleteToolPhoto(photoId: string): Promise<{ success: boolean }> {
  await prisma.toolPhoto.delete({ where: { id: photoId } });
  return { success: true };
}

async function setPrimaryPhoto(photoId: string): Promise<unknown> {
  const photo = await prisma.toolPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw ApiError.notFound("Foto tidak ditemukan");

  await prisma.toolPhoto.updateMany({
    where: { toolId: photo.toolId, isPrimary: true },
    data: { isPrimary: false },
  });

  return prisma.toolPhoto.update({
    where: { id: photoId },
    data: { isPrimary: true },
  });
}

// ============================================
// QR CODE GENERATION
// ============================================

interface QrCodeOptions {
  size?: number;
  margin?: number;
}

async function generateToolQrCode(
  toolId: string,
  options: QrCodeOptions = {}
): Promise<{ toolId: string; toolCode: string; name: string; url: string }> {
  const tool = await prisma.masterTool.findUnique({
    where: { id: toolId },
    select: { toolCode: true, name: true },
  });
  if (!tool) throw ApiError.notFound("Alat tidak ditemukan");

  // Generate QR code data - returns URL for frontend to render
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const toolUrl = `${baseUrl}/admin/workforce/tools/${toolId}`;

  return {
    toolId,
    toolCode: tool.toolCode,
    name: tool.name,
    url: toolUrl,
  };
}

// ============================================
// TOOL UTILIZATION STATS
// ============================================

async function getToolUtilization(toolId: string): Promise<unknown> {
  const tool = await prisma.masterTool.findUnique({
    where: { id: toolId },
    select: { id: true, name: true, toolCode: true },
  });
  if (!tool) throw ApiError.notFound("Alat tidak ditemukan");

  const [totalLoans, activeLoans, overdueLoans, maintenanceCount] = await Promise.all([
    prisma.toolLoan.count({ where: { toolId } }),
    prisma.toolLoan.count({ where: { toolId, status: { in: ["OPEN", "OVERDUE"] } } }),
    prisma.toolLoan.count({ where: { toolId, status: "OVERDUE" } }),
    prisma.toolMaintenance.count({ where: { toolId } }),
  ]);

  const loansThisMonth = await prisma.toolLoan.count({
    where: {
      toolId,
      issuedAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  // Get loan history for duration calculation
  const returnedLoans = await prisma.toolLoan.findMany({
    where: {
      toolId,
      status: "RETURNED",
      returnedAt: { not: null },
    },
    select: { issuedAt: true, returnedAt: true },
  });

  // Calculate average duration
  let averageLoanDuration = 0;
  if (returnedLoans.length > 0) {
    const totalDays = returnedLoans.reduce((sum, loan) => {
      const issued = new Date(loan.issuedAt).getTime();
      const returned = new Date(loan.returnedAt!).getTime();
      return sum + Math.ceil((returned - issued) / (1000 * 60 * 60 * 24));
    }, 0);
    averageLoanDuration = Math.round(totalDays / returnedLoans.length);
  }

  // Get most borrowed by worker
  const borrowedByWorker = await prisma.toolLoan.groupBy({
    by: ['workerId'],
    _count: true,
    where: { toolId },
    orderBy: { _count: { workerId: 'desc' } },
    take: 1,
  });

  let mostBorrowedBy = null;
  if (borrowedByWorker.length > 0) {
    const worker = await prisma.worker.findUnique({
      where: { id: borrowedByWorker[0].workerId },
      select: { id: true, name: true },
    });
    if (worker) {
      mostBorrowedBy = {
        workerId: worker.id,
        workerName: worker.name,
        count: borrowedByWorker[0]._count,
      };
    }
  }

  // Calculate utilization rate (percentage of days borrowed in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentLoans = await prisma.toolLoan.findMany({
    where: {
      toolId,
      issuedAt: { gte: thirtyDaysAgo },
    },
    select: { issuedAt: true, returnedAt: true },
  });

  let totalDaysBorrowed = 0;
  const now = new Date();
  for (const loan of recentLoans) {
    const start = new Date(loan.issuedAt);
    const end = loan.returnedAt ? new Date(loan.returnedAt) : now;
    totalDaysBorrowed += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  const utilizationRate = Math.min(100, Math.round((totalDaysBorrowed / 30) * 100));

  // Get last borrowed date
  const lastLoan = await prisma.toolLoan.findFirst({
    where: { toolId },
    orderBy: { issuedAt: 'desc' },
    select: { issuedAt: true },
  });

  return {
    toolId: tool.id,
    toolName: tool.name,
    toolCode: tool.toolCode,
    totalLoans,
    activeLoans,
    overdueLoans,
    returnedLoans: returnedLoans.length,
    maintenanceCount,
    loansThisMonth,
    averageLoanDuration,
    utilizationRate,
    totalDaysBorrowed,
    lastBorrowedAt: lastLoan?.issuedAt?.toISOString() || null,
    mostBorrowedBy,
  };
}

// ============================================
// ENHANCED LIST WITH PAGINATION
// ============================================

interface EnhancedToolFilters extends ToolFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  owner?: string;
  condition?: ToolCondition;
  status?: "available" | "borrowed" | "needs_maintenance";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function listToolsEnhanced(
  filters: EnhancedToolFilters = {}
): Promise<{ data: unknown[]; meta: { page: number; pageSize: number; total: number } }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { isActive: true };

  if (filters.category) where.category = filters.category;
  if (filters.owner) where.owner = filters.owner;
  if (filters.condition) where.currentCondition = filters.condition;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { toolCode: { contains: filters.search } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status === "borrowed") {
    where.loans = { some: { status: { in: ["OPEN", "OVERDUE"] } } };
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

  const orderBy: Record<string, string>[] = [];
  if (filters.sortBy) {
    orderBy.push({ [filters.sortBy]: filters.sortOrder || "asc" });
  } else {
    orderBy.push({ category: "asc" }, { name: "asc" });
  }

  const [tools, total] = await Promise.all([
    prisma.masterTool.findMany({
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
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.masterTool.count({ where }),
  ]);

  return {
    data: tools,
    meta: { page, pageSize, total },
  };
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
  issueTool, // alias for borrowTool
  returnTool,
  getActiveLoans,
  getLoanHistory,
  getLoansByTool,
  getLoansByWorker,
  markOverdueLoans,
  markOverdueLoans as markOverdue, // alias
  // Maintenance
  scheduleMaintenance,
  completeMaintenance,
  getMaintenanceHistory,
  getToolMaintenance, // alias for getMaintenanceHistory
  getMaintenanceCalendar,
  getUpcomingMaintenance,
  // Activity
  getToolActivities,
  // Dashboard
  getToolStats,
  getLoanStats,
  getCategories,
  // Photos
  getToolPhotos,
  addToolPhoto,
  deleteToolPhoto,
  setPrimaryPhoto,
  // QR Code
  generateToolQrCode,
  generateToolQrCode as getToolQrCode, // alias
  // Utilization
  getToolUtilization,
  // Enhanced
  listToolsEnhanced,
};
