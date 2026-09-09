/**
 * Client Portal Test Seeder
 * Seeds test client accounts and project access for development
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("======================================================================");
  console.log("CLIENT PORTAL TEST SEEDER");
  console.log("======================================================================");
  console.log("");

  // Get RABs for access
  const rabs = await prisma.rab.findMany({ take: 5 });
  if (rabs.length === 0) {
    console.log("ERROR: No RABs found. Run seed.ts first.");
    return;
  }

  // Test clients data
  const testClients = [
    {
      email: "hendra@nusantara-realty.co.id",
      password: "Client123!",
      name: "Ir. Hendra Wijaya",
      phone: "081212345678",
      companyName: "PT Nusantara Realty Indonesia",
      rabNumbers: ["RAB-2026-001"],
    },
    {
      email: "budi.santoso@email.com",
      password: "Client123!",
      name: "Budi Santoso",
      phone: "081298765432",
      companyName: null,
      rabNumbers: ["RAB-2026-002"],
    },
    {
      email: "marketing@maju-jaya.co.id",
      password: "Client123!",
      name: "Tim Marketing CV Maju Jaya",
      phone: "081345678901",
      companyName: "CV Maju Jaya",
      rabNumbers: ["RAB-2026-003"],
    },
  ];

  console.log("STEP 1: Creating test client accounts...");
  for (const clientData of testClients) {
    const existingClient = await prisma.client.findUnique({
      where: { email: clientData.email },
    });

    if (existingClient) {
      console.log(`  Skipping ${clientData.email} - already exists`);
      continue;
    }

    const passwordHash = await bcrypt.hash(clientData.password, 12);

    const client = await prisma.client.create({
      data: {
        email: clientData.email,
        passwordHash,
        name: clientData.name,
        phone: clientData.phone,
        companyName: clientData.companyName,
        emailVerified: true,
        isActive: true,
      },
    });

    console.log(`  Created client: ${client.email}`);

    // Grant access to RABs
    for (const rabNumber of clientData.rabNumbers) {
      const rab = rabs.find((r) => r.number === rabNumber);
      if (!rab) {
        console.log(`    WARNING: RAB ${rabNumber} not found`);
        continue;
      }

      const existingAccess = await prisma.clientProjectAccess.findUnique({
        where: {
          clientId_rabId: { clientId: client.id, rabId: rab.id },
        },
      });

      if (existingAccess) {
        console.log(`    Access to ${rabNumber} already exists`);
        continue;
      }

      await prisma.clientProjectAccess.create({
        data: {
          clientId: client.id,
          rabId: rab.id,
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

      console.log(`    Granted access to ${rabNumber}`);
    }
  }

  console.log("");
  console.log("STEP 2: Creating test notifications...");
  const firstClient = await prisma.client.findFirst();
  if (firstClient) {
    const notifications = [
      {
        clientId: firstClient.id,
        type: "PROGRESS_UPDATE",
        title: "Progress Proyek Update",
        message: "Pekerjaan plat lantai 3 telah mencapai 85% progress.",
        link: `/client/project/${rabs[0]?.id}`,
      },
      {
        clientId: firstClient.id,
        type: "NEW_REPORT",
        title: "Laporan Harian Baru",
        message: "Laporan harian tanggal 8 September 2026 sudah tersedia.",
        link: `/client/project/${rabs[0]?.id}/reports`,
      },
      {
        clientId: firstClient.id,
        type: "QC_ALERT",
        title: "QC Record Baru",
        message: "Ada 3 QC record baru yang perlu diperhatikan.",
        link: `/client/project/${rabs[0]?.id}/qc`,
      },
    ];

    for (const notif of notifications) {
      await prisma.clientNotification.create({ data: notif });
    }
    console.log(`  Created ${notifications.length} test notifications`);
  }

  // Summary
  console.log("");
  console.log("======================================================================");
  console.log("CLIENT PORTAL SEEDING COMPLETE");
  console.log("======================================================================");
  console.log("");
  console.log("TEST ACCOUNTS:");
  console.log("");
  for (const client of testClients) {
    console.log(`  Email:    ${client.email}`);
    console.log(`  Password: ${client.password}`);
    console.log(`  Name:     ${client.name}`);
    console.log(`  Projects: ${client.rabNumbers.join(", ")}`);
    console.log("");
  }
  console.log("======================================================================");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
