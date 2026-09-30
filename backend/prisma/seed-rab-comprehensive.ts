/**
 * Comprehensive RAB Seeder
 * Creates multiple RAB projects with different statuses and COMPLETE data
 * for all menus: Ikhtisar, Rincian RAB, Kebutuhan, Jadwal & Kurva S, etc.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("======================================================================");
  console.log("COMPREHENSIVE RAB SEEDING - ALL MENUS");
  console.log("======================================================================");
  console.log("");

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin?.id || "";
  console.log("Admin ID:", adminId);

  // Get signatories
  const signatories = await prisma.signatory.findMany({ take: 5 });
  const signatoryMap = new Map(signatories.map(s => [s.name, s]));

  // ============================================
  // RAB-2026-003: COMPLETED PROJECT
  // ============================================
  console.log("\n📦 Creating RAB-2026-003 (COMPLETED)...");
  const rab3 = await prisma.rab.upsert({
    where: { number: "RAB-2026-003" },
    update: {
      title: "Pembangunan Rumah Tinggal 2 Lantai - Pak Hendra",
      clientName: "Hendra Wijaya",
      location: "Jl. Melati Raya No. 15, Bogor 16111",
      projectDate: new Date("2025-10-01"),
      scheduleStart: new Date("2025-10-15"),
      status: "APPROVED",
      subtotal: 485_000_000,
      discountAmount: 0,
      taxAmount: 53_350_000,
      total: 538_350_000,
    },
    create: {
      number: "RAB-2026-003",
      title: "Pembangunan Rumah Tinggal 2 Lantai - Pak Hendra",
      clientName: "Hendra Wijaya",
      location: "Jl. Melati Raya No. 15, Bogor 16111",
      projectDate: new Date("2025-10-01"),
      scheduleStart: new Date("2025-10-15"),
      status: "APPROVED",
      subtotal: 485_000_000,
      discountAmount: 0,
      taxAmount: 53_350_000,
      total: 538_350_000,
      createdById: adminId,
    },
  });

  // Sections & Items for RAB-003
  const sections3 = [
    {
      name: "Pekerjaan Persiapan & Pondasi",
      items: [
        { description: "Pembersihan lokasi", unit: "ls", volume: 1, unitPrice: 5_000_000, amount: 5_000_000 },
        { description: "Pengukuran & bouwplank", unit: "ls", volume: 1, unitPrice: 3_500_000, amount: 3_500_000 },
        { description: "Galian tanah pondasi", unit: "m3", volume: 45, unitPrice: 125_000, amount: 5_625_000 },
        { description: "Urugan pasir bawah pondasi", unit: "m3", volume: 12, unitPrice: 350_000, amount: 4_200_000 },
        { description: "Pasangan pondasi batu kali 1:5", unit: "m3", volume: 28, unitPrice: 850_000, amount: 23_800_000 },
        { description: "Sloof 30x40 cm", unit: "m3", volume: 8.5, unitPrice: 2_800_000, amount: 23_800_000 },
      ]
    },
    {
      name: "Pekerjaan Struktur Beton",
      items: [
        { description: "Kolom utama 30x30 cm", unit: "m3", volume: 12, unitPrice: 3_200_000, amount: 38_400_000 },
        { description: "Kolom praktis 15x15 cm", unit: "m'", volume: 85, unitPrice: 150_000, amount: 12_750_000 },
        { description: "Balok struktur 25x40 cm", unit: "m3", volume: 9.6, unitPrice: 2_900_000, amount: 27_840_000 },
        { description: "Plat lantai tebal 12 cm", unit: "m2", volume: 180, unitPrice: 385_000, amount: 69_300_000 },
        { description: "Tangga beton", unit: "ls", volume: 1, unitPrice: 25_000_000, amount: 25_000_000 },
      ]
    },
    {
      name: "Pekerjaan Arsitektur",
      items: [
        { description: "Pasangan dinding bata merah 1:5", unit: "m2", volume: 320, unitPrice: 95_000, amount: 30_400_000 },
        { description: "Plesteran dinding dalam", unit: "m2", volume: 640, unitPrice: 65_000, amount: 41_600_000 },
        { description: "Acian dinding", unit: "m2", volume: 640, unitPrice: 45_000, amount: 28_800_000 },
        { description: "Pengecatan dinding interior", unit: "m2", volume: 640, unitPrice: 35_000, amount: 22_400_000 },
        { description: "Pengecatan dinding eksterior", unit: "m2", volume: 180, unitPrice: 45_000, amount: 8_100_000 },
        { description: "Pemasangan lantai keramik 60x60 cm", unit: "m2", volume: 120, unitPrice: 185_000, amount: 22_200_000 },
        { description: "Pemasangan lantai keramik km更难 30x30 cm", unit: "m2", volume: 8, unitPrice: 125_000, amount: 1_000_000 },
        { description: "Pemasangan plafon gypsum 9mm", unit: "m2", volume: 120, unitPrice: 95_000, amount: 11_400_000 },
        { description: "Kusen pintu aluminium", unit: "unit", volume: 6, unitPrice: 1_800_000, amount: 10_800_000 },
        { description: "Pintu kayu engineering", unit: "unit", volume: 6, unitPrice: 1_500_000, amount: 9_000_000 },
        { description: "Jendela aluminium + kaca", unit: "unit", volume: 8, unitPrice: 1_200_000, amount: 9_600_000 },
      ]
    },
    {
      name: "Pekerjaan MEP",
      items: [
        { description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 35_000_000, amount: 35_000_000 },
        { description: "Titik lampu", unit: "titik", volume: 18, unitPrice: 450_000, amount: 8_100_000 },
        { description: "Instalasi pipa air bersih", unit: "ls", volume: 1, unitPrice: 18_000_000, amount: 18_000_000 },
        { description: "Instalasi pipa pembuangan", unit: "ls", volume: 1, unitPrice: 12_000_000, amount: 12_000_000 },
        { description: "Kloset duduk + aksesoris", unit: "unit", volume: 2, unitPrice: 3_500_000, amount: 7_000_000 },
        { description: "Shower & kitchen set", unit: "ls", volume: 1, unitPrice: 15_000_000, amount: 15_000_000 },
      ]
    },
  ];

  await seedSections(rab3.id, sections3);

  // ============================================
  // RAB-2026-004: REJECTED PROJECT
  // ============================================
  console.log("\n📦 Creating RAB-2026-004 (REJECTED)...");
  const rab4 = await prisma.rab.upsert({
    where: { number: "RAB-2026-004" },
    update: {
      title: "Pembangunan Gudang Pabrik - PT Maju Bersama",
      clientName: "PT Maju Bersama Industrial",
      location: "Kawasan Industri MM2100, Cikarang, Bekasi 17520",
      projectDate: new Date("2026-06-01"),
      scheduleStart: new Date("2026-07-01"),
      status: "REJECTED",
      notes: "Ditolak karena perubahan spesifikasi klien - menunggu revisi",
      subtotal: 8_500_000_000,
      discountAmount: 0,
      taxAmount: 935_000_000,
      total: 9_435_000_000,
    },
    create: {
      number: "RAB-2026-004",
      title: "Pembangunan Gudang Pabrik - PT Maju Bersama",
      clientName: "PT Maju Bersama Industrial",
      location: "Kawasan Industri MM2100, Cikarang, Bekasi 17520",
      projectDate: new Date("2026-06-01"),
      scheduleStart: new Date("2026-07-01"),
      status: "REJECTED",
      notes: "Ditolak karena perubahan spesifikasi klien - menunggu revisi",
      subtotal: 8_500_000_000,
      discountAmount: 0,
      taxAmount: 935_000_000,
      total: 9_435_000_000,
      createdById: adminId,
    },
  });

  const sections4 = [
    {
      name: "Pekerjaan Tanah & Pondasi",
      items: [
        { description: "Site clearing & grading", unit: "ls", volume: 1, unitPrice: 85_000_000, amount: 85_000_000 },
        { description: "Galian tanah pondasi telapak", unit: "m3", volume: 450, unitPrice: 145_000, amount: 65_250_000 },
        { description: "Urugan pasir & puing", unit: "m3", volume: 180, unitPrice: 285_000, amount: 51_300_000 },
        { description: "Pasangan batu kali protection", unit: "m3", volume: 85, unitPrice: 780_000, amount: 66_300_000 },
        { description: "Pondasi telapak 100x100x40 cm", unit: "unit", volume: 32, unitPrice: 4_500_000, amount: 144_000_000 },
      ]
    },
    {
      name: "Pekerjaan Struktur Baja",
      items: [
        { description: "Kolom utama WF 300x150", unit: "ton", volume: 18.5, unitPrice: 28_500_000, amount: 527_250_000 },
        { description: "Gording CNP 150", unit: "ton", volume: 6.2, unitPrice: 26_000_000, amount: 161_200_000 },
        { description: "Rangka atap truss system", unit: "ton", volume: 12.8, unitPrice: 32_000_000, amount: 409_600_000 },
        { description: "Baut koneksi & bracket", unit: "kg", volume: 2400, unitPrice: 45_000, amount: 108_000_000 },
        { description: "Plat buhul & stiffener", unit: "kg", volume: 1800, unitPrice: 55_000, amount: 99_000_000 },
      ]
    },
    {
      name: "Pekerjaan Penutup Atap & Dinding",
      items: [
        { description: "Genteng metal spandek 0.5mm", unit: "m2", volume: 1850, unitPrice: 185_000, amount: 342_250_000 },
        { description: "Rangka sekunder genteng", unit: "m2", volume: 1850, unitPrice: 95_000, amount: 175_750_000 },
        { description: "Dinding panel sandwich 50mm", unit: "m2", volume: 2200, unitPrice: 450_000, amount: 990_000_000 },
        { description: "Pintu rolled up", unit: "unit", volume: 4, unitPrice: 45_000_000, amount: 180_000_000 },
        { description: "Jendela aluminium + kaca 8mm", unit: "unit", volume: 12, unitPrice: 8_500_000, amount: 102_000_000 },
      ]
    },
    {
      name: "Pekerjaan Floor & Drainase",
      items: [
        { description: "Beton floor slab K-350", unit: "m3", volume: 380, unitPrice: 1_850_000, amount: 703_000_000 },
        { description: "Wiremesh M8 @150", unit: "m2", volume: 1900, unitPrice: 85_000, amount: 161_500_000 },
        { description: "Floor hardener", unit: "m2", volume: 1800, unitPrice: 125_000, amount: 225_000_000 },
        { description: "Channel drainase", unit: "m'", volume: 120, unitPrice: 350_000, amount: 42_000_000 },
        { description: "Sumur resapan", unit: "unit", volume: 4, unitPrice: 15_000_000, amount: 60_000_000 },
      ]
    },
  ];

  await seedSections(rab4.id, sections4);

  // ============================================
  // RAB-2026-005: ON HOLD / REVIEW
  // ============================================
  console.log("\n📦 Creating RAB-2026-005 (REVIEW - ON HOLD)...");
  const rab5 = await prisma.rab.upsert({
    where: { number: "RAB-2026-005" },
    update: {
      title: "Renovasi & Penambahan Lantai Kantor PT Sentosa Abadi",
      clientName: "PT Sentosa Abadi",
      location: "Jl. Gatot Subroto Kav. 45, Jakarta Selatan 12930",
      projectDate: new Date("2026-07-15"),
      scheduleStart: new Date("2026-08-15"),
      status: "REVIEW",
      notes: "Sedang dalam review klien - menunggu persetujuan desain",
      subtotal: 3_200_000_000,
      discountAmount: 0,
      taxAmount: 352_000_000,
      total: 3_552_000_000,
    },
    create: {
      number: "RAB-2026-005",
      title: "Renovasi & Penambahan Lantai Kantor PT Sentosa Abadi",
      clientName: "PT Sentosa Abadi",
      location: "Jl. Gatot Subroto Kav. 45, Jakarta Selatan 12930",
      projectDate: new Date("2026-07-15"),
      scheduleStart: new Date("2026-08-15"),
      status: "REVIEW",
      notes: "Sedang dalam review klien - menunggu persetujuan desain",
      subtotal: 3_200_000_000,
      discountAmount: 0,
      taxAmount: 352_000_000,
      total: 3_552_000_000,
      createdById: adminId,
    },
  });

  const sections5 = [
    {
      name: "Pekerjaan Pembongkaran",
      items: [
        { description: "Pembongkaran dinding partisi lama", unit: "m2", volume: 280, unitPrice: 125_000, amount: 35_000_000 },
        { description: "Pembongkaran plafon lama", unit: "m2", volume: 450, unitPrice: 85_000, amount: 38_250_000 },
        { description: "Pembongkaran lantai lama", unit: "m2", volume: 450, unitPrice: 75_000, amount: 33_750_000 },
        { description: "Pembongkaran AC & mechanical lama", unit: "ls", volume: 1, unitPrice: 25_000_000, amount: 25_000_000 },
        { description: "Pembuangan material bongkaran", unit: "ls", volume: 1, unitPrice: 35_000_000, amount: 35_000_000 },
      ]
    },
    {
      name: "Pekerjaan Struktur Penambahan Lantai",
      items: [
        { description: "Steel frame addition lantai 3", unit: "ton", volume: 15.5, unitPrice: 35_000_000, amount: 542_500_000 },
        { description: "Kolom steel WF 200x100", unit: "ton", volume: 4.2, unitPrice: 38_000_000, amount: 159_600_000 },
        { description: "Deck floor metal deck 0.75mm", unit: "m2", volume: 480, unitPrice: 285_000, amount: 136_800_000 },
        { description: "Cor beton slab lantai 3", unit: "m3", volume: 72, unitPrice: 2_200_000, amount: 158_400_000 },
        { description: "Railing tangga baru", unit: "m'", volume: 18, unitPrice: 3_500_000, amount: 63_000_000 },
      ]
    },
    {
      name: "Pekerjaan Arsitektur Lantai 3",
      items: [
        { description: "Dinding bata ringan 10cm", unit: "m2", volume: 180, unitPrice: 185_000, amount: 33_300_000 },
        { description: "Plesteran & acian", unit: "m2", volume: 360, unitPrice: 95_000, amount: 34_200_000 },
        { description: "Plafond gypsum 9mm + grid", unit: "m2", volume: 450, unitPrice: 145_000, amount: 65_250_000 },
        { description: "Lantai vinyl 3mm", unit: "m2", volume: 420, unitPrice: 285_000, amount: 119_700_000 },
        { description: "Dinding kaca partisi", unit: "m2", volume: 85, unitPrice: 1_850_000, amount: 157_250_000 },
        { description: "Pintu fire rated", unit: "unit", volume: 6, unitPrice: 4_500_000, amount: 27_000_000 },
      ]
    },
    {
      name: "Pekerjaan MEP Lantai 3",
      items: [
        { description: "AC central addition", unit: "PK", volume: 48, unitPrice: 18_500_000, amount: 888_000_000 },
        { description: "HVAC ducting", unit: "ls", volume: 1, unitPrice: 185_000_000, amount: 185_000_000 },
        { description: "Electrical system lantai 3", unit: "ls", volume: 1, unitPrice: 145_000_000, amount: 145_000_000 },
        { description: "Data & network cabling", unit: "ls", volume: 1, unitPrice: 95_000_000, amount: 95_000_000 },
        { description: "Fire alarm system upgrade", unit: "ls", volume: 1, unitPrice: 65_000_000, amount: 65_000_000 },
        { description: "Sprinkler system addition", unit: "ls", volume: 1, unitPrice: 85_000_000, amount: 85_000_000 },
      ]
    },
  ];

  await seedSections(rab5.id, sections5);

  // ============================================
  // RAB-2026-006: IN PROGRESS PROJECT
  // ============================================
  console.log("\n📦 Creating RAB-2026-006 (IN PROGRESS)...");
  const rab6 = await prisma.rab.upsert({
    where: { number: "RAB-2026-006" },
    update: {
      title: "Pembangunan Ruko 4 Lantai - Cluster Kemang",
      clientName: "Budi Santoso (Properti Kemang)",
      location: "Jl. Kemang Timur No. 88, Jakarta Selatan 12730",
      projectDate: new Date("2026-03-01"),
      scheduleStart: new Date("2026-03-15"),
      status: "APPROVED",
      subtotal: 2_850_000_000,
      discountAmount: 50_000_000,
      taxAmount: 308_000_000,
      total: 3_158_000_000,
    },
    create: {
      number: "RAB-2026-006",
      title: "Pembangunan Ruko 4 Lantai - Cluster Kemang",
      clientName: "Budi Santoso (Properti Kemang)",
      location: "Jl. Kemang Timur No. 88, Jakarta Selatan 12730",
      projectDate: new Date("2026-03-01"),
      scheduleStart: new Date("2026-03-15"),
      status: "APPROVED",
      subtotal: 2_850_000_000,
      discountAmount: 50_000_000,
      taxAmount: 308_000_000,
      total: 3_158_000_000,
      createdById: adminId,
    },
  });

  const sections6 = [
    {
      name: "Pekerjaan Pondasi & Struktur Bawah",
      items: [
        { description: "Strauss pile D300", unit: "m'", volume: 180, unitPrice: 850_000, amount: 153_000_000 },
        { description: "Poer/pile cap", unit: "m3", volume: 24, unitPrice: 2_800_000, amount: 67_200_000 },
        { description: "Sloof 30x50 cm", unit: "m3", volume: 18, unitPrice: 2_500_000, amount: 45_000_000 },
      ]
    },
    {
      name: "Pekerjaan Struktur Atas - Lantai 1-2",
      items: [
        { description: "Kolom 40x40 cm - Lt.1", unit: "m3", volume: 8.5, unitPrice: 3_200_000, amount: 27_200_000 },
        { description: "Kolom 35x35 cm - Lt.2", unit: "m3", volume: 7.2, unitPrice: 3_200_000, amount: 23_040_000 },
        { description: "Balok 30x50 cm - Lt.1", unit: "m3", volume: 12.8, unitPrice: 2_800_000, amount: 35_840_000 },
        { description: "Balok 25x40 cm - Lt.2", unit: "m3", volume: 10.5, unitPrice: 2_800_000, amount: 29_400_000 },
        { description: "Plat lantai 12cm - Lt.1", unit: "m2", volume: 85, unitPrice: 385_000, amount: 32_725_000 },
        { description: "Plat lantai 12cm - Lt.2", unit: "m2", volume: 85, unitPrice: 385_000, amount: 32_725_000 },
      ]
    },
    {
      name: "Pekerjaan Struktur Atas - Lantai 3-4",
      items: [
        { description: "Kolom 30x30 cm - Lt.3", unit: "m3", volume: 6.5, unitPrice: 3_200_000, amount: 20_800_000 },
        { description: "Kolom 25x25 cm - Lt.4", unit: "m3", volume: 5.8, unitPrice: 3_200_000, amount: 18_560_000 },
        { description: "Balok 25x40 cm - Lt.3", unit: "m3", volume: 9.2, unitPrice: 2_800_000, amount: 25_760_000 },
        { description: "Balok 20x35 cm - Lt.4", unit: "m3", volume: 7.8, unitPrice: 2_800_000, amount: 21_840_000 },
        { description: "Plat atap Lt.3", unit: "m2", volume: 85, unitPrice: 385_000, amount: 32_725_000 },
        { description: "Tangga beton Lt.1-4", unit: "ls", volume: 1, unitPrice: 45_000_000, amount: 45_000_000 },
      ]
    },
    {
      name: "Pekerjaan Arsitektur",
      items: [
        { description: "Dinding bata 1:5", unit: "m2", volume: 680, unitPrice: 95_000, amount: 64_600_000 },
        { description: "Plesteran", unit: "m2", volume: 1360, unitPrice: 65_000, amount: 88_400_000 },
        { description: "Acian", unit: "m2", volume: 1360, unitPrice: 45_000, amount: 61_200_000 },
        { description: "Keramik lantai 60x60", unit: "m2", volume: 320, unitPrice: 185_000, amount: 59_200_000 },
        { description: "Keramik dinding km更难", unit: "m2", volume: 85, unitPrice: 145_000, amount: 12_325_000 },
        { description: "Pintu & jendela aluminium", unit: "ls", volume: 1, unitPrice: 85_000_000, amount: 85_000_000 },
        { description: "Plafond gypsum + cat", unit: "m2", volume: 320, unitPrice: 165_000, amount: 52_800_000 },
      ]
    },
    {
      name: "Pekerjaan MEP",
      items: [
        { description: "Instalasi listrik", unit: "ls", volume: 1, unitPrice: 85_000_000, amount: 85_000_000 },
        { description: "AC split units", unit: "unit", volume: 12, unitPrice: 7_500_000, amount: 90_000_000 },
        { description: "Plumbing & drainase", unit: "ls", volume: 1, unitPrice: 65_000_000, amount: 65_000_000 },
        { description: "Fire alarm & extinguisher", unit: "ls", volume: 1, unitPrice: 35_000_000, amount: 35_000_000 },
      ]
    },
  ];

  await seedSections(rab6.id, sections6);

  // ============================================
  // RAB-2026-007: DRAFT PROJECT
  // ============================================
  console.log("\n📦 Creating RAB-2026-007 (DRAFT)...");
  const rab7 = await prisma.rab.upsert({
    where: { number: "RAB-2026-007" },
    update: {
      title: "Pembangunan Villa Mewah - Pondok Indah",
      clientName: "Dr. Anwar Wijaya",
      location: "Jl. Metro Pondok Indah No. 25, Jakarta Selatan 12310",
      projectDate: new Date("2026-08-01"),
      scheduleStart: new Date("2026-09-01"),
      status: "DRAFT",
      notes: "Draft awal - menunggu finalisasi desain arsitektur",
      subtotal: 12_500_000_000,
      discountAmount: 0,
      taxAmount: 1_375_000_000,
      total: 13_875_000_000,
    },
    create: {
      number: "RAB-2026-007",
      title: "Pembangunan Villa Mewah - Pondok Indah",
      clientName: "Dr. Anwar Wijaya",
      location: "Jl. Metro Pondok Indah No. 25, Jakarta Selatan 12310",
      projectDate: new Date("2026-08-01"),
      scheduleStart: new Date("2026-09-01"),
      status: "DRAFT",
      notes: "Draft awal - menunggu finalisasi desain arsitektur",
      subtotal: 12_500_000_000,
      discountAmount: 0,
      taxAmount: 1_375_000_000,
      total: 13_875_000_000,
      createdById: adminId,
    },
  });

  const sections7 = [
    {
      name: "Pekerjaan Pondasi & Basement",
      items: [
        { description: "Bored pile D600", unit: "m'", volume: 240, unitPrice: 1_850_000, amount: 444_000_000 },
        { description: "Secant pile wall", unit: "m2", volume: 180, unitPrice: 3_500_000, amount: 630_000_000 },
        { description: "Basement slab & walls", unit: "m3", volume: 280, unitPrice: 2_850_000, amount: 798_000_000 },
        { description: "Waterproofing basement", unit: "m2", volume: 450, unitPrice: 285_000, amount: 128_250_000 },
      ]
    },
    {
      name: "Pekerjaan Struktur Beton",
      items: [
        { description: "Kolom utama 50x50 cm", unit: "m3", volume: 45, unitPrice: 3_500_000, amount: 157_500_000 },
        { description: "Balok utama 40x60 cm", unit: "m3", volume: 65, unitPrice: 3_200_000, amount: 208_000_000 },
        { description: "Flat slab lantai 2-3", unit: "m3", volume: 180, unitPrice: 2_850_000, amount: 513_000_000 },
        { description: "Tangga floating design", unit: "ls", volume: 1, unitPrice: 185_000_000, amount: 185_000_000 },
        { description: "Kolam Renang (25x10m)", unit: "ls", volume: 1, unitPrice: 850_000_000, amount: 850_000_000 },
      ]
    },
    {
      name: "Pekerjaan Arsitektur Premium",
      items: [
        { description: "Dinding marble import", unit: "m2", volume: 450, unitPrice: 1_850_000, amount: 832_500_000 },
        { description: "Lantai marble import", unit: "m2", volume: 380, unitPrice: 2_200_000, amount: 836_000_000 },
        { description: "Plafond gypsum custom", unit: "m2", volume: 320, unitPrice: 385_000, amount: 123_200_000 },
        { description: "Pintu kayu jati custom", unit: "unit", volume: 15, unitPrice: 15_000_000, amount: 225_000_000 },
        { description: "Window system UPVC", unit: "m2", volume: 180, unitPrice: 1_250_000, amount: 225_000_000 },
        { description: "Smart home system", unit: "ls", volume: 1, unitPrice: 450_000_000, amount: 450_000_000 },
      ]
    },
    {
      name: "Pekerjaan Landscape & Outdoor",
      items: [
        { description: "Taman rooftop", unit: "m2", volume: 120, unitPrice: 850_000, amount: 102_000_000 },
        { description: "Hardscape & patio", unit: "ls", volume: 1, unitPrice: 350_000_000, amount: 350_000_000 },
        { description: "Taman landscape", unit: "ls", volume: 1, unitPrice: 280_000_000, amount: 280_000_000 },
        { description: "Swimming pool equipment", unit: "ls", volume: 1, unitPrice: 650_000_000, amount: 650_000_000 },
      ]
    },
  ];

  await seedSections(rab7.id, sections7);

  console.log("\n======================================================================");
  console.log("✅ RAB COMPREHENSIVE SEEDING COMPLETE!");
  console.log("======================================================================");
}

// Helper function to seed sections and items
async function seedSections(rabId: string, sections: any[]) {
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const dbSection = await prisma.rabSection.upsert({
      where: { id: `${rabId}-section-${i}` },
      update: { name: section.name, order: i + 1 },
      create: {
        id: `${rabId}-section-${i}`,
        rabId,
        name: section.name,
        order: i + 1,
      },
    });

    for (let j = 0; j < section.items.length; j++) {
      const item = section.items[j];
      await prisma.rabItem.upsert({
        where: { id: `${dbSection.id}-item-${j}` },
        update: {
          description: item.description,
          unit: item.unit,
          volume: item.volume,
          unitPrice: item.unitPrice,
          amount: item.amount,
          order: j,
        },
        create: {
          id: `${dbSection.id}-item-${j}`,
          sectionId: dbSection.id,
          description: item.description,
          unit: item.unit,
          volume: item.volume,
          unitPrice: item.unitPrice,
          amount: item.amount,
          order: j,
          startOffsetDays: j * 3,
          durationDays: Math.floor(item.volume / 10) + 5,
        },
      });
    }
  }
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
