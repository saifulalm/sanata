"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Save, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { createQcRecord, getAssignments, getAvailableWorkers } from "@/lib/workforceApi";
import { Badge, Button, Card, Toast, useToast } from "@/components/admin/ExtendedUI";

export default function NewQcPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [assignments, setAssignments] = useState<{ id: string; assignmentCode: string; workItem: string }[]>([]);
  const [workers, setWorkers] = useState<{ id: string; name: string; workerCode: string }[]>([]);

  const [form, setForm] = useState({
    assignmentId: "",
    workerId: "",
    itemDesc: "",
    criteria: "",
    measurement: "",
    result: "PASS" as "PASS" | "FAIL" | "REWORK",
    defectDesc: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (dataLoaded) return;
    try {
      const [aRes, wRes] = await Promise.all([
        getAssignments({ status: "IN_PROGRESS" }),
        getAvailableWorkers(),
      ]);
      setAssignments(aRes.data.map((a: any) => ({ id: a.id, assignmentCode: a.assignmentCode, workItem: a.workItem })));
      setWorkers(wRes.map((w: any) => ({ id: w.id, name: w.name, workerCode: w.workerCode })));
      setDataLoaded(true);
    } catch {
      toast("Gagal memuat data", "error");
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.assignmentId) e.assignmentId = "Pilih assignment";
    if (!form.workerId) e.workerId = "Pilih worker";
    if (!form.result) e.result = "Pilih hasil QC";
    if (form.result === "FAIL" && !form.defectDesc.trim()) e.defectDesc = "Deskripsi defect WAJIB untuk hasil FAIL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        await createQcRecord({
          assignmentId: form.assignmentId,
          workerId: form.workerId,
          itemDesc: form.itemDesc || undefined,
          criteria: form.criteria || undefined,
          measurement: form.measurement || undefined,
          result: form.result,
          defectDesc: form.defectDesc || undefined,
        });
        toast("QC berhasil dicatat", "success");
        router.push("/admin/workforce/qc");
        router.refresh();
      } catch (err) {
        toast(`Gagal menyimpan: ${String(err)}`, "error");
      }
    });
  };

  const RESULT_OPTIONS = [
    { value: "PASS", label: "Pass", color: "emerald" },
    { value: "FAIL", label: "Fail", color: "rose" },
    { value: "REWORK", label: "Rework", color: "amber" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/workforce/qc" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">QC Checklist Baru</h1>
          <p className="text-sm text-slate-400">Catat quality control baru</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Informasi QC</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Assignment *</label>
                  <select
                    value={form.assignmentId}
                    onFocus={loadData}
                    onChange={(e) => { setForm((p) => ({ ...p, assignmentId: e.target.value })); if (e.target.value) setErrors((e2) => { const { assignmentId, ...rest } = e2; return rest; }); }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                  >
                    <option value="">Pilih Assignment</option>
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>{a.assignmentCode} — {a.workItem.substring(0, 40)}</option>
                    ))}
                  </select>
                  {errors.assignmentId && <p className="mt-1 text-xs text-rose-400">{errors.assignmentId}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Worker *</label>
                  <select
                    value={form.workerId}
                    onFocus={loadData}
                    onChange={(e) => { setForm((p) => ({ ...p, workerId: e.target.value })); if (e.target.value) setErrors((e2) => { const { workerId, ...rest } = e2; return rest; }); }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
                  >
                    <option value="">Pilih Worker</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.workerCode})</option>
                    ))}
                  </select>
                  {errors.workerId && <p className="mt-1 text-xs text-rose-400">{errors.workerId}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Hasil QC *</label>
                <div className="flex gap-3">
                  {RESULT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, result: opt.value }))}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                        form.result === opt.value
                          ? opt.value === "PASS" ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                          : opt.value === "FAIL" ? "border-rose-400/50 bg-rose-500/20 text-rose-300"
                          : "border-amber-400/50 bg-amber-500/20 text-amber-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {opt.value === "PASS" && <CheckCircle size={16} />}
                      {opt.value === "FAIL" && <XCircle size={16} />}
                      {opt.value === "REWORK" && <RefreshCw size={16} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.result && <p className="mt-1 text-xs text-rose-400">{errors.result}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Item Description</label>
                  <input
                    value={form.itemDesc}
                    onChange={(e) => setForm((p) => ({ ...p, itemDesc: e.target.value }))}
                    placeholder="Besi Ø10mm - 50pcs"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Criteria</label>
                  <input
                    value={form.criteria}
                    onChange={(e) => setForm((p) => ({ ...p, criteria: e.target.value }))}
                    placeholder="Standar/persyaratan QC"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Measurement</label>
                  <input
                    value={form.measurement}
                    onChange={(e) => setForm((p) => ({ ...p, measurement: e.target.value }))}
                    placeholder="Hasil ukur aktual"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
                  />
                </div>
              </div>

              {(form.result === "FAIL" || form.result === "REWORK") && (
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
                    <AlertTriangle size={12} className="text-amber-400" />
                    Defect Description *
                  </label>
                  <textarea
                    value={form.defectDesc}
                    onChange={(e) => { setForm((p) => ({ ...p, defectDesc: e.target.value })); if (e.target.value) setErrors((e2) => { const { defectDesc, ...rest } = e2; return rest; }); }}
                    placeholder="Jelaskan defect yang ditemukan..."
                    rows={3}
                    className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none${errors.defectDesc ? " border-rose-400/50" : ""}`}
                  />
                  {errors.defectDesc && <p className="mt-1 text-xs text-rose-400">{errors.defectDesc}</p>}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 text-sm font-medium text-slate-400">Ringkasan</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hasil</span>
                <Badge
                  tone={
                    form.result === "PASS" ? "success" : form.result === "FAIL" ? "danger" : "warning"
                  }
                >
                  {form.result}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Assignment</span>
                <span className={form.assignmentId ? "text-white" : "text-slate-600"}>
                  {form.assignmentId ? "Terpilih" : "—"}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
            <Link href="/admin/workforce/qc" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-400 hover:border-white/20">
              Batal
            </Link>
            <Button onClick={handleSubmit} loading={isPending}>
              <Save size={16} /> Simpan QC
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
