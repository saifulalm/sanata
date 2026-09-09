import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, toDecimal } from "@/utils/money";
import { DAY_MS, addDays, isoDate, startOfUtcDay } from "@/utils/date";
import type { ScheduleBucket } from "@/services/schedule.service";

/**
 * Multi-Schedule Service
 *
 * Provides S-curve comparison functionality for multiple RAB projects.
 * Normalizes timelines to percentage-based X-axis (0-100% project progress)
 * for fair comparison regardless of actual project duration.
 */

// Re-export types from schedule.service for convenience
export { ScheduleBucket };

/** S-curve bucket with normalized percentage-based X-axis. */
export interface NormalizedScheduleBucket {
  /** Project progress percentage (0-100). */
  progressPct: number;
  /** Planned cumulative percentage at this progress point. */
  plannedPct: number;
  /** Actual cumulative percentage at this progress point. */
  actualPct: number;
  /** Planned value in currency at this progress point. */
  plannedValue: string;
  /** Actual value in currency at this progress point. */
  actualValue: string;
  /** Deviation: actual - planned (negative = behind schedule). */
  deviationPct: number;
}

/** Project metadata for comparison display. */
export interface MultiScheduleProjectMeta {
  id: string;
  number: string;
  title: string;
  subtotal: string;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  totalWorkingDays: number;
  totalCalendarDays: number;
  scheduledItems: number;
  totalItems: number;
  /** Current progress percentage (0-100). */
  currentProgress: number;
  /** Status based on deviation: ahead/on-track/behind. */
  status: "ahead" | "on-track" | "behind";
  /** Days of deviation from schedule. */
  deviationDays: number;
}

/** Single RAB S-curve data for comparison. */
export interface MultiScheduleCurve {
  meta: MultiScheduleProjectMeta;
  /** Original calendar-based buckets. */
  calendarBuckets: ScheduleBucket[];
  /** Normalized buckets with percentage-based X-axis. */
  normalizedBuckets: NormalizedScheduleBucket[];
}

/** Complete response for multi-schedule comparison. */
export interface MultiScheduleResponse {
  projects: MultiScheduleCurve[];
  /** Common X-axis points for comparison (0-100% in 5% increments). */
  comparisonXAxis: number[];
  /** Summary statistics across all projects. */
  summary: {
    totalProjects: number;
    onTrack: number;
    ahead: number;
    behind: number;
    averageProgress: number;
  };
}

// Tanggal jadwal adalah tanggal kalender, bukan penanda waktu — aturannya
// terpusat di `utils/date`.
const startOfDay = startOfUtcDay;

/**
 * Kalender kerja proyek: memetakan "hari kerja ke-n" menjadi tanggal kalender.
 * Reused from schedule.service.ts
 */
class WorkCalendar {
  private readonly rest: Set<number>;
  private readonly holidays: Set<string>;
  private readonly dates: Date[] = [];
  private readonly elapsedCache = new Map<string, number>();

  constructor(
    private readonly start: Date,
    restDays: number[],
    holidays: Date[]
  ) {
    this.rest = new Set(restDays);
    this.holidays = new Set(holidays.map((d) => isoDate(startOfDay(d))));
  }

  isWorking(date: Date): boolean {
    return !this.rest.has(date.getUTCDay()) && !this.holidays.has(isoDate(date));
  }

  dateOfWorkingDay(index: number): Date | null {
    const maxCalendarDays = 366 * 20;
    let cursor = this.dates.length > 0 ? this.dates.length : 0;
    let offset =
      this.dates.length > 0
        ? Math.round((this.dates[this.dates.length - 1].getTime() - this.start.getTime()) / DAY_MS) + 1
        : 0;

    while (cursor <= index) {
      if (offset > maxCalendarDays) return null;
      const candidate = addDays(this.start, offset);
      if (this.isWorking(candidate)) {
        this.dates.push(candidate);
        cursor += 1;
      }
      offset += 1;
    }

    return this.dates[index] ?? null;
  }

  elapsedWorkingDays(date: Date): number {
    const key = isoDate(date);
    const cached = this.elapsedCache.get(key);
    if (cached !== undefined) return cached;

    let count = 0;
    for (let cursor = new Date(this.start); cursor <= date; cursor = addDays(cursor, 1)) {
      if (this.isWorking(cursor)) count += 1;
    }

    this.elapsedCache.set(key, count);
    return count;
  }

