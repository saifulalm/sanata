"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, FileText, Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import type { PaginatedMeta } from "@/lib/api";
import type { QuotationListRow } from "@/lib/estimation";
import { formatDate } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td } from "@/components/admin/ui";

const STATUS_META: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }> = {
  DRAFT: { label: "Draf", tone: "neutral" },
  SENT: { label: "Terkirim", tone: "info" },
  ACCEPTED: { label: "Diterima", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
  CANCELLED: { label: "Dibatalkan", tone: "warning" },
};

export function QuotationBoard({
  quotations,
  meta,
  search,
  status,
}: {
  quotations: QuotationListRow[];
  meta: PaginatedMeta;
  search: string;
  status: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState(search);
  const [isPending, startTransition] = useTransition();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/quotations?${params.toString()}`);
  };

  const stats = {
    total: meta.total,
    draft: quotations.filter((q) => q.status === "DRAFT").length,
    sent: quotations.filter((q) => q.status === "SENT").length,
    accepted: quotations.filter((q) => q.status === "ACCEPTED").length,
  };

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Konten"
        title="Quotation"
        description="Daftar penawaran harga yang telah dibuat untuk klien potensial."
        actions={
          <Link
            href="/admin/quotations/new"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
          >
            <Plus size={14} /> Penawaran Baru
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} hint="penawaran" icon={<FileText size={18} />} animated={false} />
        <StatCard label="Draf" value={stats.draft} hint="belum dikirim" icon={<Clock size={18} />} accentColor="slate" animated={false} />
        <StatCard label="Terkirim" value={stats.sent} hint="menunggu respons" icon={<FileText size={18} />} accentColor="cyan" animated={false} />
        <StatCard label="Diterima" value={stats.accepted} hint="po won" icon={<CheckCircle size={18} />} accentColor="emerald" animated={false} />
      </div>

      {/* Toolbar */}
      <Toolbar>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari klien atau subjek..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {["", "DRAFT", "SENT", "ACCEPTED", "REJECTED", "CANCELLED"].map((s) => {
            const m = STATUS_META[s] ?? { label: "Semua", tone: "neutral" as const };
            const active = status === s;
            const toneClass = active
              ? m.tone === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : m.tone === "danger" ? "border-red-400/30 bg-red-400/10 text-red-300"
              : m.tone === "warning" ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
              : m.tone === "info" ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
              : "border-white/18 bg-white/[0.08] text-slate-200"
              : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]";
            return (
              <button
                key={s}
                onClick={() => setParam("status", s)}
                className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${toneClass}`}
              >
                {s === "" ? "Semua" : m.label}
              </button>
            );
          })}
        </div>
      </Toolbar>

      {/* Table */}
      {quotations.length === 0 ? (
        <EmptyState
          icon={<FileText size={20} />}
          title={search || status ? "Tidak ada hasil" : "Belum ada quotation"}
          description={search || status ? "Coba ubah kata kunci atau filter." : "Quotation akan muncul di sini setelah dibuat."}
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Klien</Th>
                <Th>Subjek</Th>
                <Th>Total</Th>
                <Th>Berlaku</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const meta2 = STATUS_META[q.status] ?? { label: q.status, tone: "neutral" as const };
                const isExpired = q.isExpired && q.status !== "ACCEPTED";
                return (
                  <tr key={q.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td>
                      <code className="text-xs font-mono text-slate-500">{q.number}</code>
                    </Td>
                    <Td>
                      <p className="text-sm font-medium text-slate-200">{q.clientName}</p>
                    </Td>
                    <Td>
                      <p className="text-sm text-slate-300">{q.subject}</p>
                    </Td>
                    <Td>
                      <span className="text-sm font-semibold text-slate-100">Rp {q.total}</span>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500">{formatDate(q.validUntil)}</span>
                      {isExpired && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-red-400">
                          <XCircle size={10} /> kedaluwarsa
                        </div>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={meta2.tone}>{meta2.label}</Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/quotations/${q.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
                          title="Lihat"
                        >
                          <Eye size={13} />
                        </Link>
                        <Link
                          href={`/admin/quotations/${q.id}?edit=1`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
                          title="Sunting"
                        >
                          <Pencil size={13} />
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Halaman {meta.page} dari {meta.totalPages} · {meta.total} data</p>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setParam("page", String(meta.page - 1))}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setParam("page", String(meta.page + 1))}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
