import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Linkedin, Facebook } from "lucide-react";

const footerLinks = {
  perusahaan: [
    { href: "/#about", label: "Tentang Kami" },
    { href: "/#services", label: "Layanan" },
    { href: "/projects", label: "Proyek" },
    { href: "/journal", label: "Wawasan" },
  ],
  layanan: [
    { href: "/#services", label: "Perencanaan & Survei" },
    { href: "/#services", label: "Konstruksi Struktural" },
    { href: "/#services", label: "Supervisi & QC" },
    { href: "/#services", label: "Desain Interior" },
  ],
  kontak: [
    { href: "tel:+62", label: "(021) 1234-5678", icon: Phone },
    { href: "mailto:info@sanata.co.id", label: "info@sanata.co.id", icon: Mail },
    { href: "#", label: "Jl. Sudirman No. 123, Jakarta", icon: MapPin },
  ],
};

const socialLinks = [
  { href: "#", label: "Instagram", icon: Instagram },
  { href: "#", label: "LinkedIn", icon: Linkedin },
  { href: "#", label: "Facebook", icon: Facebook },
];

export function SanataFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#20282C] text-white/70">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group mb-6">
              <svg
                width="40"
                height="40"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="18" cy="18" r="9" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
                <circle cx="11" cy="13" r="6" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
                <circle cx="25" cy="13" r="6" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
                <circle cx="18" cy="26" r="6" stroke="#C9AD82" strokeWidth="1.5" fill="none" />
                <line x1="16" y1="14" x2="13" y2="16" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
                <line x1="20" y1="14" x2="23" y2="16" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
                <line x1="18" y1="27" x2="22" y2="19" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
                <line x1="18" y1="27" x2="14" y2="19" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
                <line x1="14" y1="13" x2="22" y2="13" stroke="#C9AD82" strokeWidth="1" opacity="0.6" />
              </svg>
              <div>
                <span className="block text-xl font-black tracking-[0.15em] text-white">SANATA</span>
                <span className="block text-[10px] tracking-[0.3em] text-[#C9AD82] uppercase">Construction</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-white/60 max-w-xs">
              Your Building Partner. Membangun dengan fondasi keahlian, ketangguhan, dan kepercayaan untuk masa depan yang lebih kuat.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/50 transition-all duration-200 hover:border-[#C9AD82] hover:text-[#C9AD82]"
                >
                  <social.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#C9AD82]">
              Perusahaan
            </h4>
            <ul className="space-y-3">
              {footerLinks.perusahaan.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-[#C9AD82]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#C9AD82]">
              Layanan
            </h4>
            <ul className="space-y-3">
              {footerLinks.layanan.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-[#C9AD82]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#C9AD82]">
              Kontak
            </h4>
            <ul className="space-y-4">
              {footerLinks.kontak.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <item.icon size={15} className="mt-0.5 flex-shrink-0 text-[#C9AD82]" />
                  <a
                    href={item.href}
                    className="text-sm text-white/60 transition-colors hover:text-[#C9AD82]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-white/40 tracking-[0.08em]">
              © {year} Sanata Construction. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-xs text-white/40 transition-colors hover:text-white/60">
                Privacy Policy
              </Link>
              <Link href="#" className="text-xs text-white/40 transition-colors hover:text-white/60">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
