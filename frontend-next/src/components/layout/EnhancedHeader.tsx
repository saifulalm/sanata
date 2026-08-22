"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Phone,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

const mainNav: NavItem[] = [
  { label: "Layanan", href: "/services" },
  { label: "Proyek", href: "/projects" },
  { label: "Proses", href: "/process" },
  { label: "Tentang", href: "/about" },
  { label: "Karier", href: "/career" },
  { label: "Kontak", href: "/contact" },
];

const blogNav: NavItem[] = [
  { label: "Journal", href: "/journal" },
  { label: "Testimonial", href: "/testimonials" },
  { label: "FAQ", href: "/faq" },
  { label: "Gallery", href: "/gallery" },
];

export function EnhancedHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    // In a real app, this would also update document.documentElement
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "border-b border-white/10 bg-[#06111f]/95 backdrop-blur-2xl"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-white/10 text-sm font-bold text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                SR
              </div>
              <span className="hidden font-display text-lg font-semibold uppercase tracking-[0.2em] text-white sm:block">
                Sanata
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {mainNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href ?? "#"}
                  className="rounded-xl px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              {/* Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "more" ? null : "more")}
                  className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Lainnya <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {openDropdown === "more" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0a1626] p-2 shadow-xl backdrop-blur-xl"
                    >
                      {blogNav.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href ?? "#"}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
                <Search size={18} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* CTA Button */}
              <Link
                href="/contact"
                className="hidden items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300/25 lg:flex"
              >
                Konsultasi Gratis
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-80 overflow-y-auto border-l border-white/10 bg-[#06111f] p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-lg font-semibold uppercase tracking-[0.2em] text-white">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-1">
                {mainNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-white/10 pt-4">
                  <p className="mb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Lainnya
                  </p>
                  {blogNav.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href ?? "#"}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="mt-8 space-y-3">
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100"
                >
                  Konsultasi Gratis
                </Link>
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium uppercase tracking-[0.12em] text-slate-300"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                </button>
              </div>

              {/* Contact info */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="mb-3 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Hubungi Kami
                </p>
                <div className="space-y-3 px-4">
                  <a href="tel:+622112345678" className="flex items-center gap-3 text-sm text-slate-300">
                    <Phone size={16} className="text-cyan-400" />
                    +62 21 1234 5678
                  </a>
                  <a href="mailto:info@sanata.co.id" className="flex items-center gap-3 text-sm text-slate-300">
                    <MessageSquare size={16} className="text-cyan-400" />
                    info@sanata.co.id
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
