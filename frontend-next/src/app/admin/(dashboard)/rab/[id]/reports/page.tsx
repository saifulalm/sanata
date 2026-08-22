import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getMonthlyReports, getWeeklyReports } from "@/lib/adminResources";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { PeriodicReportBoard } from "./PeriodicReportBoard";

export const metadata: Metadata = { title: "Laporan Mingguan & Bulanan" };

export default async function PeriodicReportsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let weekly: Awaited<ReturnType<typeof getWeeklyReports>>;
  let monthly: Awaited<ReturnType<typeof getMonthlyReports>>;
  try {
    [weekly, monthly] = await Promise.all([getWeeklyReports(id), getMonthlyReports(id)]);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={weekly.rab}
        title="Laporan Mingguan & Bulanan"
        description="Rekap otomatis dari laporan harian, opname yang disetujui, dan kurva rencana. Tidak ada yang perlu diketik ulang."
      />
      <PeriodicReportBoard rabId={id} weekly={weekly} monthly={monthly} />
    </div>
  );
}
