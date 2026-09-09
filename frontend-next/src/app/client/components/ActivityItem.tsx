"use client";

import { forwardRef, type ReactNode } from "react";
import clsx from "clsx";
import {
  TrendingUp,
  FileText,
  Image,
  Target,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Upload,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type ActivityType =
  | "progress"
  | "document"
  | "photo"
  | "milestone"
  | "comment"
  | "status"
  | "upload"
  | "default";

export interface ActivityItemProps {
  /** Activity type for icon and styling */
  type?: ActivityType;
  /** Activity icon (overrides default icon for type) */
  icon?: LucideIcon;
  /** Activity title/headline */
  title: string;
  /** Detailed description */
  description?: string;
  /** Timestamp string or Date */
  timestamp: string | Date;
  /** User who performed the action */
  user?: {
    name: string;
    avatar?: string;
  };
  /** Relative time display (auto-calculated if not provided) */
  relativeTime?: string;
  /** Optional link */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Show timeline connector */
  showConnector?: boolean;
  /** Is this the last item in the list */
  isLast?: boolean;
  /** Additional content */
  actions?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getActivityIcon(type: ActivityType): LucideIcon {
  switch (type) {
    case "progress":
      return TrendingUp;
    case "document":
      return FileText;
    case "photo":
      return Image;
    case "milestone":
      return Target;
    case "comment":
      return MessageSquare;
    case "status":
      return CheckCircle2;
    case "upload":
      return Upload;
    default:
      return AlertCircle;
  }
}

function getActivityColors(type: ActivityType): { bg: string; text: string; border: string } {
  switch (type) {
    case "progress":
      return { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" };
    case "document":
      return { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" };
    case "photo":
      return { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-200" };
    case "milestone":
      return { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-200" };
    case "comment":
      return { bg: "bg-cyan-100", text: "text-cyan-600", border: "border-cyan-200" };
    case "status":
      return { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200" };
    case "upload":
      return { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
  }
}

function getRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ============================================================================
// Component
// ============================================================================

/**
 * ActivityItem - Display an activity/update item with icon, description, and timestamp
 *
 * @example
 * ```tsx
 * <ActivityItem
 *   type="progress"
 *   title="Progress Update"
 *   description="Pekerjaan mencapai 75%"
 *   timestamp={new Date()}
 *   user={{ name: "Ahmad Wijaya" }}
 * />
 * ```
 */
export const ActivityItem = forwardRef<HTMLDivElement, ActivityItemProps>(
  (
    {
      type = "default",
      icon,
      title,
      description,
      timestamp,
      user,
      relativeTime,
      href,
      onClick,
      showConnector = true,
      isLast = false,
      actions,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const Icon = icon ?? getActivityIcon(type);
    const colors = getActivityColors(type);
    const time = relativeTime ?? getRelativeTime(timestamp);

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={clsx("relative flex gap-4", className)}
          role="status"
          aria-label="Loading activity"
        >
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            {showConnector && !isLast && (
              <div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-6 space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      );
    }

    const content = (
      <>
        {/* Timeline connector */}
        {showConnector && !isLast && (
          <div className="absolute left-5 top-12 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
        )}

        <div className="flex gap-4">
          {/* Icon */}
          <div
            className={clsx(
              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              colors.bg
            )}
            aria-hidden="true"
          >
            <Icon className={clsx("w-5 h-5", colors.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {/* Title */}
                <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                  {title}
                </h4>

                {/* Description */}
                {description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {description}
                  </p>
                )}

                {/* User info */}
                {user && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    oleh {user.name}
                  </p>
                )}

                {/* Actions */}
                {actions && (
                  <div className="mt-2">{actions}</div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                {time}
              </span>
            </div>
          </div>
        </div>
      </>
    );

    // Interactive wrapper
    const interactiveWrapper = (children: ReactNode) => {
      if (href) {
        return (
          <a
            href={href}
            className={clsx(
              "block transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 -m-2 p-2 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            )}
          >
            <span className="sr-only">View details for {title}</span>
            {children}
          </a>
        );
      }

      if (onClick) {
        return (
          <button
            onClick={onClick}
            className={clsx(
              "w-full text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 -m-2 p-2 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            )}
          >
            {children}
          </button>
        );
      }

      return <>{children}</>;
    };

    return (
      <div
        ref={ref}
        className={clsx("relative", className)}
      >
        {interactiveWrapper(content)}
      </div>
    );
  }
);

ActivityItem.displayName = "ActivityItem";

// ============================================================================
// Export
// ============================================================================

export default ActivityItem;
