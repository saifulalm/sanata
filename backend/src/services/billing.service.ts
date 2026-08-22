import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, percentOf, toDecimal } from "@/utils/money";
import { isoDate, parseDateOnly, startOfUtcDay } from "@/utils/date";
import { allocateDocumentNumber } from "@/services/documentNumber.service";
import type { BillingInput } from "@/validators/schedule.validator";

/**
 * Tagihan termin berbasis progres (progress billing).
 *
 * Rantai hitungnya mengikuti praktik kontrak konstruksi Indonesia:
 *
 *   nilai kumulatif = Σ (nilai item × % opname disetujui s/d periode)
 *   nilai termin    = nilai kumulatif − yang sudah ditagih sebelumnya
 *   retensi         = nilai termin × retentionPct   (ditahan sampai masa pemeliharaan selesai)
 *   PPN             = (nilai termin − retensi) × taxPct
 *   dibayar         = nilai termin − retensi + PPN
 *
 * Dua hal yang sengaja dijaga ketat:
 *
 * 1. Hanya opname berstatus `APPROVED` yang dihitung. Angka yang belum diperiksa
 *    pengawas tidak boleh menaikkan tagihan.
 * 2. Rincian dibekukan ke `snapshot` saat termin dibuat. Opname yang direvisi
 *    setelah berita acara ditandatangani tidak boleh mengubah angka yang sudah
 *    dikirim ke pemilik proyek — perilaku yang sama dengan Surat Penawaran.
 */

export interface BillingLine {
  itemId: string;
  sectionName: string;
  description: string;
  unit: string;
  volume: string;
  amount: string;
  /** Persentase opname disetujui terakhir pada atau sebelum akhir periode. */
  percent: string;
  /** amount × percent / 100. */
  value: string;
}

interface BillingSnapshot {
  periodEnd: string;
  lines: BillingLine[];
  subtotal: string;
}

const startOfDay = startOfUtcDay;

