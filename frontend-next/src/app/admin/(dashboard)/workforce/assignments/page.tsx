import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { AssignmentsBoard } from "./AssignmentsBoard";
import { getAssignments } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";

export const metadata = {
  title: "Penugasan Pekerjaan - SANTRA",
  description: "Kelola penugasan pekerjaan berbasis WBS",
};

export default async function AssignmentsPage() {
  // Ensure user is authenticated
  await getAdminSession();

  const { data: assignments, meta } = await getAssignments({ page: 1, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Penugasan Pekerjaan"
        description="Kelola penugasan pekerjaan berbasis WBS dengan responsible person dan mandor."
      />

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <AssignmentsBoard initialAssignments={assignments} initialMeta={meta} />
      </Suspense>
    </div>
  );
}
