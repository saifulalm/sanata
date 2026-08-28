"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Briefcase,
  User,
  Calendar,
  MapPin,
  AlertCircle,
} from "lucide-react";
import {
  getAssignment,
  updateAssignment,
  getAvailableWorkers,
  type JobAssignment,
  type AssignmentStatus,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";

interface EditAssignmentClientProps {
  assignment: JobAssignment;
  workers: Array<{ id: string; name: string; workerCode: string; role: string }>;
}

const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "Dikerjakan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: "P1 - Urgent" },
  { value: 2, label: "P2 - High" },
  { value: 3, label: "P3 - Normal" },
  { value: 4, label: "P4 - Low" },
];

export function EditAssignmentClient({ assignment, workers }: EditAssignmentClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    workItem: assignment.workItem || "",
    wbsCode: assignment.wbsCode || "",
    responsiblePersonId: assignment.responsiblePersonId || "",
    responsibleMandorId: assignment.responsibleMandorId || "",
    status: assignment.status,
    priority: assignment.priority,
    plannedStart: assignment.plannedStart?.split("T")[0] || "",
    plannedEnd: assignment.plannedEnd?.split("T")[0] || "",
    actualStart: assignment.actualStart?.split("T")[0] || "",
    actualEnd: assignment.actualEnd?.split("T")[0] || "",
    scopeDescription: assignment.scopeDescription || "",
    progressPct: assignment.progressPct,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.workItem.trim()) newErrors.workItem = "Deskripsi pekerjaan wajib diisi";
    if (form.progressPct < 0 || form.progressPct > 100) {
      newErrors.progressPct = "Progress harus antara 0-100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        await updateAssignment(assignment.id, {
          workItem: form.workItem.trim(),
          wbsCode: form.wbsCode.trim() || undefined,
          responsiblePersonId: form.responsiblePersonId || undefined,
          responsibleMandorId: form.responsibleMandorId || undefined,
          status: form.status,
          priority: form.priority,
          plannedStart: form.plannedStart || undefined,
          plannedEnd: form.plannedEnd || undefined,
          actualStart: form.actualStart || undefined,
          actualEnd: form.actualEnd || undefined,
          scopeDescription: form.scopeDescription?.trim() || undefined,
          progressPct: form.progressPct,
        });
        toast("Assignment berhasil diperbarui", "success");
        router.push("/admin/workforce/assignments");
        router.refresh();
      } catch (err) {
        toast(`Gagal menyimpan: ${err}`, "error");
      }
    });
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Informasi Pekerjaan</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Deskripsi Pekerjaan *
                </label>
                <textarea
                  value={form.workItem}
                  onChange={(e) => setField("workItem", e.target.value)}
                  rows={3}
                  placeholder="Deskripsi pekerjaan yang ditugaskan..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none"
                />
                {errors.workItem && (
                  <p className="mt-1 text-xs text-rose-400">{errors.workItem}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">WBS Code</label>
                  <input
                    type="text"
                    value={form.wbsCode}
                    onChange={(e) => setField("wbsCode", e.target.value)}
                    placeholder="WBS-01"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progressPct}
                    onChange={(e) => setField("progressPct", parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
                  />
                  {errors.progressPct && (
                    <p className="mt-1 text-xs text-rose-400">{errors.progressPct}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Scope Description</label>
                <textarea
                  value={form.scopeDescription}
                  onChange={(e) => setField("scopeDescription", e.target.value)}
                  rows={3}
                  placeholder="Detail lingkup pekerjaan..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Personel</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Responsible Person</label>
                <select
                  value={form.responsiblePersonId}
                  onChange={(e) => setField("responsiblePersonId", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="">Pilih Worker</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Mandor</label>
                <select
                  value={form.responsibleMandorId}
                  onChange={(e) => setField("responsibleMandorId", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="">Pilih Mandor</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Status & Prioritas</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Prioritas</label>
                <select
                  value={form.priority}
                  onChange={(e) => setField("priority", parseInt(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Timeline</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Rencana Mulai</label>
                <input
                  type="date"
                  value={form.plannedStart}
                  onChange={(e) => setField("plannedStart", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Rencana Selesai</label>
                <input
                  type="date"
                  value={form.plannedEnd}
                  onChange={(e) => setField("plannedEnd", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Aktual Mulai</label>
                <input
                  type="date"
                  value={form.actualStart}
                  onChange={(e) => setField("actualStart", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Aktual Selesai</label>
                <input
                  type="date"
                  value={form.actualEnd}
                  onChange={(e) => setField("actualEnd", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Info Assignment</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Kode</span>
                <span className="font-mono text-cyan-400">{assignment.assignmentCode}</span>
              </div>
              {assignment.rab && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">RAB</span>
                    <span className="text-white">{assignment.rab.number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Project</span>
                    <span className="text-white truncate max-w-[150px]">{assignment.rab.title}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Dibuat</span>
                <span className="text-white">
                  {new Date(assignment.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Diperbarui</span>
                <span className="text-white">
                  {new Date(assignment.updatedAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Kemajuan</span>
                <span className="text-lg font-bold text-cyan-400">{form.progressPct}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                  style={{ width: `${form.progressPct}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
        <Link
          href="/admin/workforce/assignments"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
        >
          Batal
        </Link>
        <Button type="submit" loading={isPending}>
          <Save size={16} />
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
