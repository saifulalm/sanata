import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Building2, MapPin, CalendarDays } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GlassPanel } from "@/components/ui/Surface";
import { getProductBySlug, getProducts } from "@/lib/api";
import { getSeoConfig } from "@/lib/seo";
import { getSiteContent, setting } from "@/lib/siteContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [project, seo] = await Promise.all([getProductBySlug(slug), getSeoConfig()]);
    const url = `${seo.siteUrl}/projects/${slug}`;
    const image = project.images?.[0]?.url ?? seo.ogImage ?? undefined;

    return {
      title: project.name,
      description: project.description,
      alternates: { canonical: url },
      openGraph: {
        title: project.name,
        description: project.description,
        url,
        type: "article",
        ...(image ? { images: [{ url: image.startsWith("http") ? image : `${seo.siteUrl}${image}` }] } : {}),
      },
    };
  } catch {
    return { title: "Proyek" };
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, content] = await Promise.all([getProductBySlug(slug).catch(() => null), getSiteContent()]);
  if (!project) notFound();

  const related = project.category
    ? (await getProducts({ categoryId: project.category.id, pageSize: 4 })).data.filter((p) => p.id !== project.id).slice(0, 3)
    : [];

  return (
    <>
      <PageHero eyebrow={project.category?.name ?? "Proyek"} title={project.name} />

      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <RevealOnScroll className="relative flex h-72 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/70 text-cyan-300/60 md:h-96">
              {project.images[0] ? (
                <Image
                  src={project.images[0].url}
                  alt={project.name}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover opacity-85"
                />
              ) : (
                <Building2 size={48} />
              )}
            </RevealOnScroll>

            <RevealOnScroll delay={0.1} className="mt-10">
              <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-white">Ringkasan Proyek</h2>
              <p className="mt-4 leading-8 text-slate-300">{project.description}</p>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={0.1} className="h-fit">
            <GlassPanel className="space-y-5 p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success">Selesai</Badge>
                {project.category && <Badge tone="gold">{project.category.name}</Badge>}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <MapPin size={16} className="text-cyan-300" /> {setting(content, "project.detail.location", "Jabodetabek, Indonesia")}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-300">
                <CalendarDays size={16} className="text-cyan-300" />{" "}
                {setting(content, "project.detail.completed", "Diselesaikan tahun ini")}
              </div>
              <Button href="/contact" className="w-full justify-center">
                Diskusikan Proyek Serupa
              </Button>
            </GlassPanel>
          </RevealOnScroll>
        </Container>

        {related.length > 0 && (
          <Container className="mt-20">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-white">Proyek Terkait</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/projects/${r.slug}`}
                  className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/35"
                >
                  <div className="relative flex h-36 items-center justify-center border-b border-white/10 bg-slate-950/70 text-cyan-300/60">
                    {r.images[0] ? (
                      <Image src={r.images[0].url} alt={r.name} fill sizes="(min-width: 640px) 30vw, 100vw" className="object-cover opacity-80" />
                    ) : (
                      <Building2 size={24} />
                    )}
                  </div>
                  <p className="p-4 font-display text-sm font-semibold text-white">{r.name}</p>
                </Link>
              ))}
            </div>
          </Container>
        )}
      </section>
    </>
  );
}
