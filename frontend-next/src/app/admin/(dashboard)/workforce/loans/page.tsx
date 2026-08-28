import { Suspense } from "react";
import { Handshake } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { LoansList } from "./LoansList";
import { getLoans, getToolStats } from "@/lib/workforceApi.server";
import { getAdminSession } from "@/lib/adminApi";
import { Card } from "@/components/admin/ExtendedUI";

export const metadata = {
  title: "Peminjaman Alat - SANTRA",
  description: "Catat peminjaman alat kepada pekerja",
};

async function LoanStats() {
  try {
    const stats = await getToolStats();
    return (
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Handshake size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.open}</p>
              <p className="text-xs text-slate-500">Sedang Dipinjam</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Handshake size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              <p className="text-xs text-slate-500">Terlambat &gt;7 hari</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <Handshake size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.lost}</p>
              <p className="text-xs text-slate-500">Hilang/Rusak</p>
            </div>
          </div>
        </Card>
      </div>
    );
  } catch {
    return null;
  }
}

export default async function LoansPage() {
  await getAdminSession();
  const { data: loans, meta } = await getLoans({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SANTRA"
        title="Peminjaman Alat"
        description="Catat peminjaman alat kepada pekerja dengan kondisi dan evidence photo."
      />

      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/5" />}>
        <LoanStats />
      </Suspense>

      <Suspense fallback={<div className="text-slate-400">Memuat...</div>}>
        <LoansList initialLoans={loans} initialMeta={meta} />
      </Suspense>
    </div>
  );
}
