"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Settings,
  Trash2,
  Edit,
  Plus,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Calculator,
  ShoppingBag,
  ArrowRight,
  Layers,
  Activity,
  Eye,
  type LucideIcon,
} from "lucide-react";

// Activity types
type ActivityType =
  | "content_created"
  | "content_updated"
  | "content_deleted"
  | "product_created"
  | "product_updated"
  | "inquiry_received"
  | "inquiry_updated"
  | "user_login"
  | "user_created"
  | "settings_changed"
  | "rab_created"
  | "rab_updated"
  | "quotation_sent";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  user?: { name: string; avatar?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
  showTime?: boolean;
  compact?: boolean;
}

// Icon mapping for activity types
const ACTIVITY_ICONS: Record<ActivityType, { icon: LucideIcon; color: string }> = {
  content_created: { icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/20" },
  content_updated: { icon: Edit, color: "text-blue-400 bg-blue-500/10 border-blue-400/20" },
  content_deleted: { icon: Trash2, color: "text-red-400 bg-red-500/10 border-red-400/20" },
  product_created: { icon: Plus, color: "text-purple-400 bg-purple-500/10 border-purple-400/20" },
  product_updated: { icon: Edit, color: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20" },
  inquiry_received: { icon: MessageSquare, color: "text-amber-400 bg-amber-500/10 border-amber-400/20" },
  inquiry_updated: { icon: MessageSquare, color: "text-amber-400 bg-amber-500/10 border-amber-400/20" },
  user_login: { icon: User, color: "text-slate-400 bg-slate-500/10 border-slate-400/20" },
  user_created: { icon: Plus, color: "text-green-400 bg-green-500/10 border-green-400/20" },
  settings_changed: { icon: Settings, color: "text-indigo-400 bg-indigo-500/10 border-indigo-400/20" },
  rab_created: { icon: FileText, color: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20" },
  rab_updated: { icon: Edit, color: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20" },
  quotation_sent: { icon: Send, color: "text-teal-400 bg-teal-500/10 border-teal-400/20" },
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Baru saja";
  if (diffMins < 60) return `${diffMins}m lalu`;
  if (diffHours < 24) return `${diffHours}j lalu`;
  if (diffDays < 7) return `${diffDays}h lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/**
 * Displays relative time that updates live on the client.
 * The initial display matches the server render (empty dash) to avoid hydration mismatch.
 * After mount, it shows the computed relative time.
 */
function RelativeTime({ timestamp }: { timestamp: string }) {
  const [label, setLabel] = useState("...");

  useEffect(() => {
    setLabel(formatRelativeTime(timestamp));
    const interval = setInterval(() => {
      setLabel(formatRelativeTime(timestamp));
    }, 30_000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span suppressHydrationWarning>{label}</span>;
}

export function ActivityTimeline({
  activities,
  maxItems = 10,
  showTime = true,
  compact = false,
}: ActivityTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const [allActivities] = useState(activities);
  const displayActivities = expanded ? allActivities : allActivities.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {displayActivities.map((activity, index) => {
        const { icon: Icon, color } = ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.content_updated;
        const isLast = index === displayActivities.length - 1;

        return (
          <div
            key={activity.id}
            className={`group relative flex gap-3 ${compact ? "py-2" : "py-3"} ${
              !isLast ? "border-l border-white/10 pl-4" : ""
            }`}
          >
            {/* Timeline connector */}
            {!isLast && (
              <div className="absolute left-3.5 top-10 h-full w-px bg-gradient-to-b from-cyan-400/30 to-transparent" />
            )}

            {/* Icon */}
            <div
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${color}`}
            >
              <Icon size={14} />
            </div>

            {/* Content */}
            <div className={`min-w-0 flex-1 ${compact ? "" : "pt-0.5"}`}>
              <p className={`text-sm text-slate-200 ${compact ? "line-clamp-1" : ""}`}>
                {activity.description}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {activity.user && (
                  <span className="text-xs text-slate-500">{activity.user.name}</span>
                )}
                {showTime && (
                  <span className="text-xs text-slate-600">
                    <RelativeTime timestamp={activity.timestamp} />
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Expand/Collapse */}
      {allActivities.length > maxItems && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs text-slate-400 transition hover:border-cyan-300/20 hover:text-cyan-200"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} /> Tampilkan lebih sedikit
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Lihat {allActivities.length - maxItems} aktivitas lainnya
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Notification types
type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClear?: (id: string) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
  info: { icon: Bell, color: "text-blue-400", bg: "bg-blue-500/10" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  warning: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  error: { icon: X, color: "text-red-400", bg: "bg-red-500/10" },
};

export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-cyan-300" />
          <h3 className="font-semibold text-white">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-200">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-cyan-400 transition hover:text-cyan-200"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={24} className="mx-auto text-slate-600" />
            <p className="mt-2 text-sm text-slate-500">Tidak ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const { icon: Icon, color, bg } = NOTIFICATION_ICONS[notification.type];

            return (
              <div
                key={notification.id}
                className={`group relative flex gap-3 border-b border-white/5 px-4 py-3 transition ${
                  notification.read ? "opacity-60" : ""
                } hover:bg-white/[0.02]`}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-400" />
                )}

                {/* Icon */}
                <div className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon size={15} className={color} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{notification.title}</p>
                  {notification.message && (
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      <RelativeTime timestamp={notification.timestamp} />
                    </span>
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="text-[10px] font-medium text-cyan-400 hover:text-cyan-200"
                      >
                        {notification.actionLabel ?? "Lihat"}
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 opacity-0 transition group-hover:opacity-100">
                  {!notification.read && onMarkAsRead && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      title="Tandai dibaca"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  {onClear && (
                    <button
                      onClick={() => onClear(notification.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Hapus"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Quick action buttons for dashboard
interface QuickAction {
  id: string;
  label: string;
  /** Icon name as string — resolved client-side to avoid RSC serialization issues */
  iconName: string;
  href: string;
  color?: string;
}

// Lookup table for icon resolution (avoids passing functions from Server → Client Components)
const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  FileText,
  MessageSquare,
  ShoppingBag,
  Send,
  Settings,
  Plus,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  User,
  Layers,
  Activity,
  Eye,
  ArrowRight,
};

// Legacy support: accept LucideIcon directly for backward compatibility
type QuickActionInput = QuickAction | ({
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  color?: string;
});

export function QuickActions({
  actions,
  title = "Aksi Cepat",
}: {
  actions: QuickActionInput[];
  title?: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map((action) => {
          // Support both icon (LucideIcon) and iconName (string) formats
          const Icon = "icon" in action
            ? action.icon
            : (ICON_MAP[action.iconName] ?? FileText);
          const colorClass = action.color ?? "text-cyan-300 bg-cyan-300/10 border-cyan-300/20";

          return (
            <a
              key={action.id}
              href={action.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClass}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium text-slate-300 transition group-hover:text-white">
                {action.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Real-time activity indicator
// Accepts ISO string to avoid interval reset on re-render (Date objects compared by reference).
export function LiveIndicator({ lastUpdate }: { lastUpdate: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const ms = new Date(lastUpdate).getTime();
    setSeconds(Math.floor((Date.now() - ms) / 1000));
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - ms) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span suppressHydrationWarning>
        Live · {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`}
      </span>
    </div>
  );
}
