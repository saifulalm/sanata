import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck, HardHat, Sparkles, Target, Eye, Award } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GlassPanel, IconTile } from "@/components/ui/Surface";
import { collection, getSiteContent, resolveIcon, setting } from "@/lib/siteContent";
import { mediaSrc } from "@/lib/media";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Profil, visi misi, sejarah, dan nilai-nilai inti Sanata Construction.",
};

const DEFAULT_VALUES = [
  { icon: ShieldCheck, title: "Transparansi", desc: "Quotation detail, breakdown lingkup & material yang jelas. Tidak ada proses tersembunyi." },
  { icon: Sparkles, title: "Pendidikan Klien", desc: "Panduan klien langkah demi langkah agar mereka memahami keputusan teknis dan alasan di baliknya." },
  { icon: HardHat, title: "Kualitas Berbasis Engineering", desc: "Implementasi SOP ketat berdasarkan standar SNI / ASTM dengan fokus pada durabilitas jangka panjang." },
  { icon: Target, title: "Fleksibel", desc: "Partial work (struktur saja, interior saja) hingga full project (0-100%). Kolaborasi adaptif sesuai kebutuhan." },
];

const DEFAULT_TIMELINE = [
  { year: "2010", title: "Pendirian Sanata", desc: "Memulai sebagai studio konstruksi kecil di Jakarta." },
  { year: "2014", title: "Ekspansi Komersial", desc: "Mulai menangani proyek ruko dan gedung komersial." },
  { year: "2019", title: "Sertifikasi ISO 9001", desc: "Meraih sertifikasi manajemen mutu internasional." },
  { year: "2024", title: "120+ Proyek Selesai", desc: "Melayani klien residensial dan komersial di seluruh Jabodetabek." },
];

const DEFAULT_LEADERSHIP = [
  { name: "Rangga Arya Madini Djasa", role: "Founder and Director" },
  { name: "Ir. Marudut Sagala S.T.", role: "Project Manager" },
  { name: "Radiansyah Hamdan", role: "Site / QC Engineer" },
  { name: "Mesya Putri Zararosa S.E.", role: "Business Development" },
  { name: "Sabiq Alfarisy", role: "Visual Artist / Sculptor" },
  { name: "Nanda Rachmawan S.T.", role: "Architect" },
  { name: "Desi Sri Sukmawati S.E.", role: "Accounting & Finance" },
  { name: "Hadi Fathu Masykuri S.E.", role: "Document Control & Technical Admin" },
];

const DEFAULT_AWARDS = ["ISO 9001:2015", "Sertifikasi K3 Konstruksi", "SBU Jasa Konstruksi", "LPJK Terdaftar", "Anugerah Kontraktor Terbaik 2023"];

