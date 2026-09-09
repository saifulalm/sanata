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
 * Parse header rows (rows 1-3)
 */
function parseHeader(rawData: unknown[][]): TimelineHeader {
  const row1 = rawData[0] || [];
  const row2 = rawData[1] || [];
  const row3 = rawData[2] || [];

  // Try to extract project name - usually in first column or spans multiple columns
  let projectName = String(row1[0] || "").trim();

  // Try to find location - usually in row 2
  let location = "";
  for (const cell of row2) {
    if (cell && String(cell).toLowerCase().includes("lokasi")) {
      const parts = String(cell).split(":");
      if (parts.length > 1) {
        location = parts.slice(1).join(":").trim();
      }
    }
  }
  // Fallback: use first cell of row 2
  if (!location && row2[0]) {
    location = String(row2[0]).trim();
  }

  // Try to extract date - usually in row 3
  let date = "";
  for (const cell of row3) {
    if (cell) {
      const cellStr = String(cell);
      // Check if it looks like a date
      const dateMatch = cellStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        date = cellStr;
        break;
      }
      // Also check if cell itself is a date value
      const parsed = new Date(cellStr);
      if (!isNaN(parsed.getTime())) {
        date = formatDate(parsed);
        break;
      }
    }
  }

  return { projectName, location, date };
}

