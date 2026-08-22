import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ScrollText, Plus } from "lucide-react";
import { getAdminAuditLogs } from "@/lib/adminResources";
import { requireAdminRole } from "@/lib/adminApi";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader, Panel, Toolbar, TableWrap, Th, Td, Badge, EmptyState } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Audit Log" };

const ENTITIES = ["Content", "Product", "Category", "User", "Rab", "Ahsp", "PriceItem", "SiteContent", "Inquiry"];

const ACTION_META: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  CREATE: { label: "Buat", tone: "success" },
  UPDATE: { label: "Ubah", tone: "warning" },
  DELETE: { label: "Hapus", tone: "danger" },
};

function buildPageHref(page: number, entity?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (entity) params.set("entity", entity);
  return `/admin/audit-log?${params.toString()}`;
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const { data: logs, meta } = await getAdminAuditLogs({
    page: params.page ? Number(params.page) : 1,
    entity: params.entity,
  });

  const stats = {
    total: meta.total,
    creates: logs.filter((l) => l.action === "CREATE").length,
    updates: logs.filter((l) => l.action === "UPDATE").length,
    deletes: logs.filter((l) => l.action === "DELETE").length,
  };

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Sistem"
        title="Audit Log"
        description="Riwayat aktivitas perubahan data oleh pengguna admin."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} hint="entri" icon={<ScrollText size={18} />} animated={false} />
        <StatCard label="Buat" value={stats.creates} hint="entri baru" icon={<Plus size={18} />} accentColor="emerald" animated={false} />
        <StatCard label="Ubah" value={stats.updates} hint="perubahan" icon={<ScrollText size={18} />} accentColor="amber" animated={false} />
        <StatCard label="Hapus" value={stats.deletes} hint="dihapus" icon={<ScrollText size={18} />} accentColor={stats.deletes > 0 ? "red" : "slate"} tone={stats.deletes > 0 ? "attention" : "default"} animated={false} />
      </div>

      <Toolbar>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/audit-log"
            className={clsx(
              "inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
              !params.entity
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"
            )}
          >
            Semua
          </Link>
          {ENTITIES.map((e) => (
            <Link
              key={e}
              href={`/admin/audit-log?entity=${e}`}
              className={clsx(
                "inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                params.entity === e
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"
              )}
            >
              {e}
            </Link>
          ))}
        </div>
      </Toolbar>

      <Panel padded={false}>
        {logs.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={20} />}
            title="Belum ada aktivitas tercatat"
            description={params.entity ? `Tidak ada aktivitas untuk entitas "${params.entity}".` : "Aktivitas admin akan muncul di sini."}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Aksi</Th>
                <Th>Entitas</Th>
                <Th>Pengguna</Th>
                <Th>Waktu</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const am = ACTION_META[log.action] ?? { label: log.action, tone: "neutral" as const };
                return (
                  <tr key={log.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td>
                      <Badge tone={am.tone}>{am.label}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-200">{log.entity}</span>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-400">{log.user.name}</span>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
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
          <p className="text-slate-500">Halaman {meta.page} dari {meta.totalPages} · {meta.total} entri</p>
          <div className="flex gap-2">
            <Link
              href={buildPageHref(meta.page - 1, params.entity)}
              aria-disabled={meta.page <= 1}
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs transition-all",
                meta.page <= 1
                  ? "border-white/10 bg-white/[0.04] text-slate-600 pointer-events-none opacity-40"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"
              )}
            >
              Sebelumnya
            </Link>
            <Link
              href={buildPageHref(meta.page + 1, params.entity)}
              aria-disabled={meta.page >= meta.totalPages}
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs transition-all",
                meta.page >= meta.totalPages
                  ? "border-white/10 bg-white/[0.04] text-slate-600 pointer-events-none opacity-40"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"
              )}
            >
              Berikutnya
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
