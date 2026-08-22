"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { PROGRESS_STATUS_LABEL, type ProgressEntry, type ProgressStatus } from "@/lib/estimation";
import { mediaSrc } from "@/lib/media";
import { reviewProgressAction } from "../../actions";
import { Badge } from "@/components/admin/ui";

const STATUS_TONE: Record<ProgressStatus, "neutral" | "success" | "danger"> = {
  PENDING: "neutral",
  APPROVED: "success",
  REJECTED: "danger",
};

export function ProgressReviewPanel({
  rabId,
  entries,
  canReview,
}: {
  rabId: string;
  entries: ProgressEntry[];
  canReview: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const pending = entries.filter((e) => e.status === "PENDING");
  const visible = showAll ? entries : pending;

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Gagal memproses");
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Pemeriksaan Opname</h2>
          <p className="mt-1 text-xs text-slate-400">
            Hanya opname yang disetujui yang menaikkan kurva realisasi dan bisa ditagih sebagai termin.
            {!canReview && " Persetujuan hanya bisa dilakukan admin."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
        >
          {showAll ? `Tampilkan menunggu saja (${pending.length})` : `Tampilkan semua (${entries.length})`}
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{error}</p>}

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {showAll ? "Belum ada opname tercatat." : "Tidak ada opname yang menunggu pemeriksaan."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {entry.itemDescription}{" "}
                    <span className="text-sm font-normal text-slate-500">· {entry.sectionName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.date} · <span className="font-semibold text-cyan-300">{Number(entry.percent).toFixed(0)}%</span>
                    {entry.createdByName ? ` · dicatat ${entry.createdByName}` : ""}
                    {entry.approvedByName && entry.status !== "PENDING" ? ` · diperiksa ${entry.approvedByName}` : ""}
                  </p>
                  {entry.note && <p className="mt-1 text-sm text-slate-400">{entry.note}</p>}
                  {entry.rejectReason && (
                    <p className="mt-1 text-sm text-red-400">Alasan ditolak: {entry.rejectReason}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={STATUS_TONE[entry.status]}>{PROGRESS_STATUS_LABEL[entry.status]}</Badge>
                  {canReview && entry.status !== "APPROVED" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => reviewProgressAction(rabId, entry.id, "APPROVED", null))}
                      aria-label={`Setujui opname ${entry.itemDescription} tanggal ${entry.date}`}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-1.5 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  {canReview && entry.status !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        const reason = window.prompt("Alasan penolakan (opsional):") ?? null;
                        run(() => reviewProgressAction(rabId, entry.id, "REJECTED", reason));
                      }}
                      aria-label={`Tolak opname ${entry.itemDescription} tanggal ${entry.date}`}
                      className="rounded-lg border border-red-400/30 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {entry.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.photos.map((photo) => (
                    <figure key={photo.id} className="w-28">
                      <span className="relative block h-20 w-28 overflow-hidden rounded-lg bg-white/5">
                        <Image
                          src={mediaSrc(photo.url)}
                          alt={photo.caption ?? "Foto opname"}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </span>
                      {photo.caption && (
                        <figcaption className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
