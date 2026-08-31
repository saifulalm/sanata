import { Suspense } from "react";
import { Camera, MapPin, Image, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ExecutionsList } from "./ExecutionsList";
import { getExecutions, getExecutionStats } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";
import { Card } from "@/components/admin/ExtendedUI";

export const metadata = {
  title: "Execution Log - SANTRA",
  description: "Dokumentasi harian pekerjaan dengan foto dan GPS",
};

async function ExecutionStats() {
  try {
    const stats = await getExecutionStats();
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Camera size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Log</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Image size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.photoCoverage}%</p>
              <p className="text-xs text-slate-500">dengan Foto</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.gpsCoverage}%</p>
              <p className="text-xs text-slate-500">dengan GPS</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgProgress}%</p>
              <p className="text-xs text-slate-500">Rata-rata Progress</p>
            </div>
          </div>
        </Card>
      </div>
    );
  } catch {
    return null;
  }
}

export default async function ExecutionsPage() {
  // Ensure user is authenticated
  await getAdminSession();

  console.log("[ExecutionsPage] Fetching executions...");

  let executions: any[] = [];
  let meta = { page: 1, pageSize: 24, total: 0, totalPages: 0 };

  try {
    const result = await getExecutions({ page: 1, pageSize: 24 });
    executions = result.data;
    meta = result.meta;
    console.log("[ExecutionsPage] Got", executions.length, "executions");
  } catch (error: any) {
    console.error("[ExecutionsPage] Error:", error?.status, error?.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Execution & Dokumentasi"
        description="Dokumentasi harian pekerjaan dengan foto, GPS location, dan progress tracking."
      />

      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/5" />}>
        <ExecutionStats />
      </Suspense>

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <ExecutionsList initialExecutions={executions} initialMeta={meta} />
      </Suspense>
    </div>
  );
}
