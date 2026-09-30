/**
 * SEO AI Routes
 * 
 * Endpoints for SEO analysis, content optimization, and social media posting
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { seoAIService } from "@/services/seo-ai.service";
import { ApiError } from "@/utils/ApiError";

const router = Router();

// Schema definitions
const analyzeSEOSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  url: z.string().url().optional(),
  keywords: z.array(z.string()).optional(),
});

const optimizeContentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  url: z.string().url().optional(),
  keywords: z.array(z.string()).optional(),
});

const generatePostSchema = z.object({
  platform: z.enum(["instagram", "linkedin", "twitter", "facebook"]),
  title: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  tone: z.enum(["professional", "casual", "technical"]).optional(),
});

/**
 * GET /api/ai/seo/status
 * Check SEO AI service status
 */
router.get("/seo/status", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      aiEnabled: seoAIService.isEnabled(),
      provider: "bluepack",
      features: {
        seoAnalysis: true,
        contentOptimization: seoAIService.isEnabled(),
        socialPostGeneration: true,
      },
    },
  });
});

/**
 * POST /api/ai/seo/analyze
 * Analyze content for SEO
 */
router.post("/seo/analyze", async (req: Request, res: Response) => {
  try {
    const validation = analyzeSEOSchema.safeParse(req.body);
    if (!validation.success) {
      throw ApiError.badRequest(`Invalid request: ${validation.error.message}`);
    }

    const result = await seoAIService.analyzeSEO(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("[SEO AI] Analysis error:", error);
    throw ApiError.internal("Gagal menganalisis SEO");
  }
});

/**
 * POST /api/ai/seo/optimize
 * Get AI-powered content optimization suggestions
 */
router.post("/seo/optimize", async (req: Request, res: Response) => {
  try {
    const validation = optimizeContentSchema.safeParse(req.body);
    if (!validation.success) {
      throw ApiError.badRequest(`Invalid request: ${validation.error.message}`);
    }

    const result = await seoAIService.optimizeContent(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("[SEO AI] Optimization error:", error);
    throw ApiError.internal("Gagal mengoptimalkan konten");
  }
});

/**
 * POST /api/ai/seo/social/generate
 * Generate social media post with AI
 */
router.post("/seo/social/generate", async (req: Request, res: Response) => {
  try {
    const validation = generatePostSchema.safeParse(req.body);
    if (!validation.success) {
      throw ApiError.badRequest(`Invalid request: ${validation.error.message}`);
    }

    const result = await seoAIService.generateSocialPost(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("[SEO AI] Social post error:", error);
    throw ApiError.internal("Gagal membuat post sosial media");
  }
});

/**
 * POST /api/ai/seo/social/bulk-generate
 * Generate posts for multiple platforms at once
 */
router.post("/seo/social/bulk-generate", async (req: Request, res: Response) => {
  try {
    const { title, content, platforms, tone } = req.body;

    if (!title || !content || !platforms || !Array.isArray(platforms)) {
      throw ApiError.badRequest("title, content, and platforms are required");
    }

    const results = await Promise.all(
      platforms.map(async (platform: string) => {
        try {
          const result = await seoAIService.generateSocialPost({
            platform,
            title,
            content,
            tone: tone || "professional",
          });
          return { platform, success: true, ...result };
        } catch (error) {
          return { 
            platform, 
            success: false, 
            error: error instanceof Error ? error.message : "Failed" 
          };
        }
      })
    );

    res.json({
      success: true,
      data: { posts: results },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("[SEO AI] Bulk generate error:", error);
    throw ApiError.internal("Gagal membuat post bulk");
  }
});

/**
 * GET /api/ai/seo/hashtags
 * Get suggested hashtags for construction/renovation industry
 */
router.get("/seo/hashtags", (_req: Request, res: Response) => {
  const hashtags = {
    general: [
      "#SanataConstruction",
      "#KonstruksiIndonesia",
      "#RenovasiRumah",
      "#RumahIdaman",
      "#ProyekBerkualitas",
    ],
    construction: [
      "#KonstruksiRumah",
      "#BangunRumah",
      "#JasaKonstruksi",
      "#RenovasiRumah",
      "#Pembangunan",
    ],
    renovation: [
      "#RenovasiRumah",
      "#RumahBaru",
      "#InteriorRumah",
      "#DesainRumah",
      "#RumahMinimalis",
    ],
    business: [
      "#KontraktorProfesional",
      "#UsahaKonstruksi",
      "#IndustriKonstruksi",
      "#ProyekIndonesia",
    ],
  };

  res.json({
    success: true,
    data: hashtags,
  });
});

export default router;
