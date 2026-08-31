"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, Save, AlertTriangle } from "lucide-react";
import {
  createMethodStatement,
  WBS_STAGES,
  type MethodStatement,
  type WbsStage,
} from "@/lib/workforceApi";
import { Badge, Button, Card, Toast, useToast } from "@/components/admin/ExtendedUI";

export default function NewMethodStatementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    methodCode: "",
    wbsStage: "PRE_CONSTRUCTION" as WbsStage,
    workItem: "",
    scope: "",
    reference: "",
    tools: "",
    materials: "",
    precondition: "",
    criticalPoints: "",
    acceptanceCriteria: "",
    tolerance: "",
    holdPoint: false,
    safety: "",
    evidenceRequirement: "",
    reworkProcedure: "",
    responsibleRoles: "",
    lessonLearned: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.methodCode.trim()) e.methodCode = "Method Code wajib diisi";
    if (!form.workItem.trim()) e.workItem = "Work Item wajib diisi";
    if (!form.acceptanceCriteria.trim()) e.acceptanceCriteria = "Acceptance Criteria wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        const data: Partial<MethodStatement> = {
          methodCode: form.methodCode,
          wbsStage: form.wbsStage,
          workItem: form.workItem,
          scope: form.scope || null,
          reference: form.reference || null,
          tools: form.tools ? form.tools.split(",").map((t) => t.trim()).filter(Boolean) : [],
          materials: form.materials ? form.materials.split(",").map((m) => m.trim()).filter(Boolean) : [],
          precondition: form.precondition || null,
          criticalPoints: form.criticalPoints || null,
          acceptanceCriteria: form.acceptanceCriteria,
          tolerance: form.tolerance || null,
          holdPoint: form.holdPoint,
          safety: form.safety || null,
          evidenceRequirement: form.evidenceRequirement ? form.evidenceRequirement.split(",").map((e) => e.trim()).filter(Boolean) : [],
          reworkProcedure: form.reworkProcedure || null,
          responsibleRoles: form.responsibleRoles ? form.responsibleRoles.split(",").map((r) => r.trim()).filter(Boolean) : [],
          lessonLearned: form.lessonLearned || null,
        };

        await createMethodStatement(data);
        toast("Method statement berhasil dibuat", "success");
        router.push("/admin/workforce/method-statements");
      } catch (err: any) {
        toast(err.message || "Gagal membuat method statement", "error");
      }
    });
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border ${errors[field] ? "border-rose-500" : "border-white/10"} bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/method-statements"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Method Statement Baru</h1>
          <p className="text-sm text-slate-400">Tambah method statement baru untuk standar pekerjaan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Informasi Dasar</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Method Code *
              </label>
              <input
                type="text"
                value={form.methodCode}
                onChange={(e) => setForm({ ...form, methodCode: e.target.value })}
                placeholder="e.g., STR-001"
                className={inputClass("methodCode")}
              />
              {errors.methodCode && <p className="mt-1 text-xs text-rose-400">{errors.methodCode}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">WBS Stage *</label>
              <select
                value={form.wbsStage}
                onChange={(e) => setForm({ ...form, wbsStage: e.target.value as WbsStage })}
                className={inputClass("wbsStage")}
              >
                {Object.entries(WBS_STAGES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Work Item *
              </label>
              <input
                type="text"
                value={form.workItem}
                onChange={(e) => setForm({ ...form, workItem: e.target.value })}
                placeholder="e.g., Pondasi Beton Bertulang"
                className={inputClass("workItem")}
              />
              {errors.workItem && <p className="mt-1 text-xs text-rose-400">{errors.workItem}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Scope</label>
              <textarea
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                placeholder="Deskripsi lingkup pekerjaan..."
                rows={3}
                className={inputClass("scope")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Reference</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Shop drawing reference, SNI, dll"
                className={inputClass("reference")}
              />
            </div>
          </div>
        </Card>

        {/* Tools & Materials */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Tools & Materials</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Tools (pisah dengan koma)
              </label>
              <input
                type="text"
                value={form.tools}
                onChange={(e) => setForm({ ...form, tools: e.target.value })}
                placeholder="e.g., Cangkul, Sekop, Beton Mixer"
                className={inputClass("tools")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Materials (pisah dengan koma)
              </label>
              <input
                type="text"
                value={form.materials}
                onChange={(e) => setForm({ ...form, materials: e.target.value })}
                placeholder="e.g., Semen, Pasir, Batu Bata"
                className={inputClass("materials")}
              />
            </div>
          </div>
        </Card>

        {/* Quality & Safety */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Quality & Safety</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Acceptance Criteria *
              </label>
              <textarea
                value={form.acceptanceCriteria}
                onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                placeholder="Kriteria penerimaan pekerjaan..."
                rows={3}
                className={inputClass("acceptanceCriteria")}
              />
              {errors.acceptanceCriteria && <p className="mt-1 text-xs text-rose-400">{errors.acceptanceCriteria}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Tolerance</label>
              <input
                type="text"
                value={form.tolerance}
                onChange={(e) => setForm({ ...form, tolerance: e.target.value })}
                placeholder="e.g., ±5mm"
                className={inputClass("tolerance")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Critical Points</label>
              <input
                type="text"
                value={form.criticalPoints}
                onChange={(e) => setForm({ ...form, criticalPoints: e.target.value })}
                placeholder="Titik kritis yang harus diawasi"
                className={inputClass("criticalPoints")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Safety</label>
              <textarea
                value={form.safety}
                onChange={(e) => setForm({ ...form, safety: e.target.value })}
                placeholder="Persyaratan K3 yang harus dipatuhi..."
                rows={2}
                className={inputClass("safety")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Evidence Requirement (pisah dengan koma)
              </label>
              <input
                type="text"
                value={form.evidenceRequirement}
                onChange={(e) => setForm({ ...form, evidenceRequirement: e.target.value })}
                placeholder="e.g., Foto sebelum, Foto sesudah, Video proses"
                className={inputClass("evidenceRequirement")}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="holdPoint"
                checked={form.holdPoint}
                onChange={(e) => setForm({ ...form, holdPoint: e.target.checked })}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="holdPoint" className="flex items-center gap-2 text-sm text-white">
                <AlertTriangle size={14} className="text-amber-400" />
                Hold Point (wajib QC sebelum proceed)
              </label>
            </div>
          </div>
        </Card>

        {/* Additional */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Informasi Tambahan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Precondition
              </label>
              <textarea
                value={form.precondition}
                onChange={(e) => setForm({ ...form, precondition: e.target.value })}
                placeholder="Syarat yang harus dipenuhi sebelum pekerjaan dimulai..."
                rows={2}
                className={inputClass("precondition")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Rework Procedure</label>
              <textarea
                value={form.reworkProcedure}
                onChange={(e) => setForm({ ...form, reworkProcedure: e.target.value })}
                placeholder="Prosedur bila hasil QC rework..."
                rows={2}
                className={inputClass("reworkProcedure")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Responsible Roles (pisah dengan koma)
              </label>
              <input
                type="text"
                value={form.responsibleRoles}
                onChange={(e) => setForm({ ...form, responsibleRoles: e.target.value })}
                placeholder="e.g., Site Manager, QC Inspector, Mandor"
                className={inputClass("responsibleRoles")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Lesson Learned</label>
              <textarea
                value={form.lessonLearned}
                onChange={(e) => setForm({ ...form, lessonLearned: e.target.value })}
                placeholder="Catatan pembelajaran dari pengalaman sebelumnya..."
                rows={2}
                className={inputClass("lessonLearned")}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/workforce/method-statements"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Batal
          </Link>
          <Button type="submit" loading={isPending}>
            <Save size={16} />
            Simpan Method Statement
          </Button>
        </div>
      </form>
    </div>
  );
}
