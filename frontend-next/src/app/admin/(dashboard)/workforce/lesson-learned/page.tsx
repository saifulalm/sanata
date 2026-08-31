import { Suspense } from "react";
import { LessonLearnedList } from "./LessonLearnedList";
import { getLessonLearned, type LessonLearned } from "@/lib/workforceApi.server";

interface Props {
  searchParams: Promise<{ page?: string; wbsStage?: string; severity?: string; isResolved?: string }>;
}

async function LessonLearnedPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1");
  const wbsStage = resolved.wbsStage as any;
  const severity = resolved.severity as any;
  const isResolved = resolved.isResolved === "true" ? true : resolved.isResolved === "false" ? false : undefined;

  const initial = await getLessonLearned({ page, wbsStage, severity, isResolved, pageSize: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Lesson Learned</h1>
        <p className="text-sm text-slate-400 mt-1">
          Catatan pembelajaran dari rework QC — continuous improvement
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <LessonLearnedList
          initialData={initial.data as LessonLearned[]}
          initialMeta={initial.meta}
        />
      </Suspense>
    </div>
  );
}

export default LessonLearnedPage;
