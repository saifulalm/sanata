"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";
import { uploadMediaAction } from "@/app/admin/(dashboard)/media-actions";
import { mediaSrc } from "@/lib/media";

/**
 * Field gambar: mengunggah lewat Server Action lalu menyimpan URL hasilnya pada
 * input tersembunyi, sehingga form induk cukup membaca `name` seperti biasa.
 */
export function ImageUploadField({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError("");
    const payload = new FormData();
    payload.append("file", file);

    startTransition(async () => {
      const result = await uploadMediaAction(payload);
      if (result.ok) setUrl(result.media.url);
      else setError(result.message);
    });
  };

  return (
    <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</label>
      <input type="hidden" name={name} value={url} />

      {url ? (
              <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
            <Image src={mediaSrc(url)} alt="" fill sizes="64px" className="object-cover" />
          </div>
                <p className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">{url}</p>
          <button
            type="button"
            onClick={() => setUrl("")}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
            aria-label="Hapus gambar"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-cyan-300/20 bg-white/[0.03] px-4 py-6 text-sm text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Upload size={16} className="animate-pulse" /> Mengunggah...
            </>
          ) : (
            <>
              <ImageIcon size={16} /> Pilih gambar
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
            <p className="mt-1 text-[11px] text-slate-500">JPEG, PNG, WEBP, atau GIF · maksimal 5 MB</p>
    </div>
  );
}
