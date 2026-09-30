/**
 * ================================================================================
 * SANATA CONSTRUCTION - DATABASE CLEAN SEEDER
 * ================================================================================
 * 
 * Script ini menghapus SEMUA data yang ada dan membuat database dari awal.
 * 
 * CARA PENGGUNAAN:
 *   1. Pastikan PostgreSQL berjalan (Laragon sudah aktif)
 *   2. Jalankan: cd backend && npx tsx prisma/seed-clean.ts
 * 
 * DATA YANG DIBUAT:
 *   - 1 Super Admin (admin portal)
 *   - 1 Client Portal User (pelanggan dengan akses RAB)
 *   - 2 RAB Projects (untuk demo client portal)
 *   - Sample progress data (untuk chart dashboard)
 * 
 * ================================================================================
 */

import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper for Decimal fields
function toDecimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ================================================================================
// KONFIGURASI
// ================================================================================

const CONFIG = {
  admin: {
    name: "Sanata Administrator",
    email: "admin@sanata.id",
    password: "Admin123!",
  },
  client: {
    name: "Hendra Wijaya",
    email: "client@sanata.id",
    password: "Client123!",
    phone: "081234567890",
    companyName: "PT Nusantara Realty Indonesia",
  },
  rabs: [
    {
      number: "RAB-2026-001",
      title: "Pembangunan Gedng Perkantoran 4 Lantai",
      clientName: "PT Nusantara Realty Indonesia",
      location: "Jl. Sudirman No. 45, Jakarta Selatan",
      status: "APPROVED" as const,
      scheduleStart: new Date("2026-02-01"),
    },
    {
      number: "RAB-2026-002",
      title: "Renovasi & Perluasan Rumah Tinggal",
      clientName: "Budi Santoso",
      location: "Jl. Melati No. 8, Jakarta Selatan",
      status: "APPROVED" as const,
      scheduleStart: new Date("2026-06-15"),
    },
  ],
};

// ================================================================================
// UTILITAS
// ================================================================================

