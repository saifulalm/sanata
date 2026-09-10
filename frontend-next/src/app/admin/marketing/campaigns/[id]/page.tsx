"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Send,
  Pause,
  Play,
  Copy,
  Share2,
  Mail,
  MessageSquare,
  Instagram,
  Users,
  Clock,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Calendar,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
  Toolbar,
  TableWrap,
  Th,
  Td,
  Tr,
  inputClass,
} from "@/components/admin/ui";

// Sample campaign data
const campaignData = {
  id: "1",
  name: "Promo Ramadan 2026",
  type: "whatsapp",
  status: "completed",
  audience: "Pelanggan Aktif",
  audienceCount: 3250,
  createdAt: "2026-03-14 08:30",
  scheduledAt: "2026-03-15 09:00",
  sentAt: "2026-03-15 09:00",
  completedAt: "2026-03-15 09:45",
  createdBy: "Admin",
  stats: {
    sent: 3250,
    delivered: 3180,
    opened: 1351,
    clicked: 456,
    converted: 89,
    bounced: 12,
    failed: 58,
  },
  content: {
    subject: "Promo Spesial Ramadan!",
    body: "Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nSalam sejahtera bagi kita semua. Di bulan suci Ramadan ini, kami memberikan harga spesial untuk semua layanan konsultasi AHSP dan RAB.\n\n🎁 Promo Ramadan:\n• Diskon 20% untuk konsultasi pertama\n• Gratis template AHSP terbaru\n• Prioritas scheduling untuk proyek Anda\n\nJangan sampai kehilangan kesempatan ini. Hubungi kami sekarang!\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh",
  },
};

const deliveryReport = [
  { id: 1, phone: "0812-****-3456", name: "Ahmad Fauzi", status: "delivered", openedAt: "09:02", clickedAt: "09:15" },
  { id: 2, phone: "0813-****-7890", name: "Budi Santoso", status: "delivered", openedAt: "09:05", clickedAt: null },
  { id: 3, phone: "0815-****-2345", name: "Dewi Lestari", status: "opened", openedAt: "09:08", clickedAt: "09:20" },
  { id: 4, phone: "0821-****-6789", name: "Eko Prasetyo", status: "clicked", openedAt: "09:10", clickedAt: "09:12" },
  { id: 5, phone: "0852-****-1234", name: "Fitri Handayani", status: "converted", openedAt: "09:15", clickedAt: "09:18" },
  { id: 6, phone: "0878-****-5678", name: "Gunawan Wijaya", status: "failed", openedAt: null, clickedAt: null, error: "Nomor tidak valid" },
  { id: 7, phone: "0896-****-9012", name: "Hendra Kusuma", status: "bounced", openedAt: null, clickedAt: null, error: "Nomor tidak terdaftar" },
];

