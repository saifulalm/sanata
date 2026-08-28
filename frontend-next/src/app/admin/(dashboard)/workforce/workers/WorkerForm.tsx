"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Upload,
  Camera,
} from "lucide-react";
import {
  createWorker,
  updateWorker,
  getAvailableWorkers,
  type Worker,
  type WorkerGrade,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";

const ROLES = [
  "DIREKTUR_UTAMA",
  "DIREKTUR",
  "MANAGER_PROYEK",
  "SITE_MANAGER",
  "PIMPINAN_PROYEK",
  "KEPALA_TUKANG",
  "TUKANG_BATU",
  "TUKANG_KAYU",
  "TUKANG_BESI",
  "OPERATOR",
  "MANDOR",
  "PEKERJA",
  "STAF",
  "LAINNYA",
];

const ROLE_LABELS: Record<string, string> = {
  DIREKTUR_UTAMA: "Direktur Utama",
  DIREKTUR: "Direktur",
  MANAGER_PROYEK: "Manager Proyek",
  SITE_MANAGER: "Site Manager",
  PIMPINAN_PROYEK: "Pimpinan Proyek",
  KEPALA_TUKANG: "Kepala Tukang",
  TUKANG_BATU: "Tukang Batu",
  TUKANG_KAYU: "Tukang Kayu",
  TUKANG_BESI: "Tukang Besi",
  OPERATOR: "Operator",
  MANDOR: "Mandor",
  PEKERJA: "Pekerja",
  STAF: "Staf",
  LAINNYA: "Lainnya",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
  { value: "ON_LEAVE", label: "Cuti" },
  { value: "TERMINATED", label: "Diberhentikan" },
];

const GRADE_OPTIONS = [
  { value: "A", label: "Grade A" },
  { value: "B", label: "Grade B" },
  { value: "C", label: "Grade C" },
  { value: "D", label: "Grade D" },
];

interface WorkerFormProps {
  worker?: Worker;
  isEdit?: boolean;
}

export function WorkerForm({ worker, isEdit = false }: WorkerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: worker?.name || "",
    role: worker?.role || "PEKERJA",
    phone: worker?.phone || "",
    address: worker?.address || "",
    ktpNumber: worker?.ktpNumber || "",
    joinDate: worker?.joinDate?.split("T")[0] || "",
    experienceYears: worker?.experienceYears?.toString() || "",
    skills: worker?.skills?.join(", ") || "",
    certificates: worker?.certificates?.join(", ") || "",
    rate: worker?.rate ? (parseFloat(worker.rate)).toString() : "",
    grade: worker?.grade || "",
    status: worker?.status || "ACTIVE",
    ktpPhotoUrl: worker?.ktpPhotoUrl || "",
    facePhotoUrl: worker?.facePhotoUrl || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Nama wajib diisi";
    if (!form.role) newErrors.role = "Role wajib dipilih";
    if (form.phone && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) {
      newErrors.phone = "Format nomor telepon tidak valid";
    }
    if (form.ktpNumber && form.ktpNumber.length < 10) {
      newErrors.ktpNumber = "Nomor KTP minimal 10 digit";
    }
    if (form.rate && isNaN(parseFloat(form.rate))) {
      newErrors.rate = "Rate harus berupa angka";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const certificates = form.certificates
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const data = {
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      ktpNumber: form.ktpNumber.trim() || undefined,
      joinDate: form.joinDate || undefined,
      experienceYears: form.experienceYears ? parseInt(form.experienceYears) : undefined,
      skills: skills.length > 0 ? skills : [],
      certificates: certificates.length > 0 ? certificates : [],
      rate: form.rate ? String(parseFloat(form.rate)) : undefined,
      grade: form.grade as WorkerGrade | undefined,
      status: form.status as Worker["status"],
      ktpPhotoUrl: form.ktpPhotoUrl || undefined,
      facePhotoUrl: form.facePhotoUrl || undefined,
    };

    startTransition(async () => {
      try {
        if (isEdit && worker) {
          await updateWorker(worker.id, data);
          toast("Worker berhasil diperbarui", "success");
        } else {
          await createWorker(data);
          toast("Worker berhasil ditambahkan", "success");
        }
        router.push("/admin/workforce/workers");
        router.refresh();
      } catch (err) {
        toast(`Gagal menyimpan: ${err}`, "error");
      }
    });
  };

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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
            <h1 className="text-2xl font-bold text-white">
              {isEdit ? "Edit Worker" : "Tambah Worker Baru"}
            </h1>
            <p className="text-sm text-slate-400">
              {isEdit ? `Edit data ${worker?.name}` : "Tambahkan tenaga kerja baru ke database"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-white">Informasi Dasar</h3>
              <div className="space-y-4">
                <Input
                  label="Nama Lengkap *"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  error={errors.name}
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                      Role / Jabatan *
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setField("role", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white focus:border-cyan-400/40 focus:outline-none"
                    >
                      <option value="">Pilih Role</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-rose-400">{errors.role}</p>}
                  </div>

                  <Input
                    label="No. Telepon"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    error={errors.phone}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="No. KTP"
                    value={form.ktpNumber}
                    onChange={(e) => setField("ktpNumber", e.target.value)}
                    placeholder="16 digit nomor KTP"
                    error={errors.ktpNumber}
                  />

                  <Input
                    label="Tanggal Masuk"
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => setField("joinDate", e.target.value)}
                  />
                </div>

                <Textarea
                  label="Alamat"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Alamat lengkap"
                  rows={3}
                />
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-lg font-semibold text-white">Kompetensi & Grade</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Pengalaman (Tahun)"
                    type="number"
                    min="0"
                    value={form.experienceYears}
                    onChange={(e) => setField("experienceYears", e.target.value)}
                    placeholder="0"
                  />

                  <Input
                    label="Rate / Gaji per Hari"
                    type="number"
                    min="0"
                    value={form.rate}
                    onChange={(e) => setField("rate", e.target.value)}
                    placeholder="150000"
                    error={errors.rate}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Grade</label>
                    <select
                      value={form.grade}
                      onChange={(e) => setField("grade", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white focus:border-cyan-400/40 focus:outline-none"
                    >
                      <option value="">Pilih Grade</option>
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white focus:border-cyan-400/40 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Skills (pisahkan dengan koma)"
                  value={form.skills}
                  onChange={(e) => setField("skills", e.target.value)}
                  placeholder="masonry, carpentry, welding"
                />

                <Input
                  label="Sertifikat (pisahkan dengan koma)"
                  value={form.certificates}
                  onChange={(e) => setField("certificates", e.target.value)}
                  placeholder="Sertifikat K3, AWS D1.1"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-white">Foto</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Foto Wajah</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={form.facePhotoUrl}
                      onChange={(e) => setField("facePhotoUrl", e.target.value)}
                      placeholder="URL foto wajah"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
                    />
                  </div>
                  {form.facePhotoUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
                      <img
                        src={form.facePhotoUrl}
                        alt="Face"
                        className="h-32 w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Foto KTP</label>
                  <input
                    type="url"
                    value={form.ktpPhotoUrl}
                    onChange={(e) => setField("ktpPhotoUrl", e.target.value)}
                    placeholder="URL foto KTP"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
                  />
                  {form.ktpPhotoUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
                      <img
                        src={form.ktpPhotoUrl}
                        alt="KTP"
                        className="h-32 w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Preview */}
            {isEdit && worker && (
              <Card>
                <h3 className="mb-4 text-lg font-semibold text-white">Preview</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                    {form.facePhotoUrl ? (
                      <img src={form.facePhotoUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold">{form.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{form.name || "—"}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[form.role] || form.role}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
          <Link
            href="/admin/workforce/workers"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
          >
            Batal
          </Link>
          <Button type="submit" loading={isPending}>
            <Save size={16} />
            {isEdit ? "Simpan Perubahan" : "Simpan Worker"}
          </Button>
        </div>
      </form>
    </div>
  );
}
