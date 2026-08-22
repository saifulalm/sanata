"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Layers, Pause, Play, RotateCcw } from "lucide-react";
import {
  ExplodedBuildingView,
  floorAccentHex,
  type ExplodedFloor,
} from "@/components/home/ExplodedBuildingView";

/**
 * Seksi publik untuk pratinjau 3D exploded view.
 *
 * Kanvas 3D sengaja hanya jadi tampilan; seluruh kendali ada pada elemen HTML
 * biasa di sebelahnya (penggeser, tombol lantai, tombol putar). Dengan begitu
 * pengguna keyboard dan pembaca layar mendapat jalur yang sama tanpa harus
 * berinteraksi dengan kanvas.
 */
export function ExplodedFloorSection({
  eyebrow,
  title,
  description,
  floors,
  defaultExplode,
  defaultAutoRotate,
}: {
  eyebrow: string;
  title: string;
  description: string;
  floors: ExplodedFloor[];
  /** 0–100 dari CMS. */
  defaultExplode: number;
  defaultAutoRotate: boolean;
}) {
  const sliderId = useId();
  const [explode, setExplode] = useState(defaultExplode);
  const [autoRotate, setAutoRotate] = useState(defaultAutoRotate);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"exploded" | "timeline">("exploded");
  const [week, setWeek] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  // Panjang proyek diturunkan dari data lantai, bukan angka tetap: menambah
  // satu lantai di admin otomatis memanjangkan garis waktunya.
  const totalWeeks = floors.reduce((max, f) => Math.max(max, f.startWeek + f.durationWeeks), 0);

  // Pemutaran otomatis garis waktu. Berhenti sendiri di ujung, dan tidak
  // pernah berjalan saat sistem meminta gerakan seminimal mungkin.
  useEffect(() => {
    if (!playing || mode !== "timeline" || reduceMotion || totalWeeks === 0) return;
    const timer = window.setInterval(() => {
      setWeek((current) => {
        if (current >= totalWeeks) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 550);
    return () => window.clearInterval(timer);
  }, [playing, mode, reduceMotion, totalWeeks]);

  // Preferensi sistem menang atas setelan CMS, tapi tetap disimpan terpisah
  // dari pilihan pengunjung supaya tombolnya jujur: yang ditampilkan adalah
  // alasan model tidak berputar, bukan tombol yang seolah rusak.
  const rotating = autoRotate && !reduceMotion;

  if (floors.length === 0) return null;

  const selected = floors.find((f) => f.id === selectedId) ?? null;
  const totalHeight = floors.reduce((sum, f) => sum + f.heightM, 0);
  const largestArea = Math.max(...floors.map((f) => f.widthM * f.depthM));

  // Kemajuan tiap lantai pada minggu yang sedang dilihat: 0 sebelum mulai,
  // naik linear sepanjang durasinya, 1 setelah selesai.
  const progressByFloor: Record<string, number> = {};
  for (const floor of floors) {
    const elapsed = week - floor.startWeek;
    progressByFloor[floor.id] =
      elapsed <= 0 ? 0 : Math.min(1, elapsed / Math.max(floor.durationWeeks, 1));
  }

  // Bobot memakai volume, bukan jumlah lantai: lantai besar memang menyumbang
  // lebih banyak pekerjaan daripada lantai kecil.
  const totalVolume = floors.reduce((sum, f) => sum + f.heightM * f.widthM * f.depthM, 0);
  const overallProgress =
    totalVolume === 0
      ? 0
      : floors.reduce(
          (sum, f) => sum + progressByFloor[f.id] * f.heightM * f.widthM * f.depthM,
          0
        ) / totalVolume;

  const activeFloors = floors.filter((f) => progressByFloor[f.id] > 0 && progressByFloor[f.id] < 1);
  const timelineMode = mode === "timeline";

  // Keterangan garis waktu. Tanpa cabang "berikutnya", minggu tepat di
  // pergantian pekerjaan akan berbunyi "belum ada pekerjaan berjalan" padahal
  // sebagian besar bangunan sudah berdiri.
  const nextFloor = floors.find((f) => f.startWeek >= week);
  const timelineCaption =
    activeFloors.length > 0
      ? activeFloors.map((f) => f.title).join(", ")
      : week >= totalWeeks
        ? "Bangunan selesai"
        : nextFloor
          ? `Berikutnya: ${nextFloor.title} (minggu ${nextFloor.startWeek})`
          : "Menunggu pekerjaan berikutnya";

  return (
    <section id="exploded-view" className="relative border-y border-white/5 bg-[#050e19] py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(56,189,248,0.12),_transparent_45%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
            <Layers size={14} className="text-cyan-300" />
            {eyebrow}
          </div>
          <h2 className="mt-5 text-3xl font-semibold uppercase tracking-[0.06em] text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* --- Kanvas + kendali ------------------------------------------- */}
          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_40px_120px_rgba(2,12,27,0.45)]">
            <div className="relative h-[26rem] overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_center,_rgba(103,232,249,0.14),_transparent_65%)] sm:h-[32rem]">
              <ExplodedBuildingView
                floors={floors}
                explode={timelineMode ? 0 : explode / 100}
                autoRotate={rotating}
                selectedId={selectedId}
                onSelect={setSelectedId}
                progressByFloor={timelineMode ? progressByFloor : null}
              />

              {timelineMode && (
                <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Minggu {week} / {totalWeeks}
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-white">
                    {(overallProgress * 100).toFixed(0)}%
                  </p>
                  <p className="max-w-[14rem] truncate text-[11px] text-cyan-200">{timelineCaption}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(["exploded", "timeline"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={clsx(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
                    mode === value
                      ? "border-cyan-300/45 bg-cyan-300/10 text-cyan-100"
                      : "border-white/12 text-slate-400 hover:border-cyan-300/25 hover:text-white"
                  )}
                >
                  {value === "exploded" ? "Exploded" : "Garis Waktu 4D"}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="min-w-[14rem] flex-1">
                {timelineMode ? (
                  <>
                    <label
                      htmlFor={`${sliderId}-week`}
                      className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400"
                    >
                      <span>Minggu Pelaksanaan</span>
                      <span className="tabular-nums text-cyan-200">
                        {week} / {totalWeeks}
                      </span>
                    </label>
                    <input
                      id={`${sliderId}-week`}
                      type="range"
                      min={0}
                      max={totalWeeks}
                      value={week}
                      onChange={(e) => {
                        setPlaying(false);
                        setWeek(Number(e.target.value));
                      }}
                      className="w-full accent-cyan-400"
                    />
                  </>
                ) : (
                  <>
                    <label
                      htmlFor={sliderId}
                      className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400"
                    >
                      <span>Pemisah Lantai</span>
                      <span className="tabular-nums text-cyan-200">{explode}%</span>
                    </label>
                    <input
                      id={sliderId}
                      type="range"
                      min={0}
                      max={100}
                      value={explode}
                      onChange={(e) => setExplode(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </>
                )}
              </div>

              {timelineMode && (
                <button
                  type="button"
                  onClick={() => {
                    if (week >= totalWeeks) setWeek(0);
                    setPlaying((v) => !v);
                  }}
                  aria-pressed={playing}
                  disabled={reduceMotion || totalWeeks === 0}
                  title={reduceMotion ? "Dinonaktifkan karena sistem meminta gerakan seminimal mungkin" : undefined}
                  className="flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                  {playing ? "Jeda" : week >= totalWeeks ? "Ulang" : "Putar Waktu"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                aria-pressed={rotating}
                disabled={reduceMotion}
                title={reduceMotion ? "Dinonaktifkan karena sistem meminta gerakan seminimal mungkin" : undefined}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-cyan-300/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rotating ? <Pause size={14} /> : <Play size={14} />}
                {reduceMotion ? "Gerakan Dikurangi" : rotating ? "Hentikan Putaran" : "Putar Model"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setExplode(defaultExplode);
                  setSelectedId(null);
                  setWeek(0);
                  setPlaying(false);
                }}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-cyan-300/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                <RotateCcw size={14} /> Atur Ulang
              </button>
            </div>
          </div>

          {/* --- Daftar lantai + detail -------------------------------------- */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Jumlah Lantai" value={String(floors.length)} />
              <Stat label="Tinggi Total" value={`${totalHeight.toFixed(1)} m`} />
              {timelineMode ? (
                <Stat label="Durasi Proyek" value={`${totalWeeks} mgg`} />
              ) : (
                <Stat label="Denah Terluas" value={`${Math.round(largestArea)} m²`} />
              )}
            </div>

            {/* Urutan dibalik agar lantai teratas tampil di atas daftar,
                mencerminkan bangunan sungguhan. */}
            <ul className="flex flex-col-reverse gap-2">
              {floors.map((floor) => {
                const active = floor.id === selectedId;
                return (
                  <li key={floor.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(active ? null : floor.id)}
                      aria-pressed={active}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
                        active
                          ? "border-cyan-300/45 bg-cyan-300/10"
                          : "border-white/10 bg-slate-950/60 hover:border-cyan-300/25"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-8 w-1.5 shrink-0 rounded-full"
                        style={{ background: floorAccentHex(floor.accent) }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{floor.title}</span>
                        <span className="block text-xs text-slate-400">
                          {timelineMode
                            ? `Minggu ${floor.startWeek}–${floor.startWeek + floor.durationWeeks} · ${floor.durationWeeks} minggu`
                            : `${floor.subtitle ? `${floor.subtitle} · ` : ""}${floor.heightM} m · ${floor.widthM}×${floor.depthM} m`}
                        </span>
                        {timelineMode && (
                          <span
                            aria-hidden="true"
                            className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-white/10"
                          >
                            <span
                              className="block h-full rounded-full transition-[width] duration-300"
                              style={{
                                width: `${progressByFloor[floor.id] * 100}%`,
                                background: floorAccentHex(floor.accent),
                              }}
                            />
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected && (
              <div className="rounded-2xl border border-cyan-300/25 bg-slate-950/80 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{selected.title}</p>
                {selected.subtitle && <p className="mt-1 text-xs text-cyan-200">{selected.subtitle}</p>}
                {selected.imageUrl && (
                  <span className="relative mt-3 block h-40 overflow-hidden rounded-xl bg-slate-900">
                    <Image
                      src={selected.imageUrl}
                      alt={`Denah ${selected.title}`}
                      fill
                      sizes="(min-width: 1024px) 30vw, 90vw"
                      className="object-cover"
                    />
                  </span>
                )}
                {selected.body && <p className="mt-3 text-sm leading-6 text-slate-300">{selected.body}</p>}
                {selected.href && (
                  <Link
                    href={selected.href}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/20"
                  >
                    Selengkapnya <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Membaca `prefers-reduced-motion` lewat `useSyncExternalStore`, bukan
 * `useState` + efek: itu cara React membaca sumber di luar dirinya tanpa
 * render tambahan, dan snapshot server-nya membuat markup awal tetap cocok.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
