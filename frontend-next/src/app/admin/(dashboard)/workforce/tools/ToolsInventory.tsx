"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  Eye,
  Edit,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Users,
} from "lucide-react";
import {
  getTools,
  getLoans,
  returnTool,
  type MasterTool,
  type ToolLoan,
  type ToolCondition,
  type LoanStatus,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Input,
  Pagination,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";
import { TableWrap, Th, Td } from "@/components/admin/ui";

const CONDITION_CONFIG: Record<ToolCondition, { label: string; color: "success" | "warning" | "danger" | "neutral" }> = {
  GOOD: { label: "Baik", color: "success" },
  FAIR: { label: "Cukup", color: "warning" },
  DAMAGED: { label: "Rusak", color: "danger" },
  LOST: { label: "Hilang", color: "danger" },
};

const LOAN_STATUS_CONFIG: Record<LoanStatus, { label: string; color: "success" | "warning" | "danger" | "neutral" }> = {
  OPEN: { label: "Dipinjam", color: "warning" },
  RETURNED: { label: "Dikembalikan", color: "success" },
  OVERDUE: { label: "Terlambat", color: "danger" },
  LOST: { label: "Hilang", color: "danger" },
};

interface ToolsInventoryProps {
  initialTools: MasterTool[];
  initialLoans: ToolLoan[];
}

export function ToolsInventory({ initialTools, initialLoans }: ToolsInventoryProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [tools, setTools] = useState(initialTools);
  const [loans, setLoans] = useState(initialLoans);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [returnDialog, setReturnDialog] = useState<{ loan: ToolLoan; condition: ToolCondition } | null>(null);

  const categories = [...new Set(tools.map((t) => t.category))];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.toolCode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getOpenLoan = (toolId: string) => {
    return loans.find((l) => l.toolId === toolId && l.status === "OPEN");
  };

  const handleReturn = async () => {
    if (!returnDialog) return;
    startTransition(async () => {
      try {
        await returnTool(returnDialog.loan.id, { condition: returnDialog.condition });
        toast("Alat berhasil dikembalikan", "success");
        setReturnDialog(null);
        // Refresh data
        window.location.reload();
      } catch {
        toast("Gagal mengembalikan alat", "error");
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari alat..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <Link
          href="/admin/workforce/tools/new"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <Plus size={16} />
          Tambah Alat
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{tools.length}</p>
            <p className="text-xs text-slate-500">Total Alat</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {tools.filter((t) => !getOpenLoan(t.id)).length}
            </p>
            <p className="text-xs text-slate-500">Tersedia</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {loans.filter((l) => l.status === "OPEN").length}
            </p>
            <p className="text-xs text-slate-500">Dipinjam</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {tools.filter((t) => t.currentCondition === "DAMAGED" || t.currentCondition === "LOST").length}
            </p>
            <p className="text-xs text-slate-500">Rusak/Hilang</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      {filteredTools.length === 0 ? (
        <EmptyState
          icon={<Wrench size={24} />}
          title="Belum ada alat"
          description="Tambahkan alat pertama ke inventory."
          action={
            <Link
              href="/admin/workforce/tools/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              Tambah Alat
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => {
            const openLoan = getOpenLoan(tool.id);
            const condition = CONDITION_CONFIG[tool.currentCondition];

            return (
              <Card key={tool.id} className="relative overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-cyan-400">{tool.toolCode}</p>
                    <h3 className="mt-1 font-semibold text-white">{tool.name}</h3>
                  </div>
                  <Badge tone={condition.color}>{condition.label}</Badge>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Kategori</span>
                    <span className="text-white">{tool.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Pemilik</span>
                    <Badge tone={tool.owner === "COMPANY" ? "info" : "neutral"}>
                      {tool.owner === "COMPANY" ? "Perusahaan" : tool.owner === "PERSONAL" ? "Pribadi" : "Sewa"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Jumlah</span>
                    <span className="text-white">{tool.minQuantity} {tool.unit}</span>
                  </div>
                </div>

                {/* Loan Info */}
                {openLoan && (
                  <div className="mt-4 rounded-lg bg-amber-500/10 p-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Clock size={14} />
                      <span className="text-sm font-medium">Sedang Dipinjam</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-white">{openLoan.worker.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(openLoan.issuedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => setReturnDialog({ loan: openLoan, condition: "GOOD" })}
                      className="mt-3 w-full rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                    >
                      Kembalikan
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                  <Link
                    href={`/admin/workforce/tools/${tool.id}`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                  >
                    <Eye size={12} />
                    Detail
                  </Link>
                  <Link
                    href={`/admin/workforce/tools/${tool.id}/loan`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 transition-colors hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    <ArrowRightLeft size={12} />
                    Pinjam
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Return Dialog */}
      <Dialog
        open={!!returnDialog}
        onClose={() => setReturnDialog(null)}
        title="Kembalikan Alat"
        description={`Kembalikan "${returnDialog?.loan.tool.name}" dari ${returnDialog?.loan.worker.name}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReturnDialog(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleReturn}
              loading={isPending}
            >
              Kembalikan (Baik)
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Pilih kondisi alat saat dikembalikan:</p>
          <div className="flex gap-2">
            {(["GOOD", "FAIR", "DAMAGED", "LOST"] as ToolCondition[]).map((c) => (
              <button
                key={c}
                onClick={() => returnDialog && setReturnDialog({ ...returnDialog, condition: c })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                  returnDialog?.condition === c
                    ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18"
                }`}
              >
                {CONDITION_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
