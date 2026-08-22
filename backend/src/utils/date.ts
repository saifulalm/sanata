/**
 * Tanggal proyek konstruksi selalu berupa tanggal kalender, bukan penanda waktu.
 *
 * "Opname tanggal 15 Agustus" berarti hari itu di lokasi proyek — bukan pukul
 * sekian di zona waktu server. Karena itu setiap tanggal polos disimpan sebagai
 * tengah malam UTC dan dibaca kembali dengan getter UTC. Selama kedua arah
 * memakai UTC, angka yang diketik pengawas adalah angka yang tersimpan, apa pun
 * zona waktu server maupun peramban.
 *
 * Berkas ini memusatkan aturan itu supaya tidak lagi ditulis ulang di tiap
 * service dengan bentuk yang sedikit berbeda.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Zona waktu operasional perusahaan — dasar penentuan "hari ini" dan tahun berjalan. */
export const PROJECT_TIME_ZONE = "Asia/Jakarta";

/**
 * `YYYY-MM-DD` menjadi tengah malam UTC.
 *
 * Ditulis lengkap dengan `T00:00:00Z` dan bukan `new Date("2026-08-15")`:
 * keduanya kebetulan sama hasilnya, tapi hanya yang eksplisit yang tetap benar
 * bila suatu saat string yang masuk membawa jam.
 */
export function parseDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

/** Buang komponen jam, tetap di kalender UTC. */
export function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

/** Akhir hari, untuk perbandingan `lte` terhadap kolom yang mungkin menyimpan jam. */
export function endOfUtcDay(value: Date): Date {
  return new Date(startOfUtcDay(value).getTime() + DAY_MS - 1);
}

export function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

/** Selisih hari kalender penuh antara dua tanggal UTC. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / DAY_MS);
}

/** Tanggal hari ini menurut kalender Jakarta, bukan menurut UTC. */
export function todayInProjectZone(): Date {
  return parseDateOnly(
    new Intl.DateTimeFormat("en-CA", { timeZone: PROJECT_TIME_ZONE }).format(new Date())
  );
}

/**
 * Tahun berjalan menurut kalender Jakarta.
 *
 * Dipakai untuk penomoran surat. `new Date().getFullYear()` mengikuti zona
 * waktu proses: server yang berjalan di UTC masih menuliskan tahun lama sampai
 * pukul tujuh pagi tanggal 1 Januari, dan nomor surat yang salah tahun sulit
 * diperbaiki setelah dikirim ke pemilik proyek.
 */
export function projectYear(): number {
  return todayInProjectZone().getUTCFullYear();
}

/** Senin pada minggu yang memuat `date`. Minggu proyek dibaca Senin–Minggu. */
export function startOfIsoWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  // getUTCDay(): 0 = Minggu. Minggu dianggap hari terakhir, jadi mundur 6 hari.
  const shift = (day.getUTCDay() + 6) % 7;
  return addDays(day, -shift);
}

export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function monthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Angka Romawi bulan — lazim dipakai pada nomor surat Indonesia (mis. VIII/2026). */
const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export function romanMonth(date: Date): string {
  return ROMAN_MONTHS[date.getUTCMonth()];
}
