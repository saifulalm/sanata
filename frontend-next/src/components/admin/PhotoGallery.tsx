"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  isPrimary?: boolean;
}

interface PhotoGalleryProps {
  photos: Photo[];
  toolName: string;
  onDelete?: (photoId: string) => void;
  onSetPrimary?: (photoId: string) => void;
  editable?: boolean;
}

export function PhotoGallery({ photos, toolName, onDelete, onSetPrimary, editable = false }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <ZoomIn size={20} className="text-slate-500" />
          </div>
          <p className="text-sm text-slate-500">Belum ada foto</p>
        </div>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`group relative aspect-square overflow-hidden rounded-xl border transition-all ${
              photo.isPrimary
                ? "border-cyan-400/40"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <img
              src={photo.url}
              alt={photo.caption || `${toolName} - Foto ${index + 1}`}
              className="h-full w-full object-cover cursor-pointer"
              onClick={() => openLightbox(index)}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />

            {/* Primary Badge */}
            {photo.isPrimary && (
              <div className="absolute left-2 top-2 rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-medium text-white">
                Utama
              </div>
            )}

            {/* Zoom Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                <ZoomIn size={18} />
              </div>
            </div>

            {/* Edit Actions */}
            {editable && (
              <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                {onSetPrimary && !photo.isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrimary(photo.id);
                    }}
                    className="rounded bg-cyan-500/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-cyan-500"
                  >
                    Jadikan Utama
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photo.id);
                    }}
                    className="ml-auto rounded bg-rose-500/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-rose-500"
                  >
                    Hapus
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative max-h-[80vh] max-w-[90vw]">
            <img
              src={photos[currentIndex].url}
              alt={photos[currentIndex].caption || toolName}
              className="max-h-[80vh] max-w-[90vw] object-contain"
            />
            {photos[currentIndex].caption && (
              <p className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-center text-sm text-white">
                {photos[currentIndex].caption}
              </p>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                    index === currentIndex ? "border-cyan-400" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
