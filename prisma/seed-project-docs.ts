/**
 * Project Docs Seeder
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) { console.log("No admin"); return; }
  const uid = admin.id;
  const rabs = await prisma.rab.findMany({ orderBy: { scheduleStart: "asc" }, take: 3 });
  console.log("Seeding " + rabs.length + " RABs");
  for (const rab of rabs) {
    const start = new Date(rab.scheduleStart || new Date());
    // Daily Reports
    const dr = await prisma.dailyReport.count({ where: { rabId: rab.id } });
    if (!dr) {
      for (let d = 0; d < 45; d++) {
        const dt = new Date(start);
        dt.setDate(dt.getDate() + d);
        if (dt.getDay() === 0) continue;
        await prisma.dailyReport.create({ data: { rabId: rab.id, date: dt, weatherMorning: "CERAH", weatherAfternoon: "CERAH", activities: "Rutin", createdById: uid } });
      }
      console.log("  Daily reports: 45");
    }
    // Billings
    const bl = await prisma.progressBilling.count({ where: { rabId: rab.id } });
    if (!bl) {
      const tot = Number(rab.total);
      await prisma.progressBilling.create({ data: { number: "BILL-" + rab.number + "-01", rabId: rab.id, status: "PAID", periodEnd: new Date(Date.now() - 86400000 * 30), cumulativeValue: tot * 0.25, previousValue: 0, currentValue: tot * 0.25, retentionPct: 5, taxPct: 11, snapshot: {}, createdById: uid } });
      await prisma.progressBilling.create({ data: { number: "BILL-" + rab.number + "-02", rabId: rab.id, status: "ISSUED", periodEnd: new Date(Date.now() + 86400000 * 30), cumulativeValue: tot * 0.5, previousValue: tot * 0.25, currentValue: tot * 0.25, retentionPct: 5, taxPct: 11, snapshot: {}, createdById: uid } });
      console.log("  Billings: 2");
    }
    // Logbook
    const lb = await prisma.logbookEntry.count({ where: { rabId: rab.id } });
    if (!lb) {
      for (let i = 0; i < 5; i++) {
        const dt = new Date(start);
        dt.setDate(dt.getDate() + (i + 1) * 10);
        await prisma.logbookEntry.create({ data: { rabId: rab.id, date: dt, category: "INFO", severity: "RINGAN", title: "Log " + (i + 1), description: "Kejadian harian", createdById: uid } });
      }
      console.log("  Logbook: 5");
    }
    // Memos
    const sm = await prisma.siteMemo.count({ where: { rabId: rab.id } });
    if (!sm) {
      await prisma.siteMemo.create({ data: { number: "SM-" + rab.number + "-01", rabId: rab.id, direction: "INCOMING", category: "INSTRUKSI", status: "CLOSED", subject: "Perubahan Material", body: "Diskusi", fromParty: rab.clientName || "Klien", toParty: "Sanata", letterDate: new Date(), createdById: uid } });
      await prisma.siteMemo.create({ data: { number: "SM-" + rab.number + "-02", rabId: rab.id, direction: "OUTGOING", category: "APPROVAL", status: "OPEN", subject: "Approve Shop Drawing", body: "Mohon approve", fromParty: "Sanata", toParty: rab.clientName || "Klien", letterDate: new Date(), createdById: uid } });
      console.log("  Memos: 2");
    }
    // Letters
    const pl = await prisma.projectLetter.count({ where: { rabId: rab.id } });
    if (!pl) {
      const sig = await prisma.signatory.findFirst();
      await prisma.projectLetter.create({ data: { number: "SPK-" + rab.number, rabId: rab.id, type: "SPK", status: "SIGNED", subject: "SPK", letterDate: new Date(), signerName: sig?.name || "Hendra", signerTitle: sig?.title || "Dir", amount: Number(rab.total) * 0.9, totalAmount: Number(rab.total), body: {}, createdById: uid } });
      await prisma.projectLetter.create({ data: { number: "INV-" + rab.number, rabId: rab.id, type: "INVOICE", status: "PAID", subject: "Invoice", letterDate: new Date(Date.now() - 86400000 * 30), paidAt: new Date(Date.now() - 86400000 * 20), recipientName: rab.clientName || "Klien", signerName: sig?.name, signerTitle: sig?.title, amount: Number(rab.total) * 0.25, totalAmount: Number(rab.total) * 0.2775, body: {}, createdById: uid } });
      console.log("  Letters: 2");
    }
    // Submissions
    const sub = await prisma.projectSubmission.count({ where: { rabId: rab.id } });
    if (!sub) {
      await prisma.projectSubmission.create({ data: { number: "AJU-" + rab.number + "-01", rabId: rab.id, type: "MATERIAL", status: "APPROVED_CLIENT", title: "Pengajuan Material", reason: "Butuh", requestedById: uid, createdById: uid } });
      await prisma.projectSubmission.create({ data: { number: "AJU-" + rab.number + "-02", rabId: rab.id, type: "WAKTU", status: "DRAFT", title: "Perpanjangan Waktu", reason: "Hujan", createdById: uid } });
      console.log("  Submissions: 2");
    }
  }
  console.log("
Total: DR=" + await prisma.dailyReport.count() + " BILL=" + await prisma.progressBilling.count() + " LB=" + await prisma.logbookEntry.count() + " SM=" + await prisma.siteMemo.count() + " PL=" + await prisma.projectLetter.count() + " SUB=" + await prisma.projectSubmission.count());
}
main().catch(console.error).finally(() => prisma.());
