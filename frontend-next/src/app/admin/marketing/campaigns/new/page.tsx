"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageSquare,
  Mail,
  Instagram,
  Zap,
  Users,
  Filter,
  Upload,
  Calendar,
  Clock,
  Eye,
  Send,
  ChevronDown,
  Image,
  FileText,
  X,
  Sparkles,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";

type CampaignType = "whatsapp" | "email" | "instagram" | "multi" | null;
type Step = 1 | 2 | 3 | 4 | 5;

const channelOptions = [
  {
    id: "whatsapp" as CampaignType,
    label: "WhatsApp",
    icon: <MessageSquare size={24} />,
    color: "text-green-400",
    bgColor: "bg-green-400/10 border-green-400/30",
    description: "Kirim pesan langsung ke WhatsApp pelanggan",
  },
  {
    id: "email" as CampaignType,
    label: "Email",
    icon: <Mail size={24} />,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30",
    description: "Kirim email marketing profesional",
  },
  {
    id: "instagram" as CampaignType,
    label: "Instagram",
    icon: <Instagram size={24} />,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10 border-pink-400/30",
    description: "Post dan story di Instagram",
  },
  {
    id: "multi" as CampaignType,
    label: "Multi-channel",
    icon: <Zap size={24} />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/30",
    description: "Kirim ke multiple channel sekaligus",
  },
];

const audienceOptions = [
  { id: "all", label: "Semua Kontak", count: 5430, icon: <Users size={16} /> },
  { id: "active", label: "Pelanggan Aktif", count: 2340, icon: <Sparkles size={16} /> },
  { id: "newsletter", label: "Newsletter Subscribers", count: 1850, icon: <Mail size={16} /> },
  { id: "whatsapp", label: "WhatsApp Contacts", count: 3200, icon: <MessageSquare size={16} /> },
];

const templateOptions = [
  { id: "promo", name: "Promo Diskon", category: "Promo" },
  { id: "welcome", name: "Selamat Datang", category: "Welcome" },
  { id: "followup", name: "Follow-up Penawaran", category: "Sales" },
  { id: "reminder", name: "Pengingat Meeting", category: "Meeting" },
  { id: "update", name: "Update Layanan", category: "Info" },
];

const steps = [
  { num: 1, label: "Channel" },
  { num: 2, label: "Audience" },
  { num: 3, label: "Konten" },
  { num: 4, label: "Jadwal" },
  { num: 5, label: "Review" },
];

