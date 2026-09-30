/**
 * seed-rab-full.ts
 * Comprehensive RAB seed with all project modules
 * - RABs across all statuses (DRAFT, REVIEW, APPROVED, REJECTED, ARCHIVED, COMPLETED)
 * - Baseline schedules for S-curve
 * - Schedule metadata on items
 * - Progress tracking (opname)
 * - Holidays
 * - Daily reports with workforce/weather
 * - Submissions, logbook, memos, letters, billings
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRabFull(adminId: string) {
  console.log("=== Starting seedRabFull ===");

  const hendra = await prisma.signatory.findFirst({ where: { name: { contains: "Hendra" } } });
  const budi   = await prisma.signatory.findFirst({ where: { name: { contains: "Budi" } } });
  const rina   = await prisma.signatory.findFirst({ where: { name: { contains: "Rina" } } });
  // ===== 1. RAB-2026-001: APPROVED (complex S-curve, active project) =====
  const rab1 = await prisma.rab.findFirst({ where: { number: "RAB-2026-001" } });
  if (rab1) {
    await prisma.rab.update({ where: { id: rab1.id }, data: { status: "APPROVED", scheduleStart: new Date("2026-02-01"), restDays: [0] } });

    const items1 = await prisma.rabItem.findMany({ where: { section: { rabId: rab1.id } }, orderBy: { order: "asc" } });

    // Schedule metadata per item (350-day project)
    const sched1 = [
      { startOffsetDays: 0,  durationDays: 42 },
      { startOffsetDays: 40, durationDays: 21 },
      { startOffsetDays: 58, durationDays: 44 },
      { startOffsetDays: 98, durationDays: 35 },
      { startOffsetDays: 130, durationDays: 60 },
      { startOffsetDays: 150, durationDays: 60 },
      { startOffsetDays: 200, durationDays: 90 },
      { startOffsetDays: 280, durationDays: 60 },
      { startOffsetDays: 240, durationDays: 30 },
      { startOffsetDays: 260, durationDays: 20 },
      { startOffsetDays: 200, durationDays: 90 },
      { startOffsetDays: 280, durationDays: 45 },
      { startOffsetDays: 300, durationDays: 45 },
      { startOffsetDays: 320, durationDays: 30 },
    ];

    for (let i = 0; i < items1.length && i < sched1.length; i++) {
      await prisma.rabItem.update({ where: { id: items1[i].id }, data: { startOffsetDays: sched1[i].startOffsetDays, durationDays: sched1[i].durationDays } });
    }
    console.log("Updated " + items1.length + " RAB-001 items with schedule metadata");

    // ---- Baseline S-curve ----
    const existingBaseline1 = await prisma.rabScheduleBaseline.count({ where: { rabId: rab1.id } });
    if (existingBaseline1 === 0) {
      const curve1 = [];
      const totalDays1 = 350;
      for (let d = 0; d <= totalDays1; d += 25) {
        const planned = Math.min(100, Math.round(100 * (1 - Math.pow(1 - d / totalDays1, 3))));
        curve1.push({ day: d, planned, actual: -1 });
      }
      const baselineSnapshot1 = {
        items: items1.map((item, i) => ({ id: item.id, description: item.description, amount: Number(item.amount), startOffsetDays: sched1[i]?.startOffsetDays ?? 0, durationDays: sched1[i]?.durationDays ?? 0, weight: Number(item.amount) })),
        curve: curve1,
        totalWeight: items1.reduce((s, i) => s + Number(i.amount), 0),
        totalAmount: items1.reduce((s, i) => s + Number(i.amount), 0),
      };
      await prisma.rabScheduleBaseline.create({ data: { rabId: rab1.id, name: "Baseline Rencana", capturedById: adminId, snapshot: baselineSnapshot1 as any } });
      console.log("Created baseline for RAB-2026-001 with " + curve1.length + " S-curve points");
    }

    // ---- Holidays ----
    const existingHolidays1 = await prisma.rabHoliday.count({ where: { rabId: rab1.id } });
    if (existingHolidays1 === 0) {
      await prisma.rabHoliday.createMany({ data: [
        { rabId: rab1.id, date: new Date("2026-03-20"), name: "Hari Raya Nyepi" },
        { rabId: rab1.id, date: new Date("2026-03-29"), name: "Paskah" },
        { rabId: rab1.id, date: new Date("2026-03-31"), name: "Cuti Bersama Idulfitri" },
        { rabId: rab1.id, date: new Date("2026-04-01"), name: "Idulfitri 1447 H" },
        { rabId: rab1.id, date: new Date("2026-04-02"), name: "Idulfitri 1447 H" },
        { rabId: rab1.id, date: new Date("2026-05-01"), name: "Hari Buruh" },
        { rabId: rab1.id, date: new Date("2026-05-12"), name: "Waisak 2569" },
        { rabId: rab1.id, date: new Date("2026-06-01"), name: "Pancasila" },
        { rabId: rab1.id, date: new Date("2026-08-17"), name: "HUT Kemerdekaan RI" },
      ] });
      console.log("Seeded holidays for RAB-2026-001");
    }

    // ---- Progress tracking (opname) ----
    const existingProgress1 = await prisma.rabProgress.count({ where: { item: { section: { rabId: rab1.id } } } });
    if (existingProgress1 === 0 && items1.length > 0) {
      const progressEntries1 = [
        { itemIdx: 0, date: new Date("2026-03-10"), percent: 100, status: "APPROVED" },
        { itemIdx: 0, date: new Date("2026-03-05"), percent: 75,  status: "APPROVED" },
        { itemIdx: 0, date: new Date("2026-02-25"), percent: 50,  status: "APPROVED" },
        { itemIdx: 0, date: new Date("2026-02-15"), percent: 25,  status: "APPROVED" },
        { itemIdx: 1, date: new Date("2026-03-28"), percent: 100, status: "APPROVED" },
        { itemIdx: 1, date: new Date("2026-03-20"), percent: 60,  status: "APPROVED" },
        { itemIdx: 2, date: new Date("2026-05-10"), percent: 100, status: "APPROVED" },
        { itemIdx: 2, date: new Date("2026-04-25"), percent: 70,  status: "APPROVED" },
        { itemIdx: 2, date: new Date("2026-04-10"), percent: 40,  status: "APPROVED" },
        { itemIdx: 3, date: new Date("2026-06-12"), percent: 100, status: "APPROVED" },
        { itemIdx: 3, date: new Date("2026-06-01"), percent: 55,  status: "APPROVED" },
        { itemIdx: 4, date: new Date("2026-08-15"), percent: 85,  status: "APPROVED" },
        { itemIdx: 4, date: new Date("2026-08-01"), percent: 60,  status: "APPROVED" },
        { itemIdx: 4, date: new Date("2026-07-15"), percent: 35,  status: "APPROVED" },
        { itemIdx: 5, date: new Date("2026-08-15"), percent: 55,  status: "APPROVED" },
        { itemIdx: 5, date: new Date("2026-08-01"), percent: 30,  status: "APPROVED" },
        { itemIdx: 6, date: new Date("2026-08-15"), percent: 5,   status: "PENDING" },
        { itemIdx: 9, date: new Date("2026-08-15"), percent: 20,  status: "APPROVED" },
        { itemIdx: 10, date: new Date("2026-08-15"), percent: 25,  status: "APPROVED" },
      ];
      for (const pe of progressEntries1) {
        if (!items1[pe.itemIdx]) continue;
        await prisma.rabProgress.create({ data: { itemId: items1[pe.itemIdx].id, date: pe.date, percent: pe.percent, status: pe.status as any, approvedById: pe.status === "APPROVED" ? adminId : null, approvedAt: pe.status === "APPROVED" ? pe.date : null, createdById: adminId } });
      }
      console.log("Seeded " + progressEntries1.length + " progress entries for RAB-2026-001");
    }
  }

  // ===== 2. RAB-2026-002: APPROVED (house renovation) =====
  const rab2 = await prisma.rab.findFirst({ where: { number: "RAB-2026-002" } });
  if (rab2) {
    await prisma.rab.update({ where: { id: rab2.id }, data: { status: "APPROVED", scheduleStart: new Date("2026-06-15"), restDays: [0] } });

    const items2 = await prisma.rabItem.findMany({ where: { section: { rabId: rab2.id } }, orderBy: { order: "asc" } });

    // Schedule: 90-day project
    const sched2 = [
      { startOffsetDays: 0,  durationDays: 15 },
      { startOffsetDays: 12, durationDays: 10 },
      { startOffsetDays: 20, durationDays: 14 },
      { startOffsetDays: 32, durationDays: 14 },
      { startOffsetDays: 44, durationDays: 20 },
      { startOffsetDays: 60, durationDays: 20 },
      { startOffsetDays: 75, durationDays: 30 },
      { startOffsetDays: 70, durationDays: 20 },
      { startOffsetDays: 65, durationDays: 15 },
      { startOffsetDays: 80, durationDays: 10 },
      { startOffsetDays: 0,  durationDays: 21 },
      { startOffsetDays: 18, durationDays: 7  },
      { startOffsetDays: 25, durationDays: 5  },
      { startOffsetDays: 50, durationDays: 14 },
      { startOffsetDays: 50, durationDays: 14 },
    ];

    for (let i = 0; i < items2.length && i < sched2.length; i++) {
      await prisma.rabItem.update({ where: { id: items2[i].id }, data: { startOffsetDays: sched2[i].startOffsetDays, durationDays: sched2[i].durationDays } });
    }
    console.log("Updated " + items2.length + " RAB-002 items with schedule metadata");

    // Baseline S-curve
    const existingBaseline2 = await prisma.rabScheduleBaseline.count({ where: { rabId: rab2.id } });
    if (existingBaseline2 === 0) {
      const curve2 = [];
      const totalDays2 = 90;
      for (let d = 0; d <= totalDays2; d += 7) {
        const planned = Math.min(100, Math.round(100 * (1 - Math.pow(1 - d / totalDays2, 3))));
        curve2.push({ day: d, planned, actual: -1 });
      }
      const baselineSnapshot2 = {
        items: items2.map((item, i) => ({ id: item.id, description: item.description, amount: Number(item.amount), startOffsetDays: sched2[i]?.startOffsetDays ?? 0, durationDays: sched2[i]?.durationDays ?? 0, weight: Number(item.amount) })),
        curve: curve2,
        totalWeight: items2.reduce((s, i) => s + Number(i.amount), 0),
        totalAmount: items2.reduce((s, i) => s + Number(i.amount), 0),
      };
      await prisma.rabScheduleBaseline.create({ data: { rabId: rab2.id, name: "Baseline Rencana", capturedById: adminId, snapshot: baselineSnapshot2 as any } });
      console.log("Created baseline for RAB-2026-002 with " + curve2.length + " S-curve points");
    }
  }

  // ===== 3. RAB-2026-003: DRAFT (pending submission) =====
  const rab3 = await prisma.rab.upsert({
    where: { number: "RAB-2026-003" },
    create: {
      number: "RAB-2026-003",
      title: "Pembangunan Pabrik Kawasan Industri MM2100",
      clientName: "PT Industrial Manufacturing Indonesia",
      location: "Kawasan Industri MM2100, Cikarang Barat, Bekasi",
      projectDate: new Date("2026-09-01"),
      scheduleStart: new Date("2026-10-01"),
      status: "DRAFT",
      subtotal: 15_500_000_000,
      discountAmount: 0,
      taxAmount: 1_705_000_000,
      total: 17_205_000_000,
      taxPct: 11,
      createdById: adminId,
    },
    update: { status: "DRAFT" },
  });

  const existingSections3 = await prisma.rabSection.count({ where: { rabId: rab3.id } });
  if (existingSections3 === 0) {
    const s3a = await prisma.rabSection.create({ data: { rabId: rab3.id, name: "Pekerjaan Persiapan", order: 1 } });
    const s3b = await prisma.rabSection.create({ data: { rabId: rab3.id, name: "Pekerjaan Struktur", order: 2 } });
    const s3c = await prisma.rabSection.create({ data: { rabId: rab3.id, name: "Pekerjaan Arsitektur", order: 3 } });
    const s3d = await prisma.rabSection.create({ data: { rabId: rab3.id, name: "Pekerjaan MEP", order: 4 } });
    const s3e = await prisma.rabSection.create({ data: { rabId: rab3.id, name: "Pekerjaan Eksternal", order: 5 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s3a.id, description: "Pemasangan bouwplank", unit: "ls", volume: 1, unitPrice: 75_000_000, amount: 75_000_000 },
      { sectionId: s3a.id, description: "Penghancuran bangunan eksisting", unit: "ls", volume: 1, unitPrice: 120_000_000, amount: 120_000_000 },
      { sectionId: s3a.id, description: "Galian tanah fondasi", unit: "m3", volume: 800, unitPrice: 95_000, amount: 76_000_000 },
      { sectionId: s3a.id, description: "Urugan pasir dan pemadatan", unit: "m3", volume: 200, unitPrice: 250_000, amount: 50_000_000 },
      { sectionId: s3b.id, description: "Pondasi Strauss pile D400", unit: "m", volume: 480, unitPrice: 1_200_000, amount: 576_000_000 },
      { sectionId: s3b.id, description: "Pondasi footplat 100x100x50", unit: "unit", volume: 64, unitPrice: 2_500_000, amount: 160_000_000 },
      { sectionId: s3b.id, description: "Sloof 40x60 cm", unit: "m3", volume: 48, unitPrice: 3_200_000, amount: 153_600_000 },
      { sectionId: s3b.id, description: "Kolom utama 50x50 cm", unit: "m3", volume: 72, unitPrice: 3_800_000, amount: 273_600_000 },
      { sectionId: s3b.id, description: "Balok struktur 40x60 cm", unit: "m3", volume: 60, unitPrice: 3_500_000, amount: 210_000_000 },
      { sectionId: s3b.id, description: "Plat lantai 12cm (wf)", unit: "m2", volume: 2400, unitPrice: 420_000, amount: 1_008_000_000 },
      { sectionId: s3b.id, description: "Pembesian (besi + upah)", unit: "kg", volume: 120000, unitPrice: 18_000, amount: 2_160_000_000 },
      { sectionId: s3c.id, description: "Pasangan dinding bata 1PC:4PP", unit: "m2", volume: 4200, unitPrice: 110_000, amount: 462_000_000 },
      { sectionId: s3c.id, description: "Plesteran + acian", unit: "m2", volume: 8400, unitPrice: 85_000, amount: 714_000_000 },
      { sectionId: s3c.id, description: "Pengecatan dinding (cat dulux)", unit: "m2", volume: 8400, unitPrice: 55_000, amount: 462_000_000 },
      { sectionId: s3c.id, description: "Pintu dan jendela aluminium", unit: "unit", volume: 48, unitPrice: 4_200_000, amount: 201_600_000 },
      { sectionId: s3d.id, description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 1_200_000_000, amount: 1_200_000_000 },
      { sectionId: s3d.id, description: "Sistem plumbing dan drainase", unit: "ls", volume: 1, unitPrice: 850_000_000, amount: 850_000_000 },
      { sectionId: s3d.id, description: "AC sentral VRV system", unit: "pk", volume: 200, unitPrice: 18_000_000, amount: 3_600_000_000 },
      { sectionId: s3d.id, description: "Fire alarm dan hydrant", unit: "ls", volume: 1, unitPrice: 450_000_000, amount: 450_000_000 },
      { sectionId: s3e.id, description: "Parker dan landscaping", unit: "ls", volume: 1, unitPrice: 480_000_000, amount: 480_000_000 },
      { sectionId: s3e.id, description: "Jalan akses dan halaman", unit: "m2", volume: 1200, unitPrice: 350_000, amount: 420_000_000 },
      { sectionId: s3e.id, description: "Pagar keliling perimeter", unit: "m", volume: 400, unitPrice: 850_000, amount: 340_000_000 },
      { sectionId: s3e.id, description: "Gerbang utama dan pos security", unit: "ls", volume: 1, unitPrice: 120_000_000, amount: 120_000_000 },
    ] });
    console.log("Seeded RAB-2026-003 (DRAFT)");
  }

  // ===== 4. RAB-2026-004: REVIEW (under client review) =====
  const rab4 = await prisma.rab.upsert({
    where: { number: "RAB-2026-004" },
    create: {
      number: "RAB-2026-004",
      title: "Renovasi Total Kantor PT Cerdas Digital",
      clientName: "PT Cerdas Digital Indonesia",
      location: "Jl. Gatot Subroto Kav. 18, Jakarta Selatan",
      projectDate: new Date("2026-08-15"),
      scheduleStart: new Date("2026-09-15"),
      status: "REVIEW",
      subtotal: 2_850_000_000,
      discountAmount: 85_500_000,
      taxAmount: 304_095_000,
      total: 3_068_595_000,
      taxPct: 11,
      discountPct: 3,
      notes: "Diskon 3% untuk pembayaran DP 40%",
      createdById: adminId,
    },
    update: { status: "REVIEW" },
  });

  const existingSections4 = await prisma.rabSection.count({ where: { rabId: rab4.id } });
  if (existingSections4 === 0) {
    const s4a = await prisma.rabSection.create({ data: { rabId: rab4.id, name: "Pekerjaan Pembongkaran", order: 1 } });
    const s4b = await prisma.rabSection.create({ data: { rabId: rab4.id, name: "Pekerjaan Struktur Retrofit", order: 2 } });
    const s4c = await prisma.rabSection.create({ data: { rabId: rab4.id, name: "Pekerjaan Arsitektur", order: 3 } });
    const s4d = await prisma.rabSection.create({ data: { rabId: rab4.id, name: "Pekerjaan MEP Upgrade", order: 4 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s4a.id, description: "Pembongkaran dinding partisi", unit: "m2", volume: 450, unitPrice: 85_000, amount: 38_250_000 },
      { sectionId: s4a.id, description: "Pembongkaran plafon existing", unit: "m2", volume: 600, unitPrice: 65_000, amount: 39_000_000 },
      { sectionId: s4a.id, description: "Pembongkaran lantai lama", unit: "m2", volume: 600, unitPrice: 75_000, amount: 45_000_000 },
      { sectionId: s4a.id, description: "Pembuangan material bekas", unit: "ls", volume: 1, unitPrice: 35_000_000, amount: 35_000_000 },
      { sectionId: s4b.id, description: "Penambahan kolom steel WF 200x100", unit: "m", volume: 48, unitPrice: 2_800_000, amount: 134_400_000 },
      { sectionId: s4b.id, description: "Bracket connection plate 10mm", unit: "unit", volume: 24, unitPrice: 1_500_000, amount: 36_000_000 },
      { sectionId: s4b.id, description: "Anchor bolt chem", unit: "set", volume: 96, unitPrice: 280_000, amount: 26_880_000 },
      { sectionId: s4b.id, description: "Steel beam WF 300x150", unit: "m", volume: 36, unitPrice: 3_200_000, amount: 115_200_000 },
      { sectionId: s4c.id, description: "Partisi gypsum 2 sisi + isolasi", unit: "m2", volume: 450, unitPrice: 280_000, amount: 126_000_000 },
      { sectionId: s4c.id, description: "Plafond gypsum 9mm + shadow line", unit: "m2", volume: 600, unitPrice: 165_000, amount: 99_000_000 },
      { sectionId: s4c.id, description: "Lantai vinyl homogen 3mm", unit: "m2", volume: 600, unitPrice: 385_000, amount: 231_000_000 },
      { sectionId: s4c.id, description: "Dinding kaca tempered 12mm", unit: "m2", volume: 80, unitPrice: 1_200_000, amount: 96_000_000 },
      { sectionId: s4c.id, description: "Pintu swing aluminium", unit: "unit", volume: 12, unitPrice: 3_200_000, amount: 38_400_000 },
      { sectionId: s4d.id, description: "AC cassette 2.5 PK", unit: "unit", volume: 12, unitPrice: 18_500_000, amount: 222_000_000 },
      { sectionId: s4d.id, description: "Ducting AC Galvanis", unit: "m2", volume: 180, unitPrice: 280_000, amount: 50_400_000 },
      { sectionId: s4d.id, description: "Instalasi Listrik baru", unit: "ls", volume: 1, unitPrice: 180_000_000, amount: 180_000_000 },
      { sectionId: s4d.id, description: "LED downlight dan track light", unit: "unit", volume: 120, unitPrice: 850_000, amount: 102_000_000 },
      { sectionId: s4d.id, description: "Smoke detector & alarm system", unit: "ls", volume: 1, unitPrice: 85_000_000, amount: 85_000_000 },
      { sectionId: s4d.id, description: "LAN cabling cat 6A", unit: "outlet", volume: 80, unitPrice: 450_000, amount: 36_000_000 },
    ] });
    console.log("Seeded RAB-2026-004 (REVIEW)");
  }

  // ===== 5. RAB-2026-005: REJECTED (by client) =====
  const rab5 = await prisma.rab.upsert({
    where: { number: "RAB-2026-005" },
    create: {
      number: "RAB-2026-005",
      title: "Pembangunan Showroom Otomotif 3 Lantai",
      clientName: "PT Auto Galeri Indonesia",
      location: "Jl. Ahmad Yani No. 88, Bandung",
      projectDate: new Date("2026-07-01"),
      status: "REJECTED",
      subtotal: 8_200_000_000,
      discountAmount: 0,
      taxAmount: 902_000_000,
      total: 9_102_000_000,
      taxPct: 11,
      notes: "Ditolak karena nilai melebihi budget client",
      createdById: adminId,
    },
    update: { status: "REJECTED" },
  });

  const existingSections5 = await prisma.rabSection.count({ where: { rabId: rab5.id } });
  if (existingSections5 === 0) {
    const s5a = await prisma.rabSection.create({ data: { rabId: rab5.id, name: "Struktur Beton", order: 1 } });
    const s5b = await prisma.rabSection.create({ data: { rabId: rab5.id, name: "Arsitektur", order: 2 } });
    const s5c = await prisma.rabSection.create({ data: { rabId: rab5.id, name: "MEP", order: 3 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s5a.id, description: "Pondasi bored pile D600", unit: "m", volume: 240, unitPrice: 1_800_000, amount: 432_000_000 },
      { sectionId: s5a.id, description: "Sloof dan pilecap", unit: "m3", volume: 180, unitPrice: 3_500_000, amount: 630_000_000 },
      { sectionId: s5a.id, description: "Kolom 50x50 cm", unit: "m3", volume: 96, unitPrice: 4_200_000, amount: 403_200_000 },
      { sectionId: s5a.id, description: "Balok 40x60 cm", unit: "m3", volume: 84, unitPrice: 3_800_000, amount: 319_200_000 },
      { sectionId: s5a.id, description: "Plat lantai 15cm", unit: "m2", volume: 1200, unitPrice: 520_000, amount: 624_000_000 },
      { sectionId: s5a.id, description: "Pembesian total", unit: "kg", volume: 85000, unitPrice: 17_500, amount: 1_487_500_000 },
      { sectionId: s5b.id, description: "Dinding curtain wall glass", unit: "m2", volume: 480, unitPrice: 2_200_000, amount: 1_056_000_000 },
      { sectionId: s5b.id, description: "Plesteran acian", unit: "m2", volume: 2400, unitPrice: 95_000, amount: 228_000_000 },
      { sectionId: s5b.id, description: "Lantai granit 60x60", unit: "m2", volume: 1200, unitPrice: 480_000, amount: 576_000_000 },
      { sectionId: s5c.id, description: "AC VRV system", unit: "pk", volume: 120, unitPrice: 16_000_000, amount: 1_920_000_000 },
      { sectionId: s5c.id, description: "Electrical system", unit: "ls", volume: 1, unitPrice: 520_000_000, amount: 520_000_000 },
    ] });
    console.log("Seeded RAB-2026-005 (REJECTED)");
  }

  // ===== 6. RAB-2026-006: ARCHIVED (old completed project) =====
  const rab6 = await prisma.rab.upsert({
    where: { number: "RAB-2026-006" },
    create: {
      number: "RAB-2026-006",
      title: "Pembangunan Gudang Logistik 2.000 m2",
      clientName: "PT Logistik Nusantara Express",
      location: "Kawasan Pergudangan Deltamas, Cikarang",
      projectDate: new Date("2024-03-01"),
      scheduleStart: new Date("2024-04-01"),
      status: "ARCHIVED",
      subtotal: 4_200_000_000,
      discountAmount: 0,
      taxAmount: 462_000_000,
      total: 4_662_000_000,
      taxPct: 11,
      notes: "Proyek selesai 2024, diarsipkan",
      createdById: adminId,
    },
    update: { status: "ARCHIVED" },
  });

  // RAB-007: Complex hospital project (archived/completed)
  const rab7 = await prisma.rab.upsert({
    where: { number: "RAB-2026-007" },
    create: {
      number: "RAB-2026-007",
      title: "Konstruksi Rumah Sakit Tipe B 5 Lantai",
      clientName: "PT Rumah Sakit Cahaya Sehat",
      location: "Jl. Rumah Sakit No. 1, Tangerang",
      projectDate: new Date("2023-06-01"),
      scheduleStart: new Date("2023-07-01"),
      status: "ARCHIVED",
      subtotal: 48_500_000_000,
      discountAmount: 970_000_000,
      taxAmount: 5_228_300_000,
      total: 52_758_300_000,
      taxPct: 11,
      discountPct: 2,
      notes: "Proyek selesai November 2024, garansi berlaku s/d Nov 2026",
      createdById: adminId,
    },
    update: { status: "ARCHIVED" },
  });

  const existingSections7 = await prisma.rabSection.count({ where: { rabId: rab7.id } });
  if (existingSections7 === 0) {
    const s7a = await prisma.rabSection.create({ data: { rabId: rab7.id, name: "Pekerjaan Struktur Utama", order: 1 } });
    const s7b = await prisma.rabSection.create({ data: { rabId: rab7.id, name: "Pekerjaan Arsitektur", order: 2 } });
    const s7c = await prisma.rabSection.create({ data: { rabId: rab7.id, name: "Pekerjaan MEP Rumah Sakit", order: 3 } });
    const s7d = await prisma.rabSection.create({ data: { rabId: rab7.id, name: "Pekerjaan Medis", order: 4 } });

    await prisma.rabItem.createMany({ data: [
      { sectionId: s7a.id, description: "Pondasi bored pile D800", unit: "m", volume: 320, unitPrice: 2_500_000, amount: 800_000_000 },
      { sectionId: s7a.id, description: "Pilecap dan tie beam", unit: "m3", volume: 480, unitPrice: 3_800_000, amount: 1_824_000_000 },
      { sectionId: s7a.id, description: "Kolom struktur 60x60", unit: "m3", volume: 240, unitPrice: 4_500_000, amount: 1_080_000_000 },
      { sectionId: s7a.id, description: "Balok struktur", unit: "m3", volume: 180, unitPrice: 4_200_000, amount: 756_000_000 },
      { sectionId: s7a.id, description: "Plat lantai 20cm", unit: "m2", volume: 4000, unitPrice: 680_000, amount: 2_720_000_000 },
      { sectionId: s7b.id, description: "Dinding bata merah 1PC:5PP", unit: "m2", volume: 8000, unitPrice: 120_000, amount: 960_000_000 },
      { sectionId: s7b.id, description: "Plesteran acian", unit: "m2", volume: 16000, unitPrice: 85_000, amount: 1_360_000_000 },
      { sectionId: s7b.id, description: "Kaca tempered 10mm", unit: "m2", volume: 1200, unitPrice: 1_800_000, amount: 2_160_000_000 },
      { sectionId: s7c.id, description: "AC central chiller system", unit: "pk", volume: 400, unitPrice: 22_000_000, amount: 8_800_000_000 },
      { sectionId: s7c.id, description: "Fire protection sprinkler", unit: "ls", volume: 1, unitPrice: 2_200_000_000, amount: 2_200_000_000 },
      { sectionId: s7c.id, description: "Medical gas system", unit: "outlet", volume: 120, unitPrice: 4_500_000, amount: 540_000_000 },
      { sectionId: s7d.id, description: "Operating theatre fit-out", unit: "unit", volume: 4, unitPrice: 3_500_000_000, amount: 14_000_000_000 },
      { sectionId: s7d.id, description: "ICU equipment mount", unit: "bed", volume: 24, unitPrice: 85_000_000, amount: 2_040_000_000 },
      { sectionId: s7d.id, description: "Laboratory cabinetry", unit: "ls", volume: 1, unitPrice: 1_800_000_000, amount: 1_800_000_000 },
    ] });
    console.log("Seeded RAB-2026-006 and RAB-2026-007 (ARCHIVED)");
  }

  console.log("seedRabFull complete: 7 RABs across all statuses");
}

export { seedRabFull };