function printHeader(text: string) {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${text}`);
  console.log("=".repeat(70));
}

function printStep(text: string) {
  console.log(`\n▶ ${text}`);
}

function printSuccess(text: string) {
  console.log(`  ✅ ${text}`);
}

function printWarning(text: string) {
  console.log(`  ⚠️  ${text}`);
}

// ================================================================================
// SEED FUNCTIONS
// ================================================================================

/** Hapus semua data */
async function deleteAllData() {
  printStep("Menghapus semua data...");

  try {
    await prisma.clientRefreshToken.deleteMany({});
    await prisma.clientPasswordResetToken.deleteMany({});
    await prisma.clientNotification.deleteMany({});
    await prisma.clientProjectAccess.deleteMany({});
    await prisma.client.deleteMany({});
    
    await prisma.rabProgress.deleteMany({});
    await prisma.rabItem.deleteMany({});
    await prisma.rabSection.deleteMany({});
    await prisma.rabScheduleBaseline.deleteMany({});
    await prisma.progressBilling.deleteMany({});
    await prisma.projectSubmission.deleteMany({});
    await prisma.projectLetter.deleteMany({});
    await prisma.dailyReport.deleteMany({});
    await prisma.qcRecord.deleteMany({});
    await prisma.qcTemplate.deleteMany({});
    await prisma.siteMemo.deleteMany({});
    await prisma.rab.deleteMany({});
    
    await prisma.refreshToken.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.content.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.signatory.deleteMany({});
    await prisma.workforceRole.deleteMany({});
    await prisma.broadcastCampaign.deleteMany({});
    await prisma.broadcastDelivery.deleteMany({});
    await prisma.broadcastContact.deleteMany({});
    await prisma.priceItem.deleteMany({});
    await prisma.ahspComponent.deleteMany({});
    await prisma.ahsp.deleteMany({});
    await prisma.inquiry.deleteMany({});
    await prisma.user.deleteMany({});
    
    printSuccess("Semua data berhasil dihapus");
  } catch (error) {
    printWarning(`Error: ${(error as Error).message}`);
  }
}

/** Buat Super Admin */
async function seedSuperAdmin() {
  printStep("Membuat Super Admin...");
  
  const passwordHash = await hashPassword(CONFIG.admin.password);
  
  const admin = await prisma.user.upsert({
    where: { email: CONFIG.admin.email },
    update: { name: CONFIG.admin.name, passwordHash, role: "ADMIN", isActive: true },
    create: { name: CONFIG.admin.name, email: CONFIG.admin.email, passwordHash, role: "ADMIN", isActive: true },
  });
  
  printSuccess(`Super Admin: ${admin.email}`);
  return admin;
}

/** Buat Categories */
async function seedCategories() {
  printStep("Membuat Categories...");
  const cats = ["Residensial", "Komersial", "Renovasi", "Interior", "Insight"];
  for (const name of cats) {
    await prisma.category.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }
  printSuccess(`${cats.length} categories dibuat`);
}

/** Buat Signatories */
async function seedSignatories() {
  printStep("Membuat Signatories...");
  await prisma.signatory.deleteMany({});
  await prisma.signatory.createMany({
    data: [
      { name: "Ir. Hendra Kusuma", title: "Directeur Utama", role: "DIREKTUR_UTAMA", department: "Direksi", isActive: true },
      { name: "Ir. Budi Santoso", title: "Directeur Operasional", role: "DIREKTUR", department: "Direksi", isActive: true },
      { name: "Dr. Rina Hartati", title: "Manager Proyek", role: "MANAGER_PROYEK", department: "Divisi Konstruksi", isActive: true },
    ],
  });
  printSuccess("3 signatories dibuat");
}

/** Buat Workforce Roles */
async function seedWorkforceRoles() {
  printStep("Membuat Workforce Roles...");
  const roles = [
    { role: "DIREKTUR_UTAMA" as const, label: "Directeur Utama", isActive: true, order: 1 },
    { role: "DIREKTUR" as const, label: "Directeur", isActive: true, order: 2 },
    { role: "MANAGER_PROYEK" as const, label: "Manager Proyek", isActive: true, order: 3 },
    { role: "SITE_MANAGER" as const, label: "Site Manager", isActive: true, order: 4 },
    { role: "KEPALA_TUKANG" as const, label: "Kepala Tukang", isActive: true, order: 5 },
    { role: "TUKANG_BATU" as const, label: "Tukang Batu", isActive: true, order: 6 },
    { role: "TUKANG_KAYU" as const, label: "Tukang Kayu", isActive: true, order: 7 },
    { role: "TUKANG_BESI" as const, label: "Tukang Besi", isActive: true, order: 8 },
    { role: "MANDOR" as const, label: "Mandor", isActive: true, order: 9 },
    { role: "PEKERJA" as const, label: "Pekerja", isActive: true, order: 10 },
  ];
  for (const r of roles) {
    await prisma.workforceRole.upsert({ where: { role: r.role }, update: r, create: r });
  }
  printSuccess(`${roles.length} workforce roles dibuat`);
}

/** Buat RAB Projects */
async function seedRABProjects(adminId: string) {
  printStep("Membuat RAB Projects...");
  const rabIds: string[] = [];
  
  for (const rabConfig of CONFIG.rabs) {
    const subtotal = 1_500_000_000;
    const taxAmount = Math.round(subtotal * 0.11);
    const total = subtotal + taxAmount;
    
    const rab = await prisma.rab.upsert({
      where: { number: rabConfig.number },
      update: {
        title: rabConfig.title,
        clientName: rabConfig.clientName,
        location: rabConfig.location,
        status: rabConfig.status,
        scheduleStart: rabConfig.scheduleStart,
        subtotal: toDecimal(subtotal),
        discountAmount: toDecimal(0),
        taxAmount: toDecimal(taxAmount),
        total: toDecimal(total),
        taxPct: toDecimal(11),
        createdById: adminId,
      },
      create: {
        number: rabConfig.number,
        title: rabConfig.title,
        clientName: rabConfig.clientName,
        location: rabConfig.location,
        status: rabConfig.status,
        projectDate: new Date(),
        scheduleStart: rabConfig.scheduleStart,
        subtotal: toDecimal(subtotal),
        discountAmount: toDecimal(0),
        taxAmount: toDecimal(taxAmount),
        total: toDecimal(total),
        taxPct: toDecimal(11),
        createdById: adminId,
      },
    });
    
    rabIds.push(rab.id);
    printSuccess(`RAB: ${rab.number} - ${rab.title}`);
    await seedRABSections(rab.id);
  }
  
  return rabIds;
}

/** Buat RAB Sections & Items */
async function seedRABSections(rabId: string) {
  const sections = [
    {
      name: "Pekerjaan Struktur",
      items: [
        { desc: "Pondasi Strauss pile D300", unit: "m'", vol: 120, price: 850_000 },
        { desc: "Sloof 30x50 cm", unit: "m3", vol: 24, price: 2_500_000 },
        { desc: "Kolom utama 40x40 cm", unit: "m3", vol: 48, price: 3_200_000 },
        { desc: "Balok 30x50 cm", unit: "m3", vol: 36, price: 2_800_000 },
        { desc: "Plat lantai tebal 12 cm", unit: "m2", vol: 960, price: 385_000 },
      ],
    },
    {
      name: "Pekerjaan Arsitektur",
      items: [
        { desc: "Dinding bata 1PC:5PP", unit: "m2", vol: 1800, price: 95_000 },
        { desc: "Plesteran dinding", unit: "m2", vol: 3600, price: 65_000 },
        { desc: "Pengecatan dinding", unit: "m2", vol: 3600, price: 45_000 },
        { desc: "Kusen aluminium", unit: "unit", vol: 24, price: 3_500_000 },
        { desc: "Pintu triplek", unit: "unit", vol: 18, price: 850_000 },
      ],
    },
    {
      name: "Pekerjaan MEP",
      items: [
        { desc: "Instalasi listrik", unit: "ls", vol: 1, price: 480_000_000 },
        { desc: "Plumbing & drainase", unit: "ls", vol: 1, price: 320_000_000 },
        { desc: "AC split 1 PK", unit: "unit", vol: 16, price: 7_500_000 },
        { desc: "Fire alarm system", unit: "ls", vol: 1, price: 180_000_000 },
      ],
    },
  ];
  
  let order = 1;
  for (const section of sections) {
    const sec = await prisma.rabSection.create({ data: { rabId, name: section.name, order: order++ } });
    for (let i = 0; i < section.items.length; i++) {
      const it = section.items[i];
      await prisma.rabItem.create({
        data: {
          sectionId: sec.id,
          description: it.desc,
          unit: it.unit,
          volume: toDecimal(it.vol),
          unitPrice: toDecimal(it.price),
          amount: toDecimal(it.vol * it.price),
          order: i + 1,
          startOffsetDays: i * 5,
          durationDays: 10,
        },
      });
    }
    printSuccess(`  Section "${section.name}" dengan ${section.items.length} items dibuat`);
  }
}

/** Buat Client Portal User */
async function seedClientUser(rabIds: string[]) {
  printStep("Membuat Client Portal User...");
  const passwordHash = await hashPassword(CONFIG.client.password);
  
  const client = await prisma.client.upsert({
    where: { email: CONFIG.client.email },
    update: {
      name: CONFIG.client.name,
      passwordHash,
      phone: CONFIG.client.phone,
      companyName: CONFIG.client.companyName,
      isActive: true,
      emailVerified: true,
      notifyProgress: true,
      notifyDocuments: true,
      notifyMessages: true,
    },
    create: {
      email: CONFIG.client.email,
      passwordHash,
      name: CONFIG.client.name,
      phone: CONFIG.client.phone,
      companyName: CONFIG.client.companyName,
      isActive: true,
      emailVerified: true,
      notifyProgress: true,
      notifyDocuments: true,
      notifyMessages: true,
    },
  });
  
  printSuccess(`Client: ${client.email}`);
  
  for (const rabId of rabIds) {
    await prisma.clientProjectAccess.upsert({
      where: { clientId_rabId: { clientId: client.id, rabId } },
      update: {
        status: "ACTIVE",
        accessLevel: "VIEW",
        canViewProgress: true,
        canViewDailyReports: true,
        canViewPhotos: true,
        canViewQC: true,
        canViewDocuments: true,
        canViewFinancials: true,
      },
      create: {
        clientId: client.id,
        rabId,
        status: "ACTIVE",
        accessLevel: "VIEW",
        canViewProgress: true,
        canViewDailyReports: true,
        canViewPhotos: true,
        canViewQC: true,
        canViewDocuments: true,
        canViewFinancials: true,
      },
    });
    const rab = await prisma.rab.findUnique({ where: { id: rabId } });
    printSuccess(`  Akses: ${rab?.number}`);
  }
  
  await prisma.clientNotification.createMany({
    data: [
      { clientId: client.id, type: "PROGRESS_UPDATE", title: "Progres Update", message: "Plat lantai 3 capai 75%", isRead: false },
      { clientId: client.id, type: "NEW_REPORT", title: "Laporan Harian Baru", message: "Laporan tgl 22 Sep 2026 tersedia.", isRead: false },
    ],
  });
  printSuccess("Sample notifications dibuat");
  
  return client;
}

// ================================================================================
// MAIN
// ================================================================================

async function main() {
  console.log("\n");
  printHeader("SANATA CONSTRUCTION - DATABASE CLEAN SEEDER");
  console.log("\nTanggal: " + new Date().toISOString());
  console.log("\nPERSIAPAN:");
  console.log("  - Semua data akan dihapus terlebih dahulu");
  console.log("  - Database akan di-seed dengan data baru");
  console.log("  - Sample RAB projects akan dibuat untuk demo");
  console.log("  - Client portal access akan dikonfigurasi");
  
  try {
    await deleteAllData();
    const admin = await seedSuperAdmin();
    await seedCategories();
    await seedSignatories();
    await seedWorkforceRoles();
    const rabIds = await seedRABProjects(admin.id);
    await seedClientUser(rabIds);
    
    // ========================================================================
    // PRINT CREDENTIALS - CONSOLE LOG
    // ========================================================================
    printHeader("🎉 SEEDING COMPLETE - LOGIN CREDENTIALS");
    
    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║                    SUPER ADMIN LOGIN                          ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log(`║  📧 Email:    ${CONFIG.admin.email.padEnd(46)}║`);
    console.log(`║  🔐 Password:  ${CONFIG.admin.password.padEnd(46)}║`);
    console.log(`║  👤 Role:     ADMIN`.padEnd(62) + "║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║                  CLIENT PORTAL LOGIN                         ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log(`║  📧 Email:    ${CONFIG.client.email.padEnd(46)}║`);
    console.log(`║  🔐 Password:  ${CONFIG.client.password.padEnd(46)}║`);
    console.log(`║  👤 Nama:     ${CONFIG.client.name.padEnd(46)}║`);
    console.log(`║  🏢 Company:  ${(CONFIG.client.companyName || "-").padEnd(46)}║`);
    console.log(`║  📁 Akses:    ${CONFIG.rabs.map(r => r.number).join(", ").padEnd(41)}║`);
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("\n📋 RAB PROJECTS (Demo):");
    console.log("─".repeat(60));
    for (const rab of CONFIG.rabs) {
      console.log(`  ${rab.number}: ${rab.title}`);
      console.log(`  📍 Lokasi: ${rab.location}`);
      console.log(`  ✅ Status:  ${rab.status}`);
      console.log("");
    }
    
    printHeader("NEXT STEPS");
    console.log("\n1. Jalankan backend: cd backend && npm run dev");
    console.log("2. Buka http://localhost:3000 untuk admin portal");
    console.log("3. Buka http://localhost:3000/client/login untuk client portal");
    console.log("\n  Gunakan credentials di atas untuk login.\n");
    
  } catch (error) {
    console.error("\n❌ ERROR:", (error as Error).message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
