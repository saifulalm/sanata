"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  FileSignature,
  Download,
  GripVertical,
  Boxes,
  CalendarRange,
  ClipboardCheck,
  Receipt,
} from "lucide-react";
import { createRabAction, updateRabAction, exportRabCsvAction, type RabActionState } from "./actions";
import { RAB_STATUS_LABEL, type Ahsp, type Rab, type RabStatus } from "@/lib/estimation";
import { formatRupiah } from "@/lib/format";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { inputClass } from "@/components/admin/ui";

const initialState: RabActionState = { status: "idle" };

const cellInputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none";

interface DraftItem {
  key: string;
  ahspId: string | null;
  description: string;
  unit: string;
  volume: string;
  unitPrice: string;
}

interface DraftSection {
  key: string;
  name: string;
  items: DraftItem[];
}

let keySeq = 0;
const nextKey = () => `k${++keySeq}-${Date.now()}`;

function toDraft(rab: Rab | null): DraftSection[] {
  if (!rab) return [{ key: nextKey(), name: "Pekerjaan Persiapan", items: [] }];
  return rab.sections.map((s) => ({
    key: `s-${s.id}`,
    name: s.name,
    items: s.items.map((i) => ({
      key: `i-${i.id}`,
      ahspId: i.ahspId,
      description: i.description,
      unit: i.unit,
      volume: i.volume,
      unitPrice: i.unitPrice,
    })),
  }));
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let rest = n;
  let out = "";
  for (const [value, symbol] of map) {
    while (rest >= value) { out += symbol; rest -= value; }
  }
  return out;
}

const cardClass = "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5";

