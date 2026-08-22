"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, EyeOff } from "lucide-react";
import {
  createItemAction,
  updateItemAction,
  deleteItemAction,
  moveItemAction,
  type SiteContentActionState,
} from "../actions";
import { ICON_NAMES, resolveIcon, type SiteContentItem } from "@/lib/siteContent";
import type { CollectionDef } from "@/lib/adminResources";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { mediaSrc } from "@/lib/media";
import { inputClass } from "@/components/admin/ui";

const initialState: SiteContentActionState = { status: "idle" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

function ItemModal({
  open,
  onClose,
  item,
  collection,
  def,
}: {
  open: boolean;
  onClose: () => void;
  item: SiteContentItem | null;
  collection: string;
  def: CollectionDef;
}) {
  const action = item
    ? updateItemAction.bind(null, item.id, collection)
    : createItemAction.bind(null, collection);
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state, onClose]);

  if (!open) return null;

  const { fields } = def;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">
          {item ? `Edit ${def.label}` : `${def.label} Baru`}
        </h2>
        <p className="mt-1 text-xs text-slate-400">{def.description}</p>

        <form action={formAction} className="mt-5 space-y-4">
          {fields.title && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{fields.title}</label>
              <input name="title" defaultValue={item?.title ?? ""} required autoFocus className={inputClass} />
            </div>
          )}

          {fields.subtitle && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{fields.subtitle}</label>
              <input name="subtitle" defaultValue={item?.subtitle ?? ""} className={inputClass} />
            </div>
          )}

          {fields.body && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{fields.body}</label>
              <textarea name="body" defaultValue={item?.body ?? ""} rows={3} className={inputClass} />
            </div>
          )}

          {fields.icon && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{fields.icon}</label>
              <select name="icon" defaultValue={item?.icon ?? ""} className={inputClass}>
                <option value="">— Tanpa ikon —</option>
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {fields.imageUrl && (
            <ImageUploadField name="imageUrl" label={fields.imageUrl} defaultValue={item?.imageUrl ?? ""} />
          )}

          {fields.href && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">{fields.href}</label>
              <input name="href" defaultValue={item?.href ?? ""} placeholder="/services" className={inputClass} />
            </div>
          )}

          {def.choices &&
            Object.entries(def.choices).map(([key, choice]) =>
              choice ? (
                <div key={key}>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">{choice.label}</label>
                  <select
                    name={`meta:${key}`}
                    defaultValue={item?.meta?.[key as "variant" | "accent"] ?? choice.options[0]?.value ?? ""}
                    className={inputClass}
                  >
                    {choice.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null
            )}

          {def.texts &&
            Object.entries(def.texts).map(([key, text]) =>
              text ? (
                <div key={key}>
                  <label htmlFor={`meta-${key}`} className="mb-1.5 block text-xs font-medium text-slate-400">
                    {text.label}
                  </label>
                  <input
                    id={`meta-${key}`}
                    name={`meta:${key}`}
                    defaultValue={item?.meta?.[key as "phone" | "hours" | "keywords"] ?? ""}
                    placeholder={text.placeholder}
                    maxLength={text.maxLength}
                    className={inputClass}
                  />
                </div>
              ) : null
            )}

          {def.numbers && (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(def.numbers).map(([key, num]) =>
                num ? (
                  <div key={key}>
                    <label
                      htmlFor={`num-${key}`}
                      className="mb-1.5 block text-xs font-medium text-slate-400"
                    >
                      {num.label}
                      {num.suffix ? ` (${num.suffix})` : ""}
                    </label>
                    <input
                      id={`num-${key}`}
                      name={`num:${key}`}
                      type="number"
                      min={num.min}
                      max={num.max}
                      step={num.step}
                      defaultValue={
                        item?.meta?.[key as "heightM" | "widthM" | "depthM" | "startWeek" | "durationWeeks"] ??
                        num.fallback
                      }
                      className={inputClass}
                    />
                  </div>
                ) : null
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={item?.isActive ?? true}
              className="rounded border-white/20 bg-white/[0.04] checked:bg-cyan-400"
            />
            Tampilkan di situs
          </label>

          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
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

export function CollectionEditor({
  collection,
  def,
  items,
}: {
  collection: string;
  def: CollectionDef;
  items: SiteContentItem[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SiteContentItem | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Gagal memproses");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/site-content"
            className="mb-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400"
          >
            <ArrowLeft size={14} /> Kembali ke Konten Situs
          </Link>
          <h1 className="text-2xl font-semibold text-white">{def.label}</h1>
          <p className="text-sm text-slate-400">
            {def.description} · tampil di halaman <span className="font-medium text-slate-200">{def.page}</span>
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => {
            const Icon = item.icon ? resolveIcon(item.icon) : null;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-4 ${
                  item.isActive ? "" : "opacity-60"
                }`}
              >
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <button
                    onClick={() => run(() => moveItemAction(item.id, collection, "up"))}
                    disabled={isPending || index === 0}
                    className="rounded p-0.5 text-slate-500 hover:bg-white/5 hover:text-cyan-400 disabled:opacity-30"
                    aria-label="Naikkan urutan"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => run(() => moveItemAction(item.id, collection, "down"))}
                    disabled={isPending || index === items.length - 1}
                    className="rounded p-0.5 text-slate-500 hover:bg-white/5 hover:text-cyan-400 disabled:opacity-30"
                    aria-label="Turunkan urutan"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {item.imageUrl ? (
                  <span className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    <Image src={mediaSrc(item.imageUrl)} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                ) : Icon ? (
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Icon size={16} />
                  </span>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-white">
                    {item.title || <span className="text-slate-500">(tanpa judul)</span>}
                    {!item.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        <EyeOff size={11} /> Disembunyikan
                      </span>
                    )}
                  </p>
                  {item.subtitle && <p className="text-xs text-cyan-400">{item.subtitle}</p>}
                  {item.body && <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => {
                      setEditing(item);
                      setModalOpen(true);
                    }}
                    aria-label={`Sunting "${item.title ?? "item tanpa judul"}"`}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-cyan-400"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() =>
                      ask({
                        title: `Hapus "${item.title ?? "item ini"}"?`,
                        description: "Item akan hilang dari situs publik setelah dihapus.",
                        onConfirm: () => run(() => deleteItemAction(item.id, collection)),
                      })
                    }
                    disabled={isPending}
                    aria-label={`Hapus "${item.title ?? "item tanpa judul"}"`}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-10 text-center text-sm text-slate-500">
            Belum ada item. Situs akan menampilkan konten bawaan sampai item pertama ditambahkan.
          </p>
        )}
      </div>

      {modalOpen && (
        <ItemModal
          key={editing?.id ?? "new"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={editing}
          collection={collection}
          def={def}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
