"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Inbox, Search, Eye, Mail, Check, MessageSquareReply, Archive } from "lucide-react";
import type { PaginatedMeta } from "@/lib/api";
import type { Inquiry } from "@/lib/adminResources";
import { formatDate } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td } from "@/components/admin/ui";

const STATUS_META: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "info" }> = {
  NEW: { label: "Baru", tone: "info" },
  CONTACTED: { label: "Dihubungi", tone: "warning" },
  CLOSED: { label: "Ditutup", tone: "neutral" },
};

const NEXT_ACTIONS: Record<string, { label: string; icon: typeof MessageSquareReply }[]> = {
  NEW: [{ label: "Tandai Dihubungi", icon: MessageSquareReply }],
  CONTACTED: [{ label: "Tandai Ditutup", icon: Check }],
  CLOSED: [{ label: "Buka Kembali", icon: Archive }],
};

export function InquiryBoard({
  inquiries,
  meta,
  search,
  status,
}: {
  inquiries: Inquiry[];
  meta: PaginatedMeta;
  search: string;
  status: string;
}) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(search);
  const [isPending, startTransition] = useTransition();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (searchVal) params.set("search", searchVal);
    if (status) params.set("status", status);
    if (value) params.set(key, value);
    if (key !== "page") params.delete("page");
    const qs = params.toString();
    router.push(`/admin/inquiries${qs ? `?${qs}` : ""}`);
  };

  const setSearch = (val: string) => {
    setSearchVal(val);
    const params = new URLSearchParams();
    if (val) params.set("search", val);
    if (status) params.set("status", status);
    const qs = params.toString();
    router.push(`/admin/inquiries${qs ? `?${qs}` : ""}`);
  };

  const tabs = [
    { value: "", label: "Semua" },
    { value: "NEW", label: "Baru" },
    { value: "CONTACTED", label: "Dihubungi" },
    { value: "CLOSED", label: "Ditutup" },
  ];

  const stats = {
    total: meta.total,
    new: inquiries.filter((i) => i.status === "NEW").length,
    contacted: inquiries.filter((i) => i.status === "CONTACTED").length,
    closed: inquiries.filter((i) => i.status === "CLOSED").length,
  };

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Konten"
        title="Kotak Masuk"
        description="Pesan dan pertanyaan dari prospek yang masuk melalui website, WhatsApp, dan email."
        actions={
          <span className="text-xs text-slate-400">{meta.total} pesan</span>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} hint="semua pesan" icon={<Inbox size={18} />} animated={false} />
        <StatCard label="Baru" value={stats.new} hint="belum ditanggapi" icon={<Mail size={18} />} accentColor="cyan" animated={false} />
        <StatCard label="Dihubungi" value={stats.contacted} hint="dalam proses" icon={<MessageSquareReply size={18} />} accentColor="amber" animated={false} />
        <StatCard label="Ditutup" value={stats.closed} hint="selesai" icon={<Check size={18} />} accentColor="emerald" animated={false} />
      </div>

      {/* Toolbar */}
      <Toolbar>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau pesan..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const active = status === tab.value;
            const toneClass = active
              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
              : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]";
            return (
              <button
                key={tab.value}
                onClick={() => setParam("status", tab.value)}
                className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${toneClass}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Toolbar>

      {/* Table */}
      {inquiries.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title={search || status ? "Tidak ada hasil" : "Belum ada pesan masuk"}
          description={search || status ? "Coba ubah kata kunci atau filter." : "Pesan dari prospek akan muncul di sini."}
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Pesan</Th>
                <Th>Layanan</Th>
                <Th>Status</Th>
                <Th>Waktu</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => {
                const meta2 = STATUS_META[inquiry.status] ?? { label: inquiry.status, tone: "neutral" as const };
                return (
                  <tr key={inquiry.id} className={`transition-colors hover:bg-white/[0.02] ${inquiry.status === "NEW" ? "bg-cyan-400/[0.02]" : ""}`}>
                    <Td>
                      <p className="text-sm font-medium text-slate-200">{inquiry.name}</p>
                      <p className="text-xs text-slate-500">{inquiry.email ?? inquiry.phone ?? "—"}</p>
                    </Td>
                    <Td>
                      <p className="text-sm text-slate-300 line-clamp-2">{inquiry.message}</p>
                    </Td>
                    <Td>
                      {inquiry.service ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-slate-300">
                          {inquiry.service}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={meta2.tone}>{meta2.label}</Badge>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-400">{formatDate(inquiry.createdAt)}</span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/inquiries/${inquiry.id}`}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
                        >
                          <Eye size={13} /> Lihat
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
    </div>
  );
}
