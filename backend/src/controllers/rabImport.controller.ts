"use client";

/**
 * RAB Import Controller - Generalized Multi-Format Parser
 *
 * Supported formats:
 * 1. PASEBAN Timeline  — week columns (W1, W2...), BOBOT%, start/end dates
 * 2. Standard RAB      — cols: NO, URAIAN, VOLUME, SAT, HARGA SATUAN, JUMLAH, BOBOT
 * 3. Summary/Rekap    — compact: section headers + item rows + bobot decimal fraction
 *
 * Auto-detection: best sheet is selected by content heuristics, format by column layout.
 */

import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import * as XLSX from "xlsx";

// ─── Shared Types ──────────────────────────────────────────────────────────────

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
  format: string;
  sheetUsed: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fl = (v: unknown, fallback = 0): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ".").replace(/[^\d.-]/g, ""));
    return isNaN(n) ? fallback : n;
  }
  return fallback;
};

const flr = (v: unknown, fallback = 0): number => Math.round(fl(v, fallback));

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : fallback;

const cell = (row: unknown[], col: number): unknown =>
  row != null && col < (row as unknown[]).length ? (row as unknown[])[col] : "";

const romanNumerals = [
  "I","II","III","IV","V","VI","VII","VIII","IX","X",
  "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"
];

const isRoman = (s: string) =>
  romanNumerals.includes(s.toUpperCase().trim());

const hasLetters = (s: string) => /[a-zA-Z]/.test(s);

const parseIndonesianDate = (v: string): string => {
  const months: Record<string, number> = {
    JANUARI:1,FEBRUARI:2,MARET:3,APRIL:4,MEI:5,JUNI:6,
    JULI:7,AGUSTUS:8,SEPTEMBER:9,OKTOBER:10,NOVEMBER:11,DESEMBER:12
  };
  const match = v.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (match) {
    const m = months[match[2].toUpperCase()] || 1;
    const d = parseInt(match[1]);
    const y = parseInt(match[3]);
    return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  // Fallback: try standard date parse
  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
};

const dateOffsetDays = (dateRaw: unknown, baseDate: string): number => {
  if (!dateRaw) return 0;
  try {
    let dateStr = "";
    if (typeof dateRaw === "number") {
      const d = XLSX.SSF.parse_date_code(dateRaw) as unknown as Date;
      dateStr = d?.toISOString().slice(0, 10) || "";
    } else if (typeof dateRaw === "object" && dateRaw !== null) {
      const d = new Date((dateRaw as Date).toISOString ? (dateRaw as Date).toISOString() : String(dateRaw));
      if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 10);
    } else {
      const d = new Date(String(dateRaw));
      if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 10);
    }
    if (!dateStr || !baseDate) return 0;
    return Math.round(
      (new Date(dateStr + "T00:00:00Z").getTime() -
       new Date(baseDate + "T00:00:00Z").getTime()) / 86400000
    );
  } catch { return 0; }
};

// ─── Format 1: PASEBAN Timeline ─────────────────────────────────────────────

function detectPasebanFormat(ws: XLSX.WorkSheet): boolean {
  // Scan first 20 rows of the sheet for BOBOT+DURASI group headers
  // and week columns (W1, W2...). Works regardless of !ref start row.
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
  const flat = (row: unknown[]) => (row as unknown[]).map((v: unknown) => String(v ?? "").toUpperCase());

  for (let i = 0; i < Math.min(20, rawRows.length); i++) {
    const row = flat(rawRows[i]);
    const hasBobot  = row.some(v => /BOBOT/.test(v));
    const hasDurasi = row.some(v => /DURASI/.test(v));
    // Look for week columns in the next row(s)
    if (hasBobot && hasDurasi) {
      for (let j = i + 1; j < Math.min(i + 3, rawRows.length); j++) {
        const nextRow = flat(rawRows[j]);
        if (nextRow.some(v => /^W\d+$/i.test(v.trim()))) return true;
      }
    }
  }
  return false;
}

