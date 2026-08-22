"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Bot, ChevronLeft, ChevronRight, Radar, TowerControl } from "lucide-react";
import { BuildingSceneCanvas } from "@/components/home/BuildingSceneCanvas";
import { SceneArtwork, type SceneVariant } from "@/components/home/SceneArtwork";

export interface HeroCarouselScene {
  title: string;
  subtitle: string;
  /** Foto asli dari CMS. Bila kosong, ilustrasi SVG lokal yang dipakai. */
  imageUrl: string | null;
  variant: SceneVariant;
  href?: string | null;
  accentClass: string;
}

export function HeroSceneCarousel({
  scenes,
  label = "Live 4D Carousel",
  intervalMs = 4500,
}: {
  scenes: HeroCarouselScene[];
  label?: string;
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const panelId = useId();

  // Pergantian otomatis adalah gerakan yang tidak diminta pengunjung, jadi
  // dimatikan saat sistem meminta gerakan seminimal mungkin — sama seperti
  // yang sudah dilakukan BuildingSceneCanvas.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (scenes.length <= 1 || paused || reduceMotion || intervalMs <= 0) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % scenes.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [scenes.length, paused, reduceMotion, intervalMs]);

  // Menghapus slide dari admin bisa membuat indeks aktif melewati batas.
  const safeActive = active < scenes.length ? active : 0;
  const current = scenes[safeActive];
  const go = (delta: number) => setActive((c) => (c + delta + scenes.length) % scenes.length);

  return (
    <div
      className="grid gap-4"
      // Jeda saat pengunjung sedang membaca atau menavigasi dengan keyboard.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        id={panelId}
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        aria-live={paused || reduceMotion || intervalMs <= 0 ? "polite" : "off"}
        className="relative min-h-[25rem] overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(2,12,27,0.45)]"
      >
        {current.imageUrl ? (
          <Image
            src={current.imageUrl}
            alt={current.title}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover opacity-60"
          />
        ) : (
          <SceneArtwork variant={current.variant} className="absolute inset-0 h-full w-full opacity-80" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-br ${current.accentClass}`} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.15),rgba(3,7,18,0.82))]" />
        <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
          <BuildingSceneCanvas accent="#67e8f9" />
        </div>

        <div className="absolute inset-x-6 top-5 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-slate-300">
          <span>{label}</span>
          <span>{String(safeActive + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span>
        </div>

        {scenes.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Scene sebelumnya"
              aria-controls={panelId}
              className="rounded-full border border-white/15 bg-slate-950/60 p-2 text-slate-200 backdrop-blur transition hover:border-cyan-300/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Scene berikutnya"
              aria-controls={panelId}
              className="rounded-full border border-white/15 bg-slate-950/60 p-2 text-slate-200 backdrop-blur transition hover:border-cyan-300/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 max-w-xl">
          <p className="text-2xl font-semibold uppercase tracking-[0.1em] text-white sm:text-3xl">{current.title}</p>
          <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">{current.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-cyan-200/90">
              <Bot size={16} />
              <TowerControl size={16} />
              <Radar size={16} />
            </div>
            {current.href ? (
              <Link
                href={current.href}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/20"
              >
                Explore Scene <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {scenes.map((scene, index) => (
          <button
            key={`${scene.title}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            // `aria-current` dipakai, bukan `aria-selected`: yang terakhir hanya
            // sah pada role tab/option/row, sedangkan ini tombol biasa.
            aria-current={safeActive === index}
            aria-controls={panelId}
            aria-label={`Tampilkan scene ${index + 1} dari ${scenes.length}: ${scene.title}`}
            className={clsx(
              "relative overflow-hidden rounded-[1.4rem] border bg-slate-950/80 p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
              safeActive === index ? "border-cyan-300/45 shadow-[0_0_35px_rgba(56,189,248,0.12)]" : "border-white/10 hover:border-cyan-300/25"
            )}
          >
            <div className="relative h-28 overflow-hidden rounded-[1rem]">
              {scene.imageUrl ? (
                <Image
                  src={scene.imageUrl}
                  alt={scene.title}
                  fill
                  sizes="(min-width: 640px) 20vw, 100vw"
                  className="object-cover opacity-70"
                />
              ) : (
                <SceneArtwork variant={scene.variant} className="absolute inset-0 h-full w-full opacity-75" />
              )}
              <div className={`absolute inset-0 bg-gradient-to-br ${scene.accentClass}`} />
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-white">{scene.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{scene.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