export default function NewCampaignPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedChannel, setSelectedChannel] = useState<CampaignType>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedChannel !== null;
      case 2:
        return selectedAudience !== null;
      case 3:
        return messageBody.trim().length > 0;
      case 4:
        return scheduleType === "now" || (scheduleDate !== "" && scheduleTime !== "");
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const applyTemplate = (templateId: string) => {
    const templates: Record<string, { subject: string; body: string }> = {
      promo: {
        subject: "🎉 Promo Spesial untuk Anda!",
        body: "Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nKami memiliki promo spesial yang sayang untuk dilewatkan!\n\n🎁 Detail Promo:\n• Diskon hingga 25%\n• Bonus eksklusif\n• Berlaku sampai akhir bulan\n\nSegera manfaatkan kesempatan ini. Stok terbatas!\n\nWassalamu'alaikum",
      },
      welcome: {
        subject: "Selamat Datang!",
        body: "Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nSelamat bergabung bersama kami! Kami sangat senang Anda memilih layanan kami.\n\nTim kami siap membantu Anda. Jangan ragu untuk menghubungi kami jika ada pertanyaan.\n\nSalam hangat,\nTim Kami",
      },
    };
    const template = templates[templateId];
    if (template) {
      setMessageSubject(template.subject);
      setMessageBody(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleSubmit = () => {
    alert("Kampanye berhasil dibuat!");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/marketing/campaigns"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Buat Kampanye Baru</h1>
          <p className="mt-1 text-sm text-slate-400">Buat dan jadwalkan kampanye pemasaran</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition ${
                  currentStep > step.num
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-400"
                    : currentStep === step.num
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-400"
                    : "border-white/20 bg-white/5 text-slate-400"
                }`}
              >
                {currentStep > step.num ? <Check size={18} /> : step.num}
              </div>
              <span
                className={`ml-3 text-sm font-medium ${
                  currentStep >= step.num ? "text-white" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-4 h-px w-16 ${
                  currentStep > step.num ? "bg-cyan-400" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Select Channel */}
        {currentStep === 1 && (
          <Panel title="Pilih Channel Kampanye" description="Pilih channel yang akan digunakan untuk mengirim pesan">
            <div className="grid gap-4 sm:grid-cols-2">
              {channelOptions.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition ${
                    selectedChannel === channel.id
                      ? `${channel.bgColor} ring-2 ring-cyan-400/50`
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-current/20 ${channel.bgColor} ${channel.color}`}>
                    {channel.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{channel.label}</h3>
                    <p className="mt-1 text-sm text-slate-400">{channel.description}</p>
                  </div>
                  {selectedChannel === channel.id && (
                    <div className="ml-auto">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 text-black">
                        <Check size={14} />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Panel>
        )}

        {/* Step 2: Select Audience */}
        {currentStep === 2 && (
          <Panel title="Pilih Audience" description="Tentukan siapa yang akan menerima pesan ini">
            <div className="space-y-3">
              {audienceOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedAudience(option.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 transition ${
                    selectedAudience === option.id
                      ? "border-cyan-400/50 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400">
                      {option.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-sm text-slate-400">{option.count.toLocaleString()} kontak</p>
                    </div>
                  </div>
                  {selectedAudience === option.id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400 text-black">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
              <button className="flex w-full items-center justify-between rounded-xl border border-dashed border-white/20 p-4 text-slate-400 hover:border-cyan-300/30 hover:text-cyan-300">
                <div className="flex items-center gap-3">
                  <Filter size={20} />
                  <span>Filter Kontak Spesifik</span>
                </div>
                <ChevronDown size={18} />
              </button>
            </div>
          </Panel>
        )}

        {/* Step 3: Content */}
        {currentStep === 3 && (
          <Panel title="Buat Konten" description="Tulis pesan yang akan dikirimkan">
            {/* Campaign Name */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">Nama Kampanye</label>
              <input
                type="text"
                placeholder="Contoh: Promo Ramadan 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">Gunakan Template</label>
              <div className="flex flex-wrap gap-2">
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      selectedTemplate === template.id
                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            {selectedChannel !== "whatsapp" && selectedChannel !== "instagram" && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">Subjek Pesan</label>
                <input
                  type="text"
                  placeholder="Contoh: Promo Spesial untuk Anda!"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {/* Message Body */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Isi Pesan</label>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  <Eye size={14} />
                  Preview
                </button>
              </div>
              <textarea
                placeholder="Tulis pesan Anda di sini..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className={textareaClass}
                rows={8}
              />
              <p className="mt-2 text-xs text-slate-500">
                {messageBody.length} karakter
              </p>
            </div>

            {/* Media Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Lampirkan Media</label>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-slate-400 hover:border-cyan-300/30 hover:text-cyan-300">
                  <Image size={18} />
                  Upload Gambar
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-slate-400 hover:border-cyan-300/30 hover:text-cyan-300">
                  <FileText size={18} />
                  Upload PDF
                </button>
              </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111b21] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Preview Pesan</h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm text-white/90">{messageBody || "Pesan Anda akan muncul di sini..."}</p>
                  </div>
                  <p className="mt-2 text-xs text-white/40">WhatsApp Preview</p>
                </div>
              </div>
            )}
          </Panel>
        )}

        {/* Step 4: Schedule */}
        {currentStep === 4 && (
          <Panel title="Jadwal Pengiriman" description="Tentukan kapan pesan akan dikirim">
            <div className="space-y-6">
              {/* Schedule Type */}
              <div className="flex gap-4">
                <button
                  onClick={() => setScheduleType("now")}
                  className={`flex flex-1 items-center justify-center gap-3 rounded-xl border p-5 transition ${
                    scheduleType === "now"
                      ? "border-cyan-400/50 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <Send size={20} className={scheduleType === "now" ? "text-cyan-400" : "text-slate-400"} />
                  <div className="text-left">
                    <p className="font-semibold text-white">Kirim Sekarang</p>
                    <p className="text-sm text-slate-400">Pesan akan langsung dikirim</p>
                  </div>
                </button>
                <button
                  onClick={() => setScheduleType("schedule")}
                  className={`flex flex-1 items-center justify-center gap-3 rounded-xl border p-5 transition ${
                    scheduleType === "schedule"
                      ? "border-cyan-400/50 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <Calendar size={20} className={scheduleType === "schedule" ? "text-cyan-400" : "text-slate-400"} />
                  <div className="text-left">
                    <p className="font-semibold text-white">Jadwalkan</p>
                    <p className="text-sm text-slate-400">Pilih tanggal dan waktu</p>
                  </div>
                </button>
              </div>

              {/* Date & Time Picker */}
              {scheduleType === "schedule" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Tanggal</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Waktu</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Timezone Info */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Waktu Jakarta ( WIB / UTC+7 )</p>
                    <p className="text-xs text-slate-400">Semua waktu ditampilkan dalam zona waktu ini</p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <Panel title="Review & Konfirmasi" description="Periksa detail sebelum mengirim">
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">Detail Kampanye</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Nama</dt>
                      <dd className="text-white">{campaignName || "Tanpa nama"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Channel</dt>
                      <dd className="capitalize text-white">{selectedChannel}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Audience</dt>
                      <dd className="text-white">
                        {audienceOptions.find((o) => o.id === selectedAudience)?.label}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Jumlah Penerima</dt>
                      <dd className="text-white">
                        {audienceOptions.find((o) => o.id === selectedAudience)?.count.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">Jadwal</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Tipe</dt>
                      <dd className="text-white">{scheduleType === "now" ? "Kirim Sekarang" : "Terjadwal"}</dd>
                    </div>
                    {scheduleType === "schedule" && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-slate-400">Tanggal</dt>
                          <dd className="text-white">{scheduleDate}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-400">Waktu</dt>
                          <dd className="text-white">{scheduleTime}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              {/* Message Preview */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Preview Pesan</h3>
                {messageSubject && (
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="text-slate-500">Subjek:</span> {messageSubject}
                  </p>
                )}
                <div className="rounded-xl rounded-tl-sm bg-[#005c4b] px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm text-white/90">
                    {messageBody || "Tidak ada konten"}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-500">{messageBody.length} karakter</p>
              </div>

              {/* Final Actions */}
              <div className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-400">
                    <Send size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Siap untuk mengirim?</p>
                    <p className="text-sm text-slate-400">
                      {audienceOptions.find((o) => o.id === selectedAudience)?.count.toLocaleString()} pesan akan dikirim
                    </p>
                  </div>
                </div>
                <button onClick={handleSubmit} className={btn("primary")}>
                  <Send size={15} />
                  {scheduleType === "now" ? "Kirim Sekarang" : "Jadwalkan"}
                </button>
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-white/[0.07] pt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`${btn("secondary")} disabled:opacity-50`}
        >
          <ArrowLeft size={15} />
          Kembali
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            Langkah {currentStep} dari 5
          </span>
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`${btn("primary")} disabled:opacity-50`}
            >
              Lanjut
              <ArrowRight size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
