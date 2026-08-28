/**
 * Scraper Routes
 *
 * API routes for article scraping and RSS import
 */

import { Router } from "express";
import { requireRole } from "@/middleware/auth";
import {
  scrapeUrl,
  previewScrape,
  importFromRss,
  getSuggestedFeeds,
  validateUrl,
} from "@/controllers/scraper.controller";

const router = Router();

// All routes require admin/editor role
router.use(requireRole("ADMIN", "EDITOR"));

/**
 * POST /api/scraper/scrape
 * Scrape a single URL and create content draft
 */
router.post("/scrape", scrapeUrl);

/**
 * POST /api/scraper/preview
 * Preview scraped content without creating
 */
router.post("/preview", previewScrape);

/**
 * POST /api/scraper/rss
 * Import articles from RSS feeds
 */
router.post("/rss", importFromRss);

/**
 * GET /api/scraper/rss/feeds
 * Get list of suggested RSS feeds
 */
router.get("/rss/feeds", getSuggestedFeeds);

/**
 * GET /api/scraper/validate-url
 * Validate if a URL can be scraped
 */
router.get("/validate-url", validateUrl);

export default router;
