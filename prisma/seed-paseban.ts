/**
 * Seed Script: Import PASEBAN Timeline to Database
 * Run: npx tsx prisma/seed-paseban.ts
 */

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting PASEBAN Timeline Seed...\n");

  // Project info
  const rabData = {
    number: "PASEBAN-RENOVASI-2025",
    title: "RENOVASI RUMAH",
    clientName: "Pribadi",
    location: "Jl. Kramat Sawah No. E335, Paseban, Jakarta Pusat",
    projectDate: new Date("2025-10-10"),
    scheduleStart: new Date("2025-10-10"),
    restDays: [0] as number[], // Sunday off
    status: "APPROVED" as const,
    notes: "Imported from TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx - Renovasi rumah 3 lantai"
  };

  // Sections and items with schedule data
  const sectionsData = [
    {
      name: "I. PEKERJAAN PERSIAPAN",
      order: 0,
      items: [
        { description: "Pasangan Bouwplank", unit: "LS", volume: 1, unitPrice: 0, amount: 0, weightPct: 0.3631, startOffsetDays: 0, durationDays: 14 },
        { description: "Air Kerja & Listrik Kerja", unit: "LS", volume: 1, unitPrice: 0, amount: 0, weightPct: 0.4869, startOffsetDays: 0, durationDays: 182 },
        { description: "Keamanan", unit: "LS", volume: 1, unitPrice: 0, amount: 0, weightPct: 0.4869, startOffsetDays: 0, durationDays: 182 },
        { description: "Mobilisasi dan Demobilisasi", unit: "LS", volume: 1, unitPrice: 0, amount: 0, weightPct: 0.7023, startOffsetDays: 0, durationDays: 182 },
        { description: "Pembersihan", unit: "LS", volume: 1, unitPrice: 0, amount: 0, weightPct: 0.4869, startOffsetDays: 0, durationDays: 182 },
      ]
    },
    {
      name: "II. PEKERJAAN FONDASI",
      order: 1,
      items: [
        { description: "Galian Tanah", unit: "m3", volume: 50, unitPrice: 75000, amount: 3750000, weightPct: 1.2709, startOffsetDays: 0, durationDays: 21 },
        { description: "Pemadatan Tanah", unit: "m2", volume: 30, unitPrice: 45000, amount: 1350000, weightPct: 0.5931, startOffsetDays: 14, durationDays: 14 },
        { description: "Sloof/Tie Beam 30cm x 40cm", unit: "m", volume: 80, unitPrice: 350000, amount: 28000000, weightPct: 4.7223, startOffsetDays: 0, durationDays: 28 },
        { description: "Kolom Pedestal 35cm x 20cm TINGGI 175CM", unit: "bh", volume: 17, unitPrice: 750000, amount: 12750000, weightPct: 2.0315, startOffsetDays: 0, durationDays: 35 },
        { description: "Pondasi Tapak 17 Titik", unit: "bh", volume: 17, unitPrice: 850000, amount: 14450000, weightPct: 2.2077, startOffsetDays: 0, durationDays: 28 },
      ]
    },
    {
      name: "III. PEKERJAAN STRUKTUR",
      order: 2,
      items: [
        // LANTAI 1
        { description: "Kolom 20 CM X 35 CM tinggi 350 cm - Lantai 1", unit: "bh", volume: 12, unitPrice: 450000, amount: 5400000, weightPct: 0.4951, startOffsetDays: 21, durationDays: 21 },
        { description: "Plat Lantai 1", unit: "m2", volume: 120, unitPrice: 350000, amount: 42000000, weightPct: 6.8085, startOffsetDays: 21, durationDays: 21 },
        { description: "Balok BL 1 20cm x 30cm - Lantai 1", unit: "m", volume: 45, unitPrice: 275000, amount: 12375000, weightPct: 1.6313, startOffsetDays: 28, durationDays: 14 },
        { description: "Balok BL 2 25 cm x 40 cm - Lantai 1", unit: "m", volume: 15, unitPrice: 320000, amount: 4800000, weightPct: 0.2710, startOffsetDays: 35, durationDays: 7 },
        { description: "Balok Kongliong / Latei Diatas Kusen - Lt.1", unit: "m", volume: 20, unitPrice: 185000, amount: 3700000, weightPct: 0.2964, startOffsetDays: 35, durationDays: 21 },
        // LANTAI 2
        { description: "Kolom - Lantai 2", unit: "bh", volume: 12, unitPrice: 480000, amount: 5760000, weightPct: 0.4951, startOffsetDays: 49, durationDays: 21 },
        { description: "Plat Lantai 2", unit: "m2", volume: 110, unitPrice: 360000, amount: 39600000, weightPct: 6.8085, startOffsetDays: 49, durationDays: 21 },
        { description: "Balok BL 1 20cm x 30cm - Lantai 2", unit: "m", volume: 50, unitPrice: 280000, amount: 14000000, weightPct: 2.3538, startOffsetDays: 56, durationDays: 14 },
        { description: "Balok BL 2 25 cm x 40 cm - Lantai 2", unit: "m", volume: 18, unitPrice: 330000, amount: 5940000, weightPct: 0.8131, startOffsetDays: 63, durationDays: 7 },
        { description: "Balok Kongliong / Latei Diatas Kusen - Lt.2", unit: "m", volume: 22, unitPrice: 190000, amount: 4180000, weightPct: 0.4594, startOffsetDays: 63, durationDays: 28 },
        // LANTAI 3
        { description: "Kolom 10cm x 25 cm tinggi 300cm 7 Titik - Lt.3", unit: "bh", volume: 7, unitPrice: 420000, amount: 2940000, weightPct: 0.5734, startOffsetDays: 77, durationDays: 14 },
        { description: "Balok BL 2 10CM X 25 CM - Lantai 3", unit: "m", volume: 35, unitPrice: 250000, amount: 8750000, weightPct: 1.4517, startOffsetDays: 70, durationDays: 14 },
      ]
    },
    {
      name: "IV. PEKERJAAN DINDING",
      order: 3,
      items: [
        // LANTAI 1
        { description: "Pasangan Bata Ringan - Lantai 1", unit: "m2", volume: 80, unitPrice: 95000, amount: 7600000, weightPct: 0.6182, startOffsetDays: 35, durationDays: 21 },
        { description: "Pekerjaan Glass block - Lantai 1", unit: "m2", volume: 15, unitPrice: 450000, amount: 6750000, weightPct: 2.0962, startOffsetDays: 154, durationDays: 7 },
        // LANTAI 2
        { description: "Pasangan Bata Ringan - Lantai 2", unit: "m2", volume: 95, unitPrice: 95000, amount: 9025000, weightPct: 1.4810, startOffsetDays: 63, durationDays: 21 },
        { description: "Pek. Frame hollow 50x50mm fin black metal - Lt.2", unit: "m", volume: 40, unitPrice: 175000, amount: 7000000, weightPct: 0.5718, startOffsetDays: 77, durationDays: 21 },
        // LANTAI 3
        { description: "Pasangan Bata Ringan - Lantai 3", unit: "m2", volume: 90, unitPrice: 95000, amount: 8550000, weightPct: 1.5448, startOffsetDays: 91, durationDays: 14 },
        { description: "Pekerjaan Pasangan roster - Lantai 3", unit: "m2", volume: 8, unitPrice: 225000, amount: 1800000, weightPct: 0.2600, startOffsetDays: 287, durationDays: 14 },
      ]
    },
    {
      name: "V. PEKERJAAN FINISHING DINDING",
      order: 4,
      items: [
        // LANTAI 1
        { description: "Pek. Plesteran 1PC: 5PS + Acian - Lantai 1", unit: "m2", volume: 160, unitPrice: 85000, amount: 13600000, weightPct: 2.9696, startOffsetDays: 161, durationDays: 14 },
        { description: "Pas. Keramik Dinding Lantai 1", unit: "m2", volume: 45, unitPrice: 185000, amount: 8325000, weightPct: 1.0886, startOffsetDays: 266, durationDays: 14 },
        { description: "Opening Kusen PC - Lantai 1", unit: "bh", volume: 8, unitPrice: 75000, amount: 600000, weightPct: 0.1371, startOffsetDays: 168, durationDays: 7 },
        { description: "Tali Air - Lantai 1", unit: "m", volume: 20, unitPrice: 55000, amount: 1100000, weightPct: 0.1633, startOffsetDays: 280, durationDays: 7 },
        // LANTAI 2
        { description: "Pek. Plesteran 1PC: 5PS + Acian - Lantai 2", unit: "m2", volume: 190, unitPrice: 85000, amount: 16150000, weightPct: 3.7347, startOffsetDays: 147, durationDays: 14 },
        { description: "Pasangan Keramik Dinding (KM / WC) - Lantai 2", unit: "m2", volume: 25, unitPrice: 185000, amount: 4625000, weightPct: 0.5806, startOffsetDays: 252, durationDays: 14 },
        { description: "Opening Kusen PC - Lantai 2", unit: "bh", volume: 8, unitPrice: 75000, amount: 600000, weightPct: 0.2399, startOffsetDays: 154, durationDays: 7 },
        { description: "Tali Air - Lantai 2", unit: "m", volume: 22, unitPrice: 55000, amount: 1210000, weightPct: 0.2963, startOffsetDays: 280, durationDays: 7 },
        // LANTAI 3
        { description: "Pek. Plesteran 1PC: 5PS + Acian - Lantai 3", unit: "m2", volume: 175, unitPrice: 85000, amount: 14875000, weightPct: 2.5192, startOffsetDays: 119, durationDays: 14 },
        { description: "Pasangan Keramik Dinding (KM / WC) - Lantai 3", unit: "m2", volume: 20, unitPrice: 185000, amount: 3700000, weightPct: 0.3629, startOffsetDays: 252, durationDays: 14 },
        { description: "Opening Kusen PC - Lantai 3", unit: "bh", volume: 6, unitPrice: 75000, amount: 450000, weightPct: 0.1371, startOffsetDays: 133, durationDays: 7 },
        { description: "Tali Air - Lantai 3", unit: "m", volume: 15, unitPrice: 55000, amount: 825000, weightPct: 0.0635, startOffsetDays: 133, durationDays: 7 },
      ]
    },
    {
      name: "VI. PEKERJAAN ATAP",
      order: 5,
      items: [
        { description: "Rangka Atap Baja Ringan", unit: "m2", volume: 85, unitPrice: 185000, amount: 15725000, weightPct: 0.2922, startOffsetDays: 189, durationDays: 21 },
        { description: "Waterproofing Dak & Canopy Beton", unit: "m2", volume: 50, unitPrice: 175000, amount: 8750000, weightPct: 0.1519, startOffsetDays: 210, durationDays: 7 },
        { description: "Screed", unit: "m2", volume: 50, unitPrice: 85000, amount: 4250000, weightPct: 0.7117, startOffsetDays: 210, durationDays: 7 },
        { description: "Penutup Atap", unit: "m2", volume: 85, unitPrice: 225000, amount: 19125000, weightPct: 0.2980, startOffsetDays: 189, durationDays: 21 },
        { description: "Flashing Datar & Miring Alderon", unit: "m", volume: 35, unitPrice: 125000, amount: 4375000, weightPct: 0.0841, startOffsetDays: 210, durationDays: 7 },
        { description: "Railing", unit: "m", volume: 25, unitPrice: 550000, amount: 13750000, weightPct: 0.9510, startOffsetDays: 273, durationDays: 14 },
        { description: "Zincromate", unit: "m", volume: 25, unitPrice: 65000, amount: 1625000, weightPct: 0.0276, startOffsetDays: 273, durationDays: 14 },
        { description: "Cat Besi", unit: "m", volume: 25, unitPrice: 65000, amount: 1625000, weightPct: 0.0276, startOffsetDays: 273, durationDays: 14 },
      ]
    },
    {
      name: "VII. PEKERJAAN PLAFOND",
      order: 6,
      items: [
        { description: "Pekerjaan Plafond Lantai 1", unit: "m2", volume: 100, unitPrice: 125000, amount: 12500000, weightPct: 1.5200, startOffsetDays: 217, durationDays: 14 },
        { description: "Pekerjaan Plafond Lantai 2", unit: "m2", volume: 95, unitPrice: 125000, amount: 11875000, weightPct: 1.5979, startOffsetDays: 231, durationDays: 14 },
        { description: "Pekerjaan Plafond Lantai 3", unit: "m2", volume: 85, unitPrice: 125000, amount: 10625000, weightPct: 0.2822, startOffsetDays: 245, durationDays: 7 },
        { description: "Pekerjaan Plafond K. Mandi (Lt.1~Lt.3)", unit: "m2", volume: 25, unitPrice: 135000, amount: 3375000, weightPct: 0.2342, startOffsetDays: 217, durationDays: 35 },
        { description: "Pekerjaan Shadow Line", unit: "m", volume: 120, unitPrice: 45000, amount: 5400000, weightPct: 0.1548, startOffsetDays: 245, durationDays: 7 },
      ]
    },
    {
      name: "VIII. PEKERJAAN FINISHING LANTAI",
      order: 7,
      items: [
        { description: "Pekerjaan Finishing Lantai 1", unit: "m2", volume: 100, unitPrice: 275000, amount: 27500000, weightPct: 3.2926, startOffsetDays: 273, durationDays: 21 },
        { description: "Pekerjaan Finishing Lantai 2", unit: "m2", volume: 95, unitPrice: 275000, amount: 26125000, weightPct: 3.5278, startOffsetDays: 252, durationDays: 21 },
        { description: "Pekerjaan Finishing Lantai 3", unit: "m2", volume: 85, unitPrice: 275000, amount: 23375000, weightPct: 1.6449, startOffsetDays: 231, durationDays: 21 },
        { description: "Peekrjaan Carport", unit: "ls", volume: 1, unitPrice: 5500000, amount: 5500000, weightPct: 0.6914, startOffsetDays: 280, durationDays: 14 },
        { description: "Pekerjaan Waterproofing K. Mandi", unit: "m2", volume: 25, unitPrice: 135000, amount: 3375000, weightPct: 0.1199, startOffsetDays: 231, durationDays: 49 },
        { description: "Pekerjaan Waterproofing Lt.3", unit: "m2", volume: 40, unitPrice: 135000, amount: 5400000, weightPct: 0.9837, startOffsetDays: 231, durationDays: 21 },
      ]
    },
    {
      name: "IX. PEKERJAAN KUSEN, JENDELA & PINTU",
      order: 8,
      items: [
        { description: "Pekerjaan Kusen, Pintu dan Jendela Kayu Lt.1", unit: "bh", volume: 8, unitPrice: 1250000, amount: 10000000, weightPct: 1.2011, startOffsetDays: 287, durationDays: 14 },
        { description: "Pekerjaan Kusen, Pintu dan Jendela Kayu Lt.2", unit: "bh", volume: 10, unitPrice: 1250000, amount: 12500000, weightPct: 2.1019, startOffsetDays: 287, durationDays: 14 },
        { description: "Pekerjaan Kusen, Pintu dan Jendela Kayu Lt.3", unit: "bh", volume: 8, unitPrice: 1250000, amount: 10000000, weightPct: 1.2011, startOffsetDays: 287, durationDays: 14 },
      ]
    },
    {
      name: "X. PEKERJAAN PENGECATAN",
      order: 9,
      items: [
        { description: "Pek. Cat Dinding Dalam", unit: "m2", volume: 450, unitPrice: 55000, amount: 24750000, weightPct: 4.1986, startOffsetDays: 287, durationDays: 21 },
        { description: "Pek. Cat Dinding Luar", unit: "m2", volume: 150, unitPrice: 65000, amount: 9750000, weightPct: 1.5870, startOffsetDays: 287, durationDays: 21 },
        { description: "Pek. Cat Plafond Gypsum + List", unit: "m2", volume: 280, unitPrice: 45000, amount: 12600000, weightPct: 1.2023, startOffsetDays: 287, durationDays: 21 },
        { description: "Pek. Cat Plafond Gypsum WR + List", unit: "m2", volume: 25, unitPrice: 55000, amount: 1375000, weightPct: 0.0811, startOffsetDays: 287, durationDays: 21 },
        { description: "Finishing cat dinding parapet", unit: "m2", volume: 20, unitPrice: 95000, amount: 1900000, weightPct: 0.2920, startOffsetDays: 308, durationDays: 7 },
      ]
    },
    {
      name: "XI. PEKERJAAN MEP",
      order: 10,
      items: [
        { description: "Pekerjaan Instalasi Air", unit: "ls", volume: 1, unitPrice: 18500000, amount: 18500000, weightPct: 2.8003, startOffsetDays: 35, durationDays: 84 },
        { description: "Pek. Instalasi Kabel Titik Lampu", unit: "pt", volume: 45, unitPrice: 125000, amount: 5625000, weightPct: 0.7864, startOffsetDays: 245, durationDays: 28 },
        { description: "Pek. Instalasi Kabel Stop Kontak", unit: "pt", volume: 25, unitPrice: 75000, amount: 1875000, weightPct: 0.2759, startOffsetDays: 245, durationDays: 28 },
        { description: "Pek. Instalasi Kabel Toevoer Tipe 1", unit: "bh", volume: 1, unitPrice: 125000, amount: 125000, weightPct: 0.0180, startOffsetDays: 245, durationDays: 28 },
        { description: "Fitting Titik Lampu Standard", unit: "bh", volume: 35, unitPrice: 35000, amount: 1225000, weightPct: 0.1996, startOffsetDays: 245, durationDays: 28 },
        { description: "Fitting Titik Lampu Downlight Outbow", unit: "bh", volume: 20, unitPrice: 55000, amount: 1100000, weightPct: 0.1558, startOffsetDays: 245, durationDays: 28 },
        { description: "Pek. Instalasi Saklar Singgel & Double", unit: "pt", volume: 20, unitPrice: 45000, amount: 900000, weightPct: 0.1217, startOffsetDays: 245, durationDays: 28 },
        { description: "Pek. Instalasi Stop Kontak", unit: "pt", volume: 15, unitPrice: 35000, amount: 525000, weightPct: 0.0812, startOffsetDays: 245, durationDays: 28 },
        { description: "Pek. Instalasi Box MCB", unit: "bh", volume: 3, unitPrice: 1250000, amount: 3750000, weightPct: 0.5843, startOffsetDays: 245, durationDays: 28 },
      ]
    },
    {
      name: "XII. PEKERJAAN SANITAR",
      order: 11,
      items: [
        { description: "Instalasi Closet Monoblock", unit: "bh", volume: 3, unitPrice: 2500000, amount: 7500000, weightPct: 0.1136, startOffsetDays: 224, durationDays: 21 },
        { description: "Instalasi Jet Washer", unit: "bh", volume: 3, unitPrice: 350000, amount: 1050000, weightPct: 0.0162, startOffsetDays: 224, durationDays: 21 },
        { description: "Instalasi Floor Drain", unit: "bh", volume: 6, unitPrice: 175000, amount: 1050000, weightPct: 0.0162, startOffsetDays: 224, durationDays: 21 },
        { description: "Instalasi Roof Drain", unit: "bh", volume: 4, unitPrice: 375000, amount: 1500000, weightPct: 0.0243, startOffsetDays: 224, durationDays: 21 },
        { description: "Instalasi Kran Dinding", unit: "bh", volume: 6, unitPrice: 175000, amount: 1050000, weightPct: 0.0162, startOffsetDays: 224, durationDays: 21 },
        { description: "Instalasi Kitchen Sink", unit: "bh", volume: 1, unitPrice: 1250000, amount: 1250000, weightPct: 0.0195, startOffsetDays: 224, durationDays: 21 },
        { description: "Instalasi Kran Kitchen Sink", unit: "bh", volume: 1, unitPrice: 275000, amount: 275000, weightPct: 0.0041, startOffsetDays: 224, durationDays: 21 },
      ]
    },
    {
      name: "XIII. PEKERJAAN LAIN-LAIN",
      order: 12,
      items: [
        { description: "Pembongkaran dan Bobokan", unit: "ls", volume: 1, unitPrice: 15000000, amount: 15000000, weightPct: 2.8455, startOffsetDays: 0, durationDays: 182 },
      ]
    }
  ];

  // Calculate totals
  let totalAmount = 0;
  let totalItems = 0;
  sectionsData.forEach(section => {
    section.items.forEach(item => {
      totalAmount += item.amount;
      totalItems++;
    });
  });

  console.log(`📊 Total Amount: Rp ${totalAmount.toLocaleString('id-ID')}`);
  console.log(`📊 Total Items: ${totalItems}`);
  console.log(`📊 Sections: ${sectionsData.length}`);
  console.log();

  // Check if RAB already exists
  const existingRab = await prisma.rab.findUnique({
    where: { number: rabData.number }
  });

  if (existingRab) {
    console.log(`⚠️  RAB "${rabData.number}" already exists. Deleting...`);
    await prisma.rab.delete({
      where: { id: existingRab.id }
    });
    console.log("✅ Deleted existing RAB\n");
  }

  // Find existing admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN", isActive: true }
  });

  if (!adminUser) {
    throw new Error("No active admin user found. Please create an admin user first.");
  }
  console.log(`✅ Using admin user: ${adminUser.name} (${adminUser.email})\n`);

  // Create RAB with all sections and items
  console.log("📝 Creating RAB...");
  const rab = await prisma.rab.create({
    data: {
      number: rabData.number,
      title: rabData.title,
      clientName: rabData.clientName,
      location: rabData.location,
      projectDate: rabData.projectDate,
      scheduleStart: rabData.scheduleStart,
      restDays: rabData.restDays,
      status: rabData.status,
      notes: rabData.notes,
      subtotal: new Decimal(totalAmount),
      discountAmount: new Decimal(0),
      discountPct: new Decimal(0),
      taxAmount: new Decimal(totalAmount * 0.11),
      taxPct: new Decimal(11),
      total: new Decimal(totalAmount * 1.11),
      createdById: adminUser.id, // Use actual admin user ID
    }
  });
  console.log(`✅ RAB created: ${rab.id}\n`);

  // Create sections and items
  console.log("📝 Creating sections and items...");
  let itemCount = 0;
  for (const sectionData of sectionsData) {
    const section = await prisma.rabSection.create({
      data: {
        rabId: rab.id,
        name: sectionData.name,
        order: sectionData.order
      }
    });

    for (let i = 0; i < sectionData.items.length; i++) {
      const itemData = sectionData.items[i];
      await prisma.rabItem.create({
        data: {
          sectionId: section.id,
          description: itemData.description,
          unit: itemData.unit,
          volume: new Decimal(itemData.volume),
          unitPrice: new Decimal(itemData.unitPrice),
          amount: new Decimal(itemData.amount),
          order: i,
          startOffsetDays: itemData.startOffsetDays,
          durationDays: itemData.durationDays
        }
      });
      itemCount++;
    }
    console.log(`  ✅ Section: ${sectionData.name} (${sectionData.items.length} items)`);
  }

  console.log(`\n✅ Created ${itemCount} items in ${sectionsData.length} sections\n`);

  // Print schedule summary
  console.log("=" .repeat(60));
  console.log("📅 SCHEDULE SUMMARY");
  console.log("=".repeat(60));

  const startDate = new Date(rabData.scheduleStart);
  sectionsData.forEach(section => {
    console.log(`\n📁 ${section.name}`);
    section.items.slice(0, 3).forEach(item => {
      if (item.durationDays > 0) {
        const itemStart = new Date(startDate);
        itemStart.setDate(itemStart.getDate() + item.startOffsetDays);
        const itemEnd = new Date(itemStart);
        itemEnd.setDate(itemEnd.getDate() + item.durationDays - 1);
        console.log(`   ${item.description.substring(0, 40)}...`);
        console.log(`   Start: ${itemStart.toLocaleDateString('id-ID')} | End: ${itemEnd.toLocaleDateString('id-ID')} | ${item.durationDays} days`);
      }
    });
    if (section.items.length > 3) {
      console.log(`   ... dan ${section.items.length - 3} item lainnya`);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("✅ PASEBAN Timeline Seed Complete!");
  console.log("=".repeat(60));
  console.log(`\n🌐 Open browser to view: /rab/${rab.id}/schedule`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
