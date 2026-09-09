/**
 * SANTRA Complete Seeder v3
 * Seeds complete project data including Kurva S, Assignments, Execution Logs
 * Run: npx tsx prisma/seed-santra-v3.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SANTRA Complete Seeder v3');
  console.log('='.repeat(50));

  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = adminUser?.id || '';

  if (!adminId) {
    console.error('❌ No admin user found.');
    return;
  }

  // ============================================
  // 1. SEED RABs (5 Projects)
  // ============================================
  console.log('
📋 Step 1: Seeding RAB Projects...');

  const rab1 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-001' },
    update: { title: 'Pembangunan Gedung Perkantoran 4 Lantai', status: 'APPROVED', scheduleStart: new Date('2026-02-01') },
    create: {
      number: 'RAB-2026-001',
      title: 'Pembangunan Gedung Perkantoran 4 Lantai',
      clientName: 'PT Nusantara Realty Indonesia',
      location: 'Jl. Sudirman No. 45, Jakarta Selatan',
      projectDate: new Date('2026-01-15'),
      scheduleStart: new Date('2026-02-01'),
      status: 'APPROVED',
      taxPct: 11,
      subtotal: 4850000000,
      discountAmount: 0,
      taxAmount: 533500000,
      total: 5383500000,
      restDays: [0],
      createdById: adminId,
    },
  });
  console.log('✅ RAB-001:', rab1.title);

  const rab2 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-002' },
    update: { title: 'Renovasi & Perluasan Rumah Tinggal', status: 'APPROVED', scheduleStart: new Date('2026-06-15') },
    create: {
      number: 'RAB-2026-002',
      title: 'Renovasi & Perluasan Rumah Tinggal Pak Budi',
      clientName: 'Budi Santoso',
      location: 'Jl. Melati No. 8, Jakarta Selatan',
      projectDate: new Date('2026-06-01'),
      scheduleStart: new Date('2026-06-15'),
      status: 'APPROVED',
      taxPct: 11,
      subtotal: 765000000,
      discountAmount: 0,
      taxAmount: 84150000,
      total: 849150000,
      restDays: [0],
      createdById: adminId,
    },
  });
  console.log('✅ RAB-002:', rab2.title);

  const rab3 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-003' },
    update: { title: 'Pembangunan Ruko 3 Lantai', status: 'REVIEW', scheduleStart: new Date('2026-07-15') },
    create: {
      number: 'RAB-2026-003',
      title: 'Pembangunan Ruko 3 Lantai',
      clientName: 'CV Maju Jaya',
      location: 'Jl. Gatot Subroto No. 120, Jakarta Pusat',
      projectDate: new Date('2026-07-01'),
      scheduleStart: new Date('2026-07-15'),
      status: 'REVIEW',
      taxPct: 11,
      subtotal: 1250000000,
      discountAmount: 25000000,
      taxAmount: 134750000,
      total: 1360750000,
      restDays: [0],
      createdById: adminId,
    },
  });
  console.log('✅ RAB-003:', rab3.title);

  const rab4 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-004' },
    update: { title: 'Renovasi Interior Kantor PT Sejahtera', status: 'DRAFT', scheduleStart: new Date('2026-08-15') },
    create: {
      number: 'RAB-2026-004',
      title: 'Renovasi Interior Kantor PT Sejahtera',
      clientName: 'PT Sejahtera Abadi',
      location: 'Jl. HR Rasuna Said Kav. C-17, Jakarta Selatan',
      projectDate: new Date('2026-08-01'),
      scheduleStart: new Date('2026-08-15'),
      status: 'DRAFT',
      taxPct: 11,
      subtotal: 450000000,
      discountAmount: 0,
      taxAmount: 49500000,
      total: 499500000,
      restDays: [0],
      createdById: adminId,
    },
  });
  console.log('✅ RAB-004:', rab4.title);

  const rab5 = await prisma.rab.upsert({
    where: { number: 'RAB-2026-005' },
    update: { title: 'Pembangunan Pabrik Garmen', status: 'DRAFT', scheduleStart: new Date('2026-09-15') },
    create: {
      number: 'RAB-2026-005',
      title: 'Pembangunan Pabrik Garmen',
      clientName: 'PT Textile Indonesia',
      location: 'Kawasan Industri MM2100, Cikarang',
      projectDate: new Date('2026-09-01'),
      scheduleStart: new Date('2026-09-15'),
      status: 'DRAFT',
      taxPct: 11,
      subtotal: 8750000000,
      discountAmount: 175000000,
      taxAmount: 943250000,
      total: 9519250000,
      restDays: [0],
      createdById: adminId,
    },
  });
  console.log('✅ RAB-005:', rab5.title);

  console.log('
📊 Total RABs:', await prisma.rab.count());
