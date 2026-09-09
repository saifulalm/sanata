/**
 * SANTRA Update Schedule Script
 * Updates existing RAB items with correct schedule (startOffsetDays & durationDays)
 * Run: npx tsx prisma/update-schedule.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Updating RAB Schedule Data...\n");

  // Schedule data for RAB-001 (Gedung Perkantoran - start Feb 1, 2026)
  const schedule001: Record<string, { startOffsetDays: number; durationDays: number }> = {
    "Pekerjaan pondasi Strauss pile D300": { startOffsetDays: 0, durationDays: 43 },
    "Pekerjaan sloof 30x50 cm": { startOffsetDays: 43, durationDays: 21 },
    "Pekerjaan kolom utama 40x40 cm": { startOffsetDays: 64, durationDays: 45 },
    "Pekerjaan balok 30x50 cm": { startOffsetDays: 109, durationDays: 35 },
    "Pekerjaan plat lantai tebal 12 cm": { startOffsetDays: 144, durationDays: 60 },
    "Pasangan dinding bata merah 1PC:5PP": { startOffsetDays: 160, durationDays: 60 },
    "Plesteran dinding dalam": { startOffsetDays: 220, durationDays: 45 },
    "Pengecatan dinding dalam": { startOffsetDays: 265, durationDays: 30 },
    "Pemasangan kusen aluminium": { startOffsetDays: 240, durationDays: 20 },
    "Instalasi listrik lengkap": { startOffsetDays: 180, durationDays: 90 },
    "Sistem plumbing & drainase": { startOffsetDays: 180, durationDays: 90 },
    "AC split 1 PK": { startOffsetDays: 240, durationDays: 45 },
  };

  // Schedule data for RAB-002 (Renovasi Rumah - start June 15, 2026)
  const schedule002: Record<string, { startOffsetDays: number; durationDays: number }> = {
    "Pekerjaan pembongkaran dinding lama": { startOffsetDays: 0, durationDays: 15 },
    "Pondasi footplat 60x60 cm": { startOffsetDays: 14, durationDays: 11 },
    "Kolom praktis 15x15 cm": { startOffsetDays: 25, durationDays: 14 },
    "Sloof 20x30 cm": { startOffsetDays: 39, durationDays: 15 },
    "Dinding batako 10x20x40 cm": { startOffsetDays: 54, durationDays: 20 },
    "Plesteran dinding baru": { startOffsetDays: 74, durationDays: 19 },
    "Pengecatan dinding interior": { startOffsetDays: 93, durationDays: 19 },
    "Pemasangan lantai keramik 60x60 cm": { startOffsetDays: 112, durationDays: 15 },
    "Pemasangan plafon gypsum 9mm": { startOffsetDays: 112, durationDays: 10 },
    "Rangka atap baja ringan": { startOffsetDays: 74, durationDays: 14 },
    "Penutup atap genteng beton": { startOffsetDays: 88, durationDays: 12 },
  };

  // Schedule data for RAB-003 (Ruko - start July 15, 2026)
  const schedule003: Record<string, { startOffsetDays: number; durationDays: number }> = {
    "Pembersihan lokasi": { startOffsetDays: 0, durationDays: 2 },
    "Pembersihan lokasi site": { startOffsetDays: 0, durationDays: 2 },
    "Pondasi Strauss pile D400": { startOffsetDays: 2, durationDays: 28 },
    "Sloof 25x40 cm": { startOffsetDays: 30, durationDays: 10 },
    "Kolom 30x30 cm": { startOffsetDays: 40, durationDays: 28 },
    "Balok 25x40 cm": { startOffsetDays: 68, durationDays: 21 },
    "Plat lantai 12 cm": { startOffsetDays: 89, durationDays: 35 },
    "Dinding batako": { startOffsetDays: 124, durationDays: 30 },
    "Plesteran & acian": { startOffsetDays: 154, durationDays: 25 },
    "Kusen aluminium & kaca": { startOffsetDays: 179, durationDays: 21 },
  };

  // Schedule data for RAB-004 (Renovasi Kantor - start Aug 15, 2026)
  const schedule004: Record<string, { startOffsetDays: number; durationDays: number }> = {
    "Pembongkaran dinding partisi lama": { startOffsetDays: 0, durationDays: 5 },
    "Pembongkaran plafon lama": { startOffsetDays: 5, durationDays: 5 },
    "Partisi gypsum 2 sisi": { startOffsetDays: 10, durationDays: 18 },
    "Plafond gypsum 120x240": { startOffsetDays: 28, durationDays: 12 },
    "Lantai vinyl homogeneous": { startOffsetDays: 40, durationDays: 10 },
    "Instalasi titik lampu LED": { startOffsetDays: 10, durationDays: 15 },
    "Stop kontak & saklar": { startOffsetDays: 25, durationDays: 7 },
    "AC Cassette 2 PK": { startOffsetDays: 32, durationDays: 8 },
  };

  // Schedule data for RAB-005 (Pabrik - start Sept 15, 2026)
  const schedule005: Record<string, { startOffsetDays: number; durationDays: number }> = {
    "Pondasi tiang pancang D500": { startOffsetDays: 0, durationDays: 45 },
    "Poer 100x100x80 cm": { startOffsetDays: 45, durationDays: 20 },
    "Kolom WF 300x150": { startOffsetDays: 65, durationDays: 30 },
    "Gording CNP 200": { startOffsetDays: 95, durationDays: 15 },
    "Kuda-kuda WF 400x200": { startOffsetDays: 95, durationDays: 35 },
    "Atap spandek 0.45mm": { startOffsetDays: 130, durationDays: 45 },
    "Dinding panel sandwich 50mm": { startOffsetDays: 130, durationDays: 60 },
    "Lantai beton industri 20cm": { startOffsetDays: 65, durationDays: 60 },
    "Epoxy coating lantai": { startOffsetDays: 175, durationDays: 20 },
  };

  const allSchedules = [schedule001, schedule002, schedule003, schedule004, schedule005];
  let totalUpdated = 0;

  // Get all RAB items
  const rabItems = await prisma.rabItem.findMany({
    include: {
      section: {
        include: {
          rab: true,
        },
      },
    },
  });

  console.log(`Found ${rabItems.length} total items across all RABs\n`);

  for (const item of rabItems) {
    const rabNumber = item.section.rab.number;

    // Find the matching schedule
    let schedule: Record<string, { startOffsetDays: number; durationDays: number }> | null = null;

    if (rabNumber.includes("001")) {
      schedule = schedule001;
    } else if (rabNumber.includes("002")) {
      schedule = schedule002;
    } else if (rabNumber.includes("003")) {
      schedule = schedule003;
    } else if (rabNumber.includes("004")) {
      schedule = schedule004;
    } else if (rabNumber.includes("005")) {
      schedule = schedule005;
    }

    if (schedule) {
      // Try to match by description (partial match)
      const descLower = item.description.toLowerCase();
      let matchedSchedule: { startOffsetDays: number; durationDays: number } | null = null;

      for (const [key, value] of Object.entries(schedule)) {
        if (descLower.includes(key.toLowerCase()) || key.toLowerCase().includes(descLower)) {
          matchedSchedule = value;
          break;
        }
      }

      if (matchedSchedule) {
        await prisma.rabItem.update({
          where: { id: item.id },
          data: {
            startOffsetDays: matchedSchedule.startOffsetDays,
            durationDays: matchedSchedule.durationDays,
          },
        });
        totalUpdated++;
        console.log(
          `✅ ${rabNumber}: "${item.description}" -> offset: ${matchedSchedule.startOffsetDays}, duration: ${matchedSchedule.durationDays}`
        );
      } else {
        // Set default schedule based on order in section
        const sectionItems = await prisma.rabItem.findMany({
          where: { sectionId: item.sectionId },
          orderBy: { order: "asc" },
        });
        const itemIndex = sectionItems.findIndex((i) => i.id === item.id);

        if (itemIndex >= 0 && itemIndex < 3) {
          // First 3 items get actual schedules
          const defaults = [
            { startOffsetDays: 0, durationDays: 10 },
            { startOffsetDays: 10, durationDays: 10 },
            { startOffsetDays: 20, durationDays: 10 },
          ];
          await prisma.rabItem.update({
            where: { id: item.id },
            data: defaults[itemIndex],
          });
          totalUpdated++;
          console.log(
            `⚠️  ${rabNumber}: "${item.description}" -> default offset: ${defaults[itemIndex].startOffsetDays}, duration: ${defaults[itemIndex].durationDays}`
          );
        }
      }
    }
  }

  console.log(`\n📊 Total items updated: ${totalUpdated}`);

  // Verify
  const itemsWithSchedule = await prisma.rabItem.count({
    where: {
      durationDays: { gt: 0 },
    },
  });
  console.log(`📊 Items with duration > 0: ${itemsWithSchedule}`);

  console.log("\n✅ Schedule update complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
