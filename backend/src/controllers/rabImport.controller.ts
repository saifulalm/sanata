"use client";

/**
 * RAB Import Controller - Preview & Confirm
 * Supports both simple template format and PASEBAN timeline format
 */

import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import * as XLSX from "xlsx";

interface Row { [key: string]: unknown }

interface ParsedItem {
  description: string;
  unit: string;
  volume: number;
  price: number;
  amount: number;
  bobot: number;
  startOffsetDays: number;
  durationDays: number;
}

interface ParsedSection {
  name: string;
  items: ParsedItem[];
}

interface ParsedProject {
  title: string;
  location: string;
  scheduleStart: string;
  clientName?: string;
  sections: ParsedSection[];
}

interface ParseResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  project: ParsedProject;
  stats: {
    totalSections: number;
    totalItems: number;
    totalBobot: number;
    earliestStart: string | null;
    latestEnd: string | null;
    totalDuration: number;
  };
}

// ============================================================
// FORMAT DETECTION
// ============================================================

function isPasebanFormat(ws: XLSX.WorkSheet): boolean {
  // Check if this looks like the PASEBAN timeline format
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  // PASEBAN format has data in rows 5-7 for project info
  // and headers in row 10
  if (range.e.r < 10) return false;

  const row10 = XLSX.utils.sheet_to_json(ws, { header: 1, range: 9, defval: "" })[0] as unknown[];
  const row11 = XLSX.utils.sheet_to_json(ws, { header: 1, range: 10, defval: "" })[0] as unknown[];

  // Check for column headers that match PASEBAN format
  const hasBobot = row10?.some((v: unknown) => v && String(v).toUpperCase().includes("BOBOT"));
  const hasDurasi = row10?.some((v: unknown) => v && String(v).toUpperCase().includes("DURASI"));
  const hasWeekColumns = row11?.some((v: unknown) => v && String(v).toUpperCase().startsWith("W"));

  return !!(hasBobot && hasDurasi && hasWeekColumns);
}

// ============================================================
// PASEBAN FORMAT PARSER
// ============================================================

