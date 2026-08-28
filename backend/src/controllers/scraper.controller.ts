/**
 * Scraper Controller
 *
 * Handles article scraping and RSS import endpoints
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { z } from "zod";
import slugify from "slugify";
import * as contentService from "@/services/content.service";
import { scraperService, rssScraperService, type RssSource } from "@/services/scraper.service";
import { recordAudit } from "@/services/auditLog.service";

// Validation schemas
const scrapeUrlSchema = z.object({
  url: z.string().url("URL tidak valid"),
  categoryId: z.string().optional().nullable(),
  publishImmediately: z.boolean().optional().default(false),
});

const rssImportSchema = z.object({
  sources: z.array(
    z.object({
      name: z.string().min(1, "Nama feed harus diisi"),
      url: z.string().url("URL feed tidak valid"),
      categoryId: z.string().optional().nullable(),
    })
  ).min(1, "Minimal harus ada 1 RSS feed"),
  limitPerSource: z.number().int().min(1).max(50).optional().default(5),
  publishImmediately: z.boolean().optional().default(false),
});

/**
 * POST /api/scraper/scrape
 * Scrape a single URL and create content
 */
export const scrapeUrl = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  // Validate input
  const validation = scrapeUrlSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: validation.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  const { url, categoryId, publishImmediately } = validation.data;

  // Scrape the URL
  const result = await scraperService.scrapeFromUrl(url);

  if (!result.success || !result.data) {
    res.status(422).json({
      success: false,
      message: result.error || "Gagal mengambil konten dari URL",
    });
    return;
  }

  const article = result.data;

  // Generate unique slug
  let baseSlug = slugify(article.title, { lower: true, strict: true }).substring(0, 60);
  let slug = baseSlug;
  let counter = 1;

  // Ensure slug is unique
  while (await contentService.isSlugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Prepare content data
  const contentData = {
    title: article.title,
    slug,
    excerpt: article.excerpt,
    body: article.body,
    type: "POST" as const,
    status: (publishImmediately ? "PUBLISHED" : "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    categoryId: categoryId || null,
    coverImage: article.coverImage,
    publishedAt: article.publishedAt || null,
    // SEO fields
    metaTitle: article.title,
    metaDescription: article.excerpt,
    canonicalUrl: article.sourceUrl,
    focusKeyword: null,
    noIndex: false,
  };

  // Create content
  const content = await contentService.createContent(userId, contentData);

  // Record audit
  await recordAudit({
    userId,
    action: "CREATE",
    entity: "Content",
    entityId: content.id,
    meta: {
      title: content.title,
      source: "scrape",
      sourceUrl: article.sourceUrl,
      sourceName: article.sourceName,
    },
  });

  res.status(201).json({
    success: true,
    message: "Konten berhasil diimpor dari URL",
    data: {
      id: content.id,
      title: content.title,
      slug: content.slug,
      status: content.status,
      sourceUrl: article.sourceUrl,
      sourceName: article.sourceName,
      wordCount: scraperService.countWords(article.body),
      readingTime: scraperService.estimateReadingTime(article.body),
    },
  });
});

/**
 * POST /api/scraper/preview
 * Preview scraped content without creating
 */
export const previewScrape = asyncHandler(async (req: Request, res: Response) => {
  const { url } = z.object({ url: z.string().url() }).parse(req.body);

  const result = await scraperService.scrapeFromUrl(url);

  if (!result.success || !result.data) {
    res.status(422).json({
      success: false,
      message: result.error || "Gagal mengambil konten dari URL",
    });
    return;
  }

  const article = result.data;

  res.json({
    success: true,
    data: {
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      bodyLength: article.body.length,
      coverImage: article.coverImage,
      author: article.author,
      publishedAt: article.publishedAt,
      sourceUrl: article.sourceUrl,
      sourceName: article.sourceName,
      wordCount: scraperService.countWords(article.body),
      readingTime: scraperService.estimateReadingTime(article.body),
      slug: scraperService.generateSlug(article.title),
    },
  });
});

