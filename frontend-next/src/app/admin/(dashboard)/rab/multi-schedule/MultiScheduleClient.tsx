"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import type { RabListRow } from "@/lib/estimation";
import type { MultiScheduleResponse } from "@/lib/adminResources";
import { MultiSCurveChart } from "./MultiSCurveChart";

interface MultiScheduleProject {
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
  currentProgress: number;
  status: "ahead" | "on-track" | "behind";
  deviationDays: number;
}

interface MultiSchedulePageProps {
  rabList: RabListRow[];
  initialSelectedIds: string[];
  multiScheduleData: MultiScheduleResponse | null;
}

function RabSelector({
  rabList,
  selectedIds,
  onToggle,
}: {
  rabList: RabListRow[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Pilih RAB untuk Dibandingkan</h3>
        <span className="text-xs text-slate-500">{selectedIds.length} dipilih</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {rabList.map((rab) => {
          const isSelected = selectedIds.includes(rab.id);
          return (
            <button
              key={rab.id}
              onClick={() => onToggle(rab.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-teal-500/50 bg-teal-500/10"
                  : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-700/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected ? "border-teal-500 bg-teal-500" : "border-slate-500"
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-200 truncate">{rab.number}</div>
                <div className="text-xs text-slate-500 truncate">{rab.title}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonTable({ projects }: { projects: MultiScheduleProject[] }) {
  const statusConfig = {
    ahead: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Lebih Cepat" },
    "on-track": { icon: CheckCircle2, color: "text-teal-400", bg: "bg-teal-500/10", label: "Sesuai Jadwal" },
    behind: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10", label: "Terlambat" },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-medium">
              RAB
            </th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-medium">
              Progress
            </th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-medium">
              Deviasi
            </th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-medium">
              Durasi
            </th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const config = statusConfig[project.status];
            const StatusIcon = config.icon;
            const deviation = project.deviationDays;

            return (
              <tr
                key={project.id}
                className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-200">{project.number}</div>
                  <div className="text-xs text-slate-500">{project.title}</div>
                </td>
                <td className="py-3 px-4 text-right font-medium text-slate-300">
                  {project.currentProgress.toFixed(1)}%
                </td>
                <td
                  className={`py-3 px-4 text-right font-medium ${
                    deviation >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {deviation >= 0 ? "+" : ""}
                  {deviation > 0 ? `${deviation} hari` : `${Math.abs(deviation)} hari`}
                </td>
                <td className="py-3 px-4 text-right text-slate-400">
                  {project.totalCalendarDays} hari
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
                  >
                    <StatusIcon size={12} />
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MultiScheduleClient({
  rabList,
  initialSelectedIds,
  multiScheduleData,
}: MultiSchedulePageProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 5) return prev;
        return [...prev, id];
      }
    });
  };

  const chartSchedules = useMemo(() => {
    if (!multiScheduleData) return [];
    return multiScheduleData.projects.map((p) => ({
      id: p.meta.id,
      number: p.meta.number,
      title: p.meta.title,
      buckets: p.calendarBuckets.map((b) => ({
        index: b.index,
        startDate: b.startDate,
        endDate: b.endDate,
        plannedPct: b.plannedPct,
        actualPct: b.actualPct,
        plannedValue: "0",
        actualValue: "0",
        deviationPct: b.deviationPct,
        cumulativePlanned: b.cumulativePlanned,
        cumulativeActual: b.cumulativeActual,
      })),
    }));
  }, [multiScheduleData]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/rab"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-teal-400/80">Multi-RAB</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-100">Perbandingan Kurva S</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Bandingkan progres beberapa RAB sekaligus pada sumbu normalisasi 0–100%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* RAB Selector */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
          <RabSelector rabList={rabList} selectedIds={selectedIds} onToggle={handleToggle} />
        </div>

        {/* Summary Cards */}
        {multiScheduleData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2">
                <Clock size={14} />
                Total RAB
              </div>
              <div className="text-2xl font-semibold text-slate-100">
                {multiScheduleData.summary.totalProjects}
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider mb-2">
                <TrendingUp size={14} />
                Lebih Cepat
              </div>
              <div className="text-2xl font-semibold text-emerald-400">
                {multiScheduleData.summary.ahead}
              </div>
            </div>
            <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-teal-400 text-xs uppercase tracking-wider mb-2">
                <CheckCircle2 size={14} />
                Sesuai
              </div>
              <div className="text-2xl font-semibold text-teal-400">
                {multiScheduleData.summary.onTrack}
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400 text-xs uppercase tracking-wider mb-2">
                <TrendingDown size={14} />
                Terlambat
              </div>
              <div className="text-2xl font-semibold text-red-400">
                {multiScheduleData.summary.behind}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Kurva S — Perbandingan</h2>
          <MultiSCurveChart schedules={chartSchedules} selectedIds={selectedIds} onToggle={handleToggle} />
        </div>

        {/* Comparison Table */}
        {multiScheduleData && multiScheduleData.projects.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/50">
              <h2 className="text-sm font-semibold text-slate-200">Ringkasan Perbandingan</h2>
            </div>
            <ComparisonTable projects={multiScheduleData.projects.map((p) => p.meta)} />
          </div>
        )}

        {/* Empty State */}
        {selectedIds.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Pilih RAB untuk Memulai</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Pilih 2 atau lebih RAB dari daftar di atas untuk melihat perbandingan kurva S. Maksimal 5 RAB
              dapat ditampilkan sekaligus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
