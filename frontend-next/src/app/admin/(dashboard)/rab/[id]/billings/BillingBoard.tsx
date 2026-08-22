"use client";

import { useState, useTransition } from "react";
import { Calculator, Download, Plus, Trash2, Receipt, Wallet, TrendingUp } from "lucide-react";
import {
  BILLING_STATUS_LABEL,
  type BillingPreview,
  type BillingStatus,
  type ProgressBilling,
} from "@/lib/estimation";
import { formatRupiah, todayIso } from "@/lib/format";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import {
  createBillingAction,
  deleteBillingAction,
  exportBillingCsvAction,
  previewBillingAction,
  setBillingStatusAction,
} from "../../actions";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-400";

const STATUS_STYLE: Record<BillingStatus, { tone: string; dot: string }> = {
  DRAFT:     { tone: "border-white/12 bg-white/[0.06] text-slate-400",    dot: "bg-slate-500" },
  ISSUED:    { tone: "border-sky-400/30 bg-sky-500/10 text-sky-300",      dot: "bg-sky-400" },
  PAID:      { tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  CANCELLED: { tone: "border-red-400/25 bg-red-500/10 text-red-300",      dot: "bg-red-400" },
};

const NEXT_STATUS: Record<BillingStatus, BillingStatus[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

export function BillingBoard({
  rabId,
  billings,
  canIssue,
}: {
  rabId: string;
  billings: ProgressBilling[];
  canIssue: boolean;
}) {
  const [periodEnd, setPeriodEnd] = useState(todayIso());
  const [retentionPct, setRetentionPct] = useState("5");
  const [taxPct, setTaxPct] = useState("11");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<BillingPreview | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const nums = () => ({ retention: Number(retentionPct) || 0, tax: Number(taxPct) || 0 });

  const runPreview = () => {
    setError("");
    const { retention, tax } = nums();
    startTransition(async () => {
      const result = await previewBillingAction(rabId, periodEnd, retention, tax);
      if (result.ok && result.preview) setPreview(result.preview);
      else {
        setPreview(null);
        setError(result.message ?? "Gagal menghitung pratinjau.");
      }
    });
  };

  const create = () => {
    setError("");
    const { retention, tax } = nums();
    startTransition(async () => {
      const result = await createBillingAction(rabId, periodEnd, retention, tax, notes.trim() || null);
      if (result.ok) {
        setPreview(null);
        setNotes("");
      } else setError(result.message ?? "Gagal membuat termin.");
    });
  };

  const changeStatus = (billing: ProgressBilling, status: BillingStatus) => {
    setError("");
    startTransition(async () => {
      const result = await setBillingStatusAction(rabId, billing.id, status);
      if (!result.ok) setError(result.message ?? "Gagal mengubah status.");
    });
  };

  const download = (billing: ProgressBilling) => {
    setError("");
    startTransition(async () => {
      const result = await exportBillingCsvAction(billing.id);
      if (!result.ok || !result.csv) {
        setError(result.message ?? "Gagal mengunduh berita acara.");
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${billing.number.replace(/\//g, "-")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Issue Panel ──────────────────────────────── */}
      {canIssue && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10">
              <Plus size={15} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Termin Baru</h2>
              <p className="text-xs text-slate-500">
                Dihitung dari opname yang <strong className="text-slate-300">sudah disetujui</strong> sampai tanggal periode.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="bill-period" className={labelClass}>Periode s/d</label>
              <input
                id="bill-period"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="bill-retention" className={labelClass}>Retensi (%)</label>
              <input
                id="bill-retention"
                type="number"
                min={0}
                max={100}
                value={retentionPct}
                onChange={(e) => setRetentionPct(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="bill-tax" className={labelClass}>PPN (%)</label>
              <input
                id="bill-tax"
                type="number"
                min={0}
                max={100}
                value={taxPct}
                onChange={(e) => setTaxPct(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="bill-notes" className={labelClass}>Catatan</label>
              <input
                id="bill-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsional"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runPreview}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/18 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <Calculator size={14} /> Hitung Pratinjau
            </button>
            <button
              type="button"
              onClick={create}
              disabled={isPending || !preview}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:opacity-50"
            >
              <Plus size={14} /> Terbitkan Termin
            </button>
          </div>

          {/* Preview table */}
          {preview && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pekerjaan</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nilai Kontrak</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Progres</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nilai Terpasang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {preview.lines.map((line) => (
                      <tr key={line.itemId} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-slate-200">{line.description}</span>
                          <span className="ml-2 text-xs text-slate-600">{line.sectionName}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-slate-300 tabular-nums">
                          Rp {formatRupiah(line.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-slate-300 tabular-nums">
                          {Number(line.percent).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-slate-300 tabular-nums">
                          Rp {formatRupiah(line.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/[0.07]">
                <Totals totals={preview} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Billing List ─────────────────────────────── */}
      {billings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Receipt size={24} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400">Belum ada termin billing</p>
          <p className="mt-1 text-xs text-slate-600">
            Setujui opname lebih dulu, lalu terbitkan termin pertama.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {billings.map((billing) => {
            const style = STATUS_STYLE[billing.status];
            return (
              <li
                key={billing.id}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm transition-colors hover:border-white/16"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                      <Wallet size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-100">{billing.number}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${style.tone}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {BILLING_STATUS_LABEL[billing.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Periode s/d {billing.periodEnd}
                        {billing.notes ? ` · ${billing.notes}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => download(billing)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-50"
                    >
                      <Download size={12} /> Berita Acara
                    </button>
                    {canIssue &&
                      NEXT_STATUS[billing.status].map((next) => (
                        <button
                          key={next}
                          type="button"
                          disabled={isPending}
                          onClick={() => changeStatus(billing, next)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-50"
                        >
                          {BILLING_STATUS_LABEL[next]}
                        </button>
                      ))}
                    {canIssue && billing.status === "DRAFT" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          ask({
                            title: `Hapus ${billing.number}?`,
                            description: "Hanya termin draf yang bisa dihapus.",
                            onConfirm: () =>
                              startTransition(async () => {
                                const result = await deleteBillingAction(rabId, billing.id);
                                if (!result.ok) setError(result.message ?? "Gagal menghapus termin.");
                              }),
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-500 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Totals table */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
                  <Totals totals={billing} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function Totals({
  totals,
}: {
  totals: {
    cumulativeValue: string;
    previousValue: string;
    currentValue: string;
    retentionPct: string;
    retentionAmount: string;
    taxPct: string;
    taxAmount: string;
    netAmount: string;
  };
}) {
  const rows: [string, string, boolean?][] = [
    ["Nilai kumulatif s/d periode", totals.cumulativeValue],
    ["Sudah ditagih sebelumnya", `-${totals.previousValue}`],
    ["Nilai termin ini", totals.currentValue],
    [`Retensi ${Number(totals.retentionPct).toFixed(0)}%`, `-${totals.retentionAmount}`],
    [`PPN ${Number(totals.taxPct).toFixed(0)}%`, totals.taxAmount],
    ["Total dibayarkan", totals.netAmount, true],
  ];

  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-white/[0.05]">
        {rows.map(([label, value, strong]) => (
          <tr
            key={label}
            className={strong ? "bg-cyan-500/5 text-slate-100" : "text-slate-400"}
          >
            <td className={`px-4 py-2.5 ${strong ? "font-semibold text-slate-200" : ""}`}>{label}</td>
            <td className={`px-4 py-2.5 text-right tabular-nums ${strong ? "font-semibold text-cyan-300" : "text-slate-300"}`}>
              {value.startsWith("-") ? `-Rp ${formatRupiah(value.slice(1))}` : `Rp ${formatRupiah(value)}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
