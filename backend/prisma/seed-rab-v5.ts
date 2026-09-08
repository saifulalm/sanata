/**
 * SANTRA Comprehensive Seeder v5
 * Complete data seeding with detailed schedule for beautiful Kurva S
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ScheduleItem {
  description: string;
  unit: string;
  volume: number;
  unitPrice: number;
  startOffsetDays: number;
  durationDays: number;
  bobot: number;
}

interface SectionData {
  name: string;
  items: ScheduleItem[];
}

interface RabData {
  number: string;
  title: string;
  clientName: string;
  location: string;
  projectDate: string;
  scheduleStart: string;
  status: "DRAFT" | "REVIEW" | "APPROVED";
  subtotal: number;
  taxPct: number;
  discountAmount: number;
  sections: SectionData[];
}

const RAB_DETAILS: RabData[] = [

  {
    number: "RAB-2026-001",
    title: "Pembangunan Gedung Perkantoran 4 Lantai",
    clientName: "PT Nusantara Realty Indonesia",
    location: "Jl. Sudirman No. 45, Jakarta Selatan",
    projectDate: "2026-01-15",
    scheduleStart: "2026-02-01",
    status: "APPROVED",
    subtotal: 4850000000,
    taxPct: 11,
    discountAmount: 0,
    sections: [
      {
        name: "Pekerjaan Persiapan",
        items: [
          { description: "Pembersihan lokasi dan mobilizeasi", unit: "ls", volume: 1, unitPrice: 25000000, startOffsetDays: 0, durationDays: 7, bobot: 0.52 },
          { description: "Pengukuran dan bouwplank", unit: "ls", volume: 1, unitPrice: 15000000, startOffsetDays: 5, durationDays: 5, bobot: 0.31 },
          { description: "Pemasangan pagar proyek sementara", unit: "m", volume: 120, unitPrice: 350000, startOffsetDays: 0, durationDays: 10, bobot: 0.86 },
          { description: "Pembuatan kantor lapangan", unit: "ls", volume: 1, unitPrice: 45000000, startOffsetDays: 0, durationDays: 14, bobot: 0.93 },
          { description: "Pengadaan air dan listrik sementara", unit: "ls", volume: 1, unitPrice: 25000000, startOffsetDays: 0, durationDays: 210, bobot: 5.15 },
        ]
      },
      {
        name: "Pekerjaan Pondasi",
        items: [
          { description: "Pekerjaan galian pondasi", unit: "m3", volume: 350, unitPrice: 85000, startOffsetDays: 14, durationDays: 14, bobot: 0.61 },
          { description: "Pekerjaan pondasi Strauss pile D300", unit: "m", volume: 120, unitPrice: 850000, startOffsetDays: 20, durationDays: 35, bobot: 2.10 },
          { description: "Pekerjaan pile cap / poer", unit: "m3", volume: 85, unitPrice: 2800000, startOffsetDays: 55, durationDays: 21, bobot: 4.90 },
          { description: "Pekerjaan sloof 30x50 cm", unit: "m3", volume: 24, unitPrice: 2500000, startOffsetDays: 76, durationDays: 21, bobot: 1.24 },
          { description: "Waterproofing fondasi", unit: "m2", volume: 120, unitPrice: 185000, startOffsetDays: 97, durationDays: 7, bobot: 0.46 },
          { description: "Urugan tanah kembali", unit: "m3", volume: 150, unitPrice: 45000, startOffsetDays: 104, durationDays: 7, bobot: 0.14 },
        ]
      },

      {
        name: "Pekerjaan Struktur Beton",
        items: [
          { description: "Pekerjaan kolom utama lt.1 40x40 cm", unit: "m3", volume: 18, unitPrice: 3200000, startOffsetDays: 97, durationDays: 28, bobot: 1.18 },
          { description: "Pekerjaan kolom utama lt.2 40x40 cm", unit: "m3", volume: 18, unitPrice: 3200000, startOffsetDays: 125, durationDays: 28, bobot: 1.18 },
          { description: "Pekerjaan kolom utama lt.3 40x40 cm", unit: "m3", volume: 18, unitPrice: 3200000, startOffsetDays: 153, durationDays: 28, bobot: 1.18 },
          { description: "Pekerjaan kolom utama lt.4 40x40 cm", unit: "m3", volume: 18, unitPrice: 3200000, startOffsetDays: 181, durationDays: 28, bobot: 1.18 },
          { description: "Pekerjaan balok lt.1 30x50 cm", unit: "m3", volume: 22, unitPrice: 2800000, startOffsetDays: 118, durationDays: 21, bobot: 1.27 },
          { description: "Pekerjaan balok lt.2 30x50 cm", unit: "m3", volume: 22, unitPrice: 2800000, startOffsetDays: 146, durationDays: 21, bobot: 1.27 },
          { description: "Pekerjaan balok lt.3 30x50 cm", unit: "m3", volume: 22, unitPrice: 2800000, startOffsetDays: 174, durationDays: 21, bobot: 1.27 },
          { description: "Pekerjaan balok lt.4 30x50 cm", unit: "m3", volume: 22, unitPrice: 2800000, startOffsetDays: 202, durationDays: 21, bobot: 1.27 },
          { description: "Pekerjaan plat lantai lt.1 tebal 12 cm", unit: "m2", volume: 240, unitPrice: 385000, startOffsetDays: 139, durationDays: 14, bobot: 1.90 },
          { description: "Pekerjaan plat lantai lt.2 tebal 12 cm", unit: "m2", volume: 240, unitPrice: 385000, startOffsetDays: 167, durationDays: 14, bobot: 1.90 },
          { description: "Pekerjaan plat lantai lt.3 tebal 12 cm", unit: "m2", volume: 240, unitPrice: 385000, startOffsetDays: 195, durationDays: 14, bobot: 1.90 },
          { description: "Pekerjaan plat lantai lt.4 tebal 12 cm", unit: "m2", volume: 240, unitPrice: 385000, startOffsetDays: 223, durationDays: 14, bobot: 1.90 },
          { description: "Pembesian steel bar D13-D25", unit: "kg", volume: 15000, unitPrice: 18000, startOffsetDays: 97, durationDays: 140, bobot: 5.57 },
          { description: "Bekisting kolom & balok", unit: "m2", volume: 2800, unitPrice: 85000, startOffsetDays: 97, durationDays: 140, bobot: 4.91 },
        ]
      },
      {
        name: "Pekerjaan Arsitektur Dinding",
        items: [
          { description: "Pasangan dinding bata merah 1PC:5PP lt.1", unit: "m2", volume: 450, unitPrice: 95000, startOffsetDays: 153, durationDays: 21, bobot: 0.88 },
          { description: "Pasangan dinding bata merah 1PC:5PP lt.2", unit: "m2", volume: 450, unitPrice: 95000, startOffsetDays: 174, durationDays: 21, bobot: 0.88 },
          { description: "Pasangan dinding bata merah 1PC:5PP lt.3", unit: "m2", volume: 450, unitPrice: 95000, startOffsetDays: 195, durationDays: 21, bobot: 0.88 },
          { description: "Pasangan dinding bata merah 1PC:5PP lt.4", unit: "m2", volume: 450, unitPrice: 95000, startOffsetDays: 216, durationDays: 21, bobot: 0.88 },
          { description: "Plesteran dinding dalam lt.1", unit: "m2", volume: 900, unitPrice: 65000, startOffsetDays: 174, durationDays: 21, bobot: 1.21 },
          { description: "Plesteran dinding dalam lt.2", unit: "m2", volume: 900, unitPrice: 65000, startOffsetDays: 195, durationDays: 21, bobot: 1.21 },
          { description: "Plesteran dinding dalam lt.3", unit: "m2", volume: 900, unitPrice: 65000, startOffsetDays: 216, durationDays: 21, bobot: 1.21 },
          { description: "Plesteran dinding dalam lt.4", unit: "m2", volume: 900, unitPrice: 65000, startOffsetDays: 237, durationDays: 21, bobot: 1.21 },
          { description: "Acian dinding dalam lt.1", unit: "m2", volume: 900, unitPrice: 35000, startOffsetDays: 195, durationDays: 14, bobot: 0.65 },
          { description: "Acian dinding dalam lt.2", unit: "m2", volume: 900, unitPrice: 35000, startOffsetDays: 216, durationDays: 14, bobot: 0.65 },
          { description: "Acian dinding dalam lt.3", unit: "m2", volume: 900, unitPrice: 35000, startOffsetDays: 237, durationDays: 14, bobot: 0.65 },
          { description: "Acian dinding dalam lt.4", unit: "m2", volume: 900, unitPrice: 35000, startOffsetDays: 258, durationDays: 14, bobot: 0.65 },
        ]
      },

      {
        name: "Pekerjaan Arsitektur Finishing",
        items: [
          { description: "Pengecatan dinding dalam lt.1", unit: "m2", volume: 900, unitPrice: 45000, startOffsetDays: 209, durationDays: 14, bobot: 0.84 },
          { description: "Pengecatan dinding dalam lt.2", unit: "m2", volume: 900, unitPrice: 45000, startOffsetDays: 230, durationDays: 14, bobot: 0.84 },
          { description: "Pengecatan dinding dalam lt.3", unit: "m2", volume: 900, unitPrice: 45000, startOffsetDays: 251, durationDays: 14, bobot: 0.84 },
          { description: "Pengecatan dinding dalam lt.4", unit: "m2", volume: 900, unitPrice: 45000, startOffsetDays: 272, durationDays: 14, bobot: 0.84 },
          { description: "Pemasangan kusen aluminium lt.1", unit: "unit", volume: 6, unitPrice: 3500000, startOffsetDays: 223, durationDays: 14, bobot: 0.43 },
          { description: "Pemasangan kusen aluminium lt.2", unit: "unit", volume: 6, unitPrice: 3500000, startOffsetDays: 244, durationDays: 14, bobot: 0.43 },
          { description: "Pemasangan kusen aluminium lt.3", unit: "unit", volume: 6, unitPrice: 3500000, startOffsetDays: 265, durationDays: 14, bobot: 0.43 },
          { description: "Pemasangan kusen aluminium lt.4", unit: "unit", volume: 6, unitPrice: 3500000, startOffsetDays: 286, durationDays: 14, bobot: 0.43 },
          { description: "Pemasangan pintu triplek", unit: "unit", volume: 18, unitPrice: 850000, startOffsetDays: 300, durationDays: 14, bobot: 0.32 },
          { description: "Pemasangan lantai granit 60x60", unit: "m2", volume: 400, unitPrice: 250000, startOffsetDays: 314, durationDays: 21, bobot: 2.06 },
          { description: "Pemasangan plafond gypsum 9mm", unit: "m2", volume: 800, unitPrice: 85000, startOffsetDays: 286, durationDays: 21, bobot: 1.40 },
          { description: "Pemasangan list gypsum", unit: "m", volume: 350, unitPrice: 45000, startOffsetDays: 307, durationDays: 7, bobot: 0.33 },
        ]
      },
      {
        name: "Pekerjaan MEP Elektrikal",
        items: [
          { description: "Instalasi listrik lt.1", unit: "ls", volume: 1, unitPrice: 120000000, startOffsetDays: 195, durationDays: 28, bobot: 2.48 },
          { description: "Instalasi listrik lt.2", unit: "ls", volume: 1, unitPrice: 120000000, startOffsetDays: 223, durationDays: 28, bobot: 2.48 },
          { description: "Instalasi listrik lt.3", unit: "ls", volume: 1, unitPrice: 120000000, startOffsetDays: 251, durationDays: 28, bobot: 2.48 },
          { description: "Instalasi listrik lt.4", unit: "ls", volume: 1, unitPrice: 120000000, startOffsetDays: 279, durationDays: 28, bobot: 2.48 },
          { description: "Panel listrik utama", unit: "ls", volume: 1, unitPrice: 85000000, startOffsetDays: 314, durationDays: 14, bobot: 1.75 },
          { description: "Titik lampu LED", unit: "titik", volume: 120, unitPrice: 850000, startOffsetDays: 314, durationDays: 28, bobot: 2.10 },
          { description: "Stop kontak & saklar", unit: "titik", volume: 80, unitPrice: 125000, startOffsetDays: 314, durationDays: 28, bobot: 0.21 },
        ]
      },
      {
        name: "Pekerjaan MEP Mekanikal",
        items: [
          { description: "Sistem plumbing & drainase lt.1", unit: "ls", volume: 1, unitPrice: 80000000, startOffsetDays: 153, durationDays: 42, bobot: 1.65 },
          { description: "Sistem plumbing & drainase lt.2", unit: "ls", volume: 1, unitPrice: 80000000, startOffsetDays: 181, durationDays: 42, bobot: 1.65 },
          { description: "Sistem plumbing & drainase lt.3", unit: "ls", volume: 1, unitPrice: 80000000, startOffsetDays: 209, durationDays: 42, bobot: 1.65 },
          { description: "Sistem plumbing & drainase lt.4", unit: "ls", volume: 1, unitPrice: 80000000, startOffsetDays: 237, durationDays: 42, bobot: 1.65 },
          { description: "AC split 1 PK lt.1", unit: "unit", volume: 4, unitPrice: 7500000, startOffsetDays: 272, durationDays: 21, bobot: 0.62 },
          { description: "AC split 1 PK lt.2", unit: "unit", volume: 4, unitPrice: 7500000, startOffsetDays: 293, durationDays: 21, bobot: 0.62 },
          { description: "AC split 1 PK lt.3", unit: "unit", volume: 4, unitPrice: 7500000, startOffsetDays: 314, durationDays: 21, bobot: 0.62 },
          { description: "AC split 1 PK lt.4", unit: "unit", volume: 4, unitPrice: 7500000, startOffsetDays: 335, durationDays: 21, bobot: 0.62 },
          { description: "Fire alarm system", unit: "ls", volume: 1, unitPrice: 180000000, startOffsetDays: 251, durationDays: 56, bobot: 3.71 },
          { description: "Lift passenger 6 orang", unit: "unit", volume: 2, unitPrice: 350000000, startOffsetDays: 314, durationDays: 70, bobot: 14.43 },
        ]
      },
      {
        name: "Pekerjaan Luar",
        items: [
          { description: "Pemasangan paving block", unit: "m2", volume: 300, unitPrice: 185000, startOffsetDays: 335, durationDays: 21, bobot: 1.14 },
          { description: "Pemasangan manhole", unit: "unit", volume: 5, unitPrice: 2500000, startOffsetDays: 335, durationDays: 7, bobot: 0.26 },
          { description: "Pemasangan green area", unit: "ls", volume: 1, unitPrice: 45000000, startOffsetDays: 356, durationDays: 14, bobot: 0.93 },
          { description: "Pagar besi hollow", unit: "m", volume: 80, unitPrice: 650000, startOffsetDays: 349, durationDays: 14, bobot: 1.07 },
          { description: "Gerbang dan pos jaga", unit: "ls", volume: 1, unitPrice: 85000000, startOffsetDays: 349, durationDays: 21, bobot: 1.75 },
        ]
      }
    ]
  },

  {
    number: "RAB-2026-002",
    title: "Renovasi & Perluasan Rumah Tinggal Pak Budi",
    clientName: "Budi Santoso",
    location: "Jl. Melati No. 8, Jakarta Selatan",
    projectDate: "2026-06-01",
    scheduleStart: "2026-06-15",
    status: "APPROVED",
    subtotal: 765000000,
    taxPct: 11,
    discountAmount: 0,
    sections: [
      {
        name: "Pekerjaan Persiapan & Pembongkaran",
        items: [
          { description: "Pembersihan lokasi", unit: "ls", volume: 1, unitPrice: 2500000, startOffsetDays: 0, durationDays: 3, bobot: 0.33 },
          { description: "Pemasangan pagar sementara", unit: "m", volume: 30, unitPrice: 150000, startOffsetDays: 0, durationDays: 5, bobot: 0.24 },
          { description: "Pembongkaran dinding partisi lama", unit: "m2", volume: 45, unitPrice: 85000, startOffsetDays: 3, durationDays: 12, bobot: 0.50 },
          { description: "Pembongkaran plafon lama", unit: "m2", volume: 95, unitPrice: 45000, startOffsetDays: 10, durationDays: 7, bobot: 0.56 },
          { description: "Pembongkaran lantai keramik", unit: "m2", volume: 95, unitPrice: 35000, startOffsetDays: 10, durationDays: 7, bobot: 0.43 },
          { description: "Pembongkaran jendela & pintu lama", unit: "unit", volume: 12, unitPrice: 125000, startOffsetDays: 15, durationDays: 5, bobot: 0.20 },
        ]
      },
      {
        name: "Pekerjaan Struktur & Pondasi",
        items: [
          { description: "Pondasi footplat 60x60 cm", unit: "unit", volume: 8, unitPrice: 1200000, startOffsetDays: 20, durationDays: 11, bobot: 1.26 },
          { description: "Kolom praktis 15x15 cm", unit: "m", volume: 40, unitPrice: 150000, startOffsetDays: 31, durationDays: 14, bobot: 0.78 },
          { description: "Sloof 20x30 cm", unit: "m3", volume: 6, unitPrice: 2800000, startOffsetDays: 45, durationDays: 15, bobot: 2.20 },
          { description: "Dinding batako 10x20x40 cm", unit: "m2", volume: 120, unitPrice: 95000, startOffsetDays: 60, durationDays: 20, bobot: 1.49 },
          { description: "Ring balok 15x20 cm", unit: "m", volume: 30, unitPrice: 120000, startOffsetDays: 80, durationDays: 8, bobot: 0.47 },
          { description: "Pembesian tulangan", unit: "kg", volume: 850, unitPrice: 18000, startOffsetDays: 20, durationDays: 60, bobot: 2.00 },
          { description: "Bekisting", unit: "m2", volume: 120, unitPrice: 65000, startOffsetDays: 20, durationDays: 60, bobot: 1.02 },
        ]
      },
      {
        name: "Pekerjaan Atap",
        items: [
          { description: "Rangka atap baja ringan", unit: "m2", volume: 80, unitPrice: 165000, startOffsetDays: 88, durationDays: 14, bobot: 1.72 },
          { description: "Penutup atap genteng beton", unit: "m2", volume: 80, unitPrice: 125000, startOffsetDays: 102, durationDays: 12, bobot: 1.31 },
          { description: "Nok genteng", unit: "m", volume: 15, unitPrice: 85000, startOffsetDays: 114, durationDays: 3, bobot: 0.17 },
          { description: "Talang air galvanized", unit: "m", volume: 20, unitPrice: 85000, startOffsetDays: 114, durationDays: 3, bobot: 0.22 },
          { description: "Sekrup dan aksesoris atap", unit: "ls", volume: 1, unitPrice: 3500000, startOffsetDays: 102, durationDays: 15, bobot: 1.19 },
        ]
      },
      {
        name: "Pekerjaan Finishing Dinding",
        items: [
          { description: "Plesteran dinding baru", unit: "m2", volume: 240, unitPrice: 65000, startOffsetDays: 88, durationDays: 19, bobot: 2.04 },
          { description: "Acian dinding", unit: "m2", volume: 240, unitPrice: 35000, startOffsetDays: 107, durationDays: 14, bobot: 1.10 },
          { description: "Pengecatan dinding interior", unit: "m2", volume: 320, unitPrice: 45000, startOffsetDays: 121, durationDays: 19, bobot: 1.88 },
          { description: "Pengecatan dinding exterior", unit: "m2", volume: 80, unitPrice: 55000, startOffsetDays: 140, durationDays: 10, bobot: 0.58 },
          { description: "Pemasangan sudut aluminium", unit: "m", volume: 45, unitPrice: 45000, startOffsetDays: 121, durationDays: 7, bobot: 0.26 },
        ]
      },
      {
        name: "Pekerjaan Finishing Lantai & Plafond",
        items: [
          { description: "Pemasangan lantai keramik 60x60 cm", unit: "m2", volume: 95, unitPrice: 185000, startOffsetDays: 140, durationDays: 15, bobot: 2.29 },
          { description: "Pemasangan lantai keramik km. mandi", unit: "m2", volume: 25, unitPrice: 165000, startOffsetDays: 140, durationDays: 7, bobot: 0.54 },
          { description: "Pemasangan plafond gypsum 9mm", unit: "m2", volume: 95, unitPrice: 95000, startOffsetDays: 140, durationDays: 10, bobot: 1.18 },
          { description: "List plafond gypsum", unit: "m", volume: 55, unitPrice: 35000, startOffsetDays: 150, durationDays: 5, bobot: 0.25 },
        ]
      },
      {
        name: "Pekerjaan Pintu & Jendela",
        items: [
          { description: "Pemasangan pintu aluminium", unit: "unit", volume: 5, unitPrice: 1800000, startOffsetDays: 155, durationDays: 5, bobot: 1.18 },
          { description: "Pemasangan jendela aluminium", unit: "unit", volume: 8, unitPrice: 850000, startOffsetDays: 160, durationDays: 5, bobot: 0.89 },
          { description: "Pemasangan closat & accessories", unit: "ls", volume: 1, unitPrice: 2500000, startOffsetDays: 165, durationDays: 5, bobot: 0.33 },
          { description: "Kunci dan engsel", unit: "ls", volume: 1, unitPrice: 850000, startOffsetDays: 170, durationDays: 3, bobot: 0.11 },
        ]
      },
      {
        name: "Pekerjaan Plumbing & Elektrikal",
        items: [
          { description: "Instalasi pipa air bersih", unit: "ls", volume: 1, unitPrice: 8500000, startOffsetDays: 100, durationDays: 15, bobot: 1.11 },
          { description: "Instalasi pipa pembuangan", unit: "ls", volume: 1, unitPrice: 6000000, startOffsetDays: 100, durationDays: 15, bobot: 0.78 },
          { description: "Tanki air 500L + pump", unit: "ls", volume: 1, unitPrice: 3500000, startOffsetDays: 115, durationDays: 5, bobot: 0.46 },
          { description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 12500000, startOffsetDays: 121, durationDays: 20, bobot: 1.63 },
          { description: "Titik lampu LED", unit: "titik", volume: 18, unitPrice: 350000, startOffsetDays: 141, durationDays: 7, bobot: 0.82 },
          { description: "Stop kontak & saklar", unit: "titik", volume: 12, unitPrice: 125000, startOffsetDays: 141, durationDays: 7, bobot: 0.20 },
        ]
      }
    ]
  },

  {
    number: "RAB-2026-003",
    title: "Pembangunan Ruko 3 Lantai",
    clientName: "CV Maju Jaya",
    location: "Jl. Gatot Subroto No. 120, Jakarta Pusat",
    projectDate: "2026-07-01",
    scheduleStart: "2026-07-15",
    status: "REVIEW",
    subtotal: 1250000000,
    taxPct: 11,
    discountAmount: 25000000,
    sections: [
      {
        name: "Pekerjaan Persiapan & Pondasi",
        items: [
          { description: "Pembersihan lokasi", unit: "ls", volume: 1, unitPrice: 5000000, startOffsetDays: 0, durationDays: 2, bobot: 0.40 },
          { description: "Galian tanah pondasi", unit: "m3", volume: 50, unitPrice: 85000, startOffsetDays: 2, durationDays: 7, bobot: 0.34 },
          { description: "Pondasi Strauss pile D400", unit: "m", volume: 80, unitPrice: 950000, startOffsetDays: 5, durationDays: 28, bobot: 6.08 },
          { description: "Sloof 25x40 cm", unit: "m3", volume: 15, unitPrice: 2200000, startOffsetDays: 33, durationDays: 10, bobot: 2.64 },
          { description: "Urugan tanah kembali", unit: "m3", volume: 30, unitPrice: 45000, startOffsetDays: 43, durationDays: 3, bobot: 0.11 },
          { description: "Galian saluran pembuangan", unit: "m", volume: 25, unitPrice: 65000, startOffsetDays: 0, durationDays: 5, bobot: 0.13 },
        ]
      },
      {
        name: "Pekerjaan Struktur Beton Lantai 1",
        items: [
          { description: "Kolom 30x30 cm lt.1", unit: "m3", volume: 9, unitPrice: 3000000, startOffsetDays: 43, durationDays: 10, bobot: 2.16 },
          { description: "Balok 25x40 cm lt.1", unit: "m3", volume: 8, unitPrice: 2600000, startOffsetDays: 53, durationDays: 7, bobot: 1.66 },
          { description: "Plat lantai 12 cm lt.1", unit: "m2", volume: 150, unitPrice: 380000, startOffsetDays: 60, durationDays: 10, bobot: 4.56 },
          { description: "Pembesian kolom & balok lt.1", unit: "kg", volume: 2800, unitPrice: 18000, startOffsetDays: 43, durationDays: 21, bobot: 4.03 },
          { description: "Bekisting lt.1", unit: "m2", volume: 180, unitPrice: 85000, startOffsetDays: 43, durationDays: 21, bobot: 1.22 },
        ]
      },
      {
        name: "Pekerjaan Struktur Beton Lantai 2",
        items: [
          { description: "Kolom 30x30 cm lt.2", unit: "m3", volume: 9, unitPrice: 3000000, startOffsetDays: 70, durationDays: 10, bobot: 2.16 },
          { description: "Balok 25x40 cm lt.2", unit: "m3", volume: 8, unitPrice: 2600000, startOffsetDays: 80, durationDays: 7, bobot: 1.66 },
          { description: "Plat lantai 12 cm lt.2", unit: "m2", volume: 150, unitPrice: 380000, startOffsetDays: 87, durationDays: 10, bobot: 4.56 },
          { description: "Pembesian kolom & balok lt.2", unit: "kg", volume: 2800, unitPrice: 18000, startOffsetDays: 70, durationDays: 21, bobot: 4.03 },
          { description: "Bekisting lt.2", unit: "m2", volume: 180, unitPrice: 85000, startOffsetDays: 70, durationDays: 21, bobot: 1.22 },
        ]
      },
      {
        name: "Pekerjaan Struktur Beton Lantai 3",
        items: [
          { description: "Kolom 30x30 cm lt.3", unit: "m3", volume: 10, unitPrice: 3000000, startOffsetDays: 97, durationDays: 10, bobot: 2.40 },
          { description: "Balok 25x40 cm lt.3", unit: "m3", volume: 6, unitPrice: 2600000, startOffsetDays: 107, durationDays: 7, bobot: 1.25 },
          { description: "Plat atap 10 cm", unit: "m2", volume: 150, unitPrice: 420000, startOffsetDays: 114, durationDays: 12, bobot: 5.04 },
          { description: "Pembesian kolom & balok lt.3", unit: "kg", volume: 2900, unitPrice: 18000, startOffsetDays: 97, durationDays: 21, bobot: 4.18 },
          { description: "Bekisting lt.3", unit: "m2", volume: 160, unitPrice: 85000, startOffsetDays: 97, durationDays: 21, bobot: 1.09 },
        ]
      },
      {
        name: "Pekerjaan Arsitektur",
        items: [
          { description: "Dinding batako 10x20x40 cm lt.1", unit: "m2", volume: 220, unitPrice: 85000, startOffsetDays: 97, durationDays: 12, bobot: 1.50 },
          { description: "Dinding batako 10x20x40 cm lt.2", unit: "m2", volume: 220, unitPrice: 85000, startOffsetDays: 109, durationDays: 12, bobot: 1.50 },
          { description: "Dinding batako 10x20x40 cm lt.3", unit: "m2", volume: 210, unitPrice: 85000, startOffsetDays: 121, durationDays: 12, bobot: 1.43 },
          { description: "Plesteran & acian lt.1", unit: "m2", volume: 440, unitPrice: 55000, startOffsetDays: 109, durationDays: 14, bobot: 1.94 },
          { description: "Plesteran & acian lt.2", unit: "m2", volume: 440, unitPrice: 55000, startOffsetDays: 121, durationDays: 14, bobot: 1.94 },
          { description: "Plesteran & acian lt.3", unit: "m2", volume: 420, unitPrice: 55000, startOffsetDays: 133, durationDays: 14, bobot: 1.85 },
          { description: "Kusen aluminium & kaca depan", unit: "ls", volume: 1, unitPrice: 95000000, startOffsetDays: 147, durationDays: 21, bobot: 7.60 },
          { description: "Pengecatan dinding", unit: "m2", volume: 1300, unitPrice: 35000, startOffsetDays: 154, durationDays: 18, bobot: 3.64 },
          { description: "Lantai granit 60x60", unit: "m2", volume: 200, unitPrice: 220000, startOffsetDays: 168, durationDays: 15, bobot: 3.52 },
          { description: "Plafond gypsum 9mm", unit: "m2", volume: 200, unitPrice: 85000, startOffsetDays: 168, durationDays: 12, bobot: 1.36 },
        ]
      },
      {
        name: "Pekerjaan Elektrikal",
        items: [
          { description: "Instalasi listrik lengkap", unit: "ls", volume: 1, unitPrice: 35000000, startOffsetDays: 154, durationDays: 20, bobot: 2.80 },
          { description: "AC window 1 PK", unit: "unit", volume: 6, unitPrice: 4500000, startOffsetDays: 174, durationDays: 10, bobot: 2.16 },
          { description: "Pipa & fitting listrik", unit: "ls", volume: 1, unitPrice: 15000000, startOffsetDays: 154, durationDays: 25, bobot: 1.20 },
        ]
      }
    ]
  },

];

// ============================================================
// MAIN SEEDER FUNCTION
// ============================================================

async function main() {
  console.log("=".repeat(70));
  console.log("SANTRA Comprehensive Seeder v5 - Detailed Schedule Data");
  console.log("=".repeat(70));
  console.log("");

  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) {
    console.error("No admin user found. Run main seed first.");
    return;
  }
  const adminId = adminUser.id;
  console.log("Admin user: " + adminUser.email);

  // ============================================================
  // STEP 1: DELETE ALL EXISTING DATA
  // ============================================================
  console.log("STEP 1: Deleting all existing data...");
  
  await prisma.executionLog.deleteMany({});
  await prisma.executionPhoto.deleteMany({});
  await prisma.qcApprovalLog.deleteMany({});
  await prisma.qcPhoto.deleteMany({});
  await prisma.qcRecord.deleteMany({});
  await prisma.jobAssignment.deleteMany({});
  await prisma.workerAssessment.deleteMany({});
  await prisma.kpiRecord.deleteMany({});
  await prisma.toolLoan.deleteMany({});
  await prisma.toolActivity.deleteMany({});
  await prisma.toolMaintenance.deleteMany({});
  await prisma.toolPhoto.deleteMany({});
  await prisma.masterTool.deleteMany({});
  await prisma.lessonLearned.deleteMany({});
  await prisma.rabProgressPhoto.deleteMany({});
  await prisma.rabProgress.deleteMany({});
  await prisma.rabHoliday.deleteMany({});
  await prisma.rabScheduleBaseline.deleteMany({});
  await prisma.rabItem.deleteMany({});
  await prisma.rabSection.deleteMany({});
  await prisma.rab.deleteMany({});
  await prisma.santraCounter.deleteMany({});
  
  console.log("All existing data deleted.");

  // ============================================================
  // STEP 2: CREATE SANTRA COUNTERS
  // ============================================================
  console.log("STEP 2: Creating counters...");
  const counters = [
    { prefix: "RAB", lastSeq: 0 },
    { prefix: "LOG", lastSeq: 0 },
    { prefix: "QC", lastSeq: 0 },
    { prefix: "ASS", lastSeq: 0 },
    { prefix: "KPI", lastSeq: 0 },
    { prefix: "PROG", lastSeq: 0 },
    { prefix: "DR", lastSeq: 0 },
  ];
  for (const c of counters) {
    await prisma.santraCounter.create({ data: c });
  }
  console.log(counters.length + " counters created.");

  // ============================================================
  // STEP 3: CREATE RABS WITH SECTIONS AND ITEMS
  // ============================================================
  console.log("STEP 3: Creating RABs with detailed schedule...");
  
  let totalRabs = 0;
  let totalSections = 0;
  let totalItems = 0;

  for (const rabData of RAB_DETAILS) {
    console.log("");
    console.log("Creating " + rabData.number + ": " + rabData.title + "...");
    
    const subtotal = rabData.subtotal;
    const taxAmount = (subtotal - rabData.discountAmount) * (rabData.taxPct / 100);
    const total = subtotal - rabData.discountAmount + taxAmount;

    const rab = await prisma.rab.create({
      data: {
        number: rabData.number,
        title: rabData.title,
        clientName: rabData.clientName,
        location: rabData.location,
        projectDate: new Date(rabData.projectDate),
        scheduleStart: new Date(rabData.scheduleStart),
        status: rabData.status,
        taxPct: rabData.taxPct,
        subtotal: subtotal,
        discountAmount: rabData.discountAmount,
        taxAmount: taxAmount,
        total: total,
        restDays: [0],
        createdById: adminId,
      },
    });
    totalRabs++;

    let sectionOrder = 1;
    for (const sectionData of rabData.sections) {
      const section = await prisma.rabSection.create({
        data: {
          rabId: rab.id,
          name: sectionData.name,
          order: sectionOrder++,
        },
      });
      totalSections++;

      let itemOrder = 1;
      for (const itemData of sectionData.items) {
        await prisma.rabItem.create({
          data: {
            sectionId: section.id,
            description: itemData.description,
            unit: itemData.unit,
            volume: itemData.volume,
            unitPrice: itemData.unitPrice,
            amount: itemData.volume * itemData.unitPrice,
            startOffsetDays: itemData.startOffsetDays,
            durationDays: itemData.durationDays,
            order: itemOrder++,
          },
        });
        totalItems++;
      }
      console.log("  - " + sectionData.name + ": " + sectionData.items.length + " items");
    }

    const items = await prisma.rabItem.findMany({
      where: { section: { rabId: rab.id } },
      orderBy: { startOffsetDays: "asc" },
    });
    
    await prisma.rabScheduleBaseline.create({
      data: {
        rabId: rab.id,
        name: "Baseline Rencana",
        capturedById: adminId,
        snapshot: {
          capturedAt: new Date(),
          items: items.map(i => ({
            id: i.id,
            description: i.description,
            startOffsetDays: i.startOffsetDays,
            durationDays: i.durationDays,
            amount: Number(i.amount),
          })),
        },
      },
    });
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log("RABs created:       " + totalRabs);
  console.log("Sections created:   " + totalSections);
  console.log("Items created:     " + totalItems);
  console.log("");
  console.log("All RABs have detailed schedule data for beautiful Kurva S!");
  console.log("=".repeat(70));
}

main()
  .catch((e) => {
    console.error("Seeder error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
