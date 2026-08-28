"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  User,
  Star,
} from "lucide-react";
import {
  getAssessments,
  deleteAssessment,
  type WorkerAssessment,
  type WorkerGrade,
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

const GRADE_CONFIG: Record<WorkerGrade, { label: string; color: "success" | "info" | "warning" | "danger" }> = {
  A: { label: "Grade A", color: "success" },
  B: { label: "Grade B", color: "info" },
  C: { label: "Grade C", color: "warning" },
  D: { label: "Grade D", color: "danger" },
};

interface AssessmentsListProps {
  initialAssessments: WorkerAssessment[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function AssessmentsList({ initialAssessments, initialMeta }: AssessmentsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [assessments, setAssessments] = useState(initialAssessments);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<WorkerGrade | "">("");
  const [deleteDialog, setDeleteDialog] = useState<WorkerAssessment | null>(null);

  const fetchAssessments = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getAssessments({ page });
        setAssessments(result.data);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data assessment", "error");
      }
    });
  };

  const handleFilter = () => {
    fetchAssessments(1);
  };

  const handlePageChange = (page: number) => {
    fetchAssessments(page);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    startTransition(async () => {
      try {
        await deleteAssessment(deleteDialog.id);
        toast("Assessment berhasil dihapus", "success");
        setDeleteDialog(null);
        fetchAssessments(meta.page);
      } catch {
        toast("Gagal menghapus assessment", "error");
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

  const formatScore = (score: number | null) => {
    if (score === null) return "—";
    return `${score}/100`;
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
            placeholder="Cari assessment code atau nama worker..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={gradeFilter}
          onChange={(e) => { setGradeFilter(e.target.value as WorkerGrade | ""); handleFilter(); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Grade</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
          <option value="D">Grade D</option>
        </select>

        <Link
          href="/admin/workforce/assessments/new"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <Plus size={16} />
          Tambah Assessment
        </Link>
      </div>

      {/* Grid View */}
      {assessments.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={24} />}
          title="Belum ada assessment"
          description="Tambahkan assessment untuk mencatat kompetensi worker."
          action={
            <Link
              href="/admin/workforce/assessments/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              Tambah Assessment
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment) => {
              const gradeConfig = assessment.grade ? GRADE_CONFIG[assessment.grade] : null;
              const scores = [
                assessment.technicalScore,
                assessment.interviewScore,
                assessment.teamworkScore,
                assessment.safetyScore,
              ].filter((s): s is number => s !== null);
              const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : null;

              return (
                <div
                  key={assessment.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-cyan-500/30 hover:bg-white/[0.06]"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-cyan-400">{assessment.assessmentCode}</p>
                      <p className="text-xs text-slate-500">{formatDate(assessment.assessmentDate)}</p>
                    </div>
                    {gradeConfig && (
                      <Badge tone={gradeConfig.color}>{gradeConfig.label}</Badge>
                    )}
                  </div>

                  {/* Worker */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{assessment.worker.name}</p>
                      <p className="text-xs text-slate-500">{assessment.worker.role}</p>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Tech</p>
                      <p className="font-medium text-white">{formatScore(assessment.technicalScore)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Interview</p>
                      <p className="font-medium text-white">{formatScore(assessment.interviewScore)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Team</p>
                      <p className="font-medium text-white">{formatScore(assessment.teamworkScore)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Safety</p>
                      <p className="font-medium text-white">{formatScore(assessment.safetyScore)}</p>
                    </div>
                  </div>

                  {/* Overall & Recommendation */}
                  {assessment.recommendation && (
                    <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                      {assessment.recommendation}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                    <Link
                      href={`/admin/workforce/assessments/${assessment.id}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                    >
                      <Eye size={12} />
                      Detail
                    </Link>
                    <Link
                      href={`/admin/workforce/assessments/${assessment.id}/edit`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 transition-colors hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-400"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteDialog(assessment)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        title="Hapus Assessment"
        description={`Yakin ingin menghapus assessment "${deleteDialog?.assessmentCode}"?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isPending}>
              Hapus
            </Button>
          </div>
        }
      />
    </div>
  );
}
