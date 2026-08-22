import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { EmptyState, FilterPill } from "@/components/ui/Surface";
import { getCategories, getProducts } from "@/lib/api";
import { getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Proyek & Portofolio",
  description: "Portofolio proyek konstruksi, renovasi, dan desain arsitektur yang telah diselesaikan Sanata Construction.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const [categories, content] = await Promise.all([getCategories(), getSiteContent()]);
  const activeCategory = categories.find((c) => c.slug === params.category);

  const { data: projects } = await getProducts({ categoryId: activeCategory?.id, pageSize: 24 });

  return (
    <>
      <PageHero
        eyebrow={setting(content, "projects.hero.eyebrow", "Proyek & Portofolio")}
        title={setting(content, "projects.hero.title", "Karya yang Telah Kami Selesaikan")}
        description={setting(
          content,
          "projects.hero.description",
          "Jelajahi proyek residensial dan komersial yang telah dipercayakan klien kepada Sanata Construction."
        )}
      />

      <section className="py-16">
        <Container>
          <div className="flex flex-wrap gap-2">
            <FilterPill href="/projects" active={!activeCategory}>
              Semua
            </FilterPill>
            {categories.map((c) => (
              <FilterPill key={c.id} href={`/projects?category=${c.slug}`} active={activeCategory?.id === c.id}>
                {c.name}
              </FilterPill>
            ))}
          </div>

          {projects.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <RevealOnScroll key={p.id} delay={(i % 3) * 0.06}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/35"
                  >
                    <div className="relative flex h-56 items-center justify-center overflow-hidden border-b border-white/10 bg-slate-950/70 text-cyan-300/60">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0].url}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Building2 size={32} />
                      )}
                      <span className="absolute right-3 top-3">
                        <Badge tone="success">Selesai</Badge>
                      </span>
                    </div>
                    <div className="p-6">
                      {p.category && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{p.category.name}</p>
                      )}
                      <p className="mt-2 font-display text-lg font-semibold text-white">{p.name}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{p.description}</p>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <EmptyState>Belum ada proyek untuk kategori ini.</EmptyState>
          )}
        </Container>
      </section>
    </>
  );
}
