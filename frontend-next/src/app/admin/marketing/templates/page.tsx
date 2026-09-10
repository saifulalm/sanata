"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Grid,
  List,
  Edit3,
  Trash2,
  Copy,
  Eye,
  X,
  Mail,
  MessageSquare,
  Instagram,
  Zap,
  FileText,
  Tag,
  ChevronDown,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
  EmptyState,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";

interface Template {
  id: string;
  name: string;
  category: string;
  channel: string;
  preview: string;
  lastUsed?: string;
  usageCount: number;
}

const sampleTemplates: Template[] = [
  { id: "1", name: "Promo Diskon 20%", category: "Promo", channel: "whatsapp", preview: "Assalamu'alaikum! Dapatkan promo spesial...", lastUsed: "2026-03-15", usageCount: 45 },
  { id: "2", name: "Selamat Datang", category: "Welcome", channel: "whatsapp", preview: "Selamat bergabung! Kami senang...", lastUsed: "2026-03-10", usageCount: 120 },
  { id: "3", name: "Follow-up Penawaran", category: "Sales", channel: "email", preview: "Terima kasih atas kepercayaan Anda...", lastUsed: "2026-03-12", usageCount: 32 },
  { id: "4", name: "Pengingat Meeting", category: "Meeting", channel: "whatsapp", preview: "Reminder: Meeting besok pukul...", lastUsed: "2026-03-08", usageCount: 78 },
  { id: "5", name: "Update Layanan Baru", category: "Info", channel: "email", preview: "Kami telah menambahkan layanan baru...", lastUsed: "2026-03-05", usageCount: 25 },
  { id: "6", name: "Flash Sale 24 Jam", category: "Promo", channel: "multi", preview: "FLASH SALE! Berlaku 24 jam saja...", lastUsed: "2026-03-01", usageCount: 89 },
  { id: "7", name: "Terima Kasih", category: "General", channel: "whatsapp", preview: "Terima kasih telah...", lastUsed: "2026-02-28", usageCount: 156 },
  { id: "8", name: "Newsletter Mingguan", category: "Newsletter", channel: "email", preview: "Halo! Berikut update minggu ini...", lastUsed: "2026-02-25", usageCount: 67 },
];

const categories = ["Semua", "Promo", "Welcome", "Sales", "Meeting", "Info", "General", "Newsletter"];
const channels = ["Semua", "whatsapp", "email", "multi"];

function getChannelIcon(channel: string) {
  switch (channel) {
    case "whatsapp":
      return <MessageSquare size={14} className="text-green-400" />;
    case "email":
      return <Mail size={14} className="text-blue-400" />;
    case "instagram":
      return <Instagram size={14} className="text-pink-400" />;
    case "multi":
      return <Zap size={14} className="text-yellow-400" />;
    default:
      return <FileText size={14} className="text-slate-400" />;
  }
}

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [channelFilter, setChannelFilter] = useState("Semua");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", category: "Promo", channel: "whatsapp", content: "" });

  const filteredTemplates = sampleTemplates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Semua" || t.category === categoryFilter;
    const matchesChannel = channelFilter === "Semua" || t.channel === channelFilter;
    return matchesSearch && matchesCategory && matchesChannel;
  });

  const openPreview = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Template Library"
        description="Kelola template pesan untuk kampanye"
        actions={
          <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
            <Plus size={15} />
            Template Baru
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white"
        >
          {channels.map((ch) => (
            <option key={ch} value={ch}>{ch === "Semua" ? "Semua Channel" : ch}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-2 transition ${viewMode === "grid" ? "bg-cyan-400/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 transition ${viewMode === "list" ? "bg-cyan-400/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Templates Display */}
      {filteredTemplates.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/30"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(template.channel)}
                    <span className="text-xs text-slate-500 capitalize">{template.channel}</span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                    {template.category}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-white">{template.name}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-slate-400">{template.preview}</p>
                <div className="flex items-center justify-between border-t border-white/[0.07] pt-3">
                  <span className="text-xs text-slate-500">
                    {template.usageCount} kali digunakan
                  </span>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => openPreview(template)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                    >
                      <Eye size={14} />
                    </button>
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                      <Edit3 size={14} />
                    </button>
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Panel padded={false}>
            <div className="divide-y divide-white/[0.07]">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 transition hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      {getChannelIcon(template.channel)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      <p className="text-sm text-slate-400">{template.preview}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                        {template.category}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{template.usageCount} digunakan</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openPreview(template)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-300">
                        <Eye size={16} />
                      </button>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                        <Edit3 size={16} />
                      </button>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )
      ) : (
        <EmptyState
          icon={<FileText size={24} />}
          title="Tidak ada template"
          description="Buat template pertama untuk mempercepat pembuatan kampanye"
          action={
            <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
              <Plus size={15} />
              Buat Template
            </button>
          }
        />
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Template Baru</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Nama Template</label>
                <input
                  type="text"
                  placeholder="Contoh: Promo Diskon"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Kategori</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white"
                  >
                    {categories.filter(c => c !== "Semua").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Channel</label>
                  <select
                    value={newTemplate.channel}
                    onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="instagram">Instagram</option>
                    <option value="multi">Multi-channel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Konten Pesan</label>
                <textarea
                  placeholder="Tulis template pesan di sini..."
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className={textareaClass}
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateModal(false)} className={btn("secondary")}>
                  Batal
                </button>
                <button onClick={() => setShowCreateModal(false)} className={btn("primary")}>
                  Simpan Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{selectedTemplate.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  {getChannelIcon(selectedTemplate.channel)}
                  <span className="text-sm text-slate-400 capitalize">{selectedTemplate.channel}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-sm text-slate-400">{selectedTemplate.category}</span>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-200">{selectedTemplate.preview}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>Digunakan {selectedTemplate.usageCount} kali</span>
              {selectedTemplate.lastUsed && <span>Terakhir: {selectedTemplate.lastUsed}</span>}
            </div>
            <div className="mt-4 flex gap-2">
              <button className={`${btn("secondary")} flex-1`}>
                <Copy size={15} />
                Gunakan
              </button>
              <button className={`${btn("primary")} flex-1`}>
                <Edit3 size={15} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
