import slugify from "slugify";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { withCache, bumpCacheVersion } from "@/lib/cache";
import { analyzeSeo } from "@/services/seo.service";
import type { ContentInput, ContentUpdateInput } from "@/validators/content.validator";

type ListQuery = {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  status?: string;
  type?: string;
  categoryId?: string;
};

export async function listContents(query: ListQuery) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.ContentWhereInput = {
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(query.type ? { type: query.type as never } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
  };

  const cacheKey = JSON.stringify({ page, pageSize, ...query });

  return withCache("contents", cacheKey, async () => {
    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } }, category: true },
      }),
      prisma.content.count({ where }),
    ]);

    return { items, meta: buildMeta(page, pageSize, total) };
  });
}

export async function getContentBySlug(slug: string) {
  const content = await prisma.content.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true } }, category: true },
  });
  if (!content) throw ApiError.notFound("Content not found");
  return content;
}

export async function getContentById(id: string) {
  const content = await prisma.content.findUnique({ where: { id }, include: { category: true } });
  if (!content) throw ApiError.notFound("Content not found");
  return content;
}

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let i = 1;
  while (await prisma.content.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createContent(authorId: string, input: ContentInput) {
  const slug = await uniqueSlug(input.title);
  const content = await prisma.content.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      body: input.body,
      type: input.type,
      status: input.status,
      coverImage: input.coverImage || null,
      categoryId: input.categoryId || null,
      authorId,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      metaTitle: input.metaTitle || null,
      metaDescription: input.metaDescription || null,
      ogImage: input.ogImage || null,
      canonicalUrl: input.canonicalUrl || null,
      focusKeyword: input.focusKeyword || null,
      noIndex: input.noIndex ?? false,
    },
  });
  await bumpCacheVersion("contents");
  return content;
}

/**
 * Semua konten terindeks untuk sitemap. Sengaja hanya kolom yang dibutuhkan
 * agar murah dipanggil berulang oleh generator sitemap.
 */
/** Ringkasan skor SEO seluruh konten — untuk tabel di menu SEO. */
export async function getSeoOverview() {
  const contents = await prisma.content.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
      excerpt: true,
      body: true,
      coverImage: true,
      metaTitle: true,
      metaDescription: true,
      ogImage: true,
      focusKeyword: true,
      noIndex: true,
      updatedAt: true,
    },
  });

  const items = contents.map((c) => {
    const seo = analyzeSeo(c);
    // Isi body tidak perlu dikirim ke klien — cukup hasil analisisnya.
    const { body: _body, ...rest } = c;
    return { ...rest, score: seo.score, grade: seo.grade, issues: seo.checks.filter((x) => x.status !== "good").length };
  });

  const scored = items.filter((i) => i.status === "PUBLISHED");
  return {
    items,
    summary: {
      total: items.length,
      indexable: items.filter((i) => i.status === "PUBLISHED" && !i.noIndex).length,
      noIndex: items.filter((i) => i.noIndex).length,
      averageScore: scored.length ? Math.round(scored.reduce((s, i) => s + i.score, 0) / scored.length) : 0,
      needsWork: items.filter((i) => i.score < 50).length,
    },
  };
}

export async function listIndexableContents() {
  return prisma.content.findMany({
    where: { status: "PUBLISHED", noIndex: false },
    select: { slug: true, type: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function updateContent(id: string, input: ContentUpdateInput) {
  const existing = await getContentById(id);
  const slug = input.title && input.title !== existing.title ? await uniqueSlug(input.title, id) : undefined;

  const content = await prisma.content.update({
    where: { id },
    data: {
      ...input,
      coverImage: input.coverImage === "" ? null : input.coverImage,
      ...(slug ? { slug } : {}),
      ...(input.status === "PUBLISHED" && existing.status !== "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });
  await bumpCacheVersion("contents");
  return content;
}

export async function deleteContent(id: string) {
  await prisma.content.delete({ where: { id } });
  await bumpCacheVersion("contents");
}

export async function incrementViews(id: string) {
  await prisma.content.update({ where: { id }, data: { views: { increment: 1 } } });
}
