/**
 * Article Scraper Service
 *
 * Extracts article content from URLs using readability algorithm.
 * Supports single URL scraping and RSS feed import.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import { z } from "zod";
import slugify from "slugify";

// Validation schemas
export const ScrapedArticleSchema = z.object({
  title: z.string().min(1, "Judul tidak boleh kosong"),
  excerpt: z.string().optional(),
  body: z.string().min(100, "Konten minimal 100 karakter"),
  coverImage: z.string().url().optional().nullable(),
  author: z.string().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  sourceUrl: z.string().url(),
  sourceName: z.string().optional().nullable(),
});

export type ScrapedArticle = z.infer<typeof ScrapedArticleSchema>;

export interface ScraperOptions {
  timeout?: number;
  userAgent?: string;
  respectRobots?: boolean;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedArticle;
  error?: string;
}

export interface RssFeedItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  content?: string;
  author?: string;
  enclosure?: {
    url: string;
    type: string;
  };
}

// Default options
const DEFAULT_OPTIONS: Required<ScraperOptions> = {
  timeout: 30000,
  userAgent: "SanataBot/1.0 (+https://sanata.id/bot)",
  respectRobots: true,
};

export class ArticleScraperService {
  private options: Required<ScraperOptions>;

  constructor(options: ScraperOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Scrape article from a single URL
   */
  async scrapeFromUrl(url: string): Promise<ScraperResult> {
    try {
      // Validate URL
      new URL(url);

      // Check robots.txt first
      if (this.options.respectRobots) {
        const allowed = await this.checkRobotsTxt(url);
        if (!allowed) {
          return {
            success: false,
            error: "Scraping tidak diizinkan oleh robots.txt",
          };
        }
      }

      // Fetch the page
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        headers: {
          "User-Agent": this.options.userAgent,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        },
        maxRedirects: 5,
      });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      this.cleanHtml($);

      // Extract content
      const title = this.extractTitle($);
      const excerpt = this.extractExcerpt($);
      const body = this.extractBody($);
      const coverImage = this.extractCoverImage($, url);
      const author = this.extractAuthor($);
      const publishedAt = this.extractPublishedDate($);

      // Validate extracted content
      if (!title) {
        return {
          success: false,
          error: "Tidak dapat menemukan judul artikel",
        };
      }

      if (!body || body.length < 100) {
        return {
          success: false,
          error: "Konten terlalu pendek atau tidak ditemukan",
        };
      }

      // Parse published date if present
      let parsedPublishedAt: string | undefined;
      if (publishedAt) {
        const date = new Date(publishedAt);
        if (!isNaN(date.getTime())) {
          parsedPublishedAt = date.toISOString();
        }
      }

      // Extract domain name as source
      const sourceName = new URL(url).hostname.replace("www.", "");

      const article = ScrapedArticleSchema.parse({
        title: title.trim(),
        excerpt: excerpt?.trim() || undefined,
        body: body.trim(),
        coverImage: coverImage || undefined,
        author: author?.trim() || undefined,
        publishedAt: parsedPublishedAt,
        sourceUrl: url,
        sourceName,
      });

      return {
        success: true,
        data: article,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validasi gagal: ${error.errors.map((e) => e.message).join(", ")}`,
        };
      }

      if (error instanceof AxiosError) {
        if (error.code === "ECONNABORTED") {
          return {
            success: false,
            error: "Request timeout - server terlalu lama merespons",
          };
        }
        if (error.response?.status === 403) {
          return {
            success: false,
            error: "Akses ditolak (403 Forbidden)",
          };
        }
        if (error.response?.status === 404) {
          return {
            success: false,
            error: "Halaman tidak ditemukan (404)",
          };
        }
        return {
          success: false,
          error: `Gagal mengambil halaman: ${error.message}`,
        };
      }

      return {
        success: false,
        error: `Error tidak terduga: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Check if URL is allowed by robots.txt
   */
  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: { "User-Agent": this.options.userAgent },
      });

      const robotsTxt = response.data;
      const path = parsedUrl.pathname || "/";

      // Simple robots.txt parser
      const lines = robotsTxt.split("\n");
      const disallowPaths: string[] = [];
      let currentUserAgent: string | null = null;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        if (trimmed.startsWith("user-agent:")) {
          const agent = trimmed.substring(11).trim();
          if (agent === "*" || agent === this.options.userAgent.toLowerCase()) {
            currentUserAgent = agent;
          } else {
            currentUserAgent = null;
          }
        } else if (currentUserAgent && trimmed.startsWith("disallow:")) {
          const disallowPath = trimmed.substring(9).trim();
          if (disallowPath) {
            disallowPaths.push(disallowPath);
          }
        } else if (trimmed.startsWith("allow:")) {
          const allowPath = trimmed.substring(6).trim();
          if (allowPath) {
            const index = disallowPaths.indexOf(allowPath);
            if (index > -1) {
              disallowPaths.splice(index, 1);
            }
          }
        }
      }

      // Check if path is disallowed
      for (const disallow of disallowPaths) {
        if (path.startsWith(disallow)) {
          return false;
        }
      }

      return true;
    } catch {
      // If robots.txt not found, allow by default
      return true;
    }
  }

  /**
   * Clean HTML by removing scripts, styles, and navigation
   */
  private cleanHtml($: any): void {
    $("script, style, noscript, iframe, nav, header, footer, aside").remove();
    $("[class*='sidebar'], [class*='advertisement'], [class*='social-share'], [class*='related']").remove();
    $("[id*='sidebar'], [id*='advertisement'], [id*='social-share'], [id*='related']").remove();
    $("[class*='comment'], [id*='comment']").remove();
    $("form, button, input").remove();
  }

  /**
   * Extract title from page
   */
  private extractTitle($: any): string | null {
    const selectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      "article h1",
      "h1.title",
      "h1",
      "title",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const content = element.attr("content") || element.text();
        if (content && content.trim()) {
          return content.trim();
        }
      }
    }

    return null;
  }

  /**
   * Extract excerpt/description from page
   */
  private extractExcerpt($: any): string | null {
    const selectors = [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
      '[class*="excerpt"]',
      '[class*="summary"]',
      '[class*="lead"]',
      "article p:first-of-type",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        const content = element.attr("content") || element.text();
        if (content && content.trim().length > 20) {
          return content.trim().substring(0, 300);
        }
      }
    }

    return null;
  }

  /**
   * Extract main body content from page
   */
  private extractBody($: any): string | null {
    const selectors = [
      "article",
      '[role="main"]',
      "main",
      '[class*="content"]',
      '[class*="article"]',
      '[class*="post"]',
      '[class*="entry"]',
      '[class*="body"]',
      ".post-content",
      ".entry-content",
      ".article-content",
      ".article-body",
      ".post-body",
      "body",
    ];

    for (const selector of selectors) {
      const content = $(selector).first();
      if (content.length) {
        let html = content.html();

        if (html && html.length > 200) {
          html = this.cleanContent(html);
          const text = this.htmlToText(html);

          if (text.length > 100) {
            return html.trim();
          }
        }
      }
    }

    return null;
  }

  /**
   * Clean extracted content
   */
  private cleanContent(html: string): string {
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
    html = html.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, "");
    html = html.replace(/\s+/g, " ");
    html = html.replace(/>\s+</g, "><");
    return html;
  }

  /**
   * Extract cover image from page
   */
  private extractCoverImage($: any, baseUrl: string): string | null {
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:image:secure_url"]',
      'meta[itemprop="image"]',
      "article img",
      '[class*="featured"] img',
      '[class*="cover"] img',
      '[class*="thumbnail"] img',
      '[class*="hero"] img',
      "main img",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        let src = element.attr("content") || element.attr("src") || element.attr("data-src");

        if (src) {
          if (src.startsWith("//")) {
            src = "https:" + src;
          } else if (src.startsWith("/")) {
            const url = new URL(baseUrl);
            src = `${url.protocol}//${url.host}${src}`;
          }

          if (src.match(/\.(jpg|jpeg|png|webp|gif)/i) || src.includes("image")) {
            return src;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract author from page
   */
  private extractAuthor($: any): string | null {
    const selectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '[rel="author"]',
      '[class*="author"]',
      '[itemprop="author"]',
      "address.author",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        let content = element.attr("content") || element.text();
        if (content && content.trim().length > 1 && content.trim().length < 100) {
          content = content.trim();
          content = content.replace(/^by\s+/i, "");
          content = content.replace(/^written by\s+/i, "");
          return content;
        }
      }
    }

    return null;
  }

  /**
   * Extract published date from page
   */
  private extractPublishedDate($: any): string | null {
    const selectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[property="date"]',
      'meta[itemprop="datePublished"]',
      "time[datetime]",
      "time[pubdate]",
      '[class*="date"]',
      '[class*="published"]',
      '[class*="post-date"]',
      '[class*="entry-date"]',
    ];

    const attrNames = ["content", "datetime", "pubdate"];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        for (const attr of attrNames) {
          const content = element.attr(attr);
          if (content) {
            const date = new Date(content);
            if (!isNaN(date.getTime())) {
              return content;
            }
          }
        }

        const text = element.text().trim();
        if (text) {
          const date = new Date(text);
          if (!isNaN(date.getTime())) {
            return text;
          }
        }
      }
    }

    return null;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    }).substring(0, 60);
  }

  /**
   * Estimate reading time in minutes
   */
  estimateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / wordsPerMinute));
  }

  /**
   * Count words in text
   */
  countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  /**
   * Extract images from HTML
   */
  extractImages(html: string): string[] {
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }

    return images;
  }
}

