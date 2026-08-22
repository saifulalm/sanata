import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getQuotationById } from "@/lib/adminResources";
import { getSignatories } from "@/lib/adminSignatories.server";
import { QUOTATION_STATUS_LABEL, type QuotationStatus } from "@/lib/estimation";
import { formatDate, formatRupiah } from "@/lib/format";
import { QuotationForm } from "../QuotationForm";
import { StatusActions } from "../StatusActions";
import { Badge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Detail Penawaran" };

const STATUS_TONE: Record<QuotationStatus, "neutral" | "info" | "success" | "danger" | "warning"> = {
  DRAFT: "neutral",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELLED: "warning",
};

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let quotation: Awaited<ReturnType<typeof getQuotationById>>;
  try {
    quotation = await getQuotationById(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const locked = quotation.status === "ACCEPTED" || quotation.status === "REJECTED";
  const { data: signatories } = await getSignatories({ isActive: "active" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/quotations" className="mb-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
            <ArrowLeft size={14} /> Kembali ke daftar penawaran
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-white">{quotation.number}</h1>
            <Badge tone={STATUS_TONE[quotation.status]}>{QUOTATION_STATUS_LABEL[quotation.status]}</Badge>
            {quotation.isExpired && (
              <span className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                <AlertTriangle size={11} /> Kedaluwarsa
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{quotation.subject}</p>
        </div>

        <Link
          href={`/admin/print/quotation/${quotation.id}`}
          target="_blank"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 transition"
        >
          <FileText size={15} /> Cetak Surat / PDF
        </Link>
      </div>

      <StatusActions id={quotation.id} status={quotation.status} />

      {/* Ringkasan nilai beku */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Nilai Penawaran</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-cyan-300">Rp {formatRupiah(quotation.total)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Sumber RAB</p>
          <p className="mt-1 text-sm text-slate-200">
            {quotation.rab ? (
              <Link href={`/admin/rab/${quotation.rab.id}`} className="font-mono text-cyan-400 hover:text-cyan-300">
                {quotation.rab.number}
              </Link>
            ) : (
              <span className="text-slate-500">RAB sudah dihapus</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Berlaku Sampai</p>
          <p className="mt-1 text-sm text-slate-200">{formatDate(quotation.validUntil)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Dibuat</p>
          <p className="mt-1 text-sm text-slate-200">{formatDate(quotation.createdAt)}</p>
          <p className="text-xs text-slate-500">{quotation.createdBy.name}</p>
        </div>
      </div>

      <QuotationForm quotation={quotation} readOnly={locked} signatories={signatories} />
    </div>
  );
}
