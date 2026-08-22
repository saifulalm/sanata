import { z } from "zod";

/**
 * Validasi untuk empat keluarga dokumen proyek: pengajuan, logbook, site memo,
 * dan surat-menyurat.
 *
 * Semua tanggal dokumen dibatasi ke bentuk `YYYY-MM-DD` yang sama seperti
 * jadwal dan opname. Menerima penanda waktu penuh akan menggoda pemakai
 * mengirim jam lokal, dan sejak itu "tanggal surat" berhenti menjadi tanggal
 * kalender yang bisa dibandingkan lurus antar dokumen.
 */

/**
 * Tanggal kalender yang benar-benar ada.
 *
 * `Date.parse("2026-02-29T00:00:00Z")` tidak gagal — JavaScript menggulungnya
 * menjadi 1 Maret. Pada dokumen yang mengikat seperti invoice dan berita acara,
 * tanggal yang diam-diam bergeser sehari jauh lebih berbahaya daripada
 * permintaan yang ditolak, jadi hasil penguraiannya dibandingkan kembali dengan
 * teks aslinya.
 */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, "Tanggal tidak valid");

/** Jam dinding lokasi proyek, "HH:MM". */
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:MM");

const attachment = z.object({
  url: z.string().min(1).max(500),
  name: z.string().min(1).max(200),
});

const attachments = z.array(attachment).max(20).optional().nullable();

// --- Pengajuan ---------------------------------------------------------------

export const SUBMISSION_TYPES = ["ALAT", "MATERIAL", "WAKTU", "RENCANA_WAKTU"] as const;

const submissionItem = z.object({
  name: z.string().min(1).max(200),
  spec: z.string().max(300).optional().nullable(),
  unit: z.string().min(1).max(30),
  quantity: z.number().min(0).max(1_000_000_000),
  unitPrice: z.number().min(0).max(1_000_000_000_000).optional(),
  note: z.string().max(300).optional().nullable(),
});

/**
 * Bentuk dasar pengajuan, dipisahkan dari aturan silang-fieldnya.
 *
 * `.refine()` membungkus skema menjadi `ZodEffects`, dan `ZodEffects` tidak
 * punya `.partial()`. Menyimpan bentuk objeknya di sini membuat skema
 * pembaruan bisa diturunkan tanpa menyalin ulang seluruh daftar field.
 */
const submissionShape = z.object({
  rabId: z.string().min(1),
  type: z.enum(SUBMISSION_TYPES),
  number: z.string().max(60).optional().nullable(),
  title: z.string().min(1).max(200),
  reason: z.string().max(4000).optional().nullable(),
  neededDate: dateOnly.optional().nullable(),
  requestedDays: z.number().int().min(1).max(3650).optional().nullable(),
  newTargetDate: dateOnly.optional().nullable(),
  items: z.array(submissionItem).max(100).optional(),
  attachments,
});

export const submissionSchema = submissionShape
  .refine((v) => v.type !== "WAKTU" || v.requestedDays != null, {
    // Ajuan waktu tanpa angka hari tidak bisa dinilai atasan maupun dipakai
    // menggeser jadwal setelah disetujui.
    message: "Ajuan waktu harus menyebutkan jumlah hari tambahan yang diminta",
    path: ["requestedDays"],
  })
  .refine((v) => !["ALAT", "MATERIAL"].includes(v.type) || (v.items?.length ?? 0) > 0, {
    message: "Ajuan alat/material harus memuat minimal satu rincian",
    path: ["items"],
  });

/** Perubahan pada pengajuan yang belum diperiksa — jenis dan RAB tidak boleh pindah. */
export const submissionUpdateSchema = submissionShape.partial().omit({ rabId: true, type: true });

export const submissionReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(2000).optional().nullable(),
});

export const submissionClientDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decidedBy: z.string().min(1).max(120),
  note: z.string().max(2000).optional().nullable(),
});

// --- Logbook -----------------------------------------------------------------

export const LOGBOOK_CATEGORIES = [
  "KUNJUNGAN_CLIENT",
  "KUNJUNGAN_KONSULTAN",
  "INSTRUKSI_LAPANGAN",
  "KEAMANAN",
  "KESALAHAN_KERJA",
  "KECELAKAAN_KERJA",
  "KERUSAKAN_ALAT",
  "GANGGUAN_CUACA",
  "GANGGUAN_WARGA",
  "LAINNYA",
] as const;

export const LOGBOOK_SEVERITIES = ["INFO", "RINGAN", "SEDANG", "BERAT", "KRITIS"] as const;

export const logbookSchema = z.object({
  date: dateOnly,
  timeOfDay: timeOfDay.optional().nullable(),
  category: z.enum(LOGBOOK_CATEGORIES),
  severity: z.enum(LOGBOOK_SEVERITIES).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  involvedParty: z.string().max(200).optional().nullable(),
  actionTaken: z.string().max(3000).optional().nullable(),
  followUp: z.string().max(3000).optional().nullable(),
  isResolved: z.boolean().optional(),
  attachments,
});

// --- Site memo ---------------------------------------------------------------

export const MEMO_CATEGORIES = [
  "KOMPLAIN",
  "INSTRUKSI",
  "TEGURAN",
  "PERMINTAAN_INFO",
  "KLARIFIKASI",
  "APPROVAL",
  "ADDENDUM",
  "LAINNYA",
] as const;

