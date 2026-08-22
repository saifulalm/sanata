import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getQuotationDefaults } from "@/lib/adminResources";
import { getSignatories } from "@/lib/adminSignatories.server";
import { formatRupiah } from "@/lib/format";
import { QuotationForm } from "../QuotationForm";

export const metadata: Metadata = { title: "Penawaran Baru" };

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ rabId?: string }>;
}) {
  await requireAdminRole("ADMIN", "EDITOR");
  const { rabId } = await searchParams;

  if (!rabId) redirect("/admin/rab");

  let source: Awaited<ReturnType<typeof getQuotationDefaults>>;
  try {
    source = await getQuotationDefaults(rabId);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const { data: signatories } = await getSignatories({ isActive: "active" });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/rab/${source.rab.id}`} className="mb-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
          <ArrowLeft size={14} /> Kembali ke RAB
        </Link>
        <h1 className="text-2xl font-semibold text-white">Surat Penawaran Baru</h1>
        <p className="text-sm text-slate-400">
          Dibuat dari <span className="font-mono text-cyan-400">{source.rab.number}</span> — {source.rab.title}
        </p>
      </div>

      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-200">
        Nilai penawaran <strong className="text-cyan-100">Rp {formatRupiah(source.rab.total)}</strong> akan dikunci saat surat dibuat.
        Perubahan RAB setelah ini tidak akan mengubah surat.
      </div>

      <QuotationForm source={source} signatories={signatories} />
    </div>
  );
}
