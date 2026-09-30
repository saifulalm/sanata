"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { href: "/#about", label: "Tentang" },
  { href: "/#services", label: "Layanan" },
  { href: "/projects", label: "Proyek" },
  { href: "/#insights", label: "Wawasan" },
  { href: "/#contact", label: "Kontak" },
];

export function SanataHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#20282C]/95 backdrop-blur-md shadow-[0_1px_0_rgba(201,173,130,0.15)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <SanataLogo />
              <div>
                <span className="block text-lg font-black tracking-[0.15em] text-white font-avenir">
                  SANATA
                </span>
                <span className="block text-[10px] tracking-[0.3em] text-[#C9AD82] uppercase">
                  Construction
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold tracking-[0.12em] uppercase text-white/80 transition-colors duration-200 hover:text-[#C9AD82] relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#C9AD82] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-4">
              <Link
                href="https://wa.me/"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#C9AD82] px-5 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-[#20282C] transition-all duration-200 hover:bg-[#d4bc96] hover:shadow-lg hover:shadow-[#C9AD82]/20"
              >
                <Phone size={12} />
                Hubungi Kami
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden rounded-lg p-2 text-white/80 transition-colors hover:text-white"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#20282C]/98 backdrop-blur-xl lg:hidden transition-all duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8 pt-20">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-2xl font-bold tracking-[0.15em] uppercase text-white/80 transition-colors hover:text-[#C9AD82]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="https://wa.me/"
            onClick={() => setMobileOpen(false)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#C9AD82] px-6 py-3 text-sm font-bold tracking-[0.15em] uppercase text-[#20282C]"
          >
            <Phone size={14} />
            Hubungi Kami
          </Link>
        </div>
      </div>
    </>
  );
}

function SanataLogo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Interconnected circles motif — unity/harmony/continuity */}
      <circle cx="18" cy="18" r="9" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
      <circle cx="11" cy="13" r="6" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
      <circle cx="25" cy="13" r="6" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="26" r="6" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
      {/* Connecting lines */}
      <line x1="16" y1="14" x2="13" y2="16" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="14" x2="23" y2="16" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
      <line x1="18" y1="27" x2="22" y2="19" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
      <line x1="18" y1="27" x2="14" y2="19" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
      <line x1="14" y1="13" x2="22" y2="13" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
