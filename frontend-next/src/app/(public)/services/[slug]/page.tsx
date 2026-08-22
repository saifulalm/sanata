import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2, CheckCircle2, Clock } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Eyebrow, GlassPanel } from "@/components/ui/Surface";
import { getProductBySlug } from "@/lib/api";
import { getSeoConfig } from "@/lib/seo";
import { collection, getSiteContent, resolveIcon, setting } from "@/lib/siteContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [service, seo] = await Promise.all([getProductBySlug(slug), getSeoConfig()]);
    const url = `${seo.siteUrl}/services/${slug}`;
    const image = service.images?.[0]?.url ?? seo.ogImage ?? undefined;

    return {
      title: service.name,
      description: service.description,
      alternates: { canonical: url },
      openGraph: {
        title: service.name,
        description: service.description,
        url,
        type: "website",
        ...(image ? { images: [{ url: image.startsWith("http") ? image : `${seo.siteUrl}${image}` }] } : {}),
      },
    };
  } catch {
    return { title: "Layanan" };
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, content] = await Promise.all([getProductBySlug(slug).catch(() => null), getSiteContent()]);
  if (!service) notFound();

  const advantageItems = collection(content, "service_detail_advantages");
  const advantages =
    advantageItems.length > 0
      ? advantageItems.map((item) => ({
          icon: resolveIcon(item.icon, CheckCircle2),
          title: item.title ?? "",
          body: item.body ?? "",
        }))
      : [
          { icon: CheckCircle2, title: "Tim Ahli Berpengalaman", body: "Tim insinyur dan tukang berpengalaman." },
          { icon: CheckCircle2, title: "Material Berkualitas", body: "Material berkualitas dengan garansi." },
          { icon: CheckCircle2, title: "Pengawasan Mutu", body: "Pengawasan mutu di setiap tahap." },
          { icon: CheckCircle2, title: "Laporan Transparan", body: "Laporan progres berkala dan transparan." },
        ];

  const timelineItems = collection(content, "service_detail_timeline");
  const timelineSteps =
    timelineItems.length > 0
      ? timelineItems.map((item) => ({
          label: item.title ?? "",
          duration: item.subtitle ?? "",
          body: item.body ?? "",
        }))
      : [
          { label: "Konsultasi & Survei Lokasi", duration: "1–3 hari", body: "" },
          { label: "Desain & Penyusunan RAB", duration: "3–7 hari", body: "" },
          { label: "Pengerjaan Konstruksi", duration: "Sesuai skala proyek", body: "" },
          { label: "Quality Check & Serah Terima", duration: "1–2 hari", body: "" },
        ];

  const faqItems = collection(content, "service_detail_faq");
  const faqs =
    faqItems.length > 0
      ? faqItems.map((item) => ({ q: item.title ?? "", a: item.body ?? "" }))
      : [
          {
            q: "Apakah harga sudah termasuk material?",
            a: "Estimasi harga yang ditampilkan adalah harga dasar jasa; rincian material dan RAB final diberikan setelah survei lokasi.",
          },
          {
            q: "Berapa lama garansi pengerjaan?",
            a: "Kami memberikan garansi struktur dan pengerjaan sesuai kesepakatan kontrak, umumnya 1–3 tahun tergantung jenis layanan.",
          },
          {
            q: "Apakah bisa custom sesuai kebutuhan?",
            a: "Tentu — setiap proyek dimulai dengan konsultasi untuk menyesuaikan lingkup kerja dengan kebutuhan Anda.",
          },
        ];

  return (
    <>
      <PageHero
        eyebrow={service.category?.name ?? "Layanan"}
        title={service.name}
        description={`Estimasi mulai Rp ${Number(service.price).toLocaleString("id-ID")}`}
      />

      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <RevealOnScroll className="relative flex h-72 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/70 text-cyan-300/60 md:h-96">
              {service.images[0] ? (
                <Image
                  src={service.images[0].url}
                  alt={service.name}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover opacity-85"
                />
              ) : (
                <Building2 size={48} />
              )}
            </RevealOnScroll>

            <RevealOnScroll delay={0.1} className="mt-10">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-white">Deskripsi Layanan</h2>
              <p className="mt-4 leading-8 text-slate-300">{service.description}</p>
            </RevealOnScroll>

            <RevealOnScroll delay={0.15} className="mt-10">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-white">Keunggulan</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {advantages.map((a) => (
                  <li key={a.title} className="flex items-start gap-2.5 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 text-sm">
                    <a.icon size={18} className="mt-0.5 shrink-0 text-cyan-300" />
                    <span>
                      <span className="font-medium text-white">{a.title}</span>
                      {a.body ? <span className="mt-0.5 block leading-6 text-slate-400">{a.body}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2} className="mt-10">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-white">Estimasi Timeline</h2>
              <div className="mt-4 space-y-3">
                {timelineSteps.map((t, i) => (
                  <div
                    key={t.label}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-xs font-bold text-cyan-200">
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-white">{t.label}</span>
                        {t.body ? <p className="mt-0.5 text-xs leading-5 text-slate-400">{t.body}</p> : null}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-slate-400">
                      <Clock size={13} /> {t.duration}
                    </span>
                  </div>
                ))}
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.25} className="mt-10">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-white">Pertanyaan Umum</h2>
              <div className="mt-4 space-y-4">
                {faqs.map((f) => (
                  <div key={f.q} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-semibold text-white">{f.q}</p>
                    <p className="mt-1.5 text-sm leading-7 text-slate-400">{f.a}</p>
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={0.1} className="h-fit">
            <GlassPanel className="p-7">
              <Eyebrow>Estimasi Biaya</Eyebrow>
              <p className="mt-2 font-display text-3xl font-bold tracking-[0.04em] text-white">
                Rp {Number(service.price).toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {setting(content, "service.detail.price_note", "Harga dapat berubah sesuai hasil survei lokasi")}
              </p>
              <Button href="/contact" className="mt-6 w-full justify-center">
                Minta Penawaran
              </Button>
            </GlassPanel>
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}
