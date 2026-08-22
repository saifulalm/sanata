import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { money, percentOf, sum, toDecimal } from "@/utils/money";
import type { RabInput, RabSectionInput, RabUpdateInput } from "@/validators/rab.validator";

const withSections = {
  sections: {
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.RabInclude;

type RabWithSections = Prisma.RabGetPayload<{ include: typeof withSections }>;

/**
 * Totalisasi RAB, dihitung ulang setiap kali RAB ditulis:
 *   jumlah item  = volume × harga satuan
 *   subtotal     = Σ jumlah item
 *   diskon       = subtotal × discountPct
 *   DPP          = subtotal − diskon
 *   PPN          = DPP × taxPct
 *   total        = DPP + PPN
 */
function computeTotals(
  sections: { items: { volume: Prisma.Decimal; unitPrice: Prisma.Decimal }[] }[],
  taxPct: Prisma.Decimal | string | number,
  discountPct: Prisma.Decimal | string | number
) {
  const itemAmounts = sections.flatMap((s) =>
    s.items.map((i) => money(toDecimal(i.volume).mul(i.unitPrice)))
  );

  const subtotal = sum(itemAmounts);
  const discountAmount = percentOf(subtotal, discountPct);
  const taxableBase = money(subtotal.minus(discountAmount));
  const taxAmount = percentOf(taxableBase, taxPct);
  const total = money(taxableBase.plus(taxAmount));

  return { subtotal, discountAmount, taxableBase, taxAmount, total };
}

/** Nomor RAB otomatis: RAB/<tahun>/<urut 3 digit>. */
async function generateNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `RAB/${year}/`;
  const last = await tx.rab.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const nextSeq = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

function buildSectionCreate(sections: RabSectionInput[]) {
  return sections.map((section, sectionIndex) => ({
    name: section.name,
    order: section.order ?? sectionIndex,
    items: {
      create: section.items.map((item, itemIndex) => ({
        ahspId: item.ahspId || null,
        description: item.description,
        unit: item.unit,
        volume: toDecimal(item.volume),
        unitPrice: money(item.unitPrice),
        amount: money(toDecimal(item.volume).mul(toDecimal(item.unitPrice))),
        order: item.order ?? itemIndex,
      })),
    },
  }));
}

export async function listRabs(query: {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  status?: string;
}) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.RabWhereInput = {
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { number: { contains: query.search, mode: "insensitive" } },
            { clientName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status as Prisma.EnumRabStatusFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.rab.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { sections: true } },
      },
    }),
    prisma.rab.count({ where }),
  ]);

  return { items, meta: buildMeta(page, pageSize, total) };
}

export async function getRabById(id: string): Promise<RabWithSections> {
  const rab = await prisma.rab.findUnique({ where: { id }, include: withSections });
  if (!rab) throw ApiError.notFound("RAB not found");
  return rab;
}

export async function createRab(input: RabInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const number = input.number?.trim() || (await generateNumber(tx));

    const clash = await tx.rab.findUnique({ where: { number } });
    if (clash) throw ApiError.conflict(`RAB number "${number}" is already used`);

    const totals = computeTotals(
      input.sections.map((s) => ({
        items: s.items.map((i) => ({ volume: toDecimal(i.volume), unitPrice: toDecimal(i.unitPrice) })),
      })),
      input.taxPct ?? 11,
      input.discountPct ?? 0
    );

    return tx.rab.create({
      data: {
        number,
        title: input.title,
        clientName: input.clientName ?? null,
        location: input.location ?? null,
        projectDate: input.projectDate ? new Date(input.projectDate) : null,
        status: input.status ?? "DRAFT",
        taxPct: toDecimal(input.taxPct ?? 11),
        discountPct: toDecimal(input.discountPct ?? 0),
        notes: input.notes ?? null,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        createdById: userId,
        sections: { create: buildSectionCreate(input.sections) },
      },
      include: withSections,
    });
  });
}

