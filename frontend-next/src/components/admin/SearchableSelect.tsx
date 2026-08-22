"use client";

import { useMemo, useState } from "react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  inputClassName?: string;
  selectClassName?: string;
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "Pilih opsi",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ada hasil",
  inputClassName,
  selectClassName,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;

    return options.filter((option) => {
      const haystack = `${option.label} ${option.searchText ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [options, query]);

  const selected = options.find((option) => option.value === value);
  const visibleOptions =
    value && selected && !filtered.some((option) => option.value === value) ? [selected, ...filtered] : filtered;

  return (
    <div className="space-y-1">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className={
          inputClassName ??
          "w-full rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 focus:border-gold-400 focus:outline-none"
        }
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          selectClassName ??
          "w-full rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 focus:border-gold-400 focus:outline-none"
        }
      >
        <option value="">{placeholder}</option>
        {visibleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {query && visibleOptions.length === 0 && <p className="text-[11px] text-neutral-400">{emptyMessage}</p>}
    </div>
  );
}
