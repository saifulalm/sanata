import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getDailyReports, getWorkforceRoles } from "@/lib/adminResources";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { DailyReportBoard } from "./DailyReportBoard";

export const metadata: Metadata = { title: "Laporan Harian" };

export default async function DailyReportsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getDailyReports>>;
  try {
    data = await getDailyReports(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const workforceRoles = await getWorkforceRoles();
  const activeRoles = workforceRoles.filter((r) => r.isActive);

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={data.rab}
        title="Laporan Harian Lapangan"
        description="Satu laporan per hari: cuaca, tenaga kerja, pekerjaan, kendala, dan foto. Rekap mingguan serta bulanan disusun otomatis dari sini."
      />
      <DailyReportBoard
        rabId={data.rab.id}
        reports={data.reports}
        activeWorkforceRoles={activeRoles}
      />
    </div>
  );
}
