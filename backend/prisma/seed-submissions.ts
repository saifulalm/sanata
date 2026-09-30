import { PrismaClient, SubmissionType, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting ProjectSubmissions seed...\n");

  const [admin] = await prisma.user.findMany({ where: { role: "ADMIN" }, take: 1 });
  if (!admin) {
    console.error("No admin user found. Run seed.ts first.");
    process.exit(1);
  }

  const rabs = await prisma.rab.findMany({
    orderBy: { number: "asc" },
    include: { sections: { include: { items: true }, orderBy: { order: "asc" } } },
  });

  if (rabs.length === 0) {
    console.error("No RAB projects found.");
    process.exit(1);
  }

  await prisma.documentCounter.upsert({
    where: { id: "SUB-2026" },
    create: { id: "SUB-2026", series: "SUB", year: 2026, lastSeq: 17 },
    update: {},
  });
  const submissionsData = [
    {
      rabNumber: "RAB-2026-001",
      type: "MATERIAL" as SubmissionType,
      status: "APPROVED_CLIENT" as SubmissionStatus,
      number: "SUB-2026-0018",
      title: "Perubahan Mutu Beton dari K-250 ke K-300 untuk Kolom Lantai 3-4",
      reason: "Berdasarkan hasil tes tanah, perlu penguatan struktur kolom lantai atas sesuai rekomendasi konsultan struktural.",
      neededDate: new Date("2026-09-01"),
      estimatedCost: 45000000,
      submittedAt: new Date("2026-08-15"),
      reviewedAt: new Date("2026-08-17"),
      reviewNote: "Disetujui dengan tambahan uji coba compression test sebelum pengecoran.",
      forwardedAt: new Date("2026-08-18"),
      clientDecidedAt: new Date("2026-08-20"),
      clientNote: "Setuju, proceed dengan perubahan mutu beton sesuai rekomendasi konsultan.",
      items: [
        { name: "Semen Portland Type I", spec: "SNI 2049-2015", unit: "zak", quantity: 850, unitPrice: 74000, note: "Kebutuhan untuk 3 lantai" },
        { name: "Pasir beton kasar", spec: "Modulus 2.6", unit: "m3", quantity: 42, unitPrice: 385000, note: null },
        { name: "Agregat kasar 10-20mm", spec: "SNI", unit: "m3", quantity: 58, unitPrice: 420000, note: null },
      ],
    },
    // 2. WAKTU - FORWARDED_CLIENT
    {
      rabNumber: "RAB-2026-001",
      type: "WAKTU" as SubmissionType,
      status: "FORWARDED_CLIENT" as SubmissionStatus,
      number: "SUB-2026-0019",
      title: "Perpanjangan Waktu 21 Hari Akibat Hujan Ekstrem",
      reason: "Curah hujan tinggi selama 2 minggu menyebabkan genangan di area kerja dan mengganggu pengecoran plat lantai 3.",
      neededDate: new Date("2026-11-15"),
      estimatedCost: 0,
      submittedAt: new Date("2026-08-20"),
      reviewedAt: new Date("2026-08-22"),
      reviewNote: "Disetujui perpanjangan 14 hari kerja. Lebih dari itu perlu dikoordinasikan dengan klien.",
      forwardedAt: new Date("2026-08-25"),
      requestedDays: 21,
      newTargetDate: new Date("2026-11-15"),
    },
    // 3. ALAT - SUBMITTED (RAB-2026-001)
    {
      rabNumber: "RAB-2026-001",
      type: "ALAT" as SubmissionType,
      status: "SUBMITTED" as SubmissionStatus,
      number: "SUB-2026-0020",
      title: "Sewa Concrete Pump untuk Pengecoran Lantai 4",
      reason: "Butuh concrete pump untuk menjangkau area pengecoran plat lantai 4 yang sulit diakses dari bawah.",
      neededDate: new Date("2026-09-10"),
      estimatedCost: 32000000,
      submittedAt: new Date("2026-08-25"),
      items: [
        { name: "Concrete pump stationer", spec: "kapasitas 90m3/jam", unit: "unit", quantity: 1, unitPrice: 28000000, note: "Sewa 4 minggu termasuk operator" },
        { name: "Truck mixer 7m3", spec: "ISUZU", unit: "unit", quantity: 2, unitPrice: 3500000, note: "Sewa per minggu" },
        { name: "Selang concrete pump 30m", spec: "diameter 5 inch", unit: "bh", quantity: 2, unitPrice: 450000, note: null },
      ],
    },
    // 4. MATERIAL - REJECTED (RAB-2026-001)
    {
      rabNumber: "RAB-2026-001",
      type: "MATERIAL" as SubmissionType,
      status: "REJECTED" as SubmissionStatus,
      number: "SUB-2026-0021",
      title: "Pengadaan Besi WF 400 untuk Pengganti WF 300",
      reason: "Kekuatan WF 300 tidak memadai untuk beban tambahan dari perubahan desain arsitektur lantai 4.",
      neededDate: new Date("2026-09-05"),
      estimatedCost: 185000000,
      submittedAt: new Date("2026-08-18"),
      reviewedAt: new Date("2026-08-19"),
      reviewNote: "Ditolak. WF 300 sudah dihitung ulang oleh struktur dan mencukupi. Perubahan arsitektur tidak mengubah beban struktural secara signifikan.",
    },
    // 5. MATERIAL - APPROVED_INTERNAL (RAB-2026-001)
    {
      rabNumber: "RAB-2026-001",
      type: "MATERIAL" as SubmissionType,
      status: "APPROVED_INTERNAL" as SubmissionStatus,
      number: "SUB-2026-0022",
      title: "Tambahan Material Waterproofing untuk Roof Deck",
      reason: "Area roof deck perlu tambahan waterproofing coating mengingat curah hujan tinggi di lokasi.",
      neededDate: new Date("2026-10-01"),
      estimatedCost: 18500000,
      submittedAt: new Date("2026-08-22"),
      reviewedAt: new Date("2026-08-24"),
      reviewNote: "Disetujui. Tambahan 2 layer waterproofing membrane di area roof deck.",
      items: [
        { name: "Waterproofing membrane", spec: "Sika or equivalent, 4mm", unit: "roll", quantity: 25, unitPrice: 520000, note: "Coverage 10m2/roll" },
        { name: "Primer waterproofing", spec: "Sika or equivalent", unit: "drum", quantity: 4, unitPrice: 850000, note: "20L per drum" },
        { name: "Sand blanket", spec: "Pasir silica halus", unit: "m3", quantity: 5, unitPrice: 280000, note: "Protection layer" },
      ],
    },
    // 6. MATERIAL - DRAFT (RAB-2026-002)
    {
      rabNumber: "RAB-2026-002",
      type: "MATERIAL" as SubmissionType,
      status: "DRAFT" as SubmissionStatus,
      number: "SUB-2026-0023",
      title: "Perubahan Cat Dinding Interior dari Vinyl ke Decorative Paint",
      reason: "Pemilik menginginkan tampilan dinding yang lebih premium dengan cat dekoratif.",
      neededDate: new Date("2026-09-15"),
      estimatedCost: 8500000,
      items: [
        { name: "Decorative paint", spec: "威登尼斯 atau setara", unit: "drum", quantity: 8, unitPrice: 680000, note: "Premium grade" },
        { name: "Wall primer", spec: "Jotun or equivalent", unit: "drum", quantity: 4, unitPrice: 385000, note: null },
      ],
    },
    // 7. WAKTU - SUBMITTED (RAB-2026-002)
    {
      rabNumber: "RAB-2026-002",
      type: "WAKTU" as SubmissionType,
      status: "SUBMITTED" as SubmissionStatus,
      number: "SUB-2026-0024",
      title: "Perpanjangan Waktu 10 Hari Akibat Perubahan Desain",
      reason: "Perubahan desain carport dan penambahan ketinggian plafond memerlukan waktu tambahan.",
      neededDate: new Date("2026-10-20"),
      estimatedCost: 0,
      submittedAt: new Date("2026-08-25"),
      requestedDays: 10,
      newTargetDate: new Date("2026-10-20"),
    },
    // 8. ALAT - APPROVED_CLIENT (RAB-2026-002)
    {
      rabNumber: "RAB-2026-002",
      type: "ALAT" as SubmissionType,
      status: "APPROVED_CLIENT" as SubmissionStatus,
      number: "SUB-2026-0025",
      title: "Sewa Scaffolding untuk Pengecatan Plafond Tinggi",
      reason: "Area plafon ruang tamu setinggi 3.5m memerlukan scaffolding untuk pengecatan.",
      neededDate: new Date("2026-09-05"),
      estimatedCost: 4200000,
      submittedAt: new Date("2026-08-12"),
      reviewedAt: new Date("2026-08-13"),
      reviewNote: "Disetujui penggunaan scaffolding tubular.",
      forwardedAt: new Date("2026-08-14"),
      clientDecidedAt: new Date("2026-08-15"),
      clientNote: "Setuju. Gunakan scaffolding yang aman.",
      items: [
        { name: "Scaffolding tubular lengkap", spec: "Tinggi 4m", unit: "set", quantity: 1, unitPrice: 3200000, note: "Sewa 2 minggu" },
        { name: "Pipa penyangga", spec: "dia 48mm", unit: "bh", quantity: 10, unitPrice: 100000, note: "Supporting frame" },
      ],
    },
    // 9. MATERIAL - REJECTED (RAB-2026-002)
    {
      rabNumber: "RAB-2026-002",
      type: "MATERIAL" as SubmissionType,
      status: "REJECTED" as SubmissionStatus,
      number: "SUB-2026-0026",
      title: "Penggantian Lantai Keramik dengan Marmer Import",
      reason: "Pemilik ingin upgrade lantai dari keramik ke marmer import untuk tampilan lebih mewah.",
      neededDate: new Date("2026-09-20"),
      estimatedCost: 95000000,
      submittedAt: new Date("2026-08-20"),
      reviewedAt: new Date("2026-08-21"),
      reviewNote: "Ditolak. Rencana awal sudah disepakati menggunakan keramik grade A. Perubahan material lantai sudah di luar kontrak.",
    },
    // 10. MATERIAL - FORWARDED_CLIENT (RAB-2026-003)
    { rabNumber: "RAB-2026-003", type: "MATERIAL" as SubmissionType, status: "FORWARDED_CLIENT" as SubmissionStatus, number: "SUB-2026-0027", title: "Pengadaan Steel Ringbalk untuk Perkuatan Struktur Atap", reason: "Berdasarkan hasil inspection, perlu penambahan steel ringbalk pada pertemuan kolom dan balok atap.", neededDate: new Date("2026-09-08"), estimatedCost: 28000000, submittedAt: new Date("2026-08-22"), reviewedAt: new Date("2026-08-23"), reviewNote: "Disetujui. Penambahan ringbalk diperlukan sesuai hasil inspection lapangan.", forwardedAt: new Date("2026-08-24"), items: [ { name: "Steel ringbalk WF 200x100", spec: "BS Standard", unit: "btg", quantity: 8, unitPrice: 2800000, note: "6m per batang" }, { name: "Baut angkur", spec: "High tensile, dia 16mm", unit: "kg", quantity: 50, unitPrice: 48000, note: null }, { name: "Plat sambung 10mm", spec: "Baja BJTP", unit: "kg", quantity: 80, unitPrice: 42000, note: null }, ], },
    // 11. WAKTU - APPROVED_INTERNAL (RAB-2026-003)
    { rabNumber: "RAB-2026-003", type: "WAKTU" as SubmissionType, status: "APPROVED_INTERNAL" as SubmissionStatus, number: "SUB-2026-0028", title: "Perpanjangan Waktu 7 Hari Akibat Keterlambatan Material", reason: "Material baja ringan untuk atap terlambat datang dari supplier sehingga jadwal molor.", neededDate: new Date("2026-10-25"), estimatedCost: 0, submittedAt: new Date("2026-08-24"), reviewedAt: new Date("2026-08-25"), reviewNote: "Disetujui 7 hari tambahan. Keterlambatan bukan dari kesalahan lapangan.", requestedDays: 7, newTargetDate: new Date("2026-10-25"), },
    // 12. ALAT - APPROVED_CLIENT (RAB-2026-004)
    { rabNumber: "RAB-2026-004", type: "ALAT" as SubmissionType, status: "APPROVED_CLIENT" as SubmissionStatus, number: "SUB-2026-0029", title: "Pengadaan Forklift untuk Bongkar Muat Material", reason: "Area gudang seluas 2000m2 memerlukan forklift untuk distribusi material ke berbagai zona.", neededDate: new Date("2026-09-12"), estimatedCost: 95000000, submittedAt: new Date("2026-08-20"), reviewedAt: new Date("2026-08-21"), reviewNote: "Disetujui. Forklift kapasitas 3 ton sesuai kebutuhan distribusi material.", forwardedAt: new Date("2026-08-22"), clientDecidedAt: new Date("2026-08-25"), clientNote: "Setuju, forklift diperlukan untuk kelancaran operasional gudang.", items: [ { name: "Forklift diesel 3 ton", spec: "Toyota atau setara", unit: "unit", quantity: 1, unitPrice: 75000000, note: "Sewa 3 bulan termasuk operator" }, { name: "Pallet jack", spec: "kapasitas 2 ton", unit: "unit", quantity: 2, unitPrice: 8500000, note: "Pembelian baru" }, ], },
    // 13. MATERIAL - SUBMITTED (RAB-2026-004)
    { rabNumber: "RAB-2026-004", type: "MATERIAL" as SubmissionType, status: "SUBMITTED" as SubmissionStatus, number: "SUB-2026-0030", title: "Tambahan Beton untuk Lantai Gudang dari K-300 ke K-350", reason: "Beban gudang meningkat akibat perubahan layout penyimpanan dari ringan ke menengah.", neededDate: new Date("2026-09-18"), estimatedCost: 62000000, submittedAt: new Date("2026-08-26"), items: [ { name: "Beton K-350 ready mix", spec: "fc 29.05 MPa", unit: "m3", quantity: 80, unitPrice: 775000, note: "Harus dari batching plant terakreditasi" }, { name: "Wiremesh M8", spec: "SNI", unit: "lembar", quantity: 200, unitPrice: 85000, note: "For slab reinforcement" }, ], },
    // 14. MATERIAL - REJECTED (RAB-2026-004)
    { rabNumber: "RAB-2026-004", type: "MATERIAL" as SubmissionType, status: "REJECTED" as SubmissionStatus, number: "SUB-2026-0031", title: "Penggantian Atap Zinc Alume dengan Sandwich Panel", reason: "Klien gudang menginginkan insulasi panas yang lebih baik untuk kenyamanan pekerja.", neededDate: new Date("2026-09-25"), estimatedCost: 145000000, submittedAt: new Date("2026-08-20"), reviewedAt: new Date("2026-08-21"), reviewNote: "Ditolak. RAB awal sudah disepakati menggunakan zinc alume standar. Sandwich panel adalah perubahan material besar yang perlu amendemen kontrak.", },
    // 15. WAKTU - APPROVED_CLIENT (RAB-2026-005)
    { rabNumber: "RAB-2026-005", type: "WAKTU" as SubmissionType, status: "APPROVED_CLIENT" as SubmissionStatus, number: "SUB-2026-0032", title: "Perpanjangan Waktu 30 Hari Akibat Penambahan Lantai", reason: "Berdasarkan request klien, ditambahkan 1 lantai baru di atas lantai 3 existing yang memerlukan penyesuaian struktur.", neededDate: new Date("2026-11-30"), estimatedCost: 0, submittedAt: new Date("2026-08-15"), reviewedAt: new Date("2026-08-16"), reviewNote: "Disetujui. Perubahan scope penambahan lantai memerlukan waktu tambahan 30 hari kalender.", forwardedAt: new Date("2026-08-17"), clientDecidedAt: new Date("2026-08-20"), clientNote: "Setuju. Addendum kontrak akan kami tanda tangani.", requestedDays: 30, newTargetDate: new Date("2026-11-30"), },
    // 16. ALAT - APPROVED_INTERNAL (RAB-2026-005)
    { rabNumber: "RAB-2026-005", type: "ALAT" as SubmissionType, status: "APPROVED_INTERNAL" as SubmissionStatus, number: "SUB-2026-0033", title: "Pengadaan Perancah Scaffolding untuk Tambahan Lantai", reason: "Penambahan 1 lantai memerlukan sistem perancah untuk pekerjaan dinding dan finishing.", neededDate: new Date("2026-09-15"), estimatedCost: 55000000, submittedAt: new Date("2026-08-22"), reviewedAt: new Date("2026-08-23"), reviewNote: "Disetujui. Scaffolding frame system untuk area seluas 450m2.", items: [ { name: "Scaffolding frame system", spec: "Galvanis, lengkap dengan cross brace", unit: "set", quantity: 1, unitPrice: 48000000, note: "Sewa 2.5 bulan" }, { name: "Catwalk plank", spec: "Aluminium 1.5mm", unit: "bh", quantity: 40, unitPrice: 175000, note: "Platform kerja" }, ], },
    // 17. MATERIAL - FORWARDED_CLIENT (RAB-2026-005)
    { rabNumber: "RAB-2026-005", type: "MATERIAL" as SubmissionType, status: "FORWARDED_CLIENT" as SubmissionStatus, number: "SUB-2026-0034", title: "Perubahan Facade Dinding dengan Double Brick System", reason: "Desain baru dari arsitek menginginkan cavity wall system untuk insulasi termal yang lebih baik.", neededDate: new Date("2026-10-01"), estimatedCost: 78000000, submittedAt: new Date("2026-08-24"), reviewedAt: new Date("2026-08-25"), reviewNote: "Disetujui perubahan ke cavity wall. Selisih biaya ditambahkan ke addendum.", forwardedAt: new Date("2026-08-26"), items: [ { name: "Bata merah lokal", spec: "10x10x20cm", unit: "bh", quantity: 8500, unitPrice: 900, note: "Inner wall" }, { name: "Bata hebel 7.5cm", spec: "Celcon atau setara", unit: "m2", quantity: 450, unitPrice: 145000, note: "Outer wall" }, { name: "Steel tie connector", spec: "SS 304", unit: "bh", quantity: 600, unitPrice: 18000, note: "Cavity tie" }, ], },
    // 18. MATERIAL - APPROVED_CLIENT (RAB-2026-006)
    { rabNumber: "RAB-2026-006", type: "MATERIAL" as SubmissionType, status: "APPROVED_CLIENT" as SubmissionStatus, number: "SUB-2026-0035", title: "Upgrade Kusen Pintu dari Aluminium ke Solid Wood", reason: "Pemilik ruko ingin tampilan lebih premium untuk lantai dasar yang digunakan sebagai retail.", neededDate: new Date("2026-09-10"), estimatedCost: 42000000, submittedAt: new Date("2026-08-14"), reviewedAt: new Date("2026-08-15"), reviewNote: "Disetujui. Kusen wood panel cocok untuk area retail yang memerlukan estetika premium.", forwardedAt: new Date("2026-08-16"), clientDecidedAt: new Date("2026-08-18"), clientNote: "Setuju, proceed dengan kayu jati untuk durability.", items: [ { name: "Kusen pintu jati", spec: "10x12cm, kilangan", unit: "bh", quantity: 4, unitPrice: 4800000, note: "Per pintu double" }, { name: "Daun pintu panel jati", spec: "90x210cm, teakwood", unit: "bh", quantity: 4, unitPrice: 6500000, note: null }, ], },
    // 19. ALAT - DRAFT (RAB-2026-006)
    { rabNumber: "RAB-2026-006", type: "ALAT" as SubmissionType, status: "DRAFT" as SubmissionStatus, number: "SUB-2026-0036", title: "Sewa Lift Material untuk Konstruksi Lantai 3-4", reason: "Konstruksi ruko 4 lantai memerlukan hoist material untuk efisiensi distribusi material ke lantai atas.", neededDate: new Date("2026-09-20"), estimatedCost: 48000000, items: [ { name: "Construction hoist", spec: "Kapasitas 1 ton", unit: "unit", quantity: 1, unitPrice: 42000000, note: "Sewa 3 bulan termasuk montage" }, { name: "Material platform", spec: "2x3m", unit: "bh", quantity: 2, unitPrice: 3000000, note: null }, ], },
    // 20. WAKTU - REJECTED (RAB-2026-006)
    { rabNumber: "RAB-2026-006", type: "WAKTU" as SubmissionType, status: "REJECTED" as SubmissionStatus, number: "SUB-2026-0037", title: "Perpanjangan Waktu 45 Hari Klaim Force Majeure", reason: "Gempa ringan dan hujan deras selama 3 minggu menyebabkan kerusakan sebagian fasilitas.", neededDate: new Date("2026-12-01"), estimatedCost: 0, submittedAt: new Date("2026-08-20"), reviewedAt: new Date("2026-08-22"), reviewNote: "Ditolak. Klaim force majeure tidak memenuhi kriteria kontrak. Kerusakan yang terjadi adalah damage yang seharusnya dapat dicegah dengan standard SOP.", },
    // 21. MATERIAL - APPROVED_CLIENT (RAB-2026-007)
    { rabNumber: "RAB-2026-007", type: "MATERIAL" as SubmissionType, status: "APPROVED_CLIENT" as SubmissionStatus, number: "SUB-2026-0038", title: "Pengadaan Marmer Import untuk Lantai Utama Villa", reason: "Desain interior villa mewah memerlukan marmer import Carrara untuk lantai utama dan area kolam renang.", neededDate: new Date("2026-09-15"), estimatedCost: 320000000, submittedAt: new Date("2026-08-16"), reviewedAt: new Date("2026-08-17"), reviewNote: "Disetujui. Marmer Carrara white grade A sesuai spesifikasi arsitek.", forwardedAt: new Date("2026-08-18"), clientDecidedAt: new Date("2026-08-20"), clientNote: "Setuju. Kami akan koordinasi langsung dengan supplier marmer Italia.", items: [ { name: "Marmer Carrara white", spec: "Polished, 60x60cm", unit: "m2", quantity: 280, unitPrice: 850000, note: "Import Italy, MOQ 300m2" }, { name: "Marmer Carrara white", spec: "Bookmatch, untuk feature wall", unit: "m2", quantity: 45, unitPrice: 1450000, note: "Special cut" }, { name: "Adhesive marmer", spec: "Latex modified", unit: "zak", quantity: 20, unitPrice: 285000, note: null }, { name: "Grout epoxy", spec: "White", unit: "kg", quantity: 30, unitPrice: 85000, note: "Untuk area basah" }, ], },
    // 22. ALAT - FORWARDED_CLIENT (RAB-2026-007)
    { rabNumber: "RAB-2026-007", type: "ALAT" as SubmissionType, status: "FORWARDED_CLIENT" as SubmissionStatus, number: "SUB-2026-0039", title: "Pengadaan Exhaust Fan dan AC System untuk Area Spa", reason: "Area spa memerlukan sistem ventilasi dan AC yang terpisah untuk kelembaban terkontrol.", neededDate: new Date("2026-09-20"), estimatedCost: 185000000, submittedAt: new Date("2026-08-22"), reviewedAt: new Date("2026-08-23"), reviewNote: "Disetujui. AC VRF system untuk area spa dengan humidity control.", forwardedAt: new Date("2026-08-24"), items: [ { name: "AC VRF Daikin", spec: "20PK capacity", unit: "unit", quantity: 1, unitPrice: 145000000, note: "VRF system lengkap" }, { name: "Exhaust fan centrifugal", spec: "2500 CFM", unit: "unit", quantity: 3, unitPrice: 8500000, note: null }, { name: "Ducting galvanis", spec: "0.5mm", unit: "m2", quantity: 85, unitPrice: 180000, note: null }, { name: "Dehumidifier industrial", spec: "200L/day", unit: "unit", quantity: 2, unitPrice: 8500000, note: "Spa zone" }, ], },
    // 23. WAKTU - SUBMITTED (RAB-2026-007)
    { rabNumber: "RAB-2026-007", type: "WAKTU" as SubmissionType, status: "SUBMITTED" as SubmissionStatus, number: "SUB-2026-0040", title: "Perpanjangan Waktu 15 Hari untuk Penyelesaian Interior Premium", reason: "Pekerjaan interior premium dengan material import memerlukan waktu lebih panjang untuk procurement dan installation.", neededDate: new Date("2026-11-15"), estimatedCost: 0, submittedAt: new Date("2026-08-27"), requestedDays: 15, newTargetDate: new Date("2026-11-15"), },
    // 24. MATERIAL - APPROVED_INTERNAL (RAB-2026-007)
    { rabNumber: "RAB-2026-007", type: "MATERIAL" as SubmissionType, status: "APPROVED_INTERNAL" as SubmissionStatus, number: "SUB-2026-0041", title: "Tambahan Material Kolam Renang Infinity Edge", reason: "Kolam renang dengan desain infinity edge memerlukan sistem overflow dan pompa tambahan.", neededDate: new Date("2026-10-05"), estimatedCost: 95000000, submittedAt: new Date("2026-08-25"), reviewedAt: new Date("2026-08-26"), reviewNote: "Disetujui. Infinity edge pool memerlukan sistem yang berbeda dari pool standar.", items: [ { name: "Pompa swimming pool", spec: "3HP, variable speed", unit: "unit", quantity: 2, unitPrice: 18500000, note: "Main dan backup" }, { name: "Sand filter", spec: "1200mm diameter", unit: "unit", quantity: 1, unitPrice: 12500000, note: null }, { name: "Overflow grate", spec: "SS 304, custom", unit: "m", quantity: 25, unitPrice: 650000, note: null }, { name: "Waterproofing pool", spec: "Polyurea coating", unit: "m2", quantity: 120, unitPrice: 180000, note: "2mm thickness" }, ], },
    // 25. MATERIAL - DRAFT (RAB-2026-007)
    { rabNumber: "RAB-2026-007", type: "MATERIAL" as SubmissionType, status: "DRAFT" as SubmissionStatus, number: "SUB-2026-0042", title: "Pengadaan Material Akustik untuk Home Theater", reason: "Area home theater memerlukan treatment akustik khusus untuk pengalaman audio optimal.", neededDate: new Date("2026-10-10"), estimatedCost: 68000000, items: [ { name: "Acoustic panel fabric", spec: "1200x600x50mm, NRC 0.85", unit: "bh", quantity: 40, unitPrice: 850000, note: null }, { name: "Bass trap corner", spec: "Rockwool 100mm", unit: "bh", quantity: 8, unitPrice: 1200000, note: null }, { name: "Acoustic door", spec: "STC 45, solid core", unit: "unit", quantity: 2, unitPrice: 8500000, note: null }, { name: "Diffuser panel", spec: "Wood diffusing fin", unit: "m2", quantity: 12, unitPrice: 1450000, note: null }, ], },
  ];

  // ============================================================
  // INSERT SUBMISSIONS
  // ============================================================

  const rabMap = new Map(rabs.map(r => [r.number, r]));
  let created = 0;
  let skipped = 0;

  for (const sub of submissionsData) {
    const rab = rabMap.get(sub.rabNumber);
    if (!rab) {
      console.log("Skipping " + sub.number + " - RAB " + sub.rabNumber + " not found");
      skipped++;
      continue;
    }

    // Check if already exists
    const existing = await prisma.projectSubmission.findUnique({ where: { number: sub.number } });
    if (existing) {
      console.log("Skipping " + sub.number + " - already exists");
      skipped++;
      continue;
    }

    // Extract items before creating submission
    const { items: itemData, ...subData } = sub;

    // Create submission
    const submission = await prisma.projectSubmission.create({
      data: {
        number: subData.number,
        rabId: rab.id,
        type: subData.type,
        status: subData.status,
        title: subData.title,
        reason: subData.reason ?? null,
        neededDate: subData.neededDate ?? null,
        requestedDays: subData.requestedDays ?? null,
        newTargetDate: subData.newTargetDate ?? null,
        estimatedCost: subData.estimatedCost ?? 0,
        requestedById: admin.id,
        submittedAt: subData.submittedAt ?? null,
        reviewedById: subData.reviewedById ?? admin.id,
        reviewedAt: subData.reviewedAt ?? null,
        reviewNote: subData.reviewNote ?? null,
        forwardedAt: subData.forwardedAt ?? null,
        clientDecidedAt: subData.clientDecidedAt ?? null,
        clientDecidedBy: subData.clientDecidedBy ?? null,
        clientNote: subData.clientNote ?? null,
      },
    });

    // Create items if any
    if (itemData && itemData.length > 0) {
      await prisma.projectSubmissionItem.createMany({
        data: itemData.map((item, idx) => ({
          submissionId: submission.id,
          name: item.name,
          spec: item.spec ?? null,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          note: item.note ?? null,
          order: idx,
        })),
      });
    }

    console.log("Created " + sub.number + " - " + sub.title.substring(0, 60) + "...");
    console.log("  Status: " + sub.status + ", Type: " + sub.type);
    created++;
  }

  // Update counter
  await prisma.documentCounter.update({
    where: { id: "SUB-2026" },
    data: { lastSeq: 42 },
  });

  console.log("\n========================================");
  console.log("Seed Summary:");
  console.log("  Created: " + created + " submissions");
  console.log("  Skipped: " + skipped + " (already exist)");
  console.log("========================================\n");

  // Print status breakdown
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  for (const sub of submissionsData) {
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    typeCounts[sub.type] = (typeCounts[sub.type] || 0) + 1;
  }

  console.log("By Status:");
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log("  " + status + ": " + count);
  }
  console.log("\nBy Type:");
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log("  " + type + ": " + count);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
