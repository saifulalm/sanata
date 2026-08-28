import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  FileText,
  Edit,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Badge, Card } from "@/components/admin/ExtendedUI";
import { getAssignment } from "@/lib/workforceApi.server";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Detail Assignment - SANTRA",
};

const STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "info" | "neutral" | "danger" }> = {
  PENDING: { label: "Pending", color: "warning" },
  IN_PROGRESS: { label: "Dikerjakan", color: "info" },
  COMPLETED: { label: "Selesai", color: "success" },
  CANCELLED: { label: "Dibatalkan", color: "neutral" },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: "danger" | "warning" | "info" }> = {
  1: { label: "P1 - Urgent", color: "danger" },
  2: { label: "P2 - High", color: "warning" },
  3: { label: "P3 - Normal", color: "info" },
  4: { label: "P4 - Low", color: "info" },
};

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params;

  let assignment;
  try {
    assignment = await getAssignment(id);
  } catch {
    notFound();
  }

  const status = STATUS_CONFIG[assignment.status] || { label: assignment.status, color: "neutral" as const };
  const priority = PRIORITY_CONFIG[assignment.priority] || { label: `P${assignment.priority}`, color: "info" as const };

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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/assignments"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="font-mono text-sm text-cyan-400">{assignment.assignmentCode}</p>
            <h1 className="text-xl font-bold text-white">{assignment.workItem}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={status.color as any}>{status.label}</Badge>
          <Badge tone={priority.color as any}>{priority.label}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project & WBS */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <FileText size={16} />
              Informasi Proyek
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {assignment.rab && (
                <>
                  <div>
                    <p className="text-xs text-slate-500">RAB Number</p>
                    <p className="font-medium text-white">{assignment.rab.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Project Title</p>
                    <p className="font-medium text-white">{assignment.rab.title}</p>
                  </div>
                </>
              )}
              {assignment.wbsCode && (
                <div>
                  <p className="text-xs text-slate-500">WBS Code</p>
                  <p className="font-medium text-cyan-400">{assignment.wbsCode}</p>
                </div>
              )}
              {assignment.methodRef && (
                <div>
                  <p className="text-xs text-slate-500">Method Reference</p>
                  <p className="font-medium text-white">{assignment.methodRef}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Scope Description */}
          {assignment.scopeDescription && (
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
                <FileText size={16} />
                Deskripsi Lingkup Pekerjaan
              </h3>
              <p className="text-sm text-white leading-relaxed">{assignment.scopeDescription}</p>
            </Card>
          )}

          {/* Progress */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <ArrowRight size={16} />
              Progress
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Kemajuan</span>
                  <span className="text-lg font-bold text-cyan-400">{assignment.progressPct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                    style={{ width: `${assignment.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Responsible Person */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <User size={16} />
              Personel
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Responsible Person</p>
                {assignment.responsiblePerson ? (
                  <div className="mt-1">
                    <p className="font-medium text-white">{assignment.responsiblePerson.name}</p>
                    <p className="text-xs text-slate-500">{assignment.responsiblePerson.role}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Belum ditugaskan</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Mandor</p>
                {assignment.responsibleMandor ? (
                  <div className="mt-1">
                    <p className="font-medium text-white">{assignment.responsibleMandor.name}</p>
                    <p className="text-xs text-slate-500">{assignment.responsibleMandor.role}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Belum ditugaskan</p>
                )}
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Calendar size={16} />
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ArrowRight size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rencana Mulai</p>
                  <p className="font-medium text-white">{formatDate(assignment.plannedStart)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rencana Selesai</p>
                  <p className="font-medium text-white">{formatDate(assignment.plannedEnd)}</p>
                </div>
              </div>
              {assignment.actualStart && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Aktual Mulai</p>
                    <p className="font-medium text-white">{formatDate(assignment.actualStart)}</p>
                  </div>
                </div>
              )}
              {assignment.actualEnd && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Aktual Selesai</p>
                    <p className="font-medium text-white">{formatDate(assignment.actualEnd)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Edit size={16} />
              Aksi
            </h3>
            <div className="space-y-2">
              <Link
                href={`/admin/workforce/assignments/${id}/edit`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
              >
                <Edit size={16} />
                Edit Assignment
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
