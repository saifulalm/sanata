import { Suspense } from "react";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { KpiDashboard } from "./KpiDashboard";
import { getKpis, getKpiLeaderboard, getKpiPeriods } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";

export const metadata = {
  title: "KPI Performance - SANTRA",
  description: "Tracking quality, productivity, attendance per worker",
};

export default async function KpiPage() {
  // Ensure user is authenticated
  await getAdminSession();

  const [kpisResult, leaderboard, periods] = await Promise.all([
    getKpis({ page: 1, pageSize: 50 }),
    getKpiLeaderboard(),
    getKpiPeriods(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="KPI Performance"
        description="Tracking quality, productivity, attendance, dan safety score per worker."
      />

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <KpiDashboard
          initialKpis={kpisResult.data}
          initialLeaderboard={leaderboard}
          initialPeriods={periods}
          initialMeta={kpisResult.meta}
        />
      </Suspense>
    </div>
  );
}
