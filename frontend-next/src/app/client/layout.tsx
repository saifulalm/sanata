"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Loader2,
  Sun,
  Moon,
  Home,
  FileText,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { logout, getNotifications, type Notification, type Client } from "@/lib/clientPortal";

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ClientLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
}

// ============================================================================
// Theme Hook
// ============================================================================

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("client_theme") as Theme | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (systemPrefersDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("client_theme", next);
    applyTheme(next);
  }, [theme]);

  return { theme, toggleTheme };
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

// ============================================================================
// Navigation Configuration
// ============================================================================

const navItems: NavItem[] = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "Proyek Saya", icon: FolderKanban },
  { href: "/client/notifications", label: "Notifikasi", icon: Bell },
  { href: "/client/settings", label: "Pengaturan", icon: Settings },
];

// ============================================================================
// Utility Components
// ============================================================================

function LoadingSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={clsx(className, "animate-spin")} />;
}

function Avatar({ name, className = "w-9 h-9" }: { name?: string; className?: string }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div className={clsx("rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-medium text-white shadow-lg", className)}>
      {initial}
    </div>
  );
}

// ============================================================================
// Header Component
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

function Header({
  user,
  unreadCount,
  userMenuOpen,
  setUserMenuOpen,
  theme,
  onToggleTheme,
  onMenuToggle,
  isMobileMenuOpen,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/50">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/client" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">SANTRA</span>
              <span className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">Client Portal</span>
            </div>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <Link
            href="/client/notifications"
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 -mr-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <Avatar name={user?.name} className="w-8 h-8" />
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {user?.name || "Loading..."}
              </span>
              <ChevronDown className={clsx("w-4 h-4 text-slate-400 transition-transform hidden sm:block", userMenuOpen && "rotate-180")} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Avatar name={user?.name} className="w-12 h-12" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name || "Guest"}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email || "No email"}</p>
                        {user?.companyName && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.companyName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/client/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Pengaturan Akun</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout().then(() => { window.location.href = "/client/login"; });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar</span>
                    </button>
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
// Sidebar Component
// ============================================================================

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  unreadCount: number;
}

function Sidebar({ isOpen, pathname, unreadCount, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 pt-16 flex flex-col",
          "transform transition-transform duration-300 ease-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header (Desktop only) */}
        <div className="hidden lg:block px-4 py-5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Menu Utama</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/client" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/client/notifications" && unreadCount > 0 && (
                  <span className={clsx(
                    "min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
                    isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  )}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onClose();
              logout().then(() => { window.location.href = "/client/login"; });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// Breadcrumb Component
// ============================================================================

function BreadcrumbNav({ items }: { items: Breadcrumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link href="/client" className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-900 dark:text-white">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================================================
// Page Header Component
// ============================================================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <BreadcrumbNav items={breadcrumbs ?? []} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// Footer Component
// ============================================================================

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50">
      <div className="px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">SANTRA</span>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Client Portal</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {year} PT Sanata Bhakti Utama. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// Main Layout Component
// ============================================================================

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<Client | null>(null);
  const [notifications, setNotifications] = useState<{ notifications: Notification[]; unreadCount: number }>({
    notifications: [],
    unreadCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Load user and notifications
  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, notifRes] = await Promise.all([
          fetch("/api/client/me")
            .then((r) => r.json())
            .catch(() => ({ ok: false, data: null })),
          getNotifications(),
        ]);

        if (userRes?.ok && userRes?.data) {
          setUser(userRes.data as Client);
        }

        setNotifications(notifRes);
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close menus on escape key
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
    <div className={clsx(
      "min-h-screen flex flex-col",
      theme === "dark"
        ? "bg-slate-900 text-white"
        : "bg-slate-50 text-slate-900"
    )}>
      <Header
        user={user}
        unreadCount={notifications.unreadCount}
        userMenuOpen={isUserMenuOpen}
        setUserMenuOpen={setIsUserMenuOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          pathname={pathname}
          unreadCount={notifications.unreadCount}
        />

        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <LoadingSpinner className="w-8 h-8" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Memuat...</p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// Export Sub-components for Reusability
// ============================================================================

export { PageHeader, BreadcrumbNav };
