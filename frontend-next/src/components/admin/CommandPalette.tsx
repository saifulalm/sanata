"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CornerDownLeft,
  Search,
  Plus,
  FileText,
  Settings,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

export interface CommandItem {
  label: string;
  href: string;
  group: string;
  /** Kata bantu pencarian: istilah lain yang mungkin diketik admin. */
  keywords?: string;
  /** Ikon kustom opsional */
  icon?: LucideIcon;
  /** Aksi cepat (form action) */
  action?: () => Promise<void>;
}

interface CommandAction {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void | Promise<void>;
  shortcut?: string;
}

// Quick actions available globally
const GLOBAL_ACTIONS: CommandAction[] = [
  {
    id: "new-rab",
    label: "Buat RAB Baru",
    icon: FileText,
    action: () => { window.location.href = "/admin/rab/new"; },
    shortcut: "Ctrl+N",
  },
  {
    id: "new-content",
    label: "Tulis Konten Baru",
    icon: Plus,
    action: () => { window.location.href = "/admin/contents"; },
    shortcut: "Ctrl+Shift+N",
  },
  {
    id: "settings",
    label: "Pengaturan",
    icon: Settings,
    action: () => { window.location.href = "/admin/security"; },
    shortcut: "Ctrl+,",
  },
];

/**
 * Command Palette Enhanced - Pencarian menu dan aksi cepat dengan keyboard shortcut.
 *
 * Fitur:
 * - Pencarian fuzzy
 * - Recent items (paling baru diakses)
 * - Quick actions global
 * - Keyboard shortcut support
 * - Grouped results
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);
  const [showActions, setShowActions] = useState(true);

  // Load recent items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cmd-palette-recent");
    if (saved) {
      try {
        setRecentItems(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent item
  const addToRecent = useCallback((item: CommandItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.href !== item.href);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem("cmd-palette-recent", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Combined results: actions + recent (if no query) + search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    // If searching, filter items
    if (q) {
      return {
        type: "search" as const,
        items: items.filter((item) =>
          `${item.label} ${item.group} ${item.keywords ?? ""}`.toLowerCase().includes(q)
        ),
      };
    }

    // No query: show recent items
    return { type: "recent" as const, items: recentItems };
  }, [items, query, recentItems]);

  // Sync showActions with query state (side effect must not be inside useMemo)
  useEffect(() => {
    setShowActions(true);
  }, [query]);

  // Index management
  const safeIndex = results.items.length > 0 ? Math.min(activeIndex, results.items.length - 1) : 0;

  const openPalette = () => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K: Open palette
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => {
          if (value) return false;
          setQuery("");
          setActiveIndex(0);
          return true;
        });
        return;
      }

      // Ctrl/Cmd + N: New RAB
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n" && !event.shiftKey) {
        event.preventDefault();
        window.location.href = "/admin/rab/new";
        return;
      }

      // Ctrl/Cmd + Shift + N: New Content
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        window.location.href = "/admin/contents";
        return;
      }

      // Escape: Close
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (item: CommandItem) => {
    addToRecent(item);
    setOpen(false);
    router.push(item.href);
  };

  const executeAction = (action: CommandAction) => {
    action.action();
    setOpen(false);
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.items.length ? (index + 1) % results.items.length : 0));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (results.items.length ? (index - 1 + results.items.length) % results.items.length : 0));
    }
    if (event.key === "Enter" && results.items[safeIndex]) {
      event.preventDefault();
      go(results.items[safeIndex]);
    }
  };

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    results.items.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [results.items]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={openPalette}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-slate-400 transition hover:border-cyan-300/25 hover:text-white"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Cari menu</span>
        <kbd className="hidden rounded border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
          className="fixed inset-0 z-[80] flex items-start justify-center bg-[#020617]/75 p-4 pt-[10vh] backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-2xl border border-white/12 bg-[#081421]/96 shadow-[0_40px_120px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
              <Search size={16} className="shrink-0 text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onListKeyDown}
                placeholder="Ketik nama menu atau aksi — RAB, SEO, media..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Actions */}
            {showActions && !query && (
              <div className="border-b border-white/[0.05] p-2">
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Aksi Cepat
                </p>
                {GLOBAL_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => executeAction(action)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <Icon size={15} />
                      </div>
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && (
                        <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {!query && recentItems.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Terakhir Diakses
                  </p>
                </div>
              )}

              {results.items.length > 0 ? (
                Object.entries(groupedResults).map(([group, groupItems]) => (
                  <div key={group} className="mb-3 last:mb-0">
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      {group}
                    </p>
                    {groupItems.map((item, idx) => {
                      const globalIndex = results.items.indexOf(item);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          onClick={() => go(item)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            globalIndex === safeIndex
                              ? "bg-cyan-300/12 text-cyan-100"
                              : "text-slate-300 hover:bg-white/[0.04]"
                          }`}
                        >
                          {Icon ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                              <Icon size={14} />
                            </div>
                          ) : (
                            <ArrowRight size={14} className="text-slate-600" />
                          )}
                          <span className="flex-1 truncate">{item.label}</span>
                          {globalIndex === safeIndex && (
                            <CornerDownLeft size={12} className="text-cyan-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <Search size={32} className="mx-auto text-slate-600" />
                  <p className="mt-3 text-sm text-slate-400">
                    {query ? "Tidak ada hasil untuk" : "Mulai ketik untuk mencari"}
                  </p>
                  {query && (
                    <p className="mt-1 font-medium text-white">"{query}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↑↓</kbd>
                  Navigasi
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↵</kbd>
                  Pilih
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">Esc</kbd>
                  Tutup
                </span>
              </div>
              <span>Sanata Command</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
