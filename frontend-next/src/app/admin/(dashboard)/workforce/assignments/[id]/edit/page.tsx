import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { getAssignment, getAvailableWorkers } from "@/lib/workforceApi.server";
import { EditAssignmentClient } from "./EditAssignmentClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Assignment - SANTRA",
};

export default async function EditAssignmentPage({ params }: Props) {
  const { id } = await params;

  let assignment;
  let workers;
  try {
    [assignment, workers] = await Promise.all([
      getAssignment(id),
      getAvailableWorkers(),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/assignments"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <PageHeader
          eyebrow="SANTRA"
          title="Edit Assignment"
          description={`Edit penugasan ${assignment.assignmentCode}`}
        />
      </div>

      <EditAssignmentClient
        assignment={assignment}
        workers={workers.map((w) => ({ id: w.id, name: w.name, workerCode: w.workerCode, role: w.role }))}
      />
    </div>
  );
}
