import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, User, Calendar } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/admin/ExtendedUI";
import { getAssessment } from "@/lib/workforceApi.server";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Detail Assessment - SANTRA",
};

const GRADE_CONFIG: Record<string, { label: string; color: "success" | "warning" | "danger" | "neutral" }> = {
  A: { label: "Grade A", color: "success" },
  B: { label: "Grade B", color: "neutral" },
  C: { label: "Grade C", color: "warning" },
  D: { label: "Grade D", color: "danger" },
};

export default async function AssessmentDetailPage({ params }: Props) {
  const { id } = await params;

  let assessment;
  try {
    assessment = await getAssessment(id);
  } catch {
    notFound();
  }

  const grade = assessment.grade ? GRADE_CONFIG[assessment.grade] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/assessments"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <PageHeader
          eyebrow="SANTRA"
          title="Detail Assessment"
          description={`Kode: ${assessment.assessmentCode}`}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <ClipboardCheck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{assessment.worker.name}</h3>
            <p className="text-sm text-slate-500">{assessment.worker.role}</p>
          </div>
          {grade && <Badge tone={grade.color}>{grade.label}</Badge>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-slate-500">Teknis</p>
            <p className="text-2xl font-bold text-white">{assessment.technicalScore ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-slate-500">Interview</p>
            <p className="text-2xl font-bold text-white">{assessment.interviewScore ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-slate-500">Kerja Tim</p>
            <p className="text-2xl font-bold text-white">{assessment.teamworkScore ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-slate-500">Keselamatan</p>
            <p className="text-2xl font-bold text-white">{assessment.safetyScore ?? "-"}</p>
          </div>
        </div>

        {assessment.notes && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="text-xs text-slate-500">Catatan</p>
            <p className="mt-1 text-sm text-white">{assessment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