/**
 * POST /api/scraper/rss
 * Import articles from RSS feeds
 */
export const importFromRss = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  // Validate input
  const validation = rssImportSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: validation.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  const { sources, limitPerSource, publishImmediately } = validation.data;

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
    articles: [] as {
      id: string;
      title: string;
      slug: string;
      status: string;
      sourceUrl: string;
    }[],
  };

  // Process each source
  for (const source of sources) {
    const feedResult = await rssScraperService.fetchFeed(source);

    if (!feedResult.success) {
      results.errors.push(`${source.name}: ${feedResult.error}`);
      continue;
    }

    const items = feedResult.items.slice(0, limitPerSource);

    for (const item of items) {
      results.total++;

      try {
        // Scrape the article URL
        const scrapeResult = await scraperService.scrapeFromUrl(item.link);

        if (!scrapeResult.success || !scrapeResult.data) {
          results.skipped++;
          results.errors.push(`Skipped: ${item.title} - ${scrapeResult.error}`);
          continue;
        }

        const article = scrapeResult.data;

        // Check for duplicate (by source URL)
        const existing = await contentService.findByCanonicalUrl(article.sourceUrl);
        if (existing) {
          results.skipped++;
          continue;
        }

        // Generate unique slug
        let baseSlug = slugify(article.title, { lower: true, strict: true }).substring(0, 60);
        let slug = baseSlug;
        let counter = 1;

        while (await contentService.isSlugExists(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Create content
        const contentData = {
          title: article.title,
          slug,
          excerpt: article.excerpt || item.description?.substring(0, 200) || undefined,
          body: article.body,
          type: "POST" as const,
          status: (publishImmediately ? "PUBLISHED" : "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          categoryId: source.categoryId || null,
          coverImage: article.coverImage || item.enclosure?.url,
          publishedAt: article.publishedAt || (item.pubDate ? new Date(item.pubDate).toISOString() : null),
          // SEO fields
          metaTitle: article.title,
          metaDescription: article.excerpt || item.description?.substring(0, 160),
          canonicalUrl: article.sourceUrl,
          focusKeyword: null,
          noIndex: false,
        };

        const content = await contentService.createContent(userId, contentData);

        // Record audit
        await recordAudit({
          userId,
          action: "CREATE",
          entity: "Content",
          entityId: content.id,
          meta: {
            title: content.title,
            source: "rss_import",
            sourceName: source.name,
            feedUrl: source.url,
          },
        });

        results.success++;
        results.articles.push({
          id: content.id,
          title: content.title,
          slug: content.slug,
          status: content.status,
          sourceUrl: article.sourceUrl,
        });
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed: ${item.title} - ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // Rate limiting - wait between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  res.json({
    success: true,
    message: `Impor selesai: ${results.success} berhasil, ${results.skipped} dilewati, ${results.failed} gagal dari total ${results.total} artikel`,
    data: results,
  });
});

/**
 * GET /api/scraper/rss/feeds
 * Get list of common Indonesian RSS feeds for construction/architecture
 */
export const getSuggestedFeeds = asyncHandler(async (_req: Request, res: Response) => {
  const suggestedFeeds = [
    {
      name: "Kompas Properti",
      url: "https://properti.kompas.com/feed",
      category: "Berita Properti",
    },
    {
      name: "Rumah123 Blog",
      url: "https://blog.rumah123.com/feed/",
      category: "Tips Properti",
    },
    {
      name: "Jasa Konstruksi Indonesia",
      url: "https://jkki.or.id/feed",
      category: "Industri Konstruksi",
    },
  ];

  res.json({
    success: true,
    data: suggestedFeeds,
  });
});

/**
 * GET /api/scraper/validate-url
 * Validate if a URL can be scraped
 */
export const validateUrl = asyncHandler(async (req: Request, res: Response) => {
  const { url } = z.object({ url: z.string().url() }).parse(req.query);

  const result = await scraperService.scrapeFromUrl(url);

  res.json({
    success: true,
    data: {
      valid: result.success,
      canScrape: result.success,
      error: result.error || null,
    },
  });
});
