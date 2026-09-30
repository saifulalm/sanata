/**
 * SEO AI Enhancement Service
 * Uses BluePack AI to optimize SEO content, meta descriptions, and suggestions
 */

import { env } from "@/config/env";
import axios from "axios";

export interface SEOAnalysisRequest {
  title: string;
  content: string;
  excerpt?: string;
  url?: string;
  keywords?: string[];
}

export interface SEOAnalysisResult {
  score: number;
  suggestions: SEOSuggestion[];
  optimizedTitle?: string;
  optimizedExcerpt?: string;
  suggestedKeywords: string[];
  readabilityScore: number;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface SEOSuggestion {
  type: "error" | "warning" | "suggestion";
  category: "title" | "meta" | "content" | "keywords" | "readability";
  message: string;
  impact: "high" | "medium" | "low";
}

export interface SocialPostRequest {
  platform: "instagram" | "linkedin" | "twitter" | "facebook";
  content: string;
  imageUrl?: string;
  title?: string; // For LinkedIn
  hashtags?: string[];
}

export interface SocialPostResult {
  success: boolean;
  platform: string;
  postUrl?: string;
  postId?: string;
  error?: string;
}

class SEOAIService {
  private get baseUrl(): string {
    return env.bluepack.apiUrl;
  }

  private get apiKey(): string {
    return env.bluepack.apiKey;
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Analyze content and provide SEO suggestions
   */
  async analyzeSEO(request: SEOAnalysisRequest): Promise<SEOAnalysisResult> {
    const { title, content, excerpt, url, keywords = [] } = request;
    
    // Calculate basic metrics
    const wordCount = this.countWords(content);
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));
    const readabilityScore = this.calculateReadabilityScore(content);

    // Generate suggestions
    const suggestions: SEOSuggestion[] = [];

    // Title analysis
    if (title.length < 30) {
      suggestions.push({
        type: "warning",
        category: "title",
        message: `Judul terlalu pendek (${title.length} karakter). Idealnya 50-60 karakter untuk SEO.`,
        impact: "medium",
      });
    } else if (title.length > 60) {
      suggestions.push({
        type: "warning",
        category: "title",
        message: `Judul terlalu panjang (${title.length} karakter). Mungkin terpotong di hasil pencarian.`,
        impact: "medium",
      });
    }

    // Meta description
    if (!excerpt || excerpt.length < 120) {
      suggestions.push({
        type: "error",
        category: "meta",
        message: "Excerpt/meta description terlalu pendek. Tambahkan 120-160 karakter untuk hasil optimal.",
        impact: "high",
      });
    }

    // Content length
    if (wordCount < 300) {
      suggestions.push({
        type: "warning",
        category: "content",
        message: `Konten cukup pendek (${wordCount} kata). Pertimbangkan untuk menambah minimal 300 kata.`,
        impact: "medium",
      });
    } else if (wordCount > 2000) {
      suggestions.push({
        type: "suggestion",
        category: "content",
        message: "Konten cukup panjang. Pastikan pembacaan mudah dengan paragraf pendek.",
        impact: "low",
      });
    }

    // Keywords check
    const contentLower = content.toLowerCase();
    const missingKeywords = keywords.filter(k => !contentLower.includes(k.toLowerCase()));
    if (missingKeywords.length > 0 && keywords.length > 0) {
      suggestions.push({
        type: "error",
        category: "keywords",
        message: `Keywords berikut belum ada di konten: ${missingKeywords.join(", ")}`,
        impact: "high",
      });
    }

    // Readability
    if (readabilityScore < 50) {
      suggestions.push({
        type: "warning",
        category: "readability",
        message: "Teks mungkin sulit dibaca. Gunakan kalimat pendek dan paragraf lebih pendek.",
        impact: "medium",
      });
    }

