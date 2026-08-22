import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { projectYear, romanMonth, todayInProjectZone } from "@/utils/date";

/**
 * Penomoran dokumen proyek.
 *
 * Nomor surat adalah identitas hukum sebuah dokumen: dua invoice bernomor sama
 * berarti pembukuan proyek tidak bisa dipertanggungjawabkan. Karena itu nomor
 * tidak pernah dihitung dari isi tabel dokumennya.
 *
 * Cara yang lazim — cari nomor terbesar, tambah satu — punya dua kelemahan yang
 * keduanya nyata di panel yang dipakai beberapa orang sekaligus:
 *
 *   1. Dua penyimpanan yang berlangsung bersamaan membaca nomor terbesar yang
 *      sama, lalu keduanya mencoba menulis nomor yang sama. Yang kalah menerima
 *      galat pelanggaran keunikan tepat setelah pemakai menekan simpan.
 *   2. Nomor terbesar dicari dengan urutan teks. `SPK/010/...` lebih besar dari
 *      `SPK/009/...` selama digitnya sama banyak, tapi begitu berpindah ke
 *      empat digit urutannya kacau.
 *
 * Gantinya satu baris pencatat per (rangkaian, tahun) yang dinaikkan lewat satu
 * pernyataan `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`. PostgreSQL
 * mengunci baris itu selama pernyataan berjalan, jadi dua permintaan yang
 * datang bersamaan pasti menerima dua angka berbeda tanpa perlu mengulang.
 */

/** Kode singkat perusahaan pada nomor surat. */
const ORG_CODE = process.env.DOCUMENT_ORG_CODE?.trim() || "SNT";

/**
 * Rangkaian nomor. Kuncinya juga dipakai sebagai kolom `series` pada pencatat,
 * jadi menambah jenis dokumen baru cukup menambah satu baris di sini.
 */
export const DOCUMENT_SERIES = {
  SPK: { code: "SPK", withOrg: true },
  INVOICE: { code: "INV", withOrg: true },
  KWITANSI: { code: "KW", withOrg: true },
  BAPP: { code: "BAPP", withOrg: true },
  BAST: { code: "BAST", withOrg: true },
  /// Pengajuan dinomori terpisah per jenis supaya "ajuan material ke berapa
  /// bulan ini" bisa dijawab dari nomornya sendiri.
  AJU_ALAT: { code: "AJU-ALT", withOrg: false },
  AJU_MATERIAL: { code: "AJU-MTR", withOrg: false },
  AJU_WAKTU: { code: "AJU-WKT", withOrg: false },
  AJU_RENCANA: { code: "AJU-RCN", withOrg: false },
  MEMO_IN: { code: "SM-IN", withOrg: false },
  MEMO_OUT: { code: "SM-OUT", withOrg: false },
  /// Rangkaian lama yang sebelumnya dinomori sendiri-sendiri.
  SPH: { code: "SPH", withOrg: false },
  BAP: { code: "BAP", withOrg: false },
} as const;

export type DocumentSeries = keyof typeof DOCUMENT_SERIES;

/**
 * Ambil satu nomor baru untuk rangkaian `series`.
 *
 * `tx` wajib diisi bila dokumennya dibuat di dalam transaksi: nomor yang sudah
 * dialokasikan tidak boleh bertahan bila pembuatan dokumennya batal.
 *
 * Bentuk nomor mengikuti kelaziman surat Indonesia — nomor urut, kode
 * perusahaan, bulan Romawi, lalu tahun:
 *
 *   SPK/001/SNT/VIII/2026
 *   AJU-MTR/014/VIII/2026
 */
export async function allocateDocumentNumber(
  series: DocumentSeries,
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const definition = DOCUMENT_SERIES[series];
  const today = todayInProjectZone();
  const year = projectYear();

  const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
    INSERT INTO "DocumentCounter" ("id", "series", "year", "lastSeq", "updatedAt")
    VALUES (${randomUUID()}, ${series}, ${year}, 1, NOW())
    ON CONFLICT ("series", "year")
    DO UPDATE SET "lastSeq" = "DocumentCounter"."lastSeq" + 1, "updatedAt" = NOW()
    RETURNING "lastSeq"
  `;

  const seq = rows[0]?.lastSeq;
  if (!seq) throw ApiError.internal("Gagal mengalokasikan nomor dokumen");

  const parts = [definition.code, String(seq).padStart(3, "0")];
  if (definition.withOrg) parts.push(ORG_CODE);
  parts.push(romanMonth(today), String(year));

  return parts.join("/");
}

/**
 * Nomor pilihan pemakai, bila diisi; kalau tidak, nomor otomatis.
 *
 * Nomor manual tetap diperiksa keunikannya di sini supaya pesan galatnya
 * menyebut nomornya, bukan sekadar melempar pelanggaran indeks dari basis data.
 * Pemeriksaan ini bukan pengganti indeks unik — indeksnyalah yang menjadi
 * penjamin terakhir bila dua orang mengetik nomor manual yang sama pada saat
 * yang sama.
 */
export async function resolveDocumentNumber(
  series: DocumentSeries,
  manual: string | null | undefined,
  isTaken: (number: string, tx: Prisma.TransactionClient) => Promise<boolean>,
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const trimmed = manual?.trim();
  if (!trimmed) return allocateDocumentNumber(series, tx);

  if (await isTaken(trimmed, tx)) {
    throw ApiError.conflict(`Nomor "${trimmed}" sudah dipakai dokumen lain`);
  }
  return trimmed;
}
