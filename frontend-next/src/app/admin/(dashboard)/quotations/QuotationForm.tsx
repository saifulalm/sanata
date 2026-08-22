"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { createQuotationAction, updateQuotationAction, type QuotationActionState } from "./actions";
import { formatRupiah } from "@/lib/format";
import type { PaymentTerm, Quotation, QuotationDefaults } from "@/lib/estimation";
import type { Signatory } from "@/lib/adminSignatories";
import { inputClass } from "@/components/admin/ui";

const initialState: QuotationActionState = { status: "idle" };

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

interface DraftTerm extends PaymentTerm {
  key: string;
}

const cellInputClass =
  "flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none";

export function QuotationForm({
  quotation,
  source,
  signatories,
  readOnly = false,
}: {
  quotation?: Quotation;
  source?: QuotationDefaults;
  signatories?: Signatory[];
  readOnly?: boolean;
}) {
  const action = quotation
    ? updateQuotationAction.bind(null, quotation.id)
    : createQuotationAction.bind(null, source!.rab.id);
  const [state, formAction] = useActionState(action, initialState);

  const defaults = source?.defaults;
  const validUntilValue = quotation?.validUntil ? quotation.validUntil.slice(0, 10) : "";

  const [terms, setTerms] = useState<DraftTerm[]>(() => {
    const initial = quotation?.paymentTerms ?? defaults?.paymentTerms ?? [];
    return initial.map((t, i) => ({ ...t, key: `t${i}` }));
  });

  const totalPercent = terms.reduce((sum, t) => sum + (Number(t.percent) || 0), 0);
  const totalValue = quotation?.total ?? source?.rab.total ?? "0";

  const [signerName, setSignerName] = useState(quotation?.signerName ?? "");
  const [signerTitle, setSignerTitle] = useState(quotation?.signerTitle ?? "");
  const [selectedSignatoryId, setSelectedSignatoryId] = useState(quotation?.signatoryId ?? "");

  const handleSignatoryChange = (id: string) => {
    setSelectedSignatoryId(id);
    if (id) {
      const s = signatories?.find((x) => x.id === id);
      if (s) {
        setSignerName(s.name);
        setSignerTitle(s.title);
      }
    } else {
      setSignerName(quotation?.signerName ?? "");
      setSignerTitle(quotation?.signerTitle ?? "");
    }
  };

  const addTerm = () =>
    setTerms((prev) => [...prev, { key: `t${Date.now()}`, label: "", percent: 0 }]);
  const updateTerm = (key: string, patch: Partial<PaymentTerm>) =>
    setTerms((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const removeTerm = (key: string) => setTerms((prev) => prev.filter((t) => t.key !== key));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="paymentTerms" value={JSON.stringify(terms.map(({ label, percent }) => ({ label, percent })))} />

      {state.status === "error" && (
        <p className="rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-200">{state.message}</p>
      )}

      {readOnly && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">
          Penawaran ini sudah {quotation?.status === "ACCEPTED" ? "diterima" : "ditolak"} klien, jadi isinya dikunci.
          Batalkan penawaran dan buat yang baru bila ada perubahan.
        </p>
      )}

      <fieldset disabled={readOnly} className="space-y-6 disabled:opacity-60">
        {/* Tujuan surat */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-white">Tujuan Surat</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Nama Klien</label>
              <input name="clientName" defaultValue={quotation?.clientName ?? defaults?.clientName} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Perusahaan</label>
              <input name="clientCompany" defaultValue={quotation?.clientCompany ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Up. (Kepada Yth.)</label>
              <input name="attentionTo" defaultValue={quotation?.attentionTo ?? ""} placeholder="Bpk. / Ibu ..." className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                {quotation ? "Berlaku Sampai" : "Masa Berlaku (hari)"}
              </label>
              {quotation ? (
                <>
                  <input name="validUntil" type="date" defaultValue={validUntilValue} className={inputClass} />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Tanggal ini dipakai langsung tanpa menggeser masa berlaku surat.
                  </p>
                </>
              ) : (
                <input
                  name="validForDays"
                  type="number"
                  min="1"
                  max="365"
                  defaultValue={defaults?.validForDays ?? 30}
                  className={inputClass}
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Alamat</label>
              <textarea name="clientAddress" defaultValue={quotation?.clientAddress ?? ""} rows={2} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Perihal</label>
              <input name="subject" defaultValue={quotation?.subject ?? defaults?.subject} required className={inputClass} />
            </div>
          </div>
        </div>

        {/* Isi surat */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-white">Isi Surat</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Paragraf Pembuka</label>
              <textarea name="openingNote" defaultValue={quotation?.openingNote ?? defaults?.openingNote} rows={3} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Syarat &amp; Ketentuan <span className="text-slate-500">(satu poin per baris)</span>
              </label>
              <textarea name="terms" defaultValue={quotation?.terms ?? defaults?.terms} rows={5} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Paragraf Penutup</label>
              <textarea name="closingNote" defaultValue={quotation?.closingNote ?? defaults?.closingNote} rows={3} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Termin pembayaran */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">Termin Pembayaran</h2>
            <button
              type="button"
              onClick={addTerm}
              className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-400/20"
            >
              <Plus size={14} /> Tambah Termin
            </button>
          </div>

          <div className="space-y-2">
            {terms.map((term, index) => (
              <div key={term.key} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs text-slate-500">{index + 1}</span>
                <input
                  value={term.label}
                  onChange={(e) => updateTerm(term.key, { label: e.target.value })}
                  placeholder="Keterangan termin"
                  className={cellInputClass}
                />
                <div className="relative w-24 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={term.percent}
                    onChange={(e) => updateTerm(term.key, { percent: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-6 text-right text-sm tabular-nums text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
                </div>
                <span className="w-32 shrink-0 text-right text-sm tabular-nums text-slate-400">
                  Rp {formatRupiah((Number(totalValue) * (Number(term.percent) || 0)) / 100)}
                </span>
                <button
                  type="button"
                  onClick={() => removeTerm(term.key)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {terms.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">Belum ada termin pembayaran.</p>
            )}
          </div>

          {terms.length > 0 && (
            <div
              className={`mt-3 flex justify-between border-t border-white/5 pt-3 text-sm ${
                Math.abs(totalPercent - 100) < 0.01 ? "text-slate-400" : "text-amber-400"
              }`}
            >
              <span>Total termin</span>
              <span className="font-semibold tabular-nums">
                {totalPercent.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%
                {Math.abs(totalPercent - 100) >= 0.01 && " — belum 100%"}
              </span>
            </div>
          )}
        </div>

        {/* Penanda tangan */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-white">Penanda Tangan</h2>
          {signatories && signatories.length > 0 && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Pilih dari Daftar</label>
              <select
                value={selectedSignatoryId}
                onChange={(e) => handleSignatoryChange(e.target.value)}
                disabled={readOnly}
                className={inputClass}
              >
                <option value="">— Tidak dari daftar —</option>
                {signatories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.title})</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Nama</label>
              <input
                name="signerName"
                value={signerName}
                onChange={(e) => { setSignerName(e.target.value); setSelectedSignatoryId(""); }}
                required
                placeholder="Ir. Hendra Kusuma"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Jabatan</label>
              <input
                name="signerTitle"
                value={signerTitle}
                onChange={(e) => { setSignerTitle(e.target.value); setSelectedSignatoryId(""); }}
                required
                placeholder="Direktur Utama"
                className={inputClass}
              />
            </div>
          </div>
          <input type="hidden" name="signatoryId" value={selectedSignatoryId} />
        </div>
      </fieldset>

      {!readOnly && (
        <div className="flex justify-end">
          <SaveButton label={quotation ? "Simpan Perubahan" : "Buat Penawaran"} />
        </div>
      )}
    </form>
  );
}
