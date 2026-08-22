import { Prisma, type Weather } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, toDecimal } from "@/utils/money";
import {
  addDays,
  daysBetween,
  endOfUtcMonth,
  isoDate,
  monthLabel,
  startOfIsoWeek,
  startOfUtcDay,
  startOfUtcMonth,
} from "@/utils/date";
import { getRabSchedule } from "@/services/schedule.service";

/**
 * Laporan mingguan dan bulanan.
 *
 * Keduanya tidak punya tabel sendiri, dan itu keputusan yang disengaja. Isinya
 * seluruhnya turunan dari tiga sumber yang sudah ada — laporan harian, opname
 * yang disetujui, dan kurva rencana. Menyimpannya sebagai baris tersendiri
 * berarti menciptakan salinan yang langsung basi begitu satu laporan harian
 * diperbaiki, dan pertanyaan "kenapa laporan mingguan tidak cocok dengan
 * hariannya" adalah pertanyaan yang tidak perlu ada.
 *
 * Yang tetap dijaga: periode mingguan berjalan Senin–Minggu, sama seperti
 * kebiasaan rapat proyek, sementara kurva S memakai potongan tujuh hari dari
 * tanggal mulai. Keduanya sengaja tidak dipaksa sama — kurva harus dibaca
 * relatif terhadap awal proyek, laporan harus dibaca relatif terhadap kalender.
 * Karena itu progres periode diambil dari opname langsung, bukan dari ember
 * kurva yang batasnya berbeda.
 */

const WEATHER_LABEL: Record<Weather, string> = {
  CERAH: "Cerah",
  BERAWAN: "Berawan",
  GERIMIS: "Gerimis",
  HUJAN: "Hujan",
  HUJAN_LEBAT: "Hujan lebat",
};

export interface PeriodSummary {
  key: string;
  label: string;
  startDate: string;
  endDate: string;

  /** Laporan harian yang benar-benar terisi dalam periode ini. */
  reportedDays: number;
  /** Hari kalender dalam periode — pembanding untuk melihat laporan yang bolong. */
  calendarDays: number;
  missingDates: string[];

  /** Jumlah hari per jenis cuaca, mis. { "Hujan": 2 }. */
  weatherTally: Record<string, number>;
  /** Rata-rata tenaga kerja per hari yang dilaporkan, dibulatkan. */
  averageWorkforce: number;
  peakWorkforce: number;
  /** Total foto dokumentasi periode ini. */
  photoCount: number;

  activities: { date: string; text: string }[];
  obstacles: { date: string; text: string }[];

  /** Bobot terpasang di akhir periode dan pertambahannya selama periode. */
  cumulativePct: string;
  previousPct: string;
  progressPct: string;
  cumulativeValue: string;
  /** Rencana pada akhir periode menurut kurva S, dan selisihnya. */
  plannedPct: string;
  deviationPct: string;

  /** Kejadian logbook yang tercatat dalam periode ini. */
  logbookCount: number;
  criticalLogbook: { date: string; title: string; severity: string }[];
}

type ProgressPoint = { date: Date; percent: Prisma.Decimal; weight: Prisma.Decimal };

/**
 * Bobot terpasang kumulatif pada tanggal tertentu.
 *
 * Memakai opname terakhir yang tidak melewati tanggal itu — angka opname
 * bersifat kumulatif, jadi yang terakhir sudah mewakili seluruh riwayatnya.
 */
function cumulativeAt(byItem: Map<string, ProgressPoint[]>, at: Date): Prisma.Decimal {
  let total = new Prisma.Decimal(0);

  for (const points of byItem.values()) {
    let latest: ProgressPoint | null = null;
    for (const point of points) {
      if (point.date.getTime() <= at.getTime()) latest = point;
      else break;
    }
    if (latest) total = total.plus(latest.weight.mul(latest.percent).div(100));
  }

  return total;
}

