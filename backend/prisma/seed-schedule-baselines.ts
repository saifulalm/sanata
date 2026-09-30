/**
 * seed-schedule-baselines.ts
 * 
 * Comprehensive seed file for RAB Schedule Baselines (S-Curve) data.
 * Creates complex S-Curve schedules for all RAB projects.
 */

import { PrismaClient, ProgressStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Indonesian holidays for 2026
const INDONESIAN_HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "Tahun Baru Masehi" },
  { date: "2026-01-29", name: "Isra Mikraj Nabi Muhammad SAW" },
  { date: "2026-02-17", name: "Tahun Baru Imlek 2577 Kongzili" },
  { date: "2026-03-20", name: "Hari Raya Nyepi" },
  { date: "2026-03-29", name: "Minggu Palma" },
  { date: "2026-03-30", name: "Senin Putih" },
  { date: "2026-03-31", name: "Cuti Bersama Idulfitri" },
  { date: "2026-04-01", name: "Hari Raya Idulfitri 1447 H" },
  { date: "2026-04-02", name: "Hari Raya Idulfitri 1447 H" },
  { date: "2026-04-03", name: "Cuti Bersama Idulfitri" },
  { date: "2026-04-03", name: "Jumat Agung" },
  { date: "2026-05-01", name: "Hari Buruh Internasional" },
  { date: "2026-05-12", name: "Hari Raya Waisak 2569" },
  { date: "2026-05-14", name: "Kenaikan Isa Almasih" },
  { date: "2026-05-25", name: "Hari Lahir Nabi Muhammad SAW" },
  { date: "2026-06-01", name: "Hari Lahir Pancasila" },
  { date: "2026-08-17", name: "Hari Kemerdekaan RI ke-81" },
  { date: "2026-09-06", name: "Hari Raya Idhul Adha 1448 H" },
  { date: "2026-10-06", name: "Tahun Baru Islam 1448 H" },
  { date: "2026-11-20", name: "Maulid Nabi Muhammad SAW" },
  { date: "2026-12-25", name: "Hari Raya Natal" },
];
// Helper functions
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

type Scenario = "normal" | "delayed" | "accelerated";

// Generate S-Curve data points
function generateSCurvePoints(
  totalDays: number,
  startDate: Date,
  intervalDays: number = 7,
  scenario: Scenario = "normal"
): Array<{ date: string; day: number; planned: number; cumulativeBudget: number }> {
  const points = [];
  for (let day = 0; day <= totalDays; day += intervalDays) {
    const date = addDays(startDate, day);
    let plannedPercent: number;
    const x = day / totalDays;
    
    if (scenario === "delayed") {
      plannedPercent = 100 / (1 + Math.exp(-5 * (x - 0.55)));
    } else if (scenario === "accelerated") {
      plannedPercent = 100 / (1 + Math.exp(-7 * (x - 0.45)));
    } else {
      plannedPercent = 100 / (1 + Math.exp(-6 * (x - 0.5)));
    }

    points.push({
      date: formatDate(date),
      day,
      planned: Math.round(plannedPercent * 100) / 100,
      cumulativeBudget: Math.round(plannedPercent * 100 * 100) / 100,
    });
  }
  return points;
}
// Generate WBS
function generateWBS(totalAmount: number, startDate: Date): any {
  const baseBudget = Number(totalAmount);
  return {
    phase1_Persiapan: { code: "WBS-100", name: "Pekerjaan Persiapan", plannedStart: formatDate(startDate), plannedEnd: formatDate(addDays(startDate, 14)), plannedDays: 14, budget: baseBudget * 0.03, weight: 3 },
    phase2_Pondasi: { code: "WBS-200", name: "Pekerjaan Pondasi", plannedStart: formatDate(addDays(startDate, 12)), plannedEnd: formatDate(addDays(startDate, 57)), plannedDays: 45, budget: baseBudget * 0.12, weight: 12 },
    phase3_Struktur: { code: "WBS-300", name: "Pekerjaan Struktur", plannedStart: formatDate(addDays(startDate, 50)), plannedEnd: formatDate(addDays(startDate, 145)), plannedDays: 95, budget: baseBudget * 0.35, weight: 35 },
    phase4_Arsitektur: { code: "WBS-400", name: "Pekerjaan Arsitektur", plannedStart: formatDate(addDays(startDate, 130)), plannedEnd: formatDate(addDays(startDate, 190)), plannedDays: 60, budget: baseBudget * 0.30, weight: 30 },
    phase5_MEP: { code: "WBS-500", name: "Pekerjaan MEP", plannedStart: formatDate(addDays(startDate, 150)), plannedEnd: formatDate(addDays(startDate, 200)), plannedDays: 50, budget: baseBudget * 0.15, weight: 15 },
    phase6_Finishing: { code: "WBS-600", name: "Pekerjaan Finishing", plannedStart: formatDate(addDays(startDate, 190)), plannedEnd: formatDate(addDays(startDate, 240)), plannedDays: 50, budget: baseBudget * 0.05, weight: 5 },
  };
}

