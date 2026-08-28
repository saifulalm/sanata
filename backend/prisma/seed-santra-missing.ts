/**
 * SANTRA Additional Seeder
 * Seeds missing data: Assessments, KPI, Assignments, QC, Execution Logs
 * Run: npx tsx prisma/seed-santra-missing.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SANTRA missing data...\n");

  // ============================================
  // 1. SEED ASSESSMENTS FOR ALL WORKERS
  // ============================================
  const workers = await prisma.worker.findMany({ orderBy: { workerCode: "asc" } });
  console.log(`👷 Workers found: ${workers.length}`);

  // Index workers by role
  const mandors = workers.filter(w => w.role === "MANDOR");
  const kepalaTukangs = workers.filter(w => w.role === "KEPALA_TUKANG");
  const tukangBatues = workers.filter(w => w.role === "TUKANG_BATU");
  const tukangKayus = workers.filter(w => w.role === "TUKANG_KAYU");
  const tukangBesis = workers.filter(w => w.role === "TUKANG_BESI");
  const operators = workers.filter(w => w.role === "OPERATOR");
  const pekerjas = workers.filter(w => w.role === "PEKERJA");

  // Generate assessments for all workers
  const assessmentTemplates = [
    // Mandors - higher scores
    { baseScore: 82, variance: 10, interviewer: "Dr. Rina Hartati", recommendation: "Sangat direkomendasikan untuk supervisor" },
    // Kepala Tukangs
    { baseScore: 80, variance: 12, interviewer: "Agus Prasetyo", recommendation: "Baik untuk lead craftsmen" },
    // Tukang Batu
    { baseScore: 75, variance: 15, interviewer: "Pak Harsono", recommendation: "Baik untuk masonry" },
    // Tukang Kayu
    { baseScore: 76, variance: 14, interviewer: "Pak Harsono", recommendation: "Baik untuk carpentry" },
    // Tukang Besi
    { baseScore: 77, variance: 13, interviewer: "Pak Harsono", recommendation: "Baik untuk steel work" },
    // Operators
    { baseScore: 74, variance: 16, interviewer: "Pak Harsono", recommendation: "Baik untuk operasi alat berat" },
    // Pekeras
    { baseScore: 70, variance: 18, interviewer: "Pak Harsono", recommendation: "Perlu bimbingan lanjutan" },
  ];

  const getRoleTemplate = (role: string) => {
    if (role === "MANDOR") return assessmentTemplates[0];
    if (role === "KEPALA_TUKANG") return assessmentTemplates[1];
    if (role === "TUKANG_BATU") return assessmentTemplates[2];
    if (role === "TUKANG_KAYU") return assessmentTemplates[3];
    if (role === "TUKANG_BESI") return assessmentTemplates[4];
    if (role === "OPERATOR") return assessmentTemplates[5];
    return assessmentTemplates[6];
  };

  let assessmentCount = 0;
  for (const worker of workers) {
    // Check if worker already has assessment
    const existingAssessment = await prisma.workerAssessment.findFirst({
      where: { workerId: worker.id }
    });
    if (existingAssessment) continue;

    const template = getRoleTemplate(worker.role);
    const technicalScore = Math.min(100, template.baseScore + Math.floor(Math.random() * template.variance) - 5);
    const interviewScore = Math.min(100, template.baseScore + Math.floor(Math.random() * template.variance) - 8);
    const teamworkScore = Math.min(100, template.baseScore + Math.floor(Math.random() * template.variance) + 2);
    const safetyScore = Math.min(100, template.baseScore + Math.floor(Math.random() * template.variance) + 5);
    const overallScore = Math.round((technicalScore + interviewScore + teamworkScore + safetyScore) / 4);

    const grade = overallScore >= 85 ? "A" : overallScore >= 70 ? "B" : overallScore >= 55 ? "C" : "D";

    // Generate assessment code
    const prefix = "ASS";
    const counter = await prisma.santraCounter.upsert({
      where: { prefix },
      create: { prefix, lastSeq: 0 },
      update: { lastSeq: { increment: 1 } },
    });
    const year = 2026;
    const code = `${prefix}-${worker.workerCode}-${year}-${String(counter.lastSeq).padStart(4, "0")}`;

    await prisma.workerAssessment.create({
      data: {
        assessmentCode: code,
        workerId: worker.id,
        assessmentDate: new Date(2026, 0, 15 + (assessmentCount % 15)),
        interviewer: template.interviewer,
        technicalScore,
        interviewScore,
        teamworkScore,
        safetyScore,
        overallScore,
        grade: grade as "A" | "B" | "C" | "D",
        recommendation: template.recommendation,
      },
    });
    assessmentCount++;
  }
  console.log(`✅ Assessments created: ${assessmentCount}`);

  // ============================================
  // 2. SEED KPI RECORDS
  // ============================================
  const periods = ["2026-07", "2026-08"]; // Last 2 months
  let kpiCount = 0;

  for (const worker of workers) {
    for (const period of periods) {
      // Check if KPI already exists
      const existingKpi = await prisma.kpiRecord.findUnique({
        where: { workerId_period: { workerId: worker.id, period } }
      });
      if (existingKpi) continue;

      const qualityScore = 70 + Math.floor(Math.random() * 25);
      const productivityScore = 65 + Math.floor(Math.random() * 30);
      const attendanceScore = 75 + Math.floor(Math.random() * 20);
      const safetyScore = 78 + Math.floor(Math.random() * 18);
      const overallScore = Math.round((qualityScore + productivityScore + attendanceScore + safetyScore) / 4);

      const counter = await prisma.santraCounter.upsert({
        where: { prefix: "KPI" },
        create: { prefix: "KPI", lastSeq: 0 },
        update: { lastSeq: { increment: 1 } },
      });

      const year = parseInt(period.split("-")[0]);
      const month = parseInt(period.split("-")[1]);
      const lastDay = new Date(year, month, 0).getDate();

      await prisma.kpiRecord.create({
        data: {
          kpiCode: `KPI-${worker.workerCode}-${period.replace("-", "")}`,
          workerId: worker.id,
          period,
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month - 1, lastDay),
          qualityScore,
          productivityScore,
          attendanceScore,
          safetyScore,
          reworkCount: Math.floor(Math.random() * 3),
          defectCount: Math.floor(Math.random() * 2),
          completedTasks: 5 + Math.floor(Math.random() * 10),
          lateDays: Math.floor(Math.random() * 3),
          overallScore,
        },
      });
      kpiCount++;
    }
  }
  console.log(`✅ KPI Records created: ${kpiCount}`);

  // ============================================
  // 3. SEED JOB ASSIGNMENTS
  // ============================================
  const rab1 = await prisma.rab.findFirst({ where: { number: "RAB-2026-001" } });
  const rab2 = await prisma.rab.findFirst({ where: { number: "RAB-2026-002" } });
  console.log(`📋 RAB 1: ${rab1?.id || "NOT FOUND"}`);
  console.log(`📋 RAB 2: ${rab2?.id || "NOT FOUND"}`);

  if (rab1) {
    const existingAssignments = await prisma.jobAssignment.count({ where: { rabId: rab1.id } });
    if (existingAssignments === 0) {
      const assignments1 = [
        { wbsCode: "WBS-01.01", workItem: "Pekerjaan pondasi Strauss pile D300", status: "COMPLETED" as const, personIdx: 0, mandorIdx: 0, plannedStart: "2026-02-01", plannedEnd: "2026-03-15", actualStart: "2026-02-01", actualEnd: "2026-03-10", pct: 100 },
        { wbsCode: "WBS-01.02", workItem: "Pekerjaan sloof 30x50 cm", status: "COMPLETED" as const, personIdx: 1, mandorIdx: 0, plannedStart: "2026-03-11", plannedEnd: "2026-04-01", actualStart: "2026-03-11", actualEnd: "2026-03-28", pct: 100 },
        { wbsCode: "WBS-01.03", workItem: "Pekerjaan kolom utama 40x40 cm", status: "COMPLETED" as const, personIdx: 2, mandorIdx: 0, plannedStart: "2026-04-01", plannedEnd: "2026-05-15", actualStart: "2026-04-01", actualEnd: "2026-05-10", pct: 100 },
        { wbsCode: "WBS-01.04", workItem: "Pekerjaan balok 30x50 cm", status: "COMPLETED" as const, personIdx: 3, mandorIdx: 0, plannedStart: "2026-05-11", plannedEnd: "2026-06-15", actualStart: "2026-05-11", actualEnd: "2026-06-12", pct: 100 },
        { wbsCode: "WBS-01.05", workItem: "Pekerjaan plat lantai tebal 12 cm", status: "IN_PROGRESS" as const, personIdx: 4, mandorIdx: 1, plannedStart: "2026-06-16", plannedEnd: "2026-08-15", actualStart: "2026-06-16", actualEnd: null, pct: 85 },
        { wbsCode: "WBS-02.01", workItem: "Pasangan dinding bata merah 1PC:5PP", status: "IN_PROGRESS" as const, personIdx: 5, mandorIdx: 1, plannedStart: "2026-07-01", plannedEnd: "2026-08-30", actualStart: "2026-07-01", actualEnd: null, pct: 60 },
        { wbsCode: "WBS-02.02", workItem: "Plesteran dinding dalam", status: "PENDING" as const, personIdx: 6, mandorIdx: 1, plannedStart: "2026-08-01", plannedEnd: "2026-09-15", actualStart: null, actualEnd: null, pct: 0 },
        { wbsCode: "WBS-02.03", workItem: "Pengecatan dinding dalam", status: "PENDING" as const, personIdx: 7, mandorIdx: 1, plannedStart: "2026-09-01", plannedEnd: "2026-10-15", actualStart: null, actualEnd: null, pct: 0 },
        { wbsCode: "WBS-02.04", workItem: "Pemasangan kusen aluminium", status: "PENDING" as const, personIdx: 8, mandorIdx: 1, plannedStart: "2026-09-15", plannedEnd: "2026-10-30", actualStart: null, actualEnd: null, pct: 0 },
        { wbsCode: "WBS-03.01", workItem: "Instalasi listrik lengkap", status: "IN_PROGRESS" as const, personIdx: 0, mandorIdx: 2, plannedStart: "2026-08-01", plannedEnd: "2026-10-30", actualStart: "2026-08-01", actualEnd: null, pct: 40 },
        { wbsCode: "WBS-03.02", workItem: "Sistem plumbing & drainase", status: "PENDING" as const, personIdx: 1, mandorIdx: 2, plannedStart: "2026-08-15", plannedEnd: "2026-10-15", actualStart: null, actualEnd: null, pct: 0 },
        { wbsCode: "WBS-03.03", workItem: "AC split 1 PK", status: "IN_PROGRESS" as const, personIdx: 2, mandorIdx: 1, plannedStart: "2026-08-05", plannedEnd: "2026-10-15", actualStart: "2026-08-05", actualEnd: null, pct: 15 },
      ];

      let jobCount = 0;
      for (let i = 0; i < assignments1.length; i++) {
        const item = assignments1[i];
        const personIdx = item.personIdx % pekerjas.length;
        const mandorIdx = item.mandorIdx % mandors.length;

        await prisma.jobAssignment.create({
          data: {
            assignmentCode: `JOB-${String(i + 1).padStart(3, "0")}`,
            rabId: rab1.id,
            wbsCode: item.wbsCode,
            workItem: item.workItem,
            status: item.status,
            responsiblePersonId: pekerjas[personIdx]?.id || workers[0].id,
            responsibleMandorId: mandors[mandorIdx]?.id || workers[0].id,
            plannedStart: new Date(item.plannedStart),
            plannedEnd: item.plannedEnd ? new Date(item.plannedEnd) : null,
            actualStart: item.actualStart ? new Date(item.actualStart) : null,
            actualEnd: item.actualEnd ? new Date(item.actualEnd) : null,
            progressPct: item.pct,
            priority: 1,
          },
        });
        jobCount++;
      }
      console.log(`✅ Job Assignments (RAB-001): ${jobCount}`);
    }
  }

  if (rab2) {
    const existingAssignments = await prisma.jobAssignment.count({ where: { rabId: rab2.id } });
    if (existingAssignments === 0) {
      const assignments2 = [
        { wbsCode: "WBS-01.01", workItem: "Pekerjaan pembongkaran dinding lama", status: "COMPLETED" as const, personIdx: 0, mandorIdx: 3, plannedStart: "2026-06-15", plannedEnd: "2026-06-30", actualStart: "2026-06-15", actualEnd: "2026-06-28", pct: 100 },
        { wbsCode: "WBS-01.02", workItem: "Pondasi footplat 60x60 cm", status: "COMPLETED" as const, personIdx: 1, mandorIdx: 3, plannedStart: "2026-06-29", plannedEnd: "2026-07-10", actualStart: "2026-06-29", actualEnd: "2026-07-08", pct: 100 },
        { wbsCode: "WBS-01.03", workItem: "Kolom praktis 15x15 cm", status: "COMPLETED" as const, personIdx: 2, mandorIdx: 3, plannedStart: "2026-07-11", plannedEnd: "2026-07-25", actualStart: "2026-07-11", actualEnd: "2026-07-22", pct: 100 },
        { wbsCode: "WBS-01.04", workItem: "Sloof 20x30 cm", status: "COMPLETED" as const, personIdx: 3, mandorIdx: 3, plannedStart: "2026-07-26", plannedEnd: "2026-08-10", actualStart: "2026-07-26", actualEnd: "2026-08-08", pct: 100 },
        { wbsCode: "WBS-01.05", workItem: "Dinding batako 10x20x40 cm", status: "IN_PROGRESS" as const, personIdx: 4, mandorIdx: 3, plannedStart: "2026-08-11", plannedEnd: "2026-08-31", actualStart: "2026-08-11", actualEnd: null, pct: 55 },
        { wbsCode: "WBS-02.01", workItem: "Plesteran dinding baru", status: "PENDING" as const, personIdx: 5, mandorIdx: 3, plannedStart: "2026-09-01", plannedEnd: "2026-09-20", actualStart: null, actualEnd: null, pct: 0 },
        { wbsCode: "WBS-02.02", workItem: "Pengecatan dinding interior", status: "PENDING" as const, personIdx: 6, mandorIdx: 3, plannedStart: "2026-09-21", plannedEnd: "2026-10-10", actualStart: null, actualEnd: null, pct: 0 },
        { wbsCode: "WBS-02.03", workItem: "Pemasangan lantai keramik 60x60 cm", status: "PENDING" as const, personIdx: 7, mandorIdx: 3, plannedStart: "2026-09-25", plannedEnd: "2026-10-15", actualStart: null, actualEnd: null, pct: 0 },
      ];

      let jobCount = 0;
      for (let i = 0; i < assignments2.length; i++) {
        const item = assignments2[i];
        const personIdx = item.personIdx % pekerjas.length;
        const mandorIdx = item.mandorIdx % mandors.length;

        await prisma.jobAssignment.create({
          data: {
            assignmentCode: `JOB-${String(101 + i).padStart(3, "0")}`,
            rabId: rab2.id,
            wbsCode: item.wbsCode,
            workItem: item.workItem,
            status: item.status,
            responsiblePersonId: pekerjas[personIdx]?.id || workers[0].id,
            responsibleMandorId: mandors[mandorIdx]?.id || workers[0].id,
            plannedStart: new Date(item.plannedStart),
            plannedEnd: item.plannedEnd ? new Date(item.plannedEnd) : null,
            actualStart: item.actualStart ? new Date(item.actualStart) : null,
            actualEnd: item.actualEnd ? new Date(item.actualEnd) : null,
            progressPct: item.pct,
            priority: 1,
          },
        });
        jobCount++;
      }
      console.log(`✅ Job Assignments (RAB-002): ${jobCount}`);
    }
  }

  // ============================================
  // 4. SEED QC RECORDS
  // ============================================
  const existingQc = await prisma.qcRecord.count();
  if (existingQc === 0) {
    const assignments = await prisma.jobAssignment.findMany({ take: 10 });
    const qcTemplates = [
      { itemDesc: "Pondasi Strauss pile D300", criteria: "Ukuran sesuai spec, kedalaman 12m", measurement: "12.05m" },
      { itemDesc: "Sloof 30x50 cm", criteria: "Ukuran sesuai gambar, tulangan lengkap", measurement: "30x50 cm OK" },
      { itemDesc: "Kolom 40x40 cm", criteria: "Tegak, tulangan sesuai", measurement: "Tegak 90°" },
      { itemDesc: "Pembesian balok", criteria: "Diameter & jarak sesuai spec", measurement: "D13@150mm OK" },
      { itemDesc: "Plat lantai 12cm", criteria: "Tebal sesuai spec", measurement: "12.2cm" },
      { itemDesc: "Pasangan bata", criteria: "Rata, vertikal", measurement: "Rata, oprit 2mm" },
      { itemDesc: "Plesteran", criteria: "Rata, tidak retak", measurement: "Rata, thickness 15mm" },
      { itemDesc: "Kusen aluminium", criteria: "Rata, kusen sesuai spec", measurement: "Sesuai order" },
      { itemDesc: "Footplat 60x60", criteria: "Ukuran sesuai spec", measurement: "60x60x40cm OK" },
      { itemDesc: "Kolom praktis 15x15", criteria: "Tegak, segitiga benar", measurement: "Tegak 90°" },
    ];

    let qcCount = 0;
    for (let i = 0; i < 30; i++) {
      const template = qcTemplates[i % qcTemplates.length];
      const assignment = assignments[i % assignments.length];
      const worker = workers[i % workers.length];
      if (!assignment || !worker) continue;

      const counter = await prisma.santraCounter.upsert({
        where: { prefix: "QC" },
        create: { prefix: "QC", lastSeq: 0 },
        update: { lastSeq: { increment: 1 } },
      });

      const result = i < 25 ? "PASS" : i < 28 ? "REWORK" : "FAIL";

      await prisma.qcRecord.create({
        data: {
          qcCode: `QC-2026-${String(counter.lastSeq).padStart(4, "0")}`,
          assignmentId: assignment.id,
          workerId: worker.id,
          checkDate: new Date(2026, 6, 1 + (i * 2)),
          itemDesc: template.itemDesc,
          criteria: template.criteria,
          measurement: template.measurement,
          result: result as "PASS" | "FAIL" | "REWORK",
          defectDesc: result !== "PASS" ? "Perlu perbaikan sesuai instruksi" : null,
          isRework: result === "REWORK",
        },
      });
      qcCount++;
    }
    console.log(`✅ QC Records: ${qcCount}`);
  } else {
    console.log(`⏭️  QC Records already exist: ${existingQc}`);
  }

  // ============================================
  // 5. SEED EXECUTION LOGS
  // ============================================
  const existingExec = await prisma.executionLog.count();
  if (existingExec === 0) {
    const assignments = await prisma.jobAssignment.findMany();
    let execCount = 0;
    const year = 2026;

    for (const assignment of assignments) {
      const startDate = new Date(assignment.actualStart || assignment.plannedStart);
      const endDate = assignment.actualEnd || new Date(assignment.plannedEnd || Date.now());
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const execDays = Math.min(days, 14);

      for (let i = 0; i < execDays; i++) {
        const execDate = new Date(startDate);
        execDate.setDate(execDate.getDate() + i);
        if (execDate > new Date()) continue;

        const counter = await prisma.santraCounter.upsert({
          where: { prefix: "LOG" },
          create: { prefix: "LOG", lastSeq: 0 },
          update: { lastSeq: { increment: 1 } },
        });

        const workerId = assignment.responsiblePersonId || workers[0].id;
        const progressStep = 100 / execDays;
        const currentProgress = Math.min(Math.round(progressStep * (i + 1)), 100);

        await prisma.executionLog.create({
          data: {
            logCode: `LOG-${year}-${String(counter.lastSeq).padStart(4, "0")}`,
            assignmentId: assignment.id,
            workerId,
            logDate: execDate,
            description: `Pekerjaan ${assignment.workItem} - hari ke-${i + 1}`,
            progressPct: currentProgress,
            locationName: assignment.rabId === rab1?.id ? "Gedung Perkantoran" : "Renovasi Rumah",
          },
        });
        execCount++;
      }
    }
    console.log(`✅ Execution Logs: ${execCount}`);
  } else {
    console.log(`⏭️  Execution Logs already exist: ${existingExec}`);
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log("\n📊 Final Data Summary:");
  const [finalWorkers, finalAssessments, finalAssignments, finalKpis, finalQc, finalExec, finalTools, finalLoans] = await Promise.all([
    prisma.worker.count(),
    prisma.workerAssessment.count(),
    prisma.jobAssignment.count(),
    prisma.kpiRecord.count(),
    prisma.qcRecord.count(),
    prisma.executionLog.count(),
    prisma.masterTool.count(),
    prisma.toolLoan.count(),
  ]);

  console.log(`  Workers: ${finalWorkers}`);
  console.log(`  Assessments: ${finalAssessments}`);
  console.log(`  Job Assignments: ${finalAssignments}`);
  console.log(`  KPI Records: ${finalKpis}`);
  console.log(`  QC Records: ${finalQc}`);
  console.log(`  Execution Logs: ${finalExec}`);
  console.log(`  Master Tools: ${finalTools}`);
  console.log(`  Tool Loans: ${finalLoans}`);

  console.log("\n✅ SANTRA seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
