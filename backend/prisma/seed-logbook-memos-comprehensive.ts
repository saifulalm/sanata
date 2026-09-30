/**
 * Logbook & Site Memos Comprehensive Seeder
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("======================================================================");
  console.log("LOGBOOK & SITE MEMOS COMPREHENSIVE SEEDING");
  console.log("======================================================================");
  console.log("");

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin?.id || "";

  // Get all RABs
  const rabs = await prisma.rab.findMany();

  console.log(`Found ${rabs.length} RAB projects`);

  let totalLogbook = 0;
  let totalMemos = 0;

  for (const rab of rabs) {
    console.log(`\n📖 Processing ${rab.number}`);

    // Create Logbook Entries
    const logbookEntries = generateLogbookEntries(rab);
    for (const entry of logbookEntries) {
      const existing = await prisma.logbookEntry.findFirst({
        where: {
          rabId: rab.id,
          date: entry.date,
          title: entry.title,
        },
      });

      if (!existing) {
        await prisma.logbookEntry.create({
          data: {
            ...entry,
            createdById: adminId,
          },
        });
        totalLogbook++;
      }
    }

    console.log(`   ✅ Created ${logbookEntries.length} logbook entries`);

    // Create Site Memos
    const memos = generateSiteMemos(rab, adminId);
    for (const memo of memos) {
      const existing = await prisma.siteMemo.findUnique({
        where: { number: memo.number },
      });

      if (!existing) {
        await prisma.siteMemo.create({
          data: {
            ...memo,
            createdById: adminId,
          },
        });
        totalMemos++;
      }
    }

    console.log(`   ✅ Created ${memos.length} site memos`);
  }

  console.log("\n======================================================================");
  console.log(`✅ LOGBOOK & MEMOS SEEDING COMPLETE! Logbook: ${totalLogbook}, Memos: ${totalMemos}`);
  console.log("======================================================================");
}

function generateLogbookEntries(rab: any) {
  const entries = [];
  const startDate = rab.scheduleStart ? new Date(rab.scheduleStart) : new Date();
  const now = new Date();

  // Different entry types based on project stage
  const currentDate = new Date(startDate);
  let dayOffset = 0;

  while (currentDate <= now && entries.length < 15) {
    const dayNum = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // KUNJUNGAN_KONSULTAN
    if (dayNum % 30 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "10:00",
        category: "KUNJUNGAN_KONSULTAN" as const,
        severity: "INFO" as const,
        title: `Inspection Rutin Konsultan Pengawas - Minggu ${Math.floor(dayNum / 7) + 1}`,
        description: `Tim pengawas melakukan inspection rutin mingguan. Memeriksa progress pekerjaan struktur lantai ${Math.min(Math.floor(dayNum / 30) + 1, 4)}. Hasil: pekerjaan sesuai spesifikasi teknis.`,
        involvedParty: "PT Nusantara Engineering Consultant",
        actionTaken: "Dokumentasi photo progress, prepare inspection report",
        followUp: "Follow up punch list items pada minggu depan",
        isResolved: true,
        resolvedAt: new Date(currentDate),
      });
    }

    // KUNJUNGAN_CLIENT
    if (dayNum % 45 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "14:00",
        category: "KUNJUNGAN_CLIENT" as const,
        severity: "INFO" as const,
        title: "Kunjungan Klien - Progress Review",
        description: `Klien ${rab.clientName} meninjau langsung progress proyek. Klien puas dengan kualitas pekerjaan fondasi dan struktur awal.`,
        involvedParty: rab.clientName,
        actionTaken: "Presentasi progress report, diskusi schedule selanjutnya",
        isResolved: true,
        resolvedAt: new Date(currentDate),
      });
    }

    // INSTRUKSI_LAPANGAN
    if (dayNum % 10 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "08:30",
        category: "INSTRUKSI_LAPANGAN" as const,
        severity: "RINGAN" as const,
        title: "Perubahan Detail Penulangan Balok B3",
        description: "Konsultan struktural mengeluarkan revised drawing untuk balok B3. Penyimpangan: jarak sengkang diperketat dari @150mm menjadi @100mm.",
        involvedParty: "Konsultan Struktur",
        actionTaken: "Sosialisasi ke tukang besi, penyesuaian fabrikasi",
        isResolved: true,
        resolvedAt: new Date(new Date(currentDate).setDate(currentDate.getDate() + 1)),
      });
    }

    // GANGGUAN_CUACA
    if (dayNum % 20 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "14:30",
        category: "GANGGUAN_CUACA" as const,
        severity: "RINGAN" as const,
        title: "Hujan Deras Mengganggu Pekerjaan Exterior",
        description: "Curah hujan tinggi mengganggu pekerjaan pengecatan eksterior dan pengecoran slab. Pekerjaan exterior dihentikan sementara.",
        actionTaken: "Cover area kerja dengan terpal, resume besok pagi",
        isResolved: false,
      });
    }

    // KERUSAKAN_ALAT
    if (dayNum % 60 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "11:00",
        category: "KERUSAKAN_ALAT" as const,
        severity: "SEDANG" as const,
        title: "Concrete Mixer Breakdown",
        description: "Concrete mixer utama mengalami masalah mesin. Tidak bisa beroperasi untuk pengecoran besok.",
        involvedParty: "Tim Mechanik",
        actionTaken: "Panggil mekanik untuk perbaikan. Siapkan backup concrete mixer dari warehouse.",
        followUp: "Perbaikan dalam 2 hari, scheduling pengecoran adjustment",
        isResolved: false,
      });
    }

    // KESALAHAN_KERJA
    if (dayNum % 40 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "09:00",
        category: "KESALAHAN_KERJA" as const,
        severity: "BERAT" as const,
        title: "Besi Tulangan Terpasang Salah Posisi",
        description: "Saat QC check, ditemukan besi tulangan kolom K3 terpasang tidak sesuai drawing. Selisih posisi 5cm dari seharusnya.",
        involvedParty: "Tukang Besi Team B",
        actionTaken: "Stop pekerjaan, demolisi section yang salah, prepare rework plan",
        followUp: "Training ulang tukang besi tentang reading drawing",
        isResolved: true,
        resolvedAt: new Date(new Date(currentDate).setDate(currentDate.getDate() + 2)),
      });
    }

    // LAINNYA
    if (dayNum % 15 === 0) {
      entries.push({
        rabId: rab.id,
        date: new Date(currentDate),
        timeOfDay: "07:30",
        category: "LAINNYA" as const,
        severity: "INFO" as const,
        title: "Rapat Progress Mingguan",
        description: "Rapat koordinasi progress mingguan. Capaian mingguan: fondasi 100%, kolom lantai 1 mencapai 80%.",
        actionTaken: "Fokus percepatan kolom lantai 2, koordinasi delivery material",
        isResolved: true,
        resolvedAt: new Date(currentDate),
      });
    }

    currentDate.setDate(currentDate.getDate() + 5);
    dayOffset += 5;
  }

  return entries;
}

function generateSiteMemos(rab: any, adminId: string) {
  const memos = [];
  const year = new Date().getFullYear();
  let memoNum = 1;

  // INCOMING Memos
  memos.push({
    rabId: rab.id,
    number: `SM-IN-${year}-${String(memoNum++).padStart(3, "0")}`,
    direction: "INCOMING" as const,
    category: "INSTRUKSI" as const,
    status: "CLOSED" as const,
    subject: "Perubahan Desain Partisi Lantai 2",
    body: `Berdasarkan diskusi dengan klien, kami instruksikan perubahan desain partisi ruang meeting lantai 2 dari dinding bata menjadi dinding kaca tempered. Mohon adjust detail anggaran dan schedule.<br><br>Detail perubahan:<br>1. Dinding kaca tempered 12mm<br>2. Frame aluminium<br>3. Door system integrated`,
    fromParty: rab.clientName || "Klien",
    toParty: "PT Sanata Construction",
    letterDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    handledAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    createdById: adminId,
  });

  memos.push({
    rabId: rab.id,
    number: `SM-IN-${year}-${String(memoNum++).padStart(3, "0")}`,
    direction: "INCOMING" as const,
    category: "KOMPLAIN" as const,
    status: "IN_PROGRESS" as const,
    subject: "Permintaan Percepatan Jadwal Finishing",
    body: `Klien meminta percepatan jadwal finishing 2 minggu dari schedule awal. Mohon kami diberikan alternatif方案 untuk mengejar schedule tanpa mengorbankan kualitas.`,
    fromParty: rab.clientName || "Klien",
    toParty: "PT Sanata Construction",
    letterDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdById: adminId,
  });

  memos.push({
    rabId: rab.id,
    number: `SM-IN-${year}-${String(memoNum++).padStart(3, "0")}`,
    direction: "INCOMING" as const,
    category: "PERMINTAAN_INFO" as const,
    status: "OPEN" as const,
    subject: "Konfirmasi Spesifikasi Lantai Rooftop",
    body: `Mohon konfirmasi spesifikasi material lantai rooftop yang akan digunakan. Apakah tetap menggunakan concrete screed atau ada perubahan desain?`,
    fromParty: "Konsultan Arsitektur",
    toParty: "PT Sanata Construction",
    letterDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdById: adminId,
  });

  // OUTGOING Memos
  memos.push({
    rabId: rab.id,
    number: `SM-OUT-${year}-${String(memoNum++).padStart(3, "0")}`,
    direction: "OUTGOING" as const,
    category: "APPROVAL" as const,
    status: "CLOSED" as const,
    subject: "Persetujuan Perubahan Material - AC System",
    body: `Sehubungan dengan surat masuk terkait perubahan AC system, kami sampaikan persetujuan dengan kondisi:<br>1. Menggunakan AC central dengan kapasitas sesuai perhitungan<br>2. Budget adjustment Rp 45.000.000<br>3. Schedule tambahan 3 hari kerja`,
    fromParty: "PT Sanata Construction",
    toParty: rab.clientName || "Klien",
    letterDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    handledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    createdById: adminId,
  });

  memos.push({
    rabId: rab.id,
    number: `SM-OUT-${year}-${String(memoNum++).padStart(3, "0")}`,
    direction: "OUTGOING" as const,
    category: "LAINNYA" as const,
    status: "CLOSED" as const,
    subject: "Jadwal Inspection Struktur Minggu Depan",
    body: `Kami sampaikan jadwal inspection struktur yang akan dilakukan konsultan pengawas:<br><br>Hari/Tanggal: Kamis, ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}<br>Waktu: 09.00 WIB<br>Lokasi: Proyek ${rab.title}<br><br>Mohon disiapkan:<br>1. Shop drawing terbaru<br>2. QC report<br>3. Sample material untuk pengujian`,
    fromParty: "PT Sanata Construction",
    toParty: "PT Nusantara Engineering Consultant",
    letterDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    handledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    closedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdById: adminId,
  });

  return memos;
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
