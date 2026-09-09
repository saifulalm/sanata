"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Download, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface ImportItem {
  description: string;
  unit: string;
  volume: number;
  unitPrice: number;
  amount: number;
  startOffsetDays: number;
  durationDays: number;
  bobot: number;
}

interface ImportSection {
  name: string;
  order: number;
  items: ImportItem[];
}

interface ImportData {
  number?: string;
  title: string;
  clientName?: string;
  location?: string;
  projectDate?: string;
  scheduleStart: string;
  restDays: number[];
  notes?: string;
  sections: ImportSection[];
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface ImportStatistics {
  totalRows: number;
  validRows: number;
  errorRows: number;
  totalSections: number;
  totalItems: number;
  totalAmount: number;
  totalBobot: number;
  earliestStart: string | null;
  latestEnd: string | null;
  totalDuration: number;
}

interface ImportPreview {
  valid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
  data: ImportData | null;
  statistics: ImportStatistics;
}

interface ImportFormProps {
  onSuccess?: (rabId: string, number: string) => void;
  onCancel?: () => void;
}

export function ImportRabForm({ onSuccess, onCancel }: ImportFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "form" | "success">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [formData, setFormData] = useState<Partial<ImportData>>({});
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formDataFile = new FormData();
      formDataFile.append("file", file);

      const res = await fetch("/api/rab/import-preview", {
        method: "POST",
        body: formDataFile,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || "Gagal parsing file");
      }

      setPreview(result.data);
      setFormData(result.data?.data || {});
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/rab/import-template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_rab.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Gagal mengunduh template");
    }
  };

  // Confirm import
  const confirmImport = async () => {
    if (!formData.title || !formData.scheduleStart) {
      setError("Nama proyek dan tanggal mulai wajib diisi");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rab/import-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: formData.number || `RAB-${Date.now()}`,
          title: formData.title,
          clientName: formData.clientName,
          location: formData.location,
          projectDate: formData.projectDate,
          scheduleStart: formData.scheduleStart,
          restDays: formData.restDays || [0],
          notes: formData.notes,
          sections: preview?.data?.sections || [],
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || "Gagal import");
      }

      setStep("success");
      onSuccess?.(result.data.id, result.data.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Import RAB dari Excel</h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload file Excel dengan format yang benar untuk import RAB beserta jadwalnya
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-cyan-400" size={24} />
              <div>
                <p className="text-sm font-medium text-white">Download Template Excel</p>
                <p className="text-xs text-slate-400">Gunakan template ini untuk format yang benar</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              <Download size={16} />
              Download Template
            </button>
          </div>

          {/* Upload Area */}
          <label
            className={`flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              isLoading
                ? "border-slate-600 bg-slate-800/30"
                : "border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500 border-t-transparent" />
                <p className="text-sm text-slate-400">Memproses file...</p>
              </>
            ) : (
              <>
                <Upload className="text-cyan-400" size={32} />
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Klik atau drag file Excel ke sini</p>
                  <p className="text-xs text-slate-400 mt-1">.xlsx atau .xls, maks 10MB</p>
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          {/* Statistics Card */}
          <div className="grid grid-cols-4 gap-4">
            <StatBox label="Sections" value={preview.statistics.totalSections} />
            <StatBox label="Items" value={preview.statistics.totalItems} />
            <StatBox label="Total Nilai" value={formatRupiah(preview.statistics.totalAmount)} />
            <StatBox label="Total Bobot" value={`${preview.statistics.totalBobot.toFixed(1)}%`} />
          </div>

          {/* Errors/Warnings */}
          {(preview.errors.length > 0 || preview.warnings.length > 0) && (
            <div className="space-y-2">
              {preview.errors.map((err, i) => (
                <div key={`err-${i}`} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                  <AlertCircle className="text-red-400 shrink-0" size={16} />
                  <span className="text-red-400">
                    {err.row > 0 ? `Baris ${err.row}: ` : ""}
                    {err.message}
                  </span>
                </div>
              ))}
              {preview.warnings.map((warn, i) => (
                <div key={`warn-${i}`} className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                  <AlertCircle className="text-yellow-400 shrink-0" size={16} />
                  <span className="text-yellow-400">
                    {warn.row > 0 ? `Baris ${warn.row}: ` : ""}
                    {warn.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Validation Status */}
          {preview.valid ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Check className="text-emerald-400 shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-emerald-400">Data Valid</p>
                <p className="text-xs text-emerald-400/70">Data siap untuk di-import</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertCircle className="text-red-400 shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-red-400">Data Tidak Valid</p>
                <p className="text-xs text-red-400/70">Perbaiki error di atas sebelum meng-import</p>
              </div>
            </div>
          )}

          {/* Data Preview Table */}
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="text-left text-xs text-slate-400 uppercase">
                    <th className="px-3 py-2">Section</th>
                    <th className="px-3 py-2">Deskripsi</th>
                    <th className="px-3 py-2 text-right">Volume</th>
                    <th className="px-3 py-2 text-right">Harga</th>
                    <th className="px-3 py-2 text-right">Jumlah</th>
                    <th className="px-3 py-2 text-right">Bobot %</th>
                    <th className="px-3 py-2 text-center">Offset</th>
                    <th className="px-3 py-2 text-center">Durasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {preview.data?.sections.map((sec) =>
                    sec.items.map((item, i) => (
                      <tr key={`${sec.order}-${i}`} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-slate-400 text-xs">{sec.name}</td>
                        <td className="px-3 py-2 text-white">{item.description}</td>
                        <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                          {item.volume} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-300 tabular-nums">
                          {formatRupiah(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-cyan-400 tabular-nums font-medium">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="px-3 py-2 text-right text-yellow-400 tabular-nums">
                          {item.bobot.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400 tabular-nums">
                          H+{item.startOffsetDays}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-400 tabular-nums">
                          {item.durationDays} hari
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <FormField label="Nomor RAB *">
              <input
                type="text"
                value={formData.number || ""}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="RAB-2026-XXX"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </FormField>
            <FormField label="Nama Proyek *">
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nama proyek"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </FormField>
            <FormField label="Nama Klien">
              <input
                type="text"
                value={formData.clientName || ""}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Nama klien/pemilik proyek"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </FormField>
            <FormField label="Lokasi">
              <input
                type="text"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Alamat lokasi proyek"
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </FormField>
            <FormField label="Tanggal Mulai *">
              <input
                type="date"
                value={formData.scheduleStart || ""}
                onChange={(e) => setFormData({ ...formData, scheduleStart: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </FormField>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setStep("upload"); setPreview(null); }}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              onClick={confirmImport}
              disabled={isLoading || !formData.title || !formData.scheduleStart || (preview && !preview.valid)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-500 text-slate-900 font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Import Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="text-emerald-400" size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">Import Berhasil!</h3>
            <p className="text-sm text-slate-400 mt-1">
              RAB berhasil diimport ke sistem
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/admin/rab"}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-500 text-slate-900 font-medium hover:bg-cyan-400 transition"
          >
            Lihat Daftar RAB
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default ImportRabForm;