const performanceData = [
  { hour: "09:00", sent: 500, delivered: 495, opened: 120 },
  { hour: "09:15", sent: 650, delivered: 640, opened: 180 },
  { hour: "09:30", sent: 800, delivered: 790, opened: 220 },
  { hour: "09:45", sent: 700, delivered: 695, opened: 195 },
  { hour: "10:00", sent: 400, delivered: 395, opened: 125 },
  { hour: "10:15", sent: 200, delivered: 195, opened: 65 },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "delivered":
      return <Badge tone="success">Terkirim</Badge>;
    case "opened":
      return <Badge tone="info">Dibuka</Badge>;
    case "clicked":
      return <Badge tone="warning">Diklik</Badge>;
    case "converted":
      return <Badge tone="success">Dikonversi</Badge>;
    case "failed":
      return <Badge tone="danger">Gagal</Badge>;
    case "bounced":
      return <Badge tone="danger">Bounced</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircle size={14} className="text-emerald-400" />;
    case "opened":
      return <Eye size={14} className="text-cyan-400" />;
    case "clicked":
      return <MousePointer size={14} className="text-amber-400" />;
    case "converted":
      return <Target size={14} className="text-emerald-400" />;
    case "failed":
      return <XCircle size={14} className="text-red-400" />;
    case "bounced":
      return <AlertCircle size={14} className="text-red-400" />;
    default:
      return <Clock size={14} className="text-slate-400" />;
  }
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"report" | "preview" | "chart">("report");
  const [reportFilter, setReportFilter] = useState("all");

  const { stats } = campaignData;
  const openRate = stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : "0";
  const clickRate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : "0";
  const conversionRate = stats.clicked > 0 ? ((stats.converted / stats.clicked) * 100).toFixed(1) : "0";

  const filteredReport = reportFilter === "all"
    ? deliveryReport
    : deliveryReport.filter(r => r.status === reportFilter);

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/marketing/campaigns"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-white">
              {campaignData.name}
            </h1>
            <Badge tone="success">Selesai</Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              {campaignData.type === "whatsapp" && <MessageSquare size={14} className="text-green-400" />}
              {campaignData.type === "email" && <Mail size={14} className="text-blue-400" />}
              {campaignData.type === "instagram" && <Instagram size={14} className="text-pink-400" />}
              <span className="capitalize">{campaignData.type}</span>
            </span>
            <span>•</span>
            <span>Dibuat {campaignData.createdAt}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={btn("secondary")}>
            <Edit3 size={15} />
            Edit
          </button>
          <button className={btn("secondary")}>
            <Copy size={15} />
            Duplikat
          </button>
          <button className={btn("danger")}>
            <Trash2 size={15} />
            Hapus
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Send size={16} />
            Terkirim
          </div>
          <div className="text-2xl font-semibold text-white">{stats.sent.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle size={16} />
            Terkirim
          </div>
          <div className="text-2xl font-semibold text-emerald-400">{stats.delivered.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">
            {((stats.delivered / stats.sent) * 100).toFixed(1)}% delivery rate
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Eye size={16} />
            Dibuka
          </div>
          <div className="text-2xl font-semibold text-cyan-400">{stats.opened.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">{openRate}% open rate</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <MousePointer size={16} />
            Diklik
          </div>
          <div className="text-2xl font-semibold text-amber-400">{stats.clicked.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">{clickRate}% click rate</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Target size={16} />
            Konversi
          </div>
          <div className="text-2xl font-semibold text-emerald-400">{stats.converted}</div>
          <div className="mt-1 text-xs text-slate-500">{conversionRate}% conversion</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setActiveTab("report")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "report"
              ? "bg-cyan-300/20 text-cyan-300"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 size={16} />
          Laporan Pengiriman
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "preview"
              ? "bg-cyan-300/20 text-cyan-300"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageCircle size={16} />
          Preview Pesan
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "chart"
              ? "bg-cyan-300/20 text-cyan-300"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp size={16} />
          Performa
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "report" && (
        <Panel
          title="Laporan Pengiriman"
          actions={
            <div className="flex items-center gap-2">
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300"
              >
                <option value="all">Semua</option>
                <option value="delivered">Terkirim</option>
                <option value="opened">Dibuka</option>
                <option value="clicked">Diklik</option>
                <option value="converted">Dikonversi</option>
                <option value="failed">Gagal</option>
              </select>
              <button className={btn("secondary", "sm")}>
                <Download size={14} />
                Export
              </button>
            </div>
          }
        >
          <TableWrap>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <Th>Kontak</Th>
                  <Th>Status</Th>
                  <Th>Waktu Buka</Th>
                  <Th>Waktu Klik</Th>
                  <Th>Error</Th>
                </tr>
              </thead>
              <tbody>
                {filteredReport.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <div>
                        <p className="font-medium text-white">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.phone}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(row.status)}
                        {getStatusBadge(row.status)}
                      </div>
                    </Td>
                    <Td className="text-slate-400">
                      {row.openedAt || "-"}
                    </Td>
                    <Td className="text-slate-400">
                      {row.clickedAt || "-"}
                    </Td>
                    <Td>
                      {row.error && (
                        <span className="text-xs text-red-400">{row.error}</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          {/* Summary Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-400">
                <span className="text-white">{stats.delivered}</span> terkirim
              </span>
              <span className="text-slate-400">
                <span className="text-cyan-300">{stats.opened}</span> dibuka
              </span>
              <span className="text-slate-400">
                <span className="text-amber-300">{stats.clicked}</span> diklik
              </span>
              <span className="text-slate-400">
                <span className="text-red-400">{stats.failed + stats.bounced}</span> gagal
              </span>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "preview" && (
        <Panel title="Preview Pesan">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* WhatsApp Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#111b21] p-4">
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <MessageSquare size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">{campaignData.name}</p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] px-4 py-2 max-w-[80%]">
                  <p className="whitespace-pre-wrap text-sm text-white/90">
                    {campaignData.content.body}
                  </p>
                </div>
                <p className="text-xs text-white/40">{campaignData.sentAt}</p>
              </div>
            </div>

            {/* Message Details */}
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Detail Pesan</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Channel</dt>
                    <dd className="flex items-center gap-1 capitalize text-white">
                      {campaignData.type === "whatsapp" && <MessageSquare size={14} className="text-green-400" />}
                      {campaignData.type === "email" && <Mail size={14} className="text-blue-400" />}
                      {campaignData.type}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Subjek</dt>
                    <dd className="text-white">{campaignData.content.subject}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Jumlah Karakter</dt>
                    <dd className="text-white">{campaignData.content.body.length}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Jadwal</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Dibuat</dt>
                    <dd className="text-white">{campaignData.createdAt}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Dijadwalkan</dt>
                    <dd className="text-white">{campaignData.scheduledAt}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Selesai</dt>
                    <dd className="text-white">{campaignData.completedAt}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Audience</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Grup</dt>
                    <dd className="text-white">{campaignData.audience}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Jumlah Penerima</dt>
                    <dd className="text-white">{campaignData.audienceCount.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Dibuat Oleh</dt>
                    <dd className="text-white">{campaignData.createdBy}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === "chart" && (
        <Panel title="Grafik Performa">
          <div className="h-80">
            <div className="flex h-full items-end justify-between gap-4 px-4">
              {performanceData.map((data, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end justify-center gap-1" style={{ height: "280px" }}>
                    <div
                      className="w-8 rounded-t-md bg-cyan-400/60 transition-all hover:bg-cyan-400"
                      style={{ height: `${(data.sent / 800) * 100}%` }}
                      title={`Terkirim: ${data.sent}`}
                    />
                    <div
                      className="w-8 rounded-t-md bg-emerald-400/60 transition-all hover:bg-emerald-400"
                      style={{ height: `${(data.delivered / 800) * 100}%` }}
                      title={`Terkirim: ${data.delivered}`}
                    />
                    <div
                      className="w-8 rounded-t-md bg-amber-400/60 transition-all hover:bg-amber-400"
                      style={{ height: `${(data.opened / 220) * 100}%` }}
                      title={`Dibuka: ${data.opened}`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{data.hour}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-cyan-400/60" />
              <span className="text-xs text-slate-400">Terkirim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-400/60" />
              <span className="text-xs text-slate-400">Terkirim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-amber-400/60" />
              <span className="text-xs text-slate-400">Dibuka</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-sm text-slate-400">Waktu Rata-rata Pembukaan</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">4.2 menit</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-sm text-slate-400">Waktu Rata-rata Klik</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">8.7 menit</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-sm text-slate-400">Peak Delivery</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">09:30</p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
