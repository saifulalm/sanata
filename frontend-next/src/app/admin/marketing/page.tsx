"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Eye,
  TrendingUp,
  Users,
  Megaphone,
  BarChart3,
  Plus,
  FileUp,
  ArrowRight,
  MessageSquare,
  Instagram,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Copy,
  Trash2,
  MoreHorizontal,
  Filter,
  Search,
  Zap,
  Target,
  PieChart,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
  Toolbar,
  EmptyState,
  TableWrap,
  Th,
  Td,
  Tr,
  inputClass,
  selectClass,
} from "@/components/admin/ui";

// Sample data for marketing dashboard
const overviewStats = [
  {
    label: "Total Kampanye",
    value: "24",
    icon: <Megaphone size={20} />,
    href: "/admin/marketing/campaigns",
    trend: { value: 12, direction: "up" as const },
  },
  {
    label: "Pesan Terkirim",
    value: "12,847",
    icon: <Send size={20} />,
    href: "/admin/marketing/campaigns",
    trend: { value: 8, direction: "up" as const },
  },
  {
    label: "Tingkat Buka",
    value: "34.2%",
    icon: <Eye size={20} />,
    trend: { value: 5, direction: "up" as const },
  },
  {
    label: "Konversi",
    value: "2.8%",
    icon: <Target size={20} />,
    trend: { value: 12, direction: "up" as const },
  },
];

const recentCampaigns = [
  {
    id: "1",
    name: "Promo Ramadan 2026",
    type: "whatsapp",
    status: "completed",
    sent: 3250,
    delivered: 3180,
    opened: 1245,
    converted: 89,
    date: "2026-03-15",
  },
  {
    id: "2",
    name: "Layanan AHSP Baru",
    type: "email",
    status: "sending",
    sent: 1850,
    delivered: 1820,
    opened: 0,
    converted: 0,
    date: "2026-03-14",
  },
  {
    id: "3",
    name: "Follow-up Penawaran",
    type: "multi",
    status: "scheduled",
    sent: 0,
    delivered: 0,
    opened: 0,
    converted: 0,
    date: "2026-03-18",
  },
  {
    id: "4",
    name: "Instagram Story Promo",
    type: "instagram",
    status: "draft",
    sent: 0,
    delivered: 0,
    opened: 0,
    converted: 0,
    date: null,
  },
];

const channelStats = [
  { channel: "WhatsApp", sent: 5847, openRate: 42.5, conversions: 156 },
  { channel: "Email", sent: 4200, openRate: 28.3, conversions: 89 },
  { channel: "Instagram", sent: 2800, openRate: 35.1, conversions: 45 },
];

const performanceData = [
  { date: "Sen", sent: 120, opened: 45, converted: 3 },
  { date: "Sel", sent: 180, opened: 72, converted: 5 },
  { date: "Rab", sent: 150, opened: 58, converted: 4 },
  { date: "Kam", sent: 220, opened: 95, converted: 8 },
  { date: "Jum", sent: 200, opened: 82, converted: 6 },
  { date: "Sab", sent: 80, opened: 28, converted: 2 },
  { date: "Min", sent: 40, opened: 15, converted: 1 },
];

const quickActions = [
  {
    id: "1",
    label: "Buat Kampanye",
    icon: <Plus size={18} />,
    href: "/admin/marketing/campaigns/new",
    color: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20",
  },
  {
    id: "2",
    label: "Impor Kontak",
    icon: <FileUp size={18} />,
    href: "/admin/marketing/contacts",
    color: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
  },
  {
    id: "3",
    label: "Kelola Template",
    icon: <FileUp size={18} />,
    href: "/admin/marketing/templates",
    color: "text-amber-300 bg-amber-300/10 border-amber-300/20",
  },
  {
    id: "4",
    label: "Lihat Analytics",
    icon: <BarChart3 size={18} />,
    href: "/admin/marketing/analytics",
    color: "text-purple-300 bg-purple-300/10 border-purple-300/20",
  },
];

