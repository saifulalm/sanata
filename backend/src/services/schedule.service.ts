import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, toDecimal } from "@/utils/money";
import { DAY_MS, addDays, isoDate, parseDateOnly, startOfUtcDay } from "@/utils/date";
import type { ScheduleUpdateInput, ProgressInput } from "@/validators/schedule.validator";

/**
 * Jadwal pelaksanaan (4D) dan kurva S sebuah RAB.
 *
 * Bobot tiap pekerjaan sudah tersirat di data yang ada sejak awal: nilai item
 * dibagi subtotal RAB. Yang belum ada hanyalah dimensi waktu, jadi service ini
 * menambahkan kapan tiap pekerjaan berjalan lalu menyebar bobotnya sepanjang
 * durasi itu.
 *
 *   bobot item      = amount / subtotal                (persen dari proyek)
 *   rencana kumulatif(t) = Σ bobot × porsi durasi yang sudah lewat pada t
 *   realisasi kumulatif(t) = Σ bobot × persen opname terakhir ≤ t
 *
 * Penyebar bobot dibuat linear per hari. Kurva berbentuk S bukan karena
 * rumusnya melengkung, melainkan karena pekerjaan menumpuk di tengah proyek —
 * awal dan akhir selalu lebih sepi.
 *
 * Subtotal dipakai sebagai penyebut, bukan `total`, karena diskon dan PPN
 * adalah komponen harga di tingkat dokumen dan tidak dikerjakan siapa pun di
 * lapangan. Memakai `total` akan membuat bobot seluruh pekerjaan tidak pernah
 * mencapai 100%.
 */

/** Satu periode pada kurva. */
export interface ScheduleBucket {
  index: number;
  startDate: string;
  endDate: string;
  /** Bobot rencana yang selesai sampai akhir periode ini, 0–100. */
  plannedPct: string;
  /** Bobot realisasi sampai akhir periode ini, 0–100. */
  actualPct: string;
  plannedValue: string;
  actualValue: string;
  /** actual - planned. Negatif berarti terlambat. */
  deviationPct: string;
  /** Bobot kumulatif rencana (% dari total). */
  cumulativePlanned: number;
  /** Bobot kumulatif aktual (% dari total). */
  cumulativeActual: number;
}

export interface ScheduleItemLine {
  id: string;
  sectionId: string;
  sectionName: string;
  description: string;
  unit: string;
  volume: string;
  amount: string;
  /** Bobot item terhadap subtotal RAB, dalam persen. */
  weightPct: string;
  startOffsetDays: number;
  durationDays: number;
  /** Tanggal absolut hasil scheduleStart + offset; null bila belum dijadwalkan. */
  startDate: string | null;
  endDate: string | null;
  /** Opname terakhir, 0 bila belum ada. */
  progressPct: string;
  lastProgressDate: string | null;
}

// Tanggal jadwal adalah tanggal kalender, bukan penanda waktu — aturannya
// terpusat di `utils/date`.
const startOfDay = startOfUtcDay;

/**
 * Kalender kerja proyek: memetakan "hari kerja ke-n" menjadi tanggal kalender.
 *
 * Durasi item dinyatakan dalam hari kerja karena begitulah cara kontraktor
 * menyusun jadwal — "pengecoran 5 hari" berarti lima hari orang bekerja, bukan
 * lima hari kalender yang kebetulan memuat dua hari Minggu. Kurva S tetap
 * dipotong per minggu kalender supaya bisa disandingkan dengan laporan bulanan.
 *
 * `restDays` kosong dan tanpa hari libur membuat kalender kerja identik dengan
 * kalender biasa, sehingga jadwal lama tetap terbaca sama.
 */
class WorkCalendar {
  private readonly rest: Set<number>;
  private readonly holidays: Set<string>;
  /** Tanggal hari kerja ke-0, ke-1, … dihitung sesuai kebutuhan. */
  private readonly dates: Date[] = [];
  /** Jumlah hari kerja yang sudah lewat sampai sebuah tanggal, di-cache. */
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

