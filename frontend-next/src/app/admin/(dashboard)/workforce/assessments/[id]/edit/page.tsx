import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/admin/ExtendedUI";
import { getAssessment, getAvailableWorkers } from "@/lib/workforceApi.server";
import { updateAssessment } from "@/lib/workforceApi";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Assessment - SANTRA",
};

export default async function EditAssessmentPage({ params }: Props) {
  const { id } = await params;

  let assessment;
  let workers;
  try {
    [assessment, workers] = await Promise.all([
      getAssessment(id),
      getAvailableWorkers(),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/assessments"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Assessment</h1>
            <p className="text-sm text-slate-400">{assessment.assessmentCode}</p>
          </div>
        </div>
      </div>

      <form action={async (formData) => {
        "use server";
        // This is a placeholder - actual form action needs to be implemented
      }} className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Worker</label>
            <select
              name="workerId"
              defaultValue={assessment.workerId}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            >
              <option value="">Pilih Worker</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.workerCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Tanggal Assessment</label>
            <input
              type="date"
              name="assessmentDate"
              defaultValue={assessment.assessmentDate.split("T")[0]}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Technical Score (0-100)</label>
            <input
              type="number"
              name="technicalScore"
              min="0"
              max="100"
              defaultValue={assessment.technicalScore ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Interview Score (0-100)</label>
            <input
              type="number"
              name="interviewScore"
              min="0"
              max="100"
              defaultValue={assessment.interviewScore ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Teamwork Score (0-100)</label>
            <input
              type="number"
              name="teamworkScore"
              min="0"
              max="100"
              defaultValue={assessment.teamworkScore ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Safety Score (0-100)</label>
            <input
              type="number"
              name="safetyScore"
              min="0"
              max="100"
              defaultValue={assessment.safetyScore ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Interviewer</label>
            <input
              type="text"
              name="interviewer"
              defaultValue={assessment.interviewer ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Recommendation</label>
            <input
              type="text"
              name="recommendation"
              defaultValue={assessment.recommendation ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={assessment.notes ?? ""}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
          <Link
            href="/admin/workforce/assessments"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07]"
          >
            Batal
          </Link>
          <Button type="submit" variant="primary">
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
