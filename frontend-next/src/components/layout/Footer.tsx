import Link from "next/link";
import { Mail, MapPin, Phone, Globe } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
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
    /* SANATA Brand: Desert Charcoal footer */
    <footer id="contact-footer" className="relative overflow-hidden border-t border-white/10 bg-[#12181B] text-white">
      {/* SANATA Brand: Desert radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(201,173,130,0.1),_transparent_28%),radial-gradient(circle_at_78%_22%,_rgba(201,173,130,0.08),_transparent_24%),linear-gradient(180deg,rgba(18,24,27,0.95),rgba(12,16,18,1))]" />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,173,130,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(201,173,130,0.15) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
            {/* Logo */}
            <Logo />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Email", value: email, icon: Mail },
                { label: "Phone", value: phone, icon: Phone },
                { label: "Website", value: website, icon: Globe },
                { label: "Location", value: address, icon: MapPin },
              ].map((item) => (
                /* SANATA Brand: Desert Charcoal card */
                <div key={item.label} className="rounded-[1.4rem] border border-white/10 bg-[#0C1012]/65 p-4">
                  {/* SANATA Brand: Desert icon */}
                  <item.icon size={16} className="text-desert-400" />
                  <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-charcoal-400">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-charcoal-200">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {linkGroups.map((group) => (
              <div key={group.title} className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                {/* SANATA Brand: Desert title */}
                <p className="text-xs uppercase tracking-[0.24em] text-desert-400">{group.title}</p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm uppercase tracking-[0.14em] text-charcoal-200 transition hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* SANATA Brand: Professional footer */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.18em] text-charcoal-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <p>Professional construction partner for your building needs.</p>
        </div>
      </Container>
    </footer>
  );
}