  /**
   * Tanggal kalender untuk hari kerja ke-`index` (0-based).
   *
   * Batas 20 tahun kalender mencegah putaran tak berujung bila seluruh tujuh
   * hari ditandai libur — konfigurasi yang salah tapi mungkin saja terjadi.
   */
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

  /** Berapa hari kerja yang sudah dilalui dari tanggal mulai s/d `date` inklusif. */
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
}

async function loadRab(rabId: string) {
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
              // Hanya opname yang sudah disetujui yang membentuk kurva realisasi.
              progress: {
                where: { status: "APPROVED" },
                orderBy: { date: "asc" },
                include: { photos: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!rab) throw ApiError.notFound("RAB not found");
  return rab;
}

export async function getRabSchedule(rabId: string) {
  const rab = await loadRab(rabId);

  const subtotal = toDecimal(rab.subtotal);
  const hasValue = subtotal.greaterThan(0);

  const calendar = rab.scheduleStart
    ? new WorkCalendar(
        startOfDay(rab.scheduleStart),
        rab.restDays,
        rab.holidays.map((h) => h.date)
      )
    : null;

  const items: ScheduleItemLine[] = [];
  // Dipakai lagi saat membangun kurva, supaya Decimal tidak dihitung dua kali.
  const computed: {
    weight: Prisma.Decimal;
    amount: Prisma.Decimal;
    startOffsetDays: number;
    durationDays: number;
    progress: { date: Date; percent: Prisma.Decimal }[];
  }[] = [];

  for (const section of rab.sections) {
    for (const item of section.items) {
      const amount = toDecimal(item.amount);
      // RAB kosong (subtotal 0) tidak boleh memicu pembagian nol.
      const weight = hasValue ? amount.div(subtotal).mul(100) : new Prisma.Decimal(0);
      const last = item.progress.at(-1);

      // Offset dan durasi dihitung dalam hari kerja, jadi tanggal kalendernya
      // dicari lewat kalender proyek — bukan sekadar ditambahkan.
      const startDate = calendar && item.durationDays > 0 ? calendar.dateOfWorkingDay(item.startOffsetDays) : null;
      // Durasi 3 hari kerja berarti hari kerja ke-0, 1, 2.
      const endDate =
        calendar && item.durationDays > 0
          ? calendar.dateOfWorkingDay(item.startOffsetDays + item.durationDays - 1)
          : null;

      items.push({
        id: item.id,
        sectionId: section.id,
        sectionName: section.name,
        description: item.description,
        unit: item.unit,
        volume: item.volume.toString(),
        amount: money(amount).toString(),
        weightPct: weight.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toString(),
        startOffsetDays: item.startOffsetDays,
        durationDays: item.durationDays,
        startDate: startDate ? isoDate(startDate) : null,
        endDate: endDate ? isoDate(endDate) : null,
        progressPct: last ? toDecimal(last.percent).toString() : "0",
        lastProgressDate: last ? isoDate(last.date) : null,
      });

      computed.push({
        weight,
        amount,
        startOffsetDays: item.startOffsetDays,
        durationDays: item.durationDays,
        progress: item.progress.map((p) => ({ date: startOfDay(p.date), percent: toDecimal(p.percent) })),
      });
    }
  }

  const scheduled = computed.filter((c) => c.durationDays > 0);
  const totalWorkingDays = scheduled.reduce((max, c) => Math.max(max, c.startOffsetDays + c.durationDays), 0);
  const projectEnd = calendar && totalWorkingDays > 0 ? calendar.dateOfWorkingDay(totalWorkingDays - 1) : null;

  const holidays = rab.holidays.map((h) => ({ id: h.id, date: isoDate(startOfDay(h.date)), name: h.name }));

  // Tanpa tanggal mulai atau tanpa satu pun item terjadwal, kurva tidak punya
  // sumbu waktu. Ringkasan tetap dikembalikan supaya UI bisa menjelaskan.
  if (!rab.scheduleStart || !calendar || !projectEnd || totalWorkingDays === 0) {
    return {
      rab: {
        id: rab.id,
        number: rab.number,
        title: rab.title,
        subtotal: money(subtotal).toString(),
        scheduleStart: rab.scheduleStart ? isoDate(startOfDay(rab.scheduleStart)) : null,
        scheduleEnd: null,
        restDays: rab.restDays,
        totalWorkingDays: 0,
        totalCalendarDays: 0,
        scheduledItems: 0,
        totalItems: items.length,
      },
      holidays,
      items,
      buckets: [] as ScheduleBucket[],
    };
  }

  const start = startOfDay(rab.scheduleStart);
  // Periode tetap mingguan kalender: laporan proyek dibaca per tanggal, bukan
  // per hari kerja ke-sekian.
  const totalCalendarDays = Math.round((projectEnd.getTime() - start.getTime()) / DAY_MS) + 1;
  const weeks = Math.ceil(totalCalendarDays / 7);
  const buckets: ScheduleBucket[] = [];

  for (let w = 0; w < weeks; w += 1) {
    const bucketStart = addDays(start, w * 7);
    // Periode terakhir dipotong di hari terakhir proyek, bukan digenapkan.
    const lastDayOffset = Math.min((w + 1) * 7 - 1, totalCalendarDays - 1);
    const bucketEnd = addDays(start, lastDayOffset);
    // Kemajuan rencana diukur dalam hari kerja yang sudah lewat, bukan hari
    // kalender — akhir pekan tidak menambah bobot.
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

      // Opname terakhir yang tanggalnya tidak melewati akhir periode.
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
      // Nilai rupiah dihitung dari persen yang belum dibulatkan. Memakai versi
      // 2 desimal membuat nilai meleset dari jumlah item yang dijadwalkan
      // (mis. 3,29% × 76 juta = 2.500.400, padahal itemnya tepat 2.500.000).
      plannedValue: money(subtotal.mul(planned).div(100)).toString(),
      actualValue: money(subtotal.mul(actual).div(100)).toString(),
      deviationPct: actualPct.minus(plannedPct).toString(),
      cumulativePlanned: Number(planned.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString()),
      cumulativeActual: Number(actual.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString()),
    });
  }

  return {
    rab: {
      id: rab.id,
      number: rab.number,
      title: rab.title,
      subtotal: money(subtotal).toString(),
      scheduleStart: isoDate(start),
      scheduleEnd: isoDate(projectEnd),
      restDays: rab.restDays,
      totalWorkingDays,
      totalCalendarDays,
      scheduledItems: scheduled.length,
      totalItems: items.length,
    },
    holidays,
    items,
    buckets,
  };
}