export const MEMO_STATUSES = ["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"] as const;

export const memoSchema = z.object({
  rabId: z.string().min(1),
  direction: z.enum(["INCOMING", "OUTGOING"]),
  category: z.enum(MEMO_CATEGORIES).optional(),
  number: z.string().max(60).optional().nullable(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  fromParty: z.string().min(1).max(150),
  toParty: z.string().min(1).max(150),
  letterDate: dateOnly,
  handledAt: dateOnly.optional().nullable(),
  dueDate: dateOnly.optional().nullable(),
  /// Diisi pada surat keluar yang menjawab sebuah surat masuk.
  parentId: z.string().min(1).optional().nullable(),
  attachments,
});

export const memoUpdateSchema = memoSchema.partial().omit({ rabId: true });

export const memoStatusSchema = z.object({
  status: z.enum(MEMO_STATUSES),
});

// --- Surat-menyurat ----------------------------------------------------------

export const LETTER_TYPES = ["SPK", "INVOICE", "KWITANSI", "BAPP", "BAST"] as const;
export const LETTER_STATUSES = ["DRAFT", "ISSUED", "SIGNED", "PAID", "CANCELLED"] as const;

/**
 * Isi khas tiap jenis surat.
 *
 * Dibiarkan longgar dengan sengaja: pasal SPK, rincian invoice, dan daftar
 * pekerjaan BAPP tidak punya bentuk yang sama, dan memaksakan satu bentuk kaku
 * akan membuat setiap penambahan jenis surat menuntut migrasi basis data.
 * Yang ketat justru angka uangnya, karena itulah yang dihitung dan dibekukan.
 */
const letterBody = z
  .object({
    /// Pasal/klausul untuk SPK, poin pekerjaan untuk berita acara.
    clauses: z.array(z.object({ title: z.string().max(200), text: z.string().max(4000) })).max(50).optional(),
    /// Baris rincian untuk invoice dan kwitansi.
    lines: z
      .array(
        z.object({
          description: z.string().max(300),
          unit: z.string().max(30).optional().nullable(),
          quantity: z.number().optional().nullable(),
          unitPrice: z.number().optional().nullable(),
          amount: z.number(),
        })
      )
      .max(200)
      .optional(),
    /// Paragraf pembuka dan penutup surat.
    opening: z.string().max(3000).optional().nullable(),
    closing: z.string().max(3000).optional().nullable(),
    /// Kolom bebas tambahan: lingkup pekerjaan, jangka waktu, cara pembayaran.
    fields: z.record(z.string().max(60), z.string().max(2000)).optional(),
  })
  .optional();

const letterShape = z.object({
  rabId: z.string().min(1),
  type: z.enum(LETTER_TYPES),
  number: z.string().max(60).optional().nullable(),
  subject: z.string().min(1).max(200),
  letterDate: dateOnly,
  dueDate: dateOnly.optional().nullable(),

  recipientName: z.string().min(1).max(150),
  recipientCompany: z.string().max(150).optional().nullable(),
  recipientAddress: z.string().max(500).optional().nullable(),
  attentionTo: z.string().max(150).optional().nullable(),

  signerName: z.string().min(1).max(120),
  signerTitle: z.string().min(1).max(120),
  signatoryId: z.string().optional().nullable(),
  counterSignerName: z.string().max(120).optional().nullable(),
  counterSignerTitle: z.string().max(120).optional().nullable(),

  amount: z.number().min(0).max(1_000_000_000_000_000).optional(),
  retentionAmount: z.number().min(0).max(1_000_000_000_000_000).optional(),
  taxPct: z.number().min(0).max(100).optional(),

  billingId: z.string().min(1).optional().nullable(),
  quotationId: z.string().min(1).optional().nullable(),
  parentLetterId: z.string().min(1).optional().nullable(),

  body: letterBody,
  notes: z.string().max(4000).optional().nullable(),
  attachments,
});

export const letterSchema = letterShape.refine(
  (v) => !["INVOICE", "KWITANSI"].includes(v.type) || (v.amount ?? 0) > 0 || v.billingId != null,
  {
    // Invoice tanpa nilai dan tanpa termin sumber tidak menagih apa pun.
    message: "Invoice/kwitansi harus punya nilai atau dibuat dari termin",
    path: ["amount"],
  }
);

export const letterUpdateSchema = letterShape.partial().omit({ rabId: true, type: true });

export const letterStatusSchema = z.object({
  status: z.enum(LETTER_STATUSES),
});

/** Isi awal surat yang ditawarkan formulir admin sebelum disunting. */
export const letterDefaultsSchema = z.object({
  rabId: z.string().min(1),
  type: z.enum(LETTER_TYPES),
  billingId: z.string().min(1).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type SubmissionUpdateInput = z.infer<typeof submissionUpdateSchema>;
export type SubmissionReviewInput = z.infer<typeof submissionReviewSchema>;
export type SubmissionClientDecisionInput = z.infer<typeof submissionClientDecisionSchema>;
export type LogbookInput = z.infer<typeof logbookSchema>;
export type MemoInput = z.infer<typeof memoSchema>;
export type MemoUpdateInput = z.infer<typeof memoUpdateSchema>;
export type LetterInput = z.infer<typeof letterSchema>;
export type LetterUpdateInput = z.infer<typeof letterUpdateSchema>;
export type LetterBody = NonNullable<z.infer<typeof letterBody>>;
