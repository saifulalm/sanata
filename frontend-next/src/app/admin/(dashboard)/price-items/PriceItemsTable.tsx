"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Wrench, DollarSign, Package } from "lucide-react";
import {
  createPriceItemAction,
  updatePriceItemAction,
  deletePriceItemAction,
  type PriceItemActionState,
} from "./actions";
import { RESOURCE_TYPE_LABEL, type PriceItem, type ResourceType } from "@/lib/estimation";
import { formatRupiah } from "@/lib/format";
import type { PaginatedMeta } from "@/lib/api";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, inputClass, selectClass } from "@/components/admin/ui";

const initialState: PriceItemActionState = { status: "idle" };

const TYPE_META: Record<ResourceType, { tone: "info" | "warning" | "success" | "neutral" | "danger"; label: string }> = {
  LABOR: { tone: "info", label: "Upah" },
  MATERIAL: { tone: "warning", label: "Bahan" },
  EQUIPMENT: { tone: "success", label: "Alat" },
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

function PriceItemModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: PriceItem | null;
}) {
  const action = item ? updatePriceItemAction.bind(null, item.id) : createPriceItemAction;
  const [state, formAction] = useActionState(action, initialState);

  // Tutup modal saat aksi berhasil — penyesuaian state saat render, bukan efek.
  const [prevState, setPrevState] = useState(state);
  if (prevState !== state) {
    setPrevState(state);
    if (state.status === "success") onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1626] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">
          {item ? "Edit Harga Satuan" : "Harga Satuan Baru"}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Harga Satuan Dasar untuk upah, bahan, dan alat — menjadi sumber perhitungan AHSP.
        </p>
        <form action={formAction} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Kode</label>
              <input name="code" defaultValue={item?.code} required autoFocus placeholder="M.01" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Jenis</label>
              <select name="type" defaultValue={item?.type ?? "MATERIAL"} className={selectClass}>
                {(Object.keys(RESOURCE_TYPE_LABEL) as ResourceType[]).map((t) => (
                  <option key={t} value={t}>
                    {RESOURCE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Uraian</label>
            <input name="name" defaultValue={item?.name} required placeholder="Semen Portland 50 kg" className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Satuan</label>
              <input name="unit" defaultValue={item?.unit} required placeholder="zak" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Harga (Rp)</label>
              <input
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.unitPrice}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Wilayah (opsional)</label>
            <input name="region" defaultValue={item?.region ?? ""} placeholder="Jakarta" className={inputClass} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="isActive" defaultChecked={item?.isActive ?? true} className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Aktif
          </label>

          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.08] hover:text-slate-200"
            >
              Batal
            </button>
            <SubmitButton label="Simpan" />
          </div>
        </form>
      </div>
    </div>
  );
}

export function PriceItemsTable({
  items,
  meta,
  search,
  type,
  isAdmin,
}: {
  items: PriceItem[];
  meta: PaginatedMeta;
  search: string;
  type: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/price-items?${params.toString()}`);
  };

  const handleDelete = (item: PriceItem) => {
    ask({
      title: `Hapus harga satuan "${item.name}"?`,
      description: "Harga satuan yang masih dipakai AHSP tidak dapat dihapus.",
      onConfirm: () => {
        setError("");
        startTransition(async () => {
          const result = await deletePriceItemAction(item.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus");
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perhitungan"
        title="Harga Satuan Dasar"
        description="Master harga upah, bahan, dan alat untuk perhitungan AHSP."
        actions={
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
          >
            <Plus size={14} /> Harga Baru
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={meta.total} hint="harga satuan" icon={<DollarSign size={18} />} animated={false} />
        <StatCard
          label="Bahan"
          value={items.filter((i) => i.type === "MATERIAL").length}
          hint="harga material"
          icon={<Package size={18} />}
          accentColor="amber"
          animated={false}
        />
        <StatCard
          label="Upah & Alat"
          value={items.filter((i) => i.type !== "MATERIAL").length}
          hint="tenaga & equipment"
          icon={<Wrench size={18} />}
          accentColor="cyan"
          animated={false}
        />
      </div>

      <Toolbar>
        <form
          action={(fd) => setParam("search", String(fd.get("search") ?? ""))}
          className="relative flex-1 min-w-[220px]"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari kode atau uraian..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </form>
        <div className="ml-auto flex flex-wrap gap-1">
          <button
            onClick={() => setParam("type", "")}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${!type ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"}`}
          >
            Semua
          </button>
          {(Object.keys(RESOURCE_TYPE_LABEL) as ResourceType[]).map((t) => (
            <button
              key={t}
              onClick={() => setParam("type", t)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${type === t ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"}`}
            >
              {RESOURCE_TYPE_LABEL[t]}
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
            icon={<DollarSign size={20} />}
            title={search || type ? "Tidak ada hasil" : "Belum ada harga satuan"}
            description={search || type ? "Coba ubah kata kunci atau filter." : "Tambahkan harga satuan dasar untuk material, upah, dan alat."}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Kode</Th>
                <Th>Uraian</Th>
                <Th>Jenis</Th>
                <Th>Satuan</Th>
                <Th className="text-right">Harga</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const typeMeta = TYPE_META[item.type] ?? { tone: "neutral" as const, label: item.type };
                return (
                  <tr key={item.id} className={`transition-colors hover:bg-white/[0.02] ${item.isActive ? "" : "opacity-50"}`}>
                    <Td>
                      <code className="text-xs font-mono text-slate-500">{item.code}</code>
                    </Td>
                    <Td>
                      <p className="text-sm font-medium text-slate-200">{item.name}</p>
                    </Td>
                    <Td>
                      <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-400">{item.unit}</span>
                    </Td>
                    <Td className="text-right">
                      <span className="text-sm font-semibold text-slate-100 tabular-nums">
                        Rp {formatRupiah(item.unitPrice)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(item); setModalOpen(true); }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
                        >
                          <Pencil size={13} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(item)}
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
          <p className="text-slate-400">
            Halaman {meta.page} dari {meta.totalPages} · {meta.total} data
          </p>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setParam("page", String(meta.page - 1))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-40 transition"
            >
              Sebelumnya
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setParam("page", String(meta.page + 1))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-40 transition"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <PriceItemModal open={modalOpen} onClose={() => setModalOpen(false)} item={editing} />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
