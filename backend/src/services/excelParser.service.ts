/**
 * Excel Parser Service for TIME LINE (RE-SCHEDULE) format
 * Parses Excel files with specific structure:
 * - Row 1: Project name header
 * - Row 2: Location header
 * - Row 3: Date header
 * - Row 5: Column headers (BOBOT, DURASI, TIME SCHEDULE, RE-SCHEDULE)
 * - Row 6: Headers with week numbers (W1, W2, W3...) as Excel serial dates
 * - Row 7: Week labels (W1, W2, W3...)
 * - Rows 10+: Work items with schedule data
 */

import * as XLSX from "xlsx";
import { ApiError } from "@/utils/ApiError";

// Excel epoch: January 1, 1900 = 1
// Note: Excel has a bug where it treats 1900 as a leap year, so we need to account for that
const EXCEL_EPOCH = new Date(1899, 11, 30); // Dec 30, 1899 in local time

export interface TimelineHeader {
  projectName: string;
  location: string;
  date: string;
}

export interface TimelineItem {
  no: string;
  description: string;
  bobot: number; // Weight percentage
  mulai: string | null; // Start date as ISO string
  selesai: string | null; // End date as ISO string
  durationDays: number;
  startOffsetDays: number;
  weeklyWeights: { week: number; weight: number }[];
}

export interface TimelineSection {
  order: number;
  name: string;
  items: TimelineItem[];
}

export interface ParsedTimeline {
  header: TimelineHeader;
  scheduleStart: string;
  weeks: { label: string; startDate: string; endDate: string }[];
  sections: TimelineSection[];
  totalBobot: number;
}

/**
 * Convert Excel serial date to ISO date string
 * Excel epoch: January 1, 1900 = 1
 */
function excelSerialToDate(serial: number): Date {
  if (!serial || serial <= 0) {
    return new Date(NaN);
  }
  // Account for Excel's leap year bug (it incorrectly treats 1900 as a leap year)
  const msFromEpoch = (serial - 1) * 24 * 60 * 60 * 1000;
  const date = new Date(EXCEL_EPOCH.getTime() + msFromEpoch);
  return date;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  if (isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse week label from cell value (e.g., "W1", "Week 1", 1)
 */
function parseWeekLabel(value: unknown): { weekNumber: number; label: string } | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const str = String(value).trim();

  // Match patterns like "W1", "Week 1", "1", "minggu 1"
  const wMatch = str.match(/^W(\d+)$/i);
  if (wMatch) {
    return { weekNumber: parseInt(wMatch[1], 10), label: str.toUpperCase() };
  }

  const weekMatch = str.match(/^(?:week|minggu|pekan)\s*(\d+)$/i);
  if (weekMatch) {
    return { weekNumber: parseInt(weekMatch[1], 10), label: `W${weekMatch[1]}` };
  }

  const numMatch = str.match(/^(\d+)$/);
  if (numMatch) {
    return { weekNumber: parseInt(numMatch[1], 10), label: `W${numMatch[1]}` };
  }

  return null;
}

/**
 * Check if a row is a section header (Roman numeral based)
 * Supports: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, etc.
 * And nested: I.A, I.B, II.1, II.2, etc.
 */
function parseSectionHeader(value: unknown): { isSection: boolean; name: string; level: number; order: number } | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const str = String(value).trim();

  // Valid Roman numerals
  const validRomans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
                       "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

  // Roman numeral patterns: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, etc.
  // With optional suffix like .A, .B, .1, .2, or just the letter/number alone
  const romanPattern = /^([IVXLCDM]+)(?:\.([A-Z0-9]+))?\s*[-:]?\s*(.+)?$/i;
  const match = str.match(romanPattern);

  if (match) {
    const romanPart = match[1].toUpperCase();
    const suffix = match[2] || "";
    const description = match[3] || "";

    if (validRomans.includes(romanPart)) {
      // Calculate order: convert Roman to number
      const romanToInt: Record<string, number> = {
        "I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000
      };

      let order = 0;
      let prevValue = 0;
      for (let i = romanPart.length - 1; i >= 0; i--) {
        const currValue = romanToInt[romanPart[i]] || 0;
        if (currValue < prevValue) {
          order -= currValue;
        } else {
          order += currValue;
        }
        prevValue = currValue;
      }

      // Add suffix weight for ordering nested sections
      if (suffix) {
        if (/^[A-Z]$/.test(suffix)) {
          order = order * 100 + (suffix.charCodeAt(0) - 64); // A=1, B=2, etc.
        } else if (/^\d+$/.test(suffix)) {
          order = order * 100 + parseInt(suffix, 10);
        }
      }

      const name = suffix ? `${romanPart}.${suffix}${description ? " " + description : ""}` :
                    `${romanPart}${description ? " " + description : ""}`;

      return {
        isSection: true,
        name: name.trim(),
        level: suffix ? (suffix.length === 1 && /[A-Z]/.test(suffix) ? 2 : 2) : 1,
        order
      };
    }
  }

  // Also check for standalone Roman numerals
  if (validRomans.includes(str.toUpperCase()) ||
      /^[IVXLCDM]+\s*[-:]\s*.+$/i.test(str)) {
    const cleanMatch = str.match(/^([IVXLCDM]+)\s*[-:]\s*(.+)$/i);
    if (cleanMatch) {
      const romanPart = cleanMatch[1].toUpperCase();
      const description = cleanMatch[2].trim();

      const romanToInt: Record<string, number> = {
        "I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000
      };

      let order = 0;
      let prevValue = 0;
      for (let i = romanPart.length - 1; i >= 0; i--) {
        const currValue = romanToInt[romanPart[i]] || 0;
        if (currValue < prevValue) {
          order -= currValue;
        } else {
          order += currValue;
        }
        prevValue = currValue;
      }

      return {
        isSection: true,
        name: `${romanPart} - ${description}`,
        level: 1,
        order
      };
    }
  }

  return null;
}

