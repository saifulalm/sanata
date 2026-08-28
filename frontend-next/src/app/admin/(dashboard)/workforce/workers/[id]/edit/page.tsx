import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { getWorker } from "@/lib/workforceApi.server";
import { WorkerForm } from "../../WorkerForm";

export const metadata = {
  title: "Edit Worker - SANTRA",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditWorkerPage({ params }: Props) {
  const { id } = await params;

  try {
    const worker = await getWorker(id);
    return (
      <div className="space-y-6">
        <WorkerForm worker={worker} isEdit />
      </div>
    );
  } catch {
    notFound();
  }
}