function parsePasebanFormat(ws: XLSX.WorkSheet): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" }) as unknown[][];
  if (!rawRows.length) throw new Error("File kosong");

  // Project info (scan first 10 rows)
  let title = "Proyek Baru", location = "", scheduleStart = "";
  for (let i = 0; i < 10 && i < rawRows.length; i++) {
    const row = rawRows[i];
    const a = str(cell(row, 0)).toUpperCase();
    if (a === "PROYEK") {
      for (let c = 4; c < row.length; c++) { const v = str(cell(row, c)); if (v) { title = v; break; } }
    } else if (a === "LOKASI") {
      for (let c = 4; c < row.length; c++) { const v = str(cell(row, c)); if (v) { location = v; break; } }
    } else if (a === "DATE") {
      for (let c = 4; c < row.length; c++) { const v = str(cell(row, c)); if (v) { scheduleStart = parseIndonesianDate(v); break; } }
    }
  }
  if (!scheduleStart) scheduleStart = new Date().toISOString().slice(0, 10);

  // Column layout: col0=NO, col1=desc, col7=bobot%, col8=start, col10=durasi(days)
  const sections = new Map<string, ParsedSection>();
  let currentSection = "Pekerjaan", currentSectionName = "Pekerjaan";

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const no = str(cell(row, 0));
    const desc = str(cell(row, 1));
    const bobotRaw = cell(row, 7);
    const startRaw = cell(row, 8);
    const durasiRaw = cell(row, 10);

    if (!no && !desc) continue;

    // Section header: Roman numeral + "PEKERJAAN"
    if (isRoman(no) && /PEKERJAAN/i.test(desc)) {
      if (!/TOTAL/i.test(desc)) {
        currentSection = desc; currentSectionName = desc;
        if (!sections.has(currentSection)) sections.set(currentSection, { name: currentSectionName, items: [] });
      }
      continue;
    }

    // Data row: bobot is numeric AND description has letters AND not a total row
    // (PASEBAN: col A is empty due to merged cells, item number is in col B)
    const bobotNum = typeof bobotRaw === "number" && !isNaN(bobotRaw);
    if (bobotNum && hasLetters(desc) && !/TOTAL/i.test(desc)) {
      const bobot = (bobotRaw as number) * 100;
      const duration = flr(durasiRaw);
      const startOffsetDays = Math.max(0, dateOffsetDays(startRaw, scheduleStart));

      if (!sections.has(currentSection)) sections.set(currentSection, { name: currentSectionName, items: [] });
      sections.get(currentSection)!.items.push({
        description: desc,
        unit: "LS", volume: 1, price: 0, amount: 0,
        bobot, startOffsetDays, durationDays: duration,
      });
    }
  }

  return buildResult("PASEBAN Timeline", sections, title, location, scheduleStart, errors, warnings);
}

// ─── Format 2: Standard RAB (columns: NO, URAIAN, VOLUME, SAT, HARGA, etc.) ──