// Generate milestones
function generateMilestones(startDate: Date, totalDays: number): any[] {
  return [
    { id: "M1", name: "Ground Breaking", date: formatDate(startDate), plannedPercent: 0, actualPercent: 0, status: "COMPLETED" },
    { id: "M2", name: "Pondasi Selesai", date: formatDate(addDays(startDate, 45)), plannedPercent: 15, actualPercent: 15, status: "COMPLETED" },
    { id: "M3", name: "Struktur 50%", date: formatDate(addDays(startDate, 90)), plannedPercent: 35, actualPercent: 35, status: "COMPLETED" },
    { id: "M4", name: "Struktur Selesai", date: formatDate(addDays(startDate, 140)), plannedPercent: 55, actualPercent: 55, status: "COMPLETED" },
    { id: "M5", name: "Finishing 75%", date: formatDate(addDays(startDate, 190)), plannedPercent: 75, actualPercent: 75, status: "IN_PROGRESS" },
    { id: "M6", name: "Serah Terima", date: formatDate(addDays(startDate, totalDays)), plannedPercent: 100, actualPercent: -1, status: "PENDING" },
  ];
}
function getWeekTargetDescription(week: number, totalWeeks: number): string {
  const progress = week / totalWeeks;
  if (progress < 0.1) return "Pekerjaan persiapan dan mobilisasi";
  if (progress < 0.25) return "Pekerjaan pondasi dan struktur bawah";
  if (progress < 0.45) return "Pekerjaan struktur atas dan kolom";
  if (progress < 0.60) return "Pekerjaan struktur dan arsitektur";
  if (progress < 0.80) return "Pekerjaan arsitektur dan MEP";
  if (progress < 0.95) return "Pekerjaan finishing dan cleaning";
  return "Serah terima dan defect list";
}

function getProgressNote(description: string, percent: number, step: number): string {
  const notes = [
    "Opname awal - " + description.substring(0, 30),
    "Progress check - " + percent + "% complete",
    percent === 100 ? "PEKERJAAN SELESAI" : "Progress update - " + percent + "%",
  ];
  return notes[step] || "Progress update " + percent + "%";
}