export function RabEditor({ rab, ahspOptions }: { rab: Rab | null; ahspOptions: Ahsp[] }) {
  const action = rab ? updateRabAction.bind(null, rab.id) : createRabAction;
  const [state, formAction] = useActionState(action, initialState);

  const [sections, setSections] = useState<DraftSection[]>(() => toDraft(rab));
  const [taxPct, setTaxPct] = useState(rab?.taxPct ?? "11");
  const [discountPct, setDiscountPct] = useState(rab?.discountPct ?? "0");
  const projectDateValue = rab?.projectDate ? rab.projectDate.slice(0, 10) : "";
  const [downloadError, setDownloadError] = useState("");
  const [isDownloading, startDownload] = useTransition();

  const ahspById = useMemo(() => new Map(ahspOptions.map((a) => [a.id, a])), [ahspOptions]);
  const ahspSelectOptions = useMemo(
    () =>
      ahspOptions.map((a) => ({
        value: a.id,
        label: `${a.code} - ${a.name} (Rp ${formatRupiah(a.computed.unitPrice)}/${a.unit})`,
        searchText: `${a.code} ${a.name} ${a.category ?? ""} ${a.unit}`,
      })),
    [ahspOptions]
  );

  const totals = useMemo(() => {
    const sectionTotals = sections.map((s) =>
      s.items.reduce((sum, i) => sum + Number(i.volume || 0) * Number(i.unitPrice || 0), 0)
    );
    const subtotal = sectionTotals.reduce((a, b) => a + b, 0);
    const discountAmount = (subtotal * Number(discountPct || 0)) / 100;
    const taxableBase = subtotal - discountAmount;
    const taxAmount = (taxableBase * Number(taxPct || 0)) / 100;
    return { sectionTotals, subtotal, discountAmount, taxableBase, taxAmount, total: taxableBase + taxAmount };
  }, [sections, taxPct, discountPct]);

  const payload = useMemo(
    () =>
      JSON.stringify(
        sections.map((s) => ({
          name: s.name,
          items: s.items.map((i) => ({
            ahspId: i.ahspId,
            description: i.description,
            unit: i.unit,
            volume: i.volume || "0",
            unitPrice: i.unitPrice || "0",
          })),
        }))
      ),
    [sections]
  );

  const addSection = () =>
    setSections((prev) => [...prev, { key: nextKey(), name: "Bagian Baru", items: [] }]);

  const removeSection = (key: string) => setSections((prev) => prev.filter((s) => s.key !== key));

  const renameSection = (key: string, name: string) =>
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, name } : s)));

  const addItem = (sectionKey: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.key === sectionKey
          ? { ...s, items: [...s.items, { key: nextKey(), ahspId: null, description: "", unit: "ls", volume: "1", unitPrice: "0" }] }
          : s
      )
    );

  const updateItem = (sectionKey: string, itemKey: string, patch: Partial<DraftItem>) =>
    setSections((prev) =>
      prev.map((s) =>
        s.key === sectionKey
          ? { ...s, items: s.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) }
          : s
      )
    );

  const removeItem = (sectionKey: string, itemKey: string) =>
    setSections((prev) =>
      prev.map((s) => (s.key === sectionKey ? { ...s, items: s.items.filter((i) => i.key !== itemKey) } : s))
    );

  const applyAhsp = (sectionKey: string, itemKey: string, ahspId: string) => {
    const ahsp = ahspById.get(ahspId);
    if (!ahsp) { updateItem(sectionKey, itemKey, { ahspId: null }); return; }
    updateItem(sectionKey, itemKey, { ahspId: ahsp.id, description: ahsp.name, unit: ahsp.unit, unitPrice: ahsp.computed.unitPrice });
  };

  const handleDownloadCsv = () => {
    if (!rab) return;
    setDownloadError("");
    startDownload(async () => {
      const result = await exportRabCsvAction(rab.id);
      if (!result.ok || !result.csv) { setDownloadError(result.message ?? "Gagal mengunduh CSV"); return; }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "rab.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const navBtn =
    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 transition";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="sections" value={payload} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/rab" className="mb-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
            <ArrowLeft size={14} /> Kembali ke daftar RAB
          </Link>
          <h1 className="text-2xl font-semibold text-white">{rab ? rab.number : "RAB Baru"}</h1>
          <p className="text-sm text-slate-400">
            {rab ? "Ubah rincian pekerjaan dan nilai anggaran" : "Nomor RAB dibuat otomatis saat disimpan"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rab && (
            <>
              <button type="button" onClick={handleDownloadCsv} disabled={isDownloading} className={`${navBtn} disabled:opacity-50`}>
                <Download size={15} /> {isDownloading ? "Menyiapkan..." : "Excel (CSV)"}
              </button>
              <Link href={`/admin/print/rab/${rab.id}`} target="_blank" className={navBtn}>
                <FileText size={15} /> Cetak / PDF
              </Link>
              <Link href={`/admin/rab/${rab.id}/takeoff`} className={navBtn}>
                <Boxes size={15} /> Takeoff
              </Link>
              <Link href={`/admin/rab/${rab.id}/schedule`} className={navBtn}>
                <CalendarRange size={15} /> Jadwal &amp; Kurva S
              </Link>
              <Link href={`/admin/rab/${rab.id}/daily-reports`} className={navBtn}>
                <ClipboardCheck size={15} /> Laporan Harian
              </Link>
              <Link href={`/admin/rab/${rab.id}/billings`} className={navBtn}>
                <Receipt size={15} /> Termin
              </Link>
              <Link
                href={`/admin/quotations/new?rabId=${rab.id}`}
                className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-400/20 transition"
              >
                <FileSignature size={15} /> Buat Penawaran
              </Link>
            </>
          )}
          <SaveButton label={rab ? "Simpan Perubahan" : "Simpan RAB"} />
        </div>
      </div>

      {downloadError && <p className="rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{downloadError}</p>}
      {state.status === "error" && <p className="rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{state.message}</p>}
      {state.status === "success" && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-200">{state.message}</p>
      )}

      {/* --- Identitas RAB --- */}
      <div className={`grid gap-4 ${cardClass} sm:grid-cols-2 lg:grid-cols-4`}>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Nama Pekerjaan</label>
          <input name="title" defaultValue={rab?.title} required placeholder="Pembangunan Gudang Logistik" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Pemilik / Klien</label>
          <input name="clientName" defaultValue={rab?.clientName ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Lokasi</label>
          <input name="location" defaultValue={rab?.location ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Tanggal Proyek</label>
          <input name="projectDate" type="date" defaultValue={projectDateValue} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Status</label>
          <select name="status" defaultValue={rab?.status ?? "DRAFT"} className={inputClass}>
            {(Object.keys(RAB_STATUS_LABEL) as RabStatus[]).map((s) => (
              <option key={s} value={s}>{RAB_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">PPN (%)</label>
          <input name="taxPct" type="number" min="0" max="100" step="0.01" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Diskon (%)</label>
          <input name="discountPct" type="number" min="0" max="100" step="0.01" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Catatan</label>
          <textarea name="notes" defaultValue={rab?.notes ?? ""} rows={2} className={inputClass} />
        </div>
      </div>

      {/* --- Rincian pekerjaan --- */}
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
              <GripVertical size={16} className="text-slate-600" />
              <span className="font-mono text-sm font-semibold text-slate-500">{toRoman(sectionIndex + 1)}</span>
              <input
                value={section.name}
                onChange={(e) => renameSection(section.key, e.target.value)}
                className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white placeholder:text-slate-600 hover:border-white/10 focus:border-cyan-300/40 focus:bg-white/[0.04] focus:outline-none"
              />
              <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-cyan-300">
                Rp {formatRupiah(totals.sectionTotals[sectionIndex] ?? 0)}
              </span>
              <button
                type="button"
                onClick={() => removeSection(section.key)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-2">No</th>
                    <th className="px-3 py-2">Uraian Pekerjaan</th>
                    <th className="w-24 px-3 py-2">Volume</th>
                    <th className="w-20 px-3 py-2">Satuan</th>
                    <th className="w-36 px-3 py-2">Harga Satuan</th>
                    <th className="w-36 px-3 py-2 text-right">Jumlah</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item, itemIndex) => (
                    <tr key={item.key} className="border-t border-white/5 align-top">
                      <td className="px-3 py-2 text-slate-500">{itemIndex + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(section.key, item.key, { description: e.target.value })}
                          placeholder="Uraian pekerjaan"
                          className={cellInputClass}
                        />
                        {ahspOptions.length > 0 && (
                          <div className="mt-1">
                            <SearchableSelect
                              value={item.ahspId ?? ""}
                              options={ahspSelectOptions}
                              onChange={(value) => applyAhsp(section.key, item.key, value)}
                              placeholder="Isi manual (tanpa AHSP)"
                              searchPlaceholder="Cari kode atau item AHSP..."
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="0" step="0.001"
                          value={item.volume}
                          onChange={(e) => updateItem(section.key, item.key, { volume: e.target.value })}
                          className={`${cellInputClass} text-right tabular-nums`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={item.unit}
                          onChange={(e) => updateItem(section.key, item.key, { unit: e.target.value })}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min="0" step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(section.key, item.key, { unitPrice: e.target.value })}
                          className={`${cellInputClass} text-right tabular-nums`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-cyan-300">
                        {formatRupiah(Number(item.volume || 0) * Number(item.unitPrice || 0))}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(section.key, item.key)}
                          className="rounded-lg p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/5 px-4 py-2.5">
              <button
                type="button"
                onClick={() => addItem(section.key)}
                className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300"
              >
                <Plus size={14} /> Tambah Item Pekerjaan
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-sm font-medium text-slate-500 hover:border-cyan-400/30 hover:text-cyan-400"
        >
          <Plus size={16} /> Tambah Bagian Pekerjaan
        </button>
      </div>

      {/* --- Rekapitulasi --- */}
      <div className="ml-auto max-w-sm space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="tabular-nums text-white">Rp {formatRupiah(totals.subtotal, true)}</span>
        </div>
        {Number(discountPct) > 0 && (
          <>
            <div className="flex justify-between text-slate-400">
              <span>Diskon ({discountPct}%)</span>
              <span className="tabular-nums text-white">− Rp {formatRupiah(totals.discountAmount, true)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Dasar pengenaan pajak</span>
              <span className="tabular-nums text-white">Rp {formatRupiah(totals.taxableBase, true)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-slate-400">
          <span>PPN ({taxPct}%)</span>
          <span className="tabular-nums text-white">Rp {formatRupiah(totals.taxAmount, true)}</span>
        </div>
        <div className="flex justify-between border-t border-white/5 pt-2 text-base font-semibold text-white">
          <span>Total</span>
          <span className="tabular-nums text-cyan-300">Rp {formatRupiah(totals.total, true)}</span>
        </div>
      </div>
    </form>
  );
}