async function loadSources(rabId: string) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    select: {
      id: true,
      number: true,
      title: true,
      clientName: true,
      location: true,
      subtotal: true,
      scheduleStart: true,
    },
  });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const [reports, schedule, logbook] = await Promise.all([
    prisma.dailyReport.findMany({
      where: { rabId },
      orderBy: { date: "asc" },
      include: { photos: { select: { id: true } } },
    }),
    getRabSchedule(rabId),
    prisma.logbookEntry.findMany({
      where: { rabId },
      orderBy: { date: "asc" },
      select: { date: true, title: true, severity: true, category: true },
    }),
  ]);

  // Opname disetujui, dikelompokkan per item beserta bobotnya. Bobot diambil
  // dari kurva supaya penyebutnya sama persis dengan yang dipakai kurva S.
  const weightByItem = new Map(schedule.items.map((i) => [i.id, toDecimal(i.weightPct)]));
  const progressRows = await prisma.rabProgress.findMany({
    where: { item: { section: { rabId } }, status: "APPROVED" },
    orderBy: { date: "asc" },
    select: { itemId: true, date: true, percent: true },
  });

  const byItem = new Map<string, ProgressPoint[]>();
  for (const row of progressRows) {
    const weight = weightByItem.get(row.itemId);
    if (!weight) continue;
    const list = byItem.get(row.itemId) ?? [];
    list.push({ date: startOfUtcDay(row.date), percent: toDecimal(row.percent), weight });
    byItem.set(row.itemId, list);
  }

  return { rab, reports, schedule, logbook, byItem };
}

type Sources = Awaited<ReturnType<typeof loadSources>>;

function buildPeriod(
  sources: Sources,
  key: string,
  label: string,
  start: Date,
  end: Date
): PeriodSummary {
  const { reports, schedule, logbook, byItem, rab } = sources;

  const inPeriod = reports.filter((r) => {
    const day = startOfUtcDay(r.date);
    return day >= start && day <= end;
  });

  const weatherTally: Record<string, number> = {};
  let workforceSum = 0;
  let peakWorkforce = 0;
  let photoCount = 0;
  const activities: { date: string; text: string }[] = [];
  const obstacles: { date: string; text: string }[] = [];
  const reportedDates = new Set<string>();

  for (const report of inPeriod) {
    const date = isoDate(startOfUtcDay(report.date));
    reportedDates.add(date);

    for (const weather of [report.weatherMorning, report.weatherAfternoon]) {
      if (!weather) continue;
      const label = WEATHER_LABEL[weather];
      weatherTally[label] = (weatherTally[label] ?? 0) + 1;
    }

    const crew = report.workforce
      ? Object.values(report.workforce as Record<string, number>).reduce((a, b) => a + Number(b || 0), 0)
      : 0;
    workforceSum += crew;
    peakWorkforce = Math.max(peakWorkforce, crew);
    photoCount += report.photos.length;

    activities.push({ date, text: report.activities });
    if (report.obstacles?.trim()) obstacles.push({ date, text: report.obstacles });
  }

  // Hari kalender yang tidak punya laporan harian sama sekali. Ini yang paling
  // sering ditanyakan pengawas saat menandatangani laporan mingguan.
  const calendarDays = daysBetween(start, end) + 1;
  const missingDates: string[] = [];
  for (let offset = 0; offset < calendarDays; offset += 1) {
    const date = isoDate(addDays(start, offset));
    if (!reportedDates.has(date)) missingDates.push(date);
  }

  const cumulative = cumulativeAt(byItem, end);
  const previous = cumulativeAt(byItem, addDays(start, -1));
  const subtotal = toDecimal(rab.subtotal);

  // Rencana pada akhir periode diambil dari ember kurva terakhir yang selesai
  // pada atau sebelum tanggal ini — kurva sudah menghitung hari kerja dan hari
  // libur proyek, jadi tidak dihitung ulang di sini.
  const bucket = [...schedule.buckets].reverse().find((b) => b.endDate <= isoDate(end));
  const plannedPct = toDecimal(bucket?.plannedPct ?? 0);

  const periodLogbook = logbook.filter((l) => {
    const day = startOfUtcDay(l.date);
    return day >= start && day <= end;
  });

  return {
    key,
    label,
    startDate: isoDate(start),
    endDate: isoDate(end),

    reportedDays: inPeriod.length,
    calendarDays,
    missingDates,

    weatherTally,
    averageWorkforce: inPeriod.length > 0 ? Math.round(workforceSum / inPeriod.length) : 0,
    peakWorkforce,
    photoCount,

    activities,
    obstacles,

    cumulativePct: cumulative.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString(),
    previousPct: previous.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString(),
    progressPct: cumulative.minus(previous).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString(),
    cumulativeValue: money(subtotal.mul(cumulative).div(100)).toString(),
    plannedPct: plannedPct.toString(),
    deviationPct: cumulative
      .minus(plannedPct)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      .toString(),

    logbookCount: periodLogbook.length,
    criticalLogbook: periodLogbook
      .filter((l) => ["BERAT", "KRITIS"].includes(l.severity))
      .map((l) => ({ date: isoDate(startOfUtcDay(l.date)), title: l.title, severity: l.severity })),
  };
}

