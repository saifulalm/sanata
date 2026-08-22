import type { Metadata } from "next";
import { Building2, Home, Factory, Landmark } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GlassPanel, IconTile } from "@/components/ui/Surface";
import { collection, getSiteContent, resolveIcon, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Klien",
  description: "Sektor dan klien yang telah dipercayakan kepada Sanata Construction.",
};

const DEFAULT_SECTORS = [
  { icon: Home, title: "Residensial", desc: "Pemilik rumah dan pengembang perumahan skala kecil-menengah." },
  { icon: Building2, title: "Komersial", desc: "Ruko, kantor, dan gedung retail di area perkotaan." },
  { icon: Factory, title: "Industrial", desc: "Fasilitas gudang dan bangunan produksi ringan." },
  { icon: Landmark, title: "Institusi", desc: "Fasilitas pendidikan dan bangunan publik skala kecil." },
];

export default async function ClientsPage() {
  const content = await getSiteContent();
  const items = collection(content, "client_sectors");
  const partners = collection(content, "partners");
  const sectors =
    items.length > 0
      ? items.map((i) => ({ icon: resolveIcon(i.icon, Home), title: i.title ?? "", desc: i.body ?? "" }))
      : DEFAULT_SECTORS;

  const partnerTiles =
    partners.length > 0
      ? partners.map((p) => ({ key: p.id, label: p.title ?? "Mitra" }))
      : Array.from({ length: 12 }, (_, i) => ({
          key: `placeholder-${i}`,
          label: `Klien ${String(i + 1).padStart(2, "0")}`,
        }));

  return (
    <>
      <PageHero
        eyebrow={setting(content, "clients.hero.eyebrow", "Klien Kami")}
        title={setting(content, "clients.hero.title", "Dipercaya di Berbagai Sektor")}
        description={setting(
          content,
          "clients.hero.description",
          "Sanata Construction telah melayani klien dari berbagai latar belakang, dari pemilik rumah hingga pengembang komersial."
        )}
      />

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Sektor" title="Klien yang Kami Layani" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sectors.map((s, i) => (
              <RevealOnScroll key={`${s.title}-${i}`} delay={i * 0.08}>
                <GlassPanel className="h-full p-7">
                  <IconTile>
                    <s.icon size={22} />
                  </IconTile>
                  <p className="mt-5 font-display text-lg font-semibold text-white">{s.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{s.desc}</p>
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-slate-950/60 py-20">
        <Container>
          <SectionHeading eyebrow="Mitra" title="Dipercaya oleh Mitra Kami" align="center" className="mx-auto" />
          <RevealOnScroll delay={0.1} className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {partnerTiles.map((tile) => (
              <div
                key={tile.key}
                className="flex h-16 items-center justify-center rounded-[1rem] border border-dashed border-white/12 bg-white/[0.03] px-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400"
              >
                {tile.label}
              </div>
            ))}
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}
