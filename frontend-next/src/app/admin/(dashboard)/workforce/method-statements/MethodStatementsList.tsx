"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  getMethodStatements,
  deleteMethodStatement,
  WBS_STAGES,
  type MethodStatement,
  type WbsStage,
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
import { TableWrap } from "@/components/admin/ui";

interface MethodStatementsListProps {
  initialData: MethodStatement[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function MethodStatementsList({ initialData, initialMeta }: MethodStatementsListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [wbsFilter, setWbsFilter] = useState<WbsStage | "">("");
  const [deleteDialog, setDeleteDialog] = useState<MethodStatement | null>(null);

  const fetchData = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getMethodStatements({
          page,
          wbsStage: wbsFilter || undefined,
          search: search || undefined,
        });
        setData(result.data);
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

  const handleDelete = async () => {
    if (!deleteDialog) return;
    startTransition(async () => {
      try {
        await deleteMethodStatement(deleteDialog.id);
        toast("Method statement berhasil dihapus", "success");
        setDeleteDialog(null);
        fetchData(meta.page);
      } catch {
        toast("Gagal menghapus", "error");
      }
    });
  };

  const getWbsLabel = (stage: WbsStage) => {
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
            placeholder="Cari method code atau work item..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={wbsFilter}
          onChange={(e) => { setWbsFilter(e.target.value as WbsStage | ""); handleFilter(); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua WBS Stage</option>
          {Object.entries(WBS_STAGES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <Button onClick={handleFilter} disabled={isPending}>
          <Filter size={16} />
          Filter
        </Button>

        <Link
          href="/admin/workforce/method-statements/new"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <Plus size={16} />
          Method Statement
        </Link>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="Belum ada method statement"
          description="Tambahkan method statement baru untuk standar pekerjaan."
          action={
            <Link
              href="/admin/workforce/method-statements/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              Method Statement
            </Link>
          }
        />
      ) : (
        <>
          <Panel padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Method Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">WBS Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Work Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Hold Point</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Revision</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-cyan-400">{item.methodCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="info">{getWbsLabel(item.wbsStage)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white max-w-xs truncate">{item.workItem}</p>
                      </td>
                      <td className="px-4 py-3">
                        {item.holdPoint ? (
                          <Badge tone="warning">Yes</Badge>
                        ) : (
                          <Badge tone="neutral">No</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-400">v{item.revision}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/workforce/method-statements/${item.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                            title="Detail"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/admin/workforce/method-statements/${item.id}/edit`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-400"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteDialog(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        title="Hapus Method Statement"
        description={`Hapus "${deleteDialog?.methodCode}" - ${deleteDialog?.workItem}?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleDelete} loading={isPending} className="border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20">
              <Trash2 size={16} />
              Hapus
            </Button>
          </div>
        }
      />
    </div>
  );
}
