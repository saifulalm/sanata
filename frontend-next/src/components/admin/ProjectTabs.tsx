"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  CalendarRange,
  ClipboardCheck,
  FileSignature,
  FileStack,
  Inbox,
  LayoutDashboard,
  NotebookPen,
  Receipt,
  Ruler,
  Send,
  Table2,
} from "lucide-react";

/**
 * Navigasi antar-berkas satu proyek.
 *
 * Sebelum ini, setiap halaman turunan RAB hanya punya tautan "kembali" ke satu
 * halaman induk yang berbeda-beda, sehingga berpindah dari laporan harian ke
 * termin menuntut dua langkah mundur. Dokumen proyek datang berkelompok —
 * pengawas membuka opname, lalu logbook, lalu suratnya — jadi seluruh berkas
 * proyek ditampilkan sebagai satu deret tab yang sama di mana pun ia berada.
 */

interface Tab {
  segment: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
}

const TABS: Tab[] = [
  { segment: "overview", label: "Ikhtisar", icon: LayoutDashboard, group: "Proyek" },
  { segment: "", label: "Rincian RAB", icon: Table2, group: "Proyek" },
  { segment: "takeoff", label: "Kebutuhan", icon: Ruler, group: "Proyek" },
  { segment: "schedule", label: "Jadwal & Kurva S", icon: CalendarRange, group: "Proyek" },

  { segment: "submissions", label: "Pengajuan", icon: Send, group: "Pengajuan" },

  { segment: "daily-reports", label: "Laporan Harian", icon: ClipboardCheck, group: "Pelaporan" },
  { segment: "reports", label: "Mingguan & Bulanan", icon: FileStack, group: "Pelaporan" },
  { segment: "logbook", label: "Logbook", icon: NotebookPen, group: "Pelaporan" },

  { segment: "memos", label: "Site Memo", icon: Inbox, group: "Site Memo" },

  { segment: "letters", label: "Surat-menyurat", icon: FileSignature, group: "Surat" },
  { segment: "billings", label: "Termin", icon: Receipt, group: "Surat" },
];

export function ProjectTabs({ rabId }: { rabId: string }) {
  const pathname = usePathname();
  const base = `/admin/rab/${rabId}`;

  return (
    <nav
      aria-label="Berkas proyek"
      className="-mx-1 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5"
    >
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        // Tab "Rincian RAB" memakai jalur induk, jadi hanya aktif saat persis
        // sama — kalau tidak, ia akan ikut menyala di seluruh halaman turunan.
        const isActive = tab.segment ? pathname.startsWith(href) : pathname === base;

        return (
          <Link
            key={tab.segment || "root"}
            href={href}
            aria-current={isActive ? "page" : undefined}
            title={tab.group}
            className={clsx(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition",
              isActive
                ? "border border-cyan-300/25 bg-cyan-300/12 text-cyan-100"
                : "border border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
