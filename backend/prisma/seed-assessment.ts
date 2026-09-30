/**
 * Assessment Seed Data
 * Seeds comprehensive worker skill assessments for Sanata Construction
 * 51 workers × 1-3 assessments each = ~100 assessment records
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
 * Assessment Types:
 * - Initial (onboarding assessment)
 * - Periodic (6-month evaluation)
 * - Probation (3-month evaluation)
 * - Certification (skill certification)
 * - Promotion (before promotion)
 *
 * Score Ranges:
 * - Technical: 60-98
 * - Interview: 65-95
 * - Teamwork: 70-100
 * - Safety: 75-100
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Worker codes by role (matching seed-kpi.ts)
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

// Assessment types and their configurations
const assessmentTypes = [
  {
    type: "INITIAL",
    dateOffset: -365, // 1 year ago
    interviewers: ["Budi Santoso (HRD Manager)", "Ahmad Wijaya (Site Manager)", "Dedi Kurniawan (Project Manager)"],
  },
  {
    type: "PERIODIC",
    dateOffset: -180, // 6 months ago
    interviewers: ["Budi Santoso (HRD Manager)", "Eko Prasetyo (Safety Officer)", "Ahmad Wijaya (Site Manager)"],
  },
  {
    type: "CERTIFICATION",
    dateOffset: -90, // 3 months ago
    interviewers: ["Hendra Wijaya (Technical Trainer)", "Budi Santoso (HRD Manager)", "Joko Susilo (Quality Control)"],
  },
];

// Indonesian names for interviewers
const interviewerNames = [
  "Budi Santoso",
  "Ahmad Wijaya",
  "Dedi Kurniawan",
  "Eko Prasetyo",
  "Hendra Wijaya",
  "Joko Susilo",
  "Rudi Hermawan",
  "Siti Nurhaliza",
  "Muhamad Fadli",
  "Rina Marlina",
];

// Recommendations based on overall score
function getRecommendation(overallScore: number): string {
  if (overallScore >= 90) {
    return "Sangat direkomendasikan untuk promosi ke posisi lebih tinggi. Kandidat memiliki kompetensi teknis dan soft skills yang sangat baik.";
  } else if (overallScore >= 80) {
    return "Direkomendasikan untuk terus dikembangkan. Memiliki dasar yang kuat untuk promosi bertahap.";
  } else if (overallScore >= 70) {
    return "Memiliki potensi yang baik. Perlu mentoring tambahan dan latihan lebih lanjut untuk meningkatkan kompetensi.";
  } else if (overallScore >= 60) {
    return "Masih dalam tahap pembelajaran. Perlu bimbingan intensif dan evaluasi berkala.";
  } else {
    return "Membutuhkan pelatihan ulang dan supervisi ketat. Tidak direkomendasikan untuk pekerjaan mandiri.";
  }
}

// Grade based on overall score
function getGrade(overallScore: number): "A" | "B" | "C" | "D" {
  if (overallScore >= 85) return "A";
  if (overallScore >= 70) return "B";
  if (overallScore >= 55) return "C";
  return "D";
}

// Generate realistic scores based on role and worker number
function generateScores(workerCode: string, assessmentType: string, attemptNumber: number): {
  technicalScore: number;
  interviewScore: number;
  teamworkScore: number;
  safetyScore: number;
  overallScore: number;
} {
  // Extract role prefix and number
  const prefix = workerCode.split("-")[0];
  const num = parseInt(workerCode.split("-")[1]);

  // Base scores vary by role type (seniority)
  let baseTechnical = 70;
  let baseInterview = 72;
  let baseTeamwork = 75;
  let baseSafety = 80;

  // Role-based adjustments
  if (prefix === "M" || prefix === "KT") {
    // Mandors and Kepala Tukang should have higher scores
    baseTechnical = 82;
    baseInterview = 85;
    baseTeamwork = 88;
    baseSafety = 85;
  } else if (prefix === "T" || prefix === "K" || prefix === "B") {
    // Tradesmen (tukang) have good technical skills
    baseTechnical = 78;
    baseInterview = 74;
    baseTeamwork = 76;
    baseSafety = 80;
  } else if (prefix === "O") {
    // Operators need specific technical skills
    baseTechnical = 80;
    baseInterview = 72;
    baseTeamwork = 74;
    baseSafety = 82;
  } else if (prefix === "P") {
    // Pekeras (helpers) are learning
    baseTechnical = 65;
    baseInterview = 68;
    baseTeamwork = 72;
    baseSafety = 75;
  }

  // Individual variation based on worker number (some workers are better)
  const variation = (num % 5) * 3;

  // Progressive improvement on subsequent assessments
  const improvement = (attemptNumber - 1) * 5;

  // Random variation
  const randomVariation = Math.floor(Math.random() * 10) - 5;

  // Calculate final scores
  const technicalScore = Math.min(98, Math.max(50, baseTechnical + variation + improvement + randomVariation));
  const interviewScore = Math.min(95, Math.max(55, baseInterview + variation + improvement + Math.floor(randomVariation / 2)));
  const teamworkScore = Math.min(100, Math.max(60, baseTeamwork + variation + improvement + randomVariation));
  const safetyScore = Math.min(100, Math.max(65, baseSafety + variation + improvement + Math.floor(randomVariation / 3)));

  // Overall weighted score: Technical (30%), Interview (20%), Teamwork (25%), Safety (25%)
  const overallScore = Math.round(
    technicalScore * 0.30 +
    interviewScore * 0.20 +
    teamworkScore * 0.25 +
    safetyScore * 0.25
  );

  return {
    technicalScore: Math.round(technicalScore),
    interviewScore: Math.round(interviewScore),
    teamworkScore: Math.round(teamworkScore),
    safetyScore: Math.round(safetyScore),
    overallScore,
  };
}

// Generate assessment notes
function generateNotes(workerCode: string, assessmentType: string, scores: ReturnType<typeof generateScores>): string {
  const prefix = workerCode.split("-")[0];
  const notes: string[] = [];

  // Role-specific observations
  if (prefix === "M" || prefix === "KT") {
    notes.push("Memiliki pengalaman bertahun-tahun di lapangan.");
    if (scores.technicalScore >= 85) {
      notes.push("Kemampuan teknis sangat baik, bisa menjadi mentor untuk pekerja lain.");
    }
    if (scores.teamworkScore >= 85) {
      notes.push("Mampu memimpin tim dengan efektif dan komunikasi yang baik.");
    }
  } else if (prefix === "T") {
    notes.push("Spesialisasi dalam pekerjaan pasangan dan finishing.");
    if (scores.technicalScore >= 80) {
      notes.push("Ketelitian tinggi dalam pengukuran dan pemasangan.");
    }
  } else if (prefix === "K") {
    notes.push("Spesialisasi dalam pekerjaan kayu dan bekisting.");
    if (scores.technicalScore >= 80) {
      notes.push("Menguasai teknik pembesian dan pencetakan yang presisi.");
    }
  } else if (prefix === "B") {
    notes.push("Spesialisasi dalam pekerjaan pembesian dan struktur.");
    if (scores.technicalScore >= 80) {
      notes.push("Kemampuan read steel reinforcement yang akurat.");
    }
  } else if (prefix === "O") {
    notes.push("Mengoperasikan alat berat dan mesin konstruksi.");
    if (scores.safetyScore >= 85) {
      notes.push("Selalu mematuhi prosedur keselamatan kerja.");
    }
  } else if (prefix === "P") {
    notes.push("Sebagai pekerja baru, masih dalam tahap pembelajaran.");
    if (scores.teamworkScore >= 75) {
      notes.push("Koordinasi dengan tim baik.");
    }
  }

  // Safety-related notes
  if (scores.safetyScore >= 90) {
    notes.push("Selalu menggunakan APD dengan benar dan mengingatkan rekan kerja.");
  } else if (scores.safetyScore < 75) {
    notes.push("Perlu reinforcement tentang prosedur keselamatan kerja.");
  }

  return notes.join(" ");
}

// Export for use in main seed.ts
export async function seedAssessments(prisma: PrismaClient) {
  console.log("======================================================================");
  console.log("WORKER ASSESSMENT SEED DATA");
  console.log("======================================================================");
  console.log("");

  // Ensure ASS counter exists
  await prisma.santraCounter.upsert({
    where: { prefix: "ASS" },
    update: {},
    create: { prefix: "ASS", lastSeq: 0 },
  });
  console.log("✅ Ensured ASS counter exists");
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
    console.log("⚠️ No workers found. Please run workforce seeder first.");
    return;
  }

  // Create worker lookup map
  const workerMap = new Map(workers.map(w => [w.workerCode, w]));

  // Track created assessments
  let createdCount = 0;
  let skippedCount = 0;

  // Assessment dates (relative to current date 2026-09-15)
  const assessmentDates = [
    new Date("2025-09-15"), // Initial assessment (1 year ago)
    new Date("2026-03-15"), // Periodic assessment (6 months ago)
    new Date("2026-06-15"), // Certification (3 months ago)
  ];

  // Create assessments for each worker
  console.log("STEP 1: Creating assessments...");
  console.log("");

  for (const workerCode of allWorkerCodes) {
    const worker = workerMap.get(workerCode);
    if (!worker) {
      console.log(`  ⚠️ Worker ${workerCode} not found, skipping`);
      continue;
    }

    // Determine how many assessments this worker should have
    // Senior workers (mandors, kepala tukang) have more assessments
    let numAssessments = 1; // All workers have at least initial assessment

    if (workerCode.startsWith("M-") || workerCode.startsWith("KT-")) {
      numAssessments = 3; // Senior workers have all 3
    } else if (workerCode.startsWith("T-") || workerCode.startsWith("K-") || workerCode.startsWith("B-")) {
      numAssessments = 2; // Tradesmen have initial + periodic
    } else if (workerCode.startsWith("P-")) {
      // Pekeras vary based on worker number (newer workers have fewer assessments)
      const num = parseInt(workerCode.split("-")[1]);
      numAssessments = num <= 6 ? 3 : num <= 12 ? 2 : 1;
    }

    for (let i = 0; i < numAssessments; i++) {
      const assessmentDate = assessmentDates[i];

      // Get next sequence from counter (atomic increment)
      const counter = await prisma.santraCounter.upsert({
        where: { prefix: "ASS" },
        create: { prefix: "ASS", lastSeq: 0 },
        update: { lastSeq: { increment: 1 } },
        select: { lastSeq: true },
      });

      // Generate unique code
      const assessmentCode = `ASS-${assessmentDate.getFullYear()}-${String(counter.lastSeq).padStart(4, "0")}`;

      // Check if already exists (double-check for safety)
      const existing = await prisma.workerAssessment.findUnique({
        where: { assessmentCode },
      });

      if (existing) {
        console.log(`  ⏭️  Skipping ${assessmentCode} - already exists`);
        skippedCount++;
        continue;
      }

      // Generate scores
      const scores = generateScores(workerCode, assessmentTypes[i].type, i + 1);
      const interviewer = assessmentTypes[i].interviewers[i % assessmentTypes[i].interviewers.length];
      const grade = getGrade(scores.overallScore);
      const recommendation = getRecommendation(scores.overallScore);
      const notes = generateNotes(workerCode, assessmentTypes[i].type, scores);

      // Create assessment record
      await prisma.workerAssessment.create({
        data: {
          assessmentCode,
          workerId: worker.id,
          assessmentDate,
          interviewer,
          technicalScore: scores.technicalScore,
          interviewScore: scores.interviewScore,
          teamworkScore: scores.teamworkScore,
          safetyScore: scores.safetyScore,
          overallScore: scores.overallScore,
          grade,
          recommendation,
          notes,
          evidenceUrl: null,
        },
      });

      createdCount++;
      console.log(`  ✅ Created ${assessmentCode} for ${worker.name} (${workerCode})`);
      console.log(`     Type: ${assessmentTypes[i].type} | Date: ${assessmentDate.toISOString().split('T')[0]}`);
      console.log(`     Technical: ${scores.technicalScore} | Interview: ${scores.interviewScore} | Teamwork: ${scores.teamworkScore} | Safety: ${scores.safetyScore}`);
      console.log(`     Overall: ${scores.overallScore} | Grade: ${grade}`);
    }
    console.log("");
  }

  // Summary
  const totalAssessments = await prisma.workerAssessment.count();

  console.log("======================================================================");
  console.log("WORKER ASSESSMENT SEEDING COMPLETE");
  console.log("======================================================================");
  console.log("");
  console.log("📊 Summary:");
  console.log(`   - Total Assessments Created: ${createdCount}`);
  console.log(`   - Total Assessments Skipped: ${skippedCount}`);
  console.log(`   - Total Assessments in DB: ${totalAssessments}`);
  console.log(`   - Workers Covered: ${workers.length}`);
  console.log("");
  console.log("📈 Grade Distribution:");

  const gradeA = await prisma.workerAssessment.count({ where: { grade: "A" } });
  const gradeB = await prisma.workerAssessment.count({ where: { grade: "B" } });
  const gradeC = await prisma.workerAssessment.count({ where: { grade: "C" } });
  const gradeD = await prisma.workerAssessment.count({ where: { grade: "D" } });

  console.log(`   - Grade A (≥85): ${gradeA} assessments`);
  console.log(`   - Grade B (70-84): ${gradeB} assessments`);
  console.log(`   - Grade C (55-69): ${gradeC} assessments`);
  console.log(`   - Grade D (<55): ${gradeD} assessments`);

  console.log("");
  console.log("======================================================================");
}

seedAssessments(prisma)
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
