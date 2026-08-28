import { PageHeader } from "@/components/admin/ui";
import { WorkerForm } from "../WorkerForm";

export const metadata = {
  title: "Tambah Worker - SANTRA",
};

export default function NewWorkerPage() {
  return (
    <div className="space-y-6">
      <WorkerForm />
    </div>
  );
}
