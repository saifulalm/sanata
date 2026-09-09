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
import type { ScheduleBucket } from "@/lib/estimation";

/**
 * Multi-S Curve Chart
 * Menampilkan beberapa S-curve dalam satu chart dengan X-axis dinormalisasi
 * ke percentage-based (0-100% project progress)
 */
export function MultiSCurveChart({
  schedules,
  selectedIds,
  onToggle,
}: {
  schedules: Array<{
    id: string;
    number: string;
    title: string;
    buckets: ScheduleBucket[];
  }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  // Color palette untuk multiple curves
  const COLORS = ["#0f766e", "#d97706", "#7c3aed", "#dc2626", "#2563eb", "#059669", "#ea580c", "#8b5cf6"];

  // Generate normalized data points (0-100% progress)
  const chartData = generateChartData(schedules, selectedIds);

  if (schedules.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-slate-400">
        Pilih RAB untuk membandingkan kurva S
      </div>
    );
  }

  const visibleSchedules = schedules.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-4">
      {/* Selection Checkboxes */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <span className="text-sm text-slate-400">Pilih RAB:</span>
        {schedules.map((schedule, index) => (
          <label
            key={schedule.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
              selectedIds.includes(schedule.id)
                ? "border-teal-500/50 bg-teal-500/10 text-teal-300"
                : "border-slate-600/50 bg-slate-700/30 text-slate-400 opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(schedule.id)}
              onChange={() => onToggle(schedule.id)}
              className="rounded border-slate-500 bg-slate-700 text-teal-500 focus:ring-teal-500/50"
            />
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm font-medium whitespace-nowrap">{schedule.number}</span>
          </label>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="x"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            label={{ value: "Rencana Progress", position: "insideBottom", offset: -5, fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11 }}
            stroke="#64748b"
            label={{ value: "Realisasi", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            labelFormatter={(label: number) => `Rencana: ${label}%`}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 12,
              color: "#e2e8f0",
            }}
          />
          <Legend
            formatter={(value: string) => value}
            wrapperStyle={{ fontSize: 11 }}
          />
          {visibleSchedules.map((schedule, index) => {
            const color = COLORS[schedules.findIndex((s) => s.id === schedule.id) % COLORS.length];
            return (
              <Line
                key={schedule.id}
                type="monotone"
                dataKey={schedule.id}
                name={schedule.number}
                stroke={color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Generate chart data with normalized X-axis (0-100% progress)
 */
function generateChartData(
  schedules: Array<{ id: string; buckets: ScheduleBucket[] }>,
  selectedIds: string[]
): Array<Record<string, number | string>> {
  if (schedules.length === 0) return [];

  // Generate 21 points from 0-100%
  const xPoints = Array.from({ length: 21 }, (_, i) => i * 5);

  return xPoints.map((x) => {
    const point: Record<string, number | string> = { x };

    schedules.forEach((schedule) => {
      if (!selectedIds.includes(schedule.id)) return;

      const dataPoints = schedule.buckets.map((b) => ({
        x: b.cumulativePlanned,
        y: b.cumulativeActual,
      }));

      if (dataPoints.length === 0) {
        point[schedule.id] = 0;
        return;
      }

      // Linear interpolation
      const idx = dataPoints.findIndex((d) => d.x >= x);
      if (idx === 0) {
        point[schedule.id] = dataPoints[0].y;
      } else if (idx === -1) {
        point[schedule.id] = dataPoints[dataPoints.length - 1]?.y ?? 0;
      } else {
        const p1 = dataPoints[idx - 1];
        const p2 = dataPoints[idx];
        const t = (x - p1.x) / (p2.x - p1.x || 1);
        point[schedule.id] = p1.y + t * (p2.y - p1.y);
      }
    });

    return point;
  });
}
