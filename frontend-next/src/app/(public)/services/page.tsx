import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, Search } from "lucide-react";
import clsx from "clsx";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { EmptyState, FilterPill, inputClass } from "@/components/ui/Surface";
import { getCategories, getProducts } from "@/lib/api";
import { getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Layanan",
  description: "Layanan konstruksi, renovasi, dan desain arsitektur dari Sanata Construction.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [categories, content] = await Promise.all([getCategories(), getSiteContent()]);
  const activeCategory = categories.find((c) => c.slug === params.category);

  const { data: services, meta } = await getProducts({
    categoryId: activeCategory?.id,
    search: params.q,
    pageSize: 24,
  });

  return (
    <>
      <PageHero
        eyebrow={setting(content, "services.hero.eyebrow", "Layanan Kami")}
        title={setting(content, "services.hero.title", "Layanan Konstruksi Sanata")}
        description={setting(
          content,
          "services.hero.description",
          "Paket jasa konstruksi, renovasi, dan desain yang dapat disesuaikan dengan kebutuhan proyek Anda."
        )}
      />

      <section className="py-16">
        <Container>
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Cari layanan..."
                aria-label="Cari layanan"
                className={clsx(inputClass, "pl-9")}
              />
            </div>
            {params.category && <input type="hidden" name="category" value={params.category} />}
            <button className="rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/20">
              Cari
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <FilterPill href="/services" active={!activeCategory}>
              Semua
            </FilterPill>
            {categories.map((c) => (
              <FilterPill key={c.id} href={`/services?category=${c.slug}`} active={activeCategory?.id === c.id}>
                {c.name}
              </FilterPill>
            ))}
          </div>

          {services.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <RevealOnScroll key={s.id} delay={(i % 3) * 0.06}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/35"
                  >
                    <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-white/10 bg-slate-950/70 text-cyan-300/60">
                      {s.images[0] ? (
                        <Image
                          src={s.images[0].url}
                          alt={s.name}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover opacity-80"
                        />
                      ) : (
                        <Building2 size={28} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      {s.category && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">{s.category.name}</p>
                      )}
                      <p className="mt-2 font-display text-lg font-semibold text-white">{s.name}</p>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-400">{s.description}</p>
                      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">
                        Estimasi mulai Rp {Number(s.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <EmptyState>Layanan tidak ditemukan untuk filter ini.</EmptyState>
          )}

          {meta.totalPages > 1 && (
            <p className="mt-10 text-center text-sm text-slate-400">
              Menampilkan {services.length} dari {meta.total} layanan
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
