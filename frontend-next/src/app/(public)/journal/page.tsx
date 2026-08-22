import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Search } from "lucide-react";
import clsx from "clsx";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { EmptyState, FilterPill, inputClass } from "@/components/ui/Surface";
import { getArticles, getCategories } from "@/lib/api";
import { getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Insight",
  description: "Wawasan, tips, dan berita seputar dunia konstruksi dari tim Sanata Construction.",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [categories, content] = await Promise.all([getCategories(), getSiteContent()]);
  const activeCategory = categories.find((c) => c.slug === params.category);

  const { data: articles } = await getArticles({ categoryId: activeCategory?.id, search: params.q, pageSize: 24 });

  return (
    <>
      <PageHero
        eyebrow={setting(content, "journal.hero.eyebrow", "Insight")}
        title={setting(content, "journal.hero.title", "Wawasan & Berita Konstruksi")}
        description={setting(
          content,
          "journal.hero.description",
          "Tips, studi kasus, dan pembaruan terbaru seputar dunia konstruksi dari tim Sanata."
        )}
      />

      <section className="py-16">
        <Container>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              <FilterPill href="/journal" active={!activeCategory}>
                Semua
              </FilterPill>
              {categories.map((c) => (
                <FilterPill key={c.id} href={`/journal?category=${c.slug}`} active={activeCategory?.id === c.id}>
                  {c.name}
                </FilterPill>
              ))}
            </div>

            <form method="get" className="relative w-full sm:w-64">
              {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Cari artikel..."
                aria-label="Cari artikel"
                className={clsx(inputClass, "pl-9")}
              />
            </form>
          </div>

          {articles.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {articles.map((a, i) => (
                <RevealOnScroll key={a.id} delay={(i % 3) * 0.06}>
                  <Link
                    href={`/journal/${a.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/35"
                  >
                    <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-white/10 bg-slate-950/70 text-cyan-300/60">
                      {a.coverImage ? (
                        <Image
                          src={a.coverImage}
                          alt={a.title}
                          fill
                          sizes="(min-width: 768px) 30vw, 100vw"
                          className="object-cover opacity-80"
                        />
                      ) : (
                        <Newspaper size={28} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      {a.category && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{a.category.name}</p>
                      )}
                      <p className="mt-2 font-display text-lg font-semibold text-white">{a.title}</p>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-400">{a.excerpt}</p>
                      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {new Date(a.publishedAt ?? a.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <EmptyState>Artikel tidak ditemukan.</EmptyState>
          )}
        </Container>
      </section>
    </>
  );
}
