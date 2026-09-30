"use client";

import { forwardRef, type ReactNode } from "react";
import clsx from "clsx";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type StatsCardTrend = "up" | "down" | "neutral";

export interface StatsCardProps {
  /** Icon component to display */
  icon: LucideIcon;
  /** Label text above the value */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Trend direction */
  trend?: StatsCardTrend;
  /** Trend value text (e.g., "+12%") */
  trendValue?: string;
  /** Optional description text */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Click handler - makes the card interactive */
  onClick?: () => void;
  /** Custom icon color class */
  iconColor?: string;
  /** Custom icon background class */
  iconBg?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show trend indicator */
  showTrend?: boolean;
}

// ============================================================================
// Trend Indicator Component
// ============================================================================

function TrendIndicator({ trend, value }: { trend?: StatsCardTrend; value?: string }) {
  if (!trend || !value) return null;

  const getIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "down":
        return <TrendingDown className="w-3.5 h-3.5" />;
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  const getColors = () => {
    switch (trend) {
      case "up":
        return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10";
      case "down":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10";
      default:
        return "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-500/10";
    }
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        getColors()
      )}
    >
      {getIcon()}
      <span>{value}</span>
    </div>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function StatsCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heights = { sm: "h-28", md: "h-36", lg: "h-44" };

  return (
    <div className={clsx("rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 p-5 animate-pulse", heights[size])}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="w-14 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className={clsx("h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded", size === "lg" && "h-8 w-32")} />
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ClientStatsCard - Modern statistics card for client portal dashboard
 * 
 * @example
 * ```tsx
 * <ClientStatsCard
 *   icon={Building2}
 *   label="Total Proyek"
 *   value={12}
 *   trend="up"
 *   trendValue="+12%"
 *   description="vs bulan lalu"
 *   onClick={() => navigate("/projects")}
 * />
 * ```
 */
export const ClientStatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      icon: Icon,
      label,
      value,
      trend,
      trendValue,
      description,
      isLoading = false,
      onClick,
      iconColor = "text-blue-600",
      iconBg = "bg-blue-100",
      className,
      size = "md",
      showTrend = true,
    },
    ref
  ) => {
    const isInteractive = !!onClick;

    // Size variants
    const sizeStyles = {
      sm: { padding: "p-4", iconSize: "w-9 h-9", valueSize: "text-2xl" },
      md: { padding: "p-5", iconSize: "w-10 h-10", valueSize: "text-3xl" },
      lg: { padding: "p-6", iconSize: "w-12 h-12", valueSize: "text-4xl" },
    };

    if (isLoading) {
      return <StatsCardSkeleton size={size} />;
    }

    return (
      <div
        ref={ref}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={clsx(
          "group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300",
          sizeStyles[size].padding,
          isInteractive && [
            "cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200/50 dark:hover:border-blue-700/50",
            "hover:-translate-y-1 active:translate-y-0",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
          ],
          className
        )}
      >
        {/* Background decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            {/* Icon */}
            <div
              className={clsx(
                "rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                iconBg,
                sizeStyles[size].iconSize
              )}
              aria-hidden="true"
            >
              <Icon className={clsx("text-current", size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6")} />
            </div>

            {/* Trend Badge */}
            {showTrend && trend && trendValue && (
              <TrendIndicator trend={trend} value={trendValue} />
            )}
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              {label}
            </p>
            <p
              className={clsx(
                "font-bold text-slate-900 dark:text-white tracking-tight truncate",
                sizeStyles[size].valueSize
              )}
            >
              {value}
            </p>
            {description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ClientStatsCard.displayName = "ClientStatsCard";

// ============================================================================
// Export
// ============================================================================

export default ClientStatsCard;