// Seed holidays for a project
async function seedHolidays(rabId: string, scheduleStart: Date | null, totalDays: number = 365): Promise<number> {
  let createdCount = 0;
  for (const holiday of INDONESIAN_HOLIDAYS_2026) {
    const holidayDate = new Date(holiday.date);
    if (scheduleStart) {
      const projectEnd = addDays(scheduleStart, totalDays);
      if (holidayDate >= scheduleStart && holidayDate <= projectEnd) {
        await prisma.rabHoliday.upsert({
          where: { rabId_date: { rabId, date: holidayDate } },
          update: { name: holiday.name },
          create: { rabId, date: holidayDate, name: holiday.name },
        });
        createdCount++;
      }
    }
  }
  return createdCount;
}
// Create baseline for a RAB
async function createBaselineForRAB(
  rab: any,
  baselineName: string,
  baselineVersion: string,
  scenario: Scenario,
  revisionReason?: string,
  additionalDays: number = 0
): Promise<any> {
  const scheduleStart = rab.scheduleStart ? new Date(rab.scheduleStart) : new Date();
  const baseDuration = 240;
  const totalDays = baseDuration + additionalDays;
  const scheduleEnd = addDays(scheduleStart, totalDays);
  
  const sCurvePoints = generateSCurvePoints(totalDays, scheduleStart, 7, scenario);
  const wbs = generateWBS(rab.total, scheduleStart);
  const milestones = generateMilestones(scheduleStart, totalDays);

  const baselineSnapshot: any = {
    version: baselineVersion,
    type: scenario === "normal" ? "original_baseline" : "revised_baseline",
    revisionReason: revisionReason || null,
    plannedDuration: totalDays,
    plannedStart: formatDate(scheduleStart),
    plannedEnd: formatDate(scheduleEnd),
    plannedWorkDays: totalDays - Math.floor(totalDays / 7),
    sCurveData: sCurvePoints,
    milestones,
    workBreakdown: wbs,
    summary: {
      totalBudget: Number(rab.total),
      totalWeight: 100,
      currency: "IDR",
      taxPercent: Number(rab.taxPct),
      subtotal: Number(rab.subtotal),
    },
    weeklyTargets: sCurvePoints.map((point: any, idx: number) => ({
      week: idx + 1,
      date: point.date,
      plannedPercent: point.planned,
      targetDescription: getWeekTargetDescription(idx, totalDays / 7),
    })),
  };

  const baselineId = rab.id + "-" + baselineName.toLowerCase().replace(/\s+/g, "-");

  const baseline = await prisma.rabScheduleBaseline.upsert({
    where: { id: baselineId },
    update: { name: baselineName, capturedAt: new Date(), snapshot: baselineSnapshot },
    create: { id: baselineId, rabId: rab.id, name: baselineName, capturedAt: new Date(), snapshot: baselineSnapshot },
  });

  return baseline;
}
// Create progress records
async function createProgressRecords(rab: any, scenario: Scenario): Promise<number> {
  const items = await prisma.rabItem.findMany({
    where: { section: { rabId: rab.id } },
    orderBy: { order: "asc" },
    take: 15,
  });

  if (items.length === 0) return 0;

  let progressCount = 0;
  const baseDate = rab.scheduleStart ? new Date(rab.scheduleStart) : new Date();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemStartOffset = Number(item.startOffsetDays) || (i * 14);
    const itemDuration = Number(item.durationDays) || 21;
    
    let progressDates: Date[] = [];
    let progressPercents: number[] = [];
    let progressStatuses: ProgressStatus[] = [];

    if (scenario === "delayed") {
      progressDates = [
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.3)),
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.6)),
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.9)),
        addDays(baseDate, itemStartOffset + itemDuration + 7),
      ];
      progressPercents = [25, 50, 75, 100];
      progressStatuses = ["APPROVED", "APPROVED", "APPROVED", "APPROVED"];
    } else if (scenario === "accelerated") {
      progressDates = [
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.3)),
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.6)),
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.9)),
      ];
      progressPercents = [35, 70, 100];
      progressStatuses = ["APPROVED", "APPROVED", "APPROVED"];
    } else {
      progressDates = [
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.3)),
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.6)),
        addDays(baseDate, itemStartOffset + Math.floor(itemDuration * 0.85)),
      ];
      if (i < 5) {
        progressPercents = [30, 65, 100];
        progressStatuses = ["APPROVED", "APPROVED", "APPROVED"];
      } else if (i < 8) {
        progressPercents = [35, 70, 85];
        progressStatuses = ["APPROVED", "APPROVED", "PENDING"];
      } else {
        progressPercents = [25, 50, 60];
        progressStatuses = ["APPROVED", "APPROVED", "PENDING"];
      }
    }

    for (let p = 0; p < progressDates.length; p++) {
      const existing = await prisma.rabProgress.findFirst({
        where: { itemId: item.id, date: progressDates[p] },
      });

      if (!existing) {
        await prisma.rabProgress.create({
          data: {
            itemId: item.id,
            date: progressDates[p],
            percent: progressPercents[p],
            note: getProgressNote(item.description, progressPercents[p], p),
            status: progressStatuses[p],
            approvedById: progressStatuses[p] === "APPROVED" ? undefined : null,
            approvedAt: progressStatuses[p] === "APPROVED" ? progressDates[p] : null,
          },
        });
        progressCount++;
      }
    }
  }

  return progressCount;
}
async function main() {
  console.log("======================================================================");
  console.log("S-CURVE & SCHEDULE BASELINE SEEDING");
  console.log("Comprehensive schedule data for all RAB projects");
  console.log("======================================================================");
  console.log("");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!admin) {
    console.error("ERROR: No admin user found. Run main seed first.");
    process.exit(1);
  }

  const rabs = await prisma.rab.findMany({
    include: { sections: { include: { items: { orderBy: { order: "asc" } } } } },
    orderBy: { number: "asc" },
  });

  console.log("Found " + rabs.length + " RAB projects");

  const stats = { holidays: 0, baselines: 0, progress: 0 };

  for (const rab of rabs) {
    console.log("-".repeat(70));
    console.log("Processing: " + rab.number + " - " + rab.title);
    console.log("  Status: " + rab.status + " | Total: Rp " + Number(rab.total).toLocaleString("id-ID"));
    console.log("  Schedule Start: " + (rab.scheduleStart ? formatDate(rab.scheduleStart) : "Not set"));

    // 1. Create Holidays
    const existingHolidayCount = await prisma.rabHoliday.count({ where: { rabId: rab.id } });
    if (existingHolidayCount === 0) {
      const holidayCount = await seedHolidays(rab.id, rab.scheduleStart);
      stats.holidays += holidayCount;
      console.log("  [OK] Created " + holidayCount + " holidays");
    } else {
      console.log("  [SKIP] Holidays already exist (" + existingHolidayCount + ")");
    }

    // 2. Create Schedule Baselines
    const existingBaselineCount = await prisma.rabScheduleBaseline.count({ where: { rabId: rab.id } });

    let scenario: Scenario = "normal";
    if (rab.number === "RAB-2026-001") scenario = "normal";
    else if (rab.number === "RAB-2026-002") scenario = "accelerated";
    else if (rab.number === "RAB-2026-006" || rab.number === "RAB-2026-007") scenario = "delayed";

    if (existingBaselineCount === 0) {
      // Baseline 1
      const baseline1 = await createBaselineForRAB(rab, "Baseline Original", "1.0", scenario);
      stats.baselines++;
      console.log("  [OK] Baseline 1: " + baseline1.name);
      console.log("       S-Curve points: " + baseline1.snapshot.sCurveData.length);

      // Baseline 2 (for complex projects)
      if (rab.number === "RAB-2026-001" || rab.number === "RAB-2026-007") {
        await new Promise(resolve => setTimeout(resolve, 50));
        const revScenario = scenario === "delayed" ? "accelerated" : "delayed";
        const baseline2 = await createBaselineForRAB(rab, "Baseline Revisi 1", "1.1", revScenario, "Revisi jadwal akibat perubahan desain dan cuaca", 14);
        stats.baselines++;
        console.log("  [OK] Baseline 2: " + baseline2.name);
      }

      // Baseline 3 (for very complex projects)
      if (rab.number === "RAB-2026-001") {
        await new Promise(resolve => setTimeout(resolve, 50));
        const baseline3 = await createBaselineForRAB(rab, "Baseline Revisi 2", "1.2", "accelerated", "Perpanjangan waktu + akselerasi finish", 21);
        stats.baselines++;
        console.log("  [OK] Baseline 3: " + baseline3.name);
      }
    } else {
      console.log("  [SKIP] Baselines already exist (" + existingBaselineCount + ")");
    }

    // 3. Create Progress Records
    if (rab.status === "APPROVED" || rab.status === "ARCHIVED") {
      const existingProgressCount = await prisma.rabProgress.count({
        where: { item: { section: { rabId: rab.id } } },
      });
      if (existingProgressCount === 0) {
        const progressCount = await createProgressRecords(rab, scenario);
        stats.progress += progressCount;
        console.log("  [OK] Progress: " + progressCount + " records created");
      } else {
        console.log("  [SKIP] Progress already exist (" + existingProgressCount + ")");
      }
    }
    console.log("");
  }
  // Summary
  console.log("=".repeat(70));
  console.log("SEEDING SUMMARY");
  console.log("=".repeat(70));
  console.log("  Holidays Created:   " + stats.holidays);
  console.log("  Baselines Created:  " + stats.baselines);
  console.log("  Progress Records:  " + stats.progress);
  console.log("");
  console.log("RAB Projects with Baselines:");
  
  for (const rab of rabs) {
    const baselineCount = await prisma.rabScheduleBaseline.count({ where: { rabId: rab.id } });
    const holidayCount = await prisma.rabHoliday.count({ where: { rabId: rab.id } });
    const progressCount = await prisma.rabProgress.count({ where: { item: { section: { rabId: rab.id } } } });
    console.log("  " + rab.number + ": " + baselineCount + " baselines, " + holidayCount + " holidays, " + progressCount + " progress");
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("[SUCCESS] S-CURVE & BASELINE SEEDING COMPLETE!");
  console.log("=".repeat(70));
}

main()
  .then(() => {
    console.log("");
    console.log("Seed completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("Seed failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
