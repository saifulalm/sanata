import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PiggyBank, Receipt, Wallet } from "lucide-react";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getBillings, getRabSchedule } from "@/lib/adminResources";
import { formatRupiah } from "@/lib/format";
import { ProjectHeader } from "@/components/admin/ProjectHeader";
import { StatCard } from "@/components/admin/StatCard";
import { BillingBoard } from "./BillingBoard";

export const metadata: Metadata = { title: "Termin Progres" };

export default async function BillingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let schedule: Awaited<ReturnType<typeof getRabSchedule>>;
  try {
    schedule = await getRabSchedule(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const billings = await getBillings(id);
  const billed = billings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + Number(b.currentValue), 0);
  const contract = Number(schedule.rab.subtotal);

  return (
    <div className="space-y-6">
      <ProjectHeader
        rab={schedule.rab}
        title="Termin Berbasis Progres"
        description="Tagihan termin dihitung dari opname yang sudah disetujui, lalu dibekukan saat berita acara terbit."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Nilai pekerjaan"
          value={`Rp ${formatRupiah(schedule.rab.subtotal)}`}
          icon={<Wallet size={18} />}
          hint="Subtotal RAB"
        />
        <StatCard
          label="Sudah ditagih"
          value={`Rp ${formatRupiah(billed)}`}
          icon={<Receipt size={18} />}
          hint={contract > 0 ? `${((billed / contract) * 100).toFixed(2)}% dari nilai pekerjaan` : "—"}
        />
        <StatCard
          label="Sisa"
          value={`Rp ${formatRupiah(Math.max(contract - billed, 0))}`}
          icon={<PiggyBank size={18} />}
          hint={`${billings.length} termin tercatat`}
        />
      </div>

      <BillingBoard rabId={schedule.rab.id} billings={billings} canIssue={session.role === "ADMIN"} />
    </div>
  );
}
