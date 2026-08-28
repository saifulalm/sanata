"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { getAssignments, getAvailableWorkers, createExecution, type JobAssignment } from "@/lib/workforceApi";
import { Button, Card, Toast, useToast } from "@/components/admin/ExtendedUI";
import { GpsInput } from "@/components/admin/GpsInput";

interface WorkerOption {
  id: string;
  name: string;
  workerCode: string;
}

export default function NewExecutionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [form, setForm] = useState({
    assignmentId: "",
    workerId: "",
    logDate: new Date().toISOString().split("T")[0],
    description: "",
    latitude: "",
    longitude: "",
    locationName: "",
    progressPct: 0,
  });

  const [gpsError, setGpsError] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (dataLoaded) return;
    try {
      const [assignmentsResult, workersResult] = await Promise.all([
        getAssignments({ status: "IN_PROGRESS" }),
        getAvailableWorkers(),
      ]);
      setAssignments(assignmentsResult.data);
      setWorkers(workersResult.map((w) => ({ id: w.id, name: w.name, workerCode: w.workerCode })));
      setDataLoaded(true);
    } catch {
      toast("Gagal memuat data", "error");
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.assignmentId) newErrors.assignmentId = "Pilih assignment";
    if (!form.workerId) newErrors.workerId = "Pilih worker";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    startTransition(async () => {
      try {
        await createExecution({
          assignmentId: form.assignmentId,
          workerId: form.workerId,
          logDate: form.logDate,
          description: form.description || undefined,
          latitude: form.latitude ? parseFloat(form.latitude) : undefined,
          longitude: form.longitude ? parseFloat(form.longitude) : undefined,
          locationName: form.locationName || undefined,
          progressPct: form.progressPct || undefined,
        });
        toast("Execution log berhasil dibuat", "success");
        router.push("/admin/workforce/executions");
        router.refresh();
      } catch (err) {
        toast(`Gagal membuat: ${String(err)}`, "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/executions"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Log Pekerjaan Baru</h1>
          <p className="text-sm text-slate-400">Catat pelaksanaan pekerjaan hari ini</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Informasi Dasar</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Assignment *
                </label>
                <select
                  value={form.assignmentId}
                  onFocus={loadData}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, assignmentId: e.target.value }));
                    if (errors.assignmentId) setErrors((prev) => ({ ...prev, assignmentId: "" }));
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="">Pilih Assignment</option>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assignmentCode} - {a.workItem.substring(0, 50)}
                    </option>
                  ))}
                </select>
                {errors.assignmentId && (
                  <p className="mt-1 text-xs text-rose-400">{errors.assignmentId}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Worker *
                </label>
                <select
                  value={form.workerId}
                  onFocus={loadData}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, workerId: e.target.value }));
                    if (errors.workerId) setErrors((prev) => ({ ...prev, workerId: "" }));
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                >
                  <option value="">Pilih Worker</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerCode})
                    </option>
                  ))}
                </select>
                {errors.workerId && (
                  <p className="mt-1 text-xs text-rose-400">{errors.workerId}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Tanggal *</label>
                  <input
                    type="date"
                    value={form.logDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, logDate: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progressPct}
                    onChange={(e) => setForm((prev) => ({ ...prev, progressPct: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Detail Pekerjaan</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Jelaskan pekerjaan yang dilakukan hari ini..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Lokasi (Opsional)</h3>
            <GpsInput
              value={{
                latitude: form.latitude,
                longitude: form.longitude,
                locationName: form.locationName,
              }}
              onChange={(gps) => {
                setForm((prev) => ({
                  ...prev,
                  latitude: gps.latitude || "",
                  longitude: gps.longitude || "",
                  locationName: gps.locationName || "",
                }));
                setGpsError("");
              }}
              error={gpsError}
            />
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
            <Link
              href="/admin/workforce/executions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07]"
            >
              Batal
            </Link>
            <Button onClick={handleSubmit} loading={isPending}>
              <Save size={16} />
              Simpan Log
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-medium text-slate-400">Preview Progress</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
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
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-medium text-slate-400">Tips</h3>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>• Pilih assignment yang sedang dikerjakan</li>
              <li>• Pilih worker yang mengerjakan</li>
              <li>• Catat progress harian dalam %</li>
              <li>• Tambahkan foto untuk dokumentasi</li>
              <li>• Lokasi GPS otomatis jika tersedia</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
