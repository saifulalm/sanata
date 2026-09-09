"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { ImagePlus, X, Pencil, Eye } from "lucide-react";
import { uploadMediaAction } from "@/app/admin/(dashboard)/media-actions";
import { mediaSrc } from "@/lib/media";
import { ImageAnnotator, AnnotationData, AnnotationBadge } from "./ImageAnnotator";

export interface PhotoDraft {
  url: string;
  caption: string | null;
  /** Bagian pekerjaan yang difoto — hanya dipakai laporan harian. */
  location?: string | null;
  /** Annotations data (JSON stringified) */
  annotations?: string | null;
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200";

/**
 * Beberapa foto berketerangan dalam satu field.
 *
 * Unggahan memakai jalur media yang sama dengan field gambar lain, jadi berkas
 * tetap masuk Pustaka Media dan ikut aturan driver penyimpanan yang berlaku.
 * Yang disimpan pada laporan hanyalah URL-nya.
 *
 * Mendukung annotasi gambar (garis, panah, kotak, teks) yang disimpan
 * sebagai data URL gambar yang sudah di-annotate.
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

  // Annotation state
  const [annotatingPhoto, setAnnotatingPhoto] = useState<{ index: number; photo: PhotoDraft } | null>(null);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoDraft | null>(null);

  const handleFiles = useCallback((files: FileList) => {
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
        if (result.ok) {
          uploaded.push({ url: result.media.url, caption: null, location: null, annotations: null });
        } else {
          setError(result.message);
        }
      }
      if (uploaded.length > 0) onChange([...photos, ...uploaded]);
    });
  }, [photos, max, onChange]);

  const patch = (index: number, field: "caption" | "location", value: string) =>
    onChange(photos.map((p, i) => (i === index ? { ...p, [field]: value || null } : p)));

  // Handle annotation save
  const handleAnnotationSave = async (annotatedImageUrl: string, annotations: AnnotationData[]) => {
    if (!annotatingPhoto) return;

    setIsSavingAnnotation(true);
    try {
      // Convert data URL to blob and upload
      const response = await fetch(annotatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "annotated-image.png", { type: "image/png" });

      const payload = new FormData();
      payload.append("file", file);

      const result = await uploadMediaAction(payload);
      if (result.ok) {
        // Update the photo with the new annotated image URL
        const updatedPhotos = [...photos];
        updatedPhotos[annotatingPhoto.index] = {
          ...updatedPhotos[annotatingPhoto.index],
          url: result.media.url,
          annotations: JSON.stringify(annotations),
        };
        onChange(updatedPhotos);
        setAnnotatingPhoto(null);
      } else {
        setError(result.message || "Gagal menyimpan gambar terannotate");
      }
    } catch (err) {
      console.error("Annotation save error:", err);
      setError("Gagal menyimpan gambar terannotate");
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  // Get annotation count for a photo
  const getAnnotationCount = (photo: PhotoDraft): number => {
    if (!photo.annotations) return 0;
    try {
      const data = JSON.parse(photo.annotations);
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  };

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
            <li key={`${photo.url}-${index}`} className="relative rounded-lg border border-neutral-200 p-2">
              {/* Image with annotation badge */}
              <div className="relative h-28 overflow-hidden rounded bg-neutral-100">
                <Image
                  src={mediaSrc(photo.url)}
                  alt={photo.caption ?? `Foto ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover"
                />
                {/* Annotation badge */}
                {getAnnotationCount(photo) > 0 && (
                  <AnnotationBadge count={getAnnotationCount(photo)} />
                )}
                {/* Action buttons */}
                <div className="absolute right-1 top-1 flex gap-1">
                  {/* Preview button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPhoto(photo);
                      setPreviewMode(true);
                    }}
                    aria-label={`Lihat foto ${index + 1}`}
                    className="rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <Eye size={12} />
                  </button>
                  {/* Annotation button */}
                  <button
                    type="button"
                    onClick={() => setAnnotatingPhoto({ index, photo })}
                    aria-label={`Annotasi foto ${index + 1}`}
                    className="rounded-full bg-cyan-600/80 p-1 text-white hover:bg-cyan-600"
                    title="Annotasi gambar"
                  >
                    <Pencil size={12} />
                  </button>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onChange(photos.filter((_, i) => i !== index))}
                    aria-label={`Hapus foto ${index + 1}`}
                    className="rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
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

      {/* Image Annotator Modal */}
      {annotatingPhoto && (
        <ImageAnnotator
          imageUrl={mediaSrc(annotatingPhoto.photo.url)}
          annotations={annotatingPhoto.photo.annotations
            ? JSON.parse(annotatingPhoto.photo.annotations)
            : []}
          onSave={handleAnnotationSave}
          onCancel={() => setAnnotatingPhoto(null)}
        />
      )}

      {/* Image Preview Modal */}
      {previewMode && previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => {
              setPreviewMode(false);
              setPreviewPhoto(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={mediaSrc(previewPhoto.url)}
              alt={previewPhoto.caption ?? "Preview"}
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            {previewPhoto.caption && (
              <p className="mt-2 text-center text-sm text-slate-300">{previewPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
