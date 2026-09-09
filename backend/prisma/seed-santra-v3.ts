/**
 * SANTRA Complete Seeder v3
 * Seeds complete project data including Kurva S, Assignments, Execution Logs
 * Run: npx tsx prisma/seed-santra-v3.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SANTRA Complete Seeder v3');


  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = adminUser?.id || '';
  if (!adminId) { console.error('No admin user found.'); return; }

  // ============================================
  // 1. SEED RABs (5 Projects)
  // ============================================
  console.log('Step 1: Seeding RAB Projects...');

  const rab1 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-001' },
    update: { title: 'Pembangunan Gedung Perkantoran 4 Lantai', status: 'APPROVED', scheduleStart: new Date('2026-02-01') },
    create: {
      number: 'RAB-2026-001', title: 'Pembangunan Gedung Perkantoran 4 Lantai',
      clientName: 'PT Nusantara Realty Indonesia', location: 'Jl. Sudirman No. 45, Jakarta Selatan',
      projectDate: new Date('2026-01-15'), scheduleStart: new Date('2026-02-01'), status: 'APPROVED',
      taxPct: 11, subtotal: 4850000000, discountAmount: 0, taxAmount: 533500000, total: 5383500000,
      restDays: [0], createdById: adminId,
    },
  });
  console.log('RAB-001:', rab1.title);

  const rab2 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-002' },
    update: { title: 'Renovasi & Perluasan Rumah Tinggal', status: 'APPROVED', scheduleStart: new Date('2026-06-15') },
    create: {
      number: 'RAB-2026-002', title: 'Renovasi & Perluasan Rumah Tinggal Pak Budi',
      clientName: 'Budi Santoso', location: 'Jl. Melati No. 8, Jakarta Selatan',
      projectDate: new Date('2026-06-01'), scheduleStart: new Date('2026-06-15'), status: 'APPROVED',
      taxPct: 11, subtotal: 765000000, discountAmount: 0, taxAmount: 84150000, total: 849150000,
      restDays: [0], createdById: adminId,
    },
  });
  console.log('RAB-002:', rab2.title);

  const rab3 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-003' },
    update: { title: 'Pembangunan Ruko 3 Lantai', status: 'REVIEW', scheduleStart: new Date('2026-07-15') },
    create: {
      number: 'RAB-2026-003', title: 'Pembangunan Ruko 3 Lantai',
      clientName: 'CV Maju Jaya', location: 'Jl. Gatot Subroto No. 120, Jakarta Pusat',
      projectDate: new Date('2026-07-01'), scheduleStart: new Date('2026-07-15'), status: 'REVIEW',
      taxPct: 11, subtotal: 1250000000, discountAmount: 25000000, taxAmount: 134750000, total: 1360750000,
      restDays: [0], createdById: adminId,
    },
  });
  console.log('RAB-003:', rab3.title);

  const rab4 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-004' },
    update: { title: 'Renovasi Interior Kantor PT Sejahtera', status: 'DRAFT', scheduleStart: new Date('2026-08-15') },
    create: {
      number: 'RAB-2026-004', title: 'Renovasi Interior Kantor PT Sejahtera',
      clientName: 'PT Sejahtera Abadi', location: 'Jl. HR Rasuna Said Kav. C-17, Jakarta Selatan',
      projectDate: new Date('2026-08-01'), scheduleStart: new Date('2026-08-15'), status: 'DRAFT',
      taxPct: 11, subtotal: 450000000, discountAmount: 0, taxAmount: 49500000, total: 499500000,
      restDays: [0], createdById: adminId,
    },
  });
  console.log('RAB-004:', rab4.title);

  const rab5 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-005' },
    update: { title: 'Pembangunan Pabrik Garmen', status: 'DRAFT', scheduleStart: new Date('2026-09-15') },
    create: {
      number: 'RAB-2026-005', title: 'Pembangunan Pabrik Garmen',
      clientName: 'PT Textile Indonesia', location: 'Kawasan Industri MM2100, Cikarang',
      projectDate: new Date('2026-09-01'), scheduleStart: new Date('2026-09-15'), status: 'DRAFT',
      taxPct: 11, subtotal: 8750000000, discountAmount: 175000000, taxAmount: 943250000, total: 9519250000,
      restDays: [0], createdById: adminId,
    },
  });
  console.log('RAB-005:', rab5.title);
  console.log('Total RABs:', await prisma.rab.count());

  // ============================================
  // 2. SEED RAB SECTIONS & ITEMS (with Schedule)
  // ============================================
  console.log('\nStep 2: Seeding RAB Sections & Items...');

  // RAB-001 Sections & Items with Schedule
  let existingSections = await prisma.rabSection.count({ where: { rabId: rab1.id } });
  if (existingSections === 0) {
    const s1a = await prisma.rabSection.create({ data: { rabId: rab1.id, name: 'Pekerjaan Struktur', order: 1 } });
    const s1b = await prisma.rabSection.create({ data: { rabId: rab1.id, name: 'Pekerjaan Arsitektur', order: 2 } });
    const s1c = await prisma.rabSection.create({ data: { rabId: rab1.id, name: 'Pekerjaan MEP', order: 3 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s1a.id, description: 'Pekerjaan pondasi Strauss pile D300', unit: 'm', volume: 120, unitPrice: 850000, amount: 102000000, startOffsetDays: 0, durationDays: 43 },
      { sectionId: s1a.id, description: 'Pekerjaan sloof 30x50 cm', unit: 'm3', volume: 24, unitPrice: 2500000, amount: 60000000, startOffsetDays: 43, durationDays: 21 },
      { sectionId: s1a.id, description: 'Pekerjaan kolom utama 40x40 cm', unit: 'm3', volume: 48, unitPrice: 3200000, amount: 153600000, startOffsetDays: 64, durationDays: 45 },
      { sectionId: s1a.id, description: 'Pekerjaan balok 30x50 cm', unit: 'm3', volume: 36, unitPrice: 2800000, amount: 100800000, startOffsetDays: 109, durationDays: 35 },
      { sectionId: s1a.id, description: 'Pekerjaan plat lantai tebal 12 cm', unit: 'm2', volume: 960, unitPrice: 385000, amount: 369600000, startOffsetDays: 144, durationDays: 60 },
      { sectionId: s1b.id, description: 'Pasangan dinding bata merah 1PC:5PP', unit: 'm2', volume: 1800, unitPrice: 95000, amount: 171000000, startOffsetDays: 160, durationDays: 60 },
      { sectionId: s1b.id, description: 'Plesteran dinding dalam', unit: 'm2', volume: 3600, unitPrice: 65000, amount: 234000000, startOffsetDays: 220, durationDays: 45 },
      { sectionId: s1b.id, description: 'Pengecatan dinding dalam', unit: 'm2', volume: 3600, unitPrice: 45000, amount: 162000000, startOffsetDays: 265, durationDays: 30 },
      { sectionId: s1b.id, description: 'Pemasangan kusen aluminium', unit: 'unit', volume: 24, unitPrice: 3500000, amount: 84000000, startOffsetDays: 240, durationDays: 20 },
      { sectionId: s1c.id, description: 'Instalasi listrik lengkap', unit: 'ls', volume: 1, unitPrice: 480000000, amount: 480000000, startOffsetDays: 180, durationDays: 90 },
      { sectionId: s1c.id, description: 'Sistem plumbing & drainase', unit: 'ls', volume: 1, unitPrice: 320000000, amount: 320000000, startOffsetDays: 180, durationDays: 90 },
      { sectionId: s1c.id, description: 'AC split 1 PK', unit: 'unit', volume: 16, unitPrice: 7500000, amount: 120000000, startOffsetDays: 240, durationDays: 45 },
    ]});
    console.log('RAB-001 sections & items created');
  }

  // RAB-002 Sections & Items
  existingSections = await prisma.rabSection.count({ where: { rabId: rab2.id } });
  if (existingSections === 0) {
    const s2a = await prisma.rabSection.create({ data: { rabId: rab2.id, name: 'Pekerjaan Struktur & Pondasi', order: 1 } });
    const s2b = await prisma.rabSection.create({ data: { rabId: rab2.id, name: 'Pekerjaan Finishing', order: 2 } });
    const s2c = await prisma.rabSection.create({ data: { rabId: rab2.id, name: 'Pekerjaan Atap & Plumbing', order: 3 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s2a.id, description: 'Pekerjaan pembongkaran dinding lama', unit: 'm2', volume: 45, unitPrice: 85000, amount: 3825000, startOffsetDays: 0, durationDays: 15 },
      { sectionId: s2a.id, description: 'Pondasi footplat 60x60 cm', unit: 'unit', volume: 8, unitPrice: 1200000, amount: 9600000, startOffsetDays: 14, durationDays: 11 },
      { sectionId: s2a.id, description: 'Kolom praktis 15x15 cm', unit: 'm', volume: 40, unitPrice: 150000, amount: 6000000, startOffsetDays: 25, durationDays: 14 },
      { sectionId: s2a.id, description: 'Sloof 20x30 cm', unit: 'm3', volume: 6, unitPrice: 2800000, amount: 16800000, startOffsetDays: 39, durationDays: 15 },
      { sectionId: s2a.id, description: 'Dinding batako 10x20x40 cm', unit: 'm2', volume: 120, unitPrice: 95000, amount: 11400000, startOffsetDays: 54, durationDays: 20 },
      { sectionId: s2b.id, description: 'Plesteran dinding baru', unit: 'm2', volume: 240, unitPrice: 65000, amount: 15600000, startOffsetDays: 74, durationDays: 19 },
      { sectionId: s2b.id, description: 'Pengecatan dinding interior', unit: 'm2', volume: 320, unitPrice: 45000, amount: 14400000, startOffsetDays: 93, durationDays: 19 },
      { sectionId: s2b.id, description: 'Pemasangan lantai keramik 60x60 cm', unit: 'm2', volume: 95, unitPrice: 185000, amount: 17575000, startOffsetDays: 112, durationDays: 15 },
      { sectionId: s2c.id, description: 'Rangka atap baja ringan', unit: 'm2', volume: 80, unitPrice: 165000, amount: 13200000, startOffsetDays: 74, durationDays: 14 },
      { sectionId: s2c.id, description: 'Penutup atap genteng beton', unit: 'm2', volume: 80, unitPrice: 125000, amount: 10000000, startOffsetDays: 88, durationDays: 12 },
    ]});
    console.log('RAB-002 sections & items created');
  }

  // RAB-003 Sections & Items
  existingSections = await prisma.rabSection.count({ where: { rabId: rab3.id } });
  if (existingSections === 0) {
    const s3a = await prisma.rabSection.create({ data: { rabId: rab3.id, name: 'Pekerjaan Persiapan & Pondasi', order: 1 } });
    const s3b = await prisma.rabSection.create({ data: { rabId: rab3.id, name: 'Pekerjaan Struktur', order: 2 } });
    const s3c = await prisma.rabSection.create({ data: { rabId: rab3.id, name: 'Pekerjaan Arsitektur', order: 3 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s3a.id, description: 'Pembersihan lokasi', unit: 'ls', volume: 1, unitPrice: 5000000, amount: 5000000, startOffsetDays: 0, durationDays: 2 },
      { sectionId: s3a.id, description: 'Pondasi Strauss pile D400', unit: 'm', volume: 80, unitPrice: 950000, amount: 76000000, startOffsetDays: 2, durationDays: 28 },
      { sectionId: s3a.id, description: 'Sloof 25x40 cm', unit: 'm3', volume: 15, unitPrice: 2200000, amount: 33000000, startOffsetDays: 30, durationDays: 10 },
      { sectionId: s3b.id, description: 'Kolom 30x30 cm', unit: 'm3', volume: 28, unitPrice: 3000000, amount: 84000000, startOffsetDays: 40, durationDays: 28 },
      { sectionId: s3b.id, description: 'Balok 25x40 cm', unit: 'm3', volume: 22, unitPrice: 2600000, amount: 57200000, startOffsetDays: 68, durationDays: 21 },
      { sectionId: s3b.id, description: 'Plat lantai 12 cm', unit: 'm2', volume: 450, unitPrice: 380000, amount: 171000000, startOffsetDays: 89, durationDays: 35 },
      { sectionId: s3c.id, description: 'Dinding batako', unit: 'm2', volume: 650, unitPrice: 85000, amount: 55250000, startOffsetDays: 124, durationDays: 30 },
      { sectionId: s3c.id, description: 'Plesteran & acian', unit: 'm2', volume: 1300, unitPrice: 55000, amount: 71500000, startOffsetDays: 154, durationDays: 25 },
      { sectionId: s3c.id, description: 'Kusen aluminium & kaca', unit: 'ls', volume: 1, unitPrice: 95000000, amount: 95000000, startOffsetDays: 179, durationDays: 21 },
    ]});
    console.log('RAB-003 sections & items created');
  }

  // RAB-004 Sections & Items
  existingSections = await prisma.rabSection.count({ where: { rabId: rab4.id } });
  if (existingSections === 0) {
    const s4a = await prisma.rabSection.create({ data: { rabId: rab4.id, name: 'Pekerjaan Demolisi', order: 1 } });
    const s4b = await prisma.rabSection.create({ data: { rabId: rab4.id, name: 'Pekerjaan Interior', order: 2 } });
    const s4c = await prisma.rabSection.create({ data: { rabId: rab4.id, name: 'Pekerjaan Elektrikal', order: 3 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s4a.id, description: 'Pembongkaran dinding partisi lama', unit: 'm2', volume: 120, unitPrice: 45000, amount: 5400000, startOffsetDays: 0, durationDays: 5 },
      { sectionId: s4a.id, description: 'Pembongkaran plafon lama', unit: 'm2', volume: 200, unitPrice: 25000, amount: 5000000, startOffsetDays: 5, durationDays: 5 },
      { sectionId: s4b.id, description: 'Partisi gypsum 2 sisi', unit: 'm2', volume: 180, unitPrice: 185000, amount: 33300000, startOffsetDays: 10, durationDays: 18 },
      { sectionId: s4b.id, description: 'Plafond gypsum 120x240', unit: 'm2', volume: 200, unitPrice: 125000, amount: 25000000, startOffsetDays: 28, durationDays: 12 },
      { sectionId: s4b.id, description: 'Lantai vinyl homogeneous', unit: 'm2', volume: 180, unitPrice: 350000, amount: 63000000, startOffsetDays: 40, durationDays: 10 },
      { sectionId: s4c.id, description: 'Instalasi titik lampu LED', unit: 'titik', volume: 45, unitPrice: 350000, amount: 15750000, startOffsetDays: 10, durationDays: 15 },
      { sectionId: s4c.id, description: 'Stop kontak & saklar', unit: 'titik', volume: 24, unitPrice: 175000, amount: 4200000, startOffsetDays: 25, durationDays: 7 },
      { sectionId: s4c.id, description: 'AC Cassette 2 PK', unit: 'unit', volume: 4, unitPrice: 28000000, amount: 112000000, startOffsetDays: 32, durationDays: 8 },
    ]});
    console.log('RAB-004 sections & items created');
  }

  // RAB-005 Sections & Items
  existingSections = await prisma.rabSection.count({ where: { rabId: rab5.id } });
  if (existingSections === 0) {
    const s5a = await prisma.rabSection.create({ data: { rabId: rab5.id, name: 'Pekerjaan Pondasi', order: 1 } });
    const s5b = await prisma.rabSection.create({ data: { rabId: rab5.id, name: 'Pekerjaan Struktur Baja', order: 2 } });
    const s5c = await prisma.rabSection.create({ data: { rabId: rab5.id, name: 'Pekerjaan Penutup Atap & Dinding', order: 3 } });
    const s5d = await prisma.rabSection.create({ data: { rabId: rab5.id, name: 'Pekerjaan Lantai', order: 4 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s5a.id, description: 'Pondasi tiang pancang D500', unit: 'm', volume: 200, unitPrice: 1800000, amount: 360000000, startOffsetDays: 0, durationDays: 45 },
      { sectionId: s5a.id, description: 'Poer 100x100x80 cm', unit: 'unit', volume: 48, unitPrice: 2500000, amount: 120000000, startOffsetDays: 45, durationDays: 20 },
      { sectionId: s5b.id, description: 'Kolom WF 300x150', unit: 'ton', volume: 15, unitPrice: 28000000, amount: 420000000, startOffsetDays: 65, durationDays: 30 },
      { sectionId: s5b.id, description: 'Gording CNP 200', unit: 'ton', volume: 5, unitPrice: 25000000, amount: 125000000, startOffsetDays: 95, durationDays: 15 },
      { sectionId: s5b.id, description: 'Kuda-kuda WF 400x200', unit: 'ton', volume: 20, unitPrice: 30000000, amount: 600000000, startOffsetDays: 95, durationDays: 35 },
      { sectionId: s5c.id, description: 'Atap spandek 0.45mm', unit: 'm2', volume: 2500, unitPrice: 185000, amount: 462500000, startOffsetDays: 130, durationDays: 45 },
      { sectionId: s5c.id, description: 'Dinding panel sandwich 50mm', unit: 'm2', volume: 1200, unitPrice: 450000, amount: 540000000, startOffsetDays: 130, durationDays: 60 },
      { sectionId: s5d.id, description: 'Lantai beton industri 20cm', unit: 'm2', volume: 2500, unitPrice: 450000, amount: 1125000000, startOffsetDays: 65, durationDays: 60 },
      { sectionId: s5d.id, description: 'Epoxy coating lantai', unit: 'm2', volume: 2500, unitPrice: 125000, amount: 312500000, startOffsetDays: 175, durationDays: 20 },
    ]});
    console.log('RAB-005 sections & items created');
  }

  console.log('Total Sections:', await prisma.rabSection.count());
  console.log('Total Items:', await prisma.rabItem.count());

  // ============================================
  // 3. SEED WORKERS
  // ============================================
  console.log('\nStep 3: Seeding Workers...');
  const workers = await prisma.worker.findMany({ take: 10 });
  const mandors = workers.filter(w => w.role === 'MANDOR');
  const tukangs = workers.filter(w => w.role.includes('TUKANG'));
  const pekerjas = workers.filter(w => w.role === 'PEKERJA' || w.role === 'OPERATOR');
  console.log('Workers found:', workers.length, 'Mandors:', mandors.length, 'Tukangs:', tukangs.length);

  // ============================================
  // 4. SEED JOB ASSIGNMENTS (Multiple per RAB)
  // ============================================
  console.log('\nStep 4: Seeding Job Assignments...');
  const existingAssignments = await prisma.jobAssignment.count();
  if (existingAssignments === 0 && workers.length > 0) {
    // RAB-001 Assignments
    const jobs1 = [
      { assignmentCode: 'JOB-001', rabId: rab1.id, wbsCode: 'WBS-01.01', workItem: 'Pekerjaan pondasi Strauss pile D300', status: 'COMPLETED' as const, responsiblePersonId: tukangs[0]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-02-01'), plannedEnd: new Date('2026-03-15'), actualStart: new Date('2026-02-01'), actualEnd: new Date('2026-03-10'), progressPct: 100 },
      { assignmentCode: 'JOB-002', rabId: rab1.id, wbsCode: 'WBS-01.02', workItem: 'Pekerjaan sloof 30x50 cm', status: 'COMPLETED' as const, responsiblePersonId: tukangs[1]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-03-11'), plannedEnd: new Date('2026-04-01'), actualStart: new Date('2026-03-11'), actualEnd: new Date('2026-03-28'), progressPct: 100 },
      { assignmentCode: 'JOB-003', rabId: rab1.id, wbsCode: 'WBS-01.03', workItem: 'Pekerjaan kolom utama 40x40 cm', status: 'COMPLETED' as const, responsiblePersonId: tukangs[2]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-04-01'), plannedEnd: new Date('2026-05-15'), actualStart: new Date('2026-04-01'), actualEnd: new Date('2026-05-10'), progressPct: 100 },
      { assignmentCode: 'JOB-004', rabId: rab1.id, wbsCode: 'WBS-01.04', workItem: 'Pekerjaan balok 30x50 cm', status: 'COMPLETED' as const, responsiblePersonId: tukangs[3]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-05-11'), plannedEnd: new Date('2026-06-15'), actualStart: new Date('2026-05-11'), actualEnd: new Date('2026-06-12'), progressPct: 100 },
      { assignmentCode: 'JOB-005', rabId: rab1.id, wbsCode: 'WBS-01.05', workItem: 'Pekerjaan plat lantai tebal 12 cm', status: 'IN_PROGRESS' as const, responsiblePersonId: tukangs[4]?.id, responsibleMandorId: mandors[1]?.id, plannedStart: new Date('2026-06-16'), plannedEnd: new Date('2026-08-15'), actualStart: new Date('2026-06-16'), progressPct: 85 },
      { assignmentCode: 'JOB-006', rabId: rab1.id, wbsCode: 'WBS-02.01', workItem: 'Pasangan dinding bata merah 1PC:5PP', status: 'IN_PROGRESS' as const, responsiblePersonId: tukangs[5]?.id, responsibleMandorId: mandors[1]?.id, plannedStart: new Date('2026-07-01'), plannedEnd: new Date('2026-08-30'), actualStart: new Date('2026-07-01'), progressPct: 60 },
      { assignmentCode: 'JOB-007', rabId: rab1.id, wbsCode: 'WBS-02.02', workItem: 'Plesteran dinding dalam', status: 'PENDING' as const, responsiblePersonId: tukangs[6]?.id, responsibleMandorId: mandors[1]?.id, plannedStart: new Date('2026-08-01'), plannedEnd: new Date('2026-09-15'), progressPct: 0 },
      { assignmentCode: 'JOB-008', rabId: rab1.id, wbsCode: 'WBS-02.03', workItem: 'Pengecatan dinding dalam', status: 'PENDING' as const, responsiblePersonId: tukangs[7]?.id, responsibleMandorId: mandors[1]?.id, plannedStart: new Date('2026-09-01'), plannedEnd: new Date('2026-10-15'), progressPct: 0 },
    ];

    // RAB-002 Assignments
    const jobs2 = [
      { assignmentCode: 'JOB-101', rabId: rab2.id, wbsCode: 'WBS-01.01', workItem: 'Pekerjaan pembongkaran dinding lama', status: 'COMPLETED' as const, responsiblePersonId: tukangs[0]?.id, responsibleMandorId: mandors[2]?.id, plannedStart: new Date('2026-06-15'), plannedEnd: new Date('2026-06-30'), actualStart: new Date('2026-06-15'), actualEnd: new Date('2026-06-28'), progressPct: 100 },
      { assignmentCode: 'JOB-102', rabId: rab2.id, wbsCode: 'WBS-01.02', workItem: 'Pondasi footplat 60x60 cm', status: 'COMPLETED' as const, responsiblePersonId: tukangs[1]?.id, responsibleMandorId: mandors[2]?.id, plannedStart: new Date('2026-06-29'), plannedEnd: new Date('2026-07-10'), actualStart: new Date('2026-06-29'), actualEnd: new Date('2026-07-08'), progressPct: 100 },
      { assignmentCode: 'JOB-103', rabId: rab2.id, wbsCode: 'WBS-01.03', workItem: 'Kolom praktis 15x15 cm', status: 'COMPLETED' as const, responsiblePersonId: tukangs[2]?.id, responsibleMandorId: mandors[2]?.id, plannedStart: new Date('2026-07-11'), plannedEnd: new Date('2026-07-25'), actualStart: new Date('2026-07-11'), actualEnd: new Date('2026-07-22'), progressPct: 100 },
      { assignmentCode: 'JOB-104', rabId: rab2.id, wbsCode: 'WBS-01.04', workItem: 'Sloof 20x30 cm', status: 'IN_PROGRESS' as const, responsiblePersonId: tukangs[3]?.id, responsibleMandorId: mandors[2]?.id, plannedStart: new Date('2026-07-26'), plannedEnd: new Date('2026-08-10'), actualStart: new Date('2026-07-26'), progressPct: 45 },
      { assignmentCode: 'JOB-105', rabId: rab2.id, wbsCode: 'WBS-02.01', workItem: 'Dinding batako 10x20x40 cm', status: 'PENDING' as const, responsiblePersonId: tukangs[4]?.id, responsibleMandorId: mandors[2]?.id, plannedStart: new Date('2026-08-11'), plannedEnd: new Date('2026-08-31'), progressPct: 0 },
    ];

    // RAB-003 Assignments
    const jobs3 = [
      { assignmentCode: 'JOB-201', rabId: rab3.id, wbsCode: 'WBS-01.01', workItem: 'Pembersihan lokasi', status: 'COMPLETED' as const, responsiblePersonId: pekerjas[0]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-07-15'), plannedEnd: new Date('2026-07-17'), actualStart: new Date('2026-07-15'), actualEnd: new Date('2026-07-16'), progressPct: 100 },
      { assignmentCode: 'JOB-202', rabId: rab3.id, wbsCode: 'WBS-01.02', workItem: 'Pondasi Strauss pile D400', status: 'IN_PROGRESS' as const, responsiblePersonId: tukangs[0]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-07-18'), plannedEnd: new Date('2026-08-15'), actualStart: new Date('2026-07-18'), progressPct: 70 },
      { assignmentCode: 'JOB-203', rabId: rab3.id, wbsCode: 'WBS-01.03', workItem: 'Sloof 25x40 cm', status: 'PENDING' as const, responsiblePersonId: tukangs[1]?.id, responsibleMandorId: mandors[0]?.id, plannedStart: new Date('2026-08-15'), plannedEnd: new Date('2026-08-25'), progressPct: 0 },
    ];

    for (const job of jobs1) await prisma.jobAssignment.create({ data: { ...job, priority: 1 } });
    for (const job of jobs2) await prisma.jobAssignment.create({ data: { ...job, priority: 1 } });
    for (const job of jobs3) await prisma.jobAssignment.create({ data: { ...job, priority: 1 } });

    console.log('Job assignments created:', jobs1.length + jobs2.length + jobs3.length);
  } else {
    console.log('Job assignments existing:', existingAssignments);
  }

  // ============================================
  // 5. SEED EXECUTION LOGS
  // ============================================
  console.log('\nStep 5: Seeding Execution Logs...');
  const execCount = await prisma.executionLog.count();
  if (execCount === 0) {
    const assignments = await prisma.jobAssignment.findMany({ where: { status: 'COMPLETED' } });
    let execTotal = 0;

    for (const assignment of assignments) {
      if (!assignment.actualStart) continue;
      const startDate = new Date(assignment.actualStart);
      const endDate = assignment.actualEnd || new Date(assignment.plannedEnd || Date.now());
      const days = Math.min(14, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));

      for (let i = 0; i < days; i++) {
        const execDate = new Date(startDate);
        execDate.setDate(execDate.getDate() + i);
        if (execDate > new Date()) continue;

        const counter = await prisma.santraCounter.upsert({
          where: { prefix: 'LOG' },
          create: { prefix: 'LOG', lastSeq: 0 },
          update: { lastSeq: { increment: 1 } },
        });

        const workerId = assignment.responsiblePersonId || workers[0]?.id;
        if (!workerId) continue;

        await prisma.executionLog.create({
          data: {
            logCode: `LOG-2026-${String(counter.lastSeq).padStart(4, '0')}`,
            assignmentId: assignment.id,
            workerId,
            logDate: execDate,
            description: `Pekerjaan ${assignment.workItem} - hari ke-${i + 1}`,
            progressPct: Math.round(((i + 1) / days) * 100),
            locationName: 'Proyek',
          },
        });
        execTotal++;
      }
    }
    console.log('Execution logs created:', execTotal);
  } else {
    console.log('Execution logs existing:', execCount);
  }

  // ============================================
  // 6. SEED QC RECORDS
  // ============================================
  console.log('\nStep 6: Seeding QC Records...');
  const qcCount = await prisma.qcRecord.count();
  if (qcCount === 0) {
    const assignments = await prisma.jobAssignment.findMany({ take: 15 });

    for (let i = 0; i < 25; i++) {
      const assignment = assignments[i % assignments.length];
      if (!assignment || !workers[0]) continue;

      const counter = await prisma.santraCounter.upsert({
        where: { prefix: 'QC' },
        create: { prefix: 'QC', lastSeq: 0 },
        update: { lastSeq: { increment: 1 } },
      });

      const result = i < 20 ? 'PASS' : i < 23 ? 'REWORK' : 'FAIL';

      await prisma.qcRecord.create({
        data: {
          qcCode: `QC-2026-${String(counter.lastSeq).padStart(4, '0')}`,
          assignmentId: assignment.id,
          workerId: workers[i % workers.length].id,
          checkDate: new Date(2026, 6, 1 + i),
          itemDesc: `Item QC #${i + 1}`,
          criteria: 'Sesuai spesifikasi teknis',
          measurement: 'OK',
          result: result as 'PASS' | 'FAIL' | 'REWORK',
        },
      });
    }
    console.log('QC records created: 25');
  } else {
    console.log('QC records existing:', qcCount);
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(50));
  const [finalRabs, finalSections, finalItems, finalAssignments, finalExec, finalQc] = await Promise.all([
    prisma.rab.count(),
    prisma.rabSection.count(),
    prisma.rabItem.count(),
    prisma.jobAssignment.count(),
    prisma.executionLog.count(),
    prisma.qcRecord.count(),
  ]);

  console.log(`  RAB Projects: ${finalRabs}`);
  console.log(`  RAB Sections: ${finalSections}`);
  console.log(`  RAB Items: ${finalItems}`);
  console.log(`  Job Assignments: ${finalAssignments}`);
  console.log(`  Execution Logs: ${finalExec}`);
  console.log(`  QC Records: ${finalQc}`);
  console.log('\n✅ SANTRA Complete Seeder v3 done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
