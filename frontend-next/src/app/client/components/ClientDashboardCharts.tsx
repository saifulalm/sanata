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
import clsx from "clsx";

// Color constants for client portal
const CHART_COLORS = {
  primary: "#2563eb", // blue-600
  secondary: "#0891b2", // cyan-600
  success: "#10b981", // emerald-500
  warning: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500
  purple: "#8b5cf6", // violet-500
  pink: "#ec4899", // pink-500
  gray: "#6b7280", // gray-500
};

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
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 px-4 py-3 shadow-xl backdrop-blur-xl">
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {entry.value.toLocaleString("id-ID")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Completion Donut Chart
// ============================================================

interface CompletionChartProps {
  completed: number;
  inProgress: number;
  notStarted: number;
}

export function CompletionChart({ completed, inProgress, notStarted }: CompletionChartProps) {
  const data = [
    { name: "Selesai", value: completed, color: CHART_COLORS.success },
    { name: "Berjalan", value: inProgress, color: CHART_COLORS.primary },
    { name: "Belum", value: notStarted, color: CHART_COLORS.gray },
  ].filter(d => d.value > 0);

  const total = completed + inProgress + notStarted;
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {completedPercent}%
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Selesai
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-slate-500 dark:text-slate-400">{s.name}</span>
            <span className="font-medium text-slate-900 dark:text-white">
              ({s.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Progress Area Chart
// ============================================================

interface ProgressChartProps {
  data: Array<{ month: string; planned: number; actual: number }>;
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="planned"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          fill="url(#plannedGradient)"
          name="Rencana"
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke={CHART_COLORS.success}
          strokeWidth={2}
          fill="url(#actualGradient)"
          name="Aktual"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Budget Bar Chart
// ============================================================

interface BudgetChartProps {
  data: Array<{ name: string; budget: number; spent: number }>;
}

export function BudgetChart({ data }: BudgetChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
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
        <Bar dataKey="budget" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="Anggaran" />
        <Bar dataKey="spent" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} name="Terpakai" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Mini Sparkline
// ============================================================

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline({ data, color = CHART_COLORS.primary, height = 32, className }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
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

// ============================================================
// Engagement Gauge (circular progress)
// ============================================================

interface EngagementGaugeProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  className?: string;
}

export function EngagementGauge({
  value,
  max = 100,
  label,
  size = 96,
  className,
}: EngagementGaugeProps) {
  const percent = Math.min((value / max) * 100, 100);
  const circumference = (size * 0.8) * 2 * Math.PI; // radius is 40% of size
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={clsx("relative inline-flex items-center justify-center", className)}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 8) / 2}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={8}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 8) / 2}
          fill="none"
          stroke={CHART_COLORS.primary}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 4px ${CHART_COLORS.primary}50)`,
            transition: "stroke-dashoffset 0.5s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {Math.round(percent)}%
        </span>
        {label && (
          <span className="text-[9px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
