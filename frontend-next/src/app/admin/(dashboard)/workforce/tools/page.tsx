import { Suspense } from "react";
import { Wrench, Package, Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ToolsList } from "./ToolsList";
import { getTools, getToolStats, getToolCategories, getUpcomingMaintenance } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";
import { Card } from "@/components/admin/ExtendedUI";

export const metadata = {
  title: "Alat - SANTRA",
  description: "Inventaris alat dan equipment proyek",
};

async function ToolStats() {
  try {
    const [stats, upcomingMaintenance] = await Promise.all([
      getToolStats(),
      getUpcomingMaintenance(7).catch(() => []),
    ]);

    const overdueCount = upcomingMaintenance.filter(m => m.isOverdue).length;

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tools */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Package size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Alat</p>
            </div>
          </div>
        </Card>

        {/* Available */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.available}</p>
              <p className="text-xs text-slate-500">Tersedia</p>
            </div>
          </div>
        </Card>

        {/* Borrowed */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.open}</p>
              <p className="text-xs text-slate-500">Sedang Dipinjam</p>
            </div>
          </div>
        </Card>

        {/* Overdue / Issues */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.overdue + (overdueCount > 0 ? overdueCount : 0)}
              </p>
              <p className="text-xs text-slate-500">Terlambat/Issue</p>
            </div>
          </div>
        </Card>
      </div>
    );
  } catch {
    return null;
  }
}

async function MaintenanceAlerts() {
  try {
    const upcomingMaintenance = await getUpcomingMaintenance(7);
    const overdueItems = upcomingMaintenance.filter(m => m.isOverdue);
    const upcomingItems = upcomingMaintenance.filter(m => !m.isOverdue).slice(0, 3);

    if (overdueItems.length === 0 && upcomingItems.length === 0) {
      return null;
    }

    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-amber-400" />
          <h3 className="text-sm font-medium text-white">Pengingat Maintenance</h3>
        </div>
        <div className="space-y-2">
          {overdueItems.slice(0, 2).map((item, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg bg-rose-500/10 p-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-400" />
                <span className="text-sm text-white">{item.toolName}</span>
              </div>
              <span className="text-xs text-rose-400">Terlambat {Math.abs(item.daysUntilDue || 0)} hari</span>
            </div>
          ))}
          {upcomingItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg bg-amber-500/10 p-2">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-sm text-white">{item.toolName}</span>
              </div>
              <span className="text-xs text-amber-400">
                {item.daysUntilDue === 0 ? "Hari ini" : `${item.daysUntilDue} hari lagi`}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  } catch {
    return null;
  }
}

export default async function ToolsPage() {
  await getAdminSession();

  const [tools, categories, stats] = await Promise.all([
    getTools({}).catch(() => []),
    getToolCategories().catch(() => []),
    getToolStats().catch(() => ({ total: 0, available: 0, open: 0, overdue: 0, lost: 0 })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Inventaris Alat"
        description="Kelola alat dan equipment proyek."
      />

      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/5" />}>
        <ToolStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
            <ToolsList initialTools={tools} initialCategories={categories} />
          </Suspense>
        </div>

        <div className="space-y-4">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-white/5" />}>
            <MaintenanceAlerts />
          </Suspense>

          {/* Quick Stats */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Statistik Cepat</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Alat</span>
                <span className="font-medium text-white">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Tersedia</span>
                <span className="font-medium text-emerald-400">{stats.available}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Dipinjam</span>
                <span className="font-medium text-amber-400">{stats.open}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Terlambat</span>
                <span className="font-medium text-rose-400">{stats.overdue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hilang</span>
                <span className="font-medium text-rose-400">{stats.lost}</span>
              </div>
            </div>

            {/* Availability Rate */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Tingkat Ketersediaan</span>
                <span className="text-xs font-medium text-cyan-400">
                  {stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.available / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
