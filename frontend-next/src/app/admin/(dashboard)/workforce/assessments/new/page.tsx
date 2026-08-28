
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { EmptyState } from "@/components/admin/ExtendedUI";

export const metadata = {
  title: "Assessment Baru - SANTRA",
};

export default function NewAssessmentPage() {
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
          title="Assessment Baru"
          description="Catat assessment kompetensi tenaga kerja"
        />
      </div>

      <EmptyState
        icon={<ClipboardCheck size={24} />}
        title="Form dalam pengembangan"
        description="Form assessment akan segera tersedia."
        action={
          <Link
            href="/admin/workforce/assessments"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
          >
            <ArrowLeft size={16} />
            Kembali ke Daftar
          </Link>
        }
      />
    </div>
  );
}
