import { Suspense } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { WorkersTable } from "./WorkersTable";
import { getWorkers } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";

export const metadata = {
  title: "Database Tenaga Kerja - SANTRA",
  description: "Kelola database tenaga kerja lapangan",
};

export default async function WorkersPage() {
  // Ensure user is authenticated - this will redirect to login if not
  await getAdminSession();

  console.log("[WorkersPage] Fetching workers...");

  let workers: any[] = [];
  let meta = { page: 1, pageSize: 20, total: 0, totalPages: 0 };

  try {
    const result = await getWorkers({ page: 1, pageSize: 20 });
    workers = result.data;
    meta = result.meta;
    console.log("[WorkersPage] Got", workers.length, "workers");
  } catch (error: any) {
    console.error("[WorkersPage] Error:", error?.status, error?.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Database Tenaga Kerja"
        description="Kelola profil, skill, grade, dan verifikasi identitas tenaga kerja lapangan."
      />

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <WorkersTable initialWorkers={workers} initialMeta={meta} />
      </Suspense>
    </div>
  );
}
