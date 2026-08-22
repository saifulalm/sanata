import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getRabById, getSubmissions } from "@/lib/adminResources";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { SubmissionBoard } from "./SubmissionBoard";

export const metadata: Metadata = { title: "Pengajuan Proyek" };

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let rab: Awaited<ReturnType<typeof getRabById>>;
  let submissions: Awaited<ReturnType<typeof getSubmissions>>;
  try {
    [rab, submissions] = await Promise.all([getRabById(id), getSubmissions({ rabId: id, page: 1 })]);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={rab}
        title="Pengajuan"
        description="Ajuan alat, material, dan waktu dari lapangan — beserta jejak persetujuan atasan dan pemilik proyek."
      />
      <SubmissionBoard rabId={id} submissions={submissions.data} canDecide={session.role === "ADMIN"} />
    </div>
  );
}