function parsePasebanFormat(ws: XLSX.WorkSheet): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: false });
  if (!json.length) throw new Error("File kosong");

  // Extract project info (rows 5-7, 1-indexed)
  let title = "Proyek Baru";
  let location = "";
  let clientName = "";
  let scheduleStart = "";

  for (const row of json.slice(0, 10)) {
    const a = String(row["A"] || "").toUpperCase().trim();
    const e = String(row["E"] || "").trim();

    if (a.includes("PROYEK") && e) {
      title = e;
    } else if (a.includes("LOKASI") && e) {
      location = e;
    } else if (a.includes("DATE") && e) {
      // Try to parse date like "10 Oktober 2025"
      const months: Record<string, number> = {
        JANUARI: 1, FEBRUARI: 2, MARET: 3, APRIL: 4, MEI: 5, JUNI: 6,
        JULI: 7, AGUSTUS: 8, SEPTEMBER: 9, OKTOBER: 10, NOVEMBER: 11, DESEMBER: 12
      };
      const match = e.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
      if (match) {
        const day = parseInt(match[1]);
        const monthName = match[2].toUpperCase();
        const year = parseInt(match[3]);
        const month = months[monthName] || 1;
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          scheduleStart = date.toISOString().split("T")[0];
        }
      }
    }
  }

  // If no schedule start found, use today
  if (!scheduleStart) {
    scheduleStart = new Date().toISOString().split("T")[0];
  }

  const projectStartDate = new Date(scheduleStart);

  // Parse sections and items
  const sections = new Map<string, ParsedSection>();
  let currentSection = "Pekerjaan";
  let currentSectionName = "Pekerjaan";
  let sectionOrder = 0;

  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

  for (let i = 13; i < json.length; i++) {
    const row = json[i];
    const no = String(row["A"] || "").trim();
    const desc = String(row["B"] || "").trim();
    const subNo = String(row["C"] || "").trim();
    const bobotRaw = row["H"];
    const startDateRaw = row["I"];
    const endDateRaw = row["J"];
    const durasiRaw = row["K"];

    // Skip empty rows
    if (!desc && !no) continue;

    // Check for section header (Roman numeral)
    if (romanNumerals.includes(no.toUpperCase())) {
      // Check if this is a TOTAL row (skip it)
      if (desc.toUpperCase().includes("TOTAL")) continue;

      currentSection = desc;
      currentSectionName = desc;
      sectionOrder++;

      if (!sections.has(currentSection)) {
        sections.set(currentSection, { name: currentSectionName, items: [] });
      }
      continue;
    }

    // Check for subsection header (single letter + LANTAI)
    if (subNo.toUpperCase() === "LANTAI" && no.length === 1 && /^[A-Z]$/i.test(no)) {
      currentSectionName = `${no}. ${desc}`;
      continue;
    }

    // This is a data row - parse item
    if (bobotRaw !== null) {
      const bobot = typeof bobotRaw === "number" ? bobotRaw * 100 : 0; // Convert decimal to percentage
      let duration = 0;
      let startOffsetDays = 0;

      // Parse duration
      if (typeof durasiRaw === "number") {
        duration = Math.round(durasiRaw);
      }

      // Parse start date and calculate offset
      if (startDateRaw) {
        try {
          let startDate: Date;
          if (typeof startDateRaw === "string") {
            startDate = new Date(startDateRaw);
          } else if (typeof startDateRaw === "number") {
            // Excel serial date
            startDate = XLSX.SSF.parse_date_code(startDateRaw) as unknown as Date;
          } else {
            startDate = new Date(String(startDateRaw));
          }

          if (!isNaN(startDate.getTime())) {
            startOffsetDays = Math.round((startDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        } catch {
          // Ignore date parse errors
        }
      }

      // Build item description
      const itemDesc = subNo ? `${no}.${subNo} ${desc}`.trim() : `${no} ${desc}`.trim();

      // Add to current section
      if (!sections.has(currentSection)) {
        sections.set(currentSection, { name: currentSectionName, items: [] });
      }

      sections.get(currentSection)!.items.push({
        description: itemDesc,
        unit: "LS",
        volume: 1,
        price: 0,
        amount: 0,
        bobot: bobot,
        startOffsetDays: Math.max(0, startOffsetDays),
        durationDays: duration,
      });
    }
  }

  // Validate
  const allItems = Array.from(sections.values()).flatMap(s => s.items);
  const totalBobot = allItems.reduce((s, i) => s + i.bobot, 0);

  if (totalBobot < 99 || totalBobot > 101) {
    warnings.push(`Total bobot ${totalBobot.toFixed(2)}% (idealnya 100%)`);
  }

  // Calculate stats
  let earliestStart: string | null = null;
  let latestEnd: string | null = null;
  let totalDuration = 0;

  for (const item of allItems) {
    if (earliestStart === null || item.startOffsetDays < parseInt(earliestStart)) {
      earliestStart = String(item.startOffsetDays);
    }
    const itemEnd = item.startOffsetDays + item.durationDays;
    if (itemEnd > totalDuration) totalDuration = itemEnd;
    if (itemEnd > 0 && (latestEnd === null || itemEnd > parseInt(latestEnd))) {
      latestEnd = String(itemEnd);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    project: {
      title,
      location,
      scheduleStart,
      clientName: clientName || undefined,
      sections: Array.from(sections.values()),
    },
    stats: {
      totalSections: sections.size,
      totalItems: allItems.length,
      totalBobot,
      earliestStart,
      latestEnd,
      totalDuration,
    },
  };
}

// ============================================================
// SIMPLE TEMPLATE FORMAT PARSER
// ============================================================

interface SimpleItem {
  section: string;
  desc: string;
  unit: string;
  vol: number;
  price: number;
  amount: number;
  bobot: number;
  offset: number;
  dur: number;
}

function col(headers: string[], term: string): number {
  const t = term.toLowerCase();
  return headers.findIndex(h => h.toLowerCase().includes(t));
}

function cell(row: Row, headers: string[], idx: number): unknown {
  const k = headers[idx];
  return k ? row[k] : undefined;
}

function fl(o: unknown, fallback = 0): number {
  if (typeof o === "number") return o;
  if (typeof o === "string") {
    const n = parseFloat(o.replace(/[^\d.-]/g, ""));
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

function flr(o: unknown, fallback = 0): number {
  return Math.round(fl(o, fallback));
}

function str(o: unknown, fallback = ""): string {
  if (typeof o === "string") return o;
  return fallback;
}

function parseSimpleFormat(ws: XLSX.WorkSheet): ParseResult {
  const raw = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
  if (!raw.length) throw new Error("File kosong");

  const headers = Object.keys(raw[0]);
  const rows = raw.slice(1);

  const secCol = col(headers, "section") ?? col(headers, "kategori") ?? col(headers, "kelompok");
  const descCol = col(headers, "pekerjaan") ?? col(headers, "description") ?? col(headers, "deskripsi");
  const unitCol = col(headers, "satuan") ?? col(headers, "unit");
  const volCol = col(headers, "volume") ?? col(headers, "vol");
  const priceCol = col(headers, "harga") ?? col(headers, "price") ?? col(headers, "unit_price");
  const amtCol = col(headers, "jumlah") ?? col(headers, "amount") ?? col(headers, "total");
  const bobotCol = col(headers, "bobot") ?? col(headers, "weight") ?? col(headers, "%");
  const offCol = col(headers, "offset") ?? col(headers, "mulai") ?? col(headers, "start");
  const durCol = col(headers, "durasi") ?? col(headers, "duration") ?? col(headers, "dur");

  const errors: string[] = [];
  const warnings: string[] = [];
  const sections = new Map<string, SimpleItem[]>();

  let current = "Pekerjaan";
  let rowIndex = 2;

  for (const row of rows) {
    rowIndex++;
    const sec = secCol >= 0 ? str(cell(row, headers, secCol) || "Pekerjaan") : "Pekerjaan";
    const desc = str(cell(row, headers, descCol) || "").trim();
    if (!desc) continue;
    if (sec && sec !== current) current = sec;
    if (!sections.has(current)) sections.set(current, []);

    const unit = str(cell(row, headers, unitCol) || "LS");
    const vol = fl(cell(row, headers, volCol) || 1);
    const price = fl(cell(row, headers, priceCol) || 0);
    const amount = amtCol >= 0 ? fl(cell(row, headers, amtCol) || 0) : vol * price;
    const bobot = fl(cell(row, headers, bobotCol) || 0);
    const offset = flr(cell(row, headers, offCol) || 0);
    const dur = flr(cell(row, headers, durCol) || 0);

    if (dur < 0) errors.push(`Durasi negatif di "${desc}" (baris ${rowIndex})`);
    if (offset < 0) errors.push(`Offset negatif di "${desc}" (baris ${rowIndex})`);
    if (price < 0) errors.push(`Harga negatif di "${desc}" (baris ${rowIndex})`);
    if (vol <= 0 && desc) warnings.push(`Volume 0 atau kosong di "${desc}" (baris ${rowIndex})`);

    sections.get(current)!.push({ section: current, desc, unit, vol, price, amount, bobot, offset, dur });
  }

  const items = Array.from(sections.values()).flat();
  const totalBobot = items.reduce((s, i) => s + i.bobot, 0);

  if (totalBobot > 0 && (totalBobot < 99 || totalBobot > 101)) {
    warnings.push(`Total bobot ${totalBobot.toFixed(1)}% ≠ 100% (idealnya 100%)`);
  }

  let earliestStart: string | null = null;
  let latestEnd: string | null = null;
  let totalDuration = 0;

  for (const item of items) {
    if (item.offset >= 0 && (earliestStart === null || item.offset < parseInt(earliestStart))) {
      earliestStart = String(item.offset);
    }
    const itemEnd = item.offset + item.dur;
    if (itemEnd > totalDuration) totalDuration = itemEnd;
    if (itemEnd > 0 && (latestEnd === null || itemEnd > parseInt(latestEnd))) {
      latestEnd = String(itemEnd);
    }
  }

  // Transform to standard format
  const parsedSections: ParsedSection[] = Array.from(sections.entries()).map(([name, items]) => ({
    name,
    items: items.map(item => ({
      description: item.desc,
      unit: item.unit,
      volume: item.vol,
      price: item.price,
      amount: item.amount,
      bobot: item.bobot,
      startOffsetDays: item.offset,
      durationDays: item.dur,
    })),
  }));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    project: {
      title: "",
      location: "",
      scheduleStart: "",
      sections: parsedSections,
    },
    stats: {
      totalSections: sections.size,
      totalItems: items.length,
      totalBobot,
      earliestStart,
      latestEnd,
      totalDuration,
    },
  };
}

// ============================================================
// MAIN PARSER
// ============================================================

function parseExcel(buf: Buffer): ParseResult {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Detect format
  if (isPasebanFormat(ws)) {
    return parsePasebanFormat(ws);
  }

  return parseSimpleFormat(ws);
}

// ============================================================
// API ENDPOINTS
// ============================================================

/** POST /api/rab/import-preview */
export const previewImport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Upload file Excel terlebih dahulu");
  const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf("."));
  if (![".xlsx", ".xls"].includes(ext)) throw ApiError.badRequest("Hanya .xlsx/.xls");

  try {
    const result = parseExcel(req.file.buffer);

    const response = {
      success: true,
      data: {
        valid: result.valid,
        errors: result.errors.map(msg => ({ row: 0, field: "", message: msg, severity: "error" as const })),
        warnings: result.warnings.map(msg => ({ row: 0, field: "", message: msg, severity: "warning" as const })),
        data: {
          number: "",
          title: result.project.title || "",
          location: result.project.location || "",
          clientName: result.project.clientName || "",
          scheduleStart: result.project.scheduleStart || "",
          sections: result.project.sections.map((sec, idx) => ({
            name: sec.name,
            order: idx + 1,
            items: sec.items.map(item => ({
              description: item.description,
              unit: item.unit,
              volume: item.volume,
              unitPrice: item.price,
              amount: item.amount,
              bobot: item.bobot,
              startOffsetDays: item.startOffsetDays,
              durationDays: item.durationDays,
            })),
          })),
        },
        statistics: {
          totalRows: result.stats.totalItems,
          validRows: result.stats.totalItems - result.errors.length,
          errorRows: result.errors.length,
          totalSections: result.stats.totalSections,
          totalItems: result.stats.totalItems,
          totalAmount: 0,
          totalBobot: result.stats.totalBobot,
          earliestStart: result.stats.earliestStart,
          latestEnd: result.stats.latestEnd,
          totalDuration: result.stats.totalDuration,
        },
      },
    };

    res.json(response);
  } catch (e) {
    throw ApiError.badRequest(e instanceof Error ? e.message : "Gagal baca file");
  }
});

/** POST /api/rab/import-confirm */
export const confirmImport = asyncHandler(async (req: Request, res: Response) => {
  const { number, title, client, location, scheduleStart, sections } = req.body as {
    number: string;
    title: string;
    client?: string;
    location?: string;
    scheduleStart: string;
    sections?: { name: string; items: { desc: string; unit: string; vol: number; price: number; amount: number; bobot: number; offset: number; dur: number }[] }[];
  };

  if (!number) throw ApiError.badRequest("Nomor RAB wajib diisi");
  if (!title) throw ApiError.badRequest("Judul wajib diisi");
  if (!scheduleStart) throw ApiError.badRequest("Tanggal mulai wajib diisi");

  const existing = await prisma.rab.findUnique({ where: { number } });
  if (existing) throw ApiError.badRequest(`RAB ${number} sudah ada`);

  const result = await prisma.$transaction(async tx => {
    const rab = await tx.rab.create({
      data: {
        number,
        title,
        clientName: client || null,
        location: location || null,
        scheduleStart: new Date(scheduleStart),
        restDays: [0],
        status: "DRAFT",
        createdById: req.user!.sub,
      },
    });
    let secs = 0, items = 0;
    for (const sec of sections || []) {
      const s = await tx.rabSection.create({ data: { rabId: rab.id, name: sec.name, order: secs + 1 } });
      secs++;
      for (const item of sec.items || []) {
        await tx.rabItem.create({
          data: {
            sectionId: s.id,
            description: item.desc,
            unit: item.unit || "LS",
            volume: item.vol || 1,
            unitPrice: item.price || 0,
            amount: item.amount || 0,
            startOffsetDays: item.offset || 0,
            durationDays: item.dur || 0,
            order: items + 1,
          },
        });
        items++;
      }
    }
    return { id: rab.id, number: rab.number, secs, items };
  });

  res.status(201).json({ success: true, data: result });
});

/** GET /api/rab/import-template */
export const downloadTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const wb = XLSX.utils.book_new();
  const data = [
    ["TEMPLATE IMPORT RAB"],
    [""],
    ["section", "description", "unit", "volume", "unit_price", "amount", "bobot", "start_offset_days", "duration_days"],
    ["Pekerjaan Struktur", "Pondasi Strauss pile D300", "m'", "120", "850000", "102000000", "2.5", "0", "43"],
    ["Pekerjaan Struktur", "Sloof 30x50 cm", "m3", "24", "2500000", "60000000", "1.5", "43", "21"],
    ["Pekerjaan Arsitektur", "Pasangan bata 1PC:5PP", "m2", "1800", "95000", "171000000", "3.5", "160", "60"],
    [""],
    ["CATATAN:"],
    ["section = Section/Kelompok pekerjaan"],
    ["description = Uraian pekerjaan"],
    ["unit = Satuan (m3, m2, m', unit, ls)"],
    ["volume = Jumlah volume"],
    ["unit_price = Harga satuan"],
    ["amount = Jumlah harga (volume x harga)"],
    ["bobot = Bobot dalam persen (%)"],
    ["start_offset_days = Hari mulai dari tanggal jadwal (0 = dari tanggal mulai)"],
    ["duration_days = Lama pekerjaan dalam hari"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=template_import_rab.xlsx");
  res.send(buf);
});
