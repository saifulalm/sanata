import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { money } from "@/utils/money";
import type { PriceItemInput, PriceItemUpdateInput } from "@/validators/priceItem.validator";

type ListQuery = {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  type?: string;
  isActive?: string;
};

export async function listPriceItems(query: ListQuery) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.PriceItemWhereInput = {
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] }
      : {}),
    ...(query.type ? { type: query.type as Prisma.EnumResourceTypeFilter["equals"] } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive === "true" } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.priceItem.findMany({ where, skip, take, orderBy: [{ type: "asc" }, { code: "asc" }] }),
    prisma.priceItem.count({ where }),
  ]);

  return { items, meta: buildMeta(page, pageSize, total) };
}

export async function getPriceItemById(id: string) {
  const item = await prisma.priceItem.findUnique({ where: { id } });
  if (!item) throw ApiError.notFound("Price item not found");
  return item;
}

async function assertCodeAvailable(code: string, exceptId?: string) {
  const existing = await prisma.priceItem.findUnique({ where: { code } });
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict(`Price item code "${code}" is already used`);
  }
}

export async function createPriceItem(input: PriceItemInput) {
  await assertCodeAvailable(input.code);
  return prisma.priceItem.create({
    data: {
      code: input.code,
      name: input.name,
      type: input.type,
      unit: input.unit,
      unitPrice: money(input.unitPrice),
      region: input.region ?? null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updatePriceItem(id: string, input: PriceItemUpdateInput) {
  await getPriceItemById(id);
  if (input.code) await assertCodeAvailable(input.code, id);

  return prisma.priceItem.update({
    where: { id },
    data: {
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: money(input.unitPrice) } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deletePriceItem(id: string) {
  const usage = await prisma.ahspComponent.count({ where: { priceItemId: id } });
  if (usage > 0) {
    throw ApiError.badRequest(
      `Cannot delete: this price item is still used by ${usage} AHSP component(s). Deactivate it instead.`
    );
  }
  await prisma.priceItem.delete({ where: { id } });
}
