import { Suspense } from "react";
import { MethodStatementsList } from "./MethodStatementsList";
import { getMethodStatements, type MethodStatement } from "@/lib/workforceApi.server";

interface Props {
  searchParams: Promise<{ page?: string; wbsStage?: string }>;
}

async function MethodStatementsPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1");
  const wbsStage = resolved.wbsStage as any;

  const initial = await getMethodStatements({ page, wbsStage, pageSize: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Method Statements</h1>
        <p className="text-sm text-slate-400 mt-1">
          Master metode pekerjaan per WBS stage — standar perusahaan
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <MethodStatementsList
          initialData={initial.data as MethodStatement[]}
          initialMeta={initial.meta}
        />
      </Suspense>
    </div>
  );
}

export default MethodStatementsPage;
