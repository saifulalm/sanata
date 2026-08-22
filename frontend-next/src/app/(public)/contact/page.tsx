import type { Metadata } from "next";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ContactForm } from "@/components/contact/ContactForm";
import { GlassPanel, IconTile } from "@/components/ui/Surface";
import { collection, getSiteContent, resolveIcon, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi Sanata Construction untuk konsultasi dan permintaan penawaran proyek konstruksi Anda.",
};

const DEFAULT_INFO = [
  { icon: MapPin, label: "Kantor Pusat", value: "Jl. Sudirman No. 88, Jakarta Selatan" },
  { icon: Phone, label: "Telepon", value: "+62 21 555 0192" },
  { icon: Mail, label: "Email", value: "hello@sanata.id" },
];

export default async function ContactPage() {
  const content = await getSiteContent();
  const items = collection(content, "contact_info");
  const info =
    items.length > 0
      ? items.map((i) => ({ icon: resolveIcon(i.icon, MapPin), label: i.title ?? "", value: i.body ?? "" }))
      : DEFAULT_INFO;
  const whatsappNumber = setting(content, "contact.whatsapp", "622112345678");
  const mapEmbedUrl = setting(
    content,
    "contact.map_embed_url",
    "https://maps.google.com/maps?q=Jakarta%20Selatan&t=&z=13&ie=UTF8&iwloc=&output=embed"
  );

  return (
    <>
      <PageHero
        eyebrow={setting(content, "contact.hero.eyebrow", "Hubungi Kami")}
        title={setting(content, "contact.hero.title", "Mari Diskusikan Proyek Anda")}
        description={setting(
          content,
          "contact.hero.description",
          "Isi formulir di bawah untuk permintaan penawaran, atau hubungi kami langsung melalui telepon maupun WhatsApp."
        )}
      />

      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <RevealOnScroll className="space-y-8">
            <GlassPanel className="space-y-5 p-7">
              {info.map((i, idx) => (
                <div key={`${i.label}-${idx}`} className="flex items-start gap-4">
                  <IconTile className="h-11 w-11 shrink-0">
                    <i.icon size={18} />
                  </IconTile>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{i.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{i.value}</p>
                  </div>
                </div>
              ))}
            </GlassPanel>

            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100 backdrop-blur-xl transition hover:bg-emerald-400/25"
            >
              <MessageCircle size={18} /> Chat via WhatsApp
            </a>

            <div className="overflow-hidden rounded-[1.6rem] border border-white/10">
              <iframe
                title="Lokasi Kantor Sanata Construction"
                src={mapEmbedUrl}
                className="h-64 w-full opacity-85 grayscale"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <ContactForm />
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}
