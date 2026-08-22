"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, X, Calculator } from "lucide-react";
import { createAhspAction, updateAhspAction, deleteAhspAction, type AhspActionState } from "./actions";
import { RESOURCE_TYPE_LABEL, type Ahsp, type PriceItem, type ResourceType } from "@/lib/estimation";
import { formatNumber, formatRupiah } from "@/lib/format";
import type { PaginatedMeta } from "@/lib/api";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, inputClass } from "@/components/admin/ui";

const initialState: AhspActionState = { status: "idle" };

const TYPE_META: Record<ResourceType, { tone: "info" | "warning" | "success"; label: string }> = {
  LABOR: { tone: "info", label: "Upah" },
  MATERIAL: { tone: "warning", label: "Bahan" },
  EQUIPMENT: { tone: "success", label: "Alat" },
};

/** Baris komponen dalam editor (masih berupa input mentah). */
interface DraftComponent {
  key: string;
  priceItemId: string;
  coefficient: string;
}

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

function AhspModal({
  open,
  onClose,
  ahsp,
  priceItems,
}: {
  open: boolean;
  onClose: () => void;
  ahsp: Ahsp | null;
  priceItems: PriceItem[];
}) {
  const action = ahsp ? updateAhspAction.bind(null, ahsp.id) : createAhspAction;
  const [state, formAction] = useActionState(action, initialState);

  const [components, setComponents] = useState<DraftComponent[]>(() =>
    ahsp
      ? ahsp.components.map((c, i) => ({
          key: `${c.id}-${i}`,
          priceItemId: c.priceItemId,
          coefficient: c.coefficient,
        }))
      : []
  );
  const [overheadPct, setOverheadPct] = useState(ahsp?.overheadPct ?? "10");

  const [prevState, setPrevState] = useState(state);
  if (prevState !== state) {
    setPrevState(state);
    if (state.status === "success") onClose();
  }

  const priceById = useMemo(() => new Map(priceItems.map((p) => [p.id, p])), [priceItems]);
      const priceItemOptions = useMemo(
        () =>
          priceItems.map((p) => ({
            value: p.id,
            label: `[${RESOURCE_TYPE_LABEL[p.type]}] ${p.code} - ${p.name}`,
            searchText: `${p.code} ${p.name} ${p.type} ${p.unit} ${p.region ?? ""}`,
          })),
        [priceItems]
      );

  /**
   * Pratinjau harga satuan mengikuti rumus backend:
   *   biaya langsung = Σ (koefisien × harga satuan), HSP = biaya langsung + overhead.
   * Backend tetap yang berwenang menghitung nilai tersimpan (memakai Decimal).
   */
  const preview = useMemo(() => {
    const lines = components.map((c) => {
      const price = priceById.get(c.priceItemId);
      const subtotal = price ? Number(c.coefficient || 0) * Number(price.unitPrice) : 0;
      return { ...c, price, subtotal };
    });
    const directCost = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const overheadAmount = (directCost * Number(overheadPct || 0)) / 100;
    return { lines, directCost, overheadAmount, unitPrice: directCost + overheadAmount };
  }, [components, overheadPct, priceById]);

  if (!open) return null;

  const addComponent = () =>
    setComponents((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${prev.length}`, priceItemId: priceItems[0]?.id ?? "", coefficient: "1" },
    ]);

  const updateComponent = (key: string, patch: Partial<DraftComponent>) =>
    setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const removeComponent = (key: string) => setComponents((prev) => prev.filter((c) => c.key !== key));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
      <div className="my-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0a1626] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{ahsp ? "Edit AHSP" : "AHSP Baru"}</h2>
            <p className="mt-1 text-xs text-slate-400">
              Analisa Harga Satuan Pekerjaan — susun koefisien upah, bahan, dan alat per satuan.
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <form action={formAction} className="mt-5 space-y-5">
          <input type="hidden" name="components" value={JSON.stringify(components)} />

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Kode</label>
              <input name="code" defaultValue={ahsp?.code} required placeholder="A.4.1.1" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Uraian Pekerjaan</label>
              <input
                name="name"
                defaultValue={ahsp?.name}
                required
                placeholder="Pemasangan 1 m2 dinding bata merah"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Satuan</label>
              <input name="unit" defaultValue={ahsp?.unit} required placeholder="m2" className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Kelompok Pekerjaan</label>
              <input
                name="category"
                defaultValue={ahsp?.category ?? ""}
                placeholder="Pekerjaan Dinding"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Overhead &amp; Profit (%)</label>
              <input
                name="overheadPct"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={overheadPct}
                onChange={(e) => setOverheadPct(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* --- Komponen AHSP --- */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Komponen</h3>
              <button
                type="button"
                onClick={addComponent}
                disabled={priceItems.length === 0}
                className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-40 transition"
              >
                <Plus size={14} /> Tambah Komponen
              </button>
            </div>

            {priceItems.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                Belum ada Harga Satuan Dasar. Tambahkan dulu di menu Harga Satuan.
              </p>
            ) : components.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                Belum ada komponen. Tambahkan upah, bahan, atau alat yang dipakai.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5 bg-white/[0.02] text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Uraian</th>
                      <th className="w-28 px-3 py-2">Koefisien</th>
                      <th className="w-20 px-3 py-2">Satuan</th>
                      <th className="w-32 px-3 py-2 text-right">Harga Satuan</th>
                      <th className="w-32 px-3 py-2 text-right">Jumlah</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map((line) => (
                      <tr key={line.key} className="border-t border-white/5">
                        <td className="px-3 py-2">
                              <SearchableSelect
                                value={line.priceItemId}
                                options={priceItemOptions}
                                onChange={(value) => updateComponent(line.key, { priceItemId: value })}
                                placeholder="Pilih harga satuan"
                                searchPlaceholder="Cari kode atau uraian..."
                              />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={line.coefficient}
                            onChange={(e) => updateComponent(line.key, { coefficient: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 text-right text-sm tabular-nums text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-slate-500">{line.price?.unit ?? "-"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {line.price ? formatRupiah(line.price.unitPrice) : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-cyan-300">
                          {formatRupiah(line.subtotal)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeComponent(line.key)}
                            className="rounded-lg p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-1 border-t border-white/5 bg-white/[0.02] px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Biaya langsung</span>
                <span className="tabular-nums text-white">Rp {formatRupiah(preview.directCost, true)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Overhead &amp; profit ({overheadPct || 0}%)</span>
                <span className="tabular-nums text-white">Rp {formatRupiah(preview.overheadAmount, true)}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1 font-semibold text-white">
                <span>Harga Satuan Pekerjaan</span>
                <span className="tabular-nums text-cyan-300">Rp {formatRupiah(preview.unitPrice, true)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Catatan (opsional)</label>
            <textarea name="notes" defaultValue={ahsp?.notes ?? ""} rows={2} className={inputClass} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" name="isActive" defaultChecked={ahsp?.isActive ?? true} className="h-4 w-4 rounded border-white/20 bg-white/[0.04] checked:bg-cyan-400" />
            Aktif
          </label>

          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.08] hover:text-slate-200"
            >
              Batal
            </button>
            <SubmitButton label="Simpan AHSP" />
          </div>
        </form>
      </div>
    </div>
  );
}

function AhspRow({
  ahsp,
  isAdmin,
  onEdit,
  onDelete,
  disabled,
}: {
  ahsp: Ahsp;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className={`border-b border-white/[0.07] transition-colors hover:bg-white/[0.02] ${ahsp.isActive ? "" : "opacity-50"}`}>
        <Td>
          <code className="text-xs font-mono text-slate-500">{ahsp.code}</code>
        </Td>
        <Td>
          <button onClick={() => setExpanded((v) => !v)} className="text-left text-sm font-medium text-slate-200 hover:text-cyan-300">
            {ahsp.name}
          </button>
          {ahsp.category && <p className="mt-0.5 text-xs text-slate-600">{ahsp.category}</p>}
        </Td>
        <Td>
          <span className="text-sm text-slate-400">{ahsp.unit}</span>
        </Td>
        <Td className="text-center">
          <span className="text-sm text-slate-500">{ahsp.components.length}</span>
        </Td>
        <Td className="text-right">
          <span className="text-sm font-semibold text-slate-100 tabular-nums">
            Rp {formatRupiah(ahsp.computed.unitPrice)}
          </span>
        </Td>
        <Td className="text-right">
          <div className="flex items-center justify-end gap-1">
            <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
              <Pencil size={13} />
            </button>
            {isAdmin && (
              <button
                onClick={onDelete}
                disabled={disabled}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </Td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/[0.07] bg-white/[0.02]">
          <Td colSpan={6} className="px-4 py-4">
            <table className="w-full text-xs">
              <thead className="text-left uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2">Komponen</th>
                  <th className="pb-2">Jenis</th>
                  <th className="pb-2 text-right">Koefisien</th>
                  <th className="pb-2 text-right">Harga</th>
                  <th className="pb-2 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {ahsp.computed.lines.map((line) => {
                  const tm = TYPE_META[line.type] ?? { tone: "neutral" as const, label: line.type };
                  return (
                    <tr key={line.id} className="border-t border-white/[0.05]">
                      <Td className="py-2">
                        <span className="font-mono text-slate-600">{line.code}</span> <span className="text-slate-300">{line.name}</span>
                      </Td>
                      <Td className="py-2">
                        <Badge tone={tm.tone}>{tm.label}</Badge>
                      </Td>
                      <Td className="py-2 text-right tabular-nums text-slate-400">
                        {formatNumber(line.coefficient)} {line.unit}
                      </Td>
                      <Td className="py-2 text-right tabular-nums text-slate-500">{formatRupiah(line.unitPrice)}</Td>
                      <Td className="py-2 text-right tabular-nums font-medium text-slate-200">
                        {formatRupiah(line.subtotal)}
                      </Td>
                    </tr>
                  );
                })}
                <tr className="border-t border-white/[0.05]">
                  <Td colSpan={4} className="py-2 text-right text-slate-500">Biaya langsung</Td>
                  <Td className="py-2 text-right tabular-nums text-slate-400">{formatRupiah(ahsp.computed.directCost)}</Td>
                </tr>
                <tr>
                  <Td colSpan={4} className="py-2 text-right text-slate-500">Overhead &amp; profit ({ahsp.overheadPct}%)</Td>
                  <Td className="py-2 text-right tabular-nums text-slate-400">{formatRupiah(ahsp.computed.overheadAmount)}</Td>
                </tr>
                <tr className="border-t border-white/[0.1]">
                  <Td colSpan={4} className="py-2 text-right font-semibold text-slate-100">Harga Satuan</Td>
                  <Td className="py-2 text-right font-semibold tabular-nums text-cyan-300">
                    {formatRupiah(ahsp.computed.unitPrice)}
                  </Td>
                </tr>
              </tbody>
            </table>
          </Td>
        </tr>
      )}
    </>
  );
}

export function AhspTable({
  items,
  meta,
  search,
  priceItems,
  isAdmin,
}: {
  items: Ahsp[];
  meta: PaginatedMeta;
  search: string;
  priceItems: PriceItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ahsp | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/ahsp?${params.toString()}`);
  };

  const handleDelete = (ahsp: Ahsp) => {
    ask({
      title: `Hapus AHSP "${ahsp.name}"?`,
      description: "Analisa ini beserta seluruh komponennya akan dihapus permanen.",
      onConfirm: () => {
        setError("");
        startTransition(async () => {
          const result = await deleteAhspAction(ahsp.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus");
        });
      },
    });
  };

  const totalComponents = items.reduce((acc, a) => acc + a.components.length, 0);
  const avgPrice = items.length > 0 ? Math.round(items.reduce((acc, a) => acc + Number(a.computed.unitPrice), 0) / items.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perhitungan"
        title="AHSP"
        description="Analisa Harga Satuan Pekerjaan — dasar perhitungan harga satuan tiap item RAB."
        actions={
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
          >
            <Plus size={14} /> AHSP Baru
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={meta.total} hint="analisa" icon={<Calculator size={18} />} animated={false} />
        <StatCard label="Komponen" value={totalComponents} hint="di semua analisa" icon={<Calculator size={18} />} accentColor="cyan" animated={false} />
        <StatCard label="Rata-rata Harga" value={avgPrice} hint="per analisa" icon={<Calculator size={18} />} accentColor="emerald" animated={false} />
      </div>

      <Toolbar>
        <form action={(fd) => setParam("search", String(fd.get("search") ?? ""))} className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari kode atau uraian pekerjaan..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </form>
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
            title={search ? "Tidak ada hasil" : "Belum ada AHSP"}
            description={search ? "Coba ubah kata kunci pencarian." : "Tambahkan analisa harga satuan pekerjaan pertama."}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Kode</Th>
                <Th>Uraian Pekerjaan</Th>
                <Th>Satuan</Th>
                <Th className="text-center">Komponen</Th>
                <Th className="text-right">Harga</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((ahsp) => (
                <AhspRow
                  key={ahsp.id}
                  ahsp={ahsp}
                  isAdmin={isAdmin}
                  disabled={isPending}
                  onEdit={() => { setEditing(ahsp); setModalOpen(true); }}
                  onDelete={() => handleDelete(ahsp)}
                />
              ))}
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

      {modalOpen && (
        <AhspModal
          key={editing?.id ?? "new"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          ahsp={editing}
          priceItems={priceItems}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
