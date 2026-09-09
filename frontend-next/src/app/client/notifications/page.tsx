"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getNotifications,
  markRead,
  markAllRead,
  formatDate,
  formatTime,
  type Notification,
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
} from "lucide-react";
import clsx from "clsx";

type FilterType = "all" | "unread" | Notification["type"];

const filterOptions: { id: FilterType; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "unread", label: "Belum Dibaca" },
  { id: "progress", label: "Progress" },
  { id: "document", label: "Dokumen" },
  { id: "qc", label: "QC" },
  { id: "billing", label: "Tagihan" },
  { id: "message", label: "Pesan" },
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
  progress: { bg: "bg-emerald-100", icon: "text-emerald-600" },
  document: { bg: "bg-blue-100", icon: "text-blue-600" },
  qc: { bg: "bg-purple-100", icon: "text-purple-600" },
  photo: { bg: "bg-pink-100", icon: "text-pink-600" },
  billing: { bg: "bg-amber-100", icon: "text-amber-600" },
  message: { bg: "bg-cyan-100", icon: "text-cyan-600" },
  milestone: { bg: "bg-indigo-100", icon: "text-indigo-600" },
};

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

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  const messages: Record<string, string> = {
    all: "Belum ada notifikasi",
    unread: "Semua notifikasi sudah dibaca",
    progress: "Belum ada update progress",
    document: "Belum ada notifikasi dokumen",
    qc: "Belum ada notifikasi QC",
    billing: "Belum ada notifikasi tagihan",
    message: "Belum ada pesan",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <Bell className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {messages[filter] || "Tidak ada notifikasi"}
      </h3>
      <p className="text-slate-500 text-center max-w-md">
        {filter === "all"
          ? "Notifikasi dari proyek Anda akan muncul di sini."
          : "Coba pilih filter lain untuk melihat notifikasi lainnya."}
      </p>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications(filter === "unread");
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
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

  const filteredNotifications =
    filter === "all" || filter === "unread"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Notifikasi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
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

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === option.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {option.label}
            {option.id === "unread" && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            onClick={loadNotifications}
            className="p-1 hover:bg-red-100 rounded-lg"
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
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = typeIcons[notification.type] || typeIcons.default;
            const colors =
              typeColors[notification.type] || typeColors.default;

            return (
              <div
                key={notification.id}
                className={clsx(
                  "relative bg-white dark:bg-slate-800 rounded-xl border transition-all group",
                  notification.isRead
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-blue-200 dark:border-blue-800 shadow-sm"
                )}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                )}

                <div className="p-4 flex gap-4">
                  {/* Icon */}
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      colors.bg
                    )}
                  >
                    <Icon className={clsx("w-5 h-5", colors.icon)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className={clsx(
                            "font-medium",
                            notification.isRead
                              ? "text-slate-600 dark:text-slate-400"
                              : "text-slate-900 dark:text-white"
                          )}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Lihat detail
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
