/**
 * URL media disimpan relatif (`/uploads/..`). Path itu dilayani satu origin
 * dengan aplikasi lewat rewrite di `next.config.ts`, jadi biarkan relatif —
 * pengoptimal gambar Next memperlakukannya sebagai gambar lokal dan tidak
 * terkena proteksi SSRF terhadap host loopback.
 *
 * Modul ini sengaja tanpa `"use client"` agar bisa dipakai Server maupun Client Component.
 */
export function mediaSrc(url: string): string {
  return url;
}
