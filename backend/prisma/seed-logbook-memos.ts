import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Logbook & Site Memo seed...\n");

  // Get all approved/in-progress RABs
  const rabs = await prisma.rab.findMany({
    where: {
      status: { in: ["APPROVED", "REVIEW"] },
    },
    orderBy: { number: "asc" },
  });

  if (rabs.length === 0) {
    console.log("No RAB projects found. Please run the main seed first.");
    return;
  }

  console.log(`Found ${rabs.length} RAB projects to seed logbook & memos.\n`);

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin?.id ?? null;

  // Map RAB numbers to objects for easy reference
  const rabMap = new Map(rabs.map((r) => [r.number, r]));
  const rab1 = rabMap.get("RAB-2026-001") ?? rabs[0];
  const rab2 = rabMap.get("RAB-2026-002") ?? rabs[1];
  const rab3 = rabMap.get("RAB-2026-003") ?? rabs[2];
  const rab6 = rabMap.get("RAB-2026-006") ?? rabs[3];

  // ============================================================
  // LOGBOOK ENTRIES - RAB-2026-001 (Gedung Perkantoran 4 Lantai)
  // ============================================================
  console.log("Seeding Logbook Entries for RAB-2026-001...");

  const existingLog1 = await prisma.logbookEntry.count({ where: { rabId: rab1.id } });
  if (existingLog1 === 0) {
    await prisma.logbookEntry.createMany({
      data: [
        // === INFO LEVEL ===
        {
          rabId: rab1.id,
          date: new Date("2026-08-10"),
          timeOfDay: "09:30",
          category: "KUNJUNGAN_KONSULTAN",
          severity: "INFO",
          title: "Kunjungan Konsultan Pengawas - Inspection Struktur",
          description: "Tim pengawas melakukan inspection rutin bulanan. Hasil: struktur sesuai spesifikasi teknis. Punch list minor untuk finishing sekitar 3 titik.",
          involvedParty: "PT Nusantara Engineering Consultant",
          actionTaken: "Dokumentasi inspection, prepare punch list jika ada",
          isResolved: true,
          resolvedAt: new Date("2026-08-10")
        },
        {
          rabId: rab1.id,
          date: new Date("2026-08-08"),
          timeOfDay: "10:00",
          category: "KUNJUNGAN_KONSULTAN",
          severity: "RINGAN",
          title: "Klarifikasi Detail Penulangan Balok B3",
          description: "Konsultan struktur meminta klarifikasi detail sambungan kolom K3. Perlu ditambahkan plat sambung 10mm sesuai hasil perhitungan ulang.",
          involvedParty: "CV Bina Konsultan Struktur",
          actionTaken: "Menyiapkan detail sambungan tambahan sesuai instruksi konsultan",
          followUp: "Detail drawing telah dikirim via email, menunggu approval",
          isResolved: true,
          resolvedAt: new Date("2026-08-09")
        },
        // === RINGAN LEVEL ===
        {
          rabId: rab1.id,
          date: new Date("2026-08-14"),
          timeOfDay: "14:00",
          category: "GANGGUAN_CUACA",
          severity: "RINGAN",
          title: "Hujan Deras Siang Ini",
          description: "Curah hujan tinggi mengganggu pekerjaan cor plat lantai 3. Pekerjaan dihentikan sementara untuk safety.",
          involvedParty: "Cuaca - Musim hujan Agustus",
          actionTaken: "Cover area kerja dengan terpal, resume besok pagi",
          followUp: "Scheduling ulang pengecoran untuk tanggal 16 Agustus",
          isResolved: false
        },
        {
          rabId: rab1.id,
          date: new Date("2026-08-05"),
          timeOfDay: "08:00",
          category: "INSTRUKSI_LAPANGAN",
          severity: "RINGAN",
          title: "Perubahan Detail Penulangan Balok B3",
          description: "Konsultan struktural mengeluarkan revised drawing untuk balok B3. Penyimpangan dari gambar semula: jarak sengkang diperketat dari 150mm menjadi 100mm.",
          involvedParty: "CV Bina Konsultan Struktur",
          actionTaken: "Sosialisasi ke tukang besi, penyesuaian fabrikasi",
          followUp: "Fabrikasi ulang besi untuk balok B3 area A-C",
          isResolved: true,
          resolvedAt: new Date("2026-08-05")
        },
        // === SEDANG LEVEL ===
        {
          rabId: rab1.id,
          date: new Date("2026-08-11"),
          timeOfDay: "11:30",
          category: "KERUSAKAN_ALAT",
          severity: "SEDANG",
          title: "Concrete Mixer Bermasalah - Perlu Perbaikan",
          description: "Concrete mixer kapasitas 500 liter mengalami kerusakan pada sistem hidrolik. Pekerjaan pengecoran ditunda sementara.",
          involvedParty: "Alat berat - Concrete Mixer CM-01",
          actionTaken: "Panggil teknisi untuk inspection dan perbaikan",
          followUp: "Perbaikan estimasi 2-3 hari, pinjam mixer cadangan dari proyek lain",
          isResolved: false
        },
        {
          rabId: rab1.id,
          date: new Date("2026-08-07"),
          timeOfDay: "13:00",
          category: "LAINNYA",
          severity: "SEDANG",
          title: "Keluhan Warga - Getaran Lebih dari Batas Normal",
          description: "Warga sekitar mengeluhkan getaran yang lebih kuat dari biasanya saat pekerjaan pemadatan tanah. Perlu dilakukan pengukuran ulang.",
          involvedParty: "Warga sekitar - Pak Hendra (Jl. Sudirman 42)",
          actionTaken: "Koordinasi dengan warga, kurangi intensitas pekerjaan pemadatan",
          followUp: "Jadwalkan pengukuran vibrasi untuk memastikan masih dalam batas aman",
          isResolved: true,
          resolvedAt: new Date("2026-08-08")
        },
        // === BERAT LEVEL ===
        {
          rabId: rab1.id,
          date: new Date("2026-08-03"),
          timeOfDay: "09:00",
          category: "KESALAHAN_KERJA",
          severity: "BERAT",
          title: "Pemasangan Bekisting Kolom Tidak Sesuai Standar",
          description: "Bekisting kolom K4 pada lantai 2 terpasang miring 5cm. Konsultan pengawas menemukan saat inspection mendadak dan memerintahkan pembongkaran.",
          involvedParty: "Tim subcontractor - CV Jaya Steel",
          actionTaken: "Bongkaran bekisting dan pasang ulang dengan benar",
          followUp: "Sanksi warning letter ke subcontractor, training ulang tukang bekisting",
          isResolved: true,
          resolvedAt: new Date("2026-08-05")
        },
        // === KRITIS LEVEL ===
        {
          rabId: rab1.id,
          date: new Date("2026-08-01"),
          timeOfDay: "07:30",
          category: "KECELAKAAN_KERJA",
          severity: "KRITIS",
          title: "Near Miss - Material Jatuh dari Lantai 3",
          description: "Bekisting kayu jatuh dari ketinggian lantai 3. Untungnya tidak ada pekerja di bawah. Perlu investigasi penyebab dan perbaikan SOP.",
          involvedParty: "Pekerja - Tim bekisting",
          actionTaken: "Hentikan pekerjaan sementara, evacuate area bawah, investigasi penyebab",
          followUp: "Pasang safety net di setiap lantai, briefing ulang safety procedure",
          isResolved: true,
          resolvedAt: new Date("2026-08-01")
        },
        // === MORE ENTRIES ===
        {
          rabId: rab1.id,
          date: new Date("2026-08-06"),
          timeOfDay: "08:00",
          category: "LAINNYA",
          severity: "INFO",
          title: "Rapat Progress Mingguan",
          description: "Rapat koordinasi progress mingguan. Capaian: fondasi dan sloof 100%, kolom lantai 1 mencapai 80%, kolom lantai 2 40%.",
          involvedParty: "Tim Proyek Sanata + Konsultan Pengawas",
          actionTaken: "Fokus percepatan kolom lantai 2 dan 3",
          isResolved: true,
          resolvedAt: new Date("2026-08-06")
        },
        {
          rabId: rab1.id,
          date: new Date("2026-08-09"),
          timeOfDay: "10:00",
          category: "KUNJUNGAN_CLIENT",
          severity: "INFO",
          title: "Kunjungan Klien - Progress Review",
          description: "Tim klien PT Nusantara Realty melakukan kunjungan untuk melihat progress. Klien puas dengan hasil pekerjaan fondasi dan struktur.",
          involvedParty: "PT Nusantara Realty Indonesia - Tim Owner",
          actionTaken: "Melanjutkan pekerjaan sesuai schedule",
          isResolved: true,
          resolvedAt: new Date("2026-08-09")
        },
        {
          rabId: rab1.id,
          date: new Date("2026-08-12"),
          timeOfDay: "15:00",
          category: "GANGGUAN_WARGA",
          severity: "RINGAN",
          title: "Warga Keluhkan Parkir di Jalan Umum",
          description: "Warga mengeluhkan kendaraan proyek yang parkir di jalan umum saat jam sibuk. Perlu koordinasi dengan RT/RW setempat.",
          involvedParty: "Warga sekitar - Komunitas RT 05",
          actionTaken: "Sediakan lahan parkir khusus di area proyek, atur jadwal keluar masuk kendaraan",
          isResolved: true,
          resolvedAt: new Date("2026-08-13")
        },
        {
          rabId: rab1.id,
          date: new Date("2026-08-15"),
          timeOfDay: "08:30",
          category: "KEAMANAN",
          severity: "SEDANG",
          title: "Kehilangan Tools di Lokasi Proyek",
          description: "Beberapa tools tangan seperti palu, obeng, dan gerinda hilang dari gudang sementara. Kemungkinan dicuri.",
          involvedParty: "Security - Tim jaga malam",
          actionTaken: "Meningkatkan keamanan, pasang CCTV tambahan, laporan polisi",
          followUp: "Pemasangan CCTV dan perbaikan sistem keamanan gudang",
          isResolved: false
        },
      ]
    });
    console.log("Created 12 logbook entries for RAB-2026-001");
  } else {
    console.log(`RAB-2026-001 already has ${existingLog1} logbook entries - skipping.`);
  }

  // ============================================================
  // LOGBOOK ENTRIES - RAB-2026-002 (Renovasi Rumah Tinggal)
  // ============================================================
  console.log("Seeding Logbook Entries for RAB-2026-002...");

  const existingLog2 = await prisma.logbookEntry.count({ where: { rabId: rab2.id } });
  if (existingLog2 === 0) {
    await prisma.logbookEntry.createMany({
      data: [
        // === INFO LEVEL ===
        {
          rabId: rab2.id,
          date: new Date("2026-08-10"),
          timeOfDay: "09:00",
          category: "KUNJUNGAN_KONSULTAN",
          severity: "INFO",
          title: "Survey Lokasi oleh Klien",
          description: "Klien Pak Budi Santoso meninjau langsung progress di lokasi. Klien puas dengan kualitas pekerjaan fondasi yang sudah selesai.",
          involvedParty: "Budi Santoso - Pemilik",
          actionTaken: "Melanjutkan pekerjaan sesuai jadwal yang telah disepakati",
          isResolved: true,
          resolvedAt: new Date("2026-08-10")
        },
        {
          rabId: rab2.id,
          date: new Date("2026-08-08"),
          timeOfDay: "10:00",
          category: "LAINNYA",
          severity: "INFO",
          title: "Rapat Koordinasi Progress",
          description: "Progress pekerjaan mencapai 45%. Pembongkaran selesai, fondasi dan sloof selesai 100%, dinding baru sudah 60%.",
          involvedParty: "Tim Proyek Sanata",
          actionTaken: "Percepat pekerjaan dinding agar sesuai jadwal",
          isResolved: false
        },
        // === RINGAN LEVEL ===
        {
          rabId: rab2.id,
          date: new Date("2026-08-05"),
          timeOfDay: "07:30",
          category: "INSTRUKSI_LAPANGAN",
          severity: "RINGAN",
          title: "Perubahan Desain Plafond - Ketinggian Berubah",
          description: "Pemilik menginginkan perubahan ketinggian plafond dari 2.8m menjadi 3.0m di area ruang tamu karena ingin kesan lebih luas.",
          involvedParty: "Budi Santoso - Pemilik",
          actionTaken: "Menyesuaikan detail pekerjaan plaster dan plafon sesuai ketinggian baru",
          followUp: "Update gambar kerja dan hitung ulang kebutuhan material",
          isResolved: true,
          resolvedAt: new Date("2026-08-07")
        },
        {
          rabId: rab2.id,
          date: new Date("2026-08-09"),
          timeOfDay: "14:00",
          category: "GANGGUAN_CUACA",
          severity: "RINGAN",
          title: "Hujan Siang Hari - Progress Terhambat",
          description: "Hujan deras selama 3 jam mengganggu pekerjaan plaster. Peekrjaan dihentikan sementara untuk safety.",
          involvedParty: "Cuaca - Hujan lokal",
          actionTaken: "Cover area kerja, lanjutkan saat hujan reda",
          isResolved: true,
          resolvedAt: new Date("2026-08-09")
        },
        // === SEDANG LEVEL ===
        {
          rabId: rab2.id,
          date: new Date("2026-08-04"),
          timeOfDay: "11:00",
          category: "KERUSAKAN_ALAT",
          severity: "SEDANG",
          title: "Genset Mati - Listrik Padam di Lokasi",
          description: "Genset tiba-tiba mati saat proses welding. Kemungkinan masalah pada starter motor.",
          involvedParty: "Genset - 5kVA Backup",
          actionTaken: "Panggil teknisi untuk perbaikan genset",
          followUp: "Sewa genset cadangan sementara",
          isResolved: true,
          resolvedAt: new Date("2026-08-05")
        },
        {
          rabId: rab2.id,
          date: new Date("2026-08-06"),
          timeOfDay: "08:30",
          category: "KUNJUNGAN_CLIENT",
          severity: "RINGAN",
          title: "Klien Menghendaki Penambahan Area Carport",
          description: "Pak Budi meminta penambahan luasan carport dari 20 m2 menjadi 30 m2 sesuai kebutuhan keluarga.",
          involvedParty: "Budi Santoso - Pemilik",
          actionTaken: "Siapkan addendum RAB untuk perubahan scope",
          followUp: "Kirim RFQ untuk penambahan carport ke klien",
          isResolved: false
        },
        // === BERAT LEVEL ===
        {
          rabId: rab2.id,
          date: new Date("2026-08-02"),
          timeOfDay: "13:00",
          category: "KESALAHAN_KERJA",
          severity: "BERAT",
          title: "Pemasangan Keramik Lantai Salah Warna",
          description: "Tukang lantai salah pasang keramik dengan warna yang tidak sesuai pesanan. Perlu bongkar pasang ulang seluruh area ruang tamu.",
          involvedParty: "Tim subcontractor finishing",
          actionTaken: "Bongkcar semua keramik yang salah dan ganti dengan yang benar",
          followUp: "Supervisi lebih ketat untuk pekerjaan lantai",
          isResolved: true,
          resolvedAt: new Date("2026-08-04")
        },
      ]
    });
    console.log("Created 7 logbook entries for RAB-2026-002");
  } else {
    console.log(`RAB-2026-002 already has ${existingLog2} logbook entries - skipping.`);
  }

  // ============================================================
  // LOGBOOK ENTRIES - RAB-2026-003 (Pembangunan Rumah Tinggal 2 Lantai)
  // ============================================================
  console.log("Seeding Logbook Entries for RAB-2026-003...");

  const existingLog3 = await prisma.logbookEntry.count({ where: { rabId: rab3.id } });
  if (existingLog3 === 0) {
    await prisma.logbookEntry.createMany({
      data: [
        // === INFO LEVEL ===
        {
          rabId: rab3.id,
          date: new Date("2026-08-08"),
          timeOfDay: "09:00",
          category: "KUNJUNGAN_KONSULTAN",
          severity: "INFO",
          title: "Inspection Quality Control - Fondasi",
          description: "Konsultan pengawas melakukan inspection fondasi footplat. Hasil: semua fondasi sesuai spesifikasi dan siap untuk tahap sloof.",
          involvedParty: "Konsultan MK - PT Struktur Jaya",
          actionTaken: "Lanjutkan pekerjaan sloof sesuai schedule",
          isResolved: true,
          resolvedAt: new Date("2026-08-08")
        },
        {
          rabId: rab3.id,
          date: new Date("2026-08-12"),
          timeOfDay: "14:00",
          category: "LAINNYA",
          severity: "INFO",
          title: "Pengiriman Material - Besi Beton Tiba",
          description: "Pengiriman besi beton untuk sloof dan kolom tiba di lokasi. Total 2.5 ton besi D10 dan D13.",
          involvedParty: "Supplier - CV Baja Maju",
          actionTaken: "Inspeksi kualitas material, simpan di gudang yang aman",
          isResolved: true,
          resolvedAt: new Date("2026-08-12")
        },
        // === RINGAN LEVEL ===
        {
          rabId: rab3.id,
          date: new Date("2026-08-10"),
          timeOfDay: "10:30",
          category: "GANGGUAN_CUACA",
          severity: "RINGAN",
          title: "Hujan Deras Pagi Ini - Penundaan Pengecoran",
          description: "Hujan deras sejak pagi menyebabkan penundaan pengecoran sloof. Curah hujan terlalu tinggi untuk kualitas cor.",
          involvedParty: "Cuaca - Musim hujan Bogor",
          actionTaken: "Tunda pengecoran sloof ke hari berikutnya",
          followUp: "Scheduling ulang pengecoran dengan supplier ready mix",
          isResolved: true,
          resolvedAt: new Date("2026-08-11")
        },
        {
          rabId: rab3.id,
          date: new Date("2026-08-05"),
          timeOfDay: "08:00",
          category: "INSTRUKSI_LAPANGAN",
          severity: "RINGAN",
          title: "Perubahan Dimensi Kolom - Konsultan Struktural",
          description: "Konsultan struktural mengeluarkan revised note: dimensi kolom praktis diubah dari 15x15cm menjadi 13x13cm sesuai hasil review ulang.",
          involvedParty: "Konsultan MK",
          actionTaken: "Update gambar kerja dan informasikan ke tukang",
          isResolved: true,
          resolvedAt: new Date("2026-08-05")
        },
        // === SEDANG LEVEL ===
        {
          rabId: rab3.id,
          date: new Date("2026-08-07"),
          timeOfDay: "11:00",
          category: "KERUSAKAN_ALAT",
          severity: "SEDANG",
          title: "Mesin Gerinda Tangan Rusak - Butuh Penggantian",
          description: "Mesin gerinda tangan mengalami kerusakan pada stator motor. Tidak bisa digunakan untuk cutting besi.",
          involvedParty: "Alat - Gerinda DeWalt DWE840",
          actionTaken: "Kirim untuk perbaikan dan pinjam alat cadangan",
          followUp: "Perbaikan estimasi 2 hari",
          isResolved: true,
          resolvedAt: new Date("2026-08-09")
        },
        {
          rabId: rab3.id,
          date: new Date("2026-08-14"),
          timeOfDay: "13:30",
          category: "KUNJUNGAN_CLIENT",
          severity: "SEDANG",
          title: "Klien Mengajukan Perubahan - Penambahan Jendela",
          description: "Pak Hendra meminta penambahan 2 jendela di kamar tidur lantai 2 yang sebelumnya tidak ada dalam desain.",
          involvedParty: "Hendra Wijaya - Pemilik",
          actionTaken: "Prepare quotation untuk addendum pekerjaan jendela",
          followUp: "Kirim quotation addendum dalam 3 hari",
          isResolved: false
        },
        // === BERAT LEVEL ===
        {
          rabId: rab3.id,
          date: new Date("2026-08-01"),
          timeOfDay: "15:00",
          category: "GANGGUAN_WARGA",
          severity: "BERAT",
          title: "Keluhan Kebisingan - Jam Istirahat",
          description: "Warga sekitar mengeluhkan suara bor yang terlalu keras saat jam istirahat anak sekolah. Perlu penyesuaian jadwal kerja.",
          involvedParty: "Warga sekitar - Pak Haji Salim",
          actionTaken: "Atur ulang jadwal pekerjaan berat: berhenti jam 12-14",
          followUp: "Pasang sekat akustik di area yang berbatasan dengan rumah warga",
          isResolved: true,
          resolvedAt: new Date("2026-08-02")
        },
        {
          rabId: rab3.id,
          date: new Date("2026-08-03"),
          timeOfDay: "07:00",
          category: "KEAMANAN",
          severity: "BERAT",
          title: "Pencurian Material di Malam Hari",
          description: "Beberapa batako dan pasir dicuri dari lokasi proyek malam tadi. Kerugian diperkirakan Rp 500.000.",
          involvedParty: "Security - Jemput malam",
          actionTaken: "Laporan ke polisi, tingkatkan patrol security",
          followUp: "Pasang pagar tambahan dan CCTV dengan night vision",
          isResolved: false
        },
        // === KRITIS LEVEL ===
        {
          rabId: rab3.id,
          date: new Date("2026-07-28"),
          timeOfDay: "10:00",
          category: "KECELAKAAN_KERJA",
          severity: "KRITIS",
          title: "Minor Injury - Tangan Tersengat Listrik",
          description: "Satu pekerja mengalami sengatan listrik ringan saat memperbaiki kabel genset. Workers langsung ditangani dan kondisi stabil.",
          involvedParty: "Pekerja - Pak Anto (Tukang Listrik)",
          actionTaken: "First aid di lokasi, bawa ke klinik terdekat untuk check-up",
          followUp: "Investigasi penyebab, perbaiki grounding genset, briefing K3",
          isResolved: true,
          resolvedAt: new Date("2026-07-28")
        },
      ]
    });
    console.log("Created 9 logbook entries for RAB-2026-003");
  } else {
    console.log(`RAB-2026-003 already has ${existingLog3} logbook entries - skipping.`);
  }

  // ============================================================
  // LOGBOOK ENTRIES - RAB-2026-006 (Pembangunan Ruko 4 Lantai)
  // ============================================================
  console.log("Seeding Logbook Entries for RAB-2026-006...");

  const existingLog6 = await prisma.logbookEntry.count({ where: { rabId: rab6.id } });
  if (existingLog6 === 0) {
    await prisma.logbookEntry.createMany({
      data: [
        // === INFO LEVEL ===
        {
          rabId: rab6.id,
          date: new Date("2026-08-09"),
          timeOfDay: "09:00",
          category: "KUNJUNGAN_KONSULTAN",
          severity: "INFO",
          title: "Review Shop Drawing - Fasad dan Curtain Wall",
          description: "Konsultan arsitektur melakukan review shop drawing curtain wall lantai 1-4. Drawing approved dengan catatan minor.",
          involvedParty: "Konsultan Arsitektur - Studio Design Interior",
          actionTaken: "Implementasi catatan revisi, proceed dengan fabrikasi",
          isResolved: true,
          resolvedAt: new Date("2026-08-09")
        },
        {
          rabId: rab6.id,
          date: new Date("2026-08-11"),
          timeOfDay: "14:30",
          category: "LAINNYA",
          severity: "INFO",
          title: "Delivery Material - Curtain Wall System",
          description: "Material curtain wall alumunium dan kaca tempered mulai tiba di lokasi. Schedule kedatangan bertahap hingga akhir bulan.",
          involvedParty: "Supplier - PT Alumindo Jaya",
          actionTaken: "Inspeksi quality, simpan di warehouse dengan perlindungan",
          isResolved: true,
          resolvedAt: new Date("2026-08-11")
        },
        {
          rabId: rab6.id,
          date: new Date("2026-08-13"),
          timeOfDay: "10:00",
          category: "KUNJUNGAN_CLIENT",
          severity: "INFO",
          title: "Monthly Progress Meeting dengan Klien",
          description: "Rapat progress bulanan dengan Pak Budi Santoso. Progress overall 58%, slightly ahead of schedule.",
          involvedParty: "Budi Santoso - Pemilik Cluster Kemang",
          actionTaken: "Lanjutkan pekerjaan sesuai current pace",
          isResolved: true,
          resolvedAt: new Date("2026-08-13")
        },
        // === RINGAN LEVEL ===
        {
          rabId: rab6.id,
          date: new Date("2026-08-06"),
          timeOfDay: "08:30",
          category: "GANGGUAN_CUACA",
          severity: "RINGAN",
          title: "Angin Kencang - Pekerjaan Lantai 4 Dihentikan",
          description: "Angin kencang mengganggu pekerjaan exterior di lantai 4. Safety concern untuk pekerja di ketinggian.",
          involvedParty: "Cuaca - Angin Muson",
          actionTaken: "Hentikan sementara pekerjaan exterior, focus ke interior",
          isResolved: true,
          resolvedAt: new Date("2026-08-06")
        },
        {
          rabId: rab6.id,
          date: new Date("2026-08-04"),
          timeOfDay: "11:00",
          category: "INSTRUKSI_LAPANGAN",
          severity: "RINGAN",
          title: "Revised Detail - Penambahan Fire Stop",
          description: "Konsultan MEP meminta penambahan fire stop di setiap floor penetration untuk sistem fire protection.",
          involvedParty: "Konsultan MEP - PT Mekanika Elektrika",
          actionTaken: "Koordinasikan dengan subcontractor fire protection",
          isResolved: true,
          resolvedAt: new Date("2026-08-05")
        },
        // === SEDANG LEVEL ===
        {
          rabId: rab6.id,
          date: new Date("2026-08-07"),
          timeOfDay: "13:00",
          category: "KERUSAKAN_ALAT",
          severity: "SEDANG",
          title: "Mobile Crane Tire Puncture - Mobilitas Terbatas",
          description: "Ban mobile crane mengalami puncture saat mengangkat material ke lantai 3. Crane tidak bisa bergerak.",
          involvedParty: "Mobile Crane - 25 ton capacity",
          actionTaken: "Panggil bengkel untuk perbaikan ban, scheduling forklift sebagai alternatif",
          followUp: "Perbaikan estimated 1 hari",
          isResolved: true,
          resolvedAt: new Date("2026-08-08")
        },
        {
          rabId: rab6.id,
          date: new Date("2026-08-10"),
          timeOfDay: "09:30",
          category: "LAINNYA",
          severity: "SEDANG",
          title: "Quality Issue - Ketebalan Kaca Tempered Tidak Sesuai",
          description: "Sample check menunjukkan ketebalan kaca tempered 8mm tidak sesuai spek (harus 10mm). Material perlu dikembalikan.",
          involvedParty: "Supplier - PT Alumindo Jaya",
          actionTaken: "Return material, minta penggantian sesuai spesifikasi",
          followUp: "Replacement estimated datang dalam 7 hari",
          isResolved: false
        },
        // === BERAT LEVEL ===
        {
          rabId: rab6.id,
          date: new Date("2026-08-02"),
          timeOfDay: "15:30",
          category: "KESALAHAN_KERJA",
          severity: "BERAT",
          title: "Salah Pasang Ducting AC - Harus Bongkar Ulang",
          description: "Subcontractor AC salah install ducting di corridor lantai 2. Ducting terbalik arah flow, perlu bongkar dan install ulang.",
          involvedParty: "Subcontractor AC - CV Dingin Sejahtera",
          actionTaken: "Bongkar dan reinstall ducting dengan orientasi yang benar",
          followUp: "Supervisi ketat untuk pekerjaan MEP",
          isResolved: true,
          resolvedAt: new Date("2026-08-04")
        },
        {
          rabId: rab6.id,
          date: new Date("2026-08-05"),
          timeOfDay: "16:00",
          category: "GANGGUAN_WARGA",
          severity: "BERAT",
          title: "Protes Warga - Akses Jalan Tersumbat",
          description: "Warga cluster mengeluhkan truk material yang menghalangi akses jalan utama. Kemacetan parah saat jam sibuk.",
          involvedParty: "Warga Cluster Kemang - RT 03",
          actionTaken: "Atur ulang jadwal delivery: hanya jam 07-09 dan 15-17",
          followUp: "Sediakan flagman untuk pengaturan lalu lintas",
          isResolved: true,
          resolvedAt: new Date("2026-08-06")
        },
        // === KRITIS LEVEL ===
        {
          rabId: rab6.id,
          date: new Date("2026-07-30"),
          timeOfDay: "11:30",
          category: "KECELAKAAN_KERJA",
          severity: "KRITIS",
          title: "Near Miss - Benda Jatuh dari Ketinggian",
          description: "Braket lampu jatuh dari lantai 3, mengenai scaffolding di bawah. Tidak ada korban tetapi险些 fatal accident.",
          involvedParty: "Pekerja finishing lantai 3",
          actionTaken: "Stop semua pekerjaan, investigate penyebab",
          followUp: "Pasang safety net dan hard hat zone di bawah area kerja",
          isResolved: true,
          resolvedAt: new Date("2026-07-30")
        },
      ]
    });
    console.log("Created 10 logbook entries for RAB-2026-006");
  } else {
    console.log(`RAB-2026-006 already has ${existingLog6} logbook entries - skipping.`);
  }

  // ============================================================
  // SITE MEMOS - RAB-2026-001 (Gedung Perkantoran 4 Lantai)
  // ============================================================
  console.log("\nSeeding Site Memos for RAB-2026-001...");

  const existingMemos1 = await prisma.siteMemo.count({ where: { rabId: rab1.id } });
  if (existingMemos1 === 0) {
    // Create parent memos first
    const memo1 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-001",
        rabId: rab1.id,
        direction: "INCOMING",
        category: "INSTRUKSI",
        status: "IN_PROGRESS",
        subject: "Perubahan Lokasi Ground Tank Air",
        body: "Mohon pemindahan lokasi ground water tank dari sisi barat ke sisi timur bangunan sesuai hasil value engineering yang telah dibahas dalam meeting terakhir. Hal ini untuk mengoptimalkan struktur dan mengurangi biaya fondasi.\n\nDetail perubahan:\n1. Lokasi baru: sisi timur bangunan, area taman\n2. Kapasitas tetap: 10.000 liter\n3. Estimasi penghematan: Rp 15.000.000\n\nMohon diproses secepatnya agar tidak mempengaruhi schedule.",
        fromParty: "PT Nusantara Realty Indonesia",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-10"),
        dueDate: new Date("2026-08-20"),
        createdById: adminId,
      }
    });

    const memo2 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-002",
        rabId: rab1.id,
        direction: "INCOMING",
        category: "KOMPLAIN",
        status: "OPEN",
        subject: "Keluhan Kualitas Finishing Dinding Lantai 2",
        body: "Setelah dilakukan inspection pada tanggal 15 Agustus 2026, kami menemukan beberapa catatan terkait kualitas finishing:\n\n1. Retak rambut pada dinding area lift lobby\n2. Cat mengelupas di sudut dinding kamar mandi\n3. Ketidakrataan permukaan di beberapa area\n\nMohon dilakukan perbaikan sebelum progress billing termin berikutnya diproses. Perbaikan diharapkan selesai sebelum tanggal 25 Agustus 2026.",
        fromParty: "PT Nusantara Realty Indonesia - Tim QA/QC",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-16"),
        dueDate: new Date("2026-08-25"),
        createdById: adminId,
      }
    });

    const memo3 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-003",
        rabId: rab1.id,
        direction: "INCOMING",
        category: "PERMINTAAN_INFO",
        status: "ANSWERED",
        subject: "Konfirmasi Jadwal Inspection Struktur Lantai 3",
        body: "Kami meminta konfirmasi jadwal inspection struktur untuk lantai 3 yang dijadwalkan minggu depan. Mohon informasi:\n\n1. Tanggal dan waktu yang proposed\n2. Personil yang akan hadir dari pihak kontraktor\n3. Dokumen yang perlu disiapkan\n\nInspection ini penting untuk kelancaran progress pekerjaan selanjutnya.",
        fromParty: "CV Bina Konsultan Struktur",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-08"),
        dueDate: new Date("2026-08-12"),
        handledAt: new Date("2026-08-10"),
        createdById: adminId,
      }
    });

    // Create reply memo
    await prisma.siteMemo.create({
      data: {
        number: "SM-OUT-2026-001",
        rabId: rab1.id,
        direction: "OUTGOING",
        category: "LAINNYA",
        status: "CLOSED",
        subject: "Jadwal Inspection Struktur Minggu Depan",
        body: "Sehubungan dengan surat Beliau No. SM-IN-2026-003 tanggal 8 Agustus 2026, dengan ini kami sampaikan konfirmasi jadwal inspection:\n\nTanggal: Kamis, 22 Agustus 2026\nWaktu: 09.00 WIB\nLokasi: Lantai 3, Gedung Perkantoran PT Nusantara Realty\n\nPersonil yang akan hadir:\n1. Site Manager: Agus Prasetyo, ST\n2. QC Engineer: Radiation Harry\n3. Drafter: Tim lapangan\n\nDokumen yang disiapkan:\n- Shop drawing terbaru\n- Hasil test mix design\n- Laporan quality control harian\n\nKami menunggu kehadiran Tim Konsultan pada jadwal yang telah ditentukan.",
        fromParty: "PT Sanata Construction",
        toParty: "CV Bina Konsultan Struktur",
        letterDate: new Date("2026-08-10"),
        handledAt: new Date("2026-08-10"),
        closedAt: new Date("2026-08-22"),
        parentId: memo3.id,
        createdById: adminId,
      }
    });

    const memo5 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-004",
        rabId: rab1.id,
        direction: "INCOMING",
        category: "APPROVAL",
        status: "OPEN",
        subject: "Persetujuan Addendum Steel Beam WF 300",
        body: "Merujuk pada project submission No. SUB-2026-001 tentang pengadaan Steel Beam WF 300, kami telah melakukan review dan menyetujui pengajuan dengan catatan:\n\n1. Harga yang disetujui sesuai quotation supplier Rp 35.625.000/ton\n2. Pengiriman bertahap sesuai schedule proyek\n3. Quality certificate harus dilampirkan saat delivery\n\nMohon konfirmasi persetujuan ini agar procurement dapat segera diproses.",
        fromParty: "PT Nusantara Realty Indonesia",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-18"),
        dueDate: new Date("2026-08-25"),
        createdById: adminId,
      }
    });

    const memo6 = await prisma.siteMemo.create({
      data: {
        number: "SM-OUT-2026-002",
        rabId: rab1.id,
        direction: "OUTGOING",
        category: "KLARIFIKASI",
        status: "IN_PROGRESS",
        subject: "Klarifikasi Specifikasi Curtain Wall Lantai 4",
        body: "Mohon klarifikasi mengenai spesifikasi curtain wall untuk lantai 4:\n\n1. Apakah glass type yang disetujui adalah tempered atau laminated?\n2. Thickness 8mm atau 10mm?\n3. Colour tinting: clear, grey, atau green?\n\nPerbedaan spesifikasi akan mempengaruhi budget dan schedule procurement. Mohon回复 secepatnya agar tidak terjadi delay.",
        fromParty: "PT Sanata Construction",
        toParty: "CV Bina Konsultan Arsitektur",
        letterDate: new Date("2026-08-19"),
        createdById: adminId,
      }
    });

    console.log("Created 6 site memos for RAB-2026-001");
  } else {
    console.log(`RAB-2026-001 already has ${existingMemos1} site memos - skipping.`);
  }

  // ============================================================
  // SITE MEMOS - RAB-2026-002 (Renovasi Rumah Tinggal)
  // ============================================================
  console.log("Seeding Site Memos for RAB-2026-002...");

  const existingMemos2 = await prisma.siteMemo.count({ where: { rabId: rab2.id } });
  if (existingMemos2 === 0) {
    // Create parent memos first
    const memo2_1 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-005",
        rabId: rab2.id,
        direction: "INCOMING",
        category: "INSTRUKSI",
        status: "IN_PROGRESS",
        subject: "Penambahan Area Carport dari 20m2 menjadi 30m2",
        body: "Sesuai diskusi pada saat kunjungan site tanggal 14 Agustus 2026, saya menghendaki perubahan sebagai berikut:\n\nPerubahan:\n- Carport awal: 20 m2 (4x5m)\n- Carport baru: 30 m2 (5x6m)\n- Penambahan: 10 m2\n\nImpact:\n- Tambahan fondasi footplat: 3 unit\n- Tambahan sloof: 6m\n- Tambahan struktur carport\n\nMohon prepare quotation untuk addendum ini. Saya siap approving setelah melihat budget impact.",
        fromParty: "Budi Santoso",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-14"),
        dueDate: new Date("2026-08-21"),
        createdById: adminId,
      }
    });

    await prisma.siteMemo.create({
      data: {
        number: "SM-OUT-2026-003",
        rabId: rab2.id,
        direction: "OUTGOING",
        category: "LAINNYA",
        status: "CLOSED",
        subject: "Quotation Addendum Penambahan Carport",
        body: "Terima kasih atas kepercayaan Bapak kepada PT Sanata Construction. Sehubungan dengan surat Bapak tanggal 14 Agustus 2026, dengan ini kami sampaikan quotation addendum:\n\nPenambahan Carport (10 m2):\n- Fondasi footplat tambahan: Rp 3.600.000\n- Sloof tambahan: Rp 1.680.000\n- Struktur carport: Rp 2.500.000\n- Atap carport: Rp 1.800.000\n- Finishing: Rp 1.200.000\n\nTotal Addendum: Rp 10.780.000 (belum termasuk PPN 11%)\n\nPenambahan waktu: 5 hari kerja\n\nKami tunggu persetujuan Bapak untuk proceed dengan pekerjaan.",
        fromParty: "PT Sanata Construction",
        toParty: "Budi Santoso",
        letterDate: new Date("2026-08-16"),
        handledAt: new Date("2026-08-16"),
        closedAt: new Date("2026-08-18"),
        parentId: memo2_1.id,
        createdById: adminId,
      }
    });

    const memo2_3 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-006",
        rabId: rab2.id,
        direction: "INCOMING",
        category: "TEGURAN",
        status: "IN_PROGRESS",
        subject: "Pekerjaan Finishing Yang Perlu Diperbaiki",
        body: "Pada saat inspection tanggal 17 Agustus 2026, saya menemukan beberapa pekerjaan finishing yang perlu perbaikan:\n\n1. Cat dinding ruang tamu ada yang belang\n2. Keramik kamar mandi ada yang tidak rata\n3. Plafond area dapur ada noda air\n\nMohon perhatian khusus untuk perbaikan ini. Saya akan melakukan inspection ulang pada tanggal 24 Agustus 2026.",
        fromParty: "Budi Santoso",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-18"),
        dueDate: new Date("2026-08-24"),
        createdById: adminId,
      }
    });

    await prisma.siteMemo.create({
      data: {
        number: "SM-OUT-2026-004",
        rabId: rab2.id,
        direction: "OUTGOING",
        category: "LAINNYA",
        status: "CLOSED",
        subject: "Perbaikan Finishing Sesuai Catatan",
        body: "Sehubungan dengan surat Bapak tanggal 18 Agustus 2026, kami informasikan bahwa perbaikan telah kami lakukan:\n\n1. Cat dinding ruang tamu: telah dicat ulang seluruh area\n2. Keramik kamar mandi: telah dibongkar dan pasang ulang yang rata\n3. Plafond dapur: telah diperbaiki waterproofing dan dicat ulang\n\nKami mengundang Bapak untuk inspection ulang pada:\n\nTanggal: 25 Agustus 2026\nWaktu: 10.00 WIB\n\nAtas perhatian dan kepercayaan Bapak, kami ucapkan terima kasih.",
        fromParty: "PT Sanata Construction",
        toParty: "Budi Santoso",
        letterDate: new Date("2026-08-22"),
        handledAt: new Date("2026-08-23"),
        closedAt: new Date("2026-08-25"),
        parentId: memo2_3.id,
        createdById: adminId,
      }
    });

    const memo2_5 = await prisma.siteMemo.create({
      data: {
        number: "SM-IN-2026-007",
        rabId: rab2.id,
        direction: "INCOMING",
        category: "PERMINTAAN_INFO",
        status: "ANSWERED",
        subject: "Estimasi Progress Dan Jadwal Selesai",
        body: "Mohon informasi progress terkini dan estimasi tanggal selesai renovasi. Saya perlu planning untuk rencana pindah ke rumah setelah renovasi selesai.\n\nBeberapa hal yang ingin saya ketahui:\n1. Progress keseluruhan saat ini\n2. Item pekerjaan yang masih ongoing\n3. Estimasi tanggal serah terima\n4. Apakah ada potential delay?",
        fromParty: "Budi Santoso",
        toParty: "PT Sanata Construction",
        letterDate: new Date("2026-08-20"),
        dueDate: new Date("2026-08-23"),
        createdById: adminId,
      }
    });

    await prisma.siteMemo.create({
      data: {
        number: "SM-OUT-2026-005",
        rabId: rab2.id,
        direction: "OUTGOING",
        category: "LAINNYA",
        status: "CLOSED",
        subject: "Update Progress dan Estimasi Selesai",
        body: "Terima kasih atas pertanyaan Bapak. Berikut update progress dan jadwal:\n\nProgress Overall: 68%\n\nItem pekerjaan:\n- Struktur & Fondasi: 100% (Selesai)\n- Dinding & Plesteran: 95% (Hampir selesai)\n- Finishing: 60% (Ongoing)\n- Plumbing: 80% (Ongoing)\n- Electrical: 90% (Almost complete)\n- Atap: 100% (Selesai)\n\nEstimasi Selesai: 15 September 2026\nPotential delay: Tidak ada (current pace on track)\n\nKami akan continue progress dan berkomunikasi secara berkala. Untuk planning pindah, Bapak bisa scheduling sekitar akhir September 2026.",
        fromParty: "PT Sanata Construction",
        toParty: "Budi Santoso",
        letterDate: new Date("2026-08-22"),
        handledAt: new Date("2026-08-22"),
        closedAt: new Date("2026-08-22"),
        parentId: memo2_5.id,
        createdById: adminId,
      }
    });

    console.log("Created 6 site memos for RAB-2026-002");
  } else {
    console.log(`RAB-2026-002 already has ${existingMemos2} site memos - skipping.`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  const totalLogbooks = await prisma.logbookEntry.count();
  const totalMemos = await prisma.siteMemo.count();

  console.log("\n========================================");
  console.log("LOGBOOK & SITE MEMO SEED COMPLETE");
  console.log("========================================");
  console.log(`Total Logbook Entries: ${totalLogbooks}`);
  console.log(`Total Site Memos: ${totalMemos}`);
  console.log("\nLogbook Severity Distribution:");
  const severityCount = await prisma.$queryRaw`
    SELECT severity, COUNT(*) as count
    FROM "LogbookEntry"
    GROUP BY severity
    ORDER BY severity
  `;
  console.table(severityCount);

  console.log("\nLogbook Status Distribution:");
  const statusCount = await prisma.$queryRaw`
    SELECT
      CASE WHEN "isResolved" THEN 'RESOLVED' ELSE 'UNRESOLVED' END as status,
      COUNT(*) as count
    FROM "LogbookEntry"
    GROUP BY "isResolved"
  `;
  console.table(statusCount);

  console.log("\nSite Memo Direction:");
  const directionCount = await prisma.$queryRaw`
    SELECT direction, COUNT(*) as count
    FROM "SiteMemo"
    GROUP BY direction
  `;
  console.table(directionCount);

  console.log("\nSite Memo Status:");
  const memoStatusCount = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count
    FROM "SiteMemo"
    GROUP BY status
  `;
  console.table(memoStatusCount);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\nDisconnected from database.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
