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
 * Kurva S: bobot pekerjaan kumulatif terhadap waktu.
 *
 * Garis realisasi sengaja berhenti pada periode terakhir yang punya opname —
 * menariknya mendatar sampai akhir proyek akan terbaca seolah pekerjaan sudah
 * dilaporkan mandek, padahal datanya memang belum masuk.
 *
 * Baseline terbaru ikut digambar putus-putus supaya replan bisa langsung
 * dibandingkan dengan rencana yang disepakati di awal kontrak.
 */
export function SCurveChart({
  buckets,
  lastReportedIndex,
  baselines = [],
}: {
  buckets: ScheduleBucket[];
  /** Indeks periode tempat opname terakhir jatuh; -1 bila belum ada opname. */
  lastReportedIndex: number;
  baselines?: ScheduleBaseline[];
}) {
  const baseline = baselines[0];
  // Baseline dicocokkan lewat nomor periode, bukan urutan array: jadwal yang
  // memanjang membuat jumlah periodenya berbeda dari rencana awal.
  const baselineByIndex = new Map((baseline?.buckets ?? []).map((b) => [b.index, Number(b.plannedPct)]));

  const data = buckets.map((b, i) => ({
    name: `M${b.index}`,
    rencana: Number(b.plannedPct),
    realisasi: i <= lastReportedIndex ? Number(b.actualPct) : null,
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