/** Nilai terpasang kumulatif s/d `periodEnd`, dirinci per item. */
export async function computeProgressValue(rabId: string, periodEnd: Date) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              progress: {
                where: { status: "APPROVED", date: { lte: periodEnd } },
                orderBy: { date: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  if (!rab) throw ApiError.notFound("RAB not found");

  const lines: BillingLine[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const section of rab.sections) {
    for (const item of section.items) {
      const amount = toDecimal(item.amount);
      const latest = item.progress[0];
      const percent = latest ? toDecimal(latest.percent) : new Prisma.Decimal(0);
      const value = amount.mul(percent).div(100);
      subtotal = subtotal.plus(value);

      lines.push({
        itemId: item.id,
        sectionName: section.name,
        description: item.description,
        unit: item.unit,
        volume: item.volume.toString(),
        amount: money(amount).toString(),
        percent: percent.toString(),
        value: money(value).toString(),
      });
    }
  }

  return { rab, lines, subtotal };
}

/** Yang sudah ditagih pada termin sebelumnya — pembatalan tidak ikut dihitung. */
async function billedSoFar(rabId: string, excludeId?: string) {
  const previous = await prisma.progressBilling.findMany({
    where: {
      rabId,
      status: { not: "CANCELLED" },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { currentValue: true },
  });

  return previous.reduce<Prisma.Decimal>((acc, p) => acc.plus(toDecimal(p.currentValue)), new Prisma.Decimal(0));
}

/** Pratinjau tanpa menyimpan — dipakai form sebelum termin dibuat. */
export async function previewBilling(rabId: string, periodEndIso: string, retentionPct: number, taxPct: number) {
  const periodEnd = parseDateOnly(periodEndIso);
  const { lines, subtotal } = await computeProgressValue(rabId, periodEnd);
  const previous = await billedSoFar(rabId);
  const current = subtotal.minus(previous);

  return {
    periodEnd: isoDate(periodEnd),
    lines,
    ...amounts(subtotal, previous, current, retentionPct, taxPct),
  };
}

function amounts(
  cumulative: Prisma.Decimal,
  previous: Prisma.Decimal,
  current: Prisma.Decimal,
  retentionPct: number,
  taxPct: number
) {
  const retentionAmount = percentOf(current, retentionPct);
  const afterRetention = current.minus(retentionAmount);
  const taxAmount = percentOf(afterRetention, taxPct);

  return {
    cumulativeValue: money(cumulative).toString(),
    previousValue: money(previous).toString(),
    currentValue: money(current).toString(),
    retentionPct: String(retentionPct),
    retentionAmount: retentionAmount.toString(),
    taxPct: String(taxPct),
    taxAmount: taxAmount.toString(),
    netAmount: money(afterRetention.plus(taxAmount)).toString(),
  };
}


export async function createBilling(rabId: string, input: BillingInput, userId: string) {
  const periodEnd = parseDateOnly(input.periodEnd);
  const retentionPct = input.retentionPct ?? 5;
  const taxPct = input.taxPct ?? 11;

  const { lines, subtotal } = await computeProgressValue(rabId, periodEnd);
  const previous = await billedSoFar(rabId);
  const current = subtotal.minus(previous);

  // Termin bernilai nol atau negatif berarti tidak ada kemajuan baru yang
  // disetujui sejak termin terakhir — menerbitkannya hanya membuat arsip kotor.
  if (current.lessThanOrEqualTo(0)) {
    throw ApiError.badRequest(
      "Tidak ada kemajuan baru yang disetujui setelah termin sebelumnya, jadi tidak ada yang bisa ditagih"
    );
  }

  const snapshot: BillingSnapshot = { periodEnd: isoDate(periodEnd), lines, subtotal: money(subtotal).toString() };
  const totals = amounts(subtotal, previous, current, retentionPct, taxPct);

  const billing = await prisma.progressBilling.create({
    data: {
      rabId,
      number: await allocateDocumentNumber("BAP"),
      periodEnd,
      cumulativeValue: totals.cumulativeValue,
      previousValue: totals.previousValue,
      currentValue: totals.currentValue,
      retentionPct,
      retentionAmount: totals.retentionAmount,
      taxPct,
      taxAmount: totals.taxAmount,
      netAmount: totals.netAmount,
      notes: input.notes ?? null,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      createdById: userId,
    },
  });

  return serializeBilling(billing);
}

type BillingRow = Prisma.ProgressBillingGetPayload<Record<string, never>>;

function serializeBilling(b: BillingRow) {
  const snapshot = b.snapshot as unknown as BillingSnapshot;
  return {
    id: b.id,
    rabId: b.rabId,
    number: b.number,
    status: b.status,
    periodEnd: isoDate(startOfDay(b.periodEnd)),
    cumulativeValue: toDecimal(b.cumulativeValue).toString(),
    previousValue: toDecimal(b.previousValue).toString(),
    currentValue: toDecimal(b.currentValue).toString(),
    retentionPct: toDecimal(b.retentionPct).toString(),
    retentionAmount: toDecimal(b.retentionAmount).toString(),
    taxPct: toDecimal(b.taxPct).toString(),
    taxAmount: toDecimal(b.taxAmount).toString(),
    netAmount: toDecimal(b.netAmount).toString(),
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
    lines: snapshot?.lines ?? [],
  };
}

export async function listBillings(rabId: string) {
  const rows = await prisma.progressBilling.findMany({ where: { rabId }, orderBy: { createdAt: "asc" } });
  return rows.map(serializeBilling);
}

export async function getBilling(id: string) {
  const billing = await prisma.progressBilling.findUnique({
    where: { id },
    include: { rab: { select: { id: true, number: true, title: true, clientName: true, location: true } } },
  });
  if (!billing) throw ApiError.notFound("Termin tidak ditemukan");

  return { ...serializeBilling(billing), rab: billing.rab };
}

const ALLOWED: Record<string, string[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

export async function setBillingStatus(id: string, status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED") {
  const billing = await prisma.progressBilling.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!billing) throw ApiError.notFound("Termin tidak ditemukan");

  if (!ALLOWED[billing.status].includes(status)) {
    throw ApiError.badRequest(`Termin berstatus ${billing.status} tidak bisa diubah menjadi ${status}`);
  }

  const updated = await prisma.progressBilling.update({ where: { id }, data: { status } });
  return serializeBilling(updated);
}

export async function deleteBilling(id: string) {
  const billing = await prisma.progressBilling.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!billing) throw ApiError.notFound("Termin tidak ditemukan");

  // Termin yang sudah terkirim atau dibayar adalah bagian dari riwayat tagihan;
  // batalkan agar jejaknya tetap ada, jangan dihapus.
  if (billing.status !== "DRAFT") {
    throw ApiError.badRequest("Hanya termin berstatus draf yang bisa dihapus — gunakan pembatalan untuk sisanya");
  }

  await prisma.progressBilling.delete({ where: { id } });
}

/** Berita acara sebagai CSV untuk lampiran tagihan. */
export function billingToCsv(billing: Awaited<ReturnType<typeof getBilling>>): string {
  const rows: string[][] = [["Pekerjaan", "Satuan", "Volume", "Nilai Kontrak", "Progres (%)", "Nilai Terpasang"]];

  for (const line of billing.lines) {
    rows.push([line.description, line.unit, line.volume, line.amount, line.percent, line.value]);
  }

  rows.push([]);
  rows.push(["Nilai kumulatif s/d periode", "", "", "", "", billing.cumulativeValue]);
  rows.push(["Sudah ditagih sebelumnya", "", "", "", "", billing.previousValue]);
  rows.push(["Nilai termin ini", "", "", "", "", billing.currentValue]);
  rows.push([`Retensi ${billing.retentionPct}%`, "", "", "", "", `-${billing.retentionAmount}`]);
  rows.push([`PPN ${billing.taxPct}%`, "", "", "", "", billing.taxAmount]);
  rows.push(["Dibayarkan", "", "", "", "", billing.netAmount]);

  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
