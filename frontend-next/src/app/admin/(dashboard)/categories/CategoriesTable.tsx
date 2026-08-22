"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "./actions";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import type { Category } from "@/lib/api";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, inputClass } from "@/components/admin/ui";

const initialState = { status: "idle" as const, message: undefined as string | undefined };

function CategoryForm({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const action = category ? updateCategoryAction.bind(null, category.id) : createCategoryAction;
  const [state, formAction] = useActionState(action, initialState);

  if (state?.status === "success") {
    onClose();
    window.location.reload();
  }

  return (
    <Panel
      title={category ? "Edit Kategori" : "Kategori Baru"}
      description="Nama kategori dipakai di seluruh konten, layanan, dan produk."
      actions={
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
        >
          ✕
        </button>
      }
    >
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">Nama Kategori</span>
          <input name="name" defaultValue={category?.name} required autoFocus className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">Slug</span>
          <input
            name="slug"
            defaultValue={category?.slug}
            placeholder="auto-generated"
            className={inputClass}
          />
        </label>
        <div className="flex items-end md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
          >
            <Plus size={15} /> Simpan
          </button>
        </div>
        {state?.status === "error" && state?.message && (
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 md:col-span-2">
            {state.message}
          </p>
        )}
      </form>
    </Panel>
  );
}

export function CategoriesTable({
  categories,
  canManage,
  isAdmin,
}: {
  categories: Category[];
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (c: Category) =>
    ask({
      title: `Hapus "${c.name}"?`,
      description: "Kategori yang masih dipakai tidak dapat dihapus.",
      onConfirm: () => {
        setError("");
        startTransition(async () => {
          const result = await deleteCategoryAction(c.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus");
          else window.location.reload();
        });
      },
    });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setModalOpen(true); };

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Konten"
        title="Kategori"
        description="Kelola kategori untuk konten, layanan, dan produk."
        actions={
          canManage && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
            >
              <Plus size={14} /> Kategori Baru
            </button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total" value={categories.length} hint="kategori" icon={<Tag size={18} />} animated={false} />
        <StatCard label="Slug" value={categories.length} hint="aktif di situs" icon={<Tag size={18} />} accentColor="emerald" animated={false} />
      </div>

      <Toolbar>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau slug..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </div>
      </Toolbar>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {modalOpen && <CategoryForm category={editing ?? undefined} onClose={() => setModalOpen(false)} />}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Tag size={20} />}
          title={search ? "Tidak ada hasil" : "Belum ada kategori"}
          description={search ? "Coba ubah kata kunci pencarian." : "Tambahkan kategori pertama untuk konten atau layanan."}
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Slug</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                  <Td>
                    <p className="text-sm font-medium text-slate-200">{c.name}</p>
                  </Td>
                  <Td>
                    <code className="text-xs text-slate-500">{c.slug}</code>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <button
                          onClick={() => openEdit(c)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
                          title={`Edit ${c.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                          title={`Hapus ${c.name}`}
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
        </Panel>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