export async function updateRabSchedule(rabId: string, input: ScheduleUpdateInput) {
  const rab = await prisma.rab.findUnique({ where: { id: rabId }, select: { id: true } });
  if (!rab) throw ApiError.notFound("RAB not found");

  // Item harus benar-benar milik RAB ini — id dari klien tidak dipercaya.
  const owned = await prisma.rabItem.findMany({
    where: { section: { rabId } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((i) => i.id));
  const stranger = input.items.find((i) => !ownedIds.has(i.id));
  if (stranger) throw ApiError.badRequest(`Item ${stranger.id} bukan bagian dari RAB ini`);

  await prisma.$transaction([
    prisma.rab.update({
      where: { id: rabId },
      data: {
        scheduleStart: input.scheduleStart ? parseDateOnly(input.scheduleStart) : null,
        ...(input.restDays !== undefined ? { restDays: input.restDays } : {}),
      },
    }),
    ...input.items.map((i) =>
      prisma.rabItem.update({
        where: { id: i.id },
        data: { startOffsetDays: i.startOffsetDays, durationDays: i.durationDays },
      })
    ),
    // Daftar hari libur dikirim utuh: menghapus lalu menulis ulang jauh lebih
    // sederhana daripada mencocokkan selisihnya, dan jumlahnya selalu kecil.
    ...(input.holidays !== undefined
      ? [
          prisma.rabHoliday.deleteMany({ where: { rabId } }),
          prisma.rabHoliday.createMany({
            data: input.holidays.map((h) => ({ rabId, date: parseDateOnly(h.date), name: h.name })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  return getRabSchedule(rabId);
}

export async function recordProgress(
  itemId: string,
  input: ProgressInput,
  userId: string,
  role: "ADMIN" | "EDITOR" | "USER"
) {
  const item = await prisma.rabItem.findUnique({
    where: { id: itemId },
    select: { id: true, section: { select: { rabId: true } } },
  });
  if (!item) throw ApiError.notFound("Item RAB tidak ditemukan");

  // Admin bertindak sekaligus sebagai pemeriksa, jadi opname yang dia catat
  // langsung sah. Editor mewakili pelaksana di lapangan: angkanya menunggu
  // persetujuan sebelum ikut menaikkan kurva maupun nilai tagihan.
  const autoApprove = role === "ADMIN";
  const date = parseDateOnly(input.date);

  // Satu opname per item per tanggal: laporan susulan menimpa yang lama
  // daripada menumpuk dua nilai kumulatif di hari yang sama.
  const existing = await prisma.rabProgress.findFirst({ where: { itemId, date } });

  const photos = (input.photos ?? []).map((p, index) => ({
    url: p.url,
    caption: p.caption ?? null,
    order: index,
  }));

  if (existing) {
    await prisma.$transaction([
      prisma.rabProgress.update({
        where: { id: existing.id },
        data: {
          percent: input.percent,
          note: input.note ?? null,
          createdById: userId,
          // Revisi mengembalikan status ke PENDING: angka yang sudah disetujui
          // tidak boleh berubah diam-diam setelah pemeriksaan.
          status: autoApprove ? "APPROVED" : "PENDING",
          approvedById: autoApprove ? userId : null,
          approvedAt: autoApprove ? new Date() : null,
          rejectReason: null,
        },
      }),
      prisma.rabProgressPhoto.deleteMany({ where: { progressId: existing.id } }),
      ...(photos.length > 0
        ? [prisma.rabProgressPhoto.createMany({ data: photos.map((p) => ({ ...p, progressId: existing.id })) })]
        : []),
    ]);
  } else {
    await prisma.rabProgress.create({
      data: {
        itemId,
        date,
        percent: input.percent,
        note: input.note ?? null,
        createdById: userId,
        status: autoApprove ? "APPROVED" : "PENDING",
        approvedById: autoApprove ? userId : null,
        approvedAt: autoApprove ? new Date() : null,
        photos: photos.length > 0 ? { create: photos } : undefined,
      },
    });
  }

  return getRabSchedule(item.section.rabId);
}

/** Seluruh opname sebuah RAB apa pun statusnya — untuk panel pemeriksaan. */
export async function listProgressEntries(rabId: string) {
  const entries = await prisma.rabProgress.findMany({
    where: { item: { section: { rabId } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      photos: { orderBy: { order: "asc" } },
      item: { select: { id: true, description: true, unit: true, section: { select: { name: true } } } },
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return entries.map((e) => ({
    id: e.id,
    itemId: e.itemId,
    itemDescription: e.item.description,
    sectionName: e.item.section.name,
    date: isoDate(startOfDay(e.date)),
    percent: toDecimal(e.percent).toString(),
    note: e.note,
    status: e.status,
    rejectReason: e.rejectReason,
    createdByName: e.createdBy?.name ?? null,
    approvedByName: e.approvedBy?.name ?? null,
    approvedAt: e.approvedAt ? e.approvedAt.toISOString() : null,
    photos: e.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption })),
  }));
}

export async function reviewProgress(
  progressId: string,
  decision: "APPROVED" | "REJECTED",
  userId: string,
  reason?: string | null
) {
  const entry = await prisma.rabProgress.findUnique({
    where: { id: progressId },
    select: { id: true, item: { select: { section: { select: { rabId: true } } } } },
  });
  if (!entry) throw ApiError.notFound("Catatan progres tidak ditemukan");

  await prisma.rabProgress.update({
    where: { id: progressId },
    data: {
      status: decision,
      approvedById: userId,
      approvedAt: new Date(),
      rejectReason: decision === "REJECTED" ? (reason ?? null) : null,
    },
  });

  return getRabSchedule(entry.item.section.rabId);
}

export async function deleteProgress(progressId: string) {
  const entry = await prisma.rabProgress.findUnique({
    where: { id: progressId },
    select: { id: true, item: { select: { section: { select: { rabId: true } } } } },
  });
  if (!entry) throw ApiError.notFound("Catatan progres tidak ditemukan");

  await prisma.rabProgress.delete({ where: { id: progressId } });
  return getRabSchedule(entry.item.section.rabId);
}

// --- Baseline ---------------------------------------------------------------

interface BaselineSnapshot {
  scheduleStart: string | null;
  totalWorkingDays: number;
  buckets: { index: number; endDate: string; plannedPct: string }[];
  items: { id: string; description: string; startOffsetDays: number; durationDays: number }[];
}

export async function captureBaseline(rabId: string, name: string, userId: string) {
  const schedule = await getRabSchedule(rabId);
  if (schedule.buckets.length === 0) {
    throw ApiError.badRequest("Jadwal belum lengkap — isi tanggal mulai dan durasi sebelum mengunci baseline");
  }

  const snapshot: BaselineSnapshot = {
    scheduleStart: schedule.rab.scheduleStart,
    totalWorkingDays: schedule.rab.totalWorkingDays,
    buckets: schedule.buckets.map((b) => ({ index: b.index, endDate: b.endDate, plannedPct: b.plannedPct })),
    items: schedule.items.map((i) => ({
      id: i.id,
      description: i.description,
      startOffsetDays: i.startOffsetDays,
      durationDays: i.durationDays,
    })),
  };

  await prisma.rabScheduleBaseline.create({
    data: { rabId, name, capturedById: userId, snapshot: snapshot as unknown as Prisma.InputJsonValue },
  });

  return listBaselines(rabId);
}

export async function listBaselines(rabId: string) {
  const rows = await prisma.rabScheduleBaseline.findMany({
    where: { rabId },
    orderBy: { capturedAt: "desc" },
    include: { capturedBy: { select: { name: true } } },
  });

  return rows.map((b) => {
    const snapshot = b.snapshot as unknown as BaselineSnapshot;
    return {
      id: b.id,
      name: b.name,
      capturedAt: b.capturedAt.toISOString(),
      capturedByName: b.capturedBy?.name ?? null,
      scheduleStart: snapshot.scheduleStart,
      totalWorkingDays: snapshot.totalWorkingDays,
      buckets: snapshot.buckets,
    };
  });
}

export async function deleteBaseline(baselineId: string) {
  const row = await prisma.rabScheduleBaseline.findUnique({
    where: { id: baselineId },
    select: { rabId: true },
  });
  if (!row) throw ApiError.notFound("Baseline tidak ditemukan");

  await prisma.rabScheduleBaseline.delete({ where: { id: baselineId } });
  return listBaselines(row.rabId);
}

/** Kurva S sebagai CSV — kolomnya mengikuti laporan mingguan yang lazim dipakai. */
export function scheduleToCsv(schedule: Awaited<ReturnType<typeof getRabSchedule>>): string {
  const rows: string[][] = [
    ["Minggu", "Mulai", "Selesai", "Rencana (%)", "Realisasi (%)", "Deviasi (%)", "Rencana (Rp)", "Realisasi (Rp)"],
  ];

  for (const b of schedule.buckets) {
    rows.push([
      String(b.index),
      b.startDate,
      b.endDate,
      b.plannedPct,
      b.actualPct,
      b.deviationPct,
      b.plannedValue,
      b.actualValue,
    ]);
  }

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
