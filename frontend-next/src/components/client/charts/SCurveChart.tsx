"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

export interface SCurveDataPoint {
  date: string;
  planned: number;
  actual: number;
  cumulativePlanned: number;
  cumulativeActual: number;
}

export interface SCurveSection {
  sectionId: string;
  sectionName: string;
  data: SCurveDataPoint[];
  color: string;
  currentProgress: number;
}

interface SCurveChartProps {
  /** Combined data (all sections) */
  data: SCurveDataPoint[];
  /** Section-level data for multi-section view */
  sections?: SCurveSection[];
  /** Show section breakdown */
  showSections?: boolean;
  /** Selected sections to highlight */
  selectedSections?: string[];
  /** Toggle section visibility */
  onToggleSection?: (sectionId: string) => void;
  /** Height of chart */
  height?: number;
  /** Title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
}

type ChartPoint = SCurveDataPoint & {
  x: number;
  yPlanned: number;
  yActual: number;
};

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

export function SCurveChart({
  data,
  sections = [],
  showSections = false,
  selectedSections,
  onToggleSection,
  height = 320,
  title = "Kurva S - Rencana vs Realisasi",
  subtitle = "Perbandingan progress rencana dan aktual",
}: SCurveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 800;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Generate path for a curve
  const generatePath = (points: { x: number; y: number }[], smooth = true) => {
    if (points.length < 2) return "";
    
    if (smooth) {
      // Smooth S-curve using bezier approximation
      return points.reduce((path, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        
        const prev = points[i - 1];
        const cp1x = prev.x + (point.x - prev.x) / 3;
        const cp1y = prev.y;
        const cp2x = point.x - (point.x - prev.x) / 3;
        const cp2y = point.y;
        
        return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
      }, "");
    }
    
    return points.reduce((path, point, i) => {
      return i === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
    }, "");
  };

  // Transform data to chart coordinates
  const transformData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const maxX = data.length - 1;
    const maxY = 100;
    
    return data.map((point, i) => ({
      ...point,
      x: padding.left + (i / maxX) * plotWidth,
      yPlanned: padding.top + plotHeight - (point.cumulativePlanned / maxY) * plotHeight,
      yActual: padding.top + plotHeight - (point.cumulativeActual / maxY) * plotHeight,
    }));
  }, [data, padding, plotWidth, plotHeight]);

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100];

  // Calculate stats
  const stats = useMemo(() => {
    if (transformData.length === 0) {
      return { planned: 0, actual: 0, deviation: 0, status: "on_track" as const };
    }
    
    const lastPoint = transformData[transformData.length - 1];
    const planned = lastPoint.cumulativePlanned;
    const actual = lastPoint.cumulativeActual;
    const deviation = actual - planned;
    
    return {
      planned,
      actual,
      deviation,
      status: deviation >= 0 ? ("on_track" as const) : ("delayed" as const),
    };
  }, [transformData]);

  // Filter visible sections
  const visibleSections = sections.filter(
    (s) => !selectedSections || selectedSections.includes(s.sectionId)
  );

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 012 2h2a2 2 0 012-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 012 2h2a2 2 0 012-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4" />
            </svg>
            <p>Data progress belum tersedia</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded" />
            <span className="text-slate-600 dark:text-slate-400">Rencana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded" />
            <span className="text-slate-600 dark:text-slate-400">Realisasi</span>
          </div>
        </div>
      </div>

      {/* Section Filter */}
      {showSections && sections.length > 0 && onToggleSection && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
          <span className="text-xs text-slate-500 mr-2">Section:</span>
          {sections.map((section, idx) => {
            const isSelected = !selectedSections || selectedSections.includes(section.sectionId);
            return (
              <button
                key={section.sectionId}
                onClick={() => onToggleSection(section.sectionId)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isSelected
                    ? "bg-slate-700/80 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: section.color,
                    opacity: isSelected ? 1 : 0.4,
                  }}
                />
                {section.sectionName.length > 20
                  ? section.sectionName.slice(0, 20) + "..."
                  : section.sectionName}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="plannedGradientClient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="actualGradientClient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={padding.top + plotHeight - (tick / 100) * plotHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + plotHeight - (tick / 100) * plotHeight}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 8}
                y={padding.top + plotHeight - (tick / 100) * plotHeight + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* X-axis labels (show first, middle, last) */}
          {[0, Math.floor(transformData.length / 2), transformData.length - 1].map((idx) => {
            const point = transformData[idx];
            if (!point) return null;
            return (
              <text
                key={idx}
                x={point.x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] hidden sm:block"
              >
                {point.date.slice(5)}
              </text>
            );
          })}

          {/* Planned curve */}
          <path
            d={generatePath(transformData.map((p) => ({ x: p.x, y: p.yPlanned })))}
            fill="none"
            stroke="url(#plannedGradientClient)"
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Actual curve */}
          <path
            d={generatePath(transformData.map((p) => ({ x: p.x, y: p.yActual })))}
            fill="none"
            stroke="url(#actualGradientClient)"
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Section curves (if enabled) */}
          {showSections &&
            visibleSections.map((section, sectionIdx) => {
              const sectionPoints = section.data.map((p, i) => ({
                x: padding.left + (i / (section.data.length - 1 || 1)) * plotWidth,
                y: padding.top + plotHeight - (p.cumulativePlanned / 100) * plotHeight,
              }));
              return (
                <path
                  key={section.sectionId}
                  d={generatePath(sectionPoints)}
                  fill="none"
                  stroke={section.color}
                  strokeWidth={2}
                  strokeDasharray="6,3"
                  strokeOpacity={0.6}
                />
              );
            })}

          {/* Hover dots */}
          {transformData.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.yActual}
              r={hoveredPoint === point ? 6 : 4}
              fill="#10b981"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Tooltip */}
          {hoveredPoint && (
            <g>
              <rect
                x={hoveredPoint.x - 80}
                y={padding.top - 10}
                width={160}
                height={60}
                rx={8}
                fill="#1e293b"
                fillOpacity={0.95}
              />
              <text x={hoveredPoint.x} y={padding.top + 8} textAnchor="middle" fill="#e2e8f0" fontSize={10}>
                {hoveredPoint.date}
              </text>
              <text x={hoveredPoint.x} y={padding.top + 24} textAnchor="middle" fill="#60a5fa" fontSize={11} fontWeight={600}>
                Rencana: {hoveredPoint.cumulativePlanned.toFixed(1)}%
              </text>
              <text x={hoveredPoint.x} y={padding.top + 40} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight={600}>
                Aktual: {hoveredPoint.cumulativeActual.toFixed(1)}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Rencana</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.planned.toFixed(1)}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Realisasi</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.actual.toFixed(1)}%
          </p>
        </div>
        <div className={clsx(
          "p-4 rounded-xl border",
          stats.deviation >= 0
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
            : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
        )}>
          <p className="text-xs font-medium mb-1">Deviasi</p>
          <p className={clsx(
            "text-2xl font-bold",
            stats.deviation >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          )}>
            {stats.deviation >= 0 ? "+" : ""}{stats.deviation.toFixed(1)}%
          </p>
        </div>
        <div className={clsx(
          "p-4 rounded-xl border",
          stats.status === "on_track"
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
            : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
        )}>
          <p className="text-xs font-medium mb-1">Status</p>
          <p className={clsx(
            "text-lg font-bold",
            stats.status === "on_track"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          )}>
            {stats.status === "on_track" ? "✓ On Track" : "⚠ Delayed"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SCurveChart;
