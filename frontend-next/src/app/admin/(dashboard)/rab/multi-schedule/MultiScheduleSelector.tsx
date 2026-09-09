"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { inputClass } from "@/components/admin/ui";
import type { RabListRow } from "@/lib/estimation";

interface MultiScheduleSelectorProps {
  availableRabs: RabListRow[];
  selectedIds: string[];
}

const MAX_SELECTIONS = 5;

export function MultiScheduleSelector({ availableRabs, selectedIds }: MultiScheduleSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const toggleRab = useCallback(
    (rabId: string) => {
      const current = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
      let next: string[];

      if (current.includes(rabId)) {
        next = current.filter((id) => id !== rabId);
      } else if (current.length >= MAX_SELECTIONS) {
        return; // Don't add more than max
      } else {
        next = [...current, rabId];
      }

      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) {
        params.set("ids", next.join(","));
      } else {
        params.delete("ids");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ids");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const filteredRabs = availableRabs.filter(
    (rab) =>
      rab.number.toLowerCase().includes(search.toLowerCase()) ||
      rab.title.toLowerCase().includes(search.toLowerCase()) ||
      (rab.clientName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const canAddMore = selectedIds.length < MAX_SELECTIONS;

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Cari nomor atau judul RAB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {selectedIds.length} / {MAX_SELECTIONS} dipilih
          </span>
          {selectedIds.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Selection Grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRabs.map((rab) => {
          const isSelected = selectedIds.includes(rab.id);
          const canSelect = !isSelected && canAddMore;

          return (
            <label
              key={rab.id}
              className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition ${
                isSelected
                  ? "border-teal-500/50 bg-teal-500/10"
                  : canSelect
                  ? "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  : "border-white/6 bg-white/[0.01] opacity-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{rab.number}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{rab.title}</p>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRab(rab.id)}
                  disabled={!isSelected && !canSelect}
                  className="accent-teal-500 mt-1"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span
                  className={`rounded-full border px-1.5 py-0.5 ${
                    rab.status === "APPROVED"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : rab.status === "REVIEW"
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                      : "border-white/20 bg-white/5 text-slate-400"
                  }`}
                >
                  {rab.status}
                </span>
                {rab.clientName && (
                  <span className="text-slate-500">{rab.clientName}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {filteredRabs.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          {search ? "Tidak ada RAB yang cocok dengan pencarian." : "Tidak ada RAB tersedia."}
        </p>
      )}

      {/* Warning when max reached */}
      {selectedIds.length >= MAX_SELECTIONS && (
        <p className="text-xs text-amber-400">
          Maksimal {MAX_SELECTIONS} RAB untuk perbandingan. Hapus salah satu untuk menambahkan yang lain.
        </p>
      )}
    </div>
  );
}
