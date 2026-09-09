/**
 * SANTRA Complete Seeder v4 - Comprehensive RAB with Schedule Data
 * Deletes existing RABs and creates new ones with proper schedule data
 * Run: npx tsx prisma/seed-rab-v4.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Schedule configuration for realistic S-Curve visualization
 * Each RAB has detailed week-by-week schedule data
 */
interface ScheduleItem {
  description: string;
  unit: string;
  volume: number;
  unitPrice: number;
  startOffsetDays: number;
  durationDays: number;
  bobot: number; // weight percentage
}

interface RabSchedule {
  number: string;
  title: string;
  clientName: string;
  location: string;
  projectDate: string;
  scheduleStart: string;
  status: string;
  taxPct: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  sections: {
    name: string;
    items: ScheduleItem[];
  }[];
}

const RAB_SCHEDULES: RabSchedule[] = [
  // ============================================
  // RAB 1: Gedung Perkantoran 4 Lantai
  // ============================================
  {
    number: "RAB-2026-001",
    title: "Pembangunan Gedung Perkantoran 4 Lantai",
    clientName: "PT Nusantara Realty Indonesia",
    location: "Jl. Sudirman No. 45, Jakarta Selatan",
    projectDate: "2026-01-15",
    scheduleStart: "2026-02-01",
    status: "APPROVED",
    taxPct: 11,
    subtotal: 4850000000,
    discountAmount: 0,
    taxAmount: 533500000,
    total: 5383500000,
    sections: [
      {
        name: "Pekerjaan Struktur",
        items: [
          { description: "Pekerjaan pondasi Strauss pile D300", unit: "m'", volume: 120, unitPrice: 850000, startOffsetDays: 0, durationDays: 43, bobot: 2.10 },
          { description: "Pekerjaan sloof 30x50 cm", unit: "m3", volume: 24, unitPrice: 2500000, startOffsetDays: 43, durationDays: 21, bobot: 1.24 },
          { description: "Pekerjaan kolom utama 40x40 cm", unit: "m3", volume: 48, unitPrice: 3200000, startOffsetDays: 64, durationDays: 45, bobot: 3.17 },
          { description: "Pekerjaan balok 30x50 cm", unit: "m3", volume: 36, unitPrice: 2800000, startOffsetDays: 109, durationDays: 35, bobot: 2.08 },
          { description: "Pekerjaan plat lantai tebal 12 cm", unit: "m2", volume: 960, unitPrice: 385000, startOffsetDays: 144, durationDays: 60, bobot: 7.62 },
          { description: "Pembesian steel bar D13-D25", unit: "kg", volume: 15000, unitPrice: 18000, startOffsetDays: 0, durationDays: 90, bobot: 5.57 },
        ],
      },
      {
        name: "Pekerjaan Arsitektur",
        items: [
          { description: "Pasangan dinding bata merah 1PC:5PP", unit: "m2", volume: 1800, unitPrice: 95000, startOffsetDays: 160, durationDays: 60, bobot: 3.53 },
          { description: "Plesteran dinding dalam", unit: "m2", volume: 3600, unitPrice: 65000, startOffsetDays: 220, durationDays: 45, bobot: 4.83 },
          { description: "Pengecatan dinding dalam", unit: "m2", volume: 3600, unitPrice: 45000, startOffsetDays: 265, durationDays: 30, bobot: 3.34 },
          { description: "Pemasangan kusen aluminium", unit: "unit", volume: 24, unitPrice: 3500000, startOffsetDays: 240, durationDays: 20, bobot: 1.73 },
          { description: "Pemasangan pintu triplek", unit: "unit", volume: 18, unitPrice: 850000, startOffsetDays: 260, durationDays: 15, bobot: 0.32 },
          { description: "Pemasangan lantai granit 60x60", unit: "m2", volume: 400, unitPrice: 250000, startOffsetDays: 280, durationDays: 25, bobot: 2.06 },
          { description: "Pemasangan plafond gypsum 9mm", unit: "m2", volume: 800, unitPrice: 85000, startOffsetDays: 265, durationDays: 30, bobot: 1.40 },
        ],
      },
      {
        name: "Pekerjaan MEP",
        items: [
          { description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 480000000, startOffsetDays: 180, durationDays: 90, bobot: 9.90 },
          { description: "Sistem plumbing & drainase", unit: "ls", volume: 1, unitPrice: 320000000, startOffsetDays: 180, durationDays: 90, bobot: 6.60 },
          { description: "AC split 1 PK", unit: "unit", volume: 16, unitPrice: 7500000, startOffsetDays: 240, durationDays: 45, bobot: 2.47 },
          { description: "Fire alarm system", unit: "ls", volume: 1, unitPrice: 180000000, startOffsetDays: 200, durationDays: 60, bobot: 3.71 },
          { description: "Lift passenger 6 orang", unit: "unit", volume: 2, unitPrice: 350000000, startOffsetDays: 280, durationDays: 45, bobot: 14.43 },
        ],
      },
    ],
  },

  // ============================================
  // RAB 2: Renovasi Rumah Tinggal
  // ============================================
  {
    number: "RAB-2026-002",
    title: "Renovasi & Perluasan Rumah Tinggal Pak Budi",
    clientName: "Budi Santoso",
    location: "Jl. Melati No. 8, Jakarta Selatan",
    projectDate: "2026-06-01",
    scheduleStart: "2026-06-15",
    status: "APPROVED",
    taxPct: 11,
    subtotal: 765000000,
    discountAmount: 0,
    taxAmount: 84150000,
    total: 849150000,
    sections: [
      {
        name: "Pekerjaan Struktur & Pondasi",
        items: [
          { description: "Pekerjaan pembongkaran dinding lama", unit: "m2", volume: 45, unitPrice: 85000, startOffsetDays: 0, durationDays: 15, bobot: 0.50 },
          { description: "Pondasi footplat 60x60 cm", unit: "unit", volume: 8, unitPrice: 1200000, startOffsetDays: 14, durationDays: 11, bobot: 1.26 },
          { description: "Kolom praktis 15x15 cm", unit: "m'", volume: 40, unitPrice: 150000, startOffsetDays: 25, durationDays: 14, bobot: 0.78 },
          { description: "Sloof 20x30 cm", unit: "m3", volume: 6, unitPrice: 2800000, startOffsetDays: 39, durationDays: 15, bobot: 2.20 },
          { description: "Dinding batako 10x20x40 cm", unit: "m2", volume: 120, unitPrice: 95000, startOffsetDays: 54, durationDays: 20, bobot: 1.49 },
          { description: "Ring balok 15x20 cm", unit: "m'", volume: 30, unitPrice: 120000, startOffsetDays: 74, durationDays: 8, bobot: 0.47 },
        ],
      },
      {
        name: "Pekerjaan Finishing",
        items: [
          { description: "Plesteran dinding baru", unit: "m2", volume: 240, unitPrice: 65000, startOffsetDays: 82, durationDays: 19, bobot: 2.04 },
          { description: "Pengecatan dinding interior", unit: "m2", volume: 320, unitPrice: 45000, startOffsetDays: 101, durationDays: 19, bobot: 1.88 },
          { description: "Pemasangan lantai keramik 60x60 cm", unit: "m2", volume: 95, unitPrice: 185000, startOffsetDays: 120, durationDays: 15, bobot: 2.29 },
          { description: "Pemasangan plafon gypsum 9mm", unit: "m2", volume: 95, unitPrice: 95000, startOffsetDays: 120, durationDays: 10, bobot: 1.18 },
          { description: "Pemasangan pintu aluminium", unit: "unit", volume: 5, unitPrice: 1800000, startOffsetDays: 130, durationDays: 5, bobot: 1.18 },
          { description: "Pemasangan jendela aluminium", unit: "unit", volume: 8, unitPrice: 850000, startOffsetDays: 135, durationDays: 5, bobot: 0.89 },
          { description: "Pemasangan closat & accessories", unit: "ls", volume: 1, unitPrice: 2500000, startOffsetDays: 140, durationDays: 5, bobot: 0.33 },
        ],
      },
      {
        name: "Pekerjaan Atap & Plumbing",
        items: [
          { description: "Rangka atap baja ringan", unit: "m2", volume: 80, unitPrice: 165000, startOffsetDays: 82, durationDays: 14, bobot: 1.72 },
          { description: "Penutup atap genteng beton", unit: "m2", volume: 80, unitPrice: 125000, startOffsetDays: 96, durationDays: 12, bobot: 1.31 },
          { description: "Talang air galvanized", unit: "m'", volume: 20, unitPrice: 85000, startOffsetDays: 108, durationDays: 3, bobot: 0.22 },
          { description: "Instalasi pipa air bersih", unit: "ls", volume: 1, unitPrice: 8500000, startOffsetDays: 100, durationDays: 15, bobot: 1.11 },
          { description: "Instalasi pipa pembuangan", unit: "ls", volume: 1, unitPrice: 6000000, startOffsetDays: 100, durationDays: 15, bobot: 0.78 },
          { description: "Tanki air 500L + pump", unit: "ls", volume: 1, unitPrice: 3500000, startOffsetDays: 115, durationDays: 5, bobot: 0.46 },
        ],
      },
    ],
  },

  // ============================================
  // RAB 3: Pembangunan Ruko 3 Lantai
  // ============================================
  {
    number: "RAB-2026-003",
    title: "Pembangunan Ruko 3 Lantai",
    clientName: "CV Maju Jaya",
    location: "Jl. Gatot Subroto No. 120, Jakarta Pusat",
    projectDate: "2026-07-01",
    scheduleStart: "2026-07-15",
    status: "REVIEW",
    taxPct: 11,
    subtotal: 1250000000,
    discountAmount: 25000000,
    taxAmount: 134750000,
    total: 1360750000,
    sections: [
      {
        name: "Pekerjaan Persiapan & Pondasi",
        items: [
          { description: "Pembersihan lokasi", unit: "ls", volume: 1, unitPrice: 5000000, startOffsetDays: 0, durationDays: 2, bobot: 0.40 },
          { description: "Pondasi Strauss pile D400", unit: "m'", volume: 80, unitPrice: 950000, startOffsetDays: 2, durationDays: 28, bobot: 6.08 },
          { description: "Sloof 25x40 cm", unit: "m3", volume: 15, unitPrice: 2200000, startOffsetDays: 30, durationDays: 10, bobot: 2.64 },
          { description: "Galian tanah pondasi", unit: "m3", volume: 50, unitPrice: 85000, startOffsetDays: 0, durationDays: 7, bobot: 0.34 },
          { description: "Urugan tanah kembali", unit: "m3", volume: 30, unitPrice: 45000, startOffsetDays: 40, durationDays: 3, bobot: 0.11 },
        ],
      },
      {
        name: "Pekerjaan Struktur",
        items: [
          { description: "Kolom 30x30 cm", unit: "m3", volume: 28, unitPrice: 3000000, startOffsetDays: 40, durationDays: 28, bobot: 6.72 },
          { description: "Balok 25x40 cm", unit: "m3", volume: 22, unitPrice: 2600000, startOffsetDays: 68, durationDays: 21, bobot: 4.58 },
          { description: "Plat lantai 12 cm", unit: "m2", volume: 450, unitPrice: 380000, startOffsetDays: 89, durationDays: 35, bobot: 13.68 },
          { description: "Pembesian kolom & balok", unit: "kg", volume: 8500, unitPrice: 18000, startOffsetDays: 40, durationDays: 50, bobot: 12.24 },
          { description: "Bekisting kolom & balok", unit: "m2", volume: 280, unitPrice: 85000, startOffsetDays: 40, durationDays: 50, bobot: 1.90 },
        ],
      },
      {
        name: "Pekerjaan Arsitektur",
        items: [
          { description: "Dinding batako 10x20x40 cm", unit: "m2", volume: 650, unitPrice: 85000, startOffsetDays: 124, durationDays: 30, bobot: 4.42 },
          { description: "Plesteran & acian", unit: "m2", volume: 1300, unitPrice: 55000, startOffsetDays: 154, durationDays: 25, bobot: 5.72 },
          { description: "Kusen aluminium & kaca", unit: "ls", volume: 1, unitPrice: 95000000, startOffsetDays: 179, durationDays: 21, bobot: 7.60 },
          { description: "Pengecatan dinding", unit: "m2", volume: 1300, unitPrice: 35000, startOffsetDays: 200, durationDays: 18, bobot: 3.64 },
          { description: "Lantai granit 60x60", unit: "m2", volume: 200, unitPrice: 220000, startOffsetDays: 185, durationDays: 15, bobot: 3.52 },
          { description: "Plafond gypsum 9mm", unit: "m2", volume: 200, unitPrice: 85000, startOffsetDays: 185, durationDays: 12, bobot: 1.36 },
        ],
      },
      {
        name: "Pekerjaan Elektrikal",
        items: [
          { description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 35000000, startOffsetDays: 200, durationDays: 20, bobot: 2.80 },
          { description: "AC window 1 PK", unit: "unit", volume: 6, unitPrice: 4500000, startOffsetDays: 210, durationDays: 10, bobot: 2.16 },
          { description: "Pipa & fitting listrik", unit: "ls", volume: 1, unitPrice: 15000000, startOffsetDays: 200, durationDays: 25, bobot: 1.20 },
        ],
      },
    ],
  },

  // ============================================
  // RAB 4: Renovasi Interior Kantor
  // ============================================
  {
    number: "RAB-2026-004",
    title: "Renovasi Interior Kantor PT Sejahtera",
    clientName: "PT Sejahtera Abadi",
    location: "Jl. HR Rasuna Said Kav. C-17, Jakarta Selatan",
    projectDate: "2026-08-01",
    scheduleStart: "2026-08-15",
    status: "DRAFT",
    taxPct: 11,
    subtotal: 450000000,
    discountAmount: 0,
    taxAmount: 49500000,
    total: 499500000,
    sections: [
      {
        name: "Pekerjaan Demolisi",
        items: [
          { description: "Pembongkaran dinding partisi lama", unit: "m2", volume: 120, unitPrice: 45000, startOffsetDays: 0, durationDays: 5, bobot: 1.20 },
          { description: "Pembongkaran plafon lama", unit: "m2", volume: 200, unitPrice: 25000, startOffsetDays: 5, durationDays: 5, bobot: 1.11 },
          { description: "Pembongkaran lantai lama", unit: "m2", volume: 180, unitPrice: 30000, startOffsetDays: 10, durationDays: 3, bobot: 1.20 },
          { description: "Pembersihan & verifikasi kondisi", unit: "ls", volume: 1, unitPrice: 2500000, startOffsetDays: 13, durationDays: 2, bobot: 0.56 },
        ],
      },
      {
        name: "Pekerjaan Interior",
        items: [
          { description: "Partisi gypsum 2 sisi + insulasi", unit: "m2", volume: 180, unitPrice: 185000, startOffsetDays: 15, durationDays: 18, bobot: 7.40 },
          { description: "Plafond gypsum 120x240 + wirecell", unit: "m2", volume: 200, unitPrice: 125000, startOffsetDays: 33, durationDays: 12, bobot: 5.56 },
          { description: "Lantai vinyl homogeneous", unit: "m2", volume: 180, unitPrice: 350000, startOffsetDays: 45, durationDays: 10, bobot: 14.00 },
          { description: "Dinding cat interior", unit: "m2", volume: 250, unitPrice: 35000, startOffsetDays: 55, durationDays: 8, bobot: 1.94 },
          { description: "Pemasangan pintu hermadort", unit: "unit", volume: 6, unitPrice: 2800000, startOffsetDays: 50, durationDays: 5, bobot: 3.73 },
          { description: "Railing kaca tempered", unit: "m'", volume: 15, unitPrice: 850000, startOffsetDays: 55, durationDays: 3, bobot: 2.83 },
        ],
      },
      {
        name: "Pekerjaan Elektrikal",
        items: [
          { description: "Instalasi titik lampu LED", unit: "titik", volume: 45, unitPrice: 350000, startOffsetDays: 15, durationDays: 15, bobot: 3.50 },
          { description: "Stop kontak & saklar", unit: "titik", volume: 24, unitPrice: 175000, startOffsetDays: 30, durationDays: 7, bobot: 0.93 },
          { description: "AC Cassette 2 PK + install", unit: "unit", volume: 4, unitPrice: 28000000, startOffsetDays: 35, durationDays: 8, bobot: 24.89 },
          { description: "Jaringan data & LAN", unit: "titik", volume: 20, unitPrice: 250000, startOffsetDays: 43, durationDays: 7, bobot: 1.11 },
          { description: "Access control door", unit: "unit", volume: 2, unitPrice: 8500000, startOffsetDays: 55, durationDays: 3, bobot: 3.78 },
        ],
      },
    ],
  },

  // ============================================
  // RAB 5: Pembangunan Pabrik Garmen
  // ============================================
  {
    number: "RAB-2026-005",
    title: "Pembangunan Pabrik Garmen",
    clientName: "PT Textile Indonesia",
    location: "Kawasan Industri MM2100, Cikarang",
    projectDate: "2026-09-01",
    scheduleStart: "2026-09-15",
    status: "DRAFT",
    taxPct: 11,
    subtotal: 8750000000,
    discountAmount: 175000000,
    taxAmount: 943250000,
    total: 9519250000,
    sections: [
      {
        name: "Pekerjaan Pondasi",
        items: [
          { description: "Pondasi tiang pancang D500", unit: "m'", volume: 200, unitPrice: 1800000, startOffsetDays: 0, durationDays: 45, bobot: 4.11 },
          { description: "Poer 100x100x80 cm", unit: "unit", volume: 48, unitPrice: 2500000, startOffsetDays: 45, durationDays: 20, bobot: 1.37 },
          { description: "Slab on grade 15cm", unit: "m2", volume: 2500, unitPrice: 185000, startOffsetDays: 65, durationDays: 30, bobot: 5.29 },
          { description: "Drainase bawah lantai", unit: "m'", volume: 300, unitPrice: 95000, startOffsetDays: 65, durationDays: 25, bobot: 0.33 },
          { description: "Galian & urukan tanah", unit: "m3", volume: 500, unitPrice: 65000, startOffsetDays: 0, durationDays: 20, bobot: 0.37 },
        ],
      },
      {
        name: "Pekerjaan Struktur Baja",
        items: [
          { description: "Kolom WF 300x150", unit: "ton", volume: 15, unitPrice: 28000000, startOffsetDays: 65, durationDays: 30, bobot: 4.80 },
          { description: "Gording CNP 200", unit: "ton", volume: 5, unitPrice: 25000000, startOffsetDays: 95, durationDays: 15, bobot: 1.43 },
          { description: "Kuda-kuda WF 400x200", unit: "ton", volume: 20, unitPrice: 30000000, startOffsetDays: 95, durationDays: 35, bobot: 6.86 },
          { description: "Baut & plate koneksi", unit: "kg", volume: 2500, unitPrice: 35000, startOffsetDays: 95, durationDays: 40, bobot: 1.00 },
          { description: "Baja profil & pengeras", unit: "ls", volume: 1, unitPrice: 85000000, startOffsetDays: 65, durationDays: 65, bobot: 0.97 },
        ],
      },
      {
        name: "Pekerjaan Penutup Atap & Dinding",
        items: [
          { description: "Atap spandek 0.45mm", unit: "m2", volume: 2500, unitPrice: 185000, startOffsetDays: 130, durationDays: 45, bobot: 5.29 },
          { description: "Dinding panel sandwich 50mm", unit: "m2", volume: 1200, unitPrice: 450000, startOffsetDays: 130, durationDays: 60, bobot: 6.17 },
          { description: "Jendela aluminium & kaca tempered", unit: "m2", volume: 150, unitPrice: 850000, startOffsetDays: 190, durationDays: 20, bobot: 1.46 },
          { description: "Pintu rolling door", unit: "unit", volume: 4, unitPrice: 25000000, startOffsetDays: 200, durationDays: 10, bobot: 1.14 },
          { description: "Pelapis anti karat struktur", unit: "ls", volume: 1, unitPrice: 45000000, startOffsetDays: 135, durationDays: 30, bobot: 0.51 },
        ],
      },
      {
        name: "Pekerjaan Lantai",
        items: [
          { description: "Lantai beton industri 20cm", unit: "m2", volume: 2500, unitPrice: 450000, startOffsetDays: 65, durationDays: 60, bobot: 12.86 },
          { description: "Epoxy coating lantai", unit: "m2", volume: 2500, unitPrice: 125000, startOffsetDays: 175, durationDays: 20, bobot: 3.57 },
          { description: "Pemasangan joint filler", unit: "m'", volume: 500, unitPrice: 45000, startOffsetDays: 175, durationDays: 10, bobot: 0.26 },
          { description: "Floor marking & safety line", unit: "ls", volume: 1, unitPrice: 15000000, startOffsetDays: 195, durationDays: 5, bobot: 0.17 },
        ],
      },
      {
        name: "Pekerjaan Elektrikal & Mekanikal",
        items: [
          { description: "Instalasi listrik pabrik", unit: "ls", volume: 1, unitPrice: 350000000, startOffsetDays: 195, durationDays: 40, bobot: 4.00 },
          { description: "Lampu industri LED highbay", unit: "unit", volume: 40, unitPrice: 5500000, startOffsetDays: 200, durationDays: 25, bobot: 2.51 },
          { description: "AC central & ducting", unit: "ls", volume: 1, unitPrice: 450000000, startOffsetDays: 200, durationDays: 50, bobot: 5.14 },
          { description: "Sistem fire protection", unit: "ls", volume: 1, unitPrice: 180000000, startOffsetDays: 195, durationDays: 30, bobot: 2.06 },
          { description: "Air conditioning warehouse", unit: "ls", volume: 1, unitPrice: 250000000, startOffsetDays: 220, durationDays: 30, bobot: 2.86 },
        ],
      },
    ],
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("SANTRA RAB Seeder v4 - Comprehensive Schedule Data");
  console.log("=".repeat(60));
  console.log("");

  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) {
    console.error("No admin user found. Run main seed first.");
    return;
  }
  const adminId = adminUser.id;

  // Delete existing RABs (cascade deletes sections, items, holidays, etc.)
  console.log("Deleting existing RABs...");
  const deletedRabs = await prisma.rab.deleteMany({});
  console.log(`Deleted ${deletedRabs.count} existing RABs`);

  // Delete counters to reset sequence
  await prisma.santraCounter.deleteMany({});
  console.log("Counters reset");

  // Create new RABs with comprehensive schedule data
  console.log("\nCreating new RABs with schedule data...\n");

  let totalItems = 0;
  let totalSections = 0;

  for (const rabData of RAB_SCHEDULES) {
    console.log(`Creating ${rabData.number}: ${rabData.title}...`);

    // Create RAB
    const rab = await prisma.rab.create({
      data: {
        number: rabData.number,
        title: rabData.title,
        clientName: rabData.clientName,
        location: rabData.location,
        projectDate: new Date(rabData.projectDate),
        scheduleStart: new Date(rabData.scheduleStart),
        status: rabData.status as "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED",
        taxPct: rabData.taxPct,
        subtotal: rabData.subtotal,
        discountAmount: rabData.discountAmount,
        taxAmount: rabData.taxAmount,
        total: rabData.total,
        restDays: [0], // Sunday off
        createdById: adminId,
      },
    });

    let sectionOrder = 1;
    for (const sectionData of rabData.sections) {
      const section = await prisma.rabSection.create({
        data: {
          rabId: rab.id,
          name: sectionData.name,
          order: sectionOrder++,
        },
      });

      let itemOrder = 1;
      for (const itemData of sectionData.items) {
        await prisma.rabItem.create({
          data: {
            sectionId: section.id,
            description: itemData.description,
            unit: itemData.unit,
            volume: itemData.volume,
            unitPrice: itemData.unitPrice,
            amount: itemData.volume * itemData.unitPrice,
            startOffsetDays: itemData.startOffsetDays,
            durationDays: itemData.durationDays,
            order: itemOrder++,
          },
        });
        totalItems++;
      }
      totalSections++;
      totalItems += sectionData.items.length;
      console.log("  - " + sectionData.name + ": " + sectionData.items.length + " items");
    }

  // Create counters
  const counters = ["RAB", "LOG", "QC", "ASS", "KPI", "PROG", "DR"];
  for (const prefix of counters) {
    await prisma.santraCounter.create({ data: { prefix, lastSeq: 0 } });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`RABs created:     ${RAB_SCHEDULES.length}`);
  console.log(`Sections created:  ${totalSections}`);
  console.log(`Items created:    ${totalItems}`);
  console.log(`Schedules:       All items have startOffsetDays & durationDays`);
  console.log("=".repeat(60));

  // Verify data
  const rabs = await prisma.rab.count();
  const sectionsCount = await prisma.rabSection.count();
  const itemsCount = await prisma.rabItem.count();
  const whereGt: { durationDays: { gt: number } } = { durationDays: { gt: 0 } };
  const scheduledCount = await prisma.rabItem.count({ where: whereGt });
  console.log("RABs: " + rabs + " Sections: " + sectionsCount + " Items: " + itemsCount + " Scheduled: " + scheduledCount);
  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