/**
 * Parse column information from rows 5-7
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
  const row5 = rawData[4] || []; // Row 5 (index 4) - column headers
  const row6 = rawData[5] || []; // Row 6 (index 5) - week serial dates
  const row7 = rawData[6] || []; // Row 7 (index 6) - week labels

  // Find column indices
  let bobotCol = -1;
  let mulaiCol = -1;
  let selesaiCol = -1;
  let durationCol = -1;
  let weeklyStartCol = -1;

  for (let i = 0; i < row5.length; i++) {
    const header = String(row5[i] || "").toUpperCase().trim();
    if (header.includes("BOBOT") && bobotCol === -1) {
      bobotCol = i;
    }
    if ((header.includes("MULAI") || header.includes("START")) && mulaiCol === -1) {
      mulaiCol = i;
    }
    if ((header.includes("SELESAI") || header.includes("SELESAI") || header.includes("END")) && selesaiCol === -1) {
      selesaiCol = i;
    }
    if ((header.includes("DURASI") || header.includes("DURATION")) && durationCol === -1) {
      durationCol = i;
    }
  }

  // Find where weekly columns start (after TIME SCHEDULE or RE-SCHEDULE headers)
  let foundScheduleHeader = false;
  for (let i = 0; i < row5.length; i++) {
    const header = String(row5[i] || "").toUpperCase().trim();
    if (header.includes("TIME SCHEDULE") || header.includes("RE-SCHEDULE")) {
      foundScheduleHeader = true;
      continue;
    }
    if (foundScheduleHeader && row6[i] !== null && row6[i] !== undefined && row6[i] !== "") {
      // Check if this looks like a date (serial number)
      const val = Number(row6[i]);
      if (!isNaN(val) && val > 0) {
        weeklyStartCol = i;
        break;
      }
    }
  }

  // Parse weekly information
  const weeks: { label: string; startDate: string; endDate: string }[] = [];
  const weekDates: Date[] = [];

  if (weeklyStartCol >= 0) {
    for (let i = weeklyStartCol; i < row6.length; i++) {
      const serial = Number(row6[i]);
      if (isNaN(serial) || serial <= 0) break;

      const date = excelSerialToDate(serial);
      if (isNaN(date.getTime())) break;

      // Get label from row 7
      const label = row7[i] ? String(row7[i]).trim() : `W${i - weeklyStartCol + 1}`;

      // Calculate week end (7 days later, or until next date)
      let endDate: Date;
      if (i + 1 < row6.length) {
        const nextSerial = Number(row6[i + 1]);
        if (!isNaN(nextSerial) && nextSerial > 0) {
          endDate = excelSerialToDate(nextSerial - 1);
        } else {
          endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
        }
      } else {
        endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
      }

      weeks.push({
        label: label.startsWith("W") ? label.toUpperCase() : `W${label}`,
        startDate: formatDate(date),
        endDate: formatDate(endDate)
      });
      weekDates.push(date);
    }
  }

  return {
    bobotCol,
    mulaiCol,
    selesaiCol,
    durationCol,
    weeklyStartCol,
    weeks,
    weekDates
  };
}

/**
 * Parse work items from rows 10+
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

  // Column indices (using standard layout, fallback to common positions)
  const NO_COL = 0;
  const DESC_COL = 1;
  const BOBOT_COL = columnInfo.bobotCol >= 0 ? columnInfo.bobotCol : 2;
  const MULAI_COL = columnInfo.mulaiCol >= 0 ? columnInfo.mulaiCol : 3;
  const SELESAI_COL = columnInfo.selesaiCol >= 0 ? columnInfo.selesaiCol : 4;
  const DURASI_COL = columnInfo.durationCol >= 0 ? columnInfo.durationCol : 5;
  const WEEKLY_START = columnInfo.weeklyStartCol >= 0 ? columnInfo.weeklyStartCol : 7;

  const startDate = new Date(scheduleStart);

  // Start from row 9 (index 9) - work items section
  for (let rowIdx = 9; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || isEmptyRow(row)) continue;

    const no = String(row[NO_COL] || "").trim();
    const description = String(row[DESC_COL] || "").trim();

    // Check if this is a section header
    const sectionInfo = parseSectionHeader(no) || parseSectionHeader(description);
    if (sectionInfo) {
      // Start new section
      currentSection = {
        order: sectionOrder++,
        name: sectionInfo.name,
        items: []
      };
      sections.push(currentSection);
      itemOrder = 0;
      continue;
    }

    // Skip empty rows or rows without a valid NO
    if (!no || no === "" || no === "-" || description === "") {
      continue;
    }

    // Parse bobot (weight)
    let bobot = 0;
    const bobotRaw = row[BOBOT_COL];
    if (bobotRaw !== null && bobotRaw !== undefined && bobotRaw !== "") {
      bobot = parseFloat(String(bobotRaw).replace(",", ".")) || 0;
    }

    // Parse dates
    let mulai: Date | null = null;
    let selesai: Date | null = null;

    const mulaiRaw = row[MULAI_COL];
    if (mulaiRaw !== null && mulaiRaw !== undefined && mulaiRaw !== "") {
      const mulaiSerial = parseFloat(String(mulaiRaw));
      if (!isNaN(mulaiSerial) && mulaiSerial > 0) {
        mulai = excelSerialToDate(mulaiSerial);
      }
    }

    const selesaiRaw = row[SELESAI_COL];
    if (selesaiRaw !== null && selesaiRaw !== undefined && selesaiRaw !== "") {
      const selesaiSerial = parseFloat(String(selesaiRaw));
      if (!isNaN(selesaiSerial) && selesaiSerial > 0) {
        selesai = excelSerialToDate(selesaiSerial);
      }
    }

    // Parse duration
    let durationDays = 0;
    const durasiRaw = row[DURASI_COL];
    if (durasiRaw !== null && durasiRaw !== undefined && durasiRaw !== "") {
      durationDays = parseInt(String(durasiRaw), 10) || 0;
    }

    // Calculate start offset from schedule start
    let startOffsetDays = 0;
    if (mulai && !isNaN(mulai.getTime())) {
      const diffMs = mulai.getTime() - startDate.getTime();
      startOffsetDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
    }

    // Parse weekly weights
    const weeklyWeights: { week: number; weight: number }[] = [];
    for (let colIdx = WEEKLY_START; colIdx < row.length; colIdx++) {
      const weightRaw = row[colIdx];
      if (weightRaw !== null && weightRaw !== undefined && weightRaw !== "") {
        const weight = parseFloat(String(weightRaw).replace(",", ".")) || 0;
        if (weight > 0) {
          weeklyWeights.push({
            week: colIdx - WEEKLY_START + 1,
            weight
          });
        }
      }
    }

    // Use weekly weights sum if bobot is not set, otherwise use the bobot column value
    const calculatedBobot = bobot > 0 ? bobot :
      weeklyWeights.reduce((sum, w) => sum + w.weight, 0);

    totalBobot += calculatedBobot;

    // Add item to current section or create a default section
    if (!currentSection) {
      currentSection = {
        order: sectionOrder++,
        name: "General",
        items: []
      };
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

  // If no sections were found, try to parse from the beginning
  if (sections.length === 0) {
    currentSection = {
      order: 0,
      name: "Ungrouped Items",
      items: []
    };
    sections.push(currentSection);

    for (let rowIdx = 9; rowIdx < rawData.length; rowIdx++) {
      const row = rawData[rowIdx];
      if (!row || isEmptyRow(row)) continue;

      const no = String(row[0] || "").trim();
      const description = String(row[1] || "").trim();

      if (!no || no === "" || no === "-" || description === "") {
        continue;
      }

      // Check for section header
      const sectionInfo = parseSectionHeader(no) || parseSectionHeader(description);
      if (sectionInfo) {
        currentSection = {
          order: sectionOrder++,
          name: sectionInfo.name,
          items: []
        };
        sections.push(currentSection);
        continue;
      }

      // Parse item data
      let bobot = 0;
      const bobotRaw = row[BOBOT_COL];
      if (bobotRaw !== null && bobotRaw !== undefined && bobotRaw !== "") {
        bobot = parseFloat(String(bobotRaw).replace(",", ".")) || 0;
      }

      let mulai: Date | null = null;
      let selesai: Date | null = null;
      let durationDays = 0;

      const mulaiRaw = row[MULAI_COL];
      if (mulaiRaw !== null && mulaiRaw !== undefined && mulaiRaw !== "") {
        const mulaiSerial = parseFloat(String(mulaiRaw));
        if (!isNaN(mulaiSerial) && mulaiSerial > 0) {
          mulai = excelSerialToDate(mulaiSerial);
        }
      }

      const selesaiRaw = row[SELESAI_COL];
      if (selesaiRaw !== null && selesaiRaw !== undefined && selesaiRaw !== "") {
        const selesaiSerial = parseFloat(String(selesaiRaw));
        if (!isNaN(selesaiSerial) && selesaiSerial > 0) {
          selesai = excelSerialToDate(selesaiSerial);
        }
      }

      const durasiRaw = row[DURASI_COL];
      if (durasiRaw !== null && durasiRaw !== undefined && durasiRaw !== "") {
        durationDays = parseInt(String(durasiRaw), 10) || 0;
      }

      let startOffsetDays = 0;
      if (mulai && !isNaN(mulai.getTime())) {
        const diffMs = mulai.getTime() - startDate.getTime();
        startOffsetDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
      }

      const weeklyWeights: { week: number; weight: number }[] = [];
      for (let colIdx = WEEKLY_START; colIdx < row.length; colIdx++) {
        const weightRaw = row[colIdx];
        if (weightRaw !== null && weightRaw !== undefined && weightRaw !== "") {
          const weight = parseFloat(String(weightRaw).replace(",", ".")) || 0;
          if (weight > 0) {
            weeklyWeights.push({
              week: colIdx - WEEKLY_START + 1,
              weight
            });
          }
        }
      }

      const calculatedBobot = bobot > 0 ? bobot :
        weeklyWeights.reduce((sum, w) => sum + w.weight, 0);

      totalBobot += calculatedBobot;

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
    }
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
