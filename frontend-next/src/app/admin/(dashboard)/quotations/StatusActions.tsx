"use client";

import { useState, useTransition } from "react";
import { Send, Check, X, Ban, Undo2 } from "lucide-react";
import { updateQuotationStatusAction } from "./actions";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import type { QuotationStatus } from "@/lib/estimation";

const ACTIONS: Record<QuotationStatus, { status: QuotationStatus; label: string; icon: typeof Send; confirm?: string; variant?: "secondary" | "danger" | "cyan" }[]> = {
  DRAFT: [
    { status: "SENT", label: "Tandai Terkirim", icon: Send, variant: "cyan" },
    { status: "CANCELLED", label: "Batalkan", icon: Ban, confirm: "Penawaran akan ditutup dan tidak bisa diaktifkan lagi.", variant: "danger" },
  ],
  SENT: [
    { status: "ACCEPTED", label: "Diterima Klien", icon: Check, confirm: "Setelah diterima, isi surat dikunci permanen.", variant: "cyan" },
    { status: "REJECTED", label: "Ditolak Klien", icon: X, variant: "danger" },
    { status: "DRAFT", label: "Kembalikan ke Draf", icon: Undo2 },
  ],
  ACCEPTED: [{ status: "CANCELLED", label: "Batalkan", icon: Ban, confirm: "Membatalkan penawaran yang sudah diterima.", variant: "danger" }],
  REJECTED: [{ status: "CANCELLED", label: "Batalkan", icon: Ban, variant: "danger" }],
  CANCELLED: [],
};

export function StatusActions({ id, status }: { id: string; status: QuotationStatus }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const apply = (next: QuotationStatus) => {
    setError("");
    startTransition(async () => {
      const result = await updateQuotationStatusAction(id, next);
      if (!result.ok) setError(result.message ?? "Gagal mengubah status");
    });
  };

  const actions = ACTIONS[status] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const variant = action.variant ?? "secondary";
        const variantClass = variant === "danger"
          ? "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/18"
          : variant === "cyan"
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
          : "border-white/12 bg-white/[0.05] text-slate-100 hover:bg-white/[0.09]";

        return (
          <button
            key={action.status}
            onClick={() =>
              action.confirm
                ? ask({
                    title: action.label + "?",
                    description: action.confirm,
                    confirmLabel: action.label,
                    tone: action.status === "CANCELLED" ? "danger" : "primary",
                    onConfirm: () => apply(action.status),
                  })
                : apply(action.status)
            }
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 ${variantClass}`}
          >
            <action.icon size={13} /> {action.label}
          </button>
        );
      })}

      {error && <p className="w-full text-sm text-red-400">{error}</p>}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