export async function updateRab(id: string, input: RabUpdateInput) {
  const existing = await prisma.rab.findUnique({ where: { id }, include: withSections });
  if (!existing) throw ApiError.notFound("RAB not found");

  if (input.number && input.number !== existing.number) {
    const clash = await prisma.rab.findUnique({ where: { number: input.number } });
    if (clash) throw ApiError.conflict(`RAB number "${input.number}" is already used`);
  }

  const taxPct = input.taxPct ?? existing.taxPct;
  const discountPct = input.discountPct ?? existing.discountPct;

  // Struktur section/item diganti utuh bila dikirim — jauh lebih sederhana dan aman
  // daripada melakukan diff per baris, dan seluruhnya berjalan dalam satu transaksi.
  return prisma.$transaction(async (tx) => {
    if (input.sections) {
      await tx.rabSection.deleteMany({ where: { rabId: id } });
      for (const [sectionIndex, section] of input.sections.entries()) {
        await tx.rabSection.create({
          data: {
            rabId: id,
            name: section.name,
            order: section.order ?? sectionIndex,
            items: {
              create: section.items.map((item, itemIndex) => ({
                ahspId: item.ahspId || null,
                description: item.description,
                unit: item.unit,
                volume: toDecimal(item.volume),
                unitPrice: money(item.unitPrice),
                amount: money(toDecimal(item.volume).mul(toDecimal(item.unitPrice))),
                order: item.order ?? itemIndex,
              })),
            },
          },
        });
      }
    }

    const sectionsForTotals = input.sections
      ? input.sections.map((s) => ({
          items: s.items.map((i) => ({
            volume: toDecimal(i.volume),
            unitPrice: toDecimal(i.unitPrice),
          })),
        }))
      : existing.sections;

    const totals = computeTotals(sectionsForTotals, taxPct, discountPct);

    return tx.rab.update({
      where: { id },
      data: {
        ...(input.number !== undefined ? { number: input.number } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.clientName !== undefined ? { clientName: input.clientName } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.projectDate !== undefined
          ? { projectDate: input.projectDate ? new Date(input.projectDate) : null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        taxPct: toDecimal(taxPct),
        discountPct: toDecimal(discountPct),
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
      },
      include: withSections,
    });
  });
}

export async function deleteRab(id: string) {
  const existing = await prisma.rab.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("RAB not found");
  await prisma.rab.delete({ where: { id } });
}

/** Rekap tambahan untuk tampilan dokumen RAB (bobot tiap bagian). */
export function summarizeRab(rab: RabWithSections) {
  const sectionTotals = rab.sections.map((section) => ({
    id: section.id,
    name: section.name,
    total: sum(section.items.map((i) => i.amount)),
  }));

  const subtotal = sum(sectionTotals.map((s) => s.total));

  return sectionTotals.map((section) => ({
    ...section,
    weightPct: subtotal.isZero()
      ? new Prisma.Decimal(0)
      : section.total.div(subtotal).mul(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
  }));
}

/** Ekspor RAB ke CSV (dibuka langsung oleh Excel). */
export function toCsv(rab: RabWithSections) {
  const esc = (value: unknown) => {
    const s = String(value ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows: string[][] = [
    ["RENCANA ANGGARAN BIAYA"],
    ["Nomor", rab.number],
    ["Pekerjaan", rab.title],
    ["Pemilik", rab.clientName ?? "-"],
    ["Lokasi", rab.location ?? "-"],
    [],
    ["No", "Uraian Pekerjaan", "Volume", "Satuan", "Harga Satuan", "Jumlah Harga"],
  ];

  rab.sections.forEach((section, sectionIndex) => {
    const romanNumeral = toRoman(sectionIndex + 1);
    rows.push([romanNumeral, section.name.toUpperCase(), "", "", "", ""]);
    section.items.forEach((item, itemIndex) => {
      rows.push([
        String(itemIndex + 1),
        item.description,
        String(item.volume),
        item.unit,
        String(item.unitPrice),
        String(item.amount),
      ]);
    });
    rows.push(["", `Jumlah ${section.name}`, "", "", "", String(sum(section.items.map((i) => i.amount)))]);
  });

  rows.push([]);
  rows.push(["", "Subtotal", "", "", "", String(rab.subtotal)]);
  if (!rab.discountAmount.isZero()) {
    rows.push(["", `Diskon (${rab.discountPct}%)`, "", "", "", String(rab.discountAmount)]);
  }
  rows.push(["", `PPN (${rab.taxPct}%)`, "", "", "", String(rab.taxAmount)]);
  rows.push(["", "TOTAL", "", "", "", String(rab.total)]);

  // BOM supaya Excel membaca UTF-8 dengan benar.
  return "﻿" + rows.map((row) => row.map(esc).join(",")).join("\r\n");
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rest = n;
  let out = "";
  for (const [value, symbol] of map) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}