/**
 * Rentang periode yang dicakup laporan.
 *
 * Diambil dari data yang benar-benar ada: dari laporan harian paling awal (atau
 * tanggal mulai jadwal, mana yang lebih dulu) sampai yang paling akhir. Proyek
 * yang belum punya catatan apa pun mengembalikan daftar kosong, bukan deretan
 * periode nol yang menyesatkan.
 */
function periodBounds(sources: Sources): { from: Date; to: Date } | null {
  const dates: Date[] = sources.reports.map((r) => startOfUtcDay(r.date));
  if (sources.rab.scheduleStart) dates.push(startOfUtcDay(sources.rab.scheduleStart));
  if (sources.schedule.rab.scheduleEnd) dates.push(startOfUtcDay(new Date(sources.schedule.rab.scheduleEnd)));
  if (dates.length === 0) return null;

  const times = dates.map((d) => d.getTime());
  return { from: new Date(Math.min(...times)), to: new Date(Math.max(...times)) };
}

export async function getWeeklyReports(rabId: string) {
  const sources = await loadSources(rabId);
  const bounds = periodBounds(sources);
  const project = projectHeader(sources);

  if (!bounds) return { rab: project, periods: [] as PeriodSummary[] };

  const periods: PeriodSummary[] = [];
  let cursor = startOfIsoWeek(bounds.from);
  let index = 1;

  // Batas 520 minggu (sepuluh tahun) menjaga proyek dengan tanggal salah ketik
  // tidak membangkitkan daftar tak berujung.
  while (cursor <= bounds.to && index <= 520) {
    const end = addDays(cursor, 6);
    periods.push(
      buildPeriod(sources, `W${index}`, `Minggu ke-${index} (${isoDate(cursor)} s/d ${isoDate(end)})`, cursor, end)
    );
    cursor = addDays(cursor, 7);
    index += 1;
  }

  return { rab: project, periods };
}

export async function getMonthlyReports(rabId: string) {
  const sources = await loadSources(rabId);
  const bounds = periodBounds(sources);
  const project = projectHeader(sources);

  if (!bounds) return { rab: project, periods: [] as PeriodSummary[] };

  const periods: PeriodSummary[] = [];
  let cursor = startOfUtcMonth(bounds.from);
  let guard = 0;

  while (cursor <= bounds.to && guard < 120) {
    const end = endOfUtcMonth(cursor);
    periods.push(buildPeriod(sources, isoDate(cursor).slice(0, 7), monthLabel(cursor), cursor, end));
    cursor = startOfUtcMonth(addDays(end, 1));
    guard += 1;
  }

  return { rab: project, periods };
}

function projectHeader(sources: Sources) {
  return {
    id: sources.rab.id,
    number: sources.rab.number,
    title: sources.rab.title,
    clientName: sources.rab.clientName,
    location: sources.rab.location,
    subtotal: money(sources.rab.subtotal).toString(),
    scheduleStart: sources.schedule.rab.scheduleStart,
    scheduleEnd: sources.schedule.rab.scheduleEnd,
  };
}

/** Rekap periodik sebagai CSV, kolomnya mengikuti laporan yang lazim diteken. */
export function periodicReportToCsv(periods: PeriodSummary[]): string {
  const rows: string[][] = [
    [
      "Periode",
      "Mulai",
      "Selesai",
      "Hari dilaporkan",
      "Hari kalender",
      "Rata-rata tenaga kerja",
      "Puncak tenaga kerja",
      "Rencana (%)",
      "Realisasi (%)",
      "Deviasi (%)",
      "Progres periode (%)",
      "Nilai terpasang (Rp)",
      "Kendala",
      "Kejadian logbook",
    ],
  ];

  for (const p of periods) {
    rows.push([
      p.label,
      p.startDate,
      p.endDate,
      String(p.reportedDays),
      String(p.calendarDays),
      String(p.averageWorkforce),
      String(p.peakWorkforce),
      p.plannedPct,
      p.cumulativePct,
      p.deviationPct,
      p.progressPct,
      p.cumulativeValue,
      String(p.obstacles.length),
      String(p.logbookCount),
    ]);
  }

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
