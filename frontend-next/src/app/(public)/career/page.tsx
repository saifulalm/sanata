import type { Metadata } from "next";
import { Briefcase, MapPin, Clock, HeartHandshake, TrendingUp, Users } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Button } from "@/components/ui/Button";
import { GlassPanel, IconTile } from "@/components/ui/Surface";
import { collection, getSiteContent, resolveIcon, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Karir",
  description: "Bergabung bersama tim Sanata Construction — lowongan dan budaya kerja kami.",
};

const DEFAULT_BENEFITS = [
  { icon: HeartHandshake, title: "Asuransi Kesehatan", desc: "Perlindungan kesehatan untuk karyawan dan keluarga." },
  { icon: TrendingUp, title: "Jenjang Karir Jelas", desc: "Program pengembangan dan promosi berbasis kinerja." },
  { icon: Users, title: "Budaya Kolaboratif", desc: "Lingkungan kerja yang suportif dan berorientasi tim." },
];

const DEFAULT_POSITIONS = [
  { title: "Site Engineer", location: "Jakarta Selatan", type: "Full-time" },
  { title: "Project Manager", location: "Jakarta", type: "Full-time" },
  { title: "Estimator / Quantity Surveyor", location: "Jakarta", type: "Full-time" },
  { title: "Arsitek", location: "Jakarta", type: "Full-time" },
  { title: "Admin Proyek", location: "Jakarta Selatan", type: "Kontrak" },
];

export default async function CareerPage() {
  const content = await getSiteContent();

  const benefitItems = collection(content, "career_benefits");
  const benefits =
    benefitItems.length > 0
      ? benefitItems.map((i) => ({ icon: resolveIcon(i.icon, HeartHandshake), title: i.title ?? "", desc: i.body ?? "" }))
      : DEFAULT_BENEFITS;

  const positionItems = collection(content, "career_positions");
  const positions =
    positionItems.length > 0
      ? positionItems.map((i) => ({ title: i.title ?? "", type: i.subtitle ?? "", location: i.body ?? "" }))
      : DEFAULT_POSITIONS;

  // Tujuan lamaran sebelumnya dipaku ke alamat yang tidak ada di CMS, jadi
  // e-mail perusahaan yang dikelola admin dipakai sebagai sumber kebenaran.
  const applyEmail = setting(content, "contact.email", "halo@sanata.id");

  return (
    <>
      <PageHero
        eyebrow={setting(content, "career.hero.eyebrow", "Karir")}
        title={setting(content, "career.hero.title", "Bangun Karir Bersama Sanata")}
        description={setting(
          content,
          "career.hero.description",
          "Kami mencari talenta terbaik untuk bertumbuh bersama dalam industri konstruksi."
        )}
      />

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Kenapa Bergabung" title="Budaya Kerja Kami" align="center" className="mx-auto" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((b, i) => (
              <RevealOnScroll key={`${b.title}-${i}`} delay={i * 0.08}>
                <GlassPanel className="h-full p-7 text-center">
                  <IconTile className="mx-auto border-amber-300/25 bg-amber-300/10 text-amber-200">
                    <b.icon size={22} />
                  </IconTile>
                  <p className="mt-5 font-display text-lg font-semibold text-white">{b.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{b.desc}</p>
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-slate-950/60 py-20">
        <Container>
          <SectionHeading eyebrow="Lowongan" title="Posisi yang Tersedia" />
          <div className="mt-10 space-y-4">
            {positions.map((p, i) => (
              <RevealOnScroll key={`${p.title}-${i}`} delay={i * 0.05}>
                <GlassPanel className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold text-white">{p.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} /> {p.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> {p.type}
                      </span>
                    </div>
                  </div>
                  <Button href={`mailto:${applyEmail}?subject=${encodeURIComponent(`Lamaran — ${p.title}`)}`} variant="outline">
                    <Briefcase size={15} /> Lamar Sekarang
                  </Button>
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
