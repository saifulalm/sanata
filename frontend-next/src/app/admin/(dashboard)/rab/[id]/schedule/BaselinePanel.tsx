"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Plus, Trash2, BarChart3, ShieldCheck } from "lucide-react";
import { BaselineChart } from "./BaselineChart";
import {
  S_CURVE_DATA_LABEL,
  type ScheduleBucket,
  type ScheduleBaseline,
  type RabSchedule,
} from "@/lib/estimation";
import { captureBaselineAction, deleteBaselineAction } from "../../actions";
import { formatDate } from "@/lib/format";
import { Badge, Panel, EmptyState } from "@/components/admin/ui";

export function BaselinePanel({
  rabId,
  baselines,
  schedule: scheduleProp,
  canCapture,
}: {
  rabId: string;
  baselines: ScheduleBaseline[];
  schedule?: RabSchedule;
  canCapture: boolean;
}) {
  const [schedule, setSchedule] = useState<RabSchedule | null>(scheduleProp ?? null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Fetch schedule data client-side if not provided as prop
  useEffect(() => {
    if (scheduleProp) return;
    async function load() {
      try {
        const res = await fetch(`/api/rab/${rabId}/schedule`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSchedule(data.data);
        }
      } catch {}
    }
    load();
  }, [rabId, scheduleProp]);

  const buckets: ScheduleBucket[] = schedule?.buckets ?? [];

  const totalBudget = useMemo(
    () => buckets[buckets.length - 1]?.cumulativePlanned ?? 0,
    [buckets]
  );

  const handleCapture = (name: string) =>
    startTransition(async () => {
      await captureBaselineAction(rabId, name);
      router.refresh();
    });

  const handleDelete = (baselineId: string) =>
    startTransition(async () => {
      await deleteBaselineAction(rabId, baselineId);
      router.refresh();
    });

  if (!canCapture) {
    return (
      <Panel
        title="Baseline"
        description="Kunci rencana awal untuk membandingkan progress aktual dengan rencana kontrak."
      >
        <EmptyState
          icon={<BarChart3 size={20} />}
          title="Baseline belum tersedia"
          description="Isi tanggal mulai dan durasi di tab Jadwal & Kurva S terlebih dahulu, lalu simpan."
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Baseline</h2>
          <p className="text-xs text-slate-500">
            Kunci rencana awal untuk membandingkan progress aktual dengan rencana kontrak.
          </p>
        </div>
        <CaptureButton canCapture={canCapture} onCapture={handleCapture} />
      </div>

      {/* Saved Baselines */}
      {baselines.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-amber-400" />
            <span className="text-xs font-medium text-slate-400">Baseline tersimpan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {baselines.map((b) => (
              <div
                key={b.id}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs"
              >
                <Badge tone="warning">{b.name}</Badge>
                <span className="text-slate-500">
                  {formatDate(b.capturedAt)} · {b.totalWorkingDays} hari
                </span>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={isPending}
                  className="ml-1 text-slate-600 hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {buckets.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={20} />}
          title="Belum ada data kurva"
          description="Simpan jadwal di tab Jadwal & Kurva S untuk melihat baseline."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-4">
            <BaselineChart buckets={buckets} baselines={baselines} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
            <table className="w-full min-w-[36rem] text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-500">
                  <th className="px-4 py-2.5 text-left font-medium">Periode</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rencana (%)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kumulatif Rencana</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kumulatif (%)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Realisasi (%)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kumulatif Aktual</th>
                  <th className="px-4 py-2.5 text-right font-medium">Kumulatif (%)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Gap (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {buckets.map((b) => {
                  const realizedPct =
                    totalBudget > 0
                      ? ((b.cumulativeActual / totalBudget) * 100).toFixed(1)
                      : "0.0";
                  const plannedPct =
                    totalBudget > 0
                      ? ((b.cumulativePlanned / totalBudget) * 100).toFixed(1)
                      : "0.0";
                  const gap = (Number(realizedPct) - Number(plannedPct)).toFixed(1);
                  return (
                    <tr key={b.index} className="text-slate-400">
                      <td className="px-4 py-2.5 text-white">
                        M{b.index} <span className="text-slate-500">({b.endDate})</span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {Number(b.plannedPct).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-cyan-300">
                        {b.cumulativePlanned.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{plannedPct}%</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {Number(b.actualPct).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-300">
                        {b.cumulativeActual.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{realizedPct}%</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                        <span className={Number(gap) >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {Number(gap) >= 0 ? "+" : ""}
                          {gap}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Capture Button ───────────────────────────────────────────────────────────

function CaptureButton({
  canCapture,
  onCapture,
}: {
  canCapture: boolean;
  onCapture: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (!canCapture) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-xs font-medium text-amber-300 transition-all hover:border-amber-400/60 hover:bg-amber-400/20"
      >
        <BarChart3 size={13} /> Kunci Baseline
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="mb-4 text-sm font-semibold text-white">Kunci Baseline Baru</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama baseline, mis. 'Rencana Kontrak'"
              className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-300/10"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (name.trim()) {
                    onCapture(name.trim());
                    setOpen(false);
                    setName("");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition-all hover:border-amber-400/60 hover:bg-amber-400/20"
              >
                <ShieldCheck size={13} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
