"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  BadgeCheck,
  FileText,
  Star,
  Briefcase,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  getWorker,
  getWorkerAssessments,
  getWorkerKpis,
  getWorkerExecutions,
  type Worker,
  type WorkerAssessment,
  type KpiRecord,
  type ExecutionLog,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  PageHeader,
  Tabs,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";
import { TableWrap, Th, Td } from "@/components/admin/ui";

const GRADE_COLORS: Record<string, "success" | "info" | "warning" | "danger"> = {
  A: "success",
  B: "info",
  C: "warning",
  D: "danger",
};

interface WorkerDetailProps {
  worker: Worker;
  assessments: WorkerAssessment[];
  kpis: KpiRecord[];
  executions: ExecutionLog[];
}

export function WorkerDetail({ worker, assessments, kpis, executions }: WorkerDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const tabs = [
    { id: "profile", label: "Profil" },
    { id: "assessments", label: "Assessment", count: assessments.length },
    { id: "kpi", label: "KPI", count: kpis.length },
    { id: "executions", label: "Execution", count: executions.length },
  ];

  const [activeTab, setActiveTab] = useState("profile");
  const [deleteDialog, setDeleteDialog] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatScore = (score: number | null) => {
    if (score === null) return "—";
    return `${score}/100`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/workers"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{worker.name}</h1>
              <Badge tone={worker.ktpVerified ? "success" : "warning"}>
                {worker.ktpVerified ? "Terverifikasi" : "Belum Terverifikasi"}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {worker.workerCode} • {worker.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/workforce/workers/${worker.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition-all hover:bg-amber-400/20"
          >
            <Pencil size={16} />
            Edit
          </Link>
          <Button variant="danger" onClick={() => setDeleteDialog(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-white">Informasi Pribadi</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">Nama Lengkap</label>
                  <p className="text-white">{worker.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Kode Worker</label>
                  <p className="font-mono text-cyan-400">{worker.workerCode}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Role / Jabatan</label>
                  <p className="text-white">{worker.role}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Grade</label>
                  <p className="text-white">
                    {worker.grade ? (
                      <Badge tone={GRADE_COLORS[worker.grade]}>{worker.grade}</Badge>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Rate / Gaji</label>
                  <p className="text-white">
                    {worker.rate ? `Rp ${parseFloat(worker.rate).toLocaleString("id-ID")}` : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Pengalaman</label>
                  <p className="text-white">{worker.experienceYears ?? 0} tahun</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-lg font-semibold text-white">Kontak & Identitas</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">No. KTP</label>
                  <p className="text-white">{worker.ktpNumber || "—"}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Telepon</label>
                  <p className="text-white">{worker.phone || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500">Alamat</label>
                  <p className="text-white">{worker.address || "—"}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-lg font-semibold text-white">Skills & Kompetensi</h3>
              {worker.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map((skill, i) => (
                    <Badge key={i} tone="info">{skill}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Belum ada skill yang dicatat</p>
              )}
              {worker.certificates.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs text-slate-500">Sertifikat</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {worker.certificates.map((cert, i) => (
                      <Badge key={i} tone="success">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {worker.skillNotes && (
                <div className="mt-4">
                  <label className="text-xs text-slate-500">Catatan Skill</label>
                  <p className="mt-1 text-sm text-slate-300">{worker.skillNotes}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                  {worker.facePhotoUrl ? (
                    <img
                      src={worker.facePhotoUrl}
                      alt={worker.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <Shield size={28} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{worker.name}</p>
                  <Badge tone={worker.status === "ACTIVE" ? "success" : "neutral"}>
                    {worker.status === "ACTIVE" ? "Aktif" : worker.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tanggal Masuk</span>
                  <span className="text-white">{formatDate(worker.joinDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Profil</span>
                  <span className={worker.profileComplete ? "text-emerald-400" : "text-amber-400"}>
                    {worker.profileComplete ? "Lengkap" : "Belum Lengkap"}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="mb-3 text-sm font-semibold text-white">Alat Pribadi</h4>
              {(worker as any).personalTools?.length > 0 ? (
                <div className="space-y-2">
                  {((worker as any).personalTools as string[]).map((tool: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                      <BadgeCheck size={14} className="text-emerald-400" />
                      <span className="text-sm text-slate-300">{tool}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Tidak ada alat pribadi</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "assessments" && (
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title="Belum ada assessment"
              description="Tambahkan assessment untuk mencatat kompetensi worker."
              action={
                <Link
                  href={`/admin/workforce/assessments/new?workerId=${worker.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
                >
                  <Pencil size={16} />
                  Tambah Assessment
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assessments.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{a.assessmentCode}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.assessmentDate)}</p>
                    </div>
                    {a.grade && <Badge tone={GRADE_COLORS[a.grade]}>{a.grade}</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Technical</p>
                      <p className="text-white">{formatScore(a.technicalScore)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Interview</p>
                      <p className="text-white">{formatScore(a.interviewScore)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Teamwork</p>
                      <p className="text-white">{formatScore(a.teamworkScore)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Safety</p>
                      <p className="text-white">{formatScore(a.safetyScore)}</p>
                    </div>
                  </div>
                  {a.recommendation && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-xs text-slate-500">Rekomendasi</p>
                      <p className="text-sm text-slate-300">{a.recommendation}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "kpi" && (
        <div className="space-y-4">
          {kpis.length === 0 ? (
            <EmptyState
              icon={<Star size={24} />}
              title="Belum ada KPI"
              description="KPI akan muncul setelah ada data assessment dan execution."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Periode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Quality</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Productivity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Attendance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Safety</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Overall</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Ranking</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((kpi) => (
                    <tr key={kpi.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-sm text-white">{kpi.period}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatScore(kpi.qualityScore)}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatScore(kpi.productivityScore)}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatScore(kpi.attendanceScore)}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatScore(kpi.safetyScore)}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatScore(kpi.overallScore)}</td>
                      <td className="px-4 py-3 text-sm">
                        {kpi.rank ? <Badge tone="info">#{kpi.rank}</Badge> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "executions" && (
        <div className="space-y-4">
          {executions.length === 0 ? (
            <EmptyState
              icon={<Camera size={24} />}
              title="Belum ada execution log"
              description="Execution log akan muncul setelah worker ditugaskan ke pekerjaan."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {executions.map((log) => (
                <Card key={log.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-cyan-400">{log.logCode}</p>
                      <p className="text-xs text-slate-500">{formatDate(log.logDate)}</p>
                    </div>
                    {log.progressPct !== null && (
                      <Badge tone="info">{log.progressPct}%</Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{log.description || "—"}</p>
                  {log.locationName && (
                    <p className="mt-2 text-xs text-slate-500">{log.locationName}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        title="Hapus Worker"
        description={`Yakin ingin menghapus "${worker.name}"? Data yang dihapus tidak dapat dikembalikan.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog(false)}>
              Batal
            </Button>
            <Link
              href={`/admin/workforce/workers/${worker.id}/delete`}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20"
            >
              Hapus
            </Link>
          </div>
        }
      />
    </div>
  );
}
