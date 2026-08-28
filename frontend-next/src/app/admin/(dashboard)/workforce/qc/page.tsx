import { Suspense } from "react";
import { ShieldCheck, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { QcList } from "./QcList";
import { getQcRecords, getQcStats } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";
import { Card } from "@/components/admin/ExtendedUI";

export const metadata = {
  title: "Quality Control - SANTRA",
  description: "QC checklist dengan evidence photo dan rework tracking",
};

async function QcStatsCards() {
  try {
    const stats = await getQcStats();
    const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total QC</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pass}</p>
              <p className="text-xs text-slate-500">Pass ({passRate}%)</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <RefreshCw size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.rework}</p>
              <p className="text-xs text-slate-500">Rework</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.fail}</p>
              <p className="text-xs text-slate-500">Fail</p>
            </div>
          </div>
        </Card>
      </div>
    );
  } catch {
    return null;
  }
}

export default async function QcPage() {
  // Ensure user is authenticated
  await getAdminSession();

  const { data: records, meta } = await getQcRecords({ page: 1, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Quality Control"
        description="QC checklist dengan evidence photo, measurement, dan rework tracking."
      />

      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/5" />}>
        <QcStatsCards />
      </Suspense>

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <QcList initialRecords={records} initialMeta={meta} />
      </Suspense>
    </div>
  );
}
