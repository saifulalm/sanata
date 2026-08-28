import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { collection, getSiteContent, setting } from "@/lib/siteContent";
import { faqJsonLd, FaqItem } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Pertanyaan yang sering diajukan seputar layanan Sanata Construction.",
};

const DEFAULT_FAQS: FaqItem[] = [
  { question: "Wilayah mana saja yang dilayani Sanata Construction?", answer: "Kami melayani proyek di seluruh Jabodetabek, dengan kemungkinan ekspansi ke kota lain untuk proyek skala besar." },
  { question: "Berapa lama proses konsultasi awal?", answer: "Konsultasi awal dan survei lokasi biasanya memakan waktu 1–3 hari kerja setelah permintaan diterima." },
  { question: "Apakah tersedia layanan desain tanpa konstruksi?", answer: "Ya, kami menerima proyek desain arsitektur dan interior secara terpisah dari jasa konstruksi." },
  { question: "Bagaimana sistem pembayaran proyek?", answer: "Pembayaran dilakukan bertahap sesuai progres pekerjaan yang disepakati dalam kontrak, umumnya dibagi 3–5 termin." },
  { question: "Apakah ada garansi setelah proyek selesai?", answer: "Semua proyek kami sertakan garansi struktur dan pengerjaan sesuai kesepakatan kontrak, umumnya 1–3 tahun." },
  { question: "Bagaimana jika terjadi perubahan desain di tengah proyek?", answer: "Perubahan (change order) dapat diajukan dan akan dievaluasi dampaknya terhadap biaya dan jadwal sebelum disetujui bersama." },
];

export default async function FaqPage() {
  const content = await getSiteContent();
  const items = collection(content, "faq");
  const faqs: FaqItem[] = items.length > 0 ? items.map((i) => ({ question: i.title ?? "", answer: i.body ?? "" })) : DEFAULT_FAQS;

  return (
    <>
      {/* FAQ Schema untuk Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
      <PageHero
        eyebrow={setting(content, "faq.hero.eyebrow", "FAQ")}
        title={setting(content, "faq.hero.title", "Pertanyaan yang Sering Diajukan")}
        description={setting(
          content,
          "faq.hero.description",
          "Belum menemukan jawaban? Hubungi tim kami langsung melalui halaman kontak."
        )}
      />

      <section className="py-20">
        <Container className="max-w-3xl">
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <RevealOnScroll key={`${f.question}-${i}`} delay={i * 0.05}>
                <details className="group rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition open:border-cyan-300/35">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-white">
                    {f.question}
                    <ChevronDown size={18} className="shrink-0 text-cyan-300 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{f.answer}</p>
                </details>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
