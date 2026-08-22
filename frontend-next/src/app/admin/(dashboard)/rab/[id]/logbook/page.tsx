import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getLogbook } from "@/lib/adminResources";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { LogbookBoard } from "./LogbookBoard";

export const metadata: Metadata = { title: "Logbook Proyek" };

export default async function LogbookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getLogbook>>;
  try {
    data = await getLogbook(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={data.rab}
        title="Logbook"
        description="Buku kejadian lapangan — hal-hal di luar rencana yang tidak masuk laporan harian, tapi menjelaskan mengapa jadwal bergerak."
      />
      <LogbookBoard data={data} />
    </div>
  );
}
