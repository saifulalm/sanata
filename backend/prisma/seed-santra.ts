/**
 * Standalone SANTRA seeder
 * Run: npx tsx prisma/seed-santra.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SANTRA data...");

  // Workers
  const workers = await prisma.worker.findMany({ take: 100 });
  console.log("Workers:", workers.length);

  // Index workers
  const mandors = workers.filter(w => w.role === "MANDOR");
  const tukangs = workers.filter(w => w.role.includes("TUKANG"));
  const pekerjas = workers.filter(w => w.role === "PEKERJA" || w.role === "OPERATOR");

  // RABs
  const allRabs = await prisma.rab.findMany({ take: 5 });
  const rab1 = allRabs.find(r => r.number.includes("001"));
  const rab2 = allRabs.find(r => r.number.includes("002"));
  console.log("RAB1:", rab1?.id);
  console.log("RAB2:", rab2?.id);

  // Assigns
  const existing = await prisma.jobAssignment.count();
  if (existing < 20 && rab1) {
    let cnt = 0;
    const items = [
      { code: "JOB-001", rabId: rab1.id, wbs: "WBS-01.01", work: "Pekerjaan pondasi Strauss pile D300", status: "COMPLETED" as const, personIdx: 0, mandorIdx: 0, start: "2026-02-01", end: "2026-03-10", pct: 100 },
      { code: "JOB-002", rabId: rab1.id, wbs: "WBS-01.02", work: "Sloof 30x50 cm", status: "COMPLETED" as const, personIdx: 1, mandorIdx: 0, start: "2026-03-11", end: "2026-03-28", pct: 100 },
      { code: "JOB-003", rabId: rab1.id, wbs: "WBS-01.03", work: "Kolom 40x40 cm", status: "COMPLETED" as const, personIdx: 2, mandorIdx: 0, start: "2026-04-01", end: "2026-05-10", pct: 100 },
      { code: "JOB-004", rabId: rab1.id, wbs: "WBS-01.04", work: "Balok 30x50 cm", status: "COMPLETED" as const, personIdx: 3, mandorIdx: 0, start: "2026-05-11", end: "2026-06-12", pct: 100 },
      { code: "JOB-005", rabId: rab1.id, wbs: "WBS-01.05", work: "Plat lantai 12cm", status: "IN_PROGRESS" as const, personIdx: 4, mandorIdx: 1, start: "2026-06-16", end: null, pct: 85 },
      { code: "JOB-006", rabId: rab1.id, wbs: "WBS-02.01", work: "Pasangan bata 1PC:5PP", status: "IN_PROGRESS" as const, personIdx: 5, mandorIdx: 1, start: "2026-07-01", end: null, pct: 60 },
      { code: "JOB-007", rabId: rab1.id, wbs: "WBS-02.02", work: "Plesteran dinding", status: "PENDING" as const, personIdx: 6, mandorIdx: 1, start: "2026-08-01", end: null, pct: 0 },
      { code: "JOB-008", rabId: rab1.id, wbs: "WBS-02.03", work: "Pengecatan dinding", status: "PENDING" as const, personIdx: 7, mandorIdx: 1, start: "2026-09-01", end: null, pct: 0 },
      { code: "JOB-009", rabId: rab1.id, wbs: "WBS-02.04", work: "Kusen aluminium", status: "PENDING" as const, personIdx: 8, mandorIdx: 1, start: "2026-09-15", end: null, pct: 0 },
      { code: "JOB-010", rabId: rab1.id, wbs: "WBS-03.01", work: "Instalasi listrik", status: "IN_PROGRESS" as const, personIdx: 0, mandorIdx: 2, start: "2026-08-01", end: null, pct: 40 },
      { code: "JOB-011", rabId: rab1.id, wbs: "WBS-03.02", work: "Plumbing & drainase", status: "PENDING" as const, personIdx: 1, mandorIdx: 2, start: "2026-08-15", end: null, pct: 0 },
      { code: "JOB-012", rabId: rab1.id, wbs: "WBS-03.03", work: "AC split", status: "IN_PROGRESS" as const, personIdx: 2, mandorIdx: 1, start: "2026-08-05", end: null, pct: 15 },
    ];

    for (const item of items) {
      try {
        await prisma.jobAssignment.create({
          data: {
            assignmentCode: item.code,
            rabId: item.rabId,
            wbsCode: item.wbs,
            workItem: item.work,
            status: item.status,
            responsiblePersonId: pekerjas[item.personIdx]?.id,
            responsibleMandorId: mandors[item.mandorIdx]?.id,
            plannedStart: new Date(item.start),
            plannedEnd: item.end ? new Date(item.end) : null,
            actualStart: item.status !== "PENDING" ? new Date(item.start) : null,
            actualEnd: item.status === "COMPLETED" && item.end ? new Date(item.end) : null,
            progressPct: item.pct,
            priority: 1,
          },
        });
        cnt++;
      } catch (e) {
        // Skip dupes
      }
    }
    console.log("Assignments created:", cnt);
  } else {
    console.log("Assignments existing:", existing);
  }

  // Executions
  const execCount = await prisma.executionLog.count();
  if (execCount === 0) {
    const jobs = await prisma.jobAssignment.findMany();
    let cnt = 0;
    for (const job of jobs) {
      if (!job.actualStart) continue;
      const start = new Date(job.actualStart);
      const end = job.actualEnd ? new Date(job.actualEnd) : new Date();
      const days = Math.min(14, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (d > new Date()) continue;
        try {
          const ctr = await prisma.santraCounter.upsert({
            where: { prefix: "LOG" },
            create: { prefix: "LOG", lastSeq: 0 },
            update: { lastSeq: { increment: 1 } },
            select: { lastSeq: true },
          });
          await prisma.executionLog.create({
            data: {
              logCode: "LOG-2026-" + String(ctr.lastSeq).padStart(4, "0"),
              assignmentId: job.id,
              workerId: job.responsiblePersonId || workers[0].id,
              logDate: d,
              description: "Pekerjaan " + job.workItem + " hari ke-" + (i + 1),
              progressPct: Math.round(((i + 1) / days) * 100),
              locationName: job.rabId === rab1?.id ? "Gedung" : job.rabId === rab2?.id ? "Rumah" : "Lain",
            },
          });
          cnt++;
        } catch (e) {
          // skip
        }
      }
    }
    console.log("Executions created:", cnt);
  } else {
    console.log("Executions existing:", execCount);
  }

  // QC
  const qcCount = await prisma.qcRecord.count();
  if (qcCount < 30) {
    const jobs = await prisma.jobAssignment.findMany({ take: 10 });
    let cnt = 0;
    for (let i = 0; i < 30; i++) {
      try {
        const ctr = await prisma.santraCounter.upsert({
          where: { prefix: "QC" },
          create: { prefix: "QC", lastSeq: 0 },
          update: { lastSeq: { increment: 1 } },
          select: { lastSeq: true },
        });
        const job = jobs[i % jobs.length];
        await prisma.qcRecord.create({
          data: {
            qcCode: `QC-2026-${String(ctr.lastSeq).padStart(4, "0")}`,
            assignmentId: job.id,
            workerId: job.responsiblePersonId || workers[0].id,
            checkDate: new Date(2026, 7, 1 + i * 2),
            itemDesc: "Item QC #" + (i + 1),
            criteria: "Sesuai spec",
            measurement: "OK",
            result: i < 25 ? "PASS" : i < 28 ? "REWORK" : "FAIL",
          },
        });
        cnt++;
      } catch (e) { /* skip */ }
    }
    console.log("QC records created:", cnt);
  } else {
    console.log("QC records existing:", qcCount);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
