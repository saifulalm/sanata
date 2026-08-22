"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Tags,
  Users,
  ShieldCheck,
  Shield,
  MessageSquare,
  Megaphone,
  Send,
  ScrollText,
  Calculator,
  Layers,
  Coins,
  LayoutList,
  FileSignature,
  Search,
  Image as ImageIcon,
  LogOut,
  Menu,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { CommandPalette, type CommandItem } from "@/components/admin/CommandPalette";
import type { AdminSession } from "@/lib/adminApi";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  /** Kosong untuk item tanpa judul grup (mis. Dashboard). */
  label?: string;
  items: NavItem[];
}

/** Menu dikelompokkan menurut pekerjaan, bukan urutan pembuatan modul. */
const navGroups: NavGroup[] = [
  {
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Proyek",
    items: [
      { href: "/admin/rab", label: "Proyek & RAB", icon: Calculator },
      // Dokumen proyek melekat pada satu proyek, jadi pintu masuknya lewat
      // proyeknya. Yang perlu tautan tersendiri hanyalah pengajuan: atasan
      // memeriksanya lintas proyek, bukan satu per satu.
      { href: "/admin/submissions", label: "Pengajuan", icon: Send },
      { href: "/admin/quotations", label: "Surat Penawaran", icon: FileSignature },
    ],
  },
  {
    label: "Pelaporan",
    items: [
      { href: "/admin/daily-reports", label: "Laporan Harian", icon: ScrollText },
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/users", label: "Pengguna", icon: Users, adminOnly: true },
      { href: "/admin/roles", label: "Jabatan & Penanda Tangan", icon: Shield, adminOnly: true },
      { href: "/admin/security", label: "Keamanan", icon: ShieldCheck },
    ],
  },
  {
    label: "Estimasi Biaya",
    items: [
      { href: "/admin/ahsp", label: "AHSP", icon: Layers },
      { href: "/admin/price-items", label: "Harga Satuan", icon: Coins },
    ],
  },
  {
    label: "Situs & Konten",
    items: [
      { href: "/admin/site-content", label: "Konten Situs", icon: LayoutList },
      { href: "/admin/contents", label: "Artikel & Halaman", icon: FileText },
      { href: "/admin/media", label: "Pustaka Media", icon: ImageIcon },
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/products", label: "Layanan", icon: ShoppingBag },
      { href: "/admin/categories", label: "Kategori", icon: Tags },
    ],
  },
  {
    label: "Prospek",
    items: [
      { href: "/admin/inquiries", label: "Pesan Masuk", icon: MessageSquare },
      { href: "/admin/broadcasts", label: "Broadcast", icon: Megaphone },
    ],
  },
];

function NavLinks({
  groups,
  pathname,
  onLinkClick,
  badges = {},
}: {
  groups: NavGroup[];
  pathname: string;
  onLinkClick: () => void;
  /** Angka kecil di kanan menu, mis. jumlah pesan masuk yang belum ditangani. */
  badges?: Record<string, number>;
}) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} className={groupIndex > 0 ? "pt-4" : undefined}>
          {group.label && (
                  <p className="px-3 pb-1.5 font-accent text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = item.end ? pathname === item.href : pathname.startsWith(item.href);
              const badge = badges[item.href] ?? 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium uppercase tracking-[0.12em] transition-all",
                        isActive
                          ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_30px_rgba(56,189,248,0.08)]"
                          : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <item.icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span
                      aria-label={`${badge} item baru`}
                      className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-100"
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminShell({
  session,
  children,
  badges,
}: {
  session: AdminSession;
  children: ReactNode;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Grup yang seluruh isinya khusus admin ikut disembunyikan agar tak ada judul kosong.
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || session.role === "ADMIN"),
    }))
    .filter((group) => group.items.length > 0);
  const closeMobile = () => setMobileOpen(false);

  // Command palette memakai daftar menu yang sama, jadi entri khusus ADMIN
  // otomatis ikut tersaring untuk peran lain.
  const commandItems: CommandItem[] = visibleGroups.flatMap((group) =>
    group.items.map((item) => ({
      label: item.label,
      href: item.href,
      group: group.label ?? "Umum",
    }))
  );

  return (
        <div className="admin-theme flex min-h-screen">
          <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#06111f]/90 backdrop-blur-2xl md:flex">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-white/10 text-sm font-bold text-cyan-100 shadow-[0_0_25px_rgba(56,189,248,0.15)]">
                SR
          </span>
              <span className="leading-none">
                <span className="block font-display text-sm font-semibold uppercase tracking-[0.24em] text-white">Sanata Admin</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.26em] text-slate-500">Futuristic Control Hub</span>
              </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLinks groups={visibleGroups} pathname={pathname} onLinkClick={closeMobile} badges={badges} />
        </nav>
            <div className="border-t border-white/10 p-3">
          <form action={logoutAction}>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium uppercase tracking-[0.12em] text-slate-400 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300">
              <LogOut size={17} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-white/10 bg-[#081421]/70 px-6 py-4 backdrop-blur-2xl">
              <button onClick={() => setMobileOpen(true)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white md:hidden" aria-label="Buka menu">
            <Menu size={22} />
          </button>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 md:block">
                  <Sparkles size={12} className="mr-1 inline-block" />
                  Sanata Ops
            </div>
                <CommandPalette items={commandItems} />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{session.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{session.role}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
              {session.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
            <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="w-72 border-r border-white/10 bg-[#06111f]/95 p-3 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between px-3 py-2">
                  <span className="font-display text-sm font-semibold uppercase tracking-[0.24em] text-white">Sanata Admin</span>
                  <button onClick={closeMobile} className="rounded-xl border border-white/10 bg-white/[0.04] p-1.5 text-slate-400" aria-label="Tutup menu">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              <NavLinks groups={visibleGroups} pathname={pathname} onLinkClick={closeMobile} badges={badges} />
            </nav>
          </div>
          <div className="flex-1 bg-black/40" onClick={closeMobile} />
        </div>
      )}
    </div>
  );
}
