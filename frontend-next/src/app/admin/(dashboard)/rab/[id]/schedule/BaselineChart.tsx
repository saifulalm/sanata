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
import type { ScheduleBucket, ScheduleBaseline } from "@/lib/estimation";

/**
 * Baseline chart: perbandingan kumulatif rencana vs realized per periode.
 * Fokus pada gap antara planned dan actual — untuk panel "Baseline".
 */
export function BaselineChart({
  buckets,
  baselines = [],
}: {
  buckets: ScheduleBucket[];
  baselines?: ScheduleBaseline[];
}) {
  const baseline = baselines[0];
  const baselineByIndex = new Map(
    (baseline?.buckets ?? []).map((b) => [b.index, Number(b.plannedPct)])
  );
  const data = buckets.map((b) => ({
    name: `M${b.index}`,
    rencana: Number(b.plannedPct),
    realized: Number(b.actualPct),
    cumulativePlanned: Number(b.cumulativePlanned),
    cumulativeActual: Number(b.cumulativeActual),
    baseline: baselineByIndex.get(b.index) ?? null,
  }));

  const endDates = new Map(buckets.map((b) => [`M${b.index}`, b.endDate]));

  return (
    <ResponsiveContainer width="100%" height={300}>
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
          formatter={(value, name) => {
            if (value == null) return ["—", String(name)];
            const num = Number(value);
            if (name === "rencana" || name === "realized") return [`${num.toFixed(1)}%`, name === "rencana" ? "Rencana (%)" : "Realisasi (%)"];
            return [num.toLocaleString("id-ID"), name === "cumulativePlanned" ? "Kumulatif Rencana" : name === "cumulativeActual" ? "Kumulatif Aktual" : String(name)];
          }}
          labelFormatter={(label: string) => {
            const end = endDates.get(String(label));
            return end ? `${label} · s/d ${end}` : String(label);
          }}
          contentStyle={{
            background: "#081421",
            border: "1px solid rgba(148,163,184,0.16)",
            borderRadius: 12,
            color: "#e2e8f0",
            fontSize: 12,
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
          name="Rencana (%)"
          stroke="#0f766e"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="realized"
          name="Realisasi (%)"
          stroke="#d97706"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="cumulativePlanned"
          name="Kumulatif Rencana"
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="cumulativeActual"
          name="Kumulatif Aktual"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
