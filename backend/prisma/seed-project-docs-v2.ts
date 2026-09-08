/**
 * SANTRA Project Docs Seeder v2
 * Seeds data untuk modul: Daily Reports, Progress, Logbook, Memos, Letters, Billings
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Project Docs Seeder v2");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) { console.error("No admin"); return; }
  const uid = admin.id;

  const rabs = await prisma.rab.findMany({ where: { status: "APPROVED" }, take: 1 });
  if (!rabs.length) { console.error("No approved RAB"); return; }
  const rab = rabs[0];

  console.log("Seeding: " + rab.number);

  // Daily Reports
  const dc = await prisma.dailyReport.count({ where: { rabId: rab.id } });
  if (!dc) {
    const s = new Date(rab.scheduleStart || Date());
    for (let d = 0; d < 45; d++) {
      const dt = new Date(s); dt.setDate(dt.getDate() d);
      if (dt.getDay() === 0) continue;
      await prisma.dailyReport.create({
        data: { rabId: rab.id, date: dt, weatherMorning: "CERAH", weatherAfternoon: "CERAH",
          workforce: { Tukang: 5, Pekerja: 10 }, activities: "Pekerjaan sesuai schedule", createdById: uid }
      });
    }
    console.log("Daily reports: 45");
  }

  console.log("Done - run full seed.ts for more data");
}

main().catch(console.error).finally(() => prisma.$disconnect());