function parseStandardRab(ws: XLSX.WorkSheet, sheetName: string, forcedHeaderIdx?: number): ParseResult {
  const errors: string[] = [], warnings: string[] = [];
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" }) as unknown[][];
  if (!rawRows.length) throw new Error("File kosong");

  // Project info
  let title = "Proyek Baru", location = "", scheduleStart = "", owner = "";
  for (let i = 0; i < 12 && i < rawRows.length; i++) {
    const row = rawRows[i];
    const a = str(cell(row, 0)).toUpperCase();
    const b = str(cell(row, 1)).toUpperCase();

    if (a.includes("PEKERJAAN") && !a.includes("URAIAN")) {
      // "PEKERJAAN", ":", "Nama Proyek"
      for (let c = 3; c < row.length; c++) { const v = str(cell(row, c)); if (v && v !== ":") { title = v; break; } }
    } else if (a.includes("OWNER") || b.includes("OWNER")) {
      for (let c = 3; c < row.length; c++) { const v = str(cell(row, c)); if (v && v !== ":") { owner = v; break; } }
    } else if (a.includes("LOKASI") || b.includes("LOKASI")) {
      for (let c = 3; c < row.length; c++) { const v = str(cell(row, c)); if (v && v !== ":") { location = v; break; } }
    } else if (a.includes("DATE") || b.includes("TANGGAL")) {
      for (let c = 3; c < row.length; c++) { const v = str(cell(row, c)); if (v && v !== ":") { scheduleStart = parseIndonesianDate(v); break; } }
    }
  }
  if (!scheduleStart) scheduleStart = new Date().toISOString().slice(0, 10);

  // Detect header row (use forcedHeaderIdx if provided from parseExcel)
  const scanHeaderRowIdx = forcedHeaderIdx ?? (() => {
    for (let i = 0; i < Math.min(20, rawRows.length); i++) {
      const vals = (rawRows[i] as unknown[]).map(v => str(v).toUpperCase());
      // Must have "NO" AND at least one of URAIAN/VOLUME/SATUAN/HARGA
      const hasNo = vals.some(v => v === "NO" || v === "NO.");
      const hasData = vals.some(v => /URAIAN|PEKERJAAN|VOLUME|SATUAN|HARGA|JUMLAH|DESCRIPTION/i.test(v));
      if (hasNo && hasData) return i;
    }
    return -1;
  })();

  // Map column indices from header row
  const headerRow = scanHeaderRowIdx >= 0 ? (rawRows[scanHeaderRowIdx] as unknown[]).map(v => str(v).toUpperCase()) : [];
  const idxOf = (terms: string[]) => {
    for (const t of terms) {
      const i = headerRow.findIndex(v => v.includes(t));
      if (i >= 0) return i;
    }
    return -1;
  };

  const NO_IDX     = idxOf(["NO"]);
  const DESC_IDX   = idxOf(["URAIAN","PEKERJAAN","DESCRIPTION","ITEM","KETERANGAN"]);
  const VOL_IDX    = idxOf(["VOLUME","VOL","QTY","KUANTITAS"]);
  const UNIT_IDX   = idxOf(["SAT","SATUAN","UNIT","MED"]);
  const PRICE_IDX  = idxOf(["HARGA","PRICE","SATUAN"]);
  const AMT_IDX    = idxOf(["JUMLAH","AMOUNT","TOTAL","HARGA"]);
  const BOBOT_IDX  = idxOf(["BOBOT","WEIGHT","%","PERSEN"]);

  const sections = new Map<string, ParsedSection>();
  let currentSection = "Pekerjaan", currentSectionName = "Pekerjaan";

  // Parse from after header row
  const startRow = scanHeaderRowIdx >= 0 ? scanHeaderRowIdx + 1 : 0;
  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    const no = str(cell(row, NO_IDX >= 0 ? NO_IDX : 0));
    const desc = str(cell(row, DESC_IDX >= 0 ? DESC_IDX : 1));
    if (!no && !desc) continue;

    // Section header: Roman numeral or single letter A/B/C in col A
    const isSubFloor = /^[A-Z]$/.test(no.trim()) && /LANTAI/i.test(desc);
    if (isRoman(no) || isSubFloor) {
      if (!/TOTAL|SUB\s*TOTAL|JUMLAH/i.test(desc)) {
        if (isRoman(no)) {
          currentSection = desc || no;
          currentSectionName = desc || no;
        } else {
          currentSectionName = `${no}. ${desc}`;
        }
        if (!sections.has(currentSection)) sections.set(currentSection, { name: currentSectionName, items: [] });
      }
      continue;
    }

    // Data row: numeric item number found in NO column OR description column
    // (in merged-cell sheets, item numbers appear in the description column, not NO column)
    // Use raw cell values (not str()) for number detection
    const noColRaw = cell(row, NO_IDX >= 0 ? NO_IDX : 0);
    const descColRaw = cell(row, DESC_IDX >= 0 ? DESC_IDX : 1);
    const hasNumericNo = !isNaN(Number(noColRaw)) || !isNaN(Number(descColRaw));
    // Use NO column value if present, otherwise use description column item number
    const itemPrefix = !isNaN(Number(noColRaw)) ? `${noColRaw} ` : (!isNaN(Number(descColRaw)) ? `${descColRaw} ` : "");
    if (hasNumericNo && hasLetters(desc)) {
      const volRaw   = cell(row, VOL_IDX >= 0 ? VOL_IDX : 4);
      const unitRaw  = cell(row, UNIT_IDX >= 0 ? UNIT_IDX : 5);
      const priceRaw = cell(row, PRICE_IDX >= 0 ? PRICE_IDX : 6);
      const amtRaw   = cell(row, AMT_IDX >= 0 ? AMT_IDX : 11);
      const bobotRaw = cell(row, BOBOT_IDX >= 0 ? BOBOT_IDX : -1);

      let bobot = 0;
      if (typeof bobotRaw === "number" && !isNaN(bobotRaw)) {
        bobot = bobotRaw * 100; // decimal fraction → %
      } else if (typeof bobotRaw === "string" && bobotRaw) {
        bobot = fl(bobotRaw) * 100;
      }

      const price = fl(priceRaw);
      const vol   = fl(volRaw, 1);
      const amount = amtRaw !== "" && amtRaw !== null ? fl(amtRaw) : vol * price;

      if (!sections.has(currentSection)) sections.set(currentSection, { name: currentSectionName, items: [] });
      sections.get(currentSection)!.items.push({
        description: `${itemPrefix}${desc}`.trim(),
        unit: str(unitRaw) || "LS",
        volume: vol, price, amount,
        bobot,
        startOffsetDays: 0, durationDays: 0,
      });
    }
  }

  if (sections.size === 0) {
    errors.push(`Tidak ada data yang bisa diparsing dari sheet "${sheetName}"`);
  }

  return buildResult("Standard RAB", sections, title, location, scheduleStart, errors, warnings);
}

