import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/adminApi";
import { ImportRabForm } from "@/components/admin/rab/ImportRabForm";

export const metadata: Metadata = { title: "Import RAB dari Excel" };

export default async function ImportRabPage() {
  await requireAdminRole("ADMIN", "EDITOR");

  return (
    <div className="max-w-4xl mx-auto">
      <ImportRabForm />
    </div>
  );
}
