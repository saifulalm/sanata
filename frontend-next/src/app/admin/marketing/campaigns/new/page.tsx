"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageSquare,
  Mail,
  Image,
  Send,
  Users,
  Filter,
  Calendar,
  Clock,
  Upload,
  X,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import { Panel, Badge, btn } from "@/components/admin/ui";

type CampaignType = "WHATSAPP" | "EMAIL" | "INSTAGRAM" | "MULTI";
type AudienceType = "ALL" | "LIST" | "FILTER";
type ScheduleType = "NOW" | "SCHEDULE";

interface CampaignData {
  name: string;
  type: CampaignType;
  audienceType: AudienceType;
  audienceId?: string;
  audienceFilter?: Record<string, any>;
  audienceCount: number;
  content: {
    subject?: string;
    body: string;
    mediaUrl?: string;
  };
  scheduleType: ScheduleType;
  scheduledAt?: string;
  scheduledTime?: string;
}

const initialData: CampaignData = {
  name: "",
  type: "WHATSAPP",
  audienceType: "ALL",
  audienceCount: 0,
  content: {
    body: "",
  },
  scheduleType: "NOW",
};

const steps = [
  { id: 1, name: "Channel", description: "Pilih channel" },
  { id: 2, name: "Audience", description: "Pilih audience" },
  { id: 3, name: "Content", description: "Buat konten" },
  { id: 4, name: "Schedule", description: "Jadwalkan" },
  { id: 5, name: "Review", description: "Review & kirim" },
];

const channelOptions = [
  { id: "WHATSAPP", name: "WhatsApp", icon: MessageSquare, color: "emerald", description: "Kirim pesan via WhatsApp" },
  { id: "EMAIL", name: "Email", icon: Mail, color: "cyan", description: "Kirim email marketing" },
  { id: "INSTAGRAM", name: "Instagram", icon: Image, color: "pink", description: "Post ke Instagram" },
  { id: "MULTI", name: "Multi-Channel", icon: Send, color: "purple", description: "Kirim ke beberapa channel" },
];

const audienceOptions = [
  { id: "ALL", name: "Semua Kontak", icon: Users, count: 1250, description: "Kirim ke semua kontak" },
  { id: "LIST", name: "Broadcast List", icon: Filter, count: 850, description: "Pilih dari broadcast list" },
  { id: "FILTER", name: "Filter Khusus", icon: Filter, count: 0, description: "Filter berdasarkan tag, lokasi, dll" },
];

const broadcastLists = [
  { id: "1", name: "VIP Customers", count: 245 },
  { id: "2", name: "New Subscribers", count: 580 },
  { id: "3", name: "Inactive Users", count: 320 },
  { id: "4", name: "Product Interested", count: 180 },
  { id: "5", name: "Newsletter", count: 890 },
];

const templates = [
  { id: "1", name: "Promo Welcome", category: "WHATSAPP", body: "Selamat datang! Nikmati diskon 20% untuk pembelian pertama Anda dengan kode: WELCOME20" },
  { id: "2", name: "New Product Alert", category: "WHATSAPP", body: "Produk baru sudah tersedia! Cek koleksi terbaru kami di [link]" },
  { id: "3", name: "Newsletter Format", category: "EMAIL", subject: "Newsletter {{date}}", body: "Halo {{name}},\n\nBerita terbaru dari kami...\n\nSalam,\nTim kami" },
  { id: "4", name: "Special Offer", category: "OFFER", body: "Hanya hari ini! Gunakan kode {{code}} untuk potongan harga {{discount}}%" },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/30" },
  pink: { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/30" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/30" },
};

