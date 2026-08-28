"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Search,
  Plus,
  Eye,
  Pencil,
  UserPlus,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import {
  getAssignments,
  updateAssignmentStatus,
  type JobAssignment,
  type AssignmentStatus,
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
import { TableWrap, Th, Td } from "@/components/admin/ui";

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; color: "success" | "warning" | "info" | "neutral" | "danger"; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", color: "warning", icon: <Clock size={14} /> },
  IN_PROGRESS: { label: "Dikerjakan", color: "info", icon: <ArrowRight size={14} /> },
  COMPLETED: { label: "Selesai", color: "success", icon: <CheckCircle size={14} /> },
  CANCELLED: { label: "Dibatalkan", color: "neutral", icon: <XCircle size={14} /> },
};

interface AssignmentsBoardProps {
  initialAssignments: JobAssignment[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function AssignmentsBoard({ initialAssignments, initialMeta }: AssignmentsBoardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [assignments, setAssignments] = useState(initialAssignments);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "">("");
  const [statusDialog, setStatusDialog] = useState<{ assignment: JobAssignment; newStatus: AssignmentStatus } | null>(null);

  const fetchAssignments = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getAssignments({
          page,
          status: statusFilter || undefined,
        });
        setAssignments(result.data);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data assignment", "error");
      }
    });
  };

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    startTransition(async () => {
      try {
        await updateAssignmentStatus(statusDialog.assignment.id, statusDialog.newStatus);
        toast(`Status berhasil diubah ke "${STATUS_CONFIG[statusDialog.newStatus].label}"`, "success");
        setStatusDialog(null);
        fetchAssignments(meta.page);
      } catch {
        toast("Gagal mengubah status", "error");
      }
    });
  };

  const handleFilter = () => {
    fetchAssignments(1);
  };

  const handlePageChange = (page: number) => {
    fetchAssignments(page);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
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
            placeholder="Cari kode assignment atau work item..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as AssignmentStatus | ""); handleFilter(); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">Dikerjakan</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>

        <Link
          href="/admin/workforce/assignments/new"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <Plus size={16} />
          Buat Assignment
        </Link>
      </div>

      {/* Kanban View */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title="Belum ada assignment"
          description="Buat assignment baru untuk memulai penugasan pekerjaan."
          action={
            <Link
              href="/admin/workforce/assignments/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              Buat Assignment
            </Link>
          }
        />
      ) : (
        <>
          {/* Assignments Table */}
          <div className="overflow-x-auto">
            <Panel padded={false}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Kode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Pekerjaan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">WBS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Responsible</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Mandor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Prioritas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Timeline</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const status = STATUS_CONFIG[assignment.status];
                    return (
                      <tr key={assignment.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-cyan-400">{assignment.assignmentCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white max-w-xs truncate">{assignment.workItem}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{assignment.wbsCode || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          {assignment.responsiblePerson ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                <UserPlus size={12} />
                              </div>
                              <span className="text-sm text-white">{assignment.responsiblePerson.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-400">Belum ditugaskan</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {assignment.responsibleMandor ? (
                            <span className="text-sm text-slate-300">{assignment.responsibleMandor.name}</span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={assignment.priority <= 3 ? "danger" : assignment.priority <= 6 ? "warning" : "info"}>
                            P{assignment.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full bg-cyan-500 transition-all"
                                style={{ width: `${assignment.progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{assignment.progressPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={status.color}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-500">
                            <p>{formatDate(assignment.plannedStart)}</p>
                            <p className="text-slate-600">s/d {formatDate(assignment.plannedEnd)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/workforce/assignments/${assignment.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                              title="Detail"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/admin/workforce/assignments/${assignment.id}/edit`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-400"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          </div>

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

      {/* Status Change Dialog */}
      <Dialog
        open={!!statusDialog}
        onClose={() => setStatusDialog(null)}
        title="Ubah Status"
        description={`Ubah status "${statusDialog?.assignment.workItem}" ke:`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStatusDialog(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleStatusChange} loading={isPending}>
              Konfirmasi
            </Button>
          </div>
        }
      >
        <div className="flex gap-2">
          {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as AssignmentStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => statusDialog && setStatusDialog({ ...statusDialog, newStatus: s })}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                statusDialog?.newStatus === s
                  ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18"
              }`}
            >
              {STATUS_CONFIG[s].icon}
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
