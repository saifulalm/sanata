import { Suspense } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { AssessmentsList } from "./AssessmentsList";
import { getAssessments } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";

export const metadata = {
  title: "Assessment & Kompetensi - SANTRA",
  description: "Catat penilaian skill, interview, dan rekomendasi grade",
};

export default async function AssessmentsPage() {
  // Ensure user is authenticated
  await getAdminSession();

  const { data: assessments, meta } = await getAssessments({ page: 1, pageSize: 24 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Assessment & Kompetensi"
        description="Catat penilaian skill, interview, dan rekomendasi grade tenaga kerja."
      />

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <AssessmentsList initialAssessments={assessments} initialMeta={meta} />
      </Suspense>
    </div>
  );
}
