import Link from "next/link";
import { Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSiteContent, setting } from "@/lib/siteContent";

const linkGroups = [
  {
    title: "Navigation",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/services", label: "SANATA Services" },
      { href: "/projects", label: "Featured Projects" },
    ],
  },
  {
    title: "Knowledge",
    links: [
      { href: "/journal", label: "Latest News" },
      { href: "/clients", label: "Client Sectors" },
      { href: "/faq", label: "Support" },
    ],
  },
  {
    title: "Policy",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export async function Footer() {
  const content = await getSiteContent();
  const companyName = setting(content, "site.company_name", "Sanata Construction");
  const email = setting(content, "contact.email", "contact@sanata.com");
  const phone = setting(content, "contact.phone", "+62 21 1234 5678");
  const website = setting(content, "contact.website", "www.sanata-construction.com");
  const address = setting(content, "contact.address", "Gedung Plaza Tower, Tangerang Selatan");

  return (
    <footer id="contact-footer" className="relative overflow-hidden border-t border-white/10 bg-[#040c16] text-white">
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
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
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

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Email", value: email, icon: Mail },
                { label: "Phone", value: phone, icon: Phone },
                { label: "Website", value: website, icon: Sparkles },
                { label: "Location", value: address, icon: MapPin },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-slate-950/65 p-4">
                  <item.icon size={16} className="text-cyan-300" />
                  <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {linkGroups.map((group) => (
              <div key={group.title} className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{group.title}</p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm uppercase tracking-[0.14em] text-slate-300 transition hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.18em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <p>Advanced blueprint interface for modern construction ecosystems.</p>
        </div>
      </Container>
    </footer>
  );
}
