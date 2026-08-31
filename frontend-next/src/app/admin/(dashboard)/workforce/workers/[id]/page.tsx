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

  let worker = null;
  let assessments: any[] = [];
  let kpis: any[] = [];
  let executions: any[] = [];
  let fetchError = null;

  try {
    worker = await getWorker(id);
  } catch (e: any) {
    console.error("Failed to fetch worker:", e);
    fetchError = e;
  }

  // Try to fetch related data even if worker fetch failed
  try {
    assessments = await getWorkerAssessments(id);
  } catch (e) {
    console.error("Failed to fetch assessments:", e);
  }

  try {
    kpis = await getWorkerKpis(id);
  } catch (e) {
    console.error("Failed to fetch kpis:", e);
  }

  try {
    executions = await getWorkerExecutions(id);
  } catch (e) {
    console.error("Failed to fetch executions:", e);
  }

  // If worker not found, show 404
  if (!worker || fetchError?.status === 404) {
    notFound();
  }

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
}
