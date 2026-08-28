import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Eye, Facebook, Mail, Home } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { GlassPanel } from "@/components/ui/Surface";
import { getArticleBySlug, getArticles } from "@/lib/api";
import {
  SITE_URL,
  buildContentMetadata,
  enhancedArticleJsonLd,
  breadcrumbsJsonLd,
} from "@/lib/seo";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readingTime(html: string) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await getArticleBySlug(slug);
    return buildContentMetadata(
      {
        ...article,
        metaDescription: article.metaDescription ?? article.excerpt ?? stripHtml(article.body).slice(0, 160),
      },
      `/journal/${article.slug}`
    );
  } catch {
    return { title: "Artikel" };
  }
}

export default async function JournalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) notFound();

  const related = article.category
    ? (await getArticles({ categoryId: article.category.id, pageSize: 4 })).data.filter((a) => a.id !== article.id).slice(0, 3)
    : [];

  const articleUrl = `${SITE_URL}/journal/${article.slug}`;
  const shareText = encodeURIComponent(article.title);

  // Build breadcrumb items
  const breadcrumbItems = [
    { name: "Beranda", url: "/" },
    { name: "Insight", url: "/journal" },
    ...(article.category ? [{ name: article.category.name, url: `/journal?category=${article.category.slug}` }] : []),
    { name: article.title, url: `/journal/${article.slug}` },
  ];

  return (
    <>
      {/* Enhanced Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(enhancedArticleJsonLd(article)) }}
      />
      {/* Breadcrumbs Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd(breadcrumbItems)) }}
      />
      <article className="pb-20 pt-36">
        <Container className="max-w-3xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-slate-400">
              <li>
                <Link href="/" className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                  <Home size={12} />
                  Beranda
                </Link>
              </li>
              <li className="text-slate-600">/</li>
              <li>
                <Link href="/journal" className="hover:text-cyan-300 transition-colors">
                  Insight
                </Link>
              </li>
              {article.category && (
                <>
                  <li className="text-slate-600">/</li>
                  <li>
                    <Link href={`/journal?category=${article.category.slug}`} className="hover:text-cyan-300 transition-colors">
                      {article.category.name}
                    </Link>
                  </li>
                </>
              )}
              <li className="text-slate-600">/</li>
              <li className="text-slate-200 line-clamp-1 max-w-[200px]" aria-current="page">
                {article.title}
              </li>
            </ol>
          </nav>

          <Link
            href="/journal"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-slate-400 hover:text-cyan-300"
          >
            <ArrowLeft size={16} /> Kembali ke Insight
          </Link>

          <GlassPanel className="p-7">
            {article.category && (
              <p className="font-accent text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{article.category.name}</p>
            )}
            <h1 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">{article.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em] text-slate-400">
              <span>
                {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {readingTime(article.body)} menit baca
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={13} /> {article.views} views
              </span>
            </div>
          </GlassPanel>

          {article.coverImage && (
            <RevealOnScroll className="relative mt-8 h-72 overflow-hidden rounded-[1.8rem] border border-white/10 md:h-96">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(min-width: 768px) 48rem, 100vw"
                className="object-cover"
              />
            </RevealOnScroll>
          )}

          {/* Gaya isi artikel didefinisikan di globals.css (.prose-content). */}
          <div className="prose-content mt-10" dangerouslySetInnerHTML={{ __html: article.body }} />

          <div className="mt-10 flex items-center gap-3 border-t border-white/10 pt-8">
            <span className="text-sm font-medium text-slate-400">Bagikan:</span>
            <a
              href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-300"
              aria-label="Bagikan ke WhatsApp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2Z"/></svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-300"
              aria-label="Bagikan ke Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={`mailto:?subject=${shareText}&body=${encodeURIComponent(articleUrl)}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-300"
              aria-label="Bagikan lewat Email"
            >
              <Mail size={16} />
            </a>
          </div>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-xl font-semibold text-white">Artikel Terkait</h2>
              <div className="mt-6 space-y-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/journal/${r.slug}`}
                    className="block rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-300/25"
                  >
                    <p className="font-medium text-white">{r.title}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-400">{r.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </article>
    </>
  );
}
