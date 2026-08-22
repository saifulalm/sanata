import { Prisma, type LogbookCategory, type LogbookSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { isoDate, parseDateOnly, startOfUtcDay } from "@/utils/date";
import type { LogbookInput } from "@/validators/projectDoc.validator";

/**
 * Logbook proyek — buku kejadian.
 *
 * Laporan harian menjawab "apa yang dikerjakan hari ini". Logbook menjawab
 * pertanyaan yang berbeda dan justru lebih sering menentukan hasil sengketa:
 * "apa yang terjadi di luar rencana". Klien datang lalu meminta perubahan,
 * baut terpasang di lubang yang salah, ada gangguan dari luar lokasi — semua
 * itu tidak punya tempat di laporan harian, tapi tanpa catatannya klaim
 * keterlambatan tidak bisa dijelaskan enam bulan kemudian.
 *
 * Karena itu tiap catatan menyimpan tindakan yang diambil dan tindak lanjutnya,
 * bukan hanya deskripsi kejadian: catatan yang tidak menyebut apa yang sudah
 * dilakukan tidak membantu siapa pun saat dibaca ulang.
 */

const include = {
  createdBy: { select: { id: true, name: true } },
  rab: { select: { id: true, number: true, title: true } },
} as const;

type LogbookRow = Prisma.LogbookEntryGetPayload<{ include: typeof include }>;

function serialize(row: LogbookRow) {
  return {
    id: row.id,
    rabId: row.rabId,
    rab: row.rab,
    date: isoDate(startOfUtcDay(row.date)),
    timeOfDay: row.timeOfDay,
    category: row.category,
    severity: row.severity,
    title: row.title,
    description: row.description,
    involvedParty: row.involvedParty,
    actionTaken: row.actionTaken,
    followUp: row.followUp,
    isResolved: row.isResolved,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    attachments: (row.attachments as { url: string; name: string }[] | null) ?? [],
    createdByName: row.createdBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type LogbookEntry = ReturnType<typeof serialize>;

function writeData(input: LogbookInput) {
  return {
    date: parseDateOnly(input.date),
    timeOfDay: input.timeOfDay ?? null,
    category: input.category as LogbookCategory,
    severity: (input.severity ?? "INFO") as LogbookSeverity,
    title: input.title,
    description: input.description,
    involvedParty: input.involvedParty ?? null,
    actionTaken: input.actionTaken ?? null,
    followUp: input.followUp ?? null,
    attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
  };
}

export async function listLogbook(
  rabId: string,
  query: { category?: string; severity?: string; unresolved?: string; search?: string } = {}
) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    select: { id: true, number: true, title: true },
  });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const rows = await prisma.logbookEntry.findMany({
    where: {
      rabId,
      ...(query.category ? { category: query.category as LogbookCategory } : {}),
      ...(query.severity ? { severity: query.severity as LogbookSeverity } : {}),
      ...(query.unresolved === "true" ? { isResolved: false } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { involvedParty: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include,
  });

  const entries = rows.map(serialize);

  return {
    rab,
    entries,
    summary: {
      total: entries.length,
      unresolved: entries.filter((e) => !e.isResolved).length,
      // Kejadian berat yang belum selesai adalah yang paling perlu terlihat
      // lebih dulu di panel, bukan sekadar jumlah keseluruhan.
      criticalOpen: entries.filter((e) => !e.isResolved && ["BERAT", "KRITIS"].includes(e.severity)).length,
    },
  };
}

export async function getLogbookEntry(id: string) {
  const row = await prisma.logbookEntry.findUnique({ where: { id }, include });
  if (!row) throw ApiError.notFound("Catatan logbook tidak ditemukan");
  return serialize(row);
}

export async function createLogbookEntry(rabId: string, input: LogbookInput, userId: string) {
  const rab = await prisma.rab.findUnique({ where: { id: rabId }, select: { id: true } });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const resolved = input.isResolved ?? false;
  const row = await prisma.logbookEntry.create({
    data: {
      rabId,
      createdById: userId,
      ...writeData(input),
      isResolved: resolved,
      resolvedAt: resolved ? new Date() : null,
    },
    include,
  });
  return serialize(row);
}

export async function updateLogbookEntry(id: string, input: LogbookInput) {
  const existing = await prisma.logbookEntry.findUnique({
    where: { id },
    select: { id: true, isResolved: true, resolvedAt: true },
  });
  if (!existing) throw ApiError.notFound("Catatan logbook tidak ditemukan");

  const resolved = input.isResolved ?? existing.isResolved;
  const row = await prisma.logbookEntry.update({
    where: { id },
    data: {
      ...writeData(input),
      isResolved: resolved,
      // Waktu penyelesaian dicatat sekali: menyunting catatan yang sudah
      // selesai tidak boleh memundurkan kapan kejadian itu ditutup.
      resolvedAt: resolved ? (existing.resolvedAt ?? new Date()) : null,
    },
    include,
  });
  return serialize(row);
}

export async function deleteLogbookEntry(id: string) {
  const existing = await prisma.logbookEntry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Catatan logbook tidak ditemukan");
  await prisma.logbookEntry.delete({ where: { id } });
}

const CATEGORY_LABEL: Record<LogbookCategory, string> = {
  KUNJUNGAN_CLIENT: "Kunjungan klien",
  KUNJUNGAN_KONSULTAN: "Kunjungan konsultan",
  INSTRUKSI_LAPANGAN: "Instruksi lapangan",
  KEAMANAN: "Keamanan",
  KESALAHAN_KERJA: "Kesalahan kerja",
  KECELAKAAN_KERJA: "Kecelakaan kerja",
  KERUSAKAN_ALAT: "Kerusakan alat",
  GANGGUAN_CUACA: "Gangguan cuaca",
  GANGGUAN_WARGA: "Gangguan warga",
  LAINNYA: "Lainnya",
};

/** Logbook sebagai CSV — kolomnya mengikuti buku kejadian yang lazim dipakai. */
export function logbookToCsv(entries: LogbookEntry[]): string {
  const rows: string[][] = [
    ["Tanggal", "Jam", "Kategori", "Tingkat", "Judul", "Uraian", "Pihak terlibat", "Tindakan", "Tindak lanjut", "Status"],
  ];

  for (const e of entries) {
    rows.push([
      e.date,
      e.timeOfDay ?? "",
      CATEGORY_LABEL[e.category],
      e.severity,
      e.title,
      e.description,
      e.involvedParty ?? "",
      e.actionTaken ?? "",
      e.followUp ?? "",
      e.isResolved ? "Selesai" : "Belum selesai",
    ]);
  }

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
