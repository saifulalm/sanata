import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";

/** Role enum values for signatories. */
type ProjectRole = "DIREKTUR_UTAMA" | "DIREKTUR" | "MANAGER_PROYEK" | "SITE_MANAGER" | "PIMPINAN_PROYEK" | "KEPALA_TUKANG" | "TUKANG_BATU" | "TUKANG_KAYU" | "TUKANG_BESI" | "OPERATOR" | "MANDOR" | "PEKERJA" | "STAF" | "LAINNYA";

export interface SignatoryInput {
  name: string;
  title: string;
  role?: ProjectRole | null;
  department?: string | null;
}

export async function listSignatories(query: {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  isActive?: string;
}) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.SignatoryWhereInput = {
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { title: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.isActive === "active" ? { isActive: true } : {}),
    ...(query.isActive === "inactive" ? { isActive: false } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.signatory.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
    }),
    prisma.signatory.count({ where }),
  ]);

  return { items, meta: buildMeta(page, pageSize, total) };
}

export async function getSignatoryById(id: string) {
  const signatory = await prisma.signatory.findUnique({ where: { id } });
  if (!signatory) throw ApiError.notFound("Penanda tangan tidak ditemukan");
  return signatory;
}

export async function createSignatory(input: SignatoryInput) {
  const signatory = await prisma.signatory.create({
    data: {
      name: input.name.trim(),
      title: input.title.trim(),
      role: input.role ?? undefined,
      department: input.department?.trim() || null,
      isActive: true,
    },
  });
  return signatory;
}

export async function updateSignatory(id: string, input: Partial<SignatoryInput>) {
  const existing = await prisma.signatory.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Penanda tangan tidak ditemukan");

  const signatory = await prisma.signatory.update({
    where: { id },
    data: {
      name: input.name?.trim() ?? existing.name,
      title: input.title?.trim() ?? existing.title,
      ...(input.role !== undefined
        ? { role: input.role === null ? null : input.role }
        : {}),
      ...(input.department !== undefined
        ? { department: input.department?.trim() || null }
        : {}),
    },
  });
  return signatory;
}

/** Soft delete — tidak menghilangkan data historique di surat yang sudah terbit. */
export async function deleteSignatory(id: string) {
  const existing = await prisma.signatory.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Penanda tangan tidak ditemukan");

  // Pastikan tidak ada quotation/letter aktif yang mengacara signatory ini.
  const activeQuotations = await prisma.quotation.count({
    where: { signatoryId: id, status: { in: ["SENT", "ACCEPTED"] } },
  });
  const activeLetters = await prisma.projectLetter.count({
    where: { signatoryId: id, status: { in: ["SIGNED", "PAID", "ISSUED"] } },
  });

  if (activeQuotations > 0 || activeLetters > 0) {
    // Soft delete — nonaktifkan saja
    return prisma.signatory.update({ where: { id }, data: { isActive: false } });
  }

  return prisma.signatory.delete({ where: { id } });
}