// ─── Format 3: Summary/Rekap (compact: only section + item rows) ─────────────

function parseSummaryRab(ws: XLSX.WorkSheet, sheetName: string): ParseResult {
  const errors: string[] = [], warnings: string[] = [];
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" }) as unknown[][];
  if (!rawRows.length) throw new Error("File kosong");

  // Project info (look for label rows)
  let title = "Proyek Baru", location = "";
  for (let i = 0; i < 15 && i < rawRows.length; i++) {
    const row = rawRows[i];
    const a = str(cell(row, 0)).toUpperCase();
    if (/PEKERJAAN/i.test(a) && i > 0) {
      // Title often in next non-empty cell
      for (let c = 1; c < row.length; c++) { const v = str(cell(row, c)); if (v && v !== ":") { title = v; break; } }
    } else if (/LOKASI/i.test(a)) {
      for (let c = 1; c < row.length; c++) { const v = str(cell(row, c)); if (v && v !== ":") { location = v; break; } }
    }
  }

  const sections = new Map<string, ParsedSection>();
  let currentSection = "Pekerjaan", currentSectionName = "Pekerjaan";

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const a = str(cell(row, 0));
    const b = str(cell(row, 1));
    const c = str(cell(row, 2));
    const d = str(cell(row, 3)); // typically amount column

    if (!a && !b) continue;

    // Section header: Roman numeral in col A
    if (isRoman(a) && hasLetters(b) && !/^\d/.test(b)) {
      if (!/TOTAL|SUB\s*TOTAL/i.test(b)) {
        currentSection = b || a;
        currentSectionName = b || a;
        if (!sections.has(currentSection)) sections.set(currentSection, { name: currentSectionName, items: [] });
      }
      continue;
    }

    // Item row: numeric no in col A + has description + has numeric amount in col C or D
    const amtCol = d && !isNaN(fl(d)) ? 3 : 2;
    const amountVal = fl(cell(row, amtCol));
    const bobotRaw = cell(row, amtCol + 1);

    if (!isNaN(parseInt(a)) && hasLetters(b) && amountVal > 0 && !/TOTAL|JUMLAH|DIBULATKAN|SUBTOTAL/i.test(b)) {
      let bobot = 0;
      if (typeof bobotRaw === "number" && !isNaN(bobotRaw)) {
        bobot = bobotRaw * 100; // decimal → %
      } else if (typeof bobotRaw === "string" && bobotRaw) {
        bobot = fl(bobotRaw) * 100;
      }

      if (!sections.has(currentSection)) sections.set(currentSection, { name: currentSectionName, items: [] });
      sections.get(currentSection)!.items.push({
        description: `${a} ${b}`.trim(),
        unit: "LS", volume: 1, price: 0, amount: amountVal,
        bobot,
        startOffsetDays: 0, durationDays: 0,
      });
    }
  }

  if (sections.size === 0) {
    errors.push(`Tidak ada data yang bisa diparsing dari sheet "${sheetName}"`);
  }

  const scheduleStart = new Date().toISOString().slice(0, 10);
  return buildResult("Summary/Rekap", sections, title, location, scheduleStart, errors, warnings);
}

// ─── Shared result builder ────────────────────────────────────────────────────