export default async function AboutPage() {
  const content = await getSiteContent();

  const valueItems = collection(content, "about_values");
  const values =
    valueItems.length > 0
      ? valueItems.map((i) => ({ icon: resolveIcon(i.icon, ShieldCheck), title: i.title ?? "", desc: i.body ?? "" }))
      : DEFAULT_VALUES;

  const timelineItems = collection(content, "about_timeline");
  const timeline =
    timelineItems.length > 0
      ? timelineItems.map((i) => ({ year: i.title ?? "", title: i.subtitle ?? "", desc: i.body ?? "" }))
      : DEFAULT_TIMELINE;

  const leadershipItems = collection(content, "about_leadership");
  const leadership =
    leadershipItems.length > 0
      ? leadershipItems.map((i) => ({ name: i.title ?? "", role: i.subtitle ?? "", imageUrl: i.imageUrl }))
      : DEFAULT_LEADERSHIP.map((l) => ({ ...l, imageUrl: null as string | null }));

  const awardItems = collection(content, "about_awards");
  const awards = awardItems.length > 0 ? awardItems.map((i) => i.title ?? "") : DEFAULT_AWARDS;

  return (
    <>
      <PageHero
        eyebrow={setting(content, "about.hero.eyebrow", "Tentang Kami")}
        title={setting(content, "about.hero.title", "Your Building Partner")}
        description={setting(
          content,
          "about.hero.description",
          "Sanata Construction adalah kontraktor konstruksi, renovasi, dan desain arsitektur kelas enterprise yang telah melayani klien sejak 2010."
        )}
      />

      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <RevealOnScroll>
            <SectionHeading eyebrow="Profil Perusahaan" title="Cerita di Balik Sanata" />
            <p className="mt-6 leading-8 text-slate-300">
              Sanata Construction lahir dari kebiasaan sederhana: membangun sesuatu yang benar-benar dipakai dan
              bertahan lama. Sejak 2010, kami telah menangani proyek residensial dan komersial dengan tim insinyur
              dan tukang berpengalaman, memastikan setiap proyek selesai sesuai rencana, anggaran, dan standar
              kualitas kelas enterprise.
            </p>
            <p className="mt-4 leading-8 text-slate-400">
              Kami percaya bahwa konstruksi yang baik adalah kombinasi antara presisi teknis, komunikasi yang
              transparan, dan komitmen terhadap keselamatan kerja di setiap tahap proyek.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="grid gap-6 sm:grid-cols-2">
            <GlassPanel className="p-7">
              <Target className="text-cyan-300" size={26} />
              <p className="mt-4 font-display text-lg font-semibold text-white">Misi</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Menghadirkan solusi konstruksi presisi dengan standar keselamatan dan kualitas tertinggi bagi
                setiap klien.
              </p>
            </GlassPanel>
            <GlassPanel className="p-7">
              <Eye className="text-amber-300" size={26} />
              <p className="mt-4 font-display text-lg font-semibold text-white">Visi</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Menjadi kontraktor konstruksi paling dipercaya di Indonesia untuk proyek residensial dan komersial.
              </p>
            </GlassPanel>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-slate-950/60 py-24">
        <Container>
          <SectionHeading eyebrow="Nilai Inti" title="Prinsip yang Kami Pegang" align="center" className="mx-auto" />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <RevealOnScroll key={`${v.title}-${i}`} delay={i * 0.08}>
                <GlassPanel className="h-full p-7">
                  <IconTile>
                    <v.icon size={22} />
                  </IconTile>
                  <p className="mt-5 font-display text-lg font-semibold text-white">{v.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{v.desc}</p>
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading eyebrow="Perjalanan Kami" title="Sejarah Sanata Construction" />
          <div className="relative mt-14 space-y-10 border-l border-cyan-300/25 pl-8">
            {timeline.map((t, i) => (
              <RevealOnScroll key={`${t.year}-${i}`} delay={i * 0.08} className="relative">
                <span className="absolute -left-[38px] flex h-4 w-4 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-300/25 shadow-[0_0_20px_rgba(56,189,248,0.35)]" />
                <p className="font-display text-2xl font-bold tracking-[0.06em] text-white">{t.year}</p>
                <p className="mt-1 font-semibold uppercase tracking-[0.14em] text-cyan-100">{t.title}</p>
                <p className="mt-1 text-sm leading-7 text-slate-400">{t.desc}</p>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-slate-950/60 py-24">
        <Container>
          <SectionHeading eyebrow="Kepemimpinan" title="Tim di Balik Sanata" align="center" className="mx-auto" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((l, i) => (
              <RevealOnScroll key={`${l.name}-${i}`} delay={i * 0.08}>
                <GlassPanel className="h-full p-6 text-center">
                  {l.imageUrl ? (
                    <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full border border-cyan-300/25">
                      <Image src={mediaSrc(l.imageUrl)} alt={l.name} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 font-display text-xl font-bold text-cyan-200">
                      {l.name.charAt(0)}
                    </div>
                  )}
                  <p className="mt-4 font-display font-semibold text-white">{l.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{l.role}</p>
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading eyebrow="Sertifikasi & Penghargaan" title="Diakui Standar Industri" align="center" className="mx-auto" />
          <RevealOnScroll className="mt-12 flex flex-wrap justify-center gap-4">
            {awards.map((a, i) => (
              <span
                key={`${a}-${i}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-xl"
              >
                <Award size={16} className="text-amber-300" /> {a}
              </span>
            ))}
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}
