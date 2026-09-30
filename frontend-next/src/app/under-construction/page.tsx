import { Mail, MapPin, Phone, Instagram, Facebook, Youtube, ArrowRight } from "lucide-react";
import { getSiteContent, setting } from "@/lib/siteContent";

/**
 * Halaman Under Construction
 *
 * Theme: Sanata Brand (Charcoal + Desert)
 * - Primary: #20282C (Charcoal)
 * - Accent:  #C9AD82 (Desert)
 * - Typography: Avenir via globals.css
 *
 * Route utama sementara (/ ) menampilkan halaman ini.
 * Semua route public lain tetap accessible (EnhancedHeader+Footer).
 *
 * Catatan: Data kontak diambil dari SiteContent CMS (setting "contact.*").
 * Fallback default jika CMS belum diset.
 */
export default async function UnderConstructionPage() {
  const content = await getSiteContent();
  const phone = setting(content, "contact.phone", "+62 8578 888 2662");
  const email = setting(content, "contact.email", "Rumamesra@santarasbc.com");
  const address = setting(content, "contact.address", "Jalan Puring, Ciputat Timur, Tangerang Selatan");
  const whatsappRaw = setting(content, "contact.whatsapp", "6285788882662");
  const whatsapp = whatsappRaw.replace(/\D/g, "");
  return (
    <div className="relative min-h-screen overflow-hidden bg-charcoal-600">
      {/* ── Background layers ─────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle grid pattern — construction blueprint feel */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,173,130,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,173,130,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow top */}
        <div
          className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,173,130,0.12) 0%, rgba(201,173,130,0.04) 40%, transparent 70%)",
          }}
        />
        {/* Radial glow bottom-left */}
        <div
          className="absolute bottom-0 left-0 h-[400px] w-[600px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, rgba(201,173,130,0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ── Animated construction elements ─────────────────────────── */}
      <div className="pointer-events-none absolute right-0 top-20 opacity-10 md:opacity-15">
        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-float-slow"
        >
          {/* Crane silhouette */}
          <rect x="240" y="40" width="20" height="380" fill="#C9AD82" />
          <rect x="40" y="40" width="420" height="16" fill="#C9AD82" />
          <rect x="80" y="40" width="8" height="60" fill="#C9AD82" />
          <rect x="80" y="88" width="120" height="6" fill="#C9AD82" />
          <rect x="80" y="88" width="6" height="40" fill="#C9AD82" />
          {/* Cable */}
          <line x1="196" y1="94" x2="196" y2="180" stroke="#C9AD82" strokeWidth="2" />
          {/* Hook */}
          <path d="M188 180 L204 180 L198 200 Z" fill="#C9AD82" />
          {/* Counterweight */}
          <rect x="430" y="24" width="24" height="48" rx="2" fill="#C9AD82" />
          {/* Base */}
          <rect x="200" y="400" width="100" height="20" rx="2" fill="#C9AD82" />
          <rect x="180" y="420" width="140" height="16" rx="2" fill="#C9AD82" />
          {/* Building under construction */}
          <rect x="120" y="280" width="80" height="120" fill="#C9AD82" />
          <rect x="130" y="300" width="20" height="30" fill="#20282C" />
          <rect x="160" y="300" width="20" height="30" fill="#20282C" />
          <rect x="130" y="340" width="20" height="30" fill="#20282C" />
          <rect x="160" y="340" width="20" height="30" fill="#20282C" />
          <rect x="130" y="380" width="20" height="20" fill="#20282C" />
          <rect x="160" y="380" width="20" height="20" fill="#20282C" />
        </svg>
      </div>

      {/* ── Small floating particles ───────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-32 left-8 opacity-20">
        <div className="grid grid-cols-3 gap-4">
          {["#C9AD82", "#9AA9AD", "#C9AD82", "#6C848A", "#C9AD82", "#3E5F67"].map((color, i) => (
            <div
              key={i}
              className="h-1 w-1 rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Brand name — plain text, NOT a logo (per brand guidelines) */}
        <p className="mb-8 font-display text-2xl font-black uppercase tracking-[0.2em] text-desert-400">
          Sanata
        </p>

        {/* Status badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-desert-400/10 px-4 py-1.5 ring-1 ring-desert-400/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-desert-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-desert-400" />
          </span>
          <span className="font-accent text-xs font-semibold uppercase tracking-[0.15em] text-desert-400">
            Sedang dalam pengembangan
          </span>
        </div>

        {/* Main headline */}
        <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
          Situs Kami{" "}
          <span className="relative inline-block">
            <span className="text-desert-400">Sedang</span>
          </span>{" "}
          <br className="hidden sm:block" />
          Dibangun
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-charcoal-200 md:text-xl">
          Kami sedang mempersiapkan sesuatu yang luar biasa untuk Anda.
          Website baru kami akan hadir dengan tampilan dan fitur terbaik.
        </p>

        {/* Divider */}
        <div className="mt-10 flex items-center gap-3">
          <div className="h-px w-12 bg-desert-400/30" />
          <div className="h-1.5 w-1.5 rotate-45 bg-desert-400/50" />
          <div className="h-px w-12 bg-desert-400/30" />
        </div>

        {/* Contact info — data from SiteContent CMS */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] px-6 py-4 ring-1 ring-white/5">
            <MapPin className="h-4 w-4 text-desert-400" />
            <span className="font-body text-sm text-charcoal-200">{address}</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] px-6 py-4 ring-1 ring-white/5">
            <Phone className="h-4 w-4 text-desert-400" />
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="font-body text-sm text-charcoal-200 transition-colors hover:text-desert-400"
            >
              {phone}
            </a>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] px-6 py-4 ring-1 ring-white/5">
            <Mail className="h-4 w-4 text-desert-400" />
            <a
              href={`mailto:${email}`}
              className="font-body text-sm text-charcoal-200 transition-colors hover:text-desert-400"
            >
              {email}
            </a>
          </div>
        </div>

        {/* Social links */}
        <div className="mt-8 flex items-center gap-4">
          <a
            href="https://instagram.com/sanata.construction"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/5 transition-all duration-200 hover:bg-desert-400/10 hover:ring-desert-400/30 hover:text-desert-400"
            aria-label="Instagram"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://facebook.com/sanata.construction"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/5 transition-all duration-200 hover:bg-desert-400/10 hover:ring-desert-400/30 hover:text-desert-400"
            aria-label="Facebook"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href="https://youtube.com/@sanataconstruction"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/5 transition-all duration-200 hover:bg-desert-400/10 hover:ring-desert-400/30 hover:text-desert-400"
            aria-label="YouTube"
          >
            <Youtube className="h-4 w-4" />
          </a>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-desert-400 px-6 py-3 font-body text-sm font-semibold text-charcoal-600 transition-all duration-200 hover:bg-desert-300 hover:shadow-desert-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat WhatsApp
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-6 py-3 font-body text-sm font-semibold text-white ring-1 ring-white/10 transition-all duration-200 hover:bg-white/[0.07] hover:ring-white/20"
          >
            Hubungi Kami
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Tagline */}
        <p className="mt-16 font-accent text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-400">
          Your Building Partner
        </p>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/5 bg-charcoal-700/50 backdrop-blur-sm">
        <div className="container-brand mx-auto flex flex-col items-center justify-between gap-2 px-6 py-3 sm:flex-row">
          <p className="font-body text-xs text-charcoal-400">
            &copy; {new Date().getFullYear()} PT Sanata Construction. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-1">
            <div className="h-px w-8 bg-desert-400/30" />
            <span className="font-accent text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal-400">
              Coming Soon
            </span>
            <div className="h-px w-8 bg-desert-400/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
