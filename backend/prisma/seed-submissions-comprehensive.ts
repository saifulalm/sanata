/**
 * Project Submissions Comprehensive Seeder
 * Creates various types of submissions with different statuses
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("======================================================================");
  console.log("PROJECT SUBMISSIONS COMPREHENSIVE SEEDING");
  console.log("======================================================================");
  console.log("");

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin?.id || "";

  // Get all RABs
  const rabs = await prisma.rab.findMany();

  console.log(`Found ${rabs.length} RAB projects`);

  let totalSubmissions = 0;

  for (const rab of rabs) {
    console.log(`\n📤 Processing ${rab.number}`);

    // Get document counter for submissions
    const counter = await prisma.documentCounter.upsert({
      where: { id: `SUB-${new Date().getFullYear()}` },
      update: { lastSeq: { increment: 1 } },
      create: { id: `SUB-${new Date().getFullYear()}`, series: "SUB", year: new Date().getFullYear(), lastSeq: 0 },
    });

    // Create different types of submissions based on project
    const submissions = generateSubmissions(rab, counter.lastSeq);

    for (const sub of submissions) {
      const existing = await prisma.projectSubmission.findUnique({
        where: { number: sub.number },
      });

      if (!existing) {
        // Extract items before creating submission
        const { items, ...submissionData } = sub;

        const created = await prisma.projectSubmission.create({
          data: {
            ...submissionData,
            requestedById: adminId,
          },
        });

        // Create submission items if MATERIAL type
        if (items && items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            await prisma.projectSubmissionItem.create({
              data: {
                submissionId: created.id,
                name: items[i].name,
                spec: items[i].spec,
                unit: items[i].unit,
                quantity: items[i].quantity,
                unitPrice: items[i].unitPrice,
                amount: items[i].quantity * items[i].unitPrice,
                order: i,
              },
            });
          }
        }

        totalSubmissions++;
      }
    }

    console.log(`   ✅ Created ${submissions.length} submissions`);
  }

  console.log("\n======================================================================");
  console.log(`✅ SUBMISSIONS SEEDING COMPLETE! Total: ${totalSubmissions} submissions`);
  console.log("======================================================================");
}

function generateSubmissions(rab: any, startSeq: number) {
  const submissions = [];
  let seq = startSeq + 1;

  // MATERIAL Submission - APPROVED_CLIENT
  submissions.push({
    number: `SUB-${new Date().getFullYear()}-${String(seq++).padStart(4, "0")}`,
    rabId: rab.id,
    type: "MATERIAL" as const,
    status: "APPROVED_CLIENT" as const,
    title: "Perubahan Mutu Beton dari K-250 ke K-300",
    reason: "Berdasarkan hasil tes tanah dan konsultasi dengan konsultan struktur, perlu penguatan struktur fondasi dengan beton mutu lebih tinggi untuk keamanan gedung.",
    neededDate: new Date(),
    estimatedCost: 45_000_000,
    submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    reviewNote: "Disetujui dengan catatan harus ada tes slump test setiap pengecoran.",
    forwardedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    clientDecidedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    clientDecidedBy: rab.clientName,
    clientNote: "Setuju, proceed dengan perubahan.",
    items: [
      { name: "Beton ready mix K-300", spec: "fc' 25 MPa, Slump 12±2cm", unit: "m3", quantity: 120, unitPrice: 1_350_000 },
      { name: "Additive waterproofing", spec: "Sika or equivalent", unit: "kg", quantity: 500, unitPrice: 45_000 },
    ],
  });

  // MATERIAL Submission - FORWARDED_CLIENT
  submissions.push({
    number: `SUB-${new Date().getFullYear()}-${String(seq++).padStart(4, "0")}`,
    rabId: rab.id,
    type: "MATERIAL" as const,
    status: "FORWARDED_CLIENT" as const,
    title: "Perubahan Finishing Dinding dari Cat ke Marmer",
    reason: "Klien menginginkan perubahan finishing dinding area lobby dari cat menjadi marmer import untuk kesan lebih mewah.",
    neededDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    estimatedCost: 185_000_000,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    reviewNote: "Disetujui sisi teknis, menunggu keputusan klien soal tambahan biaya.",
    forwardedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    items: [
      { name: "Marmer Carrara White", spec: "Import Italy, 60x60cm", unit: "m2", quantity: 180, unitPrice: 850_000 },
      { name: "Adhesive marmer", spec: "Weber or equivalent", unit: "sak", quantity: 40, unitPrice: 125_000 },
    ],
  });

  // WAKTU Submission - APPROVED_INTERNAL
  submissions.push({
    number: `SUB-${new Date().getFullYear()}-${String(seq++).padStart(4, "0")}`,
    rabId: rab.id,
    type: "WAKTU" as const,
    status: "APPROVED_INTERNAL" as const,
    title: "Perpanjangan Waktu 14 Hari - Cuaca Ekstrem",
    reason: "Hujan deras selama 10 hari berturut-turut menyebabkan penundaan pengecoran dan pekerjaan exterior. Butuh perpanjangan waktu untuk menyelesaikan backlog.",
    neededDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    requestedDays: 14,
    estimatedCost: 0,
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    reviewNote: "Disetujui. Weather data logs supporting the claim.",
  });

  // WAKTU Submission - DRAFT
  submissions.push({
    number: `SUB-${new Date().getFullYear()}-${String(seq++).padStart(4, "0")}`,
    rabId: rab.id,
    type: "WAKTU" as const,
    status: "DRAFT" as const,
    title: "Perpanjangan Waktu 7 Hari - Keterlambatan Material",
    reason: "Supplier steel beam terlambat pengiriman 7 hari akibat masalah logistik. Perlu perpanjangan waktu untuk mengejar schedule.",
    neededDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requestedDays: 7,
    estimatedCost: 0,
  });

  // ALAT Submission - SUBMITTED
  submissions.push({
    number: `SUB-${new Date().getFullYear()}-${String(seq++).padStart(4, "0")}`,
    rabId: rab.id,
    type: "ALAT" as const,
    status: "SUBMITTED" as const,
    title: "Sewa Tower Crane Tambahan",
    reason: "Untuk mempercepat pekerjaan struktur lantai atas, perlu tower crane tambahan karena crane existing tidak mencukupi jangkauan.",
    neededDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedCost: 95_000_000,
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  // MATERIAL Submission - REJECTED
  submissions.push({
    number: `SUB-${new Date().getFullYear()}-${String(seq++).padStart(4, "0")}`,
    rabId: rab.id,
    type: "MATERIAL" as const,
    status: "REJECTED" as const,
    title: "Penggunaan Granit Import untuk Seluruh Lantai",
    reason: "Klien meminta seluruh lantai menggunakan granit import Italia, namun budget tidak tersedia.",
    neededDate: new Date(),
    estimatedCost: 450_000_000,
    submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    reviewNote: "Ditolak karena budget tidak tersedia dan tidak sesuai scope awal.",
    forwardedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
    clientDecidedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    clientDecidedBy: rab.clientName,
    clientNote: "Budget tidak tersedia, tetap gunakan keramik sesuai RAB.",
    items: [
      { name: "Granit Italy", spec: "60x60cm, first grade", unit: "m2", quantity: 450, unitPrice: 1_200_000 },
    ],
  });

  return submissions;
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
