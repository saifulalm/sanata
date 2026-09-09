"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScheduleBaseline, ScheduleBucket } from "@/lib/estimation";

/**
 * Kurva S dengan support multiple sections dalam 1 RAB.
 *
 * Mode:
 * - "combined": Tampilkan semua section dalam 1 chart (default)
 * - "per-section": Tampilkan 1 chart per section
 *
 * Setiap section mendapat warna berbeda dari palette.
 */
interface SectionCurve {
  sectionId: string;
  sectionName: string;
  buckets: ScheduleBucket[];
  color: string;
  totalWeight: number;
}

const COLORS = [
  "#0f766e", // teal
  "#d97706", // amber
  "#7c3aed", // violet
  "#dc2626", // red
  "#2563eb", // blue
  "#059669", // emerald
  "#ea580c", // orange
  "#8b5cf6", // purple
  "#0891b2", // cyan
  "#4f46e5", // indigo
];

interface MultiSectionSCurveProps {
  /** Combined buckets (all sections combined) */
  buckets: ScheduleBucket[];
  /** Section-level buckets */
  sectionBuckets: SectionBucket[];
  lastReportedIndex: number;
  baselines?: ScheduleBaseline[];
  mode?: "combined" | "per-section";
  selectedSections?: string[];
  onToggleSection?: (sectionId: string) => void;
}

export interface SectionBucket {
  sectionId: string;
  sectionName: string;
  buckets: ScheduleBucket[];
  totalWeight: number;
}

