/**
 * SEO AI Panel Component
 * AI-powered SEO analysis and social media post generation
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Search,
  FileText,
  Share2,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Wand2,
} from "lucide-react";
import { Panel, Badge, EmptyState, inputClass, selectClass } from "@/components/admin/ui";
import { adminApi } from "@/lib/clientApi";

interface SEOAnalysis {
  score: number;
  suggestions: SEOSuggestion[];
  suggestedKeywords: string[];
  readabilityScore: number;
  wordCount: number;
  readingTimeMinutes: number;
}

interface SEOSuggestion {
  type: "error" | "warning" | "suggestion";
  category: string;
  message: string;
  impact: string;
}

interface SocialPost {
  platform: string;
  post: string;
  hashtags: string[];
  success: boolean;
  error?: string;
}

interface SEOAIPanelProps {
  title?: string;
  content?: string;
  excerpt?: string;
  url?: string;
  keywords?: string[];
  onApplyOptimized?: (data: { title?: string; excerpt?: string }) => void;
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-400" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-400" },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "text-sky-400" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-indigo-400" },
];

export function SEOAIPanel({
  title = "",
  content = "",
  excerpt = "",
  url = "",
  keywords = [],
  onApplyOptimized,
}: SEOAIPanelProps) {
  const [aiStatus, setAIStatus] = useState<{ enabled: boolean } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [optimized, setOptimized] = useState<{
    optimizedTitle?: string;
    optimizedExcerpt?: string;
    metaDescription?: string;
    hashtags?: string[];
  } | null>(null);
  const [socialPosts, setSocialPosts] = useState<Record<string, SocialPost>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "optimize" | "social">("analysis");

  // Check AI status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await adminApi.get<{ success: boolean; data: { aiEnabled: boolean } }>("/ai/seo/status");
        if (res.success) {
          setAIStatus({ enabled: res.data.aiEnabled });
        }
      } catch {
        setAIStatus({ enabled: false });
      }
    }
    checkStatus();
  }, []);

  // Analyze content
  const handleAnalyze = useCallback(async () => {
    if (!title || !content) return;
    
    setAnalyzing(true);
    try {
      const res = await adminApi.post<{ success: boolean; data: SEOAnalysis }>("/ai/seo/analyze", {
        title,
        content,
        excerpt,
        url,
        keywords,
      });
      
      if (res.success) {
        setAnalysis(res.data);
        setActiveTab("analysis");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    }
    setAnalyzing(false);
  }, [title, content, excerpt, url, keywords]);

  // Optimize content
  const handleOptimize = useCallback(async () => {
    if (!title || !content) return;
    
    setOptimizing(true);
    try {
      const res = await adminApi.post<{ success: boolean; data: typeof optimized }>("/ai/seo/optimize", {
        title,
        content,
        excerpt,
        url,
        keywords,
      });
      
      if (res.success) {
        setOptimized(res.data);
        setActiveTab("optimize");
      }
    } catch (error) {
      console.error("Optimization failed:", error);
    }
    setOptimizing(false);
  }, [title, content, excerpt, url, keywords]);

  // Generate social posts
  const handleGenerateSocial = useCallback(async (platform: string) => {
    if (!title || !content) return;
    
    setGenerating(platform);
    try {
      const res = await adminApi.post<{ success: boolean; data: { post: string; hashtags: string[] } }>(
        "/ai/seo/social/generate",
        { platform, title, content }
      );
      
      if (res.success) {
        setSocialPosts(prev => ({
          ...prev,
          [platform]: {
            platform,
            ...res.data,
            success: true,
          },
        }));
        setActiveTab("social");
      }
    } catch (error) {
      console.error("Social post generation failed:", error);
      setSocialPosts(prev => ({
        ...prev,
        [platform]: {
          platform,
          post: "",
          hashtags: [],
          success: false,
          error: "Gagal membuat post",
        },
      }));
    }
    setGenerating(null);
  }, [title, content]);

  // Generate all platforms
  const handleGenerateAll = useCallback(async () => {
    for (const platform of PLATFORMS) {
      await handleGenerateSocial(platform.id);
    }
  }, [handleGenerateSocial]);

  // Copy to clipboard
  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Apply optimized content
  const handleApply = useCallback(() => {
    if (optimized && onApplyOptimized) {
      onApplyOptimized({
        title: optimized.optimizedTitle,
        excerpt: optimized.optimizedExcerpt || optimized.metaDescription,
      });
    }
  }, [optimized, onApplyOptimized]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-4">
      {/* AI Status Banner */}
      {!aiStatus?.enabled && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <AlertTriangle size={20} className="text-amber-400" />
          <div>
            <p className="font-medium text-amber-300">AI Enhancement Tidak Aktif</p>
            <p className="text-sm text-amber-400/60">
              Fitur AI memerlukan BluePack API key. Grundfunctie tetap berjalan tanpa AI.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: "analysis", label: "Analisis SEO", icon: Search },
          { id: "optimize", label: "Optimasi", icon: Wand2 },
          { id: "social", label: "Social Media", icon: Share2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-desert-400 text-desert-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analysis Tab */}
      {activeTab === "analysis" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !title || !content}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-desert-400/30 bg-desert-400/10 px-4 py-2.5 text-sm font-semibold text-desert-400 transition hover:border-desert-400/60 hover:bg-desert-400/20 disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Analisis SEO
            </button>
          </div>

          {analysis && (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="relative h-16 w-16">
                  <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      strokeWidth="6"
                      className="stroke-white/10"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(analysis.score / 100) * 175.9} 175.9`}
                      className={getScoreColor(analysis.score)}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Skor SEO</p>
                  <p className="text-sm text-slate-400">
                    {analysis.wordCount.toLocaleString()} kata · {analysis.readingTimeMinutes} menit baca
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Readability</p>
                  <p className={`font-semibold ${analysis.readabilityScore >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
                    {analysis.readabilityScore}%
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300">Saran Perbaikan</h4>
                {analysis.suggestions.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    <CheckCircle2 size={16} />
                    Tidak ada masalah ditemukan!
                  </div>
                ) : (
                  analysis.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        suggestion.type === "error"
                          ? "border-red-500/30 bg-red-500/10"
                          : suggestion.type === "warning"
                          ? "border-amber-500/30 bg-amber-500/10"
                          : "border-blue-500/30 bg-blue-500/10"
                      }`}
                    >
                      {suggestion.type === "error" ? (
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                      ) : (
                        <TrendingUp size={16} className="mt-0.5 shrink-0 text-amber-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-slate-200">{suggestion.message}</p>
                        <Badge
                          tone={
                            suggestion.impact === "high"
                              ? "danger"
                              : suggestion.impact === "medium"
                              ? "warning"
                              : "neutral"
                          }
                          className="mt-1"
                        >
                          Impact: {suggestion.impact}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optimize Tab */}
      {activeTab === "optimize" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleOptimize}
              disabled={optimizing || !title || !content}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-desert-400/30 bg-desert-400/10 px-4 py-2.5 text-sm font-semibold text-desert-400 transition hover:border-desert-400/60 hover:bg-desert-400/20 disabled:opacity-50"
            >
              {optimizing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              Generate Optimized Content
            </button>
          </div>

          {optimized && (
            <div className="space-y-4">
              {/* Optimized Title */}
              {optimized.optimizedTitle && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Judul Optimized
                    </label>
                    <button
                      onClick={() => handleCopy(optimized.optimizedTitle!, "title")}
                      className="flex items-center gap-1 text-xs text-desert-400 hover:text-desert-400"
                    >
                      <Copy size={12} />
                      {copied === "title" ? "Disalin!" : "Salin"}
                    </button>
                  </div>
                  <p className="text-white">{optimized.optimizedTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {optimized.optimizedTitle.length}/60 karakter
                  </p>
                </div>
              )}

              {/* Meta Description */}
              {(optimized.optimizedExcerpt || optimized.metaDescription) && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Meta Description
                    </label>
                    <button
                      onClick={() => handleCopy(optimized.metaDescription || optimized.optimizedExcerpt!, "meta")}
                      className="flex items-center gap-1 text-xs text-desert-400 hover:text-desert-400"
                    >
                      <Copy size={12} />
                      {copied === "meta" ? "Disalin!" : "Salin"}
                    </button>
                  </div>
                  <p className="text-slate-300">
                    {optimized.metaDescription || optimized.optimizedExcerpt}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(optimized.metaDescription || optimized.optimizedExcerpt || "").length}/160 karakter
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {optimized.hashtags && optimized.hashtags.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    Hashtags Suggested
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {optimized.hashtags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleCopy(tag, tag)}
                        className="rounded-full border border-desert-400/30 bg-desert-400/10 px-3 py-1 text-xs text-desert-400 hover:border-desert-400/60"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              {onApplyOptimized && (
                <button
                  onClick={handleApply}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-desert-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-desert-400"
                >
                  <CheckCircle2 size={16} />
                  Apply to Content
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === "social" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleGenerateAll}
              disabled={generating !== null || !title || !content}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-desert-400/30 bg-desert-400/10 px-4 py-2.5 text-sm font-semibold text-desert-400 transition hover:border-desert-400/60 hover:bg-desert-400/20 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}
              Generate All Platforms
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PLATFORMS.map((platform) => {
              const post = socialPosts[platform.id];
              const Icon = platform.icon;
              
              return (
                <div
                  key={platform.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={platform.color} />
                      <span className="font-medium text-white">{platform.name}</span>
                    </div>
                    {!post && (
                      <button
                        onClick={() => handleGenerateSocial(platform.id)}
                        disabled={generating !== null || !title || !content}
                        className="flex items-center gap-1 text-xs text-desert-400 hover:text-desert-400 disabled:opacity-50"
                      >
                        <Sparkles size={12} />
                        Generate
                      </button>
                    )}
                  </div>

                  {generating === platform.id && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </div>
                  )}

                  {post?.success && (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap text-sm text-slate-300">{post.post}</p>
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.map((tag) => (
                          <span key={tag} className="text-xs text-desert-400/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(post.post + "\n\n" + post.hashtags.join(" "), platform.id)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                        >
                          <Copy size={12} />
                          {copied === platform.id ? "Disalin!" : "Salin"}
                        </button>
                      </div>
                    </div>
                  )}

                  {post?.error && (
                    <p className="text-sm text-red-400">{post.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SEOAIPanel;
