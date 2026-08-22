"use client";

import Image from "next/image";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, FileText, Search, Trash2, Upload } from "lucide-react";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  btn,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import { deleteMediaAction, uploadLibraryMediaAction } from "../media-actions";
import type { AdminMedia, AdminMediaMeta } from "@/lib/adminResources";
import { mediaSrc } from "@/lib/media";
import { formatDate } from "@/lib/format";

const initialUploadState = { status: "idle" as const };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCard({
  item,
  onDelete,
}: {
  item: AdminMedia;
  onDelete: (item: AdminMedia) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isImage = item.mimeType.startsWith("image/");

  const copyUrl = async () => {
    // URL disimpan relatif; disalin apa adanya supaya bisa ditempel ke field mana pun.
    await navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-cyan-300/25">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[#060f1c]">
        {isImage ? (
          <Image
            src={mediaSrc(item.url)}
            alt={item.filename}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-cover"
          />
        ) : (
          <FileText size={28} className="text-slate-500" />
        )}

        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-[#020617]/90 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={copyUrl}
            title="Salin URL"
            className="rounded-lg border border-white/12 bg-[#0a1626]/90 p-1.5 text-slate-200 hover:text-white"
          >
            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            title="Hapus berkas"
            className="rounded-lg border border-red-400/25 bg-red-500/15 p-1.5 text-red-200 hover:bg-red-500/25"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-xs font-medium text-slate-100" title={item.filename}>
          {item.filename}
        </p>
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>{formatBytes(item.size)}</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
        {item.product && (
          <Badge tone="info" className="max-w-full truncate">
            {item.product.name}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function MediaLibrary({
  items,
  meta,
  search,
  type,
  emptyIcon,
}: {
  items: AdminMedia[];
  meta: AdminMediaMeta;
  search: string;
  type: string;
  emptyIcon: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [uploadState, uploadAction] = useActionState(uploadLibraryMediaAction, initialUploadState);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { ask, dialogProps } = useConfirm(isPending);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const askDelete = (item: AdminMedia) =>
    ask({
      title: `Hapus ${item.filename}?`,
      description:
        "Berkas hilang dari penyimpanan. Konten yang masih memakai URL ini akan menampilkan gambar rusak.",
      onConfirm: () => {
        setError("");
        startTransition(async () => {
          const result = await deleteMediaAction(item.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus berkas");
        });
      },
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pustaka Media"
        description="Semua berkas yang pernah diunggah — cari, salin URL-nya, atau bersihkan yang tidak terpakai"
        actions={
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Badge tone="neutral">{meta.totalFiles} berkas</Badge>
            <Badge tone="neutral">{formatBytes(meta.totalSize)}</Badge>
          </div>
        }
      />

      <Panel title="Unggah Berkas" description="JPEG, PNG, WEBP, atau GIF — maksimum 5 MB">
        <form action={uploadAction} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="max-w-full flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-cyan-100"
          />
          <button type="submit" className={btn("primary")}>
            <Upload size={15} />
            Unggah
          </button>
        </form>

        {uploadState.status === "error" && (
          <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {uploadState.message}
          </p>
        )}
        {uploadState.status === "success" && (
          <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">
            {uploadState.message}
          </p>
        )}
      </Panel>

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari nama berkas..."
            className={`${inputClass} pl-10`}
          />
        </div>
        <select name="type" defaultValue={type} className={`${selectClass} sm:w-52`}>
          <option value="">Semua tipe</option>
          <option value="image">Gambar</option>
          <option value="file">Berkas lain</option>
        </select>
        <button type="submit" className={btn("secondary")}>
          Terapkan
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onDelete={askDelete} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={emptyIcon}
          title="Belum ada berkas"
          description="Unggah gambar dari sini, atau lewat field gambar di menu Konten dan Layanan."
        />
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
          <span>
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
              className={btn("secondary", "sm")}
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => goToPage(meta.page + 1)}
              className={btn("secondary", "sm")}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
