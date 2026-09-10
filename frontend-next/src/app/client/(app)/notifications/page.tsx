"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getNotifications,
  markRead,
  markAllRead,
  formatDate,
  getNotificationPreferences,
  updateNotificationPreferences,
  type Notification,
  type NotificationPreference,
} from "@/lib/clientPortal";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  TrendingUp,
  FileText,
  Shield,
  DollarSign,
  MessageSquare,
  Target,
  Image,
  Loader2,
  RefreshCw,
  Check,
  ChevronRight,
  Mail,
  Smartphone,
  Settings,
  BellRing,
} from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Types
// ============================================================================

type FilterType = "all" | "unread" | Notification["type"];
type TabType = "notifications" | "preferences";

// ============================================================================
// Logo Component
// ============================================================================

function ClientLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="notifGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <g>
        <path d="M10 8 L22 8 L22 22 L32 22 L32 34 L10 34 Z" fill="url(#notifGrad)" opacity="0.15" />
        <path d="M8 8 L20 8 L20 20 L30 20 L30 34 L8 34 Z" fill="none" stroke="url(#notifGrad)" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="8" y1="14" x2="20" y2="14" stroke="url(#notifGrad)" strokeWidth="1.5" opacity="0.8" />
        <line x1="20" y1="26" x2="30" y2="26" stroke="url(#notifGrad)" strokeWidth="1.5" opacity="0.8" />
      </g>
      <circle cx="24" cy="11" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

// ============================================================================
// Filter Options
// ============================================================================

const filterOptions: { id: FilterType; label: string; icon: typeof Bell }[] = [
  { id: "all", label: "Semua", icon: Bell },
  { id: "unread", label: "Belum Dibaca", icon: AlertCircle },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "document", label: "Dokumen", icon: FileText },
  { id: "qc", label: "QC", icon: Shield },
  { id: "billing", label: "Tagihan", icon: DollarSign },
  { id: "message", label: "Pesan", icon: MessageSquare },
  { id: "milestone", label: "Milestone", icon: Target },
];

const typeIcons: Record<string, typeof Bell> = {
  progress: TrendingUp,
  document: FileText,
  qc: Shield,
  photo: Image,
  billing: DollarSign,
  message: MessageSquare,
  milestone: Target,
  default: Bell,
};

const typeColors: Record<string, { bg: string; icon: string }> = {
  progress: { bg: "bg-gradient-to-br from-emerald-400 to-green-500", icon: "text-white" },
  PROGRESS_UPDATE: { bg: "bg-gradient-to-br from-emerald-400 to-green-500", icon: "text-white" },
  document: { bg: "bg-gradient-to-br from-blue-400 to-indigo-500", icon: "text-white" },
  DOCUMENT: { bg: "bg-gradient-to-br from-blue-400 to-indigo-500", icon: "text-white" },
  qc: { bg: "bg-gradient-to-br from-purple-400 to-pink-500", icon: "text-white" },
  QC_ALERT: { bg: "bg-gradient-to-br from-purple-400 to-pink-500", icon: "text-white" },
  photo: { bg: "bg-gradient-to-br from-pink-400 to-rose-500", icon: "text-white" },
  PHOTO: { bg: "bg-gradient-to-br from-pink-400 to-rose-500", icon: "text-white" },
  billing: { bg: "bg-gradient-to-br from-amber-400 to-orange-500", icon: "text-white" },
  BILLING: { bg: "bg-gradient-to-br from-amber-400 to-orange-500", icon: "text-white" },
  message: { bg: "bg-gradient-to-br from-cyan-400 to-teal-500", icon: "text-white" },
  MESSAGE: { bg: "bg-gradient-to-br from-cyan-400 to-teal-500", icon: "text-white" },
  milestone: { bg: "bg-gradient-to-br from-indigo-400 to-purple-500", icon: "text-white" },
  MILESTONE: { bg: "bg-gradient-to-br from-indigo-400 to-purple-500", icon: "text-white" },
  default: { bg: "bg-gradient-to-br from-slate-400 to-slate-500", icon: "text-white" },
};

// ============================================================================
// Utility Functions
// ============================================================================

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  return formatDate(dateStr, "short");
}

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

function ToggleSwitch({ checked, onChange, disabled = false, size = "md" }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={clsx(
        "relative rounded-full transition-colors duration-200",
        size === "sm" ? "w-10 h-6" : "w-12 h-7",
        checked ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-slate-200 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "absolute top-1 bg-white rounded-full shadow-md transition-transform duration-200 flex items-center justify-center",
          size === "sm" ? "w-4 h-4 left-1" : "w-5 h-5 left-1",
          checked ? (size === "sm" ? "translate-x-4" : "translate-x-6") : "translate-x-0"
        )}
      >
        {checked && <Check className={size === "sm" ? "w-2.5 h-2.5 text-blue-600" : "w-3 h-3 text-blue-600"} />}
      </span>
    </button>
  );
}

// ============================================================================
// Preference Card Component
// ============================================================================

function PreferenceCard({ pref, onToggle }: { pref: NotificationPreference; onToggle: (type: "email" | "push" | "inApp", value: boolean) => void }) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", typeColors[pref.type]?.bg || "bg-slate-100")}>
            {(() => {
              const Icon = typeIcons[pref.type] || Bell;
              return <Icon className={clsx("w-5 h-5", typeColors[pref.type]?.icon || "text-slate-600")} />;
            })()}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{pref.label}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{pref.type}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Email</span>
            <ToggleSwitch
              checked={pref.emailEnabled}
              onChange={(v) => onToggle("email", v)}
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Push</span>
            <ToggleSwitch
              checked={pref.pushEnabled}
              onChange={(v) => onToggle("push", v)}
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">In-App</span>
            <ToggleSwitch
              checked={pref.inAppEnabled}
              onChange={(v) => onToggle("inApp", v)}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Preferences Tab
