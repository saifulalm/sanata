import { Suspense } from "react";
import { QcTemplatesList } from "./QcTemplatesList";
import { getQcTemplates, type QcTemplate } from "@/lib/workforceApi.server";

interface Props {
  searchParams: Promise<{ page?: string; wbsStage?: string }>;
}

async function QcTemplatesPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1");
  const wbsStage = resolved.wbsStage as any;

  const initial = await getQcTemplates({ page, wbsStage, pageSize: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">QC Templates</h1>
        <p className="text-sm text-slate-400 mt-1">
          Template checklist QC per WBS stage — sesuai QC Flow PDF
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <QcTemplatesList
          initialData={initial.data as QcTemplate[]}
          initialMeta={initial.meta}
        />
      </Suspense>
    </div>
  );
}

export default QcTemplatesPage;