export function MultiSectionSCurveChart({
  buckets,
  sectionBuckets,
  lastReportedIndex,
  baselines = [],
  mode = "combined",
  selectedSections,
  onToggleSection,
}: MultiSectionSCurveProps) {
  const baseline = baselines[0];
  const baselineByIndex = new Map(
    (baseline?.buckets ?? []).map((b) => [b.index, Number(b.plannedPct)])
  );

  // Build section curves for combined view
  const sectionCurves: SectionCurve[] = sectionBuckets.map((section, index) => ({
    sectionId: section.sectionId,
    sectionName: section.sectionName,
    buckets: section.buckets,
    color: COLORS[index % COLORS.length],
    totalWeight: section.totalWeight,
  }));

  // Filter by selected sections if provided
  const visibleCurves =
    selectedSections && onToggleSection
      ? sectionCurves.filter((c) => selectedSections.includes(c.sectionId))
      : sectionCurves;

  if (mode === "per-section") {
    return (
      <div className="space-y-4">
        {sectionCurves.map((section) => (
          <div key={section.sectionId} className="border border-slate-700/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: section.color }}
              />
              {section.sectionName}
              <span className="text-xs text-slate-500 font-normal">
                ({section.totalWeight.toFixed(1)}% bobot)
              </span>
            </h4>
            <SingleSectionChart
              buckets={section.buckets}
              color={section.color}
              lastReportedIndex={lastReportedIndex}
            />
          </div>
        ))}
      </div>
    );
  }

  // Combined view - all sections in one chart
  const endDates = new Map(buckets.map((b) => [`M${b.index}`, b.endDate]));

  // Build chart data with all sections
  // Show SECTION PLANS (rencana per section) so we can see combined curves even without progress
  const chartData = buckets.map((b, i) => {
    const point: Record<string, number | string | null> = {
      name: `M${b.index}`,
      rencana: Number(b.plannedPct),
      // Combined realization (total project)
      realization: i <= lastReportedIndex ? Number(b.actualPct) : null,
      baseline: baselineByIndex.get(b.index) ?? null,
    };

    // Add section plans and realizations
    visibleCurves.forEach((section) => {
      const sectionBucket = section.buckets.find((sb) => sb.index === b.index);
      if (sectionBucket) {
        // Show section plan as dashed line (always visible)
        point[`plan_${section.sectionId}`] = Number(sectionBucket.plannedPct);
        // Show section realization if available
        point[section.sectionId] =
          i <= lastReportedIndex ? Number(sectionBucket.actualPct) : null;
      }
    });

    return point;
  });

  return (
    <div className="space-y-4">
      {/* Section Selector */}
      {onToggleSection && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <span className="text-xs text-slate-400 mr-2">Section:</span>
          {sectionCurves.map((section) => {
            const isSelected = !selectedSections || selectedSections.includes(section.sectionId);
            return (
              <button
                key={section.sectionId}
                onClick={() => onToggleSection(section.sectionId)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
                  isSelected
                    ? "bg-slate-700/50 text-slate-200"
                    : "bg-slate-800/30 text-slate-500 hover:text-slate-400"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: section.color, opacity: isSelected ? 1 : 0.3 }}
                />
                {section.sectionName}
              </button>
            );
          })}
        </div>
      )}

      {/* Combined Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <Tooltip
            formatter={(value, name) => [value == null ? "—" : `${value}%`, String(name)]}
            labelFormatter={(label) => {
              const end = endDates.get(String(label));
              return end ? `${label} · s/d ${end}` : String(label);
            }}
            contentStyle={{
              background: "#081421",
              border: "1px solid rgba(148,163,184,0.16)",
              borderRadius: 12,
              color: "#e2e8f0",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {/* Baseline */}
          {baseline && (
            <Line
              type="monotone"
              dataKey="baseline"
              name={`Baseline — ${baseline.name}`}
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
            />
          )}

          {/* Combined Rencana & Realisasi */}
          <Line
            type="monotone"
            dataKey="rencana"
            name="Rencana (Total)"
            stroke="#0f766e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="realisasi"
            name="Realisasi (Total)"
            stroke="#d97706"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />

          {/* Per-section PLAN curves - show planned progress per section */}
          {visibleCurves.map((section) => (
            <Line
              key={`plan_${section.sectionId}`}
              type="monotone"
              dataKey={`plan_${section.sectionId}`}
              name={`${section.sectionName} (Rencana)`}
              stroke={section.color}
              strokeWidth={1}
              strokeDasharray="5 3"
              dot={false}
              connectNulls
            />
          ))}

          {/* Per-section realization curves */}
          {visibleCurves.map((section) => (
            <Line
              key={section.sectionId}
              type="monotone"
              dataKey={section.sectionId}
              name={section.sectionName}
              stroke={section.color}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Single section chart (for per-section view)
 */
function SingleSectionChart({
  buckets,
  color,
  lastReportedIndex,
}: {
  buckets: ScheduleBucket[];
  color: string;
  lastReportedIndex: number;
}) {
  const data = buckets.map((b, i) => ({
    name: `M${b.index}`,
    rencana: Number(b.plannedPct),
    realisasi: i <= lastReportedIndex ? Number(b.actualPct) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 10 }}
          stroke="#64748b"
          width={35}
        />
        <Tooltip
          formatter={(value, name) => [value == null ? "—" : `${value}%`, String(name)]}
          contentStyle={{
            background: "#081421",
            border: "1px solid rgba(148,163,184,0.16)",
            borderRadius: 8,
            color: "#e2e8f0",
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="rencana"
          name="Rencana"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="realisasi"
          name="Realisasi"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Original single S-curve chart (backward compatible)
 */
export function SCurveChart({
  buckets,
  lastReportedIndex,
  baselines = [],
}: {
  buckets: ScheduleBucket[];
  lastReportedIndex: number;
  baselines?: ScheduleBaseline[];
}) {
  const baseline = baselines[0];
  const baselineByIndex = new Map(
    (baseline?.buckets ?? []).map((b) => [b.index, Number(b.plannedPct)])
  );

  const data = buckets.map((b, i) => ({
    name: `M${b.index}`,
    rencana: Number(b.plannedPct),
    realizesi: i <= lastReportedIndex ? Number(b.actualPct) : null,
    baseline: baselineByIndex.get(b.index) ?? null,
  }));

  const endDates = new Map(buckets.map((b) => [`M${b.index}`, b.endDate]));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
        />
        <Tooltip
          formatter={(value, name) => [value == null ? "—" : `${value}%`, String(name)]}
          labelFormatter={(label) => {
            const end = endDates.get(String(label));
            return end ? `${label} · s/d ${end}` : String(label);
          }}
          contentStyle={{
            background: "#081421",
            border: "1px solid rgba(148,163,184,0.16)",
            borderRadius: 12,
            color: "#e2e8f0",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {baseline && (
          <Line
            type="monotone"
            dataKey="baseline"
            name={`Baseline — ${baseline.name}`}
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
        )}
        <Line
          type="monotone"
          dataKey="rencana"
          name="Rencana"
          stroke="#0f766e"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="realisasi"
          name="Realisasi"
          stroke="#d97706"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
