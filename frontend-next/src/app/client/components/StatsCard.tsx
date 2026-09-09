"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
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
}

// ============================================================================
// Component
// ============================================================================

/**
 * StatsCard - Display statistics with icon, label, value, and trend indicator
 *
 * @example
 * ```tsx
 * <StatsCard
 *   icon={DollarSign}
 *   label="Total Revenue"
 *   value="Rp 125.000.000"
 *   trend="up"
 *   trendValue="+12%"
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
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
    },
    ref
  ) => {
    const isInteractive = !!onClick;

    // Trend icon and colors
    const getTrendIcon = () => {
      switch (trend) {
        case "up":
          return <TrendingUp className="w-4 h-4" />;
        case "down":
          return <TrendingDown className="w-4 h-4" />;
        default:
          return <Minus className="w-4 h-4" />;
      }
    };

    const getTrendColors = () => {
      switch (trend) {
        case "up":
          return "text-emerald-600 bg-emerald-100";
        case "down":
          return "text-red-600 bg-red-100";
        default:
          return "text-slate-500 bg-slate-100";
      }
    };

    if (isLoading) {
      return (
        <div
          ref={ref}
          className={clsx(
            "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm",
            className
          )}
          role="status"
          aria-label={`Loading ${label}`}
        >
          <div className="animate-pulse space-y-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      );
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
          "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-all duration-200",
          isInteractive && [
            "cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600",
            "hover:scale-[1.02] active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
          ],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          {/* Icon */}
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              iconBg
            )}
            aria-hidden="true"
          >
            <Icon className={clsx("w-5 h-5", iconColor)} />
          </div>

          {/* Trend Badge */}
          {trend && trendValue && (
            <div
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                getTrendColors()
              )}
              aria-label={`Trend: ${trendValue}`}
            >
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate">
            {value}
          </p>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

StatsCard.displayName = "StatsCard";

// ============================================================================
// Export
// ============================================================================

export default StatsCard;
