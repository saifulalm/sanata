import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import {
  getWorker,
  getWorkerAssessments,
  getWorkerKpis,
  getWorkerExecutions,
} from "@/lib/workforceApi.server";
import { WorkerDetail } from "./WorkerDetail";

export const metadata = {
  title: "Detail Worker - SANTRA",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkerDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const [worker, assessments, kpis, executions] = await Promise.all([
      getWorker(id),
      getWorkerAssessments(id),
      getWorkerKpis(id),
      getWorkerExecutions(id),
    ]);

    return (
      <div className="space-y-6">
        <WorkerDetail
          worker={worker}
          assessments={assessments}
          kpis={kpis}
          executions={executions}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
