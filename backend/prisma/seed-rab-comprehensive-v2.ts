/**
 * Comprehensive RAB Seeder - ALL MENUS
 * Creates multiple RAB projects with DIFFERENT statuses and COMPLETE data
 * for all menus:
 * - Ikhtisar (Overview)
 * - Rincian RAB (RAB Details - Sections & Items)
 * - Kebutuhan (Submissions)
 * - Jadwal & Kurva S (Schedule & S-Curve)
 * - Pengajuan (Requests)
 * - Laporan Harian (Daily Reports)
 * - Mingguan & Bulanan (Weekly & Monthly Reports)
 * - Logbook
 * - Site Memo
 * - Surat-menyurat (Correspondence)
 * - Termin (Billing)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureDocumentCounters(): Promise<void> {
  const counters = [
    { id: 'SPK-2026', series: 'SPK', year: 2026, lastSeq: 0 },
    { id: 'INV-2026', series: 'INV', year: 2026, lastSeq: 0 },
    { id: 'BILL-2026', series: 'BILL', year: 2026, lastSeq: 0 },
    { id: 'SUB-2026', series: 'SUB', year: 2026, lastSeq: 0 },
    { id: 'KWIT-2026', series: 'KWIT', year: 2026, lastSeq: 0 },
    { id: 'BAPP-2026', series: 'BAPP', year: 2026, lastSeq: 0 },
    { id: 'BAST-2026', series: 'BAST', year: 2026, lastSeq: 0 },
    { id: 'SM-IN-2026', series: 'SM-IN', year: 2026, lastSeq: 0 },
    { id: 'SM-OUT-2026', series: 'SM-OUT', year: 2026, lastSeq: 0 },
  ];
  for (const c of counters) {
    await prisma.documentCounter.upsert({
      where: { id: c.id },
      update: { lastSeq: c.lastSeq },
      create: c
    });
  }
}

async function main(): Promise<void> {
  console.log('=== COMPREHENSIVE RAB SEEDING - ALL MENUS ===');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId: string = admin?.id || '';
  console.log('Admin ID:', adminId);
  await ensureDocumentCounters();

  // RAB-2026-003: COMPLETED (Small Residential - APPROVED)
  console.log('Creating RAB-2026-003 (COMPLETED)...');
  const rab3 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-003' },
    update: { title: 'Pembangunan Rumah Tinggal 2 Lantai - Pak Hendra', status: 'APPROVED' },
    create: { number: 'RAB-2026-003', title: 'Pembangunan Rumah Tinggal 2 Lantai - Pak Hendra', clientName: 'Hendra Wijaya', location: 'Jl. Melati Raya No. 15, Bogor 16111', projectDate: new Date('2025-10-01'), scheduleStart: new Date('2025-10-15'), status: 'APPROVED', subtotal: 485000000, discountAmount: 0, taxAmount: 53350000, total: 538350000, createdById: adminId }
  });
  await seedRabComplete(rab3.id, adminId);

  // RAB-2026-004: REJECTED (Warehouse)
  console.log('Creating RAB-2026-004 (REJECTED)...');
  const rab4 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-004' },
    update: { title: 'Pembangunan Gudang Pabrik - PT Maju Bersama', status: 'REJECTED' },
    create: { number: 'RAB-2026-004', title: 'Pembangunan Gudang Pabrik - PT Maju Bersama', clientName: 'PT Maju Bersama Industrial', location: 'Kawasan Industri MM2100, Cikarang, Bekasi 17520', projectDate: new Date('2026-06-01'), scheduleStart: new Date('2026-07-01'), status: 'REJECTED', notes: 'Ditolak karena perubahan spesifikasi klien - menunggu revisi', subtotal: 8500000000, discountAmount: 0, taxAmount: 935000000, total: 9435000000, createdById: adminId }
  });
  await seedRabRejected(rab4.id, adminId);

  // RAB-2026-005: ON_HOLD (Office Building)
  console.log('Creating RAB-2026-005 (REVIEW/ON_HOLD)...');
  const rab5 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-005' },
    update: { title: 'Renovasi & Penambahan Lantai Kantor PT Sentosa Abadi', status: 'REVIEW' },
    create: { number: 'RAB-2026-005', title: 'Renovasi & Penambahan Lantai Kantor PT Sentosa Abadi', clientName: 'PT Sentosa Abadi', location: 'Jl. Gatot Subroto Kav. 45, Jakarta Selatan 12930', projectDate: new Date('2026-07-15'), scheduleStart: new Date('2026-08-15'), status: 'REVIEW', notes: 'Sedang dalam review klien - menunggu persetujuan desain', subtotal: 3200000000, discountAmount: 0, taxAmount: 352000000, total: 3552000000, createdById: adminId }
  });
  await seedRabOnHold(rab5.id, adminId);

  // RAB-2026-006: IN_PROGRESS (Shopping Mall)
  console.log('Creating RAB-2026-006 (IN_PROGRESS)...');
  const rab6 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-006' },
    update: { title: 'Pembangunan Ruko 4 Lantai - Cluster Kemang', status: 'APPROVED' },
    create: { number: 'RAB-2026-006', title: 'Pembangunan Ruko 4 Lantai - Cluster Kemang', clientName: 'Budi Santoso', location: 'Jl. Kemang Timur No. 88, Jakarta Selatan 12730', projectDate: new Date('2026-03-01'), scheduleStart: new Date('2026-03-15'), status: 'APPROVED', subtotal: 2850000000, discountAmount: 50000000, taxAmount: 308000000, total: 3158000000, createdById: adminId }
  });
  await seedRabInProgress(rab6.id, adminId);

  // RAB-2026-007: DRAFT (Villa)
  console.log('Creating RAB-2026-007 (DRAFT)...');
  const rab7 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-007' },
    update: { title: 'Pembangunan Villa Mewah - Pondok Indah', status: 'DRAFT' },
    create: { number: 'RAB-2026-007', title: 'Pembangunan Villa Mewah - Pondok Indah', clientName: 'Dr. Anwar Wijaya', location: 'Jl. Metro Pondok Indah No. 25, Jakarta Selatan 12310', projectDate: new Date('2026-08-01'), scheduleStart: new Date('2026-09-01'), status: 'DRAFT', notes: 'Draft awal - menunggu finalisasi desain arsitektur', subtotal: 12500000000, discountAmount: 0, taxAmount: 1375000000, total: 13875000000, createdById: adminId }
  });
  await seedRabDraft(rab7.id, adminId);

  console.log('=== SEEDING COMPLETE ===');
}

// ============================================
// RAB-003: COMPLETED - Complete all data
// ============================================
async function seedRabComplete(rabId: string, adminId: string): Promise<void> {
  const sections = [
    { name: 'Pekerjaan Persiapan & Pondasi', items: [
      { desc: 'Pembersihan lokasi', unit: 'ls', vol: 1, price: 5000000 },
      { desc: 'Pengukuran & bouwplank', unit: 'ls', vol: 1, price: 3500000 },
      { desc: 'Galian tanah pondasi', unit: 'm3', vol: 45, price: 125000 },
      { desc: 'Urugan pasir bawah pondasi', unit: 'm3', vol: 12, price: 350000 },
      { desc: 'Pasangan pondasi batu kali 1:5', unit: 'm3', vol: 28, price: 850000 },
      { desc: 'Sloof 30x40 cm', unit: 'm3', vol: 8.5, price: 2800000 },
    ]},
    { name: 'Pekerjaan Struktur Beton', items: [
      { desc: 'Kolom utama 30x30 cm', unit: 'm3', vol: 12, price: 3200000 },
      { desc: 'Kolom praktis 15x15 cm', unit: 'm', vol: 85, price: 150000 },
      { desc: 'Balok struktur 25x40 cm', unit: 'm3', vol: 9.6, price: 2900000 },
      { desc: 'Plat lantai tebal 12 cm', unit: 'm2', vol: 180, price: 385000 },
      { desc: 'Tangga beton', unit: 'ls', vol: 1, price: 25000000 },
    ]},
    { name: 'Pekerjaan Arsitektur', items: [
      { desc: 'Pasangan dinding bata merah 1:5', unit: 'm2', vol: 320, price: 95000 },
      { desc: 'Plesteran dinding dalam', unit: 'm2', vol: 640, price: 65000 },
      { desc: 'Acian dinding', unit: 'm2', vol: 640, price: 45000 },
      { desc: 'Pengecatan dinding interior', unit: 'm2', vol: 640, price: 35000 },
      { desc: 'Pengecatan dinding eksterior', unit: 'm2', vol: 180, price: 45000 },
      { desc: 'Pemasangan lantai keramik 60x60 cm', unit: 'm2', vol: 120, price: 185000 },
      { desc: 'Pemasangan plafon gypsum 9mm', unit: 'm2', vol: 120, price: 95000 },
      { desc: 'Kusen pintu aluminium', unit: 'unit', vol: 6, price: 1800000 },
      { desc: 'Jendela aluminium + kaca', unit: 'unit', vol: 8, price: 1200000 },
    ]},
    { name: 'Pekerjaan MEP', items: [
      { desc: 'Instalasi listrik lengkap', unit: 'ls', vol: 1, price: 35000000 },
      { desc: 'Titik lampu', unit: 'titik', vol: 18, price: 450000 },
      { desc: 'Instalasi pipa air bersih', unit: 'ls', vol: 1, price: 18000000 },
      { desc: 'Instalasi pipa pembuangan', unit: 'ls', vol: 1, price: 12000000 },
      { desc: 'Kloset duduk + aksesoris', unit: 'unit', vol: 2, price: 3500000 },
    ]},
  ];
  await seedSectionsAndItems(rabId, sections);
  await seedHolidays(rabId, new Date('2025-10-15'));
  await seedScheduleBaseline(rabId, adminId, 180);
  await seedProgress(rabId, adminId, 100);
  await seedDailyReports(rabId, adminId);
  await seedLogbook(rabId, adminId);
  await seedSiteMemos(rabId, adminId);
  await seedSubmissions(rabId, adminId);
  await seedLetters(rabId, adminId);
  await seedBillings(rabId, adminId);
  console.log('  RAB-003 complete!');
}

// ============================================
// RAB-004: REJECTED - Basic data only
// ============================================
async function seedRabRejected(rabId: string, adminId: string): Promise<void> {
  const sections = [
    { name: 'Pekerjaan Tanah & Pondasi', items: [
      { desc: 'Site clearing & grading', unit: 'ls', vol: 1, price: 85000000 },
      { desc: 'Galian tanah pondasi telapak', unit: 'm3', vol: 450, price: 145000 },
      { desc: 'Urugan pasir & puing', unit: 'm3', vol: 180, price: 285000 },
      { desc: 'Pasangan batu kali protection', unit: 'm3', vol: 85, price: 780000 },
      { desc: 'Pondasi telapak 100x100x40 cm', unit: 'unit', vol: 32, price: 4500000 },
    ]},
    { name: 'Pekerjaan Struktur Baja', items: [
      { desc: 'Kolom utama WF 300x150', unit: 'ton', vol: 18.5, price: 28500000 },
      { desc: 'Gording CNP 150', unit: 'ton', vol: 6.2, price: 26000000 },
      { desc: 'Rangka atap truss system', unit: 'ton', vol: 12.8, price: 32000000 },
      { desc: 'Baut koneksi & bracket', unit: 'kg', vol: 2400, price: 45000 },
    ]},
    { name: 'Pekerjaan Penutup Atap & Dinding', items: [
      { desc: 'Genteng metal spandek 0.5mm', unit: 'm2', vol: 1850, price: 185000 },
      { desc: 'Dinding panel sandwich 50mm', unit: 'm2', vol: 2200, price: 450000 },
      { desc: 'Pintu rolled up', unit: 'unit', vol: 4, price: 45000000 },
    ]},
  ];
  await seedSectionsAndItems(rabId, sections);
  console.log('  RAB-004 complete (REJECTED - minimal data)');
}

// ============================================
// RAB-005: ON_HOLD - Moderate data
// ============================================
async function seedRabOnHold(rabId: string, adminId: string): Promise<void> {
  const sections = [
    { name: 'Pekerjaan Pembongkaran', items: [
      { desc: 'Pembongkaran dinding partisi lama', unit: 'm2', vol: 280, price: 125000 },
      { desc: 'Pembongkaran plafon lama', unit: 'm2', vol: 450, price: 85000 },
      { desc: 'Pembongkaran lantai lama', unit: 'm2', vol: 450, price: 75000 },
    ]},
    { name: 'Pekerjaan Struktur Penambahan', items: [
      { desc: 'Steel frame addition lantai 3', unit: 'ton', vol: 15.5, price: 35000000 },
      { desc: 'Deck floor metal deck 0.75mm', unit: 'm2', vol: 480, price: 285000 },
      { desc: 'Cor beton slab lantai 3', unit: 'm3', vol: 72, price: 2200000 },
    ]},
    { name: 'Pekerjaan Arsitektur Lantai 3', items: [
      { desc: 'Dinding bata ringan 10cm', unit: 'm2', vol: 180, price: 185000 },
      { desc: 'Plesteran & acian', unit: 'm2', vol: 360, price: 95000 },
      { desc: 'Plafond gypsum 9mm + grid', unit: 'm2', vol: 450, price: 145000 },
      { desc: 'Lantai vinyl 3mm', unit: 'm2', vol: 420, price: 285000 },
    ]},
    { name: 'Pekerjaan MEP Lantai 3', items: [
      { desc: 'AC central addition', unit: 'PK', vol: 48, price: 18500000 },
      { desc: 'HVAC ducting', unit: 'ls', vol: 1, price: 185000000 },
      { desc: 'Electrical system lantai 3', unit: 'ls', vol: 1, price: 145000000 },
    ]},
  ];
  await seedSectionsAndItems(rabId, sections);
  await seedHolidays(rabId, new Date('2026-08-15'));
  await seedScheduleBaseline(rabId, adminId, 240);
  console.log('  RAB-005 complete (ON_HOLD)');
}

// ============================================
// RAB-006: IN_PROGRESS - Complex with all data
// ============================================
async function seedRabInProgress(rabId: string, adminId: string): Promise<void> {
  const sections = [
    { name: 'Pekerjaan Pondasi & Struktur Bawah', items: [
      { desc: 'Strauss pile D300', unit: 'm', vol: 180, price: 850000 },
      { desc: 'Poer/pile cap', unit: 'm3', vol: 24, price: 2800000 },
      { desc: 'Sloof 30x50 cm', unit: 'm3', vol: 18, price: 2500000 },
    ]},
    { name: 'Pekerjaan Struktur Atas - Lantai 1-2', items: [
      { desc: 'Kolom 40x40 cm - Lt.1', unit: 'm3', vol: 8.5, price: 3200000 },
      { desc: 'Kolom 35x35 cm - Lt.2', unit: 'm3', vol: 7.2, price: 3200000 },
      { desc: 'Balok 30x50 cm - Lt.1', unit: 'm3', vol: 12.8, price: 2800000 },
      { desc: 'Balok 25x40 cm - Lt.2', unit: 'm3', vol: 10.5, price: 2800000 },
      { desc: 'Plat lantai 12cm - Lt.1', unit: 'm2', vol: 85, price: 385000 },
      { desc: 'Plat lantai 12cm - Lt.2', unit: 'm2', vol: 85, price: 385000 },
    ]},
    { name: 'Pekerjaan Struktur Atas - Lantai 3-4', items: [
      { desc: 'Kolom 30x30 cm - Lt.3', unit: 'm3', vol: 6.5, price: 3200000 },
      { desc: 'Kolom 25x25 cm - Lt.4', unit: 'm3', vol: 5.8, price: 3200000 },
      { desc: 'Balok 25x40 cm - Lt.3', unit: 'm3', vol: 9.2, price: 2800000 },
      { desc: 'Balok 20x35 cm - Lt.4', unit: 'm3', vol: 7.8, price: 2800000 },
      { desc: 'Plat atap Lt.3', unit: 'm2', vol: 85, price: 385000 },
      { desc: 'Tangga beton Lt.1-4', unit: 'ls', vol: 1, price: 45000000 },
    ]},
    { name: 'Pekerjaan Arsitektur', items: [
      { desc: 'Dinding bata 1:5', unit: 'm2', vol: 680, price: 95000 },
      { desc: 'Plesteran', unit: 'm2', vol: 1360, price: 65000 },
      { desc: 'Acian', unit: 'm2', vol: 1360, price: 45000 },
      { desc: 'Keramik lantai 60x60', unit: 'm2', vol: 320, price: 185000 },
      { desc: 'Pintu & jendela aluminium', unit: 'ls', vol: 1, price: 85000000 },
      { desc: 'Plafond gypsum + cat', unit: 'm2', vol: 320, price: 165000 },
    ]},
    { name: 'Pekerjaan MEP', items: [
      { desc: 'Instalasi listrik', unit: 'ls', vol: 1, price: 85000000 },
      { desc: 'AC split units', unit: 'unit', vol: 12, price: 7500000 },
      { desc: 'Plumbing & drainase', unit: 'ls', vol: 1, price: 65000000 },
      { desc: 'Fire alarm & extinguisher', unit: 'ls', vol: 1, price: 35000000 },
    ]},
  ];
  await seedSectionsAndItems(rabId, sections);
  await seedHolidays(rabId, new Date('2026-03-15'));
  await seedScheduleBaseline(rabId, adminId, 300);
  await seedProgress(rabId, adminId, 45);
  await seedDailyReports(rabId, adminId);
  await seedLogbook(rabId, adminId);
  await seedSiteMemos(rabId, adminId);
  await seedSubmissions(rabId, adminId);
  await seedLetters(rabId, adminId);
  await seedBillings(rabId, adminId);
  console.log('  RAB-006 complete (IN_PROGRESS)');
}

// ============================================
// RAB-007: DRAFT - Basic data only
// ============================================
async function seedRabDraft(rabId: string, adminId: string): Promise<void> {
  const sections = [
    { name: 'Pekerjaan Pondasi & Basement', items: [
      { desc: 'Bored pile D600', unit: 'm', vol: 240, price: 1850000 },
      { desc: 'Secant pile wall', unit: 'm2', vol: 180, price: 3500000 },
      { desc: 'Basement slab & walls', unit: 'm3', vol: 280, price: 2850000 },
      { desc: 'Waterproofing basement', unit: 'm2', vol: 450, price: 285000 },
    ]},
    { name: 'Pekerjaan Struktur Beton', items: [
      { desc: 'Kolom utama 50x50 cm', unit: 'm3', vol: 45, price: 3500000 },
      { desc: 'Balok utama 40x60 cm', unit: 'm3', vol: 65, price: 3200000 },
      { desc: 'Flat slab lantai 2-3', unit: 'm3', vol: 180, price: 2850000 },
      { desc: 'Tangga floating design', unit: 'ls', vol: 1, price: 185000000 },
    ]},
    { name: 'Pekerjaan Arsitektur Premium', items: [
      { desc: 'Dinding marble import', unit: 'm2', vol: 450, price: 1850000 },
      { desc: 'Lantai marble import', unit: 'm2', vol: 380, price: 2200000 },
      { desc: 'Plafond gypsum custom', unit: 'm2', vol: 320, price: 385000 },
      { desc: 'Pintu kayu jati custom', unit: 'unit', vol: 15, price: 15000000 },
    ]},
  ];
  await seedSectionsAndItems(rabId, sections);
  console.log('  RAB-007 complete (DRAFT)');
}

// ============================================
// SHARED HELPER FUNCTIONS
// ============================================

interface SectionItem {
  desc: string;
  unit: string;
  vol: number;
  price: number;
}

interface Section {
  name: string;
  items: SectionItem[];
}

async function seedSectionsAndItems(rabId: string, sections: Section[]): Promise<void> {
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const section = await prisma.rabSection.upsert({
      where: { id: rabId + '-s' + i },
      update: { name: sec.name, order: i + 1 },
      create: { id: rabId + '-s' + i, rabId, name: sec.name, order: i + 1 }
    });
    for (let j = 0; j < sec.items.length; j++) {
      const item = sec.items[j];
      const amount = item.vol * item.price;
      await prisma.rabItem.upsert({
        where: { id: section.id + '-i' + j },
        update: { description: item.desc, unit: item.unit, volume: item.vol, unitPrice: item.price, amount, order: j },
        create: { id: section.id + '-i' + j, sectionId: section.id, description: item.desc, unit: item.unit, volume: item.vol, unitPrice: item.price, amount, order: j, startOffsetDays: (i * 10) + (j * 3), durationDays: Math.floor(item.vol / 10) + 5 }
      });
    }
  }
}

async function seedHolidays(rabId: string, startDate: Date): Promise<void> {
  const holidays = [
    { name: 'Tahun Baru 2026', date: '2026-01-01' },
    { name: 'Tahun Baru Imlek', date: '2026-02-17' },
    { name: 'Hari Raya Nyepi', date: '2026-03-20' },
    { name: 'Hari Buruh', date: '2026-05-01' },
    { name: 'Hari Raya Idulfitri', date: '2026-05-11' },
    { name: 'Lebaran', date: '2026-05-12' },
    { name: 'Hari Kemerdekaan RI', date: '2026-08-17' },
    { name: 'Hari Raya Natal', date: '2026-12-25' },
  ];
  for (const h of holidays) {
    const d = new Date(h.date);
    if (d >= startDate) {
      await prisma.rabHoliday.upsert({
        where: { rabId_date: { rabId, date: d } },
        update: { name: h.name },
        create: { rabId, date: d, name: h.name }
      });
    }
  }
}

async function seedScheduleBaseline(rabId: string, adminId: string, totalDays: number): Promise<void> {
  const items = await prisma.rabItem.findMany({ where: { section: { rabId } }, orderBy: { order: 'asc' } });
  const curvePoints: { day: number; planned: number; actual: number }[] = [];
  for (let d = 0; d <= totalDays; d += Math.ceil(totalDays / 20)) {
    const planned = Math.min(100, Math.round(100 * (1 - Math.pow(1 - d / totalDays, 3))));
    curvePoints.push({ day: d, planned, actual: -1 });
  }
  const snapshot = {
    items: items.map((item, i) => ({ id: item.id, description: item.description, amount: Number(item.amount), startOffsetDays: item.startOffsetDays, durationDays: item.durationDays, weight: Number(item.amount) })),
    curve: curvePoints,
    totalWeight: items.reduce((s, i) => s + Number(i.amount), 0),
    totalAmount: items.reduce((s, i) => s + Number(i.amount), 0),
    milestones: [
      { name: 'M1 - Ground Breaking', day: 0, percent: 0 },
      { name: 'M2 - Foundation Complete', day: Math.floor(totalDays * 0.2), percent: 20 },
      { name: 'M3 - Structure 50%', day: Math.floor(totalDays * 0.4), percent: 50 },
      { name: 'M4 - Structure Complete', day: Math.floor(totalDays * 0.6), percent: 70 },
      { name: 'M5 - Finishing', day: Math.floor(totalDays * 0.85), percent: 90 },
      { name: 'M6 - Handover', day: totalDays, percent: 100 },
    ]
  };
  await prisma.rabScheduleBaseline.upsert({
    where: { id: rabId + '-baseline-1' },
    update: { snapshot: snapshot as any },
    create: { id: rabId + '-baseline-1', rabId, name: 'Baseline Original', snapshot: snapshot as any, capturedById: adminId }
  });
  if (totalDays > 200) {
    const revSnapshot = { ...snapshot, version: '1.1' };
    await prisma.rabScheduleBaseline.upsert({
      where: { id: rabId + '-baseline-2' },
      update: { name: 'Baseline Revisi 1', snapshot: revSnapshot as any },
      create: { id: rabId + '-baseline-2', rabId, name: 'Baseline Revisi 1', snapshot: revSnapshot as any, capturedById: adminId }
    });
  }
}

async function seedProgress(rabId: string, adminId: string, targetPercent: number): Promise<void> {
  const items = await prisma.rabItem.findMany({ where: { section: { rabId } }, take: 10 });
  const progressDates = [
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ];
  for (let i = 0; i < Math.min(items.length, 8); i++) {
    const item = items[i];
    const maxPercent = Math.min(targetPercent, Math.round(20 + (i * 10)));
    for (let p = 0; p < 3 && maxPercent > 0; p++) {
      const percent = Math.min(maxPercent, Math.round(maxPercent * (p + 1) / 3));
      const date = progressDates[p];
      await prisma.rabProgress.upsert({
        where: { id: item.id + '-prog-' + p },
        update: { percent, date, status: percent === 100 ? 'APPROVED' : 'PENDING', approvedAt: percent === 100 ? date : null },
        create: { id: item.id + '-prog-' + p, itemId: item.id, date, percent, note: 'Progress check ' + (p + 1), status: percent === 100 ? 'APPROVED' : 'PENDING', approvedById: percent === 100 ? adminId : null, approvedAt: percent === 100 ? date : null, createdById: adminId }
      });
    }
  }
}

async function seedDailyReports(rabId: string, adminId: string): Promise<void> {
  const weathers = ['CERAH', 'BERAWAN', 'GERIMIS', 'HUJAN'] as const;
  for (let i = 0; i < 15; i++) {
    const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
    const weather = weathers[i % weathers.length];
    const workforce: Record<string, number> = {};
    if (Math.random() > 0.2) workforce['PEKERJA'] = 12 + Math.floor(Math.random() * 3);
    if (Math.random() > 0.3) workforce['TUKANG_BATU'] = 4 + Math.floor(Math.random() * 2);
    if (Math.random() > 0.4) workforce['TUKANG_BESI'] = 2 + Math.floor(Math.random() * 2);
    workforce['MANDOR'] = 1;
    const activities = [
      'Pengecoran plat lantai 2 area A',
      'Pembesian kolom lantai 3',
      'Pemasangan bekisting balok Lt.2',
      'Pasangan dinding bata Lt.1',
      'Plesteran dinding dalam',
      'Pengecatan interior Lt.1',
      'Instalasi listrik Lt.2',
      'Pemasangan plafon gypsum',
    ];
    await prisma.dailyReport.upsert({
      where: { rabId_date: { rabId, date } },
      update: { activities: activities[i % activities.length], workforce: workforce as any, weatherAfternoon: weather },
      create: {
        id: rabId + '-dr-' + i,
        rabId,
        date,
        weatherAfternoon: weather,
        workforce: workforce as any,
        activities: activities[i % activities.length],
        notes: i % 3 === 0 ? 'Progress berjalan baik' : null,
        createdById: adminId
      }
    });
  }
}

async function seedLogbook(rabId: string, adminId: string): Promise<void> {
  const entries = [
    { cat: 'KUNJUNGAN_KONSULTAN' as const, sev: 'INFO' as const, title: 'Inspection Rutin Konsultan Pengawas', desc: 'Tim pengawas melakukan inspection rutin mingguan. Memeriksa progress pekerjaan struktur.' },
    { cat: 'GANGGUAN_CUACA' as const, sev: 'RINGAN' as const, title: 'Hujan Deras Siang Ini', desc: 'Curah hujan tinggi mengganggu pekerjaan cor. Pekerjaan dihentikan sementara.' },
    { cat: 'INSTRUKSI_LAPANGAN' as const, sev: 'RINGAN' as const, title: 'Perubahan Detail Penulangan', desc: 'Konsultan struktural mengeluarkan revised drawing untuk balok B3.' },
    { cat: 'LAINNYA' as const, sev: 'INFO' as const, title: 'Rapat Progress Mingguan', desc: 'Rapat koordinasi progress. Capaian: fondasi 100%, kolom lantai 1 mencapai 80%.' },
    { cat: 'KUNJUNGAN_CLIENT' as const, sev: 'INFO' as const, title: 'Kunjungan Klien - Progress Review', desc: 'Klien meninjau progress proyek. Klien puas dengan kualitas pekerjaan.' },
    { cat: 'KESALAHAN_KERJA' as const, sev: 'BERAT' as const, title: 'Besi Tulangan Terpasang Salah', desc: 'Saat QC check, ditemukan besi tulangan kolom K3 terpasang tidak sesuai drawing.' },
  ];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const date = new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000));
    await prisma.logbookEntry.upsert({
      where: { id: rabId + '-log-' + i },
      update: { title: e.title },
      create: {
        id: rabId + '-log-' + i,
        rabId,
        date,
        timeOfDay: '09:00',
        category: e.cat,
        severity: e.sev,
        title: e.title,
        description: e.desc,
        isResolved: i % 2 === 0,
        resolvedAt: i % 2 === 0 ? date : null,
        createdById: adminId
      }
    });
  }
}

async function seedSiteMemos(rabId: string, adminId: string): Promise<void> {
  const year = new Date().getFullYear();
  const memos = [
    { num: 'SM-IN-' + year + '-001', dir: 'INCOMING' as const, cat: 'INSTRUKSI' as const, stat: 'CLOSED' as const, subj: 'Perubahan Desain Partisi Lantai 2', from: 'Klien', to: 'PT Sanata Construction' },
    { num: 'SM-IN-' + year + '-002', dir: 'INCOMING' as const, cat: 'KOMPLAIN' as const, stat: 'IN_PROGRESS' as const, subj: 'Permintaan Percepatan Jadwal', from: 'Klien', to: 'PT Sanata Construction' },
    { num: 'SM-OUT-' + year + '-001', dir: 'OUTGOING' as const, cat: 'APPROVAL' as const, stat: 'CLOSED' as const, subj: 'Persetujuan Perubahan Material', from: 'PT Sanata Construction', to: 'Klien' },
    { num: 'SM-OUT-' + year + '-002', dir: 'OUTGOING' as const, cat: 'LAINNYA' as const, stat: 'CLOSED' as const, subj: 'Jadwal Inspection Structure', from: 'PT Sanata Construction', to: 'Konsultan' },
  ];
  for (const m of memos) {
    await prisma.siteMemo.upsert({
      where: { number: m.num },
      update: { subject: m.subj },
      create: {
        rabId,
        number: m.num,
        direction: m.dir,
        category: m.cat,
        status: m.stat,
        subject: m.subj,
        body: 'Detail memo untuk: ' + m.subj + '. Mohon ditindaklanjuti sesuai prosedur.',
        fromParty: m.from,
        toParty: m.to,
        letterDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        closedAt: m.stat === 'CLOSED' ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) : null,
        createdById: adminId
      }
    });
  }
}

async function seedSubmissions(rabId: string, adminId: string): Promise<void> {
  const year = new Date().getFullYear();
  const subs = [
    { num: 'SUB-' + year + '-001', type: 'MATERIAL' as const, stat: 'APPROVED_CLIENT' as const, title: 'Pengadaan Steel Beam WF 300', reason: 'Perubahan desain struktural', days: 14, cost: 285000000 },
    { num: 'SUB-' + year + '-002', type: 'WAKTU' as const, stat: 'SUBMITTED' as const, title: 'Perpanjangan Waktu 14 Hari', reason: 'Keterlambatan pengiriman material', days: 14, cost: 0 },
    { num: 'SUB-' + year + '-003', type: 'ALAT' as const, stat: 'DRAFT' as const, title: 'Sewa Tower Crane', reason: 'Perlu crane tambahan', days: 0, cost: 95000000 },
  ];
  for (const s of subs) {
    await prisma.projectSubmission.upsert({
      where: { number: s.num },
      update: { title: s.title },
      create: {
        id: rabId + '-' + s.num,
        rabId,
        number: s.num,
        type: s.type,
        status: s.stat,
        title: s.title,
        reason: s.reason,
        requestedDays: s.days || null,
        neededDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        estimatedCost: s.cost,
        requestedById: adminId,
        submittedAt: s.stat !== 'DRAFT' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null,
        reviewedAt: s.stat === 'APPROVED_CLIENT' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
        reviewNote: s.stat === 'APPROVED_CLIENT' ? 'Disetujui' : null,
        clientDecidedAt: s.stat === 'APPROVED_CLIENT' ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null,
        clientDecidedBy: s.stat === 'APPROVED_CLIENT' ? 'Klien' : null,
      }
    });
  }
}

async function seedLetters(rabId: string, adminId: string): Promise<void> {
  const year = new Date().getFullYear();
  const spkNum = 'SPK-' + year + '-001';
  const invNum = 'INV-' + year + '-001';
  await prisma.projectLetter.upsert({
    where: { number: spkNum },
    update: { subject: 'Surat Perjanjian Kerja' },
    create: {
      id: rabId + '-' + spkNum,
      rabId,
      number: spkNum,
      type: 'SPK',
      status: 'SIGNED',
      subject: 'Surat Perjanjian Kerja Pembangunan',
      letterDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      issuedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      signedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      recipientName: 'Klien',
      signerName: 'Ir. Hendra Kusuma',
      signerTitle: 'Direktur Utama',
      amount: 538350000,
      taxAmount: 53350000,
      totalAmount: 538350000,
      amountInWords: 'Lima ratus tiga puluh delapan juta tiga ratus lima puluh ribu rupiah',
      body: { clauses: [{ title: 'Pasal 1', text: 'Lingkup pekerjaan' }, { title: 'Pasal 2', text: 'Nilai kontrak' }] },
      createdById: adminId
    }
  });
  await prisma.projectLetter.upsert({
    where: { number: invNum },
    update: { subject: 'Invoice Termin 1' },
    create: {
      id: rabId + '-' + invNum,
      rabId,
      number: invNum,
      type: 'INVOICE',
      status: 'PAID',
      subject: 'Invoice Termin 1 - Progress 25%',
      letterDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      recipientName: 'Klien',
      signerName: 'Ir. Hendra Kusuma',
      signerTitle: 'Direktur Utama',
      amount: 134587500,
      taxAmount: 14804625,
      totalAmount: 149392125,
      amountInWords: 'Seratus empat puluh sembilan juta tiga ratus sembilan puluh dua ribu seratus dua puluh lima rupiah',
      body: { lines: [{ description: 'Progress 25%', amount: 134587500 }] },
      createdById: adminId
    }
  });
}

async function seedBillings(rabId: string, adminId: string): Promise<void> {
  const year = new Date().getFullYear();
  const billNum = 'BILL-' + year + '-001';
  await prisma.progressBilling.upsert({
    where: { number: billNum },
    update: { status: 'PAID' },
    create: {
      id: rabId + '-' + billNum,
      rabId,
      number: billNum,
      status: 'PAID',
      periodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      cumulativeValue: 134587500,
      previousValue: 0,
      currentValue: 134587500,
      retentionPct: 5,
      retentionAmount: 6729375,
      taxPct: 11,
      taxAmount: 14804625,
      netAmount: 149392125,
      snapshot: {},
      createdById: adminId
    }
  });
}

main()
  .then(() => {
    console.log('Seed complete!');
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
