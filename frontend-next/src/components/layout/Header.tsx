"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Settings } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/**
 * Beberapa entri punya tujuan berbeda tergantung halaman: di beranda mereka
 * melompat ke panel di halaman yang sama, di halaman lain ke halaman penuhnya.
 * RUMAMESRA belum punya halaman sendiri, jadi selalu mengarah ke panelnya di
 * beranda — sebelumnya entri ini menunjuk `/projects` sehingga menyesatkan.
 */
const NAV_ITEMS = [
  { href: "/", homeHref: "/#homepage", label: "Homepage" },
  { href: "/about", homeHref: "/#about-us", label: "About Us" },
  { href: "/services", homeHref: "/#sanata-services", label: "SANATA Services" },
  { href: "/#rumamesra-services", homeHref: "/#rumamesra-services", label: "RUMAMESRA Services" },
  { href: "/projects", homeHref: "/projects", label: "Projects" },
  { href: "/process", homeHref: "/process", label: "Our Process" },
  { href: "/journal", homeHref: "/journal", label: "Insights" },
  { href: "/contact", homeHref: "/contact", label: "Contact Us" },
] as const;

const ADMIN_URL = "/admin/login";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState<string | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const solid = scrolled || !isHome;

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = NAV_ITEMS.map((item) => ({
    label: item.label,
    href: isHome ? item.homeHref : item.href,
  }));

  // Tautan anchor di beranda tidak mengubah pathname, jadi menu mobile ditutup
  // manual di sini — tanpa ini menu tetap terbuka menutupi bagian yang dituju.
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        /* SANATA Brand: Desert Charcoal background */
        solid ? "bg-[#12181B]/90 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between container-px py-4">
        <Logo />

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300",
                /* SANATA Brand: Desert hover accent */
                solid ? "text-charcoal-200 hover:bg-desert-400/10 hover:text-desert-200" : "text-white/80 hover:bg-white/10 hover:text-desert-200",
                pathname === item.href && (solid ? "bg-desert-400/10 text-desert-200" : "bg-white/10 text-desert-200")
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden xl:block">
          {/* SANATA Brand: Desert CTA */}
          <Button
            href={ADMIN_URL}
            variant="outline"
            className="!border-desert-400/35 !bg-desert-400/10 !py-2.5 !text-xs !uppercase !tracking-[0.22em] !text-desert-200 hover:!bg-desert-400/20"
          >
            <Settings size={14} /> Admin Login
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white backdrop-blur-xl xl:hidden"
          aria-label="Buka menu navigasi"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            /* SANATA Brand: Desert Charcoal mobile menu */
            className="overflow-hidden border-t border-white/10 bg-[#12181B]/95 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl xl:hidden"
          >
            <nav className="flex flex-col gap-2 container-px py-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobile}
                  /* SANATA Brand: Desert hover */
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium uppercase tracking-[0.16em] text-charcoal-200 hover:border-desert-400/30 hover:text-desert-200"
                >
                  {item.label}
                </Link>
              ))}
              {/* SANATA Brand: Desert CTA */}
              <Button
                href={ADMIN_URL}
                variant="outline"
                className="mt-2 justify-center !border-desert-400/35 !bg-desert-400/10 !text-desert-200"
              >
                Admin Login
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
