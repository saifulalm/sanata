import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarRange, ClipboardCheck, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getProgressEntries, getRabSchedule, getScheduleBaselines } from "@/lib/adminResources";
import { formatDate, formatRupiah } from "@/lib/format";
import { Panel } from "@/components/admin/ui";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { StatCard } from "@/components/admin/StatCard";
import { SCurveChart } from "./SCurveChart";
import { ScheduleEditor } from "./ScheduleEditor";
import { BaselinePanel } from "./BaselinePanel";
import { ProgressReviewPanel } from "./ProgressReviewPanel";

export const metadata: Metadata = { title: "Jadwal & Kurva S" };

export default async function RabSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let schedule: Awaited<ReturnType<typeof getRabSchedule>>;
  try {
    schedule = await getRabSchedule(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const [entries, baselines] = await Promise.all([getProgressEntries(id), getScheduleBaselines(id)]);

  // Status proyek dibaca pada periode tempat opname terakhir berada, bukan
  // periode terakhir yang angkanya bukan nol: realisasi selalu dibawa ke
  // periode sesudahnya, jadi memakai `actualPct > 0` akan selalu menunjuk
  // minggu terakhir proyek dan melaporkan keterlambatan yang belum terjadi.
  const latestOpname = schedule.items.reduce<string | null>(
    (latest, item) =>
      item.lastProgressDate && (!latest || item.lastProgressDate > latest) ? item.lastProgressDate : latest,
    null
  );
  const lastReportedIndex = latestOpname
    ? schedule.buckets.findLastIndex((b) => b.startDate <= latestOpname)
    : -1;
  const lastReported = lastReportedIndex >= 0 ? schedule.buckets[lastReportedIndex] : undefined;
  const deviation = lastReported ? Number(lastReported.deviationPct) : 0;
  const behind = deviation < 0;
  const pending = entries.filter((e) => e.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={schedule.rab}
        title="Jadwal Pelaksanaan & Kurva S"
        description="Bobot tiap pekerjaan disebar sepanjang durasinya menurut kalender kerja proyek — akhir pekan dan hari libur tidak menambah kemajuan rencana."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Nilai pekerjaan"
          value={`Rp ${formatRupiah(schedule.rab.subtotal)}`}
          icon={<Wallet size={18} />}
          hint="Subtotal sebelum diskon & PPN"
        />
        <StatCard
          label="Durasi proyek"
          value={schedule.rab.totalWorkingDays > 0 ? `${schedule.rab.totalWorkingDays} hari kerja` : "—"}
          icon={<CalendarRange size={18} />}
          hint={
            schedule.rab.scheduleStart
              ? `${formatDate(schedule.rab.scheduleStart)} s/d ${schedule.rab.scheduleEnd ? formatDate(schedule.rab.scheduleEnd) : "—"} · ${schedule.rab.totalCalendarDays} hari kalender`
              : "Tanggal mulai belum diisi"
          }
        />
        <StatCard
          label="Item terjadwal"
          value={`${schedule.rab.scheduledItems} / ${schedule.rab.totalItems}`}
          icon={<ClipboardCheck size={18} />}
          hint={pending > 0 ? `${pending} opname menunggu pemeriksaan` : "Item berdurasi 0 tidak masuk kurva"}
          tone={pending > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Deviasi terakhir"
          value={lastReported ? `${deviation > 0 ? "+" : ""}${deviation.toFixed(2)}%` : "—"}
          icon={behind ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
          hint={
            lastReported
              ? `${behind ? "Terlambat" : "Lebih cepat"} per ${formatDate(lastReported.endDate)}`
              : "Belum ada opname disetujui"
          }
          tone={behind && deviation < -5 ? "attention" : "default"}
        />
      </div>

      <Panel title="Kurva S — rencana vs realisasi">
        {schedule.buckets.length > 0 ? (
          <SCurveChart buckets={schedule.buckets} lastReportedIndex={lastReportedIndex} baselines={baselines} />
        ) : (
          <p className="py-12 text-center text-sm text-slate-400">
            Isi tanggal mulai dan durasi tiap pekerjaan di bawah, lalu simpan untuk memunculkan kurva.
          </p>
        )}
      </Panel>

      <BaselinePanel rabId={schedule.rab.id} baselines={baselines} schedule={schedule} canCapture={schedule.buckets.length > 0} />

      <ProgressReviewPanel rabId={schedule.rab.id} entries={entries} canReview={session.role === "ADMIN"} />

      <ScheduleEditor schedule={schedule} />
    </div>
  );
}
