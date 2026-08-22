import type { Metadata } from "next";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { getProducts } from "@/lib/api";
import { getSiteContent, setting } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Galeri foto proyek konstruksi dan renovasi Sanata Construction.",
};

export default async function GalleryPage() {
  const [productsResult, content] = await Promise.all([getProducts({ pageSize: 24 }).catch(() => ({ data: [], meta: { page: 1, pageSize: 24, total: 0, totalPages: 0 } })), getSiteContent()]);
  const { data: projects } = productsResult;
  const withImages = projects.filter((p) => p.images.length > 0);

  return (
    <>
      <PageHero
        eyebrow={setting(content, "gallery.hero.eyebrow", "Galeri")}
        title={setting(content, "gallery.hero.title", "Dokumentasi Proyek Kami")}
        description={setting(
          content,
          "gallery.hero.description",
          "Kumpulan foto dari berbagai proyek yang telah dikerjakan tim Sanata Construction."
        )}
      />

      <section className="py-20">
        <Container>
          {withImages.length > 0 ? (
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
              {withImages.flatMap((p) =>
                p.images.map((img) => (
                  <RevealOnScroll
                    key={img.id}
                    className="break-inside-avoid overflow-hidden rounded-[1.6rem] border border-white/10"
                  >
                    <div className="relative aspect-[4/3] w-full bg-slate-950/70">
                      <Image
                        src={img.url}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover opacity-90 transition duration-500 hover:opacity-100"
                      />
                    </div>
                  </RevealOnScroll>
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 9).map((p, i) => (
                <RevealOnScroll key={p.id} delay={(i % 3) * 0.06}>
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[1.6rem] border border-white/10 bg-slate-950/70 text-cyan-300/60">
                    <Building2 size={28} />
                    <p className="px-4 text-center text-xs font-medium uppercase tracking-[0.16em] text-slate-300">{p.name}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
