/**
 * Nilai uang datang dari API sebagai string (Prisma Decimal) supaya presisi
 * tidak hilang. Konversi ke Number hanya dilakukan di sini, untuk tampilan.
 */
export function formatRupiah(value: string | number, withDecimals = false): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
}

/** Volume/koefisien: buang nol di belakang koma agar tabel tetap rapi. */
export function formatNumber(value: string | number, maxDecimals = 4): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("id-ID", { maximumFractionDigits: maxDecimals });
}

/** `YYYY-MM-DD` — tanggal kalender polos, tanpa jam dan tanpa zona waktu. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Tanggal kalender ("2026-08-15") dan penanda waktu ("2026-08-15T09:00:00Z")
 * adalah dua hal berbeda dan tidak boleh diformat dengan cara yang sama.
 *
 * `new Date("2026-08-15")` menghasilkan tengah malam UTC, lalu
 * `toLocaleDateString()` menggesernya ke zona waktu pembaca. Di zona negatif
 * tanggalnya mundur satu hari, dan karena halaman admin dirender di server lalu
 * dihidrasi di peramban, dua zona yang berbeda juga menghasilkan teks yang
 * berbeda untuk elemen yang sama. Karena itu tanggal polos selalu dibaca dan
 * ditampilkan sebagai UTC — angka yang diketik pengawas persis itu yang muncul.
 *
 * Penanda waktu sungguhan (createdAt, approvedAt) tetap ditampilkan menurut
 * zona pembaca, karena di situ "jam berapa menurut saya" memang yang dimaksud.
 */
export function formatDate(value: string | Date): string {
  const isPlainDate = typeof value === "string" && DATE_ONLY.test(value);
  return new Date(isPlainDate ? `${value}T00:00:00Z` : value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(isPlainDate ? { timeZone: "UTC" } : {}),
  });
}

/** Zona waktu operasional perusahaan — harus sama dengan `PROJECT_TIME_ZONE` di API. */
const PROJECT_TIME_ZONE = "Asia/Jakarta";

/**
 * Hari ini menurut kalender proyek.
 *
 * Dua kekeliruan yang sengaja dihindari sekaligus.
 *
 * `new Date().toISOString().slice(0, 10)` memberi tanggal UTC. WIB tujuh jam di
 * depan UTC, jadi antara tengah malam dan pukul tujuh pagi jam UTC masih
 * menunjukkan tanggal kemarin — persis pada jam pekerjaan lapangan dimulai.
 *
 * Memakai zona waktu perangkat juga tidak bisa: halaman admin dirender di
 * server lalu dihidrasi di peramban, dan bila keduanya berada di zona yang
 * berbeda hari, React menemukan dua nilai berbeda untuk isian yang sama.
 *
 * Zona proyek yang tetap menyelesaikan keduanya. Hasilnya sama di server dan di
 * peramban karena keduanya menghitung instan yang sama terhadap zona yang sama,
 * dan tanggalnya adalah tanggal yang benar-benar dimaksud pengawas — tanggal di
 * lokasi proyek, bukan tanggal di tempat servernya kebetulan berjalan.
 */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PROJECT_TIME_ZONE }).format(new Date());
}

/** Tanggal + jam untuk penanda waktu sungguhan (dibuat, disetujui, dikirim). */
export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