/**
 * Check if a row appears to be empty or a separator
 */
function isEmptyRow(row: unknown[]): boolean {
  if (!row || !Array.isArray(row)) {
    return true;
  }
  return row.every(cell => cell === null || cell === undefined || cell === "");
}

/**
 * Get column letter from index (0-based)
 */
function colLetter(colIndex: number): string {
  let letter = "";
  let n = colIndex;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

/**
 * Get column index from letter (A=0, B=1, etc.)
 */
function colIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Main parsing function - parse TIME LINE Excel file
 */
export function parseTimelineExcel(buffer: Buffer): ParsedTimeline {
  try {
    // Read workbook
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON for easier processing
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: false
    }) as unknown[][];

    if (!rawData || rawData.length < 10) {
      throw ApiError.badRequest("Excel file is too short or invalid");
    }

    // Parse header information (rows 1-3)
    const header = parseHeader(rawData);

    // Parse column structure (rows 5-7)
    const columnInfo = parseColumnInfo(rawData);

    if (!columnInfo.weekDates || columnInfo.weekDates.length === 0) {
      throw ApiError.badRequest("No week information found in the Excel file");
    }

    const scheduleStart = formatDate(columnInfo.weekDates[0]);

    // Parse work items (rows 10+)
    const { sections, totalBobot } = parseWorkItems(rawData, columnInfo, scheduleStart);

    return {
      header,
      scheduleStart,
      weeks: columnInfo.weeks,
      sections,
      totalBobot
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.badRequest(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parse header rows (rows 1-3, 1-indexed)
 *
 * ACTUAL layout found via file inspection:
 *   Row 1 (idx 0): col0="Proyek" col3=":" col4="RENOVASI RUMAH  "
 *   Row 2 (idx 1): col0="Lokasi" col3=":" col4="Jl. Kramat Sawah No. E335, ..."
 *   Row 3 (idx 2): col0="Date" col3=":" col4="10 Oktober 2025"
 *   Row 5 (idx 4): BOBOT, DURASI, TIME SCHEDULE, RE-SCHEDULE headers
 */
function parseHeader(rawData: unknown[][]): TimelineHeader {
  const row1 = rawData[0] || [];
  const row2 = rawData[1] || [];
  const row3 = rawData[2] || [];

  // Project name: row1 col 4 (idx 4) — skip col 0 which has "Proyek" label
  let projectName = String(row1[4] || row1[0] || "").trim();

  // Location: row2 col 4 (idx 4)
  let location = String(row2[4] || row2[0] || "").trim();
  // Strip "Lokasi" prefix if present
  if (location.toLowerCase().startsWith("lokasi")) {
    location = location.replace(/^lokasi\s*:/i, "").trim();
  }

  // Date: row3 col 4 (idx 4) — "10 Oktober 2025"
  let date = String(row3[4] || "").trim();
  // Parse Indonesian month names
  const months: Record<string, number> = {
    JANUARI: 1, FEBRUARI: 2, MARET: 3, APRIL: 4, MEI: 5, JUNI: 6,
    JULI: 7, AGUSTUS: 8, SEPTEMBER: 9, OKTOBER: 10, NOVEMBER: 11, DESEMBER: 12
  };
  const dateMatch = date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthNum = months[dateMatch[2].toUpperCase()] || 1;
    const year = parseInt(dateMatch[3]);
    const parsed = new Date(year, monthNum - 1, day);
    if (!isNaN(parsed.getTime())) {
      date = parsed.getFullYear() + "-" + String(parsed.getMonth() + 1).padStart(2, "0") + "-" + String(parsed.getDate()).padStart(2, "0");
    }
  }

  return { projectName, location, date };
}

/**
 * Parse column information from rows 5-7 (0-indexed: 4-6)
 *
 * ACTUAL structure found via file inspection:
 *   Row 5 (idx 4): [null x7] "BOBOT" [null x2] "DURASI" [null x2] "TIME SCHEDULE" [null x25] "RE-SCHEDULE"
 *   Row 6 (idx 5): [null x7] "PEKERJAAN" "MULAI" "SELESAI" "PEKERJAAN" (HARI)
 *   Row 7 (idx 6): [null x7] [null x3] "HARI" [null x6] W1 W2 W3...
 *   Row 8 (idx 7): [null x7] [null x3] [null x2] DD/MM/YY dates per week
 *   Row 11 (idx 10): DATA rows — "0.36%" "10/10/25" "24/10/25" 14
 *
 * Key findings (cellDates: true + raw: false):
 *   - BOBOT in formatted cells = string "X.XX%"
 *   - MULAI/SELESAI in formatted cells = string "DD/MM/YY"
 *   - Week date row = idx 7, first date at idx 12 (W1 = 10/10/25)
 *   - Data rows start at idx 10
 */
function parseColumnInfo(rawData: unknown[][]): {
  bobotCol: number;
  mulaiCol: number;
  selesaiCol: number;
  durationCol: number;
  weeklyStartCol: number;
  weeks: { label: string; startDate: string; endDate: string }[];
  weekDates: Date[];
} {
  // Scan row 5 (idx 4) for BOBOT and DURASI
  const row5 = rawData[4] || [];
  let bobotCol = -1;
  let durationCol = -1;
  for (let i = 0; i < row5.length; i++) {
    const header = String(row5[i] || "").toUpperCase().trim();
    if (header.includes("BOBOT") && bobotCol === -1) bobotCol = i;
    if ((header.includes("DURASI") || header.includes("DURATION")) && durationCol === -1) durationCol = i;
  }

  // Scan row 6 (idx 5) for MULAI and SELESAI headers
  const row6 = rawData[5] || [];
  let mulaiCol = -1;
  let selesaiCol = -1;
  for (let i = 0; i < row6.length; i++) {
    const header = String(row6[i] || "").toUpperCase().trim();
    if ((header.includes("MULAI") || header.includes("START")) && mulaiCol === -1) mulaiCol = i;
    if ((header.includes("SELESAI") || header.includes("END")) && selesaiCol === -1) selesaiCol = i;
  }

  // Fallback to known positions if header scan fails
  // PASEBAN file: BOBOT=7, MULAI=8, SELESAI=9, DURASI=10
  if (bobotCol < 0) bobotCol = 7;
  if (mulaiCol < 0) mulaiCol = 8;
  if (selesaiCol < 0) selesaiCol = 9;
  if (durationCol < 0) durationCol = 10;

  // Week dates are in row 8 (idx 7), formatted as "DD/MM/YY" strings
  // First date column = idx 12 (W1)
  const weekDateRow = rawData[7] || [];
  const WEEKLY_START = 12; // First weekly date column (W1)

  // Parse weekly dates
  const DATE_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  const weeks: { label: string; startDate: string; endDate: string }[] = [];
  const weekDates: Date[] = [];

  const row7Labels = rawData[6] || [];

  for (let i = WEEKLY_START; i < weekDateRow.length; i++) {
    const rawVal = weekDateRow[i];
    if (rawVal === null || rawVal === undefined) break;

    const dateStr = String(rawVal).trim();
    const match = dateStr.match(DATE_REGEX);
    if (!match) break;

    let yr = parseInt(match[3]);
    if (yr < 100) yr += yr > 50 ? 1900 : 2000;
    const date = new Date(yr, parseInt(match[2]) - 1, parseInt(match[1]));
    if (isNaN(date.getTime())) break;

    const label = row7Labels[i] ? String(row7Labels[i]).trim() : `W${i - WEEKLY_START + 1}`;
    const labelStr = label.startsWith("W") ? label.toUpperCase() : `W${label}`;

    // Week end: next date - 1 day
    let endDate: Date;
    let nextVal = weekDateRow[i + 1];
    if (nextVal !== null && nextVal !== undefined) {
      const nextStr = String(nextVal).trim();
      const nextMatch = nextStr.match(DATE_REGEX);
      if (nextMatch) {
        let nyr = parseInt(nextMatch[3]);
        if (nyr < 100) nyr += nyr > 50 ? 1900 : 2000;
        endDate = new Date(nyr, parseInt(nextMatch[2]) - 1, parseInt(nextMatch[1]));
        endDate.setDate(endDate.getDate() - 1);
      } else {
        endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
      }
    } else {
      endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
    }

    weeks.push({ label: labelStr, startDate: formatDate(date), endDate: formatDate(endDate) });
    weekDates.push(date);
  }

  return {
    bobotCol,
    mulaiCol,
    selesaiCol,
    durationCol,
    weeklyStartCol: WEEKLY_START,
    weeks,
    weekDates
  };
}

/**
 * Parse work items from rows 10+ (0-indexed: 10)
 *
 * ACTUAL file structure (cellDates:true + raw:false):
 *   - BOBOT cell: string "X.XX%" (e.g. "0.36%") or null
 *   - MULAI/SELESAI cells: string "DD/MM/YY" (e.g. "10/10/25")
 *   - DURASI cell: integer string or number (e.g. "14" or 14)
 *   - Weekly weights: string "X.XX%" or null
 *   - Data starts at row index 10 (Row 11, 1-indexed)
 */
function parseWorkItems(
  rawData: unknown[][],
  columnInfo: ReturnType<typeof parseColumnInfo>,
  scheduleStart: string
): { sections: TimelineSection[]; totalBobot: number } {
  const sections: TimelineSection[] = [];
  let currentSection: TimelineSection | null = null;
  let itemOrder = 0;
  let sectionOrder = 0;
  let totalBobot = 0;

  const NO_COL = 0;
  const DESC_COL = 1;
  const BOBOT_COL = columnInfo.bobotCol >= 0 ? columnInfo.bobotCol : 7;
  const MULAI_COL = columnInfo.mulaiCol >= 0 ? columnInfo.mulaiCol : 8;
  const SELESAI_COL = columnInfo.selesaiCol >= 0 ? columnInfo.selesaiCol : 9;
  const DURASI_COL = columnInfo.durationCol >= 0 ? columnInfo.durationCol : 10;
  const WEEKLY_START = columnInfo.weeklyStartCol >= 0 ? columnInfo.weeklyStartCol : 13;

  // Parse schedule start using LOCAL time (Jakarta UTC+7)
  const startDate = new Date(scheduleStart + "T00:00:00");
  const startDateMs = startDate.getTime();

  // Parse DD/MM/YY date string to Date (local time)
  const DATE_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  function parseDMY(v: unknown): Date | null {
    if (!v) return null;
    const s = String(v).trim();
    const m = s.match(DATE_REGEX);
    if (!m) return null;
    let yr = parseInt(m[3]);
    if (yr < 100) yr += yr > 50 ? 1900 : 2000;
    const d = new Date(yr, parseInt(m[2]) - 1, parseInt(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Parse bobot: "X.XX%" string -> number (keep as decimal fraction, e.g. 0.36)
  // Or if raw number: treat as fraction (e.g. 0.0036 from raw Excel)
  function parseBobot(v: unknown): number {
    if (v === null || v === undefined || v === "") return 0;
    const s = String(v).trim();
    const withoutPct = s.replace("%", "").replace(",", ".");
    const num = parseFloat(withoutPct);
    if (isNaN(num)) return 0;
    // If value > 1, assume it's a percentage string like "0.36" or "36"
    // If value <= 1, it might already be a decimal (raw Excel fraction)
    if (num > 1) return Math.round(num * 100) / 100; // percentage string
    return Math.round(num * 10000) / 100; // convert fraction to percent
  }

  // Roman numeral list for section detection
  const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII"];

  // Start from row index 10 (Row 11, 1-indexed)
  for (let rowIdx = 10; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || isEmptyRow(row)) continue;

    const no = String(row[NO_COL] || "").trim();
    const description = String(row[DESC_COL] || "").trim();

    // Skip subsection parent headers:
    // "Pekerjaan balok" has bobot=0 and a number prefix, but its sub-items
    // (e.g. 3.1, 3.2) come in the next rows with bobot data
    const bobotRaw = row[BOBOT_COL];
    const isSubHeader = no !== "" && /^\d+$/.test(no) && description.includes("balok") && parseBobot(bobotRaw) === 0;
    if (isSubHeader) continue;

    // Roman numeral section header — NO col has Roman numeral, description has work name
    if (romanNumerals.includes(no.toUpperCase())) {
      if (description.toUpperCase().includes("TOTAL")) continue;
      // Build section name: "II" + " PEKERJAAN FONDASI" -> "II. PEKERJAAN FONDASI"
      const sectionName = description ? no + ". " + description : no;
      currentSection = {
        order: sectionOrder++,
        name: sectionName,
        items: []
      };
      sections.push(currentSection);
      itemOrder = 0;
      continue;
    }

    // Sub-section header: single letter + LANTAI (e.g. "A" + "LANTAI 1")
    if (/^[A-Z]$/.test(no) && description.toUpperCase().includes("LANTAI")) {
      if (currentSection) currentSection.name += " / " + no + ". " + description;
      continue;
    }

    // Skip rows without meaningful data
    if (!no || no === "" || no === "-" || description === "") continue;

    // Parse bobot
    const bobot = parseBobot(bobotRaw);

    // Parse dates (DD/MM/YY strings)
    let mulai: Date | null = null;
    let selesai: Date | null = null;
    const mulaiRaw = row[MULAI_COL];
    const selesaiRaw = row[SELESAI_COL];

    if (mulaiRaw !== null && mulaiRaw !== undefined && mulaiRaw !== "") {
      mulai = parseDMY(mulaiRaw);
    }
    if (selesaiRaw !== null && selesaiRaw !== undefined && selesaiRaw !== "") {
      selesai = parseDMY(selesaiRaw);
    }

    // Parse duration
    let durationDays = 0;
    const durasiRaw = row[DURASI_COL];
    if (durasiRaw !== null && durasiRaw !== undefined && durasiRaw !== "") {
      durationDays = typeof durasiRaw === "number"
        ? Math.round(durasiRaw)
        : parseInt(String(durasiRaw).replace(",", "").trim(), 10) || 0;
    }

    // Calculate start offset from schedule start (using local time)
    let startOffsetDays = 0;
    if (mulai && !isNaN(mulai.getTime())) {
      startOffsetDays = Math.max(0, Math.floor((mulai.getTime() - startDateMs) / (24 * 60 * 60 * 1000)));
    }

    // Parse weekly weights (string "X.XX%" -> number)
    const weeklyWeights: { week: number; weight: number }[] = [];
    for (let colIdx = WEEKLY_START; colIdx < row.length; colIdx++) {
      const weightRaw = row[colIdx];
      if (weightRaw !== null && weightRaw !== undefined && weightRaw !== "") {
        const w = parseBobot(weightRaw);
        if (w > 0) {
          weeklyWeights.push({ week: colIdx - WEEKLY_START + 1, weight: w });
        }
      }
    }

    // Use bobot column value if present, otherwise sum weekly weights
    const calculatedBobot = bobot > 0 ? bobot : weeklyWeights.reduce((sum, w) => sum + w.weight, 0);

    totalBobot += calculatedBobot;

    if (!currentSection) {
      currentSection = { order: sectionOrder++, name: "General", items: [] };
      sections.push(currentSection);
    }

    currentSection.items.push({
      no,
      description,
      bobot: calculatedBobot,
      mulai: mulai && !isNaN(mulai.getTime()) ? formatDate(mulai) : null,
      selesai: selesai && !isNaN(selesai.getTime()) ? formatDate(selesai) : null,
      durationDays,
      startOffsetDays,
      weeklyWeights
    });

    itemOrder++;
  }

  return { sections, totalBobot };
}

/**
 * Convert parsed timeline to import format expected by the controller
 */
export function timelineToImportFormat(parsed: ParsedTimeline): {
  rab: {
    number: string;
    title: string;
    clientName?: string;
    location?: string;
    projectDate?: string;
    scheduleStart: string;
    restDays?: number[];
    notes?: string;
  };
  sections: {
    order: number;
    name: string;
    items: {
      order: number;
      description: string;
      unit?: string;
      volume?: number;
      unitPrice?: number;
      amount?: number;
      startOffsetDays: number;
      durationDays: number;
    }[];
  }[];
  holidays?: { date: string; name: string }[];
} {
  // Generate RAB number
  const now = new Date();
  const year = now.getFullYear();
  const randomNum = Math.floor(Math.random() * 900) + 100;
  const number = `RAB/${year}/${randomNum}`;

  // Convert sections
  const sections = parsed.sections.map((section, sectionIdx) => ({
    order: section.order,
    name: section.name,
    items: section.items.map((item, itemIdx) => ({
      order: itemIdx,
      description: item.description,
      unit: "LS", // Default unit
      volume: 1, // Default volume
      unitPrice: 0, // No price data from timeline
      amount: 0,
      startOffsetDays: item.startOffsetDays,
      durationDays: item.durationDays
    }))
  }));

  return {
    rab: {
      number,
      title: parsed.header.projectName || "Imported Timeline",
      clientName: undefined,
      location: parsed.header.location || undefined,
      projectDate: parsed.header.date || undefined,
      scheduleStart: parsed.scheduleStart,
      restDays: [0], // Default: Sunday rest
      notes: `Imported from TIME LINE (RE-SCHEDULE) - Total bobot: ${parsed.totalBobot.toFixed(2)}%`
    },
    sections,
    holidays: []
  };
}

/**
 * Validate parsed timeline
 */
export function validateParsedTimeline(parsed: ParsedTimeline): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!parsed.scheduleStart) {
    errors.push("Schedule start date is missing");
  }

  if (parsed.sections.length === 0) {
    errors.push("No sections found in the file");
  }

  let totalItems = 0;
  for (const section of parsed.sections) {
    totalItems += section.items.length;
  }

  if (totalItems === 0) {
    errors.push("No work items found in the file");
  }

  // Check for items without duration
  const itemsWithoutDuration = parsed.sections
    .flatMap(s => s.items)
    .filter(item => item.durationDays <= 0);

  if (itemsWithoutDuration.length > 0 && itemsWithoutDuration.length === totalItems) {
    errors.push("All items have zero duration - please check the DURASI column");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
