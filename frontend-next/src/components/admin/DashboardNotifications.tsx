"use client";

import { NotificationPanel } from "@/components/admin/ActivityTimeline";

/**
 * Client wrapper for NotificationPanel.
 *
 * NotificationPanel is a Client Component that receives callbacks as props.
 * These callbacks cannot be passed from a Server Component, so this wrapper
 * owns the callback definitions and keeps them inside the client boundary.
 */
export function DashboardNotifications() {
  return (
    <NotificationPanel
      notifications={DASHBOARD_NOTIFICATIONS}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onClear={handleClear}
    />
  );
}

// Sample notifications for dashboard.
// Timestamps are FIXED ISO strings to avoid hydration mismatch.
// Dynamic timestamps (Date.now()) differ between server render and client hydration.
const DASHBOARD_NOTIFICATIONS = [
  {
    id: "1",
    type: "info" as const,
    title: "Pesan baru menunggu",
    message: "Budi Santoso mengirim permintaan konsultasi",
    timestamp: "2026-08-16T09:05:00Z",
    read: false,
    actionUrl: "/admin/inquiries?status=NEW",
    actionLabel: "Balas",
  },
  {
    id: "2",
    type: "warning" as const,
    title: "RAB mendekati tenggat",
    message: "Proyek Gedung B perlu segera ditinjau",
    timestamp: "2026-08-16T08:00:00Z",
    read: false,
    actionUrl: "/admin/rab",
  },
  {
    id: "3",
    type: "success" as const,
    title: "Konten terpublikasi",
    message: "Artikel baru berhasil dipublikasikan",
    timestamp: "2026-08-16T07:00:00Z",
    read: true,
  },
];

function handleMarkAsRead(id: string) {
  // TODO: Connect to real notification API
  console.log("[DashboardNotifications] Mark as read:", id);
}

function handleMarkAllAsRead() {
  // TODO: Connect to real notification API
  console.log("[DashboardNotifications] Mark all as read");
}

function handleClear(id: string) {
  // TODO: Connect to real notification API
  console.log("[DashboardNotifications] Clear notification:", id);
}
