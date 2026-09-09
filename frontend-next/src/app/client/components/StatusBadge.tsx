"use client";

import { forwardRef } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Ban,
  PauseCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type StatusVariant =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "pending"
  | "neutral"
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "paused";

export interface StatusBadgeProps {
  /** Status variant for colors and icon */
  variant?: StatusVariant;
  /** Custom status text */
  label: string;
  /** Show icon (default: true) */
  showIcon?: boolean;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Dot only (no text) */
  dotOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusConfig(variant: StatusVariant): {
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon;
  dotClass: string;
} {
  switch (variant) {
    case "success":
    case "completed":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-500/30",
        icon: CheckCircle2,
        dotClass: "bg-emerald-500",
      };
    case "info":
    case "active":
      return {
        bg: "bg-blue-50 dark:bg-blue-500/10",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-500/30",
        icon: CheckCircle2,
        dotClass: "bg-blue-500",
      };
    case "warning":
    case "pending":
      return {
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-500/30",
        icon: Clock,
        dotClass: "bg-amber-500",
      };
    case "error":
    case "cancelled":
      return {
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-500/30",
        icon: XCircle,
        dotClass: "bg-red-500",
      };
    case "draft":
    case "neutral":
      return {
        bg: "bg-slate-100 dark:bg-slate-500/10",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-200 dark:border-slate-500/30",
        icon: FileText,
        dotClass: "bg-slate-500",
      };
    case "paused":
      return {
        bg: "bg-purple-50 dark:bg-purple-500/10",
        text: "text-purple-700 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-500/30",
        icon: PauseCircle,
        dotClass: "bg-purple-500",
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-500/10",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-200 dark:border-slate-500/30",
        icon: AlertCircle,
        dotClass: "bg-slate-500",
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * StatusBadge - Display a status indicator with icon and colored background
 *
 * @example
 * ```tsx
 * // Basic usage
 * <StatusBadge label="Completed" variant="success" />
 *
 * // With icon
 * <StatusBadge label="In Progress" variant="info" icon={Loader2} />
 *
 * // Size variants
 * <StatusBadge label="Draft" variant="neutral" size="sm" />
 *
 * // Dot only
 * <StatusBadge label="Active" variant="active" dotOnly />
 * ```
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      variant = "neutral",
      label,
      showIcon = true,
      icon,
      size = "md",
      dotOnly = false,
      className,
    },
    ref
  ) => {
    const config = getStatusConfig(variant);
    const Icon = icon ?? config.icon;

    // Size classes
    const sizeClasses = {
      sm: dotOnly ? "w-2 h-2" : "px-2 py-0.5 text-xs",
      md: dotOnly ? "w-2.5 h-2.5" : "px-2.5 py-1 text-xs",
      lg: dotOnly ? "w-3 h-3" : "px-3 py-1.5 text-sm",
    };

    // Icon size classes
    const iconSizeClasses = {
      sm: "w-3 h-3",
      md: "w-3.5 h-3.5",
      lg: "w-4 h-4",
    };

    // Dot-only mode
    if (dotOnly) {
      return (
        <span
          ref={ref}
          className={clsx(
            "inline-block rounded-full",
            config.dotClass,
            sizeClasses[size],
            className
          )}
          role="status"
          aria-label={label}
        />
      );
    }

    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-1.5 font-medium rounded-full border",
          config.bg,
          config.text,
          config.border,
          sizeClasses[size],
          className
        )}
        role="status"
      >
        {showIcon && <Icon className={iconSizeClasses[size]} aria-hidden="true" />}
        <span>{label}</span>
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

// ============================================================================
// Variant: StatusDot
// ============================================================================

export interface StatusDotProps {
  variant?: StatusVariant;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

/**
 * StatusDot - Simple colored dot indicator
 *
 * @example
 * ```tsx
 * <StatusDot variant="success" pulse />
 * ```
 */
export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  (
    {
      variant = "neutral",
      size = "md",
      pulse = false,
      className,
    },
    ref
  ) => {
    const config = getStatusConfig(variant);

    const sizeClasses = {
      sm: "w-1.5 h-1.5",
      md: "w-2 h-2",
      lg: "w-2.5 h-2.5",
    };

    return (
      <span
        ref={ref}
        className={clsx(
          "inline-block rounded-full",
          config.dotClass,
          sizeClasses[size],
          pulse && "animate-pulse",
          className
        )}
        role="status"
        aria-label={variant}
      />
    );
  }
);

StatusDot.displayName = "StatusDot";

// ============================================================================
// Export
// ============================================================================

export default StatusBadge;
