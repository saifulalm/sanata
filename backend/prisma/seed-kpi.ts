/**
 * KPI Performance Seed Data
 * Seeds demo data for KPI records across 2 periods (2026-07, 2026-08)
 * 51 workers × 2 periods = 102 KPI records
 *
 * Worker Distribution:
 * - 4 Mandors (M-0001 to M-0004)
 * - 4 Kepala Tukangs (KT-0001 to KT-0004)
 * - 10 Tukang Batu (T-0001 to T-0010)
 * - 6 Tukang Kayu (K-0001 to K-0006)
 * - 5 Tukang Besi (B-0001 to B-0005)
 * - 4 Operators (O-0001 to O-0004)
 * - 18 Pekeras (P-0001 to P-0018)
 *
 * Score Ranges:
 * - Quality: 75-95
 * - Productivity: 70-95
 * - Attendance: 80-98
 * - Safety: 82-97
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: generate random KPI scores
function generateKpiScores(): {
  qualityScore: number;
  productivityScore: number;
  attendanceScore: number;
  safetyScore: number;
  reworkCount: number;
  defectCount: number;
  completedTasks: number;
  lateDays: number;
} {
  const qualityScore = randomInt(75, 95);
  const productivityScore = randomInt(70, 95);
  const attendanceScore = randomInt(80, 98);
  const safetyScore = randomInt(82, 97);

  // Metrics based on scores
  const reworkCount = qualityScore < 85 ? randomInt(1, 3) : 0;
  const defectCount = qualityScore < 80 ? randomInt(1, 2) : 0;
  const completedTasks = randomInt(12, 22);
  const lateDays = attendanceScore < 90 ? randomInt(0, 3) : 0;

  return {
    qualityScore,
    productivityScore,
    attendanceScore,
    safetyScore,
    reworkCount,
    defectCount,
    completedTasks,
    lateDays,
  };
}

// Helper: calculate overall score
function calculateOverallScore(scores: ReturnType<typeof generateKpiScores>): number {
  // Weighted average: quality (25%), productivity (30%), attendance (25%), safety (20%)
  return Math.round(
    scores.qualityScore * 0.25 +
    scores.productivityScore * 0.30 +
    scores.attendanceScore * 0.25 +
    scores.safetyScore * 0.20
  );
}

// Period configuration
const periods = [
  {
    period: "2026-07",
    periodStart: new Date("2026-07-01"),
    periodEnd: new Date("2026-07-31")
  },
  {
    period: "2026-08",
    periodStart: new Date("2026-08-01"),
    periodEnd: new Date("2026-08-31")
  },
];

// Worker codes by role
const workerCodes = {
  MANDOR: ["M-0001", "M-0002", "M-0003", "M-0004"],
  KEPALA_TUKANG: ["KT-0001", "KT-0002", "KT-0003", "KT-0004"],
  TUKANG_BATU: ["T-0001", "T-0002", "T-0003", "T-0004", "T-0005", "T-0006", "T-0007", "T-0008", "T-0009", "T-0010"],
  TUKANG_KAYU: ["K-0001", "K-0002", "K-0003", "K-0004", "K-0005", "K-0006"],
  TUKANG_BESI: ["B-0001", "B-0002", "B-0003", "B-0004", "B-0005"],
  OPERATOR: ["O-0001", "O-0002", "O-0003", "O-0004"],
  PEKERJA: ["P-0001", "P-0002", "P-0003", "P-0004", "P-0005", "P-0006", "P-0007", "P-0008", "P-0009", "P-0010", "P-0011", "P-0012", "P-0013", "P-0014", "P-0015", "P-0016", "P-0017", "P-0018"],
};

// All worker codes in order
const allWorkerCodes = [
  ...workerCodes.MANDOR,
  ...workerCodes.KEPALA_TUKANG,
  ...workerCodes.TUKANG_BATU,
  ...workerCodes.TUKANG_KAYU,
  ...workerCodes.TUKANG_BESI,
  ...workerCodes.OPERATOR,
  ...workerCodes.PEKERJA,
];

// Export for use in main seed.ts
export async function seedKpiData(prisma: PrismaClient) {
  console.log("======================================================================");
  console.log("KPI PERFORMANCE SEED DATA");
  console.log("======================================================================");
  console.log("");

  // Ensure KPI counter exists
  const counterPrefixes = ["WORKER-M", "WORKER-T", "WORKER-K", "WORKER-B", "WORKER-O", "WORKER-P", "WORKER-KT", "ASS", "JOB", "LOG", "QC", "KPI", "TL", "LN"];
  for (const prefix of counterPrefixes) {
    await prisma.santraCounter.upsert({
      where: { prefix },
      update: {},
      create: { prefix, lastSeq: 0 },
    });
  }
  console.log("✅ Ensured KPI counter exists");
  console.log("");

  // Get all workers from database
  const workers = await prisma.worker.findMany({
    where: {
      workerCode: { in: allWorkerCodes },
    },
    orderBy: { workerCode: "asc" },
  });

  console.log(`📋 Found ${workers.length} workers in database`);
  console.log("");

  if (workers.length === 0) {
    console.log("⚠️ No workers found. Please run seedWorkforce first.");
    return;
  }

  // Create worker lookup map
  const workerMap = new Map(workers.map(w => [w.workerCode, w]));

  // Track KPI codes to calculate ranks later
  const kpiRecords: Array<{
    workerId: string;
    period: string;
    kpiCode: string;
    scores: ReturnType<typeof generateKpiScores>;
    overallScore: number;
  }> = [];

  // Create KPI records for each worker and period
  console.log("STEP 1: Creating KPI records...");
  console.log("");

  let kpiSeq = 1; // Start from 1
  for (const period of periods) {
    console.log(`📅 Period: ${period.period}`);

    for (const workerCode of allWorkerCodes) {
      const worker = workerMap.get(workerCode);
      if (!worker) {
        console.log(`  ⚠️ Worker ${workerCode} not found, skipping`);
        continue;
      }

      // Generate KPI code
      const kpiCode = `KPI-${period.period}-${String(kpiSeq).padStart(3, "0")}`;
      kpiSeq++;

      // Generate scores
      const scores = generateKpiScores();
      const overallScore = calculateOverallScore(scores);

      // Check if record already exists by workerId+period (unique constraint)
      const existing = await prisma.kpiRecord.findFirst({
        where: {
          workerId: worker.id,
          period: period.period,
        },
      });

      if (existing) {
        console.log(`  ⏭️  Skipping ${worker.workerCode} ${period.period} - already exists`);
        continue;
      }

      // Create KPI record
      await prisma.kpiRecord.create({
        data: {
          kpiCode,
          workerId: worker.id,
          period: period.period,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          qualityScore: scores.qualityScore,
          productivityScore: scores.productivityScore,
          attendanceScore: scores.attendanceScore,
          safetyScore: scores.safetyScore,
          reworkCount: scores.reworkCount,
          defectCount: scores.defectCount,
          completedTasks: scores.completedTasks,
          lateDays: scores.lateDays,
          overallScore,
          approvedById: null,
          approvedAt: null,
          notes: null,
        },
      });

      kpiRecords.push({
        workerId: worker.id,
        period: period.period,
        kpiCode,
        scores,
        overallScore,
      });

      console.log(`  ✅ Created ${kpiCode} for ${worker.name} (${worker.workerCode})`);
      console.log(`     Quality: ${scores.qualityScore} | Productivity: ${scores.productivityScore} | Attendance: ${scores.attendanceScore} | Safety: ${scores.safetyScore}`);
      console.log(`     Overall: ${overallScore} | Tasks: ${scores.completedTasks} | Rework: ${scores.reworkCount} | Late: ${scores.lateDays}`);
    }
    console.log("");
  }

  // Calculate and update ranks for each period
  console.log("STEP 2: Calculating rankings...");
  console.log("");

  for (const period of periods) {
    const periodRecords = kpiRecords
      .filter(r => r.period === period.period)
      .sort((a, b) => b.overallScore - a.overallScore);

    console.log(`📅 Period: ${period.period}`);

    for (let rank = 1; rank <= periodRecords.length; rank++) {
      const record = periodRecords[rank - 1];
      await prisma.kpiRecord.update({
        where: { kpiCode: record.kpiCode },
        data: { rank },
      });
      console.log(`  ${rank}. ${record.kpiCode} - Score: ${record.overallScore}`);
    }
    console.log("");
  }

  // Summary
  const totalKpi = await prisma.kpiRecord.count();
  const avgQuality = await prisma.kpiRecord.aggregate({ _avg: { qualityScore: true } });
  const avgProductivity = await prisma.kpiRecord.aggregate({ _avg: { productivityScore: true } });
  const avgAttendance = await prisma.kpiRecord.aggregate({ _avg: { attendanceScore: true } });
  const avgSafety = await prisma.kpiRecord.aggregate({ _avg: { safetyScore: true } });
  const avgOverall = await prisma.kpiRecord.aggregate({ _avg: { overallScore: true } });

  console.log("======================================================================");
  console.log("KPI PERFORMANCE SEEDING COMPLETE");
  console.log("======================================================================");
  console.log("");
  console.log("📊 Summary:");
  console.log(`   - Total KPI Records: ${totalKpi}`);
  console.log(`   - Workers Covered: ${workers.length}`);
  console.log(`   - Periods: ${periods.map(p => p.period).join(", ")}`);
  console.log("");
  console.log("📈 Average Scores:");
  console.log(`   - Quality: ${avgQuality._avg.qualityScore?.toFixed(1) || "N/A"}`);
  console.log(`   - Productivity: ${avgProductivity._avg.productivityScore?.toFixed(1) || "N/A"}`);
  console.log(`   - Attendance: ${avgAttendance._avg.attendanceScore?.toFixed(1) || "N/A"}`);
  console.log(`   - Safety: ${avgSafety._avg.safetyScore?.toFixed(1) || "N/A"}`);
  console.log(`   - Overall: ${avgOverall._avg.overallScore?.toFixed(1) || "N/A"}`);
  console.log("");
  console.log("======================================================================");
}

seedKpiData(prisma)
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
