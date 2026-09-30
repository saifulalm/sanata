/**
 * seed-correspondence.ts
 *
 * Creates comprehensive ProjectLetter records for ALL RAB projects with
 * diverse statuses (DRAFT, ISSUED, SIGNED, PAID, CANCELLED).
 *
 * Letter types per RAB:
 *   SPK  - Surat Perjanjian Kerja (1-2 per RAB)
 *   INVOICE - termin billing (2-4 per RAB)
 *   KWITANSI - matching invoices
 *   BAPP - Berita Acara Penyelesaian Pekerjaan (1-2 per RAB)
 *   BAST - Berita Acara Serah Terima (for completed projects)
 *
 * Run AFTER seed.ts / seed-rab-full.ts (after all RABs exist).
 *
 * Usage:
 *   npx ts-node prisma/seed-correspondence.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function dp(n: number) {
  return new Prisma.Decimal(n);
}

async function nextSeq(series: string): Promise<number> {
  const counter = await prisma.documentCounter.upsert({
    where: { id: series + "-2026" },
    update: {},
    create: { id: series + "-2026", series, year: 2026, lastSeq: 0 },
  });
  const next = counter.lastSeq + 1;
  await prisma.documentCounter.update({
    where: { id: series + "-2026" },
    data: { lastSeq: next },
  });
  return next;
}

async function num(series: string): Promise<string> {
  const seq = await nextSeq(series);
  return series + "-2026-" + String(seq).padStart(3, "0");
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("No admin user found. Run seed.ts first.");
    process.exit(1);
  }
  const adminId = admin.id;

  const hendra = await prisma.signatory.findFirst({ where: { name: { contains: "Hendra" } } });
  const budi   = await prisma.signatory.findFirst({ where: { name: { contains: "Budi" } } });
  const rina   = await prisma.signatory.findFirst({ where: { name: { contains: "Rina" } } });

  const rabs = await prisma.rab.findMany({
    select: { id: true, number: true, title: true, clientName: true, location: true, total: true, taxPct: true, status: true },
  });
  console.log("Found " + rabs.length + " RABs for correspondence seed.");

  const rabMap: Record<string, typeof rabs[0]> = {};
  for (const r of rabs) { rabMap[r.number] = r; }

  let totalCreated = 0;

  // ================================================================
  // RAB-2026-001: Gedung Perkantoran 4 Lantai
  // Contract: Rp 5.383.500.000 | 8 months | APPROVED (active)
  // Existing: SPK-2026-001, INV-2026-001, KWIT-2026-001, BAPP-2026-001
  // Need: INV-003, KWIT-003, BAPP-002, INV-004 (ISSUED), INV-005 (DRAFT)
  // ================================================================
  if (rabMap["RAB-2026-001"]) {
    const r = rabMap["RAB-2026-001"];
    const client = r.clientName ?? "PT Nusantara Realty Indonesia";
    const hendraId = hendra?.id ?? null;

    // --- Termin 2 Invoice (PAID) ---
    const inv3num = await num("INV");
    const inv3amount = 1610500000;
    const inv3ret    = 80525000;
    const inv3tax    = Math.round((inv3amount - inv3ret) * 0.11);
    const inv3total  = inv3amount - inv3ret + inv3tax;
    await prisma.projectLetter.upsert({
      where: { number: inv3num },
      create: {
        number: inv3num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 2 - Progress 50%",
        letterDate: new Date("2026-06-15"), issuedAt: new Date("2026-06-15"),
        signedAt: new Date("2026-06-18"), paidAt: new Date("2026-06-28"),
        dueDate: new Date("2026-07-14"),
        recipientName: "Ir. Hendra Wijaya", recipientCompany: client,
        recipientAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv3amount), retentionAmount: dp(inv3ret),
        taxPct: dp(11), taxAmount: dp(inv3tax), totalAmount: dp(inv3total),
        amountInWords: "Satu miliar enam ratus sepuluh juta lima ratus ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 2 atas pekerjaan pembangunan gedung perkantoran 4 lantai.",
          lines: [
            { description: "Pekerjaan struktur kolom dan balok lantai 3", amount: 680000000 },
            { description: "Pekerjaan plat lantai 3", amount: 369600000 },
            { description: "Pekerjaan arsitektur lantai 1-2", amount: 561000000 },
          ],
          fields: { "Periode": "Mei 2026", "Pekerjaan": r.title },
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Kwitansi Termin 2 (SIGNED) ---
    const kwit3num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit3num },
      create: {
        number: kwit3num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 2",
        letterDate: new Date("2026-06-28"), issuedAt: new Date("2026-06-28"),
        signedAt: new Date("2026-06-28"),
        recipientName: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv3total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv3total),
        amountInWords: "Satu miliar enam ratus sepuluh juta lima ratus ribu rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran invoice termin 2." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAPP Termin 2 (SIGNED) ---
    const bapp2num = await num("BAPP");
    await prisma.projectLetter.upsert({
      where: { number: bapp2num },
      create: {
        number: bapp2num, rabId: r.id, type: "BAPP", status: "SIGNED",
        subject: "Berita Acara Penyelesaian Pekerjaan Termin 2",
        letterDate: new Date("2026-06-10"), issuedAt: new Date("2026-06-10"),
        signedAt: new Date("2026-06-14"),
        recipientName: "Ir. Hendra Wijaya", recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Tim Pengawas", counterSignerTitle: "Konsultan Pengawas",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada tanggal 10 Juni 2026, dilakukan pemeriksaan bersama pekerjaan konstruksi lantai 3.",
          clauses: [
            { title: "Pekerjaan Struktur Lantai 3", text: "Kolom, balok, dan plat lantai 3 telah diselesaikan pada tanggal 5 Juni 2026." },
            { title: "Hasil Pemeriksaan", text: "Pemeriksaan visual dan pengukuran dimensi sesuai spesifikasi teknis." },
            { title: "Persetujuan Pembayaran", text: "Kedua pihak menyetujui hasil pekerjaan untuk dasar pembayaran termin 2." },
          ],
          closing: "Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 3 Invoice (ISSUED) ---
    const inv4num = await num("INV");
    const inv4amount = 1340875000;
    const inv4ret    = 67043750;
    const inv4tax    = Math.round((inv4amount - inv4ret) * 0.11);
    const inv4total  = inv4amount - inv4ret + inv4tax;
    await prisma.projectLetter.upsert({
      where: { number: inv4num },
      create: {
        number: inv4num, rabId: r.id, type: "INVOICE", status: "ISSUED",
        subject: "Invoice Termin 3 - Progress 75%",
        letterDate: new Date("2026-08-15"), issuedAt: new Date("2026-08-15"),
        dueDate: new Date("2026-09-14"),
        recipientName: "Ir. Hendra Wijaya", recipientCompany: client,
        recipientAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv4amount), retentionAmount: dp(inv4ret),
        taxPct: dp(11), taxAmount: dp(inv4tax), totalAmount: dp(inv4total),
        amountInWords: "Satu miliar tiga ratus empat puluh juta delapan ratus tujuh puluh lima ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 3 atas pekerjaan pembangunan gedung perkantoran 4 lantai.",
          lines: [
            { description: "Pekerjaan arsitektur MEP lantai 3-4", amount: 1100000000 },
            { description: "Pekerjaan finishing lantai 1-2", amount: 240875000 },
          ],
          fields: { "Periode": "Juli-Agustus 2026", "Pekerjaan": r.title },
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 4 Invoice (DRAFT) ---
    const inv5num = await num("INV");
    const inv5amount = 1340875000;
    const inv5ret    = 67043750;
    const inv5tax    = Math.round((inv5amount - inv5ret) * 0.11);
    const inv5total  = inv5amount - inv5ret + inv5tax;
    await prisma.projectLetter.upsert({
      where: { number: inv5num },
      create: {
        number: inv5num, rabId: r.id, type: "INVOICE", status: "DRAFT",
        subject: "Invoice Termin 4 - Progress 100%",
        letterDate: new Date("2026-09-30"),
        dueDate: new Date("2026-10-30"),
        recipientName: "Ir. Hendra Wijaya", recipientCompany: client,
        recipientAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv5amount), retentionAmount: dp(inv5ret),
        taxPct: dp(11), taxAmount: dp(inv5tax), totalAmount: dp(inv5total),
        amountInWords: "Satu miliar tiga ratus empat puluh juta delapan ratus tujuh puluh lima ribu rupiah",
        body: {
          opening: "Bersala ini kami sampaikan tagihan termin 4 (pelunasan) atas pekerjaan pembangunan gedung perkantoran 4 lantai.",
          lines: [{ description: "Pekerjaan akhir dan serah terima", amount: inv5amount }],
          fields: { "Periode": "September 2026", "Pekerjaan": r.title },
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // RAB-2026-002: Renovasi Rumah Tinggal Pak Budi
  // Contract: Rp 849.150.000 | 3 months | APPROVED (active)
  // Existing: SPK-2026-002, INV-2026-002
  // Need: BAPP termin final, INV termin final (PAID), KWIT, BAST
  // ================================================================
  if (rabMap["RAB-2026-002"]) {
    const r = rabMap["RAB-2026-002"];
    const client = r.clientName ?? "Budi Santoso";
    const budiId = budi?.id ?? null;

    // --- BAPP Termin Final (SIGNED) ---
    const bapp3num = await num("BAPP");
    await prisma.projectLetter.upsert({
      where: { number: bapp3num },
      create: {
        number: bapp3num, rabId: r.id, type: "BAPP", status: "SIGNED",
        subject: "Berita Acara Penyelesaian Pekerjaan Termin Final",
        letterDate: new Date("2026-09-10"), issuedAt: new Date("2026-09-10"),
        signedAt: new Date("2026-09-12"),
        recipientName: "Budi Santoso",
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        counterSignerName: "Budi Santoso", counterSignerTitle: "Pemilik Rumah",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada tanggal 10 September 2026, dilakukan pemeriksaan bersama atas seluruh pekerjaan renovasi rumah tinggal.",
          clauses: [
            { title: "Pekerjaan Struktur & Pondasi", text: "Seluruh pekerjaan selesai 100% dan lulus pemeriksaan." },
            { title: "Pekerjaan Finishing", text: "Plesteran, pengecatan, lantai keramik, dan plafon gypsum selesai 100%." },
            { title: "Pekerjaan Atap & Plumbing", text: "Rangka atap, genteng, dan instalasi pipa telah selesai dan berfungsi." },
            { title: "Persetujuan", text: "Seluruh pekerjaan dinyatakan selesai dan disetujui untuk pembayaran akhir." },
          ],
          closing: "Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Invoice Termin Final (PAID) ---
    const inv3num = await num("INV");
    const inv3amount = 424575000;
    const inv3tax    = Math.round(inv3amount * 0.11);
    const inv3total  = inv3amount + inv3tax;
    await prisma.projectLetter.upsert({
      where: { number: inv3num },
      create: {
        number: inv3num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin Final - Pelunasan Renovasi",
        letterDate: new Date("2026-09-15"), issuedAt: new Date("2026-09-15"),
        paidAt: new Date("2026-09-22"),
        dueDate: new Date("2026-10-15"),
        recipientName: "Budi Santoso",
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv3amount), retentionAmount: dp(0),
        taxPct: dp(11), taxAmount: dp(inv3tax), totalAmount: dp(inv3total),
        amountInWords: "Empat ratus tujuh puluh satu juta sembilan ratus delapan puluh dua ribu lima ratus rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan pelunasan atas seluruh pekerjaan renovasi rumah tinggal.",
          lines: [{ description: "Pelunasan seluruh pekerjaan renovasi rumah", amount: inv3amount }],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Kwitansi Termin Final (SIGNED) ---
    const kwit3num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit3num },
      create: {
        number: kwit3num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pelunasan Renovasi Rumah Tinggal",
        letterDate: new Date("2026-09-22"), issuedAt: new Date("2026-09-22"),
        signedAt: new Date("2026-09-22"),
        recipientName: "Budi Santoso",
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv3total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv3total),
        amountInWords: "Empat ratus tujuh puluh satu juta sembilan ratus delapan puluh dua ribu lima ratus rupiah",
        body: { opening: "Telah terima dari Budi Santoso pembayaran pelunasan renovasi rumah." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAST (SIGNED) ---
    const bast1num = await num("BAST");
    await prisma.projectLetter.upsert({
      where: { number: bast1num },
      create: {
        number: bast1num, rabId: r.id, type: "BAST", status: "SIGNED",
        subject: "Berita Acara Serah Terima Pekerjaan Renovasi",
        letterDate: new Date("2026-09-20"), issuedAt: new Date("2026-09-20"),
        signedAt: new Date("2026-09-22"),
        recipientName: "Budi Santoso",
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        counterSignerName: "Budi Santoso", counterSignerTitle: "Pemilik Rumah",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada hari ini, tanggal dua puluh September dua ribu dua puluh enam, telah dilakukan serah terima pekerjaan renovasi rumah tinggal.",
          clauses: [
            { title: "Pekerjaan yang Diserahkan", text: "Seluruh pekerjaan renovasi rumah tinggal telah selesai 100% sesuai kontrak." },
            { title: "Kondisi Pekerjaan", text: "Hasil pekerjaan dalam kondisi baik dan sesuai spesifikasi teknis." },
            { title: "Masa Pemeliharaan", text: "Masa pemeliharaan berlaku selama 12 bulan sejak tanggal serah terima ini." },
          ],
          closing: "Demikian berita acara serah terima ini dibuat dalam rangkap 2 dan memiliki kekuatan hukum yang sama.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // RAB-2026-003: Pabrik Kawasan Industri MM2100
  // Contract: Rp 17.205.000.000 | DRAFT (bidding stage)
  // Only draft-level correspondence — no real invoices yet
  // ================================================================
  if (rabMap["RAB-2026-003"]) {
    const r = rabMap["RAB-2026-003"];
    const client = r.clientName ?? "PT Industrial Manufacturing Indonesia";
    const hendraId = hendra?.id ?? null;

    // --- SPK Draft (DRAFT) ---
    const spk3num = await num("SPK");
    await prisma.projectLetter.upsert({
      where: { number: spk3num },
      create: {
        number: spk3num, rabId: r.id, type: "SPK", status: "DRAFT",
        subject: "Surat Perjanjian Kerja Pembangunan Pabrik MM2100",
        letterDate: new Date("2026-09-01"),
        recipientName: "Direksi PT Industrial Manufacturing Indonesia",
        recipientCompany: client,
        recipientAddress: "Kawasan Industri MM2100, Cikarang Barat, Bekasi",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Direksi PT Industrial Manufacturing Indonesia",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(Number(r.total)),
        retentionAmount: dp(0),
        taxPct: dp(Number(r.taxPct)),
        taxAmount: dp(Math.round(Number(r.total) * Number(r.taxPct) / 111)),
        totalAmount: dp(Number(r.total)),
        amountInWords: "Tujuh belas miliar dua ratus lima juta rupiah",
        body: {
          opening: "Pada hari ini telah dijalin perjanjian kerja antara PT Sanata Construction dan PT Industrial Manufacturing Indonesia.",
          clauses: [
            { title: "Pasal 1 - Lingkup Pekerjaan", text: "Kontraktor melaksanakan pekerjaan pembangunan pabrik sesuai gambar kerja dan spesifikasi teknis." },
            { title: "Pasal 2 - Nilai Kontrak", text: "Nilai kontrak adalah Rp 17.205.000.000 termasuk PPN 11%." },
            { title: "Pasal 3 - Jadwal Pelaksanaan", text: "Jadwal pelaksanaan pekerjaan adalah 10 (sepuluh) bulan kalender terhitung sejak tanggal mulai kerja." },
            { title: "Pasal 4 - Sistem Pembayaran", text: "Pembayaran dilakukan secara termin 5x: uang muka 20%, termin 1-3 masing-masing 20%, dan serah terima 20%." },
            { title: "Pasal 5 - Garansi", text: "Kontraktor memberikan garansi struktur selama 10 tahun dan garansi finishing selama 2 tahun." },
          ],
          closing: "Demikian perjanjian ini dibuat dalam rangkap 2 dan memiliki kekuatan hukum yang sama.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Invoice Draftermin 1 (DRAFT) ---
    const inv4num = await num("INV");
    const inv4amount = 3441000000;
    const inv4tax    = Math.round(inv4amount * 0.11);
    const inv4total  = inv4amount + inv4tax;
    await prisma.projectLetter.upsert({
      where: { number: inv4num },
      create: {
        number: inv4num, rabId: r.id, type: "INVOICE", status: "DRAFT",
        subject: "Invoice Termin 1 - Progress 20%",
        letterDate: new Date("2026-10-31"),
        dueDate: new Date("2026-11-14"),
        recipientName: "Direksi PT Industrial Manufacturing Indonesia",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv4amount), retentionAmount: dp(0),
        taxPct: dp(11), taxAmount: dp(inv4tax), totalAmount: dp(inv4total),
        amountInWords: "Tiga miliar delapan ratus十九 juta lima ratus ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 1 atas pekerjaan pembangunan pabrik MM2100.",
          lines: [
            { description: "Pekerjaan persiapan dan fondasi", amount: inv4amount },
          ],
          fields: { "Periode": "Oktober 2026", "Pekerjaan": r.title },
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // RAB-2026-004: Renovasi Total Kantor PT Cerdas Digital
  // Contract: Rp 3.068.595.000 | REVIEW (awaiting client approval)
  // SPK ISSUED (waiting sign), Invoice DRAFT
  // ================================================================
  if (rabMap["RAB-2026-004"]) {
    const r = rabMap["RAB-2026-004"];
    const client = r.clientName ?? "PT Cerdas Digital Indonesia";
    const hendraId = hendra?.id ?? null;

    // --- SPK ISSUED (waiting client signature) ---
    const spk4num = await num("SPK");
    await prisma.projectLetter.upsert({
      where: { number: spk4num },
      create: {
        number: spk4num, rabId: r.id, type: "SPK", status: "ISSUED",
        subject: "Surat Perjanjian Kerja Renovasi Total Kantor PT Cerdas Digital",
        letterDate: new Date("2026-08-20"), issuedAt: new Date("2026-08-20"),
        recipientName: "Direksi PT Cerdas Digital Indonesia",
        recipientCompany: client,
        recipientAddress: "Jl. Gatot Subroto Kav. 18, Jakarta Selatan",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Direksi PT Cerdas Digital Indonesia",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(Number(r.total)),
        retentionAmount: dp(0),
        taxPct: dp(Number(r.taxPct)),
        taxAmount: dp(Math.round(Number(r.total) * Number(r.taxPct) / 111)),
        totalAmount: dp(Number(r.total)),
        amountInWords: "Tiga miliar enam puluh delapan juta lima ratus sembilan puluh lima ribu rupiah",
        body: {
          opening: "Pada hari ini telah dijalin perjanjian kerja antara PT Sanata Construction dan PT Cerdas Digital Indonesia.",
          clauses: [
            { title: "Pasal 1 - Lingkup Pekerjaan", text: "Kontraktor melaksanakan pekerjaan renovasi total kantor sesuai gambar kerja." },
            { title: "Pasal 2 - Nilai Kontrak", text: "Nilai kontrak adalah Rp 3.068.595.000 termasuk PPN 11%." },
            { title: "Pasal 3 - Jadwal Pelaksanaan", text: "Jadwal pelaksanaan pekerjaan adalah 6 (enam) bulan kalender." },
            { title: "Pasal 4 - Sistem Pembayaran", text: "Pembayaran dilakukan 3 termin: uang muka 40%, progress 70% dan serah terima." },
            { title: "Pasal 5 - Garansi", text: "Kontraktor memberikan garansi selama 2 tahun." },
          ],
          closing: "Demikian perjanjian ini dibuat dalam rangkap 2 dan memiliki kekuatan hukum yang sama.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Invoice Termin 1 (DRAFT) ---
    const inv5num = await num("INV");
    const inv5amount = 1227438000;
    const inv5tax    = Math.round(inv5amount * 0.11);
    const inv5total  = inv5amount + inv5tax;
    await prisma.projectLetter.upsert({
      where: { number: inv5num },
      create: {
        number: inv5num, rabId: r.id, type: "INVOICE", status: "DRAFT",
        subject: "Invoice Termin 1 - Uang Muka 40%",
        letterDate: new Date("2026-09-30"),
        dueDate: new Date("2026-10-14"),
        recipientName: "PT Cerdas Digital Indonesia",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv5amount), retentionAmount: dp(0),
        taxPct: dp(11), taxAmount: dp(inv5tax), totalAmount: dp(inv5total),
        amountInWords: "Satu miliar tiga ratus satu juta delapan ratus empat puluh satu ribu delapan ratus rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan uang muka atas pekerjaan renovasi total kantor PT Cerdas Digital.",
          lines: [{ description: "Uang muka 40%", amount: inv5amount }],
          fields: { "Periode": "September 2026", "Pekerjaan": r.title },
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // RAB-2026-005: Pembangunan Showroom Otomotif 3 Lantai
  // Contract: Rp 9.102.000.000 | REJECTED (client budget exceeded)
  // SPK and Invoice CANCELLED
  // ================================================================
  if (rabMap["RAB-2026-005"]) {
    const r = rabMap["RAB-2026-005"];
    const client = r.clientName ?? "PT Auto Galeri Indonesia";
    const hendraId = hendra?.id ?? null;

    // --- SPK CANCELLED ---
    const spk5num = await num("SPK");
    await prisma.projectLetter.upsert({
      where: { number: spk5num },
      create: {
        number: spk5num, rabId: r.id, type: "SPK", status: "CANCELLED",
        subject: "Surat Perjanjian Kerja Pembangunan Showroom Otomotif",
        letterDate: new Date("2026-07-05"), issuedAt: new Date("2026-07-05"),
        recipientName: "Direksi PT Auto Galeri Indonesia",
        recipientCompany: client,
        recipientAddress: "Jl. Ahmad Yani No. 88, Bandung",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Direksi PT Auto Galeri Indonesia",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(Number(r.total)),
        retentionAmount: dp(0),
        taxPct: dp(Number(r.taxPct)),
        taxAmount: dp(Math.round(Number(r.total) * Number(r.taxPct) / 111)),
        totalAmount: dp(Number(r.total)),
        amountInWords: "Sembilan miliar seratus dua juta rupiah",
        body: {
          opening: "Pada hari ini telah dijalin perjanjian kerja antara PT Sanata Construction dan PT Auto Galeri Indonesia.",
          clauses: [
            { title: "Pasal 1 - Lingkup Pekerjaan", text: "Kontraktor melaksanakan pekerjaan pembangunan showroom 3 lantai sesuai gambar kerja." },
            { title: "Pasal 2 - Nilai Kontrak", text: "Nilai kontrak adalah Rp 9.102.000.000 termasuk PPN 11%." },
            { title: "Pasal 3 - Jadwal Pelaksanaan", text: "Jadwal pelaksanaan adalah 9 bulan kalender." },
            { title: "Pasal 4 - Sistem Pembayaran", text: "Pembayaran dilakukan secara termin 4x." },
            { title: "Pasal 5 - Garansi", text: "Kontraktor memberikan garansi 2 tahun." },
          ],
          closing: "Demikian perjanjian ini dibuat dalam rangkap 2.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Invoice CANCELLED ---
    const inv6num = await num("INV");
    const inv6amount = 1820400000;
    const inv6tax    = Math.round(inv6amount * 0.11);
    const inv6total  = inv6amount + inv6tax;
    await prisma.projectLetter.upsert({
      where: { number: inv6num },
      create: {
        number: inv6num, rabId: r.id, type: "INVOICE", status: "CANCELLED",
        subject: "Invoice Termin 1 - Progress 20% (DIBATALKAN)",
        letterDate: new Date("2026-07-10"), issuedAt: new Date("2026-07-10"),
        dueDate: new Date("2026-07-24"),
        recipientName: "PT Auto Galeri Indonesia",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv6amount), retentionAmount: dp(0),
        taxPct: dp(11), taxAmount: dp(inv6tax), totalAmount: dp(inv6total),
        amountInWords: "Dua miliar enam belas ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 1 atas pembangunan showroom (DIBATALKAN - RAB ditolak klien).",
          lines: [{ description: "Uang muka 20% pembangunan showroom", amount: inv6amount }],
          notes: "Surat ini dibatalkan karena RAB ditolak klien karena nilai melebihi budget.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // RAB-2026-006: Gudang Logistik 2.000 m2 (ARCHIVED)
  // Contract: Rp 4.662.000.000 | 7 months | Completed 2024
  // Full cycle: SPK + 4 termin INVOICE + KWIT + BAPP + BAST
  // ================================================================
  if (rabMap["RAB-2026-006"]) {
    const r = rabMap["RAB-2026-006"];
    const client = r.clientName ?? "PT Logistik Nusantara Express";
    const budiId = budi?.id ?? null;
    const hendraId = hendra?.id ?? null;

    // --- SPK (SIGNED) ---
    const spk6num = await num("SPK");
    await prisma.projectLetter.upsert({
      where: { number: spk6num },
      create: {
        number: spk6num, rabId: r.id, type: "SPK", status: "SIGNED",
        subject: "Surat Perjanjian Kerja Pembangunan Gudang Logistik 2.000 m2",
        letterDate: new Date("2024-04-01"), issuedAt: new Date("2024-04-01"),
        signedAt: new Date("2024-04-03"),
        recipientName: "Direksi PT Logistik Nusantara Express",
        recipientCompany: client,
        recipientAddress: "Kawasan Pergudangan Deltamas, Cikarang",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Direksi PT Logistik Nusantara Express",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(Number(r.total)),
        retentionAmount: dp(0),
        taxPct: dp(Number(r.taxPct)),
        taxAmount: dp(Math.round(Number(r.total) * Number(r.taxPct) / 111)),
        totalAmount: dp(Number(r.total)),
        amountInWords: "Empat miliar enam ratus enam puluh dua juta rupiah",
        body: {
          opening: "Pada hari ini telah dijalin perjanjian kerja antara PT Sanata Construction dan PT Logistik Nusantara Express.",
          clauses: [
            { title: "Pasal 1 - Lingkup Pekerjaan", text: "Kontraktor melaksanakan pembangunan gudang logistik 2.000 m2 sesuai spesifikasi." },
            { title: "Pasal 2 - Nilai Kontrak", text: "Nilai kontrak adalah Rp 4.662.000.000 termasuk PPN 11%." },
            { title: "Pasal 3 - Jadwal Pelaksanaan", text: "Jadwal pelaksanaan adalah 7 bulan kalender." },
            { title: "Pasal 4 - Sistem Pembayaran", text: "Pembayaran dilakukan 4 termin: uang muka 25%, termin 1-2 masing-masing 25%, dan serah terima 25%." },
            { title: "Pasal 5 - Garansi", text: "Kontraktor memberikan garansi struktur 10 tahun dan finishing 2 tahun." },
          ],
          closing: "Demikian perjanjian ini dibuat dalam rangkap 2.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 1 Invoice (PAID) ---
    const inv7num = await num("INV");
    const inv7amount = 1165500000;
    const inv7ret    = 58275000;
    const inv7tax    = Math.round((inv7amount - inv7ret) * 0.11);
    const inv7total  = inv7amount - inv7ret + inv7tax;
    await prisma.projectLetter.upsert({
      where: { number: inv7num },
      create: {
        number: inv7num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 1 - Progress 25%",
        letterDate: new Date("2024-05-31"), issuedAt: new Date("2024-05-31"),
        paidAt: new Date("2024-06-10"),
        dueDate: new Date("2024-06-14"),
        recipientName: "PT Logistik Nusantara Express",
        recipientCompany: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv7amount), retentionAmount: dp(inv7ret),
        taxPct: dp(11), taxAmount: dp(inv7tax), totalAmount: dp(inv7total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 1 atas pembangunan gudang logistik.",
          lines: [{ description: "Pekerjaan fondasi dan struktur gudang", amount: inv7amount }],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 1 Kwitansi (SIGNED) ---
    const kwit4num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit4num },
      create: {
        number: kwit4num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 1 Gudang",
        letterDate: new Date("2024-06-10"), issuedAt: new Date("2024-06-10"),
        signedAt: new Date("2024-06-10"),
        recipientName: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv7total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv7total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 1 pembangunan gudang." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 2 Invoice (PAID) ---
    const inv8num = await num("INV");
    const inv8amount = 1165500000;
    const inv8ret    = 58275000;
    const inv8tax    = Math.round((inv8amount - inv8ret) * 0.11);
    const inv8total  = inv8amount - inv8ret + inv8tax;
    await prisma.projectLetter.upsert({
      where: { number: inv8num },
      create: {
        number: inv8num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 2 - Progress 50%",
        letterDate: new Date("2024-07-31"), issuedAt: new Date("2024-07-31"),
        paidAt: new Date("2024-08-12"),
        dueDate: new Date("2024-08-14"),
        recipientName: "PT Logistik Nusantara Express",
        recipientCompany: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv8amount), retentionAmount: dp(inv8ret),
        taxPct: dp(11), taxAmount: dp(inv8tax), totalAmount: dp(inv8total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 2 atas pembangunan gudang logistik.",
          lines: [{ description: "Pekerjaan struktur baja dan atap", amount: inv8amount }],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 2 Kwitansi (SIGNED) ---
    const kwit5num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit5num },
      create: {
        number: kwit5num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 2 Gudang",
        letterDate: new Date("2024-08-12"), issuedAt: new Date("2024-08-12"),
        signedAt: new Date("2024-08-12"),
        recipientName: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv8total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv8total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 2 pembangunan gudang." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAPP Penyelesaian Progress 75% (SIGNED) ---
    const bapp4num = await num("BAPP");
    await prisma.projectLetter.upsert({
      where: { number: bapp4num },
      create: {
        number: bapp4num, rabId: r.id, type: "BAPP", status: "SIGNED",
        subject: "Berita Acara Penyelesaian Pekerjaan Termin 2 Gudang",
        letterDate: new Date("2024-07-28"), issuedAt: new Date("2024-07-28"),
        signedAt: new Date("2024-08-01"),
        recipientName: "PT Logistik Nusantara Express",
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        counterSignerName: "Tim Pengawas PT Logistik", counterSignerTitle: "Konsultan Pengawas",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada tanggal 28 Juli 2024, dilakukan pemeriksaan bersama atas pekerjaan pembangunan gudang.",
          clauses: [
            { title: "Pekerjaan Fondasi & Struktur", text: "Seluruh fondasi, kolom, dan balok gudang telah selesai 100%." },
            { title: "Pekerjaan Atap & Dinding", text: "Rangka atap baja dan dinding gudang telah selesai 100%." },
            { title: "Persetujuan Pembayaran", text: "Kedua pihak menyetujui hasil pekerjaan untuk dasar pembayaran termin 2." },
          ],
          closing: "Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 3 Invoice (PAID) ---
    const inv9num = await num("INV");
    const inv9amount = 1165500000;
    const inv9ret    = 58275000;
    const inv9tax    = Math.round((inv9amount - inv9ret) * 0.11);
    const inv9total  = inv9amount - inv9ret + inv9tax;
    await prisma.projectLetter.upsert({
      where: { number: inv9num },
      create: {
        number: inv9num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 3 - Progress 75%",
        letterDate: new Date("2024-09-30"), issuedAt: new Date("2024-09-30"),
        paidAt: new Date("2024-10-10"),
        dueDate: new Date("2024-10-14"),
        recipientName: "PT Logistik Nusantara Express",
        recipientCompany: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv9amount), retentionAmount: dp(inv9ret),
        taxPct: dp(11), taxAmount: dp(inv9tax), totalAmount: dp(inv9total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 3 atas pembangunan gudang logistik.",
          lines: [{ description: "Pekerjaan arsitektur dan MEP gudang", amount: inv9amount }],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 3 Kwitansi (SIGNED) ---
    const kwit6num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit6num },
      create: {
        number: kwit6num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 3 Gudang",
        letterDate: new Date("2024-10-10"), issuedAt: new Date("2024-10-10"),
        signedAt: new Date("2024-10-10"),
        recipientName: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv9total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv9total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 3 pembangunan gudang." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 4 Invoice (PAID) ---
    const inv10num = await num("INV");
    const inv10amount = 1165500000;
    const inv10ret    = 58275000;
    const inv10tax    = Math.round((inv10amount - inv10ret) * 0.11);
    const inv10total  = inv10amount - inv10ret + inv10tax;
    await prisma.projectLetter.upsert({
      where: { number: inv10num },
      create: {
        number: inv10num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 4 - Progress 100%",
        letterDate: new Date("2024-10-31"), issuedAt: new Date("2024-10-31"),
        paidAt: new Date("2024-11-08"),
        dueDate: new Date("2024-11-14"),
        recipientName: "PT Logistik Nusantara Express",
        recipientCompany: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv10amount), retentionAmount: dp(inv10ret),
        taxPct: dp(11), taxAmount: dp(inv10tax), totalAmount: dp(inv10total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan pelunasan atas pembangunan gudang logistik.",
          lines: [{ description: "Pelunasan dan retensi 5%", amount: inv10amount }],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 4 Kwitansi (SIGNED) ---
    const kwit7num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit7num },
      create: {
        number: kwit7num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pelunasan Pembangunan Gudang",
        letterDate: new Date("2024-11-08"), issuedAt: new Date("2024-11-08"),
        signedAt: new Date("2024-11-08"),
        recipientName: client,
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        amount: dp(inv10total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv10total),
        amountInWords: "Satu miliar seratus tiga belas juta rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran pelunasan pembangunan gudang." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAST Final (SIGNED) ---
    const bast2num = await num("BAST");
    await prisma.projectLetter.upsert({
      where: { number: bast2num },
      create: {
        number: bast2num, rabId: r.id, type: "BAST", status: "SIGNED",
        subject: "Berita Acara Serah Terima Pekerjaan Gudang Logistik",
        letterDate: new Date("2024-11-01"), issuedAt: new Date("2024-11-01"),
        signedAt: new Date("2024-11-05"),
        recipientName: "PT Logistik Nusantara Express",
        signerName: "Ir. Budi Santoso", signerTitle: "Directeur Operasional",
        signatoryId: budiId,
        counterSignerName: "Direksi PT Logistik Nusantara Express",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada hari ini, tanggal satu November dua ribu dua puluh empat, telah dilakukan serah terima pekerjaan pembangunan gudang logistik.",
          clauses: [
            { title: "Pekerjaan yang Diserahkan", text: "Seluruh pekerjaan pembangunan gudang logistik 2.000 m2 telah selesai 100%." },
            { title: "Kondisi Pekerjaan", text: "Hasil pekerjaan dalam kondisi baik dan sesuai spesifikasi teknis." },
            { title: "Masa Pemeliharaan", text: "Masa pemeliharaan berlaku selama 12 bulan sejak tanggal serah terima." },
          ],
          closing: "Demikian berita acara serah terima ini dibuat dalam rangkap 2 dan memiliki kekuatan hukum yang sama.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // RAB-2026-007: Konstruksi Rumah Sakit Tipe B 5 Lantai (ARCHIVED)
  // Contract: Rp 52.758.300.000 | 18 months | Completed Nov 2024
  // Full billing cycle: SPK + 4 termin INVOICE + KWIT + BAPP + BAST
  // Complex hospital project with many billing periods
  // ================================================================
  if (rabMap["RAB-2026-007"]) {
    const r = rabMap["RAB-2026-007"];
    const client = r.clientName ?? "PT Rumah Sakit Cahaya Sehat";
    const hendraId = hendra?.id ?? null;
    const budiId = budi?.id ?? null;
    const rinaId = rina?.id ?? null;

    // --- SPK (SIGNED) ---
    const spk7num = await num("SPK");
    await prisma.projectLetter.upsert({
      where: { number: spk7num },
      create: {
        number: spk7num, rabId: r.id, type: "SPK", status: "SIGNED",
        subject: "Surat Perjanjian Kerja Konstruksi Rumah Sakit Tipe B 5 Lantai",
        letterDate: new Date("2023-07-01"), issuedAt: new Date("2023-07-01"),
        signedAt: new Date("2023-07-03"),
        recipientName: "Direksi PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        recipientAddress: "Jl. Rumah Sakit No. 1, Tangerang",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Direksi PT Rumah Sakit Cahaya Sehat",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(Number(r.total)),
        retentionAmount: dp(0),
        taxPct: dp(Number(r.taxPct)),
        taxAmount: dp(Math.round(Number(r.total) * Number(r.taxPct) / 111)),
        totalAmount: dp(Number(r.total)),
        amountInWords: "Lima puluh dua miliar tujuh ratus lima puluh delapan juta tiga ratus ribu rupiah",
        body: {
          opening: "Pada hari ini telah dijalin perjanjian kerja antara PT Sanata Construction dan PT Rumah Sakit Cahaya Sehat.",
          clauses: [
            { title: "Pasal 1 - Lingkup Pekerjaan", text: "Kontraktor melaksanakan pekerjaan konstruksi rumah sakit tipe B 5 lantai sesuai gambar kerja dan spesifikasi." },
            { title: "Pasal 2 - Nilai Kontrak", text: "Nilai kontrak adalah Rp 52.758.300.000 termasuk PPN 11%." },
            { title: "Pasal 3 - Jadwal Pelaksanaan", text: "Jadwal pelaksanaan adalah 18 (delapan belas) bulan kalender." },
            { title: "Pasal 4 - Sistem Pembayaran", text: "Pembayaran dilakukan 8 termin: uang muka 10%, termin 1-6 masing-masing 12%, dan serah terima 10%." },
            { title: "Pasal 5 - Garansi", text: "Kontraktor memberikan garansi struktur 10 tahun dan finishing 2 tahun." },
          ],
          closing: "Demikian perjanjian ini dibuat dalam rangkap 2 dan memiliki kekuatan hukum yang sama.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 1 Invoice (PAID) ---
    const inv11num = await num("INV");
    const inv11amount = 5275830000;
    const inv11ret    = 263791500;
    const inv11tax    = Math.round((inv11amount - inv11ret) * 0.11);
    const inv11total  = inv11amount - inv11ret + inv11tax;
    await prisma.projectLetter.upsert({
      where: { number: inv11num },
      create: {
        number: inv11num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 1 - Progress 10%",
        letterDate: new Date("2023-09-30"), issuedAt: new Date("2023-09-30"),
        paidAt: new Date("2023-10-12"),
        dueDate: new Date("2023-10-14"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv11amount), retentionAmount: dp(inv11ret),
        taxPct: dp(11), taxAmount: dp(inv11tax), totalAmount: dp(inv11total),
        amountInWords: "Lima miliar dua ratus tujuh puluh lima juta delapan ratus tiga puluh ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 1 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "Pondasi bored pile dan pilecap", amount: 2800000000 },
            { description: "Pekerjaan persiapan dan bouwplank", amount: 2475830000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 1 Kwitansi (SIGNED) ---
    const kwit8num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit8num },
      create: {
        number: kwit8num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 1 RS Cahaya Sehat",
        letterDate: new Date("2023-10-12"), issuedAt: new Date("2023-10-12"),
        signedAt: new Date("2023-10-12"),
        recipientName: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv11total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv11total),
        amountInWords: "Lima miliar dua ratus tujuh puluh lima juta delapan ratus tiga puluh ribu rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 1 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAPP Termin 1 (SIGNED) ---
    const bapp5num = await num("BAPP");
    await prisma.projectLetter.upsert({
      where: { number: bapp5num },
      create: {
        number: bapp5num, rabId: r.id, type: "BAPP", status: "SIGNED",
        subject: "Berita Acara Penyelesaian Pekerjaan Termin 1 RS",
        letterDate: new Date("2023-09-28"), issuedAt: new Date("2023-09-28"),
        signedAt: new Date("2023-10-01"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        counterSignerName: "Tim Pengawas RS", counterSignerTitle: "Konsultan Pengawas",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada tanggal 28 September 2023, dilakukan pemeriksaan bersama atas pekerjaan fondasi rumah sakit.",
          clauses: [
            { title: "Pondasi Bored Pile", text: "320 meter bored pile D800 telah selesai dan lulus pile integrity test." },
            { title: "Pilecap dan Tie Beam", text: "Seluruh pilecap dan tie beam telah selesai 100%." },
            { title: "Persetujuan", text: "Hasil pemeriksaan disetujui untuk dasar pembayaran termin 1." },
          ],
          closing: "Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 2 Invoice (PAID) ---
    const inv12num = await num("INV");
    const inv12amount = 6330996000;
    const inv12ret    = 316549800;
    const inv12tax    = Math.round((inv12amount - inv12ret) * 0.11);
    const inv12total  = inv12amount - inv12ret + inv12tax;
    await prisma.projectLetter.upsert({
      where: { number: inv12num },
      create: {
        number: inv12num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 2 - Progress 22%",
        letterDate: new Date("2023-12-31"), issuedAt: new Date("2023-12-31"),
        paidAt: new Date("2024-01-15"),
        dueDate: new Date("2024-01-14"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        amount: dp(inv12amount), retentionAmount: dp(inv12ret),
        taxPct: dp(11), taxAmount: dp(inv12tax), totalAmount: dp(inv12total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 2 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "Struktur kolom dan balok lantai 1-2", amount: 3800000000 },
            { description: "Plat lantai 1 dan 2", amount: 2530996000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 2 Kwitansi (SIGNED) ---
    const kwit9num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit9num },
      create: {
        number: kwit9num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 2 RS Cahaya Sehat",
        letterDate: new Date("2024-01-15"), issuedAt: new Date("2024-01-15"),
        signedAt: new Date("2024-01-15"),
        recipientName: client,
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        amount: dp(inv12total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv12total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 2 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 3 Invoice (PAID) ---
    const inv13num = await num("INV");
    const inv13amount = 6330996000;
    const inv13ret    = 316549800;
    const inv13tax    = Math.round((inv13amount - inv13ret) * 0.11);
    const inv13total  = inv13amount - inv13ret + inv13tax;
    await prisma.projectLetter.upsert({
      where: { number: inv13num },
      create: {
        number: inv13num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 3 - Progress 34%",
        letterDate: new Date("2024-03-31"), issuedAt: new Date("2024-03-31"),
        paidAt: new Date("2024-04-12"),
        dueDate: new Date("2024-04-14"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        amount: dp(inv13amount), retentionAmount: dp(inv13ret),
        taxPct: dp(11), taxAmount: dp(inv13tax), totalAmount: dp(inv13total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 3 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "Struktur kolom dan balok lantai 3-4", amount: 3800000000 },
            { description: "Plat lantai 3 dan 4", amount: 2530996000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 3 Kwitansi (SIGNED) ---
    const kwit10num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit10num },
      create: {
        number: kwit10num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 3 RS Cahaya Sehat",
        letterDate: new Date("2024-04-12"), issuedAt: new Date("2024-04-12"),
        signedAt: new Date("2024-04-12"),
        recipientName: client,
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        amount: dp(inv13total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv13total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 3 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 4 Invoice (PAID) ---
    const inv14num = await num("INV");
    const inv14amount = 6330996000;
    const inv14ret    = 316549800;
    const inv14tax    = Math.round((inv14amount - inv14ret) * 0.11);
    const inv14total  = inv14amount - inv14ret + inv14tax;
    await prisma.projectLetter.upsert({
      where: { number: inv14num },
      create: {
        number: inv14num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 4 - Progress 46%",
        letterDate: new Date("2024-06-30"), issuedAt: new Date("2024-06-30"),
        paidAt: new Date("2024-07-15"),
        dueDate: new Date("2024-07-14"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        amount: dp(inv14amount), retentionAmount: dp(inv14ret),
        taxPct: dp(11), taxAmount: dp(inv14tax), totalAmount: dp(inv14total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 4 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "Struktur lantai 5 dan atap", amount: 3800000000 },
            { description: "Arsitektur lantai 1-3", amount: 2530996000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 4 Kwitansi (SIGNED) ---
    const kwit11num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit11num },
      create: {
        number: kwit11num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 4 RS Cahaya Sehat",
        letterDate: new Date("2024-07-15"), issuedAt: new Date("2024-07-15"),
        signedAt: new Date("2024-07-15"),
        recipientName: client,
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        amount: dp(inv14total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv14total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 4 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAPP Termin 3-4 (SIGNED) ---
    const bapp6num = await num("BAPP");
    await prisma.projectLetter.upsert({
      where: { number: bapp6num },
      create: {
        number: bapp6num, rabId: r.id, type: "BAPP", status: "SIGNED",
        subject: "Berita Acara Penyelesaian Pekerjaan Termin 3-4 RS",
        letterDate: new Date("2024-06-28"), issuedAt: new Date("2024-06-28"),
        signedAt: new Date("2024-07-01"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        signerName: "Dr. Rina Hartati", signerTitle: "Manager Proyek",
        signatoryId: rinaId,
        counterSignerName: "Tim Pengawas RS", counterSignerTitle: "Konsultan Pengawas",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada tanggal 28 Juni 2024, dilakukan pemeriksaan bersama atas pekerjaan struktur dan arsitektur rumah sakit.",
          clauses: [
            { title: "Struktur Lantai 5 dan Atap", text: "Seluruh struktur lantai 5 dan atap telah selesai 100%." },
            { title: "Arsitektur Lantai 1-3", text: "Pekerjaan arsitektur lantai 1-3 telah selesai dan lulus pemeriksaan." },
            { title: "MEP Lantai 1-2", text: "Instalasi MEP lantai 1-2 telah terpasang dan berfungsi." },
            { title: "Persetujuan", text: "Hasil pemeriksaan disetujui untuk dasar pembayaran termin 3-4." },
          ],
          closing: "Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 5 Invoice (PAID) ---
    const inv15num = await num("INV");
    const inv15amount = 10551660000;
    const inv15ret    = 527583000;
    const inv15tax    = Math.round((inv15amount - inv15ret) * 0.11);
    const inv15total  = inv15amount - inv15ret + inv15tax;
    await prisma.projectLetter.upsert({
      where: { number: inv15num },
      create: {
        number: inv15num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 5 - Progress 66%",
        letterDate: new Date("2024-09-30"), issuedAt: new Date("2024-09-30"),
        paidAt: new Date("2024-10-15"),
        dueDate: new Date("2024-10-14"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv15amount), retentionAmount: dp(inv15ret),
        taxPct: dp(11), taxAmount: dp(inv15tax), totalAmount: dp(inv15total),
        amountInWords: "Sepuluh miliar lima ratus lima puluh satu juta enam ratus enam puluh ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 5 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "MEP lantai 3-5 dan OT", amount: 7500000000 },
            { description: "Arsitektur lantai 4-5", amount: 3051660000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 5 Kwitansi (SIGNED) ---
    const kwit12num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit12num },
      create: {
        number: kwit12num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 5 RS Cahaya Sehat",
        letterDate: new Date("2024-10-15"), issuedAt: new Date("2024-10-15"),
        signedAt: new Date("2024-10-15"),
        recipientName: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv15total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv15total),
        amountInWords: "Sepuluh miliar lima ratus lima puluh satu juta enam ratus enam puluh ribu rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 5 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 6 Invoice (PAID) ---
    const inv16num = await num("INV");
    const inv16amount = 10551660000;
    const inv16ret    = 527583000;
    const inv16tax    = Math.round((inv16amount - inv16ret) * 0.11);
    const inv16total  = inv16amount - inv16ret + inv16tax;
    await prisma.projectLetter.upsert({
      where: { number: inv16num },
      create: {
        number: inv16num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 6 - Progress 86%",
        letterDate: new Date("2024-10-31"), issuedAt: new Date("2024-10-31"),
        paidAt: new Date("2024-11-10"),
        dueDate: new Date("2024-11-14"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv16amount), retentionAmount: dp(inv16ret),
        taxPct: dp(11), taxAmount: dp(inv16tax), totalAmount: dp(inv16total),
        amountInWords: "Sepuluh miliar lima ratus lima puluh satu juta enam ratus enam puluh ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 6 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "OT fit-out dan furniture", amount: 6000000000 },
            { description: "Testing dan commissioning", amount: 4551660000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 6 Kwitansi (SIGNED) ---
    const kwit13num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit13num },
      create: {
        number: kwit13num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 6 RS Cahaya Sehat",
        letterDate: new Date("2024-11-10"), issuedAt: new Date("2024-11-10"),
        signedAt: new Date("2024-11-10"),
        recipientName: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv16total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv16total),
        amountInWords: "Sepuluh miliar lima ratus lima puluh satu juta enam ratus enam puluh ribu rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 6 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 7 Invoice (PAID) ---
    const inv17num = await num("INV");
    const inv17amount = 6330996000;
    const inv17ret    = 316549800;
    const inv17tax    = Math.round((inv17amount - inv17ret) * 0.11);
    const inv17total  = inv17amount - inv17ret + inv17tax;
    await prisma.projectLetter.upsert({
      where: { number: inv17num },
      create: {
        number: inv17num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Termin 7 - Progress 98%",
        letterDate: new Date("2024-11-15"), issuedAt: new Date("2024-11-15"),
        paidAt: new Date("2024-11-25"),
        dueDate: new Date("2024-11-29"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv17amount), retentionAmount: dp(inv17ret),
        taxPct: dp(11), taxAmount: dp(inv17tax), totalAmount: dp(inv17total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: {
          opening: "Bersama ini kami sampaikan tagihan termin 7 atas pekerjaan konstruksi rumah sakit.",
          lines: [
            { description: "Finishing akhir dan snag list", amount: 3500000000 },
            { description: "Landscaping dan exterior", amount: 2830996000 },
          ],
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Termin 7 Kwitansi (SIGNED) ---
    const kwit14num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit14num },
      create: {
        number: kwit14num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pembayaran Termin 7 RS Cahaya Sehat",
        letterDate: new Date("2024-11-25"), issuedAt: new Date("2024-11-25"),
        signedAt: new Date("2024-11-25"),
        recipientName: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv17total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv17total),
        amountInWords: "Enam miliar tiga ratus tiga puluh juta sembilan ratus sembilan ribu enam ratus rupiah",
        body: { opening: "Telah terima dari " + client + " pembayaran termin 7 konstruksi rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- BAST Final (SIGNED) ---
    const bast3num = await num("BAST");
    await prisma.projectLetter.upsert({
      where: { number: bast3num },
      create: {
        number: bast3num, rabId: r.id, type: "BAST", status: "SIGNED",
        subject: "Berita Acara Serah Terima Pekerjaan Konstruksi RS Tipe B",
        letterDate: new Date("2024-11-15"), issuedAt: new Date("2024-11-15"),
        signedAt: new Date("2024-11-20"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        counterSignerName: "Direksi PT Rumah Sakit Cahaya Sehat",
        counterSignerTitle: "Pemilik Proyek",
        amount: dp(0), retentionAmount: dp(0), taxPct: dp(0),
        taxAmount: dp(0), totalAmount: dp(0), amountInWords: "Nol rupiah",
        body: {
          opening: "Pada hari ini, tanggal lima belas November dua ribu dua puluh empat, telah dilakukan serah terima pekerjaan konstruksi rumah sakit tipe B 5 lantai.",
          clauses: [
            { title: "Pekerjaan yang Diserahkan", text: "Seluruh pekerjaan konstruksi rumah sakit tipe B 5 lantai telah selesai 100% sesuai kontrak." },
            { title: "Kondisi Pekerjaan", text: "Hasil pekerjaan dalam kondisi baik, telah melewati tahap commissioning dan dinyatakan siap beroperasi." },
            { title: "Masa Pemeliharaan", text: "Masa pemeliharaan berlaku selama 24 bulan sejak tanggal serah terima ini ditandatangani." },
          ],
          closing: "Demikian berita acara serah terima ini dibuat dalam rangkap 2 dan memiliki kekuatan hukum yang sama.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Pelunasan Retensi Invoice (PAID) ---
    const inv18num = await num("INV");
    const inv18amount = 2331000000;
    const inv18tax    = Math.round(inv18amount * 0.11);
    const inv18total  = inv18amount + inv18tax;
    await prisma.projectLetter.upsert({
      where: { number: inv18num },
      create: {
        number: inv18num, rabId: r.id, type: "INVOICE", status: "PAID",
        subject: "Invoice Pelunasan Retensi Pemeliharaan RS",
        letterDate: new Date("2024-11-20"), issuedAt: new Date("2024-11-20"),
        paidAt: new Date("2024-11-28"),
        dueDate: new Date("2024-12-04"),
        recipientName: "PT Rumah Sakit Cahaya Sehat",
        recipientCompany: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv18amount), retentionAmount: dp(0),
        taxPct: dp(11), taxAmount: dp(inv18tax), totalAmount: dp(inv18total),
        amountInWords: "Dua miliar lima ratus八十七 juta tiga ratus ribu rupiah",
        body: {
          opening: "Bersama ini kami sampaikan penagihan pelunasan retensi pemeliharaan atas konstruksi rumah sakit.",
          lines: [{ description: "Pelunasan retensi 5%", amount: inv18amount }],
          notes: "Retensi dicairkan setelah masa pemeliharaan 3 bulan selesai.",
        },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;

    // --- Kwitansi Pelunasan Retensi (SIGNED) ---
    const kwit15num = await num("KWIT");
    await prisma.projectLetter.upsert({
      where: { number: kwit15num },
      create: {
        number: kwit15num, rabId: r.id, type: "KWITANSI", status: "SIGNED",
        subject: "Kwitansi Pelunasan Retensi RS Cahaya Sehat",
        letterDate: new Date("2024-11-28"), issuedAt: new Date("2024-11-28"),
        signedAt: new Date("2024-11-28"),
        recipientName: client,
        signerName: "Ir. Hendra Kusuma", signerTitle: "Directeur Utama",
        signatoryId: hendraId,
        amount: dp(inv18total), retentionAmount: dp(0),
        taxPct: dp(0), taxAmount: dp(0), totalAmount: dp(inv18total),
        amountInWords: "Dua miliar lima ratus八十七 juta tiga ratus ribu rupiah",
        body: { opening: "Telah terima dari " + client + " pelunasan retensi pemeliharaan rumah sakit." },
        createdById: adminId,
      },
      update: {},
    });
    totalCreated++;
  }

  // ================================================================
  // Summary
  // ================================================================
  console.log(`\n========================================`);
  console.log(`Correspondence seed complete!`);
  console.log(`Total letters created: ${totalCreated}`);
  console.log(`========================================`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