function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CampaignData>({
    ...initialData,
    type: (searchParams.get("type")?.toUpperCase() as CampaignType) || "WHATSAPP",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Simulated audience count based on selection
  useEffect(() => {
    let count = 0;
    if (data.audienceType === "ALL") {
      count = 1250;
    } else if (data.audienceType === "LIST" && data.audienceId) {
      const list = broadcastLists.find((l) => l.id === data.audienceId);
      count = list?.count || 0;
    } else if (data.audienceType === "FILTER") {
      count = 580; // Simulated filtered count
    }
    setData((prev) => ({ ...prev, audienceCount: count }));
  }, [data.audienceType, data.audienceId]);

  const updateData = (updates: Partial<CampaignData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setSelectedTemplate(template.id);
    setData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        body: template.body,
        ...(template.subject ? { subject: template.subject } : {}),
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // In production, this would call the API
    console.log("Submitting campaign:", data);
    router.push("/admin/marketing/campaigns");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/marketing/campaigns"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-white">
            Buat Campaign Baru
          </h1>
          <p className="text-sm text-slate-400">
            Langkah {currentStep} dari 5: {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-cyan-500 text-white"
                      : "border border-white/20 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${isActive ? "text-white" : "text-slate-500"}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-px w-12 sm:w-20 ${
                    isCompleted ? "bg-emerald-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Channel Selection */}
          {currentStep === 1 && (
            <Panel title="Pilih Channel" description="Pilih channel untuk campaign ini">
              <div className="grid gap-4 sm:grid-cols-2">
                {channelOptions.map((channel) => {
                  const Icon = channel.icon;
                  const cc = colorMap[channel.color];
                  const isSelected = data.type === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => updateData({ type: channel.id as CampaignType })}
                      className={`relative rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? `${cc.border} ${cc.bg} ring-2 ring-cyan-400/30`
                          : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${cc.bg}`}>
                        <Icon className={`h-6 w-6 ${cc.text}`} />
                      </div>
                      <h3 className="font-medium text-white">{channel.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{channel.description}</p>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Step 2: Audience Selection */}
          {currentStep === 2 && (
            <Panel title="Pilih Audience" description="Tentukan siapa yang akan menerima campaign ini">
              <div className="space-y-4">
                {audienceOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = data.audienceType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => updateData({ audienceType: option.id as AudienceType, audienceId: undefined })}
                      className={`relative w-full rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-cyan-500/30 bg-cyan-500/10 ring-2 ring-cyan-400/30"
                          : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                          <Icon className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{option.name}</h3>
                          <p className="text-sm text-slate-400">{option.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">{option.count.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">kontak</p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {data.audienceType === "LIST" && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h4 className="mb-3 text-sm font-medium text-white">Pilih Broadcast List</h4>
                    <div className="space-y-2">
                      {broadcastLists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => updateData({ audienceId: list.id })}
                          className={`flex w-full items-center justify-between rounded-lg border p-3 transition ${
                            data.audienceId === list.id
                              ? "border-cyan-500/30 bg-cyan-500/10"
                              : "border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                          }`}
                        >
                          <span className="text-sm text-white">{list.name}</span>
                          <span className="text-xs text-slate-500">{list.count} kontak</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {data.audienceType === "FILTER" && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h4 className="mb-3 text-sm font-medium text-white">Filter Kontak</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Tags</label>
                        <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                          <option>Semua Tags</option>
                          <option>VIP</option>
                          <option>New</option>
                          <option>Active</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Lokasi</label>
                        <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                          <option>Semua Lokasi</option>
                          <option>Jakarta</option>
                          <option>Surabaya</option>
                          <option>Bandung</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Status</label>
                        <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                          <option>Semua Status</option>
                          <option>Aktif</option>
                          <option>Tidak Aktif</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                      <span className="text-sm text-slate-400">Perkiraan kontak:</span>
                      <span className="font-semibold text-cyan-300">580 kontak</span>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Step 3: Content */}
          {currentStep === 3 && (
            <Panel title="Buat Konten" description="Tulis pesan untuk campaign ini">
              <div className="space-y-4">
                {/* Campaign Name */}
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Nama Campaign</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateData({ name: e.target.value })}
                    placeholder="Contoh: Promo中秋特惠活動"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                  />
                </div>

                {/* Templates */}
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Gunakan Template</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {templates
                      .filter((t) => t.category === data.type || t.category === "OFFER")
                      .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition ${
                            selectedTemplate === template.id
                              ? "border-cyan-500/30 bg-cyan-500/10"
                              : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                          }`}
                        >
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span className="text-white">{template.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Subject (Email only) */}
                {data.type === "EMAIL" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-slate-400">Subject Email</label>
                    <input
                      type="text"
                      value={data.content.subject || ""}
                      onChange={(e) => updateData({ content: { ...data.content, subject: e.target.value } })}
                      placeholder="Contoh: Newsletter中秋特惠"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                    />
                  </div>
                )}

                {/* Message Body */}
                <div>
                  <label className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Isi Pesan</span>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  </label>
                  <textarea
                    value={data.content.body}
                    onChange={(e) => updateData({ content: { ...data.content, body: e.target.value } })}
                    placeholder={data.type === "WHATSAPP" ? "Ketik pesan WhatsApp Anda...\n\nGunakan {{name}} untuk personalization" : "Ketik email Anda..."}
                    rows={8}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Gunakan {"{{name}}"}, {"{{email}}"}, atau {"{{code}}"} untuk personalization
                  </p>
                </div>

                {/* Media Upload */}
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Media (Opsional)</label>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-white/10 p-6 transition hover:border-white/20">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-slate-500" />
                        <p className="mt-2 text-sm text-slate-400">Klik untuk upload</p>
                        <p className="text-xs text-slate-500">PNG, JPG, PDF (max 10MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <Panel title="Jadwalkan Campaign" description="Tentukan kapan campaign akan dikirim">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => updateData({ scheduleType: "NOW" })}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      data.scheduleType === "NOW"
                        ? "border-cyan-500/30 bg-cyan-500/10 ring-2 ring-cyan-400/30"
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    {data.scheduleType === "NOW" && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15">
                        <Send className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Kirim Sekarang</h3>
                        <p className="text-sm text-slate-400">Campaign akan langsung dikirim</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateData({ scheduleType: "SCHEDULE" })}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      data.scheduleType === "SCHEDULE"
                        ? "border-cyan-500/30 bg-cyan-500/10 ring-2 ring-cyan-400/30"
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    {data.scheduleType === "SCHEDULE" && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                        <Calendar className="h-5 w-5 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Jadwalkan</h3>
                        <p className="text-sm text-slate-400">Pilih tanggal & waktu</p>
                      </div>
                    </div>
                  </button>
                </div>

                {data.scheduleType === "SCHEDULE" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm text-slate-400">Tanggal</label>
                      <input
                        type="date"
                        value={data.scheduledAt || ""}
                        onChange={(e) => updateData({ scheduledAt: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm text-slate-400">Waktu</label>
                      <input
                        type="time"
                        value={data.scheduledTime || ""}
                        onChange={(e) => updateData({ scheduledTime: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Panel title="Review & Kirim" description="Periksa kembali sebelum mengirim campaign">
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">Channel</p>
                    <p className="mt-1 font-medium text-white">{data.type}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">Audience</p>
                    <p className="mt-1 font-medium text-white">{data.audienceCount.toLocaleString()} kontak</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500">Jadwal</p>
                    <p className="mt-1 font-medium text-white">
                      {data.scheduleType === "NOW" ? "Sekarang" : `${data.scheduledAt} ${data.scheduledTime}`}
                    </p>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-white">Preview Konten</h4>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      <Eye className="h-3 w-3" />
                      Lihat Full
                    </button>
                  </div>
                  {data.content.subject && (
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-medium">Subject:</span> {data.content.subject}
                    </p>
                  )}
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-white/5 bg-white/2.5 p-3">
                    <p className="whitespace-pre-wrap text-sm text-white">{data.content.body}</p>
                  </div>
                </div>

                {/* Confirmation */}
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                    />
                    <div>
                      <p className="font-medium text-white">Saya yakin ingin mengirim campaign ini</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {data.audienceCount.toLocaleString()} kontak akan menerima pesan ini.
                        {data.scheduleType === "NOW"
                          ? " Campaign akan langsung dikirim."
                          : ` Campaign dijadwalkan untuk ${data.scheduledAt} ${data.scheduledTime}.`}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </Panel>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                currentStep === 1
                  ? "cursor-not-allowed border-white/10 text-slate-500"
                  : "border-white/10 text-white hover:bg-white/[0.05]"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Sebelumnya
            </button>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !data.type) ||
                  (currentStep === 2 && data.audienceCount === 0) ||
                  (currentStep === 3 && (!data.name || !data.content.body))
                }
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lanjut
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Send className="h-4 w-4" />
                {data.scheduleType === "NOW" ? "Kirim Sekarang" : "Jadwalkan Campaign"}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Panel title="Summary" description="Ringkasan campaign">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Channel</span>
                <span className="font-medium text-white">{data.type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Audience</span>
                <span className="font-medium text-white">{data.audienceCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <Badge tone="neutral">Draft</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Estimasi Cost</span>
                <span className="font-medium text-amber-300">Rp 0</span>
              </div>
            </div>
          </Panel>

          <Panel title="Tips" description="Tips untuk campaign sukses">
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-400" />
                Gunakan personalization {"{{name}}"} untuk engagement lebih tinggi
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-400" />
                Pastikan subject email menarik dan relevan
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-400" />
                Jadwalkan di jam kerja untuk hasil terbaik
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-semibold text-white">Preview Pesan</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {data.type === "WHATSAPP" && (
                <div className="rounded-xl bg-[#111B21] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-medium text-white">Business Name</p>
                      <p className="text-xs text-slate-400">online</p>
                    </div>
                  </div>
                  <div className="rounded-lg rounded-tl-none bg-emerald-600/30 p-3">
                    <p className="whitespace-pre-wrap text-sm text-white">
                      {data.content.body || "Pesan Anda akan muncul di sini..."}
                    </p>
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )}
              {data.type === "EMAIL" && (
                <div className="rounded-xl border border-white/10 bg-white p-4">
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-xs text-gray-500">From: Business Name</p>
                    <p className="font-medium text-gray-900">
                      {data.content.subject || "Subject email"}
                    </p>
                  </div>
                  <div className="py-3">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {data.content.body || "Isi email akan muncul di sini..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Memuat...</p>
      </div>
    </div>
  );
}

export default function NewCampaignPageWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewCampaignPage />
    </Suspense>
  );
}
