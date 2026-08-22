import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { contentSchema, contentUpdateSchema, seoAnalyzeSchema } from "@/validators/content.validator";
import * as contentService from "@/services/content.service";
import { analyzeSeo } from "@/services/seo.service";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await contentService.listContents(req.query as never);
  res.json({ success: true, data: result.items, meta: result.meta });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const content = await contentService.getContentBySlug(req.params.slug);
  await contentService.incrementViews(content.id);
  res.json({ success: true, data: content });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const content = await contentService.getContentById(req.params.id);
  res.json({ success: true, data: { ...content, seo: analyzeSeo(content) } });
});

/** Analisis SEO tanpa menyimpan — dipakai untuk pratinjau langsung di editor. */
export const analyze = asyncHandler(async (req: Request, res: Response) => {
  const input = seoAnalyzeSchema.parse(req.body);
  res.json({
    success: true,
    data: analyzeSeo({
      title: input.title,
      slug: input.slug ?? "",
      excerpt: input.excerpt ?? null,
      body: input.body,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      ogImage: input.ogImage ?? null,
      coverImage: input.coverImage ?? null,
      focusKeyword: input.focusKeyword ?? null,
    }),
  });
});

/** Daftar konten terindeks + ringkasan skor SEO — sumber data menu SEO. */
export const seoOverview = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await contentService.getSeoOverview() });
});

/** Data mentah untuk sitemap.xml yang digenerate di sisi Next.js. */
export const sitemapData = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await contentService.listIndexableContents() });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = contentSchema.parse(req.body);
  const content = await contentService.createContent(req.user!.sub, input);
  await recordAudit({ userId: req.user!.sub, action: "CREATE", entity: "Content", entityId: content.id, meta: { title: content.title } });
  res.status(201).json({ success: true, data: content });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = contentUpdateSchema.parse(req.body);
  const content = await contentService.updateContent(req.params.id, input);
  await recordAudit({ userId: req.user!.sub, action: "UPDATE", entity: "Content", entityId: content.id, meta: input });
  res.json({ success: true, data: content });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await contentService.deleteContent(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Content", entityId: req.params.id });
  res.json({ success: true, data: null });
});
