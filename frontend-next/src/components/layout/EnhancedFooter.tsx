import Link from "next/link";
import { Mail, MapPin, Phone, Sparkles, Instagram, Facebook, Linkedin, Twitter, Youtube, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSiteContent, setting } from "@/lib/siteContent";

const linkGroups = [
  {
    title: "Navigasi",
    links: [
      { href: "/about", label: "Tentang Kami" },
      { href: "/services", label: "Layanan SANATA" },
      { href: "/projects", label: "Proyek Unggulan" },
      { href: "/career", label: "Karir" },
    ],
  },
  {
    title: "Pengetahuan",
    links: [
      { href: "/journal", label: "Berita Terbaru" },
      { href: "/clients", label: "Sektor Klien" },
      { href: "/faq", label: "Pertanyaan Umum" },
      { href: "/gallery", label: "Galeri" },
    ],
  },
  {
    title: "Kebijakan",
    links: [
      { href: "/contact", label: "Hubungi Kami" },
      { href: "/privacy", label: "Privasi" },
      { href: "/terms", label: "Syarat & Ketentuan" },
      { href: "/sitemap", label: "Peta Situs" },
    ],
  },
];

const socialLinks = [
  { href: "https://instagram.com/sanata.construction", icon: Instagram, label: "Instagram" },
  { href: "https://facebook.com/sanata.construction", icon: Facebook, label: "Facebook" },
  { href: "https://linkedin.com/company/sanata", icon: Linkedin, label: "LinkedIn" },
  { href: "https://twitter.com/sanata_build", icon: Twitter, label: "Twitter" },
  { href: "https://youtube.com/@sanataconstruction", icon: Youtube, label: "YouTube" },
];

export async function EnhancedFooter() {
  const content = await getSiteContent();
  const companyName = setting(content, "site.company_name", "Sanata Construction");
  const email = setting(content, "contact.email", "Rumamesra@santarasbc.com");
  const phone = setting(content, "contact.phone", "+62 8578 888 2662");
  const whatsapp = setting(content, "contact.whatsapp", "6285788882662");
  const website = setting(content, "contact.website", "www.sanata.id");
  const address = setting(content, "contact.address", "Jalan Puring, Ciputat Timur, Tangerang Selatan");

  return (
    <footer id="contact-footer" className="relative overflow-hidden border-t border-white/10 bg-[#040c16] text-white">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_78%_22%,_rgba(217,119,6,0.14),_transparent_24%),linear-gradient(180deg,_rgba(8,18,33,0.92),_rgba(4,12,22,1))]" />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.24) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <Container className="relative py-16 sm:py-20">
        {/* Main grid */}
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Company info */}
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_30px_rgba(56,189,248,0.18)]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white">{companyName}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">Futuristic Construction Interface</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Email", value: email, icon: Mail, href: `mailto:${email}` },
                { label: "Telepon", value: phone, icon: Phone, href: `tel:${phone.replace(/\s/g, "")}` },
                { label: "Website", value: website, icon: Sparkles, href: `https://${website}` },
                { label: "Lokasi", value: address, icon: MapPin },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href?.startsWith("http") ? "_blank" : undefined}
                  rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group rounded-[1.4rem] border border-white/10 bg-slate-950/65 p-4 transition hover:border-cyan-300/30"
                >
                  <item.icon size={16} className="text-cyan-300" />
                  <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/85 group-hover:text-cyan-200">
                    {item.value}
                    {item.href && (
                      <ArrowUpRight size={12} className="ml-1 inline-block opacity-0 transition group-hover:opacity-100" />
                    )}
                  </p>
                </a>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-6">
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat WhatsApp Sekarang
              </a>
            </div>

            {/* Social links */}
            <div className="mt-6">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">Ikuti Kami</p>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-300"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {linkGroups.map((group) => (
              <div key={group.title} className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{group.title}</p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.18em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>© {new Date().getFullYear()} {companyName}. Hak cipta dilindungi.</p>
            <p className="mt-1 text-[10px]">Antarmuka blueprint lanjutan untuk ekosistem konstruksi modern.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-cyan-300">
              Privasi
            </Link>
            <Link href="/terms" className="transition hover:text-cyan-300">
              Syarat
            </Link>
            <Link href="/sitemap" className="transition hover:text-cyan-300">
              Peta Situs
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

// Also export EnhancedFooter as Footer for compatibility
export { EnhancedFooter as Footer };
