"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";

// Color constants
const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "#38bdf8",
  DRAFT: "#f59e0b",
  ARCHIVED: "#f87171",
  NEW: "#fbbf24",
  CONTACTED: "#60a5fa",
  CLOSED: "#6b7280",
  APPROVED: "#34d399",
  REJECTED: "#f87171",
  PENDING: "#a78bfa",
};

const CHART_COLORS = [
  "#38bdf8", // cyan
  "#fbbf24", // amber
  "#34d399", // emerald
  "#f87171", // red
  "#a78bfa", // purple
  "#f472b6", // pink
  "#22d3ee", // cyan light
  "#fb923c", // orange
];

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#081421]/95 px-4 py-3 shadow-xl backdrop-blur-xl">
      {label && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value.toLocaleString("id-ID")}</span>
        </div>
      ))}
    </div>
  );
}

// Content Status Donut Chart
export function ContentStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {data.map((s, i) => (
          <div key={s.status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: STATUS_COLORS[s.status] ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-slate-400">{s.status}</span>
            <span className="font-medium text-white">({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top Content Bar Chart (horizontal)
export function TopContentChart({ data }: { data: { title: string; views: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.12)" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="title"
          width={80}
          tick={{ fontSize: 10, fill: "#cbd5e1" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="views"
          fill="#38bdf8"
          radius={[0, 6, 6, 0]}
          background={{ fill: "rgba(56,189,248,0.05)", radius: [0, 6, 6, 0] } as Record<string, unknown>}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Inquiry Status Doughnut Chart
export function InquiryStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{total}</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Pesan</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((s, i) => (
          <div key={s.status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: STATUS_COLORS[s.status] ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-slate-400">{s.status}:</span>
            <span className="font-medium text-white">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// RAB Pipeline Funnel Chart
export function RabPipelineChart({
  data,
}: {
  data: { status: string; count: number; total: string }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const widthPercent = (item.count / maxCount) * 100;
        return (
          <div key={item.status}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">{item.status}</span>
              <span className="font-medium text-white">
                {item.count} · Rp {(Number(item.total) / 1000000000).toFixed(1)}M
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${
                    STATUS_COLORS[item.status] ?? CHART_COLORS[index % CHART_COLORS.length]
                  }, ${STATUS_COLORS[item.status] ?? CHART_COLORS[index % CHART_COLORS.length]}80)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Activity Timeline Chart
export function ActivityChart({
  data,
}: {
  data: Array<{ date: string; activities: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="activities"
          stroke="#38bdf8"
          strokeWidth={2}
          fill="url(#activityGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Mini sparkline for inline trends
export function Sparkline({
  data,
  color = "#38bdf8",
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Engagement Gauge (circular progress)
export function EngagementGauge({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percent = Math.min((value / max) * 100, 100);
  const angle = (percent / 100) * 360;

  return (
    <div className="relative h-24 w-24">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * 251.2} 251.2`}
          style={{
            filter: "drop-shadow(0 0 6px rgba(56,189,248,0.5))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{Math.round(percent)}%</span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400">{label}</span>
      </div>
    </div>
  );
}

// Multi-series comparison chart
export function ComparisonChart({
  data,
  dataKeys,
}: {
  data: Array<Record<string, string | number>>;
  dataKeys: Array<{ key: string; color: string; name: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 10, right: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
          iconType="circle"
          iconSize={8}
        />
        {dataKeys.map((dk) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            fill={dk.color}
            radius={[4, 4, 0, 0]}
            name={dk.name}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
