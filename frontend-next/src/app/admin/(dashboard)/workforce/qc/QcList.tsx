"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCcw,
  AlertTriangle,
  Calendar,
  User,
} from "lucide-react";
import {
  getQcRecords,
  approveQcRecord,
  createRework,
  type QcRecord,
  type QcResult,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  Pagination,
  Panel,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";
import { TableWrap, Th, Td } from "@/components/admin/ui";

const RESULT_CONFIG: Record<QcResult, { label: string; color: "success" | "warning" | "danger"; icon: React.ReactNode }> = {
  PASS: { label: "Pass", color: "success", icon: <CheckCircle size={14} /> },
  FAIL: { label: "Fail", color: "danger", icon: <XCircle size={14} /> },
  REWORK: { label: "Rework", color: "warning", icon: <RefreshCcw size={14} /> },
};

interface QcListProps {
  initialRecords: QcRecord[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function QcList({ initialRecords, initialMeta }: QcListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [records, setRecords] = useState(initialRecords);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<QcResult | "">("");
  const [approveDialog, setApproveDialog] = useState<QcRecord | null>(null);
  const [reworkDialog, setReworkDialog] = useState<QcRecord | null>(null);
  const [reworkNotes, setReworkNotes] = useState("");

  const fetchRecords = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getQcRecords({
          page,
          result: resultFilter || undefined,
        });
        setRecords(result.data);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data QC", "error");
      }
    });
  };

  const handleFilter = () => {
    fetchRecords(1);
  };

  const handlePageChange = (page: number) => {
    fetchRecords(page);
  };

  const handleApprove = async () => {
    if (!approveDialog) return;
    startTransition(async () => {
      try {
        await approveQcRecord(approveDialog.id);
        toast("QC berhasil disetujui", "success");
        setApproveDialog(null);
        fetchRecords(meta.page);
      } catch {
        toast("Gagal menyetujui QC", "error");
      }
    });
  };

  const handleRework = async () => {
    if (!reworkDialog || !reworkNotes.trim()) return;
    startTransition(async () => {
      try {
        await createRework(reworkDialog.id, {
          defectDesc: reworkNotes,
          workerId: reworkDialog.workerId,
        });
        toast("Rework berhasil dibuat", "success");
        setReworkDialog(null);
        setReworkNotes("");
        fetchRecords(meta.page);
      } catch {
        toast("Gagal membuat rework", "error");
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
            placeholder="Cari QC code..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={resultFilter}
          onChange={(e) => { setResultFilter(e.target.value as QcResult | ""); handleFilter(); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Result</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
          <option value="REWORK">Rework</option>
        </select>

        <Link
          href="/admin/workforce/qc/new"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <Plus size={16} />
          QC Checklist
        </Link>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title="Belum ada QC record"
          description="Buat QC checklist baru untuk memulai quality control."
          action={
            <Link
              href="/admin/workforce/qc/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              QC Checklist
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Kode QC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Worker</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Criteria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Measurement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Result</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const result = RESULT_CONFIG[record.result];
                    return (
                      <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-cyan-400">{record.qcCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{formatDate(record.checkDate)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white max-w-xs truncate">{record.itemDesc || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{record.worker.name}</p>
                          <p className="text-xs text-slate-500">{record.worker.workerCode}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-400 max-w-xs truncate">{record.criteria || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{record.measurement || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={result.color}>
                            {result.icon}
                            <span className="ml-1">{result.label}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {record.approvedAt ? (
                            <Badge tone="success">Approved</Badge>
                          ) : record.isRework ? (
                            <Badge tone="warning">Rework</Badge>
                          ) : (
                            <Badge tone="neutral">Pending</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {record.result === "FAIL" && !record.approvedAt && (
                              <>
                                <button
                                  onClick={() => setApproveDialog(record)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                                  title="Approve"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={() => setReworkDialog(record)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-400"
                                  title="Create Rework"
                                >
                                  <RefreshCcw size={14} />
                                </button>
                              </>
                            )}
                            <Link
                              href={`/admin/workforce/qc/${record.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                              title="Detail"
                            >
                              <Eye size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Pagination */}
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

      {/* Approve Dialog */}
      <Dialog
        open={!!approveDialog}
        onClose={() => setApproveDialog(null)}
        title="Approve QC Record"
        description={`Setujui QC "${approveDialog?.qcCode}" meskipun hasilnya FAIL?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setApproveDialog(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleApprove} loading={isPending}>
              <CheckCircle size={16} />
              Approve
            </Button>
          </div>
        }
      />

      {/* Rework Dialog */}
      <Dialog
        open={!!reworkDialog}
        onClose={() => { setReworkDialog(null); setReworkNotes(""); }}
        title="Create Rework"
        description={`Buat rework untuk "${reworkDialog?.qcCode}"`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setReworkDialog(null); setReworkNotes(""); }}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleRework} loading={isPending} disabled={!reworkNotes.trim()}>
              <RefreshCcw size={16} />
              Create Rework
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Defect Description *</label>
            <textarea
              value={reworkNotes}
              onChange={(e) => setReworkNotes(e.target.value)}
              placeholder="Jelaskan defect yang ditemukan..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
