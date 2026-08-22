import { Prisma, type ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, sum, toDecimal } from "@/utils/money";

/**
 * Rekap kebutuhan sumber daya (material take-off) dari sebuah RAB.
 *
 * Datanya sudah ada sejak awal tapi tidak pernah dijumlahkan: tiap item RAB
 * menunjuk sebuah AHSP, dan AHSP menyimpan koefisien pemakaian per satuan
 * pekerjaan. Jadi:
 *
 *   kebutuhan bahan X = Σ (volume item RAB × koefisien X pada AHSP item itu)
 *
 * Hasilnya adalah daftar belanja untuk pengadaan, plus komposisi biaya
 * upah/bahan/alat yang berguna untuk menilai margin.
 */

export interface TakeoffLine {
  priceItemId: string;
  code: string;
  name: string;
  type: ResourceType;
  unit: string;
  unitPrice: string;
  /** Total kuantitas yang dibutuhkan seluruh pekerjaan. */
  quantity: string;
  /** quantity × unitPrice. */
  amount: string;
  /** Item RAB mana saja yang menyumbang kebutuhan ini. */
  usedIn: { description: string; volume: string; coefficient: string; subtotal: string }[];
}

export async function getRabTakeoff(rabId: string) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              ahsp: { include: { components: { include: { priceItem: true } } } },
            },
          },
        },
      },
    },
  });
  if (!rab) throw ApiError.notFound("RAB not found");

  // Akumulasi per harga satuan dasar.
  const acc = new Map<string, TakeoffLine & { qtyDec: Prisma.Decimal }>();

  // Item yang diisi manual tidak punya AHSP, jadi tidak bisa diurai menjadi
  // kebutuhan bahan. Dilaporkan terpisah supaya angkanya tidak diam-diam hilang.
  const unresolved: { description: string; unit: string; volume: string; amount: string }[] = [];

  for (const section of rab.sections) {
    for (const item of section.items) {
      if (!item.ahsp || item.ahsp.components.length === 0) {
        unresolved.push({
          description: item.description,
          unit: item.unit,
          volume: String(item.volume),
          amount: String(item.amount),
        });
        continue;
      }

      for (const component of item.ahsp.components) {
        // Koefisien dinyatakan per satu satuan pekerjaan.
        const needed = toDecimal(item.volume).mul(component.coefficient);
        const existing = acc.get(component.priceItemId);

        const usage = {
          description: item.description,
          volume: String(item.volume),
          coefficient: String(component.coefficient),
          subtotal: needed.toDecimalPlaces(4).toString(),
        };

        if (existing) {
          existing.qtyDec = existing.qtyDec.plus(needed);
          existing.usedIn.push(usage);
        } else {
          acc.set(component.priceItemId, {
            priceItemId: component.priceItemId,
            code: component.priceItem.code,
            name: component.priceItem.name,
            type: component.priceItem.type,
            unit: component.priceItem.unit,
            unitPrice: String(component.priceItem.unitPrice),
            quantity: "0",
            amount: "0",
            usedIn: [usage],
            qtyDec: needed,
          });
        }
      }
    }
  }

  const lines: TakeoffLine[] = [...acc.values()]
    .map(({ qtyDec, ...line }) => {
      const priceItem = acc.get(line.priceItemId)!;
      return {
        ...line,
        quantity: qtyDec.toDecimalPlaces(4).toString(),
        amount: money(qtyDec.mul(toDecimal(priceItem.unitPrice))).toString(),
      };
    })
    .sort((a, b) => (a.type === b.type ? a.code.localeCompare(b.code) : a.type.localeCompare(b.type)));

  const byType = (type: ResourceType) => sum(lines.filter((l) => l.type === type).map((l) => l.amount));

  const labor = byType("LABOR");
  const material = byType("MATERIAL");
  const equipment = byType("EQUIPMENT");
  const directTotal = sum([labor, material, equipment]);

  const pct = (value: Prisma.Decimal) =>
    directTotal.isZero() ? "0" : value.div(directTotal).mul(100).toDecimalPlaces(1).toString();

  return {
    rab: { id: rab.id, number: rab.number, title: rab.title, total: String(rab.total) },
    lines,
    unresolved,
    composition: {
      labor: String(labor),
      material: String(material),
      equipment: String(equipment),
      /** Biaya langsung; selisih terhadap nilai RAB adalah overhead, profit, diskon, dan PPN. */
      directTotal: String(directTotal),
      laborPct: pct(labor),
      materialPct: pct(material),
      equipmentPct: pct(equipment),
    },
  };
}

/** Ekspor rekap kebutuhan ke CSV untuk diserahkan ke bagian pengadaan. */
export function takeoffToCsv(takeoff: Awaited<ReturnType<typeof getRabTakeoff>>) {
  const esc = (value: unknown) => {
    const s = String(value ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const TYPE_LABEL: Record<string, string> = { LABOR: "Upah", MATERIAL: "Bahan", EQUIPMENT: "Alat" };

  const rows: string[][] = [
    ["REKAP KEBUTUHAN SUMBER DAYA"],
    ["RAB", takeoff.rab.number],
    ["Pekerjaan", takeoff.rab.title],
    [],
    ["Kode", "Uraian", "Jenis", "Kuantitas", "Satuan", "Harga Satuan", "Jumlah"],
  ];

  for (const line of takeoff.lines) {
    rows.push([
      line.code,
      line.name,
      TYPE_LABEL[line.type] ?? line.type,
      line.quantity,
      line.unit,
      line.unitPrice,
      line.amount,
    ]);
  }

  rows.push([]);
  rows.push(["", "Total Upah", "", "", "", "", takeoff.composition.labor]);
  rows.push(["", "Total Bahan", "", "", "", "", takeoff.composition.material]);
  rows.push(["", "Total Alat", "", "", "", "", takeoff.composition.equipment]);
  rows.push(["", "Total Biaya Langsung", "", "", "", "", takeoff.composition.directTotal]);

  if (takeoff.unresolved.length > 0) {
    rows.push([]);
    rows.push(["Item tanpa AHSP (tidak dapat diurai)"]);
    rows.push(["Uraian", "Volume", "Satuan", "Jumlah"]);
    for (const item of takeoff.unresolved) {
      rows.push([item.description, item.volume, item.unit, item.amount]);
    }
  }

  // BOM supaya Excel membaca UTF-8 dengan benar.
  return "﻿" + rows.map((row) => row.map(esc).join(",")).join("\r\n");
}
