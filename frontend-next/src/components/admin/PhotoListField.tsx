"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { uploadMediaAction } from "@/app/admin/(dashboard)/media-actions";
import { mediaSrc } from "@/lib/media";

export interface PhotoDraft {
  url: string;
  caption: string | null;
  /** Bagian pekerjaan yang difoto — hanya dipakai laporan harian. */
  location?: string | null;
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200";

/**
 * Beberapa foto berketerangan dalam satu field.
 *
 * Unggahan memakai jalur media yang sama dengan field gambar lain, jadi berkas
 * tetap masuk Pustaka Media dan ikut aturan driver penyimpanan yang berlaku.
 * Yang disimpan pada laporan hanyalah URL-nya.
 */
export function PhotoListField({
  photos,
  onChange,
  withLocation = false,
  max = 12,
  label = "Foto",
}: {
  photos: PhotoDraft[];
  onChange: (photos: PhotoDraft[]) => void;
  withLocation?: boolean;
  max?: number;
  label?: string;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    setError("");
    const room = max - photos.length;
    if (room <= 0) {
      setError(`Maksimal ${max} foto`);
      return;
    }

    const chosen = Array.from(files).slice(0, room);
    startTransition(async () => {
      const uploaded: PhotoDraft[] = [];
      for (const file of chosen) {
        const payload = new FormData();
        payload.append("file", file);
        const result = await uploadMediaAction(payload);
        if (result.ok) uploaded.push({ url: result.media.url, caption: null, location: null });
        // Satu berkas gagal tidak boleh membatalkan yang sudah berhasil naik.
        else setError(result.message);
      }
      if (uploaded.length > 0) onChange([...photos, ...uploaded]);
    });
  };

  const patch = (index: number, field: "caption" | "location", value: string) =>
    onChange(photos.map((p, i) => (i === index ? { ...p, [field]: value || null } : p)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">
          {label} ({photos.length}/{max})
        </span>
        <button
          type="button"
          disabled={isPending || photos.length >= max}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          <ImagePlus size={13} /> {isPending ? "Mengunggah..." : "Tambah Foto"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

      {photos.length > 0 && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={`${photo.url}-${index}`} className="rounded-lg border border-neutral-200 p-2">
              <div className="relative h-28 overflow-hidden rounded bg-neutral-100">
                <Image
                  src={mediaSrc(photo.url)}
                  alt={photo.caption ?? `Foto ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                  aria-label={`Hapus foto ${index + 1}`}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <X size={12} />
                </button>
              </div>
              <input
                value={photo.caption ?? ""}
                onChange={(e) => patch(index, "caption", e.target.value)}
                placeholder="Keterangan"
                aria-label={`Keterangan foto ${index + 1}`}
                className={`${inputClass} mt-2`}
              />
              {withLocation && (
                <input
                  value={photo.location ?? ""}
                  onChange={(e) => patch(index, "location", e.target.value)}
                  placeholder="Lokasi (mis. Kolom K1 lt.2)"
                  aria-label={`Lokasi foto ${index + 1}`}
                  className={`${inputClass} mt-1.5`}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
