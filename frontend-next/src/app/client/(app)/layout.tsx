"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { logout, type Client } from "@/lib/clientPortal"
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Loader2,
  Sun,
  Moon,
  HelpCircle,
  Shield,
  Building,
  User,
} from "lucide-react"

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

type Theme = "light" | "dark";

// ============================================================================
// Theme Hook
// ============================================================================

function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("client_theme") as Theme | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (systemPrefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("client_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggleTheme, mounted };
}

// ============================================================================
// Navigation
// ============================================================================

const navItems: NavItem[] = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "Proyek Saya", icon: FolderKanban },
  { href: "/client/notifications", label: "Notifikasi", icon: Bell },
  { href: "/client/settings", label: "Pengaturan", icon: Settings },
];

// ============================================================================
// Logo
// ============================================================================

function ClientLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#0f172a" opacity="0.05" />
      <g>
        <path d="M10 8 L22 8 L22 22 L32 22 L32 34 L10 34 Z" fill="url(#cpGrad)" opacity="0.15" />
        <path d="M8 8 L20 8 L20 20 L30 20 L30 34 L8 34 Z" fill="none" stroke="url(#cpGrad)" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="8" y1="14" x2="20" y2="14" stroke="url(#cpGrad)" strokeWidth="1.5" opacity="0.8" />
        <line x1="20" y1="26" x2="30" y2="26" stroke="url(#cpGrad)" strokeWidth="1.5" opacity="0.8" />
      </g>
      <circle cx="24" cy="11" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

// ============================================================================
// Components
// ============================================================================

function LoadingSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

function Avatar({ name, className = "w-9 h-9" }: { name?: string; className?: string }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div className={`rounded-full flex items-center justify-center text-sm font-semibold shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white ${className}`}>
      {initial}
    </div>
  );
}

// ============================================================================
// Header
// ============================================================================

interface HeaderProps {
  user: Client | null;
  unreadCount: number;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

function Header({ user, unreadCount, userMenuOpen, setUserMenuOpen, theme, onToggleTheme, onMenuToggle, isMobileMenuOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" aria-label="Toggle menu">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/client/dashboard" className="flex items-center gap-3 group">
            <ClientLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">SANTRA</span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full uppercase tracking-wider">Portal</span>
              </div>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 tracking-wide">Client Portal</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={onToggleTheme} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" aria-label="Toggle theme">
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <Link href="/client/notifications" className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 -mr-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" aria-expanded={userMenuOpen}>
              <Avatar name={user?.name} className="w-8 h-8" />
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">{user?.name || "Loading..."}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-20 animate-scale-in">
                  <div className="px-5 py-4 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 dark:from-blue-500/10 dark:to-cyan-500/10 border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Avatar name={user?.name} className="w-12 h-12" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name || "Guest"}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email || "No email"}</p>
                        {user?.companyName && <p className="text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1 mt-0.5"><Building className="w-3 h-3" />{user.companyName}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link href="/client/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 mx-2 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><User className="w-4 h-4" /><span>Profil & Pengaturan</span></Link>
                    <Link href="/client/notifications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 mx-2 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><Bell className="w-4 h-4" /><span>Notifikasi</span>{unreadCount > 0 && <span className="ml-auto px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">{unreadCount}</span>}</Link>
                    <div className="my-2 mx-4 border-t border-slate-200/50 dark:border-slate-700/50" />
                    <button onClick={() => { setUserMenuOpen(false); logout(); window.location.href = "/client/login"; }} className="w-full flex items-center gap-3 mx-2 px-4 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><LogOut className="w-4 h-4" /><span>Keluar</span></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Sidebar
// ============================================================================

interface SidebarProps { isOpen: boolean; onClose: () => void; pathname: string; unreadCount: number; }

function Sidebar({ isOpen, pathname, unreadCount, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 pt-16 flex flex-col shadow-xl lg:shadow-none transform transition-transform duration-300 ease-out lg:transform-none ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="hidden lg:block px-5 py-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Menu Utama</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"}`}>
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
                <span className="relative z-10 flex-1">{item.label}</span>
                {item.href === "/client/notifications" && unreadCount > 0 && <span className={`relative z-10 min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25"><HelpCircle className="w-5 h-5 text-white" /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-900 dark:text-white">Butuh Bantuan?</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hubungi tim support kami</p><button className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Lihat Panduan →</button></div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <button onClick={() => { onClose(); logout(); window.location.href = "/client/login"; }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><LogOut className="w-5 h-5" /><span>Keluar</span></button>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// Footer
// ============================================================================

function Footer() {
  return (
    <footer className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <ClientLogo className="w-8 h-8" />
            <div><span className="text-sm font-bold text-slate-700 dark:text-slate-300">SANTRA</span><span className="text-sm text-slate-400 mx-1">|</span><span className="text-sm text-slate-500 dark:text-slate-400">Client Portal</span></div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} PT Sanata Bhakti Utama. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// App Layout - Protected routes with auth check
// ============================================================================

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  const [user, setUser] = useState<Client | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("client_access");
      if (!token) {
        router.replace("/client/login");
        return;
      }

      try {
        const res = await fetch("/api/client/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("client_access");
          router.replace("/client/login");
          return;
        }

        const data = await res.json();
        if (data.data) {
          setUser(data.data);
        }

        const notifRes = await fetch("/api/client/notifications");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setUnreadCount(notifData.data?.unreadCount || 0);
        }
      } catch {
        // Network error
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${mounted && theme === "dark" ? "bg-slate-900 text-white" : "bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 text-slate-900"}`}>
      <Header user={user} unreadCount={unreadCount} userMenuOpen={isUserMenuOpen} setUserMenuOpen={setIsUserMenuOpen} theme={theme} onToggleTheme={toggleTheme} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} />
      <div className="flex flex-1">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} pathname={pathname} unreadCount={unreadCount} />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <LoadingSpinner className="w-8 h-8 text-blue-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Memuat...</p>
                </div>
              </div>
            ) : children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