function getChannelIcon(type: string) {
  switch (type) {
    case "whatsapp":
      return <MessageSquare size={14} className="text-green-400" />;
    case "email":
      return <Mail size={14} className="text-blue-400" />;
    case "instagram":
      return <Instagram size={14} className="text-pink-400" />;
    case "multi":
      return <Zap size={14} className="text-yellow-400" />;
    default:
      return <Megaphone size={14} className="text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge tone="success">Selesai</Badge>;
    case "sending":
      return <Badge tone="info">Mengirim</Badge>;
    case "scheduled":
      return <Badge tone="warning">Terjadwal</Badge>;
    case "draft":
      return <Badge tone="neutral">Draf</Badge>;
    case "paused":
      return <Badge tone="warning">Dijeda</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export default function MarketingDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCampaigns = recentCampaigns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Dashboard Marketing"
        description="Kelola kampanye, kontak, dan analisis pemasaran"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/marketing/campaigns/new" className={btn("primary")}>
              <Plus size={15} />
              Kampanye Baru
            </Link>
          </div>
        }
      />

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, i) => (
          <Link
            key={i}
            href={stat.href || "#"}
            className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition hover:border-cyan-300/20 hover:bg-white/[0.05]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400">
              {stat.icon}
            </div>
            <div className="text-2xl font-semibold text-white">{stat.value}</div>
            <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
            {stat.trend && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendingUp
                  size={12}
                  className={stat.trend.direction === "up" ? "text-emerald-400" : "text-red-400"}
                />
                <span
                  className={
                    stat.trend.direction === "up" ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {stat.trend.value}%
                </span>
                <span className="text-slate-500">vs minggu lalu</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`flex items-center gap-3 rounded-xl border p-4 transition hover:bg-white/[0.05] ${action.color}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-current/20 bg-current/10">
              {action.icon}
            </span>
            <span className="font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Campaigns */}
        <Panel
          title="Kampanye Terbaru"
          className="lg:col-span-2"
          actions={
            <Link
              href="/admin/marketing/campaigns"
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-200"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          }
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kampanye..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
            <button className={btn("secondary", "sm")}>
              <Filter size={14} />
              Filter
            </button>
          </div>

          <TableWrap>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <Th>Kampanye</Th>
                  <Th>Tipe</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Terkirim</Th>
                  <Th className="text-right">Tingkat Buka</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <Tr key={campaign.id}>
                    <Td>
                      <Link
                        href={`/admin/marketing/campaigns/${campaign.id}`}
                        className="font-medium text-cyan-200 hover:text-cyan-100"
                      >
                        {campaign.name}
                      </Link>
                      {campaign.date && (
                        <p className="mt-0.5 text-xs text-slate-500">{campaign.date}</p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {getChannelIcon(campaign.type)}
                        <span className="capitalize">{campaign.type}</span>
                      </div>
                    </Td>
                    <Td>{getStatusBadge(campaign.status)}</Td>
                    <Td className="text-right">{campaign.sent.toLocaleString()}</Td>
                    <Td className="text-right">
                      {campaign.sent > 0
                        ? `${((campaign.opened / campaign.delivered) * 100).toFixed(1)}%`
                        : "-"}
                    </Td>
                    <Td>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                        <MoreHorizontal size={16} />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        {/* Channel Performance */}
        <Panel title="Performa Channel" description="Statistik berdasarkan channel">
          <div className="space-y-4">
            {channelStats.map((channel, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {channel.channel === "WhatsApp" && (
                      <MessageSquare size={18} className="text-green-400" />
                    )}
                    {channel.channel === "Email" && <Mail size={18} className="text-blue-400" />}
                    {channel.channel === "Instagram" && (
                      <Instagram size={18} className="text-pink-400" />
                    )}
                    <span className="font-medium text-white">{channel.channel}</span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {channel.sent.toLocaleString()} terkirim
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">Tingkat Buka</span>
                      <span className="text-cyan-300">{channel.openRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300"
                        style={{ width: `${channel.openRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">Konversi</span>
                      <span className="text-emerald-300">{channel.conversions}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/marketing/analytics"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 p-3 text-sm text-slate-400 hover:border-cyan-300/30 hover:text-cyan-300"
          >
            <PieChart size={16} />
            Lihat Analisis Lengkap
          </Link>
        </Panel>
      </div>

      {/* Performance Chart */}
      <Panel title="Performa 7 Hari Terakhir">
        <div className="h-64">
          <div className="flex h-full items-end justify-between gap-2">
            {performanceData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: "180px" }}>
                  <div
                    className="w-6 rounded-t-md bg-cyan-400/60 transition-all hover:bg-cyan-400"
                    style={{ height: `${(day.sent / 220) * 100}%` }}
                    title={`Terkirim: ${day.sent}`}
                  />
                  <div
                    className="w-6 rounded-t-md bg-emerald-400/60 transition-all hover:bg-emerald-400"
                    style={{ height: `${(day.opened / 95) * 100}%` }}
                    title={`Dibuka: ${day.opened}`}
                  />
                  <div
                    className="w-6 rounded-t-md bg-amber-400/60 transition-all hover:bg-amber-400"
                    style={{ height: `${(day.converted / 8) * 100}%` }}
                    title={`Dikonversi: ${day.converted}`}
                  />
                </div>
                <span className="text-xs text-slate-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-cyan-400/60" />
            <span className="text-xs text-slate-400">Terkirim</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-400/60" />
            <span className="text-xs text-slate-400">Dibuka</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-amber-400/60" />
            <span className="text-xs text-slate-400">Dikonversi</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
