import { z } from "zod";

/**
 * Tanggal polos `YYYY-MM-DD` — jadwal konstruksi tidak menyimpan jam.
 *
 * Tanggal mustahil seperti 2026-02-29 tidak membuat `Date.parse` gagal;
 * JavaScript menggulungnya ke 1 Maret. Opname yang tercatat sehari meleset dari
 * yang diketik pengawas sulit ditemukan kemudian, jadi hasil penguraiannya
 * dibandingkan kembali dengan teks aslinya.
 */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, "Tanggal tidak valid");

const photoSchema = z.object({
  url: z.string().min(1).max(500),
  caption: z.string().max(200).optional().nullable(),
});

export const scheduleUpdateSchema = z.object({
  /** null mengosongkan jadwal seluruh RAB. */
  scheduleStart: dateOnly.nullable(),
  /** 0 = Minggu … 6 = Sabtu. Array kosong berarti tujuh hari kerja penuh. */
  restDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  holidays: z
    .array(z.object({ date: dateOnly, name: z.string().min(1).max(120) }))
    .max(200)
    .optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        startOffsetDays: z.number().int().min(0).max(3650),
        // 0 berarti belum dijadwalkan; batas atas 10 tahun menahan salah ketik.
        durationDays: z.number().int().min(0).max(3650),
      })
    )
    .max(2000),
});

export const progressSchema = z.object({
  date: dateOnly,
  /** Kumulatif, bukan tambahan. */
  percent: z.number().min(0).max(100),
  note: z.string().max(500).optional().nullable(),
  photos: z.array(photoSchema).max(12).optional(),
});

export const progressReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional().nullable(),
});

export const baselineSchema = z.object({
  name: z.string().min(1).max(120),
});

// --- Laporan harian ---------------------------------------------------------

const weather = z.enum(["CERAH", "BERAWAN", "GERIMIS", "HUJAN", "HUJAN_LEBAT"]);

export const dailyReportSchema = z.object({
  date: dateOnly,
  weatherMorning: weather.optional().nullable(),
  weatherAfternoon: weather.optional().nullable(),
  /** { "Tukang batu": 4, "Pekerja": 10 } — susunan tim berbeda tiap proyek. */
  workforce: z.record(z.string().max(60), z.number().int().min(0).max(10000)).optional().nullable(),
  equipment: z.string().max(2000).optional().nullable(),
  materials: z.string().max(2000).optional().nullable(),
  activities: z.string().min(1).max(5000),
  obstacles: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  photos: z
    .array(
      z.object({
        url: z.string().min(1).max(500),
        caption: z.string().max(200).optional().nullable(),
        location: z.string().max(120).optional().nullable(),
      })
    )
    .max(30)
    .optional(),
});

// --- Termin / progress billing ----------------------------------------------

export const billingSchema = z.object({
  periodEnd: dateOnly,
  retentionPct: z.number().min(0).max(100).optional(),
  taxPct: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const billingStatusSchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]),
});

export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
export type ProgressReviewInput = z.infer<typeof progressReviewSchema>;
export type BaselineInput = z.infer<typeof baselineSchema>;
export type DailyReportInput = z.infer<typeof dailyReportSchema>;
export type BillingInput = z.infer<typeof billingSchema>;
