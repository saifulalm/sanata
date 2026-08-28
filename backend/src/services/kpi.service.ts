/**
 * KPI Service - Key Performance Indicators per worker
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";

export async function listKpis(
  filters: { workerId?: string; period?: string } = {},
  pagination?: { skip: number; take: number }
) {
  const where = {
    ...(filters.workerId ? { workerId: filters.workerId } : {}),
    ...(filters.period ? { period: filters.period } : {}),
  };

  const [records, total] = await Promise.all([
    prisma.kpiRecord.findMany({
      where,
      include: {
        worker: { select: { id: true, workerCode: true, name: true, role: true, grade: true } },
      },
      orderBy: { periodEnd: "desc" },
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.kpiRecord.count({ where }),
  ]);

  return { records, total };
}

export async function getKpi(id: string) {
  const r = await prisma.kpiRecord.findUnique({
    where: { id },
    include: { worker: true },
  });
  if (!r) throw ApiError.notFound("KPI tidak ditemukan");
  return r;
}

export async function upsertKpi(data: {
  workerId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  qualityScore?: number;
  productivityScore?: number;
  attendanceScore?: number;
  safetyScore?: number;
  reworkCount?: number;
  defectCount?: number;
  completedTasks?: number;
  lateDays?: number;
  notes?: string;
}) {
  const scores = [data.qualityScore, data.productivityScore, data.attendanceScore, data.safetyScore].filter(Boolean) as number[];
  const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;
  return prisma.kpiRecord.upsert({
    where: { workerId_period: { workerId: data.workerId, period: data.period } },
    create: {
      kpiCode: `KPI-${data.workerId.slice(-4)}-${data.period}`,
      workerId: data.workerId,
      period: data.period,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      qualityScore: data.qualityScore,
      productivityScore: data.productivityScore,
      attendanceScore: data.attendanceScore,
      safetyScore: data.safetyScore,
      reworkCount: data.reworkCount || 0,
      defectCount: data.defectCount || 0,
      completedTasks: data.completedTasks || 0,
      lateDays: data.lateDays || 0,
      overallScore: overall,
      notes: data.notes,
    },
    update: {
      qualityScore: data.qualityScore,
      productivityScore: data.productivityScore,
      attendanceScore: data.attendanceScore,
      safetyScore: data.safetyScore,
      reworkCount: data.reworkCount || 0,
      defectCount: data.defectCount || 0,
      completedTasks: data.completedTasks || 0,
      lateDays: data.lateDays || 0,
      overallScore: overall,
      notes: data.notes,
    },
  });
}

export async function deleteKpi(id: string) {
  await prisma.kpiRecord.delete({ where: { id } });
}

export async function getWorkerKpis(workerId: string) {
  return prisma.kpiRecord.findMany({
    where: { workerId },
    orderBy: { periodEnd: "desc" },
    take: 12,
  });
}

export async function getLeaderboard(period?: string, limit = 10) {
  const records = await prisma.kpiRecord.findMany({
    where: period ? { period } : {},
    include: {
      worker: { select: { id: true, workerCode: true, name: true, role: true, grade: true } },
    },
    orderBy: { overallScore: "desc" },
    take: limit,
  });
  return records.map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function getPeriods() {
  // First, get existing periods from database
  const existingPeriods = await prisma.kpiRecord.findMany({
    select: { period: true, periodStart: true, periodEnd: true },
    distinct: ["period"],
    orderBy: { periodStart: "desc" },
    take: 24,
  });

  const existingMap = new Map(existingPeriods.map((p) => [p.period, p]));

  // Generate periods for the last 12 months + next 3 months
  const periods: Array<{ value: string; label: string; start: string; end: string }> = [];
  const now = new Date();

  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const period = `${year}-${month}`;

    const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
    const start = `${year}-${month}-01`;
    const end = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

    if (!existingMap.has(period)) {
      periods.push({ value: period, label: formatPeriod(period), start, end });
    }
  }

  // Add existing periods
  for (const p of existingPeriods) {
    periods.push({
      value: p.period,
      label: formatPeriod(p.period),
      start: p.periodStart.toISOString().split("T")[0],
      end: p.periodEnd.toISOString().split("T")[0],
    });
  }

  // Sort by value descending
  periods.sort((a, b) => b.value.localeCompare(a.value));

  return periods.slice(0, 24);
}

function formatPeriod(period: string): string {
  if (period.includes("-W")) {
    const [year, week] = period.split("-W");
    return `Minggu ${week}, ${year}`;
  }
  const [y, m] = period.split("-");
  const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${months[parseInt(m)] || period} ${y}`;
}
