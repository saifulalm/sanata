"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";

interface TrendData {
  value: number; // percentage change
  direction: "up" | "down" | "neutral";
  label?: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
  href?: string;
  tone?: "default" | "attention" | "success" | "danger";
  /** Data tren opsional untuk menampilkan perubahan periode sebelumnya */
  trend?: TrendData;
  /** Warna accent kustom */
  accentColor?: string;
  /** Aktifkan animasi counter */
  animated?: boolean;
}

/**
 * Versi enhanced dari StatCard dengan dukungan tren, animasi counter,
 * dan aksen warna kustom untuk dashboard yang lebih informatif.
 */
export function StatCard({
  label,
  value,
  icon,
  hint,
  href,
  tone = "default",
  trend,
  accentColor,
  animated = true,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animasi counter untuk angka
  useEffect(() => {
    if (!animated || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const numericValue = Number(value);
    const duration = 1000;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    setIsAnimating(true);
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), numericValue);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(numericValue);
        setIsAnimating(false);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, animated]);

  const attention = tone === "attention";
  const success = tone === "success";
  const danger = tone === "danger";

  // Tentukan warna aksen
  const getAccentColors = () => {
    if (accentColor) return accentColor;
    if (danger) return "cyan";
    if (success) return "emerald";
    if (attention) return "amber";
    return "cyan";
  };

  const accent = getAccentColors();

  const accentClasses: Record<string, { border: string; bg: string; text: string }> = {
    cyan: {
      border: "border-cyan-300/20",
      bg: "bg-cyan-300/10",
      text: "text-cyan-200",
    },
    amber: {
      border: "border-amber-400/20",
      bg: "bg-amber-500/12",
      text: "text-amber-100",
    },
    emerald: {
      border: "border-emerald-400/20",
      bg: "bg-emerald-500/12",
      text: "text-emerald-200",
    },
    red: {
      border: "border-red-400/20",
      bg: "bg-red-500/10",
      text: "text-red-200",
    },
  };

  const colors = accentClasses[accent] || accentClasses.cyan;

  const body = (
    <div
      className={`relative flex h-full flex-col justify-between gap-4 rounded-2xl border p-5 transition-all duration-300 ${
        attention
          ? `${colors.border} ${colors.bg}`
          : danger
          ? "border-red-400/20 bg-red-500/10"
          : success
          ? "border-emerald-400/20 bg-emerald-500/10"
          : "border-white/10 bg-white/[0.04]"
      } ${href ? "hover:border-cyan-300/30 hover:shadow-[0_0_40px_rgba(56,189,248,0.1)] cursor-pointer" : ""}`}
    >
      {/* Background glow effect */}
      {attention && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-400/5 to-transparent opacity-50" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>
          <p
            className={`mt-2 truncate text-2xl font-bold tracking-tight ${
              isAnimating ? "tabular-nums" : ""
            } ${
              attention
                ? colors.text
                : danger
                ? "text-red-200"
                : success
                ? "text-emerald-200"
                : "text-white"
            }`}
          >
            {displayValue}
          </p>
          {hint && (
            <p className="mt-1.5 truncate text-xs text-slate-500">{hint}</p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            attention
              ? colors.bg
              : danger
              ? "bg-red-500/15"
              : success
              ? "bg-emerald-500/15"
              : "bg-cyan-300/10"
          }`}
        >
          <div className={colors.text}>{icon}</div>
        </div>
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-2">
          <TrendBadge trend={trend} />
          {trend.label && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
              {trend.label}
            </span>
          )}
        </div>
      )}

      {/* Subtle bottom border glow */}
      <div
        className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-${
          attention ? "amber" : accent
        }-400/20 to-transparent`}
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {body}
      </a>
    );
  }

  return body;
}

function TrendBadge({ trend }: { trend: TrendData }) {
  const Icon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
      ? TrendingDown
      : Minus;

  const colors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-slate-400",
  };

  const bgColors = {
    up: "bg-emerald-500/10",
    down: "bg-red-500/10",
    neutral: "bg-slate-500/10",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${bgColors[trend.direction]} px-2 py-1 text-xs font-medium ${colors[trend.direction]}`}
    >
      <Icon size={12} />
      <span>{Math.abs(trend.value)}%</span>
    </span>
  );
}

// Komponen mini stat untuk grid kecil
export function MiniStat({
  label,
  value,
  icon,
  accentColor = "cyan",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accentColor?: "cyan" | "amber" | "emerald" | "red";
}) {
  const Icon = icon;
  const colors = {
    cyan: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20",
    amber: "text-amber-300 bg-amber-300/10 border-amber-300/20",
    emerald: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
    red: "text-red-300 bg-red-300/10 border-red-300/20",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${colors[accentColor]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
