"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Search, FileText, Calculator } from "lucide-react";
import { deleteRabAction } from "./actions";
import { RAB_STATUS_LABEL, type RabListRow, type RabStatus } from "@/lib/estimation";
import { formatDate, formatRupiah } from "@/lib/format";
import type { PaginatedMeta } from "@/lib/api";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td } from "@/components/admin/ui";

const STATUS_META: Record<RabStatus, { tone: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  DRAFT: { tone: "neutral" },
  REVIEW: { tone: "warning" },
  APPROVED: { tone: "success" },
  REJECTED: { tone: "danger" },
  ARCHIVED: { tone: "neutral" },
};

export function RabList({
  items,
  meta,
  search,
  status,
  isAdmin,
}: {
  items: RabListRow[];
  meta: PaginatedMeta;
  search: string;
  status: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/rab?${params.toString()}`);
  };

  const handleDelete = (rab: RabListRow) => {
    ask({
      title: `Hapus RAB ${rab.number}?`,
      description: `"${rab.title}" beserta seluruh bagian dan item pekerjaannya akan dihapus permanen.`,
      onConfirm: () => {
        setError("");
        startTransition(async () => {
          const result = await deleteRabAction(rab.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus");
        });
      },
    });
  };

  const stats = {
    total: meta.total,
    draft: items.filter((r) => r.status === "DRAFT").length,
    review: items.filter((r) => r.status === "REVIEW").length,
    approved: items.filter((r) => r.status === "APPROVED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Proyek"
        title="RAB"
        description="Rencana Anggaran Biaya proyek dan penawaran."
        actions={
          <Link
            href="/admin/rab/new"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
          >
            <Plus size={14} /> RAB Baru
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} hint="proyek RAB" icon={<Calculator size={18} />} animated={false} />
        <StatCard label="Draf" value={stats.draft} hint="belum diajukan" icon={<Calculator size={18} />} accentColor="slate" animated={false} />
        <StatCard label="Review" value={stats.review} hint="menunggu persetujuan" icon={<Calculator size={18} />} accentColor="amber" animated={false} />
        <StatCard label="Disetujui" value={stats.approved} hint="po won" icon={<Calculator size={18} />} accentColor="emerald" animated={false} />
      </div>

      <Toolbar>
        <form action={(fd) => setParam("search", String(fd.get("search") ?? ""))} className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari nomor, judul, atau pemilik..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </form>
        <div className="ml-auto flex flex-wrap gap-1">
          <button
            onClick={() => setParam("status", "")}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${!status ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"}`}
          >
            Semua
          </button>
          {(Object.keys(RAB_STATUS_LABEL) as RabStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setParam("status", s)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${status === s ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"}`}
            >
              {RAB_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </Toolbar>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Panel padded={false}>
        {items.length === 0 ? (
          <EmptyState
            icon={<Calculator size={20} />}
            title={search || status ? "Tidak ada hasil" : "Belum ada RAB"}
            description={search || status ? "Coba ubah kata kunci atau filter." : "RAB akan muncul di sini setelah dibuat."}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Pekerjaan</Th>
                <Th>Pemilik</Th>
                <Th>Status</Th>
                <Th className="text-right">Nilai</Th>
                <Th>Dibuat</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((rab) => {
                const sm = STATUS_META[rab.status] ?? { tone: "neutral" as const };
                return (
                  <tr key={rab.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td>
                      <code className="text-xs font-mono text-slate-500">{rab.number}</code>
                    </Td>
                    <Td>
                      <Link href={`/admin/rab/${rab.id}`} className="text-sm font-medium text-slate-200 hover:text-cyan-300">
                        {rab.title}
                      </Link>
                      {rab.location && <p className="mt-0.5 text-xs text-slate-500">{rab.location}</p>}
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-400">{rab.clientName ?? "—"}</span>
                    </Td>
                    <Td>
                      <Badge tone={sm.tone}>{RAB_STATUS_LABEL[rab.status]}</Badge>
                    </Td>
                    <Td className="text-right">
                      <span className="text-sm font-semibold text-slate-100 tabular-nums">
                        Rp {formatRupiah(rab.total)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">{formatDate(rab.createdAt)}</span>
                        <span className="text-[11px] text-slate-600">{rab.createdBy.name}</span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/print/rab/${rab.id}`}
                          target="_blank"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
                          title="Lihat dokumen"
                        >
                          <FileText size={13} />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(rab)}
                            disabled={isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

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

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
