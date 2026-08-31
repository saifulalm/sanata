"use client";

import { useState, useTransition } from "react";
import {
  Lightbulb,
  Search,
  Plus,
  Eye,
  CheckCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";
import {
  getLessonLearned,
  resolveLessonLearned,
  deleteLessonLearned,
  WBS_STAGES,
  type LessonLearned,
  type WbsStage,
  type QcSeverity,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Pagination,
  Panel,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";

const SEVERITY_CONFIG: Record<QcSeverity, { label: string; color: "success" | "warning" | "danger" | "info" }> = {
  LOW: { label: "Rendah", color: "info" },
  MEDIUM: { label: "Sedang", color: "warning" },
  HIGH: { label: "Tinggi", color: "warning" },
  CRITICAL: { label: "Kritis", color: "danger" },
};

interface LessonLearnedListProps {
  initialData: LessonLearned[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function LessonLearnedList({ initialData, initialMeta }: LessonLearnedListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [wbsFilter, setWbsFilter] = useState<WbsStage | "">("");
  const [severityFilter, setSeverityFilter] = useState<QcSeverity | "">("");
  const [resolvedFilter, setResolvedFilter] = useState<boolean | "">("");
  const [viewDialog, setViewDialog] = useState<LessonLearned | null>(null);
  const [resolveDialog, setResolveDialog] = useState<LessonLearned | null>(null);

  const fetchData = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getLessonLearned({
          page,
          wbsStage: wbsFilter || undefined,
          severity: severityFilter || undefined,
          isResolved: resolvedFilter !== "" ? resolvedFilter : undefined,
          search: search || undefined,
        });
        setData(result.data as LessonLearned[]);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data", "error");
      }
    });
  };

  const handleFilter = () => {
    fetchData(1);
  };

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const handleResolve = async () => {
    if (!resolveDialog) return;
    startTransition(async () => {
      try {
        await resolveLessonLearned(resolveDialog.id);
        toast("Lesson learned berhasil ditandai resolved", "success");
        setResolveDialog(null);
        fetchData(meta.page);
      } catch {
        toast("Gagal update", "error");
      }
    });
  };

  const getWbsLabel = (stage: WbsStage | null) => {
    if (!stage) return "—";
    return WBS_STAGES[stage]?.label || stage;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            placeholder="Cari title atau description..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
          />
        </div>

        <select
          value={wbsFilter}
          onChange={(e) => { setWbsFilter(e.target.value as WbsStage | ""); handleFilter(); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua WBS</option>
          {Object.entries(WBS_STAGES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value as QcSeverity | ""); handleFilter(); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Severity</option>
          <option value="LOW">Rendah</option>
          <option value="MEDIUM">Sedang</option>
          <option value="HIGH">Tinggi</option>
          <option value="CRITICAL">Kritis</option>
        </select>

        <select
          value={String(resolvedFilter)}
          onChange={(e) => {
            setResolvedFilter(e.target.value === "true" ? true : e.target.value === "false" ? false : "");
            handleFilter();
          }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="false">Belum Resolved</option>
          <option value="true">Sudah Resolved</option>
        </select>

        <Button onClick={handleFilter} disabled={isPending}>
          <Filter size={16} />
          Filter
        </Button>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={24} />}
          title="Belum ada lesson learned"
          description="Lesson learned dibuat otomatis dari rework QC atau manual oleh tim."
          action={
            <Button>
              <Plus size={16} />
              Lesson Learned
            </Button>
          }
        />
      ) : (
        <>
          <Panel padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">WBS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">QC Ref</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="text-sm text-white max-w-xs truncate">{item.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="info">{getWbsLabel(item.wbsStage)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={SEVERITY_CONFIG[item.severity]?.color || "info"}>
                          <AlertTriangle size={12} />
                          <span className="ml-1">{SEVERITY_CONFIG[item.severity]?.label || item.severity}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.isResolved ? (
                          <Badge tone="success">Resolved</Badge>
                        ) : (
                          <Badge tone="neutral">Open</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.qcRecord ? (
                          <span className="font-mono text-xs text-cyan-400">{item.qcRecord.qcCode}</span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewDialog(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          {!item.isResolved && (
                            <button
                              onClick={() => setResolveDialog(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                              title="Resolve"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              pageSize={meta.pageSize}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* View Dialog */}
      <Dialog
        open={!!viewDialog}
        onClose={() => setViewDialog(null)}
        title={viewDialog?.title || "Lesson Learned"}
        description={viewDialog?.qcRecord ? `QC Reference: ${viewDialog.qcRecord.qcCode}` : undefined}
      >
        {viewDialog && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Description</p>
              <p className="text-sm text-white mt-1">{viewDialog.description}</p>
            </div>
            {viewDialog.rootCause && (
              <div>
                <p className="text-xs text-slate-500">Root Cause</p>
                <p className="text-sm text-white mt-1">{viewDialog.rootCause}</p>
              </div>
            )}
            {viewDialog.correctiveAction && (
              <div>
                <p className="text-xs text-slate-500">Corrective Action</p>
                <p className="text-sm text-white mt-1">{viewDialog.correctiveAction}</p>
              </div>
            )}
            {viewDialog.preventiveAction && (
              <div>
                <p className="text-xs text-slate-500">Preventive Action</p>
                <p className="text-sm text-white mt-1">{viewDialog.preventiveAction}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog
        open={!!resolveDialog}
        onClose={() => setResolveDialog(null)}
        title="Resolve Lesson Learned"
        description={`Tandai "${resolveDialog?.title}" sebagai resolved?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResolveDialog(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleResolve} loading={isPending}>
              <CheckCircle size={16} />
              Resolve
            </Button>
          </div>
        }
      />
    </div>
  );
}
