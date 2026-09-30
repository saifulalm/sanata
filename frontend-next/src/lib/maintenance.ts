/**
 * Konfigurasi Maintenance Mode untuk Sanata Website.
 *
 * Aktifkan flag ini untuk menampilkan halaman Under Construction
 * sebagai route utama, tanpa perlu modifikasi route atau layout.
 *
 * Cara mengaktifkan:
 *   NEXT_PUBLIC_MAINTENANCE_MODE=true  (dalam frontend-next/.env.local)
 *
 * Saat aktif:
 *   - Route utama (/ ) menampilkan halaman Under Construction
 *   - EnhancedHeader + EnhancedFooter TIDAK dirender
 *   - Semua page public lain tetap accessible (/about, /services, dll.)
 *
 * Untuk menonaktifkan setelah website selesai:
 *   - Hapus atau set NEXT_PUBLIC_MAINTENANCE_MODE=false
 *   - Jalankan ulang `npm run dev`
 */
export const isMaintenanceMode =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