function buildResult(
  format: string,
  sections: Map<string, ParsedSection>,
  title: string,
  location: string,
  scheduleStart: string,
  errors: string[],
  warnings: string[],
): ParseResult {
  const allItems = Array.from(sections.values()).flatMap(s => s.items);
  const totalBobot = allItems.reduce((s, i) => s + i.bobot, 0);

  if (totalBobot > 0 && (totalBobot < 99 || totalBobot > 101)) {
    warnings.push(`Total bobot ${totalBobot.toFixed(2)}% (idealnya 100%)`);
  }

  let earliestStart: string | null = null;
  let latestEnd: string | null = null;
  let totalDuration = 0;
  for (const item of allItems) {
    if (earliestStart === null || item.startOffsetDays < parseInt(earliestStart)) earliestStart = String(item.startOffsetDays);
    const itemEnd = item.startOffsetDays + item.durationDays;
    if (itemEnd > totalDuration) totalDuration = itemEnd;
    if (itemEnd > 0 && (latestEnd === null || itemEnd > parseInt(latestEnd))) latestEnd = String(itemEnd);
  }

  return {
    format,
    sheetUsed: "",
    valid: errors.length === 0,
    errors,
    warnings,
    project: { title, location, scheduleStart, sections: Array.from(sections.values()) },
    stats: { totalSections: sections.size, totalItems: allItems.length, totalBobot, earliestStart, latestEnd, totalDuration },
  };
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

function parseExcel(buf: Buffer): ParseResult {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

  // Find best sheet
  let bestSheet = wb.SheetNames[0];
  let bestScore = -1;

  const scoreSheet = (name: string): number => {
    const ws = wb.Sheets[name];
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" }) as unknown[][];
    let score = 0;
    const flat = rawRows.flatMap(r => (r as unknown[]).map(v => str(v).toUpperCase())).join(" ");

    if (/URAIAN|PEKERJAAN|VOLUME|SATUAN|HARGA|JUMLAH/i.test(flat)) score += 10;
    if (/BOBOT/i.test(flat)) score += 5;
    if (/PEKERJAAN PERSIAPAN|LANTAI|STRUKTUR|ARSITEKTUR/i.test(flat)) score += 3;
    if (/REKAP|SUMMARY|COVER|TEMPLATE|ANALISA/i.test(name.toUpperCase())) score -= 5;
    if (/RAB|QUANTITY|BUDGET|BIAYA|BOQ/i.test(name.toUpperCase())) score += 4;
    // Penalize timeline/schedule sheets
    if (/SCHEDULE|S-CURVE|TIMELINE|CURVE|SHIFT/i.test(name.toUpperCase())) score -= 8;
    if (rawRows.length > 20) score += 2;
    if (rawRows.length < 5) score -= 10;

    return score;
  };

  for (const name of wb.SheetNames) {
    const s = scoreSheet(name);
    if (s > bestScore) { bestScore = s; bestSheet = name; }
  }

  const ws = wb.Sheets[bestSheet];

  // Try formats in order of specificity
  if (detectPasebanFormat(ws)) {
    const result = parsePasebanFormat(ws);
    result.sheetUsed = bestSheet;
    return result;
  }

  // Non-PASEBAN: try Standard RAB first
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];

  // Detect header row: scan first 20 rows for "NO" in a row that also has URAIAN/VOLUME/etc.
  let headerRowIdx = -1;
  const headerTerms = ["NO","NO.","ITEM","#"];
  for (let i = 0; i < Math.min(20, rawRows.length); i++) {
    const vals = (rawRows[i] as unknown[]).map(v => str(v).toUpperCase());
    const hasItemCol = headerTerms.some(t => vals.some(v => v.includes(t)));
    const hasDataCol = vals.some(v => /URAIAN|PEKERJAAN|VOLUME|SATUAN|HARGA|JUMLAH|DESCRIPTION/i.test(v));
    if (hasItemCol && hasDataCol) { headerRowIdx = i; break; }
  }

  if (headerRowIdx >= 0) {
    const result = parseStandardRab(ws, bestSheet, headerRowIdx);
    result.sheetUsed = bestSheet;
    return result;
  }

  // Summary/Rekap format
  const result = parseSummaryRab(ws, bestSheet);
  result.sheetUsed = bestSheet;
  return result;
}

// ─── API Endpoints ───────────────────────────────────────────────────────────

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
        format: result.format,
        sheetUsed: result.sheetUsed,
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
    sections?: {
      name: string;
      items: {
        description: string;
        unit: string;
        volume: number;
        unitPrice: number;
        amount: number;
        bobot: number;
        startOffsetDays: number;
        durationDays: number;
      }[];
    }[];
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
            description: item.description || "",
            unit: item.unit || "LS",
            volume: item.volume || 1,
            unitPrice: item.unitPrice || 0,
            amount: item.amount || 0,
            startOffsetDays: item.startOffsetDays || 0,
            durationDays: item.durationDays || 0,
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
