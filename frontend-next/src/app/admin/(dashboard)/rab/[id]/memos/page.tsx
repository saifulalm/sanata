import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getMemos } from "@/lib/adminResources";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { MemoBoard } from "./MemoBoard";

export const metadata: Metadata = { title: "Site Memo" };

export default async function MemosPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getMemos>>;
  try {
    data = await getMemos(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={data.rab}
        title="Site Memo"
        description="Surat masuk dari klien dan balasan kontraktor, tersambung sebagai satu utas beserta tenggat jawabannya."
      />
      <MemoBoard data={data} canDelete={session.role === "ADMIN"} />
    </div>
  );
}
