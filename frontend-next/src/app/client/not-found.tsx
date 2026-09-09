"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  LayoutDashboard,
  FolderKanban,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  Loader2,
} from "lucide-react";

const navItems = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "Proyek Saya", icon: FolderKanban },
  { href: "/client/notifications", label: "Notifikasi", icon: Bell },
  { href: "/client/settings", label: "Pengaturan", icon: Settings },
];

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo */}
        <Link
          href="/client"
          className="inline-flex items-center gap-3 mb-8 group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
              SANTRA
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Client Portal
            </span>
          </div>
        </Link>

        {/* Error code */}
        <div className="mb-6">
          <span className="inline-block px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-full mb-4">
            404 Error
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">
            Maaf, halaman yang Anda cari tidak dapat ditemukan.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            URL: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{pathname}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/client"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
          >
            <Home className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Halaman Sebelumnya
          </button>
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Atau navigasi ke
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
          Jika Anda yakin ini adalah kesalahan, silakan{" "}
          <Link
            href="/client/contact"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            hubungi tim kami
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} PT Sanata Bhakti Utama. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