  /** Total working days from start to end date (inclusive). */
  totalWorkingDays(): number {
    return this.dates.length;
  }
}

/** Internal computed data for S-curve calculation. */
interface ComputedItem {
  weight: Prisma.Decimal;
  amount: Prisma.Decimal;
  startOffsetDays: number;
  durationDays: number;
  progress: { date: Date; percent: Prisma.Decimal }[];
}

/**
 * Load RAB data with all related items and progress for schedule calculation.
 */
async function loadRabForSchedule(rabId: string) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      holidays: { orderBy: { date: "asc" } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              progress: {
                where: { status: "APPROVED" },
                orderBy: { date: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!rab) {
    throw ApiError.notFound(`RAB with ID ${rabId} not found`);
  }

  return rab;
}

/**
 * Calculate S-curve buckets for a single RAB.
 */
function calculateScheduleBuckets(
  rab: Awaited<ReturnType<typeof loadRabForSchedule>>
): { buckets: ScheduleBucket[]; totalWorkingDays: number; calendar: WorkCalendar | null } {
  const subtotal = toDecimal(rab.subtotal);
  const hasValue = subtotal.greaterThan(0);

  const calendar =
    rab.scheduleStart && rab.scheduleStart
      ? new WorkCalendar(
          startOfDay(rab.scheduleStart),
          rab.restDays,
          rab.holidays.map((h) => h.date)
        )
      : null;

  const computed: ComputedItem[] = [];

  for (const section of rab.sections) {
    for (const item of section.items) {
      const amount = toDecimal(item.amount);
      const weight = hasValue ? amount.div(subtotal).mul(100) : new Prisma.Decimal(0);

      computed.push({
        weight,
        amount,
        startOffsetDays: item.startOffsetDays,
        durationDays: item.durationDays,
        progress: item.progress.map((p) => ({
          date: startOfDay(p.date),
          percent: toDecimal(p.percent),
        })),
      });
    }
  }

  const scheduled = computed.filter((c) => c.durationDays > 0);
  const totalWorkingDays = scheduled.reduce(
    (max, c) => Math.max(max, c.startOffsetDays + c.durationDays),
    0
  );
  const projectEnd = calendar && totalWorkingDays > 0 ? calendar.dateOfWorkingDay(totalWorkingDays - 1) : null;

  // No schedule data - return empty buckets
  if (!rab.scheduleStart || !calendar || !projectEnd || totalWorkingDays === 0) {
    return { buckets: [], totalWorkingDays: 0, calendar };
  }

  const start = startOfDay(rab.scheduleStart);
  const totalCalendarDays = Math.round((projectEnd.getTime() - start.getTime()) / DAY_MS) + 1;
  const weeks = Math.ceil(totalCalendarDays / 7);
  const buckets: ScheduleBucket[] = [];

  for (let w = 0; w < weeks; w += 1) {
    const bucketStart = addDays(start, w * 7);
    const lastDayOffset = Math.min((w + 1) * 7 - 1, totalCalendarDays - 1);
    const bucketEnd = addDays(start, lastDayOffset);
    const workedByBucketEnd = calendar.elapsedWorkingDays(bucketEnd);

    let planned = new Prisma.Decimal(0);
    let actual = new Prisma.Decimal(0);

    for (const c of computed) {
      if (c.durationDays > 0) {
        const elapsed = workedByBucketEnd - c.startOffsetDays;
        const clamped = Math.max(0, Math.min(elapsed, c.durationDays));
        if (clamped > 0) {
          planned = planned.plus(c.weight.mul(clamped).div(c.durationDays));
        }
      }

      let latest: Prisma.Decimal | null = null;
      for (const p of c.progress) {
        if (p.date.getTime() <= bucketEnd.getTime()) latest = p.percent;
        else break;
      }
      if (latest) actual = actual.plus(c.weight.mul(latest).div(100));
    }

    const plannedPct = planned.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const actualPct = actual.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    buckets.push({
      index: w + 1,
      startDate: isoDate(bucketStart),
      endDate: isoDate(bucketEnd),
      plannedPct: plannedPct.toString(),
      actualPct: actualPct.toString(),
      plannedValue: money(subtotal.mul(planned).div(100)).toString(),
      actualValue: money(subtotal.mul(actual).div(100)).toString(),
      deviationPct: actualPct.minus(plannedPct).toString(),
      cumulativePlanned: Number(planned.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString()),
      cumulativeActual: Number(actual.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString()),
    });
  }

  return { buckets, totalWorkingDays, calendar };
}

/**
 * Normalize calendar-based buckets to percentage-based X-axis.
 *
 * Maps each bucket to project progress (0-100%) instead of calendar dates,
 * enabling fair comparison between projects of different durations.
 */
function normalizeBuckets(buckets: ScheduleBucket[]): NormalizedScheduleBucket[] {
  if (buckets.length === 0) return [];

  const normalized: NormalizedScheduleBucket[] = [];
  const lastBucket = buckets[buckets.length - 1];
  const finalPlanned = parseFloat(lastBucket.plannedPct) || 100;

  for (const bucket of buckets) {
    // Calculate progress percentage based on planned completion
    const progressPct = finalPlanned > 0
      ? (parseFloat(bucket.plannedPct) / finalPlanned) * 100
      : 0;

    const plannedPct = parseFloat(bucket.plannedPct) || 0;
    const actualPct = parseFloat(bucket.actualPct) || 0;

    normalized.push({
      progressPct: Math.min(100, Math.max(0, progressPct)),
      plannedPct,
      actualPct,
      plannedValue: bucket.plannedValue,
      actualValue: bucket.actualValue,
      deviationPct: actualPct - plannedPct,
    });
  }

  return normalized;
}

/**
 * Interpolate normalized values at specific X-axis points.
 * Used to align different projects to common comparison points.
 */
function interpolateAtProgress(
  normalizedBuckets: NormalizedScheduleBucket[],
  targetProgress: number
): { plannedPct: number; actualPct: number; deviationPct: number } {
  if (normalizedBuckets.length === 0) {
    return { plannedPct: 0, actualPct: 0, deviationPct: 0 };
  }

  if (normalizedBuckets.length === 1) {
    const b = normalizedBuckets[0];
    return { plannedPct: b.plannedPct, actualPct: b.actualPct, deviationPct: b.deviationPct };
  }

  // Find surrounding buckets
  let beforeIdx = 0;
  for (let i = 0; i < normalizedBuckets.length; i++) {
    if (normalizedBuckets[i].progressPct <= targetProgress) {
      beforeIdx = i;
    } else {
      break;
    }
  }

  const before = normalizedBuckets[beforeIdx];
  const after = normalizedBuckets[Math.min(beforeIdx + 1, normalizedBuckets.length - 1)];

  if (before.progressPct === after.progressPct) {
    return {
      plannedPct: before.plannedPct,
      actualPct: before.actualPct,
      deviationPct: before.deviationPct,
    };
  }

  // Linear interpolation
  const ratio = (targetProgress - before.progressPct) / (after.progressPct - before.progressPct);

  return {
    plannedPct: before.plannedPct + (after.plannedPct - before.plannedPct) * ratio,
    actualPct: before.actualPct + (after.actualPct - before.actualPct) * ratio,
    deviationPct: before.deviationPct + (after.deviationPct - before.deviationPct) * ratio,
  };
}

/**
 * Generate common X-axis points for comparison.
 * Creates evenly distributed points from 0-100% with 5% increments.
 */
function generateComparisonXAxis(): number[] {
  const points: number[] = [];
  for (let i = 0; i <= 100; i += 5) {
    points.push(i);
  }
  return points;
}

/**
 * Calculate project status based on current progress vs planned progress.
 */
function calculateProjectStatus(
  currentActual: number,
  currentPlanned: number,
  threshold: number = 5
): "ahead" | "on-track" | "behind" {
  const deviation = currentActual - currentPlanned;
  if (deviation > threshold) return "ahead";
  if (deviation < -threshold) return "behind";
  return "on-track";
}

/**
 * Fetch and process multiple RAB S-curves for comparison.
 *
 * @param rabIds - Array of RAB IDs to compare
 * @returns Multi-schedule data with normalized curves for comparison
 */
export async function getMultiSchedule(rabIds: string[]): Promise<MultiScheduleResponse> {
  if (!rabIds || rabIds.length === 0) {
    throw ApiError.badRequest("At least one RAB ID is required");
  }

  if (rabIds.length > 20) {
    throw ApiError.badRequest("Maximum 20 RABs can be compared at once");
  }

  // Remove duplicates
  const uniqueIds = [...new Set(rabIds)];

  const projects: MultiScheduleCurve[] = [];
  const summary = {
    totalProjects: uniqueIds.length,
    onTrack: 0,
    ahead: 0,
    behind: 0,
    averageProgress: 0,
  };

  let totalProgress = 0;

  for (const rabId of uniqueIds) {
    const rab = await loadRabForSchedule(rabId);

    const { buckets, totalWorkingDays, calendar } = calculateScheduleBuckets(rab);
    const normalizedBuckets = normalizeBuckets(buckets);
    const subtotal = toDecimal(rab.subtotal);

    // Calculate current progress
    const lastBucket = buckets[buckets.length - 1];
    const currentPlanned = lastBucket ? parseFloat(lastBucket.plannedPct) || 0 : 0;
    const currentActual = lastBucket ? parseFloat(lastBucket.actualPct) || 0 : 0;

    totalProgress += currentActual;

    // Calculate deviation in days (approximate)
    let deviationDays = 0;
    if (calendar && totalWorkingDays > 0 && currentPlanned > 0) {
      const plannedRatio = currentActual / currentPlanned;
      const expectedWorkingDays = Math.round(totalWorkingDays * Math.min(1, plannedRatio));
      const actualProgressDays = Math.round(totalWorkingDays * (currentActual / 100));
      deviationDays = actualProgressDays - expectedWorkingDays;
    }

    const status = calculateProjectStatus(currentActual, currentPlanned);

    // Update summary counts
    if (status === "ahead") summary.ahead++;
    else if (status === "behind") summary.behind++;
    else summary.onTrack++;

    const meta: MultiScheduleProjectMeta = {
      id: rab.id,
      number: rab.number,
      title: rab.title,
      subtotal: money(subtotal).toString(),
      scheduleStart: rab.scheduleStart ? isoDate(startOfDay(rab.scheduleStart)) : null,
      scheduleEnd: lastBucket ? lastBucket.endDate : null,
      totalWorkingDays,
      totalCalendarDays: buckets.length > 0
        ? (buckets.length * 7) - (buckets[buckets.length - 1]?.plannedPct ? 0 : 0)
        : 0,
      scheduledItems: buckets.length > 0 ? totalWorkingDays : 0,
      totalItems: rab.sections.reduce((sum, s) => sum + s.items.length, 0),
      currentProgress: currentActual,
      status,
      deviationDays,
    };

    // Calculate total calendar days properly
    if (rab.scheduleStart && lastBucket) {
      const startDate = startOfDay(rab.scheduleStart);
      const endDate = new Date(lastBucket.endDate);
      meta.totalCalendarDays = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
      meta.scheduledItems = buckets.filter((b) => parseFloat(b.plannedPct) > 0).length;
    }

    projects.push({
      meta,
      calendarBuckets: buckets,
      normalizedBuckets,
    });
  }

  summary.averageProgress = uniqueIds.length > 0 ? totalProgress / uniqueIds.length : 0;

  return {
    projects,
    comparisonXAxis: generateComparisonXAxis(),
    summary,
  };
}

/**
 * Get interpolated comparison data at specific progress points.
 * Useful for creating aligned comparison charts.
 */
export function getInterpolatedComparison(
  multiSchedule: MultiScheduleResponse,
  targetProgressPoints?: number[]
): {
  projects: {
    id: string;
    number: string;
    title: string;
    interpolatedData: { progressPct: number; plannedPct: number; actualPct: number; deviationPct: number }[];
  }[];
} {
  const points = targetProgressPoints || multiSchedule.comparisonXAxis;

  return {
    projects: multiSchedule.projects.map((project) => ({
      id: project.meta.id,
      number: project.meta.number,
      title: project.meta.title,
      interpolatedData: points.map((progress) => {
        const interpolated = interpolateAtProgress(project.normalizedBuckets, progress);
        return {
          progressPct: progress,
          plannedPct: Math.round(interpolated.plannedPct * 100) / 100,
          actualPct: Math.round(interpolated.actualPct * 100) / 100,
          deviationPct: Math.round(interpolated.deviationPct * 100) / 100,
        };
      }),
    })),
  };
}

/**
 * Calculate earned value metrics for a project.
 */
export function getEarnedValueMetrics(rabId: string): Promise<{
  plannedValue: string;
  earnedValue: string;
  actualCost: string;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
}> {
  // This would require actual cost data which may not be available
  // Returning a placeholder structure that can be extended
  throw new Error("Earned value calculation requires cost tracking integration");
}
