"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, FileText } from "lucide-react";
import { createContentAction, updateContentAction, deleteContentAction, type ContentActionState } from "./actions";
import type { Category, ContentItem, PaginatedMeta } from "@/lib/api";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, inputClass, selectClass } from "@/components/admin/ui";

const initialState: ContentActionState = { status: "idle" };

const seoInputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10";

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

function statusMeta(status: string): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  if (status === "PUBLISHED") return { label: "Published", tone: "success" };
  if (status === "DRAFT") return { label: "Draft", tone: "warning" };
  return { label: "Archived", tone: "neutral" };
}

function ContentModal({
  open,
  onClose,
  content,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  content: ContentItem | null;
  categories: Category[];
}) {
  const action = content ? updateContentAction.bind(null, content.id) : createContentAction;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1626] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">{content ? "Edit Konten" : "Konten Baru"}</h2>
        <form action={formAction} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Judul</label>
            <input
              name="title"
              defaultValue={content?.title}
              required
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Ringkasan</label>
            <input
              name="excerpt"
              defaultValue={content?.excerpt ?? ""}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Isi Konten</label>
            <RichTextEditor name="body" defaultValue={content?.body ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Tipe</label>
              <select
                name="type"
                defaultValue={content?.type ?? "POST"}
                className="w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              >
                <option value="POST">Post</option>
                <option value="PAGE">Page</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Status</label>
              <select
                name="status"
                defaultValue={content?.status ?? "DRAFT"}
                className="w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Kategori</label>
              <select
                name="categoryId"
                defaultValue={content?.category?.id ?? ""}
                className="w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* --- SEO --- */}
          <details className="rounded-xl border border-white/10" open={Boolean(content?.focusKeyword)}>
            <summary className="cursor-pointer select-none rounded-xl px-4 py-3 text-sm font-medium text-slate-200">
              Pengaturan SEO
              <span className="ml-2 text-xs font-normal text-slate-500">
                judul &amp; deskripsi pencarian, kata kunci, indeks
              </span>
            </summary>
            <div className="space-y-4 border-t border-white/[0.07] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Judul SEO <span className="normal-case tracking-normal text-slate-600">(kosong = pakai judul)</span>
                  </label>
                  <input name="metaTitle" defaultValue={content?.metaTitle ?? ""} maxLength={200} className={seoInputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Kata Kunci Utama</label>
                  <input
                    name="focusKeyword"
                    defaultValue={content?.focusKeyword ?? ""}
                    placeholder="kontraktor konstruksi"
                    className={seoInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Meta Deskripsi <span className="normal-case tracking-normal text-slate-600">(ideal 70–160 karakter)</span>
                </label>
                <textarea name="metaDescription" defaultValue={content?.metaDescription ?? ""} rows={2} maxLength={500} className={seoInputClass} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Gambar Sosial</label>
                  <input name="ogImage" defaultValue={content?.ogImage ?? ""} placeholder="/uploads/..." className={seoInputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    URL Kanonik <span className="normal-case tracking-normal text-slate-600">(sindikasi)</span>
                  </label>
                  <input name="canonicalUrl" defaultValue={content?.canonicalUrl ?? ""} placeholder="https://..." className={seoInputClass} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" name="noIndex" defaultChecked={content?.noIndex ?? false} className="h-4 w-4 rounded border-white/20 bg-transparent" />
                Sembunyikan dari mesin pencari (noindex)
              </label>
            </div>
          </details>

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

function statusTone(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-700";
  if (status === "DRAFT") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function ContentsTable({
  items,
  meta,
  categories,
  canManage,
  isAdmin,
  search,
  status,
}: {
  items: ContentItem[];
  meta: PaginatedMeta;
  categories: Category[];
  canManage: boolean;
  isAdmin: boolean;
  search: string;
  status: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const handleDelete = (id: string) => {
    setError("");
    startTransition(async () => {
      const result = await deleteContentAction(id);
      if (!result.ok) setError(result.message ?? "Gagal menghapus");
    });
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (c: ContentItem) => {
    setEditing(c);
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
        title="Konten"
        description="Kelola halaman dan artikel Sanata."
        actions={
          canManage && (
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20">
              <Plus size={14} /> Konten Baru
            </button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={meta.total} hint="konten" icon={<FileText size={18} />} animated={false} />
        <StatCard label="Published" value={items.filter((c) => c.status === "PUBLISHED").length} hint="terpublikasi" icon={<FileText size={18} />} accentColor="emerald" animated={false} />
        <StatCard label="Draft" value={items.filter((c) => c.status === "DRAFT").length} hint="belum terbit" icon={<FileText size={18} />} accentColor="amber" animated={false} />
      </div>

      <Toolbar>
        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              name="search"
              defaultValue={search}
              placeholder="Cari judul..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
            />
          </div>
          <select name="status" defaultValue={status} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 focus:border-cyan-300/40 focus:outline-none">
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button type="submit" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/20">
            Cari
          </button>
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
            icon={<FileText size={20} />}
            title={search || status ? "Tidak ada hasil" : "Belum ada konten"}
            description={search || status ? "Coba ubah kata kunci atau filter." : "Tambahkan konten pertama."}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Judul</Th>
                <Th>Kategori</Th>
                <Th>Status</Th>
                <Th>Views</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const sm = statusMeta(c.status);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td>
                      <p className="text-sm font-medium text-slate-200">{c.title}</p>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-400">{c.category?.name ?? "—"}</span>
                    </Td>
                    <Td>
                      <Badge tone={sm.tone}>{sm.label}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-500">{c.views}</span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && (
                          <button onClick={() => openEdit(c)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
                            <Pencil size={13} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() =>
                              ask({
                                title: `Hapus "${c.title}"?`,
                                description: "Konten akan dihapus permanen dari situs.",
                                onConfirm: () => handleDelete(c.id),
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
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Halaman {meta.page} dari {meta.totalPages} · {meta.total} data</p>
          <div className="flex gap-2">
            <button disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40">
              Sebelumnya
            </button>
            <button disabled={meta.page >= meta.totalPages} onClick={() => goToPage(meta.page + 1)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40">
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <ContentModal open={modalOpen} onClose={() => setModalOpen(false)} content={editing} categories={categories} />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
