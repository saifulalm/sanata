/**
 * Seed Client Portal Demo Data
 * Run: cd backend && npx tsx prisma/seed-client-portal.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Client Portal Demo Data...");

  // Demo clients with passwords
  const clients = [
    {
      email: "demo@sanata.id",
      password: "Demo123!",
      name: "Budi Santoso",
      phone: "081234567890",
      companyName: "PT Maju Jaya Construction",
    },
    {
      email: "hendra@nusantara-realty.co.id",
      password: "Hendra123!",
      name: "Ir. Hendra Wijaya",
      phone: "081234567891",
      companyName: "PT Nusantara Realty",
    },
    {
      email: "marketing@maju-jaya.co.id",
      password: "Marketing123!",
      name: "Tim Marketing CV Maju Jaya",
      phone: "081234567892",
      companyName: "CV Maju Jaya",
    },
  ];

  for (const c of clients) {
    const hash = await bcrypt.hash(c.password, 12);
    const existing = await prisma.client.findUnique({ where: { email: c.email } });

    if (existing) {
      await prisma.client.update({
        where: { id: existing.id },
        data: { passwordHash: hash, isActive: true },
      });
      console.log(`✓ Updated client: ${c.email}`);
    } else {
      await prisma.client.create({
        data: {
          email: c.email,
          passwordHash: hash,
          name: c.name,
          phone: c.phone,
          companyName: c.companyName,
          isActive: true,
        },
      });
      console.log(`✓ Created client: ${c.email}`);
    }
  }

  // Get first RAB project to give access
  const firstRab = await prisma.rab.findFirst();
  if (firstRab) {
    const demoClient = await prisma.client.findUnique({ where: { email: "demo@sanata.id" } });
    if (demoClient) {
      const existingAccess = await prisma.clientProjectAccess.findFirst({
        where: { clientId: demoClient.id, rabId: firstRab.id },
      });

      if (!existingAccess) {
        await prisma.clientProjectAccess.create({
          data: {
            clientId: demoClient.id,
            rabId: firstRab.id,
            status: "ACTIVE",
            accessLevel: "FULL",
          },
        });
        console.log(`✓ Granted project access to demo@sanata.id for RAB: ${firstRab.number}`);
      } else {
        console.log(`ℹ demo@sanata.id already has access to project`);
      }
    }
  }

  console.log("\n✅ Client Portal Demo Data seeded successfully!");
  console.log("\n📋 Demo Credentials:");
  console.log("   • demo@sanata.id / Demo123!");
  console.log("   • hendra@nusantara-realty.co.id / Hendra123!");
  console.log("   • marketing@maju-jaya.co.id / Marketing123!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
