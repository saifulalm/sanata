/**
 * Worker Service - Database Tenaga Kerja
 */

import { Prisma, ProjectRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

/***/
export type WorkerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
export type WorkerGrade = "A" | "B" | "C" | "D";

export interface WorkerFilters {
  role?: string;
  status?: WorkerStatus;
  search?: string;
  grade?: WorkerGrade;
}

/***/
export async function listWorkers(
  filters: WorkerFilters = {},
  pagination?: { skip: number; take: number }
) {
  const where: Prisma.WorkerWhereInput = {};

  if (filters.role) {
    where.role = filters.role as Prisma.WorkerWhereInput["role"];
  }
  if (filters.status) {
    where.status = filters.status as Prisma.WorkerWhereInput["status"];
  }
  if (filters.grade) {
    where.grade = filters.grade as Prisma.WorkerWhereInput["grade"];
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { workerCode: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }

  const [workers, total] = await Promise.all([
    prisma.worker.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.worker.count({ where }),
  ]);

  return { workers, total };
}

/***/
export async function getWorkerById(id: string) {
  const worker = await prisma.worker.findUnique({
    where: { id },
    include: {
      assessments: { orderBy: { assessmentDate: "desc" }, take: 5 },
      assignments: { where: { status: "IN_PROGRESS" }, take: 5 },
      kpis: { orderBy: { periodStart: "desc" }, take: 3 },
    },
  });

  if (!worker) throw ApiError.notFound("Tenaga kerja tidak ditemukan");
  return worker;
}

/***/
export async function getWorkerByCode(code: string) {
  const worker = await prisma.worker.findUnique({ where: { workerCode: code } });
  if (!worker) throw ApiError.notFound("Tenaga kerja tidak ditemukan");
  return worker;
}

/***/
export async function createWorker(data: {
  name: string;
  role: ProjectRole;
  phone?: string;
  address?: string;
  ktpNumber?: string;
  joinDate?: string;
  experienceYears?: number;
  skills?: string[];
  certificates?: string[];
  rate?: number;
  grade?: string;
}) {
  // Generate worker code
  const prefix = getRolePrefix(data.role);
  const counter = await getNextCounter(`WORKER-${prefix}`);
  const workerCode = `${prefix}-${String(counter).padStart(4, "0")}`;

  return prisma.worker.create({
    data: {
      workerCode,
      name: data.name,
      role: data.role,
      phone: data.phone,
      address: data.address,
      ktpNumber: data.ktpNumber,
      joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
      experienceYears: data.experienceYears,
      skills: data.skills || [],
      certificates: data.certificates || [],
      rate: data.rate,
      grade: (data.grade as WorkerGrade) || undefined,
      profileComplete: Boolean(data.name && data.phone && data.ktpNumber),
      ktpVerified: false,
    },
  });
}

/***/
export async function updateWorker(id: string, data: Partial<{
  name: string;
  phone: string;
  address: string;
  ktpNumber: string;
  ktpPhotoUrl: string;
  facePhotoUrl: string;
  status: WorkerStatus;
  grade: WorkerGrade;
  rate: number;
  skills: string[];
  certificates: string[];
  experienceYears: number;
  joinDate: string;
}>) {
  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Tenaga kerja tidak ditemukan");

  return prisma.worker.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.ktpNumber !== undefined && { ktpNumber: data.ktpNumber }),
      ...(data.ktpPhotoUrl !== undefined && { ktpPhotoUrl: data.ktpPhotoUrl }),
      ...(data.facePhotoUrl !== undefined && { facePhotoUrl: data.facePhotoUrl }),
      ...(data.status !== undefined && { status: data.status as WorkerStatus }),
      ...(data.grade !== undefined && { grade: data.grade as WorkerGrade }),
      ...(data.rate !== undefined && { rate: data.rate }),
      ...(data.skills !== undefined && { skills: data.skills }),
      ...(data.certificates !== undefined && { certificates: data.certificates }),
      ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
      ...(data.joinDate !== undefined && { joinDate: new Date(data.joinDate) }),
      profileComplete: Boolean(data.name && data.phone && data.ktpNumber),
    },
  });
}

/***/
export async function verifyWorker(id: string, verified: boolean) {
  return prisma.worker.update({
    where: { id },
    data: {
      ktpVerified: verified,
      profileComplete: verified,
    },
  });
}

/***/
export async function deleteWorker(id: string) {
  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Tenaga kerja tidak ditemukan");

  await prisma.worker.delete({ where: { id } });
}

/***/
export async function getAvailableWorkers(role?: string) {
  const where: Prisma.WorkerWhereInput = {
    status: "ACTIVE",
    profileComplete: true,
  };

  if (role) {
    where.role = role as Prisma.WorkerWhereInput["role"];
  }

  return prisma.worker.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      workerCode: true,
      name: true,
      role: true,
      grade: true,
      skills: true,
      ktpVerified: true,
    },
  });
}

/***/
export async function getWorkerStats() {
  const [total, active, byRole, byGrade] = await Promise.all([
    prisma.worker.count(),
    prisma.worker.count({ where: { status: "ACTIVE" } }),
    prisma.worker.groupBy({ by: ["role"], _count: true }),
    prisma.worker.groupBy({ by: ["grade"], _count: true }),
  ]);

  return {
    total,
    active,
    byRole: byRole.reduce((acc, r) => {
      acc[r.role] = r._count;
      return acc;
    }, {} as Record<string, number>),
    byGrade: byGrade.reduce((acc, g) => {
      if (g.grade) acc[g.grade] = g._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

// --- Helpers ---

function getRolePrefix(role: string): string {
  const roleMap: Record<string, string> = {
    // Mandor and supervisory roles
    MANDOR: "M",
    KEPALA_TUKANG: "M",
    DIREKTUR_UTAMA: "M",
    DIREKTUR: "M",
    MANAGER_PROYEK: "M",
    SITE_MANAGER: "M",
    PIMPINAN_PROYEK: "M",
    // Tukang Batu
    TUKANG_BATU: "T",
    // Tukang Kayu
    TUKANG_KAYU: "K",
    // Tukang Besi
    TUKANG_BESI: "B",
    // Operator
    OPERATOR: "O",
    // Pekerja & Staff
    PEKERJA: "P",
    STAF: "S",
    LAINNYA: "X",
  };
  return roleMap[role] || "X";
}

async function getNextCounter(prefix: string): Promise<number> {
  const counter = await prisma.santraCounter.upsert({
    where: { prefix },
    create: { prefix, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });

  return counter.lastSeq;
}