    // Calculate overall score
    let score = 100;
    score -= suggestions.filter(s => s.type === "error").length * 15;
    score -= suggestions.filter(s => s.type === "warning").length * 5;
    score -= suggestions.filter(s => s.type === "suggestion").length * 2;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      suggestions,
      suggestedKeywords: this.extractKeywords(content),
      readabilityScore,
      wordCount,
      readingTimeMinutes,
    };
  }

  /**
   * Generate AI-powered content optimization
   * Uses BluePack if available, otherwise returns basic suggestions
   */
  async optimizeContent(request: SEOAnalysisRequest): Promise<{
    optimizedTitle?: string;
    optimizedExcerpt?: string;
    metaDescription?: string;
    hashtags?: string[];
    socialPost?: string;
  }> {
    if (!this.isEnabled()) {
      // Return basic optimization without AI
      return {
        optimizedTitle: request.title,
        optimizedExcerpt: request.excerpt,
        hashtags: this.generateHashtags(request.keywords || []),
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: env.bluepack.model,
          messages: [
            {
              role: "system",
              content: `Anda adalah ahli SEO dan content marketing untuk perusahaan konstruksi di Indonesia.
              
Tugas: Optimalkan konten untuk SEO dan social media.

Aturan:
1. Judul SEO: 50-60 karakter, mengandung kata kunci utama
2. Meta description: 150-160 karakter, ajakan bertindak
3. Hashtags: 5-8 hashtag yang relevan untuk konstruksi/renovasi
4. Social post: Caption menarik untuk LinkedIn/Instagram (maksimal 200 karakter)
5. Jawab dalam format JSON dengan keys: optimizedTitle, optimizedExcerpt, metaDescription, hashtags (array), socialPost

Format response: JSON saja, tanpa markdown code block.`
            },
            {
              role: "user",
              content: `Judul: ${request.title}
Konten: ${request.content.substring(0, 500)}...
Kata kunci: ${request.keywords?.join(", ") || "konstruksi, renovasi"}
URL: ${request.url || "N/A"}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          // If JSON parse fails, return basic optimization
          return {
            hashtags: this.generateHashtags(request.keywords || []),
          };
        }
      }
    } catch (error) {
      console.error("[SEO AI] Optimization failed:", error);
    }

    return {
      hashtags: this.generateHashtags(request.keywords || []),
    };
  }

  /**
   * Generate social media post with AI
   */
  async generateSocialPost(request: {
    platform: string;
    title: string;
    content: string;
    imageUrl?: string;
    tone?: "professional" | "casual" | "technical";
  }): Promise<{
    post: string;
    hashtags: string[];
  }> {
    const { platform, title, content, tone = "professional" } = request;

    // Generate basic post without AI
    const basicPost = this.generateBasicPost(platform, title, content);
    
    if (!this.isEnabled()) {
      return basicPost;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: env.bluepack.model,
          messages: [
            {
              role: "system",
              content: `Anda adalah social media manager untuk perusahaan konstruksi profesional di Indonesia.
              
Buat caption/post untuk platform: ${platform.toUpperCase()}

Aturan:
1. ${platform === "linkedin" ? "Professional tapi engaging, panjang 150-300 karakter" : "Casual dan visual, panjang 100-200 karakter"}
2. Termasuk CTA (call to action)
3. 5-8 hashtag yang relevan
4. Tone: ${tone === "professional" ? "Profesional dan terpercaya" : tone === "casual" ? "Ramah dan santai" : "Teknis dan informatif"}
5. Sertakan emoji yang sesuai (tidak berlebihan)

Format response JSON:
{
  "post": "caption di sini",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}

Format response: JSON saja.`
            },
            {
              role: "user",
              content: `Judul proyek: ${title}
Deskripsi: ${content.substring(0, 300)}...`
            }
          ],
          temperature: 0.7,
          max_tokens: 400,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      const responseContent = response.data?.choices?.[0]?.message?.content;
      if (responseContent) {
        try {
          return JSON.parse(responseContent);
        } catch {
          return basicPost;
        }
      }
    } catch (error) {
      console.error("[SEO AI] Social post generation failed:", error);
    }

    return basicPost;
  }

  /**
   * Generate hashtags from content
   */
  private generateHashtags(keywords: string[]): string[] {
    const baseHashtags = ["#SanataConstruction", "#RenovasiRumah", "#KonstruksiIndonesia"];
    const keywordTags = keywords.slice(0, 3).map(k => `#${k.replace(/\s+/g, "")}`);
    return [...new Set([...baseHashtags, ...keywordTags])];
  }

  /**
   * Generate basic social post without AI
   */
  private generateBasicPost(platform: string, title: string, content: string): {
    post: string;
    hashtags: string[];
  } {
    const truncated = content.substring(0, 150);
    const hashtags = [
      "#SanataConstruction",
      "#Konstruksi",
      "#Renovasi",
      "#RumahIdaman",
      "#ProyekBerkualitas"
    ];

    if (platform === "linkedin") {
      return {
        post: `${title}\n\n${truncated}...\n\nSelengkapnya, kunjungi link di bio.\n\n💼 Konsultasi gratis tersedia!`,
        hashtags,
      };
    } else if (platform === "instagram") {
      return {
        post: `${title}\n\n${truncated}...\n\nKlik link di bio untuk info lebih lanjut!\n\n👷‍♂️✨`,
        hashtags,
      };
    } else {
      return {
        post: `${title}: ${truncated}...`,
        hashtags,
      };
    }
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const words = this.countWords(text);
    const avgWordsPerSentence = words / Math.max(1, sentences);
    
    // Simple readability score based on sentence length
    let score = 100;
    if (avgWordsPerSentence > 25) score -= 20;
    else if (avgWordsPerSentence > 20) score -= 10;
    if (words < 100) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const freq: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 4) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
}

export const seoAIService = new SEOAIService();
export default seoAIService;
