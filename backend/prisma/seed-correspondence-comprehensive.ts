/**
 * Project Letters (Surat-menyurat) Comprehensive Seeder
 * Creates SPK, Invoice, Kwitansi, BAPP, BAST for all RABs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("======================================================================");
  console.log("PROJECT LETTERS (SURAT-MENYURAT) COMPREHENSIVE SEEDING");
  console.log("======================================================================");
  console.log("");

  // Get admin user and signatories
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin?.id || "";
  const signatories = await prisma.signatory.findMany({ take: 5 });
  const signer = signatories[0];

  // Get all RABs
  const rabs = await prisma.rab.findMany({
    include: { billings: true },
  });

  console.log(`Found ${rabs.length} RAB projects`);

  let totalLetters = 0;

  for (const rab of rabs) {
    console.log(`\n📄 Processing ${rab.number}: ${rab.title}`);
    console.log(`   Status: ${rab.status}, Total: Rp ${Number(rab.total).toLocaleString()}`);

    // Ensure document counters exist
    const year = new Date().getFullYear();
    await ensureCounters(year);

    // ============================================
    // Create SPK (Surat Perjanjian Kerja)
    // ============================================
    await createSPK(rab, signer, adminId, year);
    totalLetters++;

    // ============================================
    // Create Progress Billings & Invoices
    // ============================================
    await createBillingsAndInvoices(rab, signer, adminId, year);

    // ============================================
    // Create BAPP (Berita Acara Penyelesaian Pekerjaan)
    // ============================================
    await createBAPP(rab, signer, adminId, year);

    // ============================================
    // Create BAST for completed projects
    // ============================================
    if (rab.status === "APPROVED" || rab.number === "RAB-2026-003") {
      await createBAST(rab, signer, adminId, year);
    }
  }

  console.log("\n======================================================================");
  console.log(`✅ PROJECT LETTERS SEEDING COMPLETE! Total: ${totalLetters} letters`);
  console.log("======================================================================");
}

async function ensureCounters(year: number) {
  const counters = ["SPK", "INV", "KWIT", "BAPP", "BAST"];
  for (const series of counters) {
    await prisma.documentCounter.upsert({
      where: { id: `${series}-${year}` },
      update: {},
      create: { id: `${series}-${year}`, series, year, lastSeq: 0 },
    });
  }
}

async function getNextNumber(series: string, year: number): Promise<number> {
  const counter = await prisma.documentCounter.update({
    where: { id: `${series}-${year}` },
    data: { lastSeq: { increment: 1 } },
  });
  return counter.lastSeq;
}

async function createSPK(rab: any, signer: any, adminId: string, year: number) {
  const seq = await getNextNumber("SPK", year);
  const number = `SPK-${year}-${String(seq).padStart(3, "0")}`;

  const existing = await prisma.projectLetter.findUnique({ where: { number } });
  if (existing) return;

  await prisma.projectLetter.create({
    data: {
      number,
      rabId: rab.id,
      type: "SPK",
      status: "SIGNED",
      subject: `Surat Perjanjian Kerja - ${rab.title}`,
      letterDate: rab.projectDate || new Date(),
      issuedAt: new Date(),
      signedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      recipientName: rab.clientName || "Klien",
      recipientCompany: rab.clientName,
      recipientAddress: rab.location,
      attentionTo: `Tim Proyek ${rab.clientName}`,
      signerName: signer?.name || "Ir. Hendra Kusuma",
      signerTitle: signer?.title || "Directeur Utama",
      signatoryId: signer?.id,
      counterSignerName: rab.clientName,
      counterSignerTitle: "Pemberi Kerja",
      amount: Number(rab.subtotal),
      retentionAmount: 0,
      taxPct: 11,
      taxAmount: Number(rab.taxAmount),
      totalAmount: Number(rab.total),
      amountInWords: numberToWords(Number(rab.total)),
      body: {
        clauses: [
          {
            title: "Pasal 1 — Lingkup Pekerjaan",
            text: `Kontraktor melaksanakan pekerjaan ${rab.title} sesuai gambar kerja, spesifikasi teknis, dan RAB yang telah disepakati.`,
          },
          {
            title: "Pasal 2 — Nilai Kontrak",
            text: `Nilai kontrak adalah Rp ${Number(rab.total).toLocaleString('id-ID')} (${numberToWords(Number(rab.total))}) termasuk PPN ${rab.taxPct}%.`,
          },
          {
            title: "Pasal 3 — Jadwal Pelaksanaan",
            text: `Jadwal pelaksanaan pekerjaan adalah ${calculateMonths(rab.scheduleStart)} (${calculateMonths(rab.scheduleStart) * 30}) hari kalender terhitung sejak tanggal mulai kerja.`,
          },
          {
            title: "Pasal 4 — Sistem Pembayaran",
            text: "Pembayaran dilakukan secara termin sesuai dengan pencapaian progres pekerjaan yang terverifikasi.",
          },
          {
            title: "Pasal 5 — Garansi",
            text: "Kontraktor memberikan garansi struktur selama 10 tahun dan garansi finishing selama 2 tahun.",
          },
          {
            title: "Pasal 6 — Cuti & Hari Libur",
            text: "Hari Minggu dan hari libur nasional tidak dihitung sebagai hari kerja efektif.",
          },
        ],
        opening: `Pada hari ini, tanggal ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, telah dijalin perjanjian kerja antara:`,
        closing: "Demikian perjanjian ini dibuat dalam rangkap 2 (dua) dan memiliki kekuatan hukum yang sama.",
      },
      createdById: adminId,
    },
  });

  console.log(`   ✅ Created SPK: ${number}`);
}

async function createBillingsAndInvoices(rab: any, signer: any, adminId: string, year: number) {
  // Calculate termin based on project value
  const total = Number(rab.total);
  const terms = calculatePaymentTerms(total);

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];

    // Create Progress Billing
    const billSeq = await getNextNumber("BILL", year);
    const billNumber = `BILL-${year}-${String(billSeq).padStart(3, "0")}`;

    const existingBill = await prisma.projectLetter.findUnique({ where: { number: billNumber } });
    if (!existingBill) {
      const statusEnum = term.status as "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

      const billing = await prisma.progressBilling.upsert({
        where: { number: billNumber },
        update: {
          rabId: rab.id,
          periodEnd: term.periodEnd,
          cumulativeValue: term.cumulativeValue,
          previousValue: term.previousValue,
          currentValue: term.currentValue,
          retentionPct: 5,
          retentionAmount: term.currentValue * 0.05,
          taxPct: 11,
          taxAmount: (term.currentValue - term.currentValue * 0.05) * 0.11,
          netAmount: (term.currentValue - term.currentValue * 0.05) * 1.11,
          status: statusEnum,
        },
        create: {
          number: billNumber,
          rabId: rab.id,
          status: statusEnum,
          periodEnd: term.periodEnd,
          cumulativeValue: term.cumulativeValue,
          previousValue: term.previousValue,
          currentValue: term.currentValue,
          retentionPct: 5,
          retentionAmount: term.currentValue * 0.05,
          taxPct: 11,
          taxAmount: (term.currentValue - term.currentValue * 0.05) * 0.11,
          netAmount: (term.currentValue - term.currentValue * 0.05) * 1.11,
          snapshot: {},
          createdById: adminId,
        },
      });

      // Create Invoice
      const invSeq = await getNextNumber("INV", year);
      const invNumber = `INV-${year}-${String(invSeq).padStart(3, "0")}`;

      const invoiceStatus = (term.status === "PAID" ? "PAID" : term.status === "ISSUED" ? "ISSUED" : "DRAFT") as "DRAFT" | "ISSUED" | "SIGNED" | "PAID" | "CANCELLED";
      const issuedDate = term.issuedDate || new Date();

      await prisma.projectLetter.create({
        data: {
          number: invNumber,
          rabId: rab.id,
          billingId: billing.id,
          type: "INVOICE",
          status: invoiceStatus,
          subject: `Invoice Termin ${i + 1} — Progress ${term.percent}%`,
          letterDate: issuedDate,
          issuedAt: issuedDate,
          paidAt: term.status === "PAID" && term.paidDate ? term.paidDate : undefined,
          dueDate: new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          recipientName: rab.clientName,
          recipientCompany: rab.clientName,
          recipientAddress: rab.location,
          signerName: signer?.name || "Ir. Hendra Kusuma",
          signerTitle: signer?.title || "Directeur Utama",
          signatoryId: signer?.id,
          amount: term.currentValue,
          retentionAmount: term.currentValue * 0.05,
          taxPct: 11,
          taxAmount: (term.currentValue - term.currentValue * 0.05) * 0.11,
          totalAmount: (term.currentValue - term.currentValue * 0.05) * 1.11,
          amountInWords: numberToWords((term.currentValue - term.currentValue * 0.05) * 1.11),
          body: {
            lines: [
              { description: `Pekerjaan termin ${i + 1} - Progress ${term.percent}%`, amount: term.currentValue },
            ],
            bankInfo: {
              bank: "Bank Central Asia (BCA)",
              account: "123-456-7890",
              name: "PT Sanata Construction",
            },
          },
          createdById: adminId,
        },
      });

      // Create Kwitansi if PAID
      if (term.status === "PAID" && term.paidDate) {
        const kwitSeq = await getNextNumber("KWIT", year);
        const kwitNumber = `KWIT-${year}-${String(kwitSeq).padStart(3, "0")}`;

        await prisma.projectLetter.create({
          data: {
            number: kwitNumber,
            rabId: rab.id,
            parentLetterId: (await prisma.projectLetter.findUnique({ where: { number: invNumber } }))?.id,
            type: "KWITANSI",
            status: "SIGNED",
            subject: `Kwitansi Pembayaran Termin ${i + 1}`,
            letterDate: term.paidDate,
            issuedAt: term.paidDate,
            signedAt: term.paidDate,
            recipientName: rab.clientName,
            recipientCompany: rab.clientName,
            signerName: "Maya Anggraini",
            signerTitle: "Manajer Keuangan",
            amount: (term.currentValue - term.currentValue * 0.05) * 1.11,
            retentionAmount: 0,
            taxPct: 0,
            taxAmount: 0,
            totalAmount: (term.currentValue - term.currentValue * 0.05) * 1.11,
            amountInWords: numberToWords((term.currentValue - term.currentValue * 0.05) * 1.11),
            body: {},
            createdById: adminId,
          },
        });
      }

      console.log(`   ✅ Created BILL: ${billNumber} (${term.status}), INV: ${invNumber}`);
    }
  }
}

async function createBAPP(rab: any, signer: any, adminId: string, year: number) {
  const seq = await getNextNumber("BAPP", year);
  const number = `BAPP-${year}-${String(seq).padStart(3, "0")}`;

  const existing = await prisma.projectLetter.findUnique({ where: { number } });
  if (existing) return;

  await prisma.projectLetter.create({
    data: {
      number,
      rabId: rab.id,
      type: "BAPP",
      status: "SIGNED",
      subject: "Berita Acara Penyelesaian Pekerjaan Termin",
      letterDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      issuedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      signedAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
      recipientName: rab.clientName,
      recipientCompany: rab.clientName,
      signerName: signer?.name || "Ir. Hendra Kusuma",
      signerTitle: signer?.title || "Directeur Utama",
      signatoryId: signer?.id,
      counterSignerName: "Tim Pengawas",
      counterSignerTitle: "Konsultan Pengawas",
      amount: 0,
      retentionAmount: 0,
      taxPct: 0,
      taxAmount: 0,
      totalAmount: 0,
      body: {
        clauses: [
          {
            title: "Pekerjaan yang Diselesaikan",
            text: "Pekerjaan sesuai dengan lingkup kontrak telah diselesaikan pada tanggal yang telah disepakati.",
          },
          {
            title: "Hasil Pemeriksaan",
            text: "Hasil pemeriksaan visual dan pengujian menunjukkan seluruh pekerjaan sesuai spesifikasi teknis yang telah ditetapkan.",
          },
          {
            title: "Persetujuan",
            text: "Pihak pertama dan kedua menyetujui hasil pekerjaan ini untuk dijadikan dasar pembayaran termin berikutnya.",
          },
        ],
        opening: "Pada tanggal yang tersebut di bawah ini, telah dilakukan pemeriksaan bersama terhadap pekerjaan konstruksi.",
        closing: "Hasil pemeriksaan ini disepakati dan ditandatangani oleh kedua belah pihak.",
      },
      createdById: adminId,
    },
  });

  console.log(`   ✅ Created BAPP: ${number}`);
}

async function createBAST(rab: any, signer: any, adminId: string, year: number) {
  const seq = await getNextNumber("BAST", year);
  const number = `BAST-${year}-${String(seq).padStart(3, "0")}`;

  const existing = await prisma.projectLetter.findUnique({ where: { number } });
  if (existing) return;

  await prisma.projectLetter.create({
    data: {
      number,
      rabId: rab.id,
      type: "BAST",
      status: "SIGNED",
      subject: "Berita Acara Serah Terima Pekerjaan",
      letterDate: new Date(),
      issuedAt: new Date(),
      signedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      recipientName: rab.clientName,
      recipientCompany: rab.clientName,
      recipientAddress: rab.location,
      signerName: signer?.name || "Ir. Hendra Kusuma",
      signerTitle: signer?.title || "Directeur Utama",
      signatoryId: signer?.id,
      counterSignerName: rab.clientName,
      counterSignerTitle: "Pemberi Kerja",
      amount: 0,
      retentionAmount: 0,
      taxPct: 0,
      taxAmount: 0,
      totalAmount: 0,
      body: {
        clauses: [
          {
            title: "Penyerahan Pekerjaan",
            text: `Kontraktor telah menyelesaikan seluruh pekerjaan ${rab.title} sesuai dengan kontrak dan addendum yang telah disepakati.`,
          },
          {
            title: "Dokumen Pendukung",
            text: "Berikut dokumen yang diserahkan: Gambar as built drawing, Manual maintenance, Sertifikat quality, Laporan progress.",
          },
          {
            title: "Masa Pemeliharaan",
            text: "Masa pemeliharaan dimulai sejak tanggal serah terima ini selama 365 hari kalender.",
          },
          {
            title: "Pengembalian Jaminan",
            text: "Jaminan pemeliharaan akan dikembalikan setelah masa pemeliharaan berakhir dan seluruh punch list ditangani.",
          },
        ],
        opening: "Pada hari ini, telah dilakukan serah terima pekerjaan antara:",
        closing: "Demikian berita acara serah terima ini dibuat dalam rangkap 2 (dua) untuk dapat dipergunakan sebagaimana mestinya.",
      },
      createdById: adminId,
    },
  });

  console.log(`   ✅ Created BAST: ${number}`);
}

function calculatePaymentTerms(total: number) {
  const termin1 = total * 0.25;
  const termin2 = total * 0.25;
  const termin3 = total * 0.25;
  const termin4 = total * 0.25;

  return [
    {
      percent: 25,
      cumulativeValue: termin1,
      previousValue: 0,
      currentValue: termin1,
      periodEnd: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      issuedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      paidDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      status: "PAID",
    },
    {
      percent: 50,
      cumulativeValue: termin1 + termin2,
      previousValue: termin1,
      currentValue: termin2,
      periodEnd: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      issuedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      paidDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      status: "PAID",
    },
    {
      percent: 75,
      cumulativeValue: termin1 + termin2 + termin3,
      previousValue: termin1 + termin2,
      currentValue: termin3,
      periodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paidDate: null,
      status: "ISSUED",
    },
    {
      percent: 100,
      cumulativeValue: total,
      previousValue: termin1 + termin2 + termin3,
      currentValue: termin4,
      periodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      issuedDate: null,
      paidDate: null,
      status: "DRAFT",
    },
  ];
}

function calculateMonths(startDate: Date | null): number {
  if (!startDate) return 8;
  const now = new Date();
  const months = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(6, Math.min(months, 12));
}

function numberToWords(num: number): string {
  if (num >= 1_000_000_000) {
    return `${Math.floor(num / 1_000_000_000)} miliar ${numberToWords(num % 1_000_000_000)}`.trim();
  }
  if (num >= 1_000_000) {
    return `${Math.floor(num / 1_000_000)} juta ${numberToWords(num % 1_000_000)}`.trim();
  }
  if (num >= 1_000) {
    return `${Math.floor(num / 1_000)} ribu ${numberToWords(num % 1_000)}`.trim();
  }
  return `${Math.floor(num)} rupiah`;
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
