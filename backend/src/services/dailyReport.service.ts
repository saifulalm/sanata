import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { isoDate, parseDateOnly, startOfUtcDay } from "@/utils/date";
import type { DailyReportInput } from "@/validators/schedule.validator";

/**
 * Laporan harian lapangan.
 *
 * Ini catatan hukum sekaligus catatan teknis: saat terjadi sengketa keterlambatan,
 * yang dipakai adalah cuaca, jumlah tenaga kerja, dan kendala yang tercatat harian —
 * bukan ingatan orang. Karena itu satu laporan dikunci per proyek per tanggal, dan
 * foto disimpan berikut lokasi pekerjaannya supaya bisa ditelusuri kembali.
 */

const startOfDay = startOfUtcDay;

function serialize(report: Prisma.DailyReportGetPayload<{
  include: { photos: true; createdBy: { select: { name: true } } };
}>) {
  return {
    id: report.id,
    rabId: report.rabId,
    date: isoDate(startOfDay(report.date)),
    weatherMorning: report.weatherMorning,
    weatherAfternoon: report.weatherAfternoon,
    workforce: (report.workforce as Record<string, number> | null) ?? null,
    workforceTotal: report.workforce
      ? Object.values(report.workforce as Record<string, number>).reduce((a, b) => a + Number(b || 0), 0)
      : 0,
    equipment: report.equipment,
    materials: report.materials,
    activities: report.activities,
    obstacles: report.obstacles,
    notes: report.notes,
    createdByName: report.createdBy?.name ?? null,
    createdAt: report.createdAt.toISOString(),
    photos: [...report.photos]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ id: p.id, url: p.url, caption: p.caption, location: p.location })),
  };
}

const include = { photos: true, createdBy: { select: { name: true } } } as const;

export async function listDailyReports(rabId: string) {
  const rab = await prisma.rab.findUnique({ where: { id: rabId }, select: { id: true, number: true, title: true } });
  if (!rab) throw ApiError.notFound("RAB not found");

  const reports = await prisma.dailyReport.findMany({
    where: { rabId },
    orderBy: { date: "desc" },
    include,
  });

  return { rab, reports: reports.map(serialize) };
}

export async function getDailyReport(id: string) {
  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: { ...include, rab: { select: { id: true, number: true, title: true, location: true, clientName: true } } },
  });
  if (!report) throw ApiError.notFound("Laporan harian tidak ditemukan");

  return { ...serialize(report), rab: report.rab };
}

function writeData(input: DailyReportInput) {
  return {
    date: parseDateOnly(input.date),
    weatherMorning: input.weatherMorning ?? null,
    weatherAfternoon: input.weatherAfternoon ?? null,
    // Objek kosong disimpan sebagai SQL NULL, bukan JSON `null` — di JSONB
    // keduanya nilai berbeda.
    workforce:
      input.workforce && Object.keys(input.workforce).length > 0
        ? (input.workforce as Prisma.InputJsonValue)
        : Prisma.DbNull,
    equipment: input.equipment ?? null,
    materials: input.materials ?? null,
    activities: input.activities,
    obstacles: input.obstacles ?? null,
    notes: input.notes ?? null,
  };
}

function photoData(input: DailyReportInput) {
  return (input.photos ?? []).map((p, index) => ({
    url: p.url,
    caption: p.caption ?? null,
    location: p.location ?? null,
    order: index,
  }));
}

export async function createDailyReport(rabId: string, input: DailyReportInput, userId: string) {
  const rab = await prisma.rab.findUnique({ where: { id: rabId }, select: { id: true } });
  if (!rab) throw ApiError.notFound("RAB not found");

  const existing = await prisma.dailyReport.findFirst({ where: { rabId, date: parseDateOnly(input.date) } });
  if (existing) {
    throw ApiError.badRequest(`Laporan tanggal ${input.date} sudah ada — buka dan sunting laporan tersebut`);
  }

  const photos = photoData(input);
  const report = await prisma.dailyReport.create({
    data: {
      rabId,
      createdById: userId,
      ...writeData(input),
      photos: photos.length > 0 ? { create: photos } : undefined,
    },
    include,
  });

  return serialize(report);
}

export async function updateDailyReport(id: string, input: DailyReportInput) {
  const existing = await prisma.dailyReport.findUnique({ where: { id }, select: { id: true, rabId: true } });
  if (!existing) throw ApiError.notFound("Laporan harian tidak ditemukan");

  // Pindah tanggal tidak boleh menabrak laporan lain di hari yang sama.
  const clash = await prisma.dailyReport.findFirst({
    where: { rabId: existing.rabId, date: parseDateOnly(input.date), NOT: { id } },
    select: { id: true },
  });
  if (clash) throw ApiError.badRequest(`Laporan tanggal ${input.date} sudah ada`);

  // Foto dikirim utuh setiap simpan, jadi daftar lama dibuang lalu ditulis
  // ulang — jauh lebih sederhana daripada mencocokkan selisihnya.
  const photos = photoData(input);
  const report = await prisma.$transaction(async (tx) => {
    await tx.dailyReportPhoto.deleteMany({ where: { reportId: id } });
    if (photos.length > 0) {
      await tx.dailyReportPhoto.createMany({ data: photos.map((p) => ({ ...p, reportId: id })) });
    }
    return tx.dailyReport.update({ where: { id }, data: writeData(input), include });
  });

  return serialize(report);
}

export async function deleteDailyReport(id: string) {
  const existing = await prisma.dailyReport.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Laporan harian tidak ditemukan");
  await prisma.dailyReport.delete({ where: { id } });
}

/**
 * Ringkasan laporan harian lintas proyek — daftar RAB dengan statistik harian.
 * Dipakai oleh halaman admin/laporan-harian.
 */
export async function getDailyReportSummary() {
  const rabs = await prisma.rab.findMany({
    select: {
      id: true,
      number: true,
      title: true,
      location: true,
      status: true,
      dailyReports: {
        select: {
          id: true,
          date: true,
          weatherMorning: true,
          weatherAfternoon: true,
        },
        orderBy: { date: "desc" },
        take: 1,
      },
      _count: { select: { dailyReports: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rabs.map((rab) => ({
    id: rab.id,
    number: rab.number,
    title: rab.title,
    location: rab.location,
    status: rab.status,
    reportCount: rab._count.dailyReports,
    latestReport: rab.dailyReports[0]
      ? {
          id: rab.dailyReports[0].id,
          date: isoDate(startOfDay(rab.dailyReports[0].date)),
          weatherMorning: rab.dailyReports[0].weatherMorning,
          weatherAfternoon: rab.dailyReports[0].weatherAfternoon,
        }
      : null,
  }));
}
