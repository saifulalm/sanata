"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  CloudRain,
  CloudSun,
  CloudDrizzle,
  CloudLightning,
  Sun,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Users,
  FileText,
} from "lucide-react";
import { WEATHER_LABEL, type DailyReport, type Weather } from "@/lib/estimation";
import { mediaSrc } from "@/lib/media";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { DailyReportForm } from "./DailyReportForm";
import { deleteDailyReportAction } from "../../actions";
import { formatDate } from "@/lib/format";

// Weather meta — dark glass tones
const WM: Record<Weather, { label: string; icon: React.ReactNode; tone: string }> = {
  CERAH: { label: "Cerah", icon: <Sun size={10} />, tone: "bg-amber-500/15 border border-amber-400/25 text-amber-300" },
  BERAWAN: { label: "Berawan", icon: <CloudSun size={10} />, tone: "bg-slate-500/15 border border-slate-400/25 text-slate-300" },
  GERIMIS: { label: "Gerimis", icon: <CloudDrizzle size={10} />, tone: "bg-sky-500/15 border border-sky-400/25 text-sky-300" },
  HUJAN: { label: "Hujan", icon: <CloudRain size={10} />, tone: "bg-blue-500/15 border border-blue-400/25 text-blue-300" },
  HUJAN_LEBAT: { label: "Hujan Lebat", icon: <CloudLightning size={10} />, tone: "bg-indigo-500/15 border border-indigo-400/25 text-indigo-300" },
};

export function DailyReportBoard({
  rabId,
  reports,
  activeWorkforceRoles,
}: {
  rabId: string;
  reports: DailyReport[];
  activeWorkforceRoles?: Array<{ role: string; label: string }>;
}) {
  const [editing, setEditing] = useState<DailyReport | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const totalPhotos = reports.reduce((s, r) => s + r.photos.length, 0);
  const totalWorkers = reports.reduce((s, r) => s + (r.workforceTotal ?? 0), 0);

  const remove = (report: DailyReport) =>
    ask({
      title: `Hapus laporan ${formatDate(report.date)}?`,
      description: "Seluruh isian dan foto akan dihapus permanen.",
      onConfirm: () =>
        startTransition(async () => {
          const res = await deleteDailyReportAction(rabId, report.id);
          if (!res.ok) setError(res.message ?? "Gagal menghapus");
        }),
    });

  return (
    <div className="space-y-5">

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {reports.length > 0 && (
            <>
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <span className="font-semibold text-slate-200">{reports.length}</span>
                <span>Laporan</span>
              </span>
              {totalWorkers > 0 && (
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <Users size={11} className="text-slate-500" />
                  <span className="font-semibold text-slate-200">{totalWorkers}</span>
                  <span>total orang</span>
                </span>
              )}
              {totalPhotos > 0 && (
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="font-semibold text-slate-200">{totalPhotos}</span>
                  <span>Foto</span>
                </span>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setCreating(true); }}
          className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
        >
          <Plus size={15} /> Laporan Baru
        </button>
      </div>

      {/* ── Error ───────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Form Panel ──────────────────────────────── */}
      {(creating || editing) && (
        <DailyReportForm
          key={editing?.id ?? "new"}
          rabId={rabId}
          report={editing ?? null}
          workforceRoles={activeWorkforceRoles}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {/* ── Empty State ──────────────────────────────── */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <FileText size={24} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400">Belum ada laporan harian</p>
          <p className="mt-1 max-w-sm text-xs text-slate-600">
            Catat cuaca, tenaga kerja, dan aktivitas lapangan setiap hari — catatan ini penting sebagai bukti saat terjadi sengketa.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
          >
            <Plus size={14} /> Tambah Laporan Pertama
          </button>
        </div>
      ) : (
        /* ── Report Cards ─────────────────────────────── */
        <ul className="space-y-4">
          {reports.map((report) => {
            const wm = report.weatherMorning ? WM[report.weatherMorning] : null;
            const wa = report.weatherAfternoon ? WM[report.weatherAfternoon] : null;
            const workers = report.workforceTotal ?? 0;

            // Parse date for display
            const monthName = new Date(report.date + "T00:00:00Z").toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" });
            const dayNum = report.date.slice(8, 10);
            const yearNum = report.date.slice(0, 4);

            return (
              <li
                key={report.id}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm transition-colors hover:border-white/16"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Date badge */}
                    <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                      <span className="text-[10px] font-medium uppercase text-slate-500 leading-none">{monthName}</span>
                      <span className="text-lg font-bold text-white leading-none">{dayNum}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        {formatDate(report.date)}
                        <span className="ml-2 text-xs font-normal text-slate-500">{yearNum}</span>
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {wm && (
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${wm.tone}`}>
                            {wm.icon} Pagi {wm.label}
                          </span>
                        )}
                        {wa && (
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${wa.tone}`}>
                            {wa.icon} Siang {wa.label}
                          </span>
                        )}
                        {workers > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                            <Users size={10} /> {workers} orang
                          </span>
                        )}
                        {report.createdByName && (
                          <span className="text-[11px] text-slate-600">· {report.createdByName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`/admin/print/daily-report/${report.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title={`Cetak ${formatDate(report.date)}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                    >
                      <Printer size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setEditing(report); }}
                      title={`Sunting ${formatDate(report.date)}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-slate-500/40 hover:bg-white/[0.07] hover:text-slate-200"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => remove(report)}
                      title={`Hapus ${formatDate(report.date)}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Fields grid */}
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Field label="Aktivitas" value={report.activities} />
                  {report.workforce && Object.keys(report.workforce).length > 0 && (
                    <Field
                      label="Tenaga Kerja"
                      value={Object.entries(report.workforce)
                        .map(([role, count]) => `${role}: ${count}`)
                        .join(" · ")}
                    />
                  )}
                  {report.equipment && <Field label="Peralatan" value={report.equipment} />}
                  {report.materials && <Field label="Material Masuk" value={report.materials} />}
                  {report.obstacles && <Field label="Kendala" value={report.obstacles} tone="warning" />}
                  {report.notes && <Field label="Catatan" value={report.notes} />}
                </div>

                {/* Photo grid */}
                {report.photos.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <CloudRain size={12} /> Dokumentasi ({report.photos.length})
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {report.photos.map((photo) => (
                        <figure
                          key={photo.id}
                          className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:border-white/18 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                        >
                          <span className="relative block aspect-[4/3] bg-slate-900">
                            <Image
                              src={mediaSrc(photo.url)}
                              alt={photo.caption ?? "Dokumentasi lapangan"}
                              fill
                              sizes="(min-width: 1024px) 22vw, 45vw"
                              className="object-cover"
                            />
                          </span>
                          {(photo.caption || photo.location) && (
                            <figcaption className="px-2.5 py-2 text-[11px] leading-relaxed text-slate-400">
                              {photo.location && (
                                <span className="mb-0.5 block font-medium text-slate-300">{photo.location}</span>
                              )}
                              {photo.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div>
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`whitespace-pre-line text-sm leading-relaxed ${tone === "warning" ? "text-amber-300" : "text-slate-300"}`}>
        {value}
      </dd>
    </div>
  );
}
