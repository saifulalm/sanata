"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { createProductAction, updateProductAction, deleteProductAction, type ProductActionState } from "./actions";
import type { Category, ProductItem, PaginatedMeta } from "@/lib/api";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, inputClass, selectClass } from "@/components/admin/ui";

const initialState: ProductActionState = { status: "idle" };

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

function ProductModal({
  open,
  onClose,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductItem | null;
  categories: Category[];
}) {
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1626] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">{product ? "Edit Layanan" : "Layanan Baru"}</h2>
        <form action={formAction} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Nama Layanan</label>
            <input
              name="name"
              defaultValue={product?.name}
              required
              autoFocus
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Deskripsi</label>
            <textarea
              name="description"
              defaultValue={product?.description}
              required
              rows={4}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Harga (Rp)</label>
              <input
                name="price"
                type="number"
                min="0"
                defaultValue={product?.price}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Stok</label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">SKU</label>
              <input name="sku" defaultValue={product?.sku ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Kategori</label>
              <select name="categoryId" defaultValue={product?.category?.id ?? ""} className={selectClass}>
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Layanan aktif ditampilkan di katalog
          </label>
          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.08] hover:text-slate-200">
              Batal
            </button>
            <SubmitButton label="Simpan" />
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProductsTable({
  items,
  meta,
  categories,
  canManage,
  isAdmin,
  search,
}: {
  items: ProductItem[];
  meta: PaginatedMeta;
  categories: Category[];
  canManage: boolean;
  isAdmin: boolean;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const handleDelete = (id: string) => {
    setError("");
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (!result.ok) setError(result.message ?? "Gagal menghapus");
    });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p: ProductItem) => {
    setEditing(p);
    setModalOpen(true);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Konten"
        title="Layanan"
        description="Kelola katalog layanan dan produk Sanata."
        actions={
          canManage && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
            >
              <Plus size={14} /> Layanan Baru
            </button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total" value={items.length} hint="layanan" icon={<Package size={18} />} animated={false} />
        <StatCard label="Aktif" value={items.filter((p) => p.isActive).length} hint="ditampilkan di katalog" icon={<Package size={18} />} accentColor="emerald" animated={false} />
      </div>

      <Toolbar>
        <form method="get" className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari layanan..."
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
            icon={<Package size={20} />}
            title={search ? "Tidak ada hasil" : "Belum ada layanan"}
            description={search ? "Coba ubah kata kunci pencarian." : "Tambahkan layanan pertama untuk katalog."}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Kategori</Th>
                <Th>Harga</Th>
                <Th>Stok</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                  <Td>
                    <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-400">{p.category?.name ?? "—"}</span>
                  </Td>
                  <Td>
                    <span className="text-sm font-medium text-slate-100">Rp {Number(p.price).toLocaleString("id-ID")}</span>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-400">{p.stock}</span>
                  </Td>
                  <Td>
                    <Badge tone={p.isActive ? "success" : "neutral"}>
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <button onClick={() => openEdit(p)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
                          <Pencil size={13} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() =>
                            ask({
                              title: `Hapus layanan "${p.name}"?`,
                              description: "Layanan akan dihapus permanen dari situs.",
                              onConfirm: () => handleDelete(p.id),
                            })
                          }
                          disabled={isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Halaman {meta.page} dari {meta.totalPages} · {meta.total} data</p>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => goToPage(meta.page + 1)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={editing} categories={categories} />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
