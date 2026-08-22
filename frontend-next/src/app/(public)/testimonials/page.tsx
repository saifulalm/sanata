import type { Metadata } from "next";
import { Star, Quote } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GlassPanel } from "@/components/ui/Surface";
import { collection, getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Testimoni",
  description: "Apa kata klien tentang pengalaman bekerja sama dengan Sanata Construction.",
};

const DEFAULT_TESTIMONIALS = [
  { quote: "Sanata mengerjakan renovasi rumah kami tepat waktu dan hasilnya jauh melebihi ekspektasi.", name: "Budi Santoso", role: "Pemilik Rumah, Jakarta Selatan" },
  { quote: "Proyek ruko komersial kami ditangani dengan sangat rapi, tidak ada biaya tersembunyi.", name: "Sinta Wijaya", role: "Direktur Operasional, Retail Group" },
  { quote: "Tim engineering sangat kompeten menangani struktur bangunan kompleks.", name: "Ahmad Rahman", role: "Pengembang Properti" },
  { quote: "Komunikasi selalu jelas di setiap tahap, laporan progres rutin tiap minggu.", name: "Maria Christin", role: "Pemilik Ruko, Bekasi" },
  { quote: "Desain interior kantor kami selesai lebih cepat dari estimasi awal.", name: "Hendra Wijaya", role: "Manajer Operasional" },
  { quote: "Kualitas material dan pengerjaan sangat rapi, sesuai standar yang dijanjikan.", name: "Rina Kusuma", role: "Pemilik Rumah, Tangerang" },
];

export default async function TestimonialsPage() {
  const content = await getSiteContent();
  const items = collection(content, "testimonials");
  const testimonials =
    items.length > 0
      ? items.map((i) => ({ quote: i.body ?? "", name: i.title ?? "", role: i.subtitle ?? "" }))
      : DEFAULT_TESTIMONIALS;

  return (
    <>
      <PageHero
        eyebrow={setting(content, "testimonials.hero.eyebrow", "Testimoni")}
        title={setting(content, "testimonials.hero.title", "Apa Kata Klien Kami")}
        description={setting(
          content,
          "testimonials.hero.description",
          "Kepuasan klien adalah prioritas utama dalam setiap proyek yang kami kerjakan."
        )}
      />

      <section className="py-20">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={`${t.name}-${i}`} delay={(i % 3) * 0.08}>
                <GlassPanel className="flex h-full flex-col p-7">
                  <Quote className="text-cyan-300" size={26} />
                  <div className="mt-4 flex gap-0.5 text-amber-300">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={13} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-7 text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="font-display text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t.role}</p>
                  </div>
                </GlassPanel>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
