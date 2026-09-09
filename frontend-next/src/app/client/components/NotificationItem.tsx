"use client";

import { forwardRef, type ReactNode } from "react";
import clsx from "clsx";
import {
  Bell,
  FileText,
  Image,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Mail,
  Download,
  X,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "@/lib/clientPortal";

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "progress"
  | "document"
  | "photo"
  | "message"
  | "system";

export interface NotificationItemProps {
  /** Notification ID */
  id: string;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification type for styling */
  type?: NotificationType;
  /** Custom icon (overrides type icon) */
  icon?: LucideIcon;
  /** Timestamp */
  timestamp: string | Date;
  /** Is read status */
  isRead?: boolean;
  /** Link URL */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Mark as read handler */
  onMarkAsRead?: () => void;
  /** Action buttons */
  actions?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNotificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "error":
      return X;
    case "progress":
      return TrendingUp;
    case "document":
      return FileText;
    case "photo":
      return Image;
    case "message":
      return MessageSquare;
    case "system":
      return Settings;
    default:
      return Bell;
  }
}

function getNotificationColors(type: NotificationType): {
  bg: string;
  text: string;
  dotColor: string;
} {
  switch (type) {
    case "success":
      return { bg: "bg-emerald-100", text: "text-emerald-600", dotColor: "bg-emerald-500" };
    case "warning":
      return { bg: "bg-amber-100", text: "text-amber-600", dotColor: "bg-amber-500" };
    case "error":
      return { bg: "bg-red-100", text: "text-red-600", dotColor: "bg-red-500" };
    case "progress":
      return { bg: "bg-blue-100", text: "text-blue-600", dotColor: "bg-blue-500" };
    case "document":
      return { bg: "bg-purple-100", text: "text-purple-600", dotColor: "bg-purple-500" };
    case "photo":
      return { bg: "bg-pink-100", text: "text-pink-600", dotColor: "bg-pink-500" };
    case "message":
      return { bg: "bg-cyan-100", text: "text-cyan-600", dotColor: "bg-cyan-500" };
    case "system":
      return { bg: "bg-slate-100", text: "text-slate-600", dotColor: "bg-slate-500" };
    default:
      return { bg: "bg-blue-100", text: "text-blue-600", dotColor: "bg-blue-500" };
  }
}

function getRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari`;

  return formatDate(dateStr, "short");
}

// ============================================================================
// Component
// ============================================================================

/**
 * NotificationItem - Display a notification with icon, message, timestamp, and actions
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   id="notif-1"
 *   title="Progress Update"
 *   message="Pekerjaan mencapai 75%"
 *   type="progress"
 *   timestamp={new Date()}
 *   isRead={false}
 *   onClick={() => handleClick('notif-1')}
 * />
 *
 * // With actions
 * <NotificationItem
 *   title="Dokumen baru"
 *   message="Gambar arsitektur revisi telah diupload"
 *   type="document"
 *   onMarkAsRead={() => markAsRead(id)}
 *   onDismiss={() => dismissNotification(id)}
 * />
 * ```
 */
export const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(
  (
    {
      id,
      title,
      message,
      type = "info",
      icon,
      timestamp,
      isRead = false,
      href,
      onClick,
      onDismiss,
      onMarkAsRead,
      actions,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const Icon = icon ?? getNotificationIcon(type);
    const colors = getNotificationColors(type);
    const time = getRelativeTime(timestamp);

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={clsx(
            "flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg",
            className
          )}
          role="status"
          aria-label="Loading notification"
        >
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      );
    }

    const content = (
      <div
        className={clsx(
          "flex items-start gap-3 p-3 rounded-lg transition-colors",
          !isRead && "bg-blue-50/50 dark:bg-blue-500/5",
          onClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
      >
        {/* Icon */}
        <div
          className={clsx(
            "relative w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            colors.bg
          )}
        >
          <Icon className={clsx("w-5 h-5", colors.text)} aria-hidden="true" />

          {/* Unread indicator */}
          {!isRead && (
            <span
              className={clsx(
                "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800",
                colors.dotColor
              )}
              aria-label="Unread"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4
                className={clsx(
                  "text-sm leading-tight",
                  isRead
                    ? "text-slate-600 dark:text-slate-400"
                    : "font-semibold text-slate-900 dark:text-white"
                )}
              >
                {title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {message}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{time}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {onMarkAsRead && !isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  className={clsx(
                    "p-1.5 rounded-lg transition-colors",
                    "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  )}
                  aria-label="Mark as read"
                  title="Tandai sudah dibaca"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className={clsx(
                    "p-1.5 rounded-lg transition-colors",
                    "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  )}
                  aria-label="Dismiss notification"
                  title="Hapus"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Custom actions */}
          {actions && (
            <div className="mt-2 flex items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
    );

    // Wrap with link or button handler
    if (href) {
      return (
        <div ref={ref} className={className}>
          <a
            href={href}
            className={clsx(
              "block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-lg"
            )}
          >
            <span className="sr-only">View: {title}</span>
            {content}
          </a>
        </div>
      );
    }

    if (onClick) {
      return (
        <div ref={ref} className={className}>
          <button
            onClick={onClick}
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-lg"
          >
            <span className="sr-only">View: {title}</span>
            {content}
          </button>
        </div>
      );
    }

    return (
      <div ref={ref} className={className}>
        {content}
      </div>
    );
  }
);

NotificationItem.displayName = "NotificationItem";

// ============================================================================
// Notification Group Component
// ============================================================================

export interface NotificationGroupProps {
  title?: string;
  children: ReactNode;
  emptyMessage?: string;
  className?: string;
}

/**
 * NotificationGroup - Group notifications under a header
 *
 * @example
 * ```tsx
 * <NotificationGroup title="Hari ini">
 *   <NotificationItem ... />
 *   <NotificationItem ... />
 * </NotificationGroup>
 * ```
 */
export const NotificationGroup = forwardRef<HTMLDivElement, NotificationGroupProps>(
  ({ title, children, emptyMessage = "No notifications", className }, ref) => {
    return (
      <div ref={ref} className={clsx("space-y-1", className)}>
        {title && (
          <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </h3>
        )}
        {children ?? (
          <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
            {emptyMessage}
          </p>
        )}
      </div>
    );
  }
);

NotificationGroup.displayName = "NotificationGroup";

// ============================================================================
// Export
// ============================================================================

export default NotificationItem;
