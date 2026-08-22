import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

/** Enum values for ProjectRole. */
type ProjectRole = "DIREKTUR_UTAMA" | "DIREKTUR" | "MANAGER_PROYEK" | "SITE_MANAGER" | "PIMPINAN_PROYEK" | "KEPALA_TUKANG" | "TUKANG_BATU" | "TUKANG_KAYU" | "TUKANG_BESI" | "OPERATOR" | "MANDOR" | "PEKERJA" | "STAF" | "LAINNYA";

/** Semua peran yang tersedia di sistem. Seed otomatis saat startup jika kosong. */
const DEFAULT_WORKFORCE_ROLES: Array<{ role: ProjectRole; label: string; order: number }> = [
  { role: "DIREKTUR_UTAMA", label: "Directeur Utama", order: 1 },
  { role: "DIREKTUR", label: "Directeur", order: 2 },
  { role: "MANAGER_PROYEK", label: "Manager Proyek", order: 3 },
  { role: "SITE_MANAGER", label: "Site Manager", order: 4 },
  { role: "PIMPINAN_PROYEK", label: "Pidalgo Proyek", order: 5 },
  { role: "KEPALA_TUKANG", label: "Kepala Tukang", order: 10 },
  { role: "MANDOR", label: "Mandor", order: 11 },
  { role: "TUKANG_BATU", label: "Tukang Batu", order: 12 },
  { role: "TUKANG_KAYU", label: "Tukang Kayu", order: 13 },
  { role: "TUKANG_BESI", label: "Tukang Besi", order: 14 },
  { role: "OPERATOR", label: "Operator", order: 15 },
  { role: "PEKERJA", label: "Pekerja", order: 20 },
  { role: "STAF", label: "Staf", order: 30 },
  { role: "LAINNYA", label: "Lainnya", order: 99 },
];

/** Pastikan seed peran awal ada di database. */
export async function ensureWorkforceRoles() {
  const count = await prisma.workforceRole.count();
  if (count > 0) return;

  await prisma.workforceRole.createMany({
    data: DEFAULT_WORKFORCE_ROLES,
    skipDuplicates: true,
  });
}

export async function listWorkforceRoles() {
  return prisma.workforceRole.findMany({
    orderBy: { order: "asc" },
  });
}

export async function toggleWorkforceRole(id: string, isActive: boolean) {
  const existing = await prisma.workforceRole.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Peran tidak ditemukan");

  return prisma.workforceRole.update({ where: { id }, data: { isActive } });
}

export async function updateWorkforceRoleLabel(id: string, label: string, order: number) {
  const existing = await prisma.workforceRole.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Peran tidak ditemukan");

  return prisma.workforceRole.update({ where: { id }, data: { label: label.trim(), order } });
}

export async function upsertWorkforceRole(role: ProjectRole, label: string, order: number) {
  return prisma.workforceRole.upsert({
    where: { role },
    create: { role, label, order, isActive: true },
    update: { label, order },
  });
}
