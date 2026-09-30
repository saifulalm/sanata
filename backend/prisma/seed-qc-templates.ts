/**
 * QC Templates Seed Data
 * Comprehensive quality control checklist templates for construction
 * Based on WBS stages from QC Flow PDF
 */

import { PrismaClient, WbsStage } from "@prisma/client";

const prisma = new PrismaClient();

interface QcTemplateItem {
  itemDesc: string;
  criteria: string;
  tolerance: string;
  isMandatory: boolean;
  order: number;
}

interface QcTemplateData {
  wbsStage: WbsStage;
  methodCode?: string;
  name: string;
  description: string;
  items: QcTemplateItem[];
}

// Export for use in main seed.ts
export async function seedQcTemplates(prisma: PrismaClient) {
  console.log("======================================================================");
  console.log("QC TEMPLATES SEED DATA");
  console.log("======================================================================");
  console.log("");

  let createdCount = 0;
  let skippedCount = 0;

  for (const template of qcTemplates) {
    // Check if template already exists
    const existing = await prisma.qcTemplate.findFirst({
      where: {
        name: template.name,
        wbsStage: template.wbsStage
      }
    });

    if (existing) {
      console.log(`  ⏭️  Skipping: ${template.name} (${template.wbsStage}) - already exists`);
      skippedCount++;
      continue;
    }

    // Note: methodCode references MethodStatement but we're not setting it to avoid FK constraint issues
    // Create the template
    const created = await prisma.qcTemplate.create({
      data: {
        wbsStage: template.wbsStage,
        // methodCode intentionally omitted - relation handled separately if needed
        name: template.name,
        description: template.description,
        items: template.items as any, // JSON type
        isActive: true,
      }
    });

    console.log(`  ✅ Created: ${created.name}`);
    console.log(`     WBS Stage: ${created.wbsStage}`);
    console.log(`     Method Code: ${template.methodCode || 'N/A'}`);
    console.log(`     Items: ${template.items.length}`);
    createdCount++;
  }

  // Summary
  console.log("");
  console.log("======================================================================");
  console.log("QC TEMPLATES SEEDING COMPLETE");
  console.log("======================================================================");
  console.log("");
  console.log("📊 Summary:");
  console.log(`   - Templates Created: ${createdCount}`);
  console.log(`   - Templates Skipped: ${skippedCount}`);
  console.log(`   - Total Templates: ${qcTemplates.length}`);
  console.log("");

  // Show templates by WBS stage
  console.log("📋 Templates by WBS Stage:");
  const byStage = qcTemplates.reduce((acc, t) => {
    acc[t.wbsStage] = (acc[t.wbsStage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [stage, count] of Object.entries(byStage)) {
    console.log(`   - ${stage}: ${count} templates`);
  }

  console.log("");
  console.log("======================================================================");
}

const qcTemplates: QcTemplateData[] = [
  // =============================================================================
  // FOUNDATION (STR-001) - Page 3-4 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "FOUNDATION",
    methodCode: "STR-001-F01",
    name: "QC Pondasi Strauss Pile D300",
    description: "Quality Control checklist untuk pondasi strauss pile diameter 300mm. Memeriksa kedalaman, diameter, tulangan, slump, dan endapan semen.",
    items: [
      {
        itemDesc: "Kedalaman pengeboran",
        criteria: "Kedalaman sesuai spesifikasi desain minimal sesuai N-SPT",
        tolerance: "± 50mm dari desain",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Diameter lubang bor",
        criteria: "Diameter sesuai spesifikasi D300mm",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Tulangan cage",
        criteria: "Jumlah dan diameter tulangan sesuai desain, splicelapping cukup",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Slump beton",
        criteria: "Slump sesuai spesifikasi 12-18cm untuk bored pile",
        tolerance: "12-18 cm",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Endapan semen (sluff)",
        criteria: "Tidak ada endapan yang mengganggu aliran beton",
        tolerance: "Maks 30mm",
        isMandatory: true,
        order: 5
      }
    ]
  },

  {
    wbsStage: "FOUNDATION",
    methodCode: "STR-001-F02",
    name: "QC Sloof 30x50",
    description: "Quality Control checklist untuk sloof ukuran 30x50cm. Memeriksa dimensi, tulangan utama, sengkang, kebersihan, dan coakan.",
    items: [
      {
        itemDesc: "Dimensi sloof",
        criteria: "Ukuran sesuai图纸 30x50cm",
        tolerance: "± 5mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Tulangan utama",
        criteria: "Jumlah dan diameter tulangan sesuai desain",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Sengkang/pengikat",
        criteria: "Jarak sengkang sesuai spesifikasi",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Kebersihan bekisting",
        criteria: "Tidak ada kotoran, air tergenang, atau minyak",
        tolerance: "Bersih & kering",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Coakan/slodran",
        criteria: "Ukuran dan posisi sesuai desain",
        tolerance: "± 10mm",
        isMandatory: false,
        order: 5
      }
    ]
  },

  // =============================================================================
  // STRUCTURE (STR-002) - Page 5-6 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "STRUCTURE",
    methodCode: "STR-002-S01",
    name: "QC Kolom Beton 40x40",
    description: "Quality Control checklist untuk kolom beton ukuran 40x40cm. Memeriksa dimensi, elevasi, kekakuan, tulangan, selimut beton, dan splicer.",
    items: [
      {
        itemDesc: "Dimensi kolom",
        criteria: "Ukuran sesuai图纸 40x40cm",
        tolerance: "± 5mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Elevasi/tinggi kolom",
        criteria: "Ketinggian sesuai desain sampai ± 0.00",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Kekakuan/kebakuan",
        criteria: "Kolom lurus, tidak ada deviasi dari sumbu vertikal",
        tolerance: "L/500",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Tulangan kolom",
        criteria: "Jumlah, diameter, dan posisi tulangan sesuai desain",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Selimut beton",
        criteria: "Tebal selimut beton sesuai spesifikasi",
        tolerance: "± 5mm dari spec",
        isMandatory: true,
        order: 5
      },
      {
        itemDesc: "Spliser/tulangan sambungan",
        criteria: "Panjang sambungan sesuai standar SNI",
        tolerance: "± 20mm",
        isMandatory: true,
        order: 6
      }
    ]
  },

  {
    wbsStage: "STRUCTURE",
    methodCode: "STR-002-S02",
    name: "QC Balok Beton",
    description: "Quality Control checklist untuk balok beton bertulang. Memeriksa dimensi, tulangan tarik/tekan, sengkang, dan elevasi.",
    items: [
      {
        itemDesc: "Dimensi balok",
        criteria: "Tinggi dan lebar sesuai图纸",
        tolerance: "± 5mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Tulangan tarik atas & bawah",
        criteria: "Jumlah dan diameter sesuai desain",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Sengkang/stirrup",
        criteria: "Jarak dan diameter sengkang sesuai spesifikasi",
        tolerance: "± 15mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Elevasi/posición",
        criteria: "Ketinggian sesuai desain mulai dari sloof",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Bentang/panjang",
        criteria: "Panjang balok sesuai图纸",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 5
      }
    ]
  },

  {
    wbsStage: "STRUCTURE",
    methodCode: "STR-002-S03",
    name: "QC Plat Lantai 12cm",
    description: "Quality Control checklist untuk plat lantai tebal 12cm. Memeriksa tebal, tulangan atas/bawah, momen negatif, jarak tulangan, dan lendutan.",
    items: [
      {
        itemDesc: "Tebal plat",
        criteria: "Ketebalan sesuai图纸 12cm",
        tolerance: "± 5mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Tulangan atas & bawah",
        criteria: "Jumlah dan diameter sesuai desain",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Momen negatif/penulang negative",
        criteria: "Tulangan negative terpasang cukup dan sesuai desain",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Jarak antar tulangan",
        criteria: "Jarak spasi tulangan sesuai spesifikasi",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Lendutan/foto deformasi",
        criteria: "Tidak ada lendutan berlebihan",
        tolerance: "L/250",
        isMandatory: false,
        order: 5
      }
    ]
  },

  // =============================================================================
  // MASONRY (ARC-001) - Page 7 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "MASONRY",
    methodCode: "ARC-001-M01",
    name: "QC Pasangan Bata",
    description: "Quality Control checklist untuk pemasangan bata merah. Memeriksa jenis bata, campuran mortar, tebal spesi, kerataan, kekakuan, dan overlap.",
    items: [
      {
        itemDesc: "Jenis dan mutu bata",
        criteria: "Bata sesuai spesifikasi (K-125 minimum)",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Campuran mortar",
        criteria: "Rasio semen:pasir sesuai spesifikasi 1:4 atau 1:5",
        tolerance: "Sesuai Mix Design",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Tebal spesi/adukan",
        criteria: "Tebal adukan konsisten sesuai spesifikasi",
        tolerance: "12-15mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Kerataan permukaan",
        criteria: "Dinding rata, tidak ada выпуклость atau cekungan",
        tolerance: "± 5mm per 2m",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Kekakuan/kebakuan",
        criteria: "Dinding lurus vertikal, tidak ada deviasi",
        tolerance: "L/500",
        isMandatory: true,
        order: 5
      },
      {
        itemDesc: "Overlap/joint staggered",
        criteria: "Sambungan vertikal tidak segaris (staggered min 1/4 bata)",
        tolerance: "Min 25mm offset",
        isMandatory: true,
        order: 6
      }
    ]
  },

  {
    wbsStage: "MASONRY",
    methodCode: "ARC-001-M02",
    name: "QC Plesteran Dinding",
    description: "Quality Control checklist untuk pekerjaan plesteran dinding. Memeriksa tebal, kerataan, campuran, kekeringan, dan retak.",
    items: [
      {
        itemDesc: "Tebal plesteran",
        criteria: "Ketebalan sesuai spesifikasi 15-20mm",
        tolerance: "± 3mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Kerataan permukaan",
        criteria: "Permukaan rata dengan alat 2m tanpa celah",
        tolerance: "± 5mm per 2m",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Campuran/adukan",
        criteria: "Rasio semen:pasir sesuai spesifikasi",
        tolerance: "Sesuai Mix Design",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Kekeringan substrat",
        criteria: "Substrat (bata) dalam kondisi kering atau lembab",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Retak rambut",
        criteria: "Tidak ada retak rambut yang terlihat",
        tolerance: "Tidak ada retak",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // ROOF (ARC-002) - Page 8 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "ROOF",
    methodCode: "ARC-002-R01",
    name: "QC Kuda-kuda & Rangka Atap",
    description: "Quality Control checklist untuk konstruksi kuda-kuda dan rangka atap. Memeriksa dimensi, sambungan, baut, ketinggian, dan kemiringan.",
    items: [
      {
        itemDesc: "Dimensi kayu/besi profil",
        criteria: "Ukuran sesuai图纸 kuda-kuda",
        tolerance: "± 3mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Sambungan/kodifikasi",
        criteria: "Sambungan menggunakan plat splices atau fish plate sesuai desain",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Baut pengikat",
        criteria: "Ukuran dan jumlah baut sesuai spesifikasi",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Ketinggian bubungan",
        criteria: "Ketinggian bubungan sesuai desain",
        tolerance: "± 20mm",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Kemiringan atap",
        criteria: "Sudut kemiringan sesuai spesifikasi",
        tolerance: "± 1°",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // MEP (MEP-001) - Page 9 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "MEP",
    methodCode: "MEP-001-E01",
    name: "QC Instalasi Listrik",
    description: "Quality Control checklist untuk instalasi listrik bangunan. Memeriksa kabel, penampang, grounding, jarak, dan labeling.",
    items: [
      {
        itemDesc: "Jenis dan ukuran kabel",
        criteria: "Kabel sesuai spesifikasi (NYA, NYCY, dll)",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Penampang kabel",
        criteria: "Luas penampang sesuai beban dan PUIL",
        tolerance: "Sesuai PUIL 2000",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Sistem grounding",
        criteria: "Grounding terpasang sesuai standar PUIL",
        tolerance: "Max 5 ohm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Jarak antar komponen",
        criteria: "Jarak sesuai standar kelistrikan",
        tolerance: "Sesuai PUIL",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Labeling dan marking",
        criteria: "Kabel dan komponen berlabel dengan jelas",
        tolerance: "Sesuai图纸",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // WATERPROOFING (ARC-003) - Page 10 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "WATERPROOFING",
    methodCode: "ARC-003-W01",
    name: "QC Waterproofing",
    description: "Quality Control checklist untuk pekerjaan waterproofing. Memeriksa permukaan, primer, ketebalan, overlap, dan uji genang.",
    items: [
      {
        itemDesc: "Kondisi permukaan",
        criteria: "Permukaan bersih, kering, rata, tanpa debu",
        tolerance: "Bersih & kering",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Aplikasi primer",
        criteria: "Primer diaplikasikan merata sesuai rekomendasi pabrikan",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Ketebalan membran",
        criteria: "Ketebalan sesuai spesifikasi (min 2mm untuk membran)",
        tolerance: "± 0.2mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Overlap/sambungan",
        criteria: "Overlap sesuai standar (min 50mm untuk membran)",
        tolerance: "Min 50mm",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Uji genang/water test",
        criteria: "Tidak ada rembesan setelah 24-48 jam pengujian",
        tolerance: "0 rembesan",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // FLOOR & WALL FINISH (FIN-001) - Page 11 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "FLOOR_WALL_FINISH",
    methodCode: "FIN-001-K01",
    name: "QC Keramik Lantai",
    description: "Quality Control checklist untuk pemasangan keramik lantai. Memeriksa kualitas, campuran, tebal, kerataan, nonslip, dan grout.",
    items: [
      {
        itemDesc: "Kualitas keramik",
        criteria: "Keramik sesuai spek (min PEI III, absorpsi < 10%)",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Campuran adhesive/mortar",
        criteria: "Adhesive sesuai rekomendasi pabrikan, mixing ratio benar",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Tebal adhesive",
        criteria: "Tebal adhesive cukup untuk coversirasi tanpa rongga",
        tolerance: "3-5mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Kerataan permukaan",
        criteria: "Permukaan rata, tanpa step/selisih height",
        tolerance: "± 2mm per 2m",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Sifat nonslip/anti-selip",
        criteria: "Keramik sesuai kelas slip-resistance ruangan",
        tolerance: "Sesuai ruangan",
        isMandatory: true,
        order: 5
      },
      {
        itemDesc: "Grout/joint filling",
        criteria: "Grout terisi penuh, warna sesuai, tidak retak",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 6
      }
    ]
  },

  {
    wbsStage: "FLOOR_WALL_FINISH",
    methodCode: "FIN-001-K02",
    name: "QC Keramik Dinding",
    description: "Quality Control checklist untuk pemasangan keramik dinding. Memeriksa alignment horizontal/vertikal, ketinggian, warna, dan grout.",
    items: [
      {
        itemDesc: "Alignment horizontal",
        criteria: "Baris keramik lurus horizontal tanpa offset",
        tolerance: "± 2mm per 3m",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Alignment vertikal",
        criteria: "Baris keramik lurus vertikal",
        tolerance: "± 2mm per 3m",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Ketinggian/elevasi",
        criteria: "Ketinggian sesuai desain, symmetrical dengan opening",
        tolerance: "± 5mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Konsistensi warna",
        criteria: "Warna keramik seragam sesuai batch yang sama",
        tolerance: "Min 3 batch match",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Grout dan joint",
        criteria: "Grout terisi penuh, joint rata, tanpa void",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // CEILING (FIN-002) - Page 12 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "CEILING",
    methodCode: "FIN-002-C01",
    name: "QC Langit-langit",
    description: "Quality Control checklist untuk pekerjaan plafon/langit-langit. Memeriksa ketinggian, kerataan, rangka, sambungan, dan listwow.",
    items: [
      {
        itemDesc: "Ketinggian plafon",
        criteria: "Ketinggian sesuai desain interior",
        tolerance: "± 10mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Kerataan permukaan",
        criteria: "Permukaan rata tanpa crown atau dip",
        tolerance: "± 3mm per 2m",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Rangka/penopang",
        criteria: "Rangka terpasang sesuai spesifikasi dan standard",
        tolerance: "Sesuai spec",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Sambungan antar panel",
        criteria: "Sambungan rata, tidak ada step atau gap",
        tolerance: "Max 1mm gap",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Listwow/trim finishing",
        criteria: "Listwow terpasang rata, sudut 45° presisi",
        tolerance: "± 1°",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // DOORS & WINDOWS (FIN-003) - Page 13 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "DOORS_WINDOWS",
    methodCode: "FIN-003-D01",
    name: "QC Kusen & Daun Pintu",
    description: "Quality Control checklist untuk kusen dan daun pintu. Memeriksa dimensi, socket/engsel, ketinggian, fungsi, dan seal.",
    items: [
      {
        itemDesc: "Dimensi kusen",
        criteria: "Ukuran sesuai opening dengan tolerance",
        tolerance: "+5mm, -0mm",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Posisi socket/engsel",
        criteria: "Jarak dan jumlah engsel sesuai standar",
        tolerance: "± 2mm",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Ketinggian dari floor",
        criteria: "Clearance dari floor sesuai spec",
        tolerance: "± 3mm",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Fungsi buka/tutup",
        criteria: "Pintu berfungsi lancar tanpa hambatan",
        tolerance: "Smooth operation",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Seal/kedap udara",
        criteria: "Seal terpasang dengan baik, tidak ada celah",
        tolerance: "Max 3mm gap",
        isMandatory: false,
        order: 5
      }
    ]
  },

  // =============================================================================
  // PAINTING (FIN-004) - Page 14 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "PAINTING",
    methodCode: "FIN-004-P01",
    name: "QC Pengecatan Interior",
    description: "Quality Control checklist untuk pekerjaan pengecatan interior. Memeriksa warna, finishing, ketebalan, coverage, drip, dan adhesi.",
    items: [
      {
        itemDesc: "Konsistensi warna",
        criteria: "Warna sesuai dengan color sample/ spesifikasi",
        tolerance: "Delta E < 3",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Kualitas finishing",
        criteria: "Finishing rata, tanpa brush marks atau roller marks",
        tolerance: "No visible marks",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Ketebalan film",
        criteria: "Ketebalan sesuai spesifikasi DFT (Dry Film Thickness)",
        tolerance: "± 10% dari spec",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Coverage/smoothness",
        criteria: "Coverage merata, tidak ada patchy atau missed spots",
        tolerance: "100% coverage",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Drip/sagging",
        criteria: "Tidak ada drip, sagging, atau runs pada permukaan",
        tolerance: "0 drip/sag",
        isMandatory: true,
        order: 5
      },
      {
        itemDesc: "Adhesi/kelengketan",
        criteria: "Cat melekat kuat pada substrat, no peeling",
        tolerance: "Min 3B cross-cut",
        isMandatory: true,
        order: 6
      }
    ]
  },

  // =============================================================================
  // TESTING & COMMISSIONING (T&C-001) - Page 15 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "TESTING_COMMISSIONING",
    methodCode: "TC-001-T01",
    name: "QC Testing & Commissioning",
    description: "Quality Control checklist untuk pengujian dan komisioning sistem bangunan. Memeriksa dokumentasi, fungsi, safety, performance, dan training.",
    items: [
      {
        itemDesc: "Dokumentasi teknis",
        criteria: "Manual, as-built drawings, dan O&M documents lengkap",
        tolerance: "100% complete",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Fungsi sistem",
        criteria: "Semua sistem berfungsi sesuai spesifikasi",
        tolerance: "100% functional",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Safety compliance",
        criteria: "Sistem memenuhi standar safety dan regulasi",
        tolerance: "100% compliant",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Performance testing",
        criteria: "Performance sesuai dengan design parameters",
        tolerance: "± 5% dari design",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Training handover",
        criteria: "Training pengguna dan maintenance team selesai",
        tolerance: "Min 1 session",
        isMandatory: true,
        order: 5
      }
    ]
  },

  // =============================================================================
  // SNAGGING (QA-001) - Page 16 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "SNAGGING",
    methodCode: "QA-001-S01",
    name: "QC Snagging List",
    description: "Quality Control checklist untuk pemeriksaan defect/snagging. Memeriksa item struktural, arsitektur, MEP, kebersihan, dokumentasi, dan as-built.",
    items: [
      {
        itemDesc: "Defect struktural",
        criteria: "Tidak ada retak, deformasi, atau defect pada struktur",
        tolerance: "0 structural defect",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Defect arsitektur",
        criteria: "Tidak ada cacat pada finishing arsitektural",
        tolerance: "Min defects acceptable",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Defect MEP",
        criteria: "Sistem MEP berfungsi tanpa defect",
        tolerance: "0 functional defect",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Kebersihan umum",
        criteria: "Area bersih dari debris, sampah, dan sisa material",
        tolerance: "Clean & tidy",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "Dokumentasi snagging",
        criteria: "Snagging list terdokumentasi dengan foto evidence",
        tolerance: "100% documented",
        isMandatory: true,
        order: 5
      },
      {
        itemDesc: "As-built drawings",
        criteria: "As-built drawings sesuai kondisi actual",
        tolerance: "100% accurate",
        isMandatory: true,
        order: 6
      }
    ]
  },

  // =============================================================================
  // HANDOVER (DOC-001) - Page 17 in QC Flow PDF
  // =============================================================================

  {
    wbsStage: "HANDOVER",
    methodCode: "DOC-001-H01",
    name: "QC Serah Terima",
    description: "Quality Control checklist untuk proses serah terima proyek. Memeriksa BAST, dokumen, garansi, manual, as-built, dan SLF.",
    items: [
      {
        itemDesc: "Berita Acara Serah Terima (BAST)",
        criteria: "BAST ditandatangani oleh kedua belah pihak",
        tolerance: "Signed by all parties",
        isMandatory: true,
        order: 1
      },
      {
        itemDesc: "Kelengkapan dokumen",
        criteria: "Semua dokumen handover lengkap dan terorganisir",
        tolerance: "100% complete",
        isMandatory: true,
        order: 2
      },
      {
        itemDesc: "Surat Garansi",
        criteria: "Surat garansi dari kontraktor dan vendor tersedia",
        tolerance: "Valid warranty",
        isMandatory: true,
        order: 3
      },
      {
        itemDesc: "Manual dan guides",
        criteria: "Operation manual dan maintenance guide tersedia",
        tolerance: "100% complete",
        isMandatory: true,
        order: 4
      },
      {
        itemDesc: "As-built documentation",
        criteria: "As-built drawings sesuai kondisi actual project",
        tolerance: "100% accurate",
        isMandatory: true,
        order: 5
      },
      {
        itemDesc: "Sertifikat Layak Fungsi (SLF)",
        criteria: "SLF atau layak fungsi dari instansi terkait",
        tolerance: "Valid SLF",
        isMandatory: true,
        order: 6
      }
    ]
  }
];

seedQcTemplates(prisma)
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