// ============================================================================

function PreferencesTab({ preferences, onUpdate, saving, onSave }: {
  preferences: NotificationPreference[];
  onUpdate: (updated: NotificationPreference[]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const handleToggle = (index: number, channel: "email" | "push" | "inApp", value: boolean) => {
    const updated = [...preferences];
    if (channel === "email") updated[index] = { ...updated[index], emailEnabled: value };
    else if (channel === "push") updated[index] = { ...updated[index], pushEnabled: value };
    else updated[index] = { ...updated[index], inAppEnabled: value };
    onUpdate(updated);
  };

  const hasChanges = true; // In real app, track actual changes

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <BellRing className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pengaturan Notifikasi</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Atur bagaimana Anda ingin menerima notifikasi untuk setiap kategori. Anda dapat mengaktifkan atau menonaktifkan email, push notification, dan notifikasi in-app secara terpisah.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {preferences.map((pref, index) => (
          <PreferenceCard
            key={pref.type}
            pref={pref}
            onToggle={(channel, value) => handleToggle(index, channel, value)}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Simpan Pengaturan
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-100 dark:bg-slate-600 rounded w-full" />
                <div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ filter }: { filter: FilterType }) {
  const messages: Record<string, string> = {
    all: "Belum ada notifikasi",
    unread: "Semua notifikasi sudah dibaca",
    progress: "Belum ada update progress",
    document: "Belum ada notifikasi dokumen",
    qc: "Belum ada notifikasi QC",
    billing: "Belum ada notifikasi tagihan",
    message: "Belum ada pesan",
    milestone: "Belum ada milestone",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center">
          <Bell className="w-12 h-12 text-blue-500" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {messages[filter] || "Tidak ada notifikasi"}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
        {filter === "all"
          ? "Notifikasi dari proyek Anda akan muncul di sini."
          : "Coba pilih filter lain untuk melihat notifikasi lainnya."}
      </p>
    </div>
  );
}

// ============================================================================
// Notification Card
// ============================================================================

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const Icon = typeIcons[notification.type] || typeIcons.default;
  const colors = typeColors[notification.type] || typeColors.default || { bg: "bg-gradient-to-br from-slate-400 to-slate-500", icon: "text-white" };

  return (
    <div
      className={clsx(
        "relative rounded-2xl transition-all duration-300 group overflow-hidden",
        notification.isRead
          ? "bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
          : "bg-white/95 dark:bg-slate-800/95 border-2 border-blue-200/50 dark:border-blue-500/30 shadow-lg shadow-blue-500/5"
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/50" />
      )}

      <div className="p-5 flex gap-4">
        {/* Icon */}
        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg", colors.bg)}>
          <Icon className={clsx("w-6 h-6", colors.icon)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={clsx(
                  "font-semibold",
                  notification.isRead
                    ? "text-slate-600 dark:text-slate-400"
                    : "text-slate-900 dark:text-white"
                )}
              >
                {notification.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                {timeAgo(notification.createdAt)}
              </p>
            </div>

            {/* Actions */}
            {!notification.isRead && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                title="Tandai sudah dibaca"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Link */}
          {notification.link && (
            <Link
              href={notification.link}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-3 group/link"
            >
              <span>Lihat detail</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Notifications Page
// ============================================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("notifications");
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, prefsRes] = await Promise.all([
        getNotifications(filter === "unread").catch(() => ({ notifications: [], unreadCount: 0 })),
        getNotificationPreferences().catch(() => []),
      ]);
      setNotifications(notifRes.notifications);
      setUnreadCount(notifRes.unreadCount);
      setPreferences(prefsRes.length > 0 ? prefsRes : []);
    } catch {
      setError("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(preferences);
    } catch {
      // Silent fail
    } finally {
      setSavingPrefs(false);
    }
  };

  const filteredNotifications =
    filter === "all" || filter === "unread"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Notifikasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Notifikasi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab(activeTab === "notifications" ? "preferences" : "notifications"); }}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
              activeTab === "preferences"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            )}
          >
            <Settings className="w-4 h-4" />
            Preferensi
          </Link>
          {unreadCount > 0 && activeTab === "notifications" && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "preferences" ? (
        <PreferencesTab
          preferences={preferences}
          onUpdate={setPreferences}
          saving={savingPrefs}
          onSave={handleSavePreferences}
        />
      ) : (
        <>
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="inline-flex items-center gap-1 p-1.5 bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl backdrop-blur-sm">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                const isActive = filter === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setFilter(option.id)}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                    {option.id === "unread" && unreadCount > 0 && (
                      <span className={clsx(
                        "px-1.5 py-0.5 text-xs font-bold rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                      )}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                onClick={loadNotifications}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingSkeleton />}

          {/* Empty State */}
          {!loading && !error && filteredNotifications.length === 0 && (
            <EmptyState filter={filter} />
          )}

          {/* Notifications List */}
          {!loading && !error && filteredNotifications.length > 0 && (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}

          {/* Results count */}
          {!loading && filteredNotifications.length > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Menampilkan {filteredNotifications.length} notifikasi
            </p>
          )}
        </>
      )}
    </div>
  );
}