// RSS Scraper Service
export interface RssSource {
  id?: string;
  name: string;
  url: string;
  categoryId?: string | null;
}

export interface RssScraperResult {
  success: boolean;
  items: RssFeedItem[];
  error?: string;
}

export class RssScraperService {
  /**
   * Parse RSS/Atom feed
   */
  async fetchFeed(source: RssSource): Promise<RssScraperResult> {
    try {
      const response = await axios.get(source.url, {
        timeout: 15000,
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
          "User-Agent": "SanataBot/1.0 (+https://sanata.id)",
        },
      });

      const xml = response.data;

      if (xml.includes("<rss") || xml.includes("<channel>")) {
        return this.parseRss(xml);
      } else if (xml.includes("<feed")) {
        return this.parseAtom(xml);
      } else {
        return {
          success: false,
          items: [],
          error: "Format feed tidak dikenali",
        };
      }
    } catch (error) {
      return {
        success: false,
        items: [],
        error: `Gagal mengambil RSS feed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Parse RSS 2.0 feed
   */
  private parseRss(xml: string): RssScraperResult {
    try {
      const $ = cheerio.load(xml, { xmlMode: true });
      const items: RssFeedItem[] = [];

      $("item").each((_, element) => {
        const item: RssFeedItem = {
          title: $("title", element).text().trim(),
          link: $("link", element).text().trim(),
          pubDate: $("pubDate", element).text().trim(),
          description: $("description", element).text().trim(),
          author: $("author", element).text().trim() || $("dc\\:creator", element).text().trim(),
        };

        const contentEncoded = $("content\\:encoded", element).text() || $("content", element).text();
        if (contentEncoded) {
          item.content = contentEncoded;
        }

        const enclosure = $("enclosure", element);
        if (enclosure.length) {
          const url = enclosure.attr("url");
          const type = enclosure.attr("type");
          if (url && type?.startsWith("image/")) {
            item.enclosure = { url, type };
          }
        }

        if (item.title && item.link) {
          items.push(item);
        }
      });

      return { success: true, items };
    } catch (error) {
      return {
        success: false,
        items: [],
        error: `Gagal parsing RSS: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Parse Atom feed
   */
  private parseAtom(xml: string): RssScraperResult {
    try {
      const $ = cheerio.load(xml, { xmlMode: true });
      const items: RssFeedItem[] = [];

      $("entry").each((_, element) => {
        const item: RssFeedItem = {
          title: $("title", element).text().trim(),
          link: $("link[rel='alternate']", element).attr("href") || $("link", element).first().attr("href") || "",
          pubDate: $("published", element).text().trim() || $("updated", element).text().trim(),
          author: $("author name", element).text().trim(),
        };

        const content = $("content", element).text() || $("summary", element).text();
        if (content) {
          item.content = content;
        }

        const description = $("summary", element).text();
        if (description && !item.content) {
          item.description = description;
        }

        const mediaContent = $("media\\:content, content", element).first();
        if (mediaContent.length) {
          const url = mediaContent.attr("url");
          const type = mediaContent.attr("type");
          if (url) {
            item.enclosure = { url, type: type || "image" };
          }
        }

        if (item.title && item.link) {
          items.push(item);
        }
      });

      return { success: true, items };
    } catch (error) {
      return {
        success: false,
        items: [],
        error: `Gagal parsing Atom: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

// Export singleton instances
export const scraperService = new ArticleScraperService();
export const rssScraperService = new RssScraperService();
