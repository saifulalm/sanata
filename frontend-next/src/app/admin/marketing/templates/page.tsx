"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  FileText,
  MessageSquare,
  Mail,
  Image,
  DollarSign,
  Copy,
  Edit2,
  Trash2,
  Eye,
  Star,
  Clock,
  Zap,
  X,
} from "lucide-react";
import { Panel, Badge, btn } from "@/components/admin/ui";

type TemplateCategory = "WHATSAPP" | "EMAIL" | "INSTAGRAM" | "OFFER" | "GENERAL";

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  subject?: string;
  body: string;
  variables: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

const mockTemplates: Template[] = [
  { id: "1", name: "Welcome Promo", category: "WHATSAPP", body: "Selamat datang! Nikmati diskon 20% untuk pembelian pertama Anda dengan kode: WELCOME20", variables: ["name", "code"], isFavorite: true, usageCount: 156, lastUsed: "2026-09-10", createdAt: "2026-08-01" },
  { id: "2", name: "New Product Alert", category: "WHATSAPP", body: "Produk baru sudah tersedia! Cek koleksi terbaru kami.\n\n{{product_link}}\n\nJangan sampai kehabisan!", variables: ["name", "product_link"], isFavorite: false, usageCount: 89, lastUsed: "2026-09-08", createdAt: "2026-08-15" },
  { id: "3", name: "Order Confirmation", category: "WHATSAPP", body: "Terima kasih! Pesanan Anda telah dikonfirmasi.\n\nOrder ID: {{order_id}}\nTotal: {{total}}\n\nKami akan segera memproses pesanan Anda.", variables: ["name", "order_id", "total"], isFavorite: true, usageCount: 234, lastUsed: "2026-09-11", createdAt: "2026-07-20" },
  { id: "4", name: "Weekly Newsletter", category: "EMAIL", subject: "Newsletter Mingguan - {{week}}", body: "Halo {{name}},\n\nBerikut berita terbaru dari kami minggu ini:\n\n{{news_items}}\n\nSalam,\nTim Kami", variables: ["name", "week", "news_items"], isFavorite: true, usageCount: 45, lastUsed: "2026-09-05", createdAt: "2026-08-10" },
  { id: "5", name: "Special Offer", category: "OFFER", body: "Hanya untuk Anda!\n\nGunakan kode {{code}} untuk mendapatkan potongan {{discount}}%\n\nBerlaku sampai {{end_date}}", variables: ["name", "code", "discount", "end_date"], isFavorite: false, usageCount: 67, lastUsed: "2026-09-09", createdAt: "2026-08-20" },
  { id: "6", name: "Flash Sale", category: "OFFER", body: "FLASH SALE!\n\n{{discount}}% OFF untuk {{product}}!\n\nWaktu terbatas hanya {{hours}} jam!\n\n{{link}}", variables: ["discount", "product", "hours", "link"], isFavorite: true, usageCount: 112, lastUsed: "2026-09-07", createdAt: "2026-08-25" },
  { id: "7", name: "New Post Announcement", category: "INSTAGRAM", body: "Post baru!\n\n{{caption}}\n\n{{hashtags}}", variables: ["caption", "hashtags"], isFavorite: false, usageCount: 34, lastUsed: "2026-09-06", createdAt: "2026-09-01" },
  { id: "8", name: "Bundle Promo", category: "OFFER", body: "Bundle Deal!\n\nBeli {{qty}} {{product}} dan dapatkan {{bonus}} GRATIS!\n\n{{link}}", variables: ["qty", "product", "bonus", "link"], isFavorite: false, usageCount: 23, lastUsed: "2026-08-30", createdAt: "2026-08-28" },
];

const categories = [
  { id: "ALL", name: "Semua", icon: FileText, color: "slate" },
  { id: "WHATSAPP", name: "WhatsApp", icon: MessageSquare, color: "emerald" },
  { id: "EMAIL", name: "Email", icon: Mail, color: "cyan" },
  { id: "INSTAGRAM", name: "Instagram", icon: Image, color: "pink" },
  { id: "OFFER", name: "Offer", icon: DollarSign, color: "amber" },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-300" },
  pink: { bg: "bg-pink-500/15", text: "text-pink-300" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-300" },
  slate: { bg: "bg-slate-500/15", text: "text-slate-300" },
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showPreview, setShowPreview] = useState<Template | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) || template.body.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || template.category === categoryFilter;
    const matchesFavorites = !showFavorites || template.isFavorite;
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const getCategoryIcon = (category: TemplateCategory) => {
    const icons: Record<TemplateCategory, typeof MessageSquare> = {
      WHATSAPP: MessageSquare,
      EMAIL: Mail,
      INSTAGRAM: Image,
      OFFER: DollarSign,
      GENERAL: FileText,
    };
    const colors: Record<TemplateCategory, string> = {
      WHATSAPP: "emerald",
      EMAIL: "cyan",
      INSTAGRAM: "pink",
      OFFER: "amber",
      GENERAL: "slate",
    };
    const Icon = icons[category];
    const cc = colorMap[colors[category]];
    return (
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cc.bg}`}>
        <Icon className={`h-4 w-4 ${cc.text}`} />
      </div>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Marketing
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Template Library
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola template pesan untuk campaign Anda
          </p>
        </div>
        <button className={btn("primary")}>
          <Plus size={15} />
          Template Baru
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const cc = colorMap[cat.color];
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? `${cc.bg} ${cc.text} border-${cat.color}-500/30`
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.name}
              <span className={`ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-xs ${
                isActive ? "bg-white/10" : "bg-white/5"
              }`}>
                {cat.id === "ALL" ? mockTemplates.length : mockTemplates.filter((t) => t.category === cat.id).length}
              </span>
            </button>
          );
        })}
        <div className="ml-auto">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              showFavorites
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <Star className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`} />
            Favorites
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(template.category)}
                <div>
                  <h3 className="font-medium text-white">{template.name}</h3>
                  <p className="text-xs text-slate-500">{template.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => copyToClipboard(template.body)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowPreview(template)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="line-clamp-3 text-sm text-slate-400">{template.body}</p>

            {/* Variables */}
            {template.variables.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {template.variables.map((v) => (
                  <span key={v} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-cyan-400">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {template.usageCount} uses
                </span>
                {template.lastUsed && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.lastUsed}
                  </span>
                )}
              </div>
              <button className={`${template.isFavorite ? "text-amber-400" : "text-slate-500 hover:text-amber-400"}`}>
                <Star className={`h-4 w-4 ${template.isFavorite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-white">Tidak ada template ditemukan</p>
          <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau buat template baru</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                {getCategoryIcon(showPreview.category)}
                <div>
                  <h3 className="font-semibold text-white">{showPreview.name}</h3>
                  <p className="text-xs text-slate-500">{showPreview.category}</p>
                </div>
              </div>
              <button onClick={() => setShowPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {showPreview.subject && (
                <div className="mb-4">
                  <p className="mb-1 text-xs text-slate-500">Subject:</p>
                  <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white">
                    {showPreview.subject}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs text-slate-500">Isi Pesan:</p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="whitespace-pre-wrap text-sm text-white">{showPreview.body}</p>
                </div>
              </div>
              {showPreview.variables.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-slate-500">Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {showPreview.variables.map((v) => (
                      <span key={v} className="rounded bg-cyan-500/15 px-3 py-1 text-sm text-cyan-300">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button onClick={() => copyToClipboard(showPreview.body)} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5">
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600">
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
