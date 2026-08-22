import { Prisma, ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { money, percentOf, sum, toDecimal } from "@/utils/money";
import type { AhspInput, AhspUpdateInput } from "@/validators/ahsp.validator";

const withComponents = {
  components: {
    orderBy: { order: "asc" },
    include: { priceItem: true },
  },
} satisfies Prisma.AhspInclude;

type AhspWithComponents = Prisma.AhspGetPayload<{ include: typeof withComponents }>;

/**
 * Hitung harga satuan pekerjaan dari koefisien komponennya:
 *   biaya langsung = Σ (koefisien × harga satuan dasar)
 *   HSP            = biaya langsung + overhead & profit
 * Semua aritmatika memakai Decimal agar tidak ada galat pembulatan floating point.
 */
export function computeAhsp(ahsp: AhspWithComponents) {
  const lines = ahsp.components.map((c) => {
    const subtotal = money(toDecimal(c.coefficient).mul(c.priceItem.unitPrice));
    return {
      id: c.id,
      priceItemId: c.priceItemId,
      code: c.priceItem.code,
      name: c.priceItem.name,
      type: c.priceItem.type,
      unit: c.priceItem.unit,
      unitPrice: c.priceItem.unitPrice,
      coefficient: c.coefficient,
      subtotal,
    };
  });

  const byType = (type: ResourceType) =>
    sum(lines.filter((l) => l.type === type).map((l) => l.subtotal));

  const directCost = sum(lines.map((l) => l.subtotal));
  const overheadAmount = percentOf(directCost, ahsp.overheadPct);

  return {
    lines,
    breakdown: {
      labor: byType("LABOR"),
      material: byType("MATERIAL"),
      equipment: byType("EQUIPMENT"),
    },
    directCost,
    overheadAmount,
    unitPrice: money(directCost.plus(overheadAmount)),
  };
}

/** Bentuk AHSP + hasil perhitungannya untuk dikirim ke klien. */
export function serializeAhsp(ahsp: AhspWithComponents) {
  const computed = computeAhsp(ahsp);
  return { ...ahsp, computed };
}

export async function listAhsp(query: {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  category?: string;
  isActive?: string;
}) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.AhspWhereInput = {
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] }
      : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive === "true" } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ahsp.findMany({ where, skip, take, orderBy: { code: "asc" }, include: withComponents }),
    prisma.ahsp.count({ where }),
  ]);

  return { items: items.map(serializeAhsp), meta: buildMeta(page, pageSize, total) };
}

export async function getAhspById(id: string) {
  const ahsp = await prisma.ahsp.findUnique({ where: { id }, include: withComponents });
  if (!ahsp) throw ApiError.notFound("AHSP not found");
  return serializeAhsp(ahsp);
}

/** Harga satuan satu AHSP — dipakai saat menarik item AHSP ke dalam RAB. */
export async function getAhspUnitPrice(id: string) {
  const ahsp = await prisma.ahsp.findUnique({ where: { id }, include: withComponents });
  if (!ahsp) throw ApiError.notFound("AHSP not found");
  return { ahsp, unitPrice: computeAhsp(ahsp).unitPrice };
}

async function assertCodeAvailable(code: string, exceptId?: string) {
  const existing = await prisma.ahsp.findUnique({ where: { code } });
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict(`AHSP code "${code}" is already used`);
  }
}

async function assertPriceItemsExist(componentInputs: { priceItemId: string }[]) {
  const ids = [...new Set(componentInputs.map((c) => c.priceItemId))];
  if (ids.length === 0) return;
  const found = await prisma.priceItem.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw ApiError.badRequest("One or more price items do not exist");
}

export async function createAhsp(input: AhspInput) {
  await assertCodeAvailable(input.code);
  await assertPriceItemsExist(input.components);

  const created = await prisma.ahsp.create({
    data: {
      code: input.code,
      name: input.name,
      unit: input.unit,
      category: input.category ?? null,
      overheadPct: input.overheadPct !== undefined ? toDecimal(input.overheadPct) : undefined,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
      components: {
        create: input.components.map((c, index) => ({
          priceItemId: c.priceItemId,
          coefficient: toDecimal(c.coefficient),
          order: c.order ?? index,
        })),
      },
    },
    include: withComponents,
  });

  return serializeAhsp(created);
}

export async function updateAhsp(id: string, input: AhspUpdateInput) {
  const existing = await prisma.ahsp.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("AHSP not found");
  if (input.code) await assertCodeAvailable(input.code, id);
  if (input.components) await assertPriceItemsExist(input.components);

  // Komponen diganti utuh dalam satu transaksi supaya tidak ada state setengah jadi.
  const updated = await prisma.$transaction(async (tx) => {
    if (input.components) {
      await tx.ahspComponent.deleteMany({ where: { ahspId: id } });
      await tx.ahspComponent.createMany({
        data: input.components.map((c, index) => ({
          ahspId: id,
          priceItemId: c.priceItemId,
          coefficient: toDecimal(c.coefficient),
          order: c.order ?? index,
        })),
      });
    }

    return tx.ahsp.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.overheadPct !== undefined ? { overheadPct: toDecimal(input.overheadPct) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: withComponents,
    });
  });

  return serializeAhsp(updated);
}

export async function deleteAhsp(id: string) {
  const usage = await prisma.rabItem.count({ where: { ahspId: id } });
  if (usage > 0) {
    throw ApiError.badRequest(
      `Cannot delete: this AHSP is referenced by ${usage} RAB item(s). Deactivate it instead.`
    );
  }
  await prisma.ahsp.delete({ where: { id } });
}

/** Daftar kategori unik untuk filter di admin. */
export async function listAhspCategories() {
  const rows = await prisma.ahsp.findMany({
    where: { category: { not: null } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category).filter((c): c is string => Boolean(c));
}
