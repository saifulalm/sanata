/**
 * Client Portal Demo Seeder
 *
 * Run: npx tsx prisma/seed-client.ts
 *
 * This script creates demo client accounts and grants them access to sample projects.
 * Safe to run multiple times - uses upsert to avoid duplicates.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Client Portal demo data...\n");

  // Demo clients to create
  const demoClients = [
    {
      email: "demo@client.id",
      password: "Demo123!",
      name: "Budi Santoso",
      phone: "081234567890",
      companyName: "PT Maju Jaya",
    },
    {
      email: "client2@demo.id",
      password: "Client123!",
      name: "Siti Rahayu",
      phone: "089876543210",
      companyName: "CV Berkah Konstruksi",
    },
    {
      email: "test@client.id",
      password: "Test1234!",
      name: "Ahmad Wijaya",
      phone: "085212345678",
      companyName: "PT Konstruksi Indonesia",
    },
  ];

  // Create demo clients
  console.log("👤 Creating demo client accounts...\n");

  for (const client of demoClients) {
    const hashedPassword = await bcrypt.hash(client.password, 10);

    const created = await prisma.client.upsert({
      where: { email: client.email },
      update: {
        name: client.name,
        phone: client.phone,
        companyName: client.companyName,
        notifyProgress: true,
        notifyDocuments: true,
        notifyMessages: true,
      },
      create: {
        email: client.email,
        passwordHash: hashedPassword,
        name: client.name,
        phone: client.phone,
        companyName: client.companyName,
        notifyProgress: true,
        notifyDocuments: true,
        notifyMessages: true,
      },
    });

    console.log(`   ✅ ${client.email}`);
    console.log(`      Password: ${client.password}`);
    console.log(`      Name: ${client.name}`);
    console.log(`      Company: ${client.companyName}`);
    console.log("");
  }

  // Get some RABs to grant access to
  const rabProjects = await prisma.rab.findMany({
    take: 3,
    select: {
      id: true,
      title: true,
      number: true,
    },
  });

  if (rabProjects.length === 0) {
    console.log("⚠️  No RAB projects found. Create some RABs first in Admin panel.");
    console.log("    Go to Admin → RAB → Buat RAB Baru\n");
  } else {
    console.log("📋 Granting project access...\n");

    // Grant access for first demo client to all available projects
    const firstClient = await prisma.client.findUnique({
      where: { email: "demo@client.id" },
    });

    if (firstClient) {
      for (const rab of rabProjects) {
        await prisma.clientProjectAccess.upsert({
          where: {
            clientId_rabId: {
              clientId: firstClient.id,
              rabId: rab.id,
            },
          },
          update: {
            accessLevel: "APPROVE",
            status: "ACTIVE",
          },
          create: {
            clientId: firstClient.id,
            rabId: rab.id,
            accessLevel: "APPROVE",
            status: "ACTIVE",
            canViewProgress: true,
            canViewDailyReports: true,
            canViewPhotos: true,
            canViewQC: true,
            canViewDocuments: true,
            canViewFinancials: true,
          },
        });

        console.log(`   ✅ Access granted to ${rab.number} - ${rab.title}`);
      }
    }
  }

  console.log("\n🎉 Client Portal seeding complete!\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📌 Demo Client Login Credentials:");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("   URL: http://localhost:5001/client/login");
  console.log("");
  console.log("   1. demo@client.id     / Demo123!");
  console.log("   2. client2@demo.id    / Client123!");
  console.log("   3. test@client.id    / Test1234!");
  console.log("");
  console.log("   ⚠️  Grant project access from Admin → RAB → Akses Klien");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
