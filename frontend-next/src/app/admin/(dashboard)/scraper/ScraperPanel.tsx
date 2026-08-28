"use client";

import { useState } from "react";
import {
  Link2,
  Rss,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  Clock,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
} from "lucide-react";
import { PageHeader, Panel, Badge, EmptyState, inputClass, selectClass } from "@/components/admin/ui";
import { adminApi } from "@/lib/clientApi";

interface ScrapeResult {
  id: string;
  title: string;
  slug: string;
  status: string;
  sourceUrl?: string;
}

interface RssSource {
  name: string;
  url: string;
  categoryId?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  articles: ScrapeResult[];
}

interface PreviewData {
  title: string;
  excerpt: string;
  bodyLength: number;
  coverImage?: string;
  author?: string;
  publishedAt?: string;
  sourceUrl: string;
  sourceName?: string;
  wordCount: number;
  readingTime: number;
  slug: string;
}

function StatusBadge({ success }: { success: boolean }) {
  return success ? (
    <Badge tone="success">
      <CheckCircle2 size={12} className="mr-1" /> Berhasil
    </Badge>
  ) : (
    <Badge tone="danger">
      <XCircle size={12} className="mr-1" /> Gagal
    </Badge>
  );
}

export function ScraperPanel() {
  // Single URL scrape state
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<ScrapeResult | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Preview state
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // RSS import state
  const [rssSources, setRssSources] = useState<RssSource[]>([]);
  const [rssLoading, setRssLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // History state
  const [history, setHistory] = useState<ScrapeResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Handle single URL scrape
  const handleScrape = async () => {
    if (!url) return;

    setSingleLoading(true);
    setSingleError(null);
    setSingleResult(null);
    setPreviewData(null);

    try {
      const res = await adminApi.post<{ success: boolean; data: ScrapeResult; message: string }>("/scraper/scrape", {
        url,
        categoryId: categoryId || undefined,
        publishImmediately,
      });

      if (res.success) {
        setSingleResult(res.data);
        setHistory((prev) => [res.data, ...prev.slice(0, 9)]);
      } else {
        setSingleError(res.message || "Gagal mengimpor konten");
      }
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }

    setSingleLoading(false);
  };

  // Handle preview
  const handlePreview = async () => {
    if (!url) return;

    setPreviewLoading(true);
    setSingleResult(null);
    setSingleError(null);

    try {
      const res = await adminApi.post<{ success: boolean; data: PreviewData }>("/scraper/preview", {
        url,
      });

      if (res.success) {
        setPreviewData(res.data);
      } else {
        setSingleError("Tidak dapat mengambil pratinjau");
      }
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }

    setPreviewLoading(false);
  };

  // Handle URL validation
  const handleValidate = async () => {
    if (!url) return;

    try {
      const res = await adminApi.get<{ success: boolean; data: { valid: boolean; canScrape: boolean } }>(
        `/scraper/validate-url?url=${encodeURIComponent(url)}`
      );

      if (res.data.canScrape) {
        setSingleError(null);
      } else {
        setSingleError("URL tidak dapat di-scrape");
      }
    } catch {
      // Ignore validation errors
    }
  };

  // Add RSS source
  const addRssSource = () => {
    setRssSources((prev) => [...prev, { name: "", url: "" }]);
  };

  // Remove RSS source
  const removeRssSource = (index: number) => {
    setRssSources((prev) => prev.filter((_, i) => i !== index));
  };

  // Update RSS source
  const updateRssSource = (index: number, field: keyof RssSource, value: string) => {
    setRssSources((prev) =>
      prev.map((source, i) => (i === index ? { ...source, [field]: value } : source))
    );
  };

  // Handle RSS import
  const handleRssImport = async () => {
    const validSources = rssSources.filter((s) => s.url && s.name);
    if (validSources.length === 0) return;

    setRssLoading(true);
    setImportResult(null);

    try {
      const res = await adminApi.post<{ success: boolean; data: ImportResult }>("/scraper/rss", {
        sources: validSources,
        limitPerSource: 10,
        publishImmediately,
      });

      if (res.success) {
        setImportResult(res.data);
        setHistory((prev) => [...res.data.articles, ...prev.slice(0, 20 - res.data.articles.length)]);
      }
    } catch (err) {
      console.error("RSS import error:", err);
    }

    setRssLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Konten"
        title="Article Scraper"
        description="Impor artikel dari URL tunggal atau RSS feed untuk mengisi konten website."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Single URL Scraper */}
        <Panel
          title="Scrape URL Tunggal"
          description="Ambil artikel dari satu URL dan buat sebagai draft"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                URL Artikel
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://contoh.com/artikel-judul-artikel"
                className={inputClass}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Kategori (opsional)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Tanpa kategori</option>
                  {/* Categories will be loaded dynamically */}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Terbitkan langsung
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={!url || previewLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                Pratinjau
              </button>

              <button
                onClick={handleScrape}
                disabled={!url || singleLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-50"
              >
                {singleLoading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Scrape & Import
              </button>
            </div>

            {singleError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle size={16} />
                {singleError}
              </div>
            )}

            {singleResult && (
              <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="font-medium text-emerald-300">Konten berhasil diimpor!</span>
                </div>
                <div className="space-y-1 text-sm text-slate-300">
                  <p>
                    <span className="text-slate-400">Judul:</span> {singleResult.title}
                  </p>
                  <p>
                    <span className="text-slate-400">Slug:</span> /{singleResult.slug}
                  </p>
                  <p>
                    <span className="text-slate-400">Status:</span>{" "}
                    <Badge tone={singleResult.status === "PUBLISHED" ? "success" : "warning"}>
                      {singleResult.status}
                    </Badge>
                  </p>
                </div>
                <a
                  href={`/admin/contents?search=${encodeURIComponent(singleResult.title)}`}
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Lihat di daftar konten <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </Panel>

        {/* Preview Panel */}
        <Panel title="Pratinjau Konten" description="Hasil ekstraksi dari URL yang dimasukkan">
          {previewData ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="font-semibold text-white">{previewData.title}</h4>
                {previewData.excerpt && (
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">{previewData.excerpt}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-3">
                  <FileText size={14} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Kata</p>
                    <p className="font-medium text-white">{previewData.wordCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-3">
                  <Clock size={14} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Waktu Baca</p>
                    <p className="font-medium text-white">{previewData.readingTime} menit</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sumber:</span>
                  <span className="text-white">{previewData.sourceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Slug:</span>
                  <code className="text-cyan-400">/{previewData.slug}</code>
                </div>
                {previewData.author && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Penulis:</span>
                    <span className="text-white">{previewData.author}</span>
                  </div>
                )}
              </div>

              {previewData.coverImage && (
                <div>
                  <p className="mb-2 text-xs text-slate-400">Gambar Cover:</p>
                  <img
                    src={previewData.coverImage}
                    alt="Cover"
                    className="h-32 w-full rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Eye size={20} />}
              title="Belum ada pratinjau"
              description="Masukkan URL dan klik tombol Pratinjau untuk melihat hasil ekstraksi."
            />
          )}
        </Panel>
      </div>

      {/* RSS Import */}
      <Panel
        title="Impor dari RSS Feed"
        description="Impor beberapa artikel sekaligus dari RSS/Atom feed"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Tambahkan RSS feed untuk mengimpor artikel secara otomatis.
            </p>
            <button
              onClick={addRssSource}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            >
              <Rss size={12} />
              Tambah Feed
            </button>
          </div>

          {rssSources.length > 0 ? (
            <div className="space-y-3">
              {rssSources.map((source, index) => (
                <div key={index} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={source.name}
                      onChange={(e) => updateRssSource(index, "name", e.target.value)}
                      placeholder="Nama Feed (mis: Blog Saya)"
                      className={inputClass}
                    />
                    <input
                      type="url"
                      value={source.url}
                      onChange={(e) => updateRssSource(index, "url", e.target.value)}
                      placeholder="https://contoh.com/feed.xml"
                      className={inputClass}
                    />
                  </div>
                  <button
                    onClick={() => removeRssSource(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <Rss size={24} className="mx-auto text-slate-600" />
              <p className="mt-2 text-sm text-slate-500">Belum ada feed ditambahkan</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Terbitkan langsung setelah impor
            </label>

            <button
              onClick={handleRssImport}
              disabled={rssSources.filter((s) => s.url && s.name).length === 0 || rssLoading}
              className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-50"
            >
              {rssLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {rssLoading ? "Mengimpor..." : "Import dari RSS"}
            </button>
          </div>

          {importResult && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h4 className="font-medium text-white">Hasil Impor</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{importResult.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{importResult.success}</p>
                  <p className="text-xs text-slate-500">Berhasil</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{importResult.skipped}</p>
                  <p className="text-xs text-slate-500">Dilewati</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{importResult.failed}</p>
                  <p className="text-xs text-slate-500">Gagal</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* History */}
      {history.length > 0 && (
        <Panel
          title="Riwayat Impor"
          description="10 impor terakhir"
          actions={
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300"
            >
              {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {showHistory ? "Sembunyikan" : "Tampilkan"}
            </button>
          }
        >
          {showHistory && (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge success={item.status === "PUBLISHED" || item.status === "DRAFT"} />
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{item.title}</p>
                      <p className="text-xs text-slate-500">/{item.slug}</p>
                    </div>
                  </div>
                  <a
                    href={`/admin/contents?search=${encodeURIComponent(item.title)}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
                  >
                    <Edit3 size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Tips */}
      <Panel title="Tips Penggunaan" className="bg-slate-900/50">
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            Gunakan URL artikel langsung, bukan halaman utama website
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            RSS feed sebaiknya hanya mengimpor artikel terbaru untuk menghindari duplikasi
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
            Selalu review konten hasil scrape sebelum menerbitkannya
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
            Perhatikan hak cipta saat mengimpor konten dari sumber lain
          </li>
        </ul>
      </Panel>
    </div>
  );
}
