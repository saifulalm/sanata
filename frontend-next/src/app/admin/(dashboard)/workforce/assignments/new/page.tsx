"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Save, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Button, Card, Input, Textarea, Select, useToast } from "@/components/admin/ExtendedUI";
import { createAssignment, getAvailableWorkers, getWorkers } from "@/lib/workforceApi";
import type { Worker } from "@/lib/workforceApi";

interface RabOption {
  value: string;
  label: string;
  subtitle?: string;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  const [form, setForm] = useState({
    rabId: "",
    wbsCode: "",
    workItem: "",
    methodRef: "",
    responsiblePersonId: "",
    responsibleMandorId: "",
    plannedStart: "",
    plannedEnd: "",
    scopeDescription: "",
    priority: "5",
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [selectedResponsible, setSelectedResponsible] = useState<string>("");
  const [selectedMandor, setSelectedMandor] = useState<string>("");

  // Static RAB options for demo (in production, these would come from API)
  const rabOptions: RabOption[] = [
    { value: "demo-1", label: "RAB-2026-001", subtitle: "Pembangunan Gedung Perkantoran 4 Lantai" },
    { value: "demo-2", label: "RAB-2026-002", subtitle: "Renovasi & Perluasan Rumah Tinggal Pak Budi" },
  ];

  useEffect(() => {
    async function fetchWorkers() {
      try {
        // Fetch all workers to populate responsible person and mandor dropdowns
        const response = await getWorkers({ pageSize: 100 });
        setWorkers(response.data);
      } catch (error) {
        console.error("Failed to fetch workers:", error);
      } finally {
        setIsLoadingWorkers(false);
      }
    }
    fetchWorkers();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const filteredWorkers = workers.filter(w =>
    !workerSearch ||
    w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.workerCode.toLowerCase().includes(workerSearch.toLowerCase())
  );

  // Separate mandors (MANDOR role) from regular workers
  const mandors = filteredWorkers.filter(w => w.role === "MANDOR");
  const regularWorkers = filteredWorkers.filter(w => w.role !== "MANDOR");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.workItem.trim()) {
      toast("Nama pekerjaan wajib diisi", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAssignment({
        rabId: form.rabId || undefined,
        wbsCode: form.wbsCode || undefined,
        workItem: form.workItem,
        methodRef: form.methodRef || undefined,
        responsiblePersonId: selectedResponsible || undefined,
        responsibleMandorId: selectedMandor || undefined,
        plannedStart: form.plannedStart || undefined,
        plannedEnd: form.plannedEnd || undefined,
        scopeDescription: form.scopeDescription || undefined,
        priority: parseInt(form.priority) || 5,
      });

      toast("Assignment berhasil dibuat", "success");
      router.push(`/admin/workforce/assignments/${result.id}`);
    } catch (error) {
      toast(String(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/assignments"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <PageHeader
          eyebrow="SANTRA"
          title="Assignment Baru"
          description="Buat penugasan pekerjaan baru berbasis WBS"
        />
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Project & WBS */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Informasi Proyek</h3>
          <div className="space-y-4">
            <Select
              label="Proyek / RAB"
              value={form.rabId}
              onChange={(e) => handleChange("rabId", e.target.value)}
              options={[
                { value: "", label: "Pilih proyek..." },
                ...rabOptions.map(r => ({ value: r.value, label: `${r.label} - ${r.subtitle}` })),
              ]}
            />

            <Input
              label="Kode WBS"
              value={form.wbsCode}
              onChange={(e) => handleChange("wbsCode", e.target.value)}
              placeholder="Contoh: WBS-01.01"
            />
          </div>
        </Card>

        {/* Work Item */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Detail Pekerjaan</h3>
          <div className="space-y-4">
            <Input
              label="Nama Pekerjaan *"
              value={form.workItem}
              onChange={(e) => handleChange("workItem", e.target.value)}
              placeholder="Contoh: Pekerjaan pondasi Strauss pile D300"
              required
            />

            <Input
              label="Referensi Metode"
              value={form.methodRef}
              onChange={(e) => handleChange("methodRef", e.target.value)}
              placeholder="Contoh: Shop drawing no. SD-STR-001"
            />

            <Textarea
              label="Deskripsi Lingkup"
              value={form.scopeDescription}
              onChange={(e) => handleChange("scopeDescription", e.target.value)}
              placeholder="Jelaskan detail lingkup pekerjaan..."
              rows={3}
            />
          </div>
        </Card>

        {/* Assignment */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Penugasan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Responsible Person */}
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Pekerja Responsable
              </label>
              <input
                type="search"
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                placeholder="Cari pekerja..."
                className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
                {isLoadingWorkers ? (
                  <p className="p-2 text-xs text-slate-500">Memuat...</p>
                ) : regularWorkers.length === 0 ? (
                  <p className="p-2 text-xs text-slate-500">Tidak ada pekerja ditemukan</p>
                ) : (
                  regularWorkers.map((worker) => (
                    <button
                      key={worker.id}
                      type="button"
                      onClick={() => {
                        setSelectedResponsible(worker.id);
                        setWorkerSearch("");
                      }}
                      className={`w-full rounded-lg p-2 text-left text-sm transition ${
                        selectedResponsible === worker.id
                          ? "border border-cyan-400/40 bg-cyan-500/10"
                          : "border border-transparent hover:bg-white/5"
                      }`}
                    >
                      <span className="block font-medium text-white">{worker.name}</span>
                      <span className="text-xs text-slate-500">
                        {worker.workerCode} • {worker.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Mandor */}
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Mandor
              </label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
                <button
                  type="button"
                  onClick={() => setSelectedMandor("")}
                  className={`w-full rounded-lg p-2 text-left text-sm transition ${
                    selectedMandor === ""
                      ? "border border-cyan-400/40 bg-cyan-500/10"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <span className="block font-medium text-white">Tidak ada mandor</span>
                </button>
                {mandors.map((mandor) => (
                  <button
                    key={mandor.id}
                    type="button"
                    onClick={() => setSelectedMandor(mandor.id)}
                    className={`w-full rounded-lg p-2 text-left text-sm transition ${
                      selectedMandor === mandor.id
                        ? "border border-cyan-400/40 bg-cyan-500/10"
                        : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span className="block font-medium text-white">{mandor.name}</span>
                    <span className="text-xs text-slate-500">
                      {mandor.workerCode} • {mandor.grade || ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Timeline & Priority */}
        <Card>
          <h3 className="text-sm font-medium text-slate-400 mb-4">Jadwal & Prioritas</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={form.plannedStart}
              onChange={(e) => handleChange("plannedStart", e.target.value)}
            />

            <Input
              label="Tanggal Selesai"
              type="date"
              value={form.plannedEnd}
              onChange={(e) => handleChange("plannedEnd", e.target.value)}
            />

            <Select
              label="Prioritas"
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              options={[
                { value: "1", label: "P1 - Sangat Tinggi" },
                { value: "2", label: "P2 - Tinggi" },
                { value: "3", label: "P3 - Sedang-Tinggi" },
                { value: "4", label: "P4 - Sedang" },
                { value: "5", label: "P5 - Normal" },
                { value: "6", label: "P6 - Rendah" },
                { value: "7", label: "P7 - Sangat Rendah" },
              ]}
            />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/workforce/assignments">
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            <Save size={16} />
            Simpan Assignment
          </Button>
        </div>
      </form>
    </div>
  );
}
