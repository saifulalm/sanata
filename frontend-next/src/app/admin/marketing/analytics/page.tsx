"use client";

import { useState } from "react";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  MessageSquare,
  Mail,
  Instagram,
  Zap,
  Eye,
  MousePointer,
  Target,
  Send,
  DollarSign,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
} from "@/components/admin/ui";

const dateRanges = [
  { id: "7d", label: "7 Hari" },
  { id: "30d", label: "30 Hari" },
  { id: "90d", label: "90 Hari" },
  { id: "custom", label: "Kustom" },
];

const channels = [
  { id: "all", label: "Semua Channel", icon: <Zap size={16} /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={16} className="text-green-400" /> },
  { id: "email", label: "Email", icon: <Mail size={16} className="text-blue-400" /> },
  { id: "instagram", label: "Instagram", icon: <Instagram size={16} className="text-pink-400" /> },
];

const performanceData = [
  { date: "Sen", sent: 1200, opened: 450, clicked: 120, converted: 25 },
  { date: "Sel", sent: 1450, opened: 580, clicked: 145, converted: 32 },
  { date: "Rab", sent: 1100, opened: 420, clicked: 98, converted: 18 },
  { date: "Kam", sent: 1680, opened: 720, clicked: 180, converted: 45 },
  { date: "Jum", sent: 1320, opened: 510, clicked: 125, converted: 28 },
  { date: "Sab", sent: 890, opened: 340, clicked: 78, converted: 15 },
  { date: "Min", sent: 560, opened: 210, clicked: 45, converted: 8 },
];

const campaignPerformance = [
  { name: "Promo Ramadan", channel: "whatsapp", sent: 3250, openRate: 42.5, ctr: 12.3, conversions: 89 },
  { name: "Layanan AHSP", channel: "email", sent: 1850, openRate: 28.3, ctr: 5.2, conversions: 34 },
  { name: "Follow-up", channel: "multi", sent: 2100, openRate: 35.1, ctr: 8.7, conversions: 56 },
  { name: "Newsletter", channel: "email", sent: 1200, openRate: 32.4, ctr: 6.8, conversions: 28 },
];

const channelComparison = [
  { channel: "WhatsApp", openRate: 42.5, ctr: 12.3, conversion: 4.2 },
  { channel: "Email", openRate: 28.3, ctr: 6.8, conversion: 2.1 },
  { channel: "Instagram", openRate: 35.1, ctr: 8.5, conversion: 3.5 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedChannel, setSelectedChannel] = useState("all");

  const totalSent = performanceData.reduce((acc, d) => acc + d.sent, 0);
  const totalOpened = performanceData.reduce((acc, d) => acc + d.opened, 0);
  const totalClicked = performanceData.reduce((acc, d) => acc + d.clicked, 0);
  const totalConverted = performanceData.reduce((acc, d) => acc + d.converted, 0);

  const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1);
  const avgCtr = ((totalClicked / totalOpened) * 100).toFixed(1);
  const avgConversion = ((totalConverted / totalClicked) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Analytics"
        description="Analisis performa kampanye marketing"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
            <button className={btn("secondary")}>
              <Download size={15} />
              Export
            </button>
          </div>
        }
      />

      {/* Channel Tabs */}
      <div className="flex flex-wrap gap-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setSelectedChannel(channel.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
              selectedChannel === channel.id
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {channel.icon}
            {channel.label}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Send size={16} />
            Total Terkirim
          </div>
          <p className="text-2xl font-semibold text-white">{totalSent.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Eye size={16} />
            Open Rate
          </div>
          <p className="text-2xl font-semibold text-cyan-400">{avgOpenRate}%</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} />
            +5.2% vs periode sebelumnya
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <MousePointer size={16} />
            Click Rate
          </div>
          <p className="text-2xl font-semibold text-amber-400">{avgCtr}%</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} />
            +2.1% vs periode sebelumnya
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <Target size={16} />
            Conversion
          </div>
          <p className="text-2xl font-semibold text-emerald-400">{avgConversion}%</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} />
            +1.5% vs periode sebelumnya
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <DollarSign size={16} />
            Total Konversi
          </div>
          <p className="text-2xl font-semibold text-white">{totalConverted}</p>
        </div>
      </div>

      {/* Performance Chart */}
      <Panel title="Performa Kampanye" description="Grafik engagement selama periode">
        <div className="h-72">
          <div className="flex h-full items-end justify-between gap-2 px-4">
            {performanceData.map((data, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: "250px" }}>
                  <div
                    className="w-6 rounded-t-md bg-cyan-400/60 transition-all hover:bg-cyan-400"
                    style={{ height: `${(data.sent / 1700) * 100}%` }}
                    title={`Sent: ${data.sent}`}
                  />
                  <div
                    className="w-6 rounded-t-md bg-emerald-400/60 transition-all hover:bg-emerald-400"
                    style={{ height: `${(data.opened / 720) * 100}%` }}
                    title={`Opened: ${data.opened}`}
                  />
                  <div
                    className="w-6 rounded-t-md bg-amber-400/60 transition-all hover:bg-amber-400"
                    style={{ height: `${(data.clicked / 180) * 100}%` }}
                    title={`Clicked: ${data.clicked}`}
                  />
                </div>
                <span className="text-xs text-slate-500">{data.date}</span>
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
            <span className="text-xs text-slate-400">Diklik</span>
          </div>
        </div>
      </Panel>

      {/* Campaign Performance Table */}
      <Panel title="Performa per Kampanye">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Kampanye
                </th>
                <th className="whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Channel
                </th>
                <th className="whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Terkirim
                </th>
                <th className="whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Open Rate
                </th>
                <th className="whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  CTR
                </th>
                <th className="whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Konversi
                </th>
              </tr>
            </thead>
            <tbody>
              {campaignPerformance.map((campaign, i) => (
                <tr key={i} className="border-b border-white/[0.05] transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">{campaign.name}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="flex items-center gap-1">
                      {campaign.channel === "whatsapp" && <MessageSquare size={14} className="text-green-400" />}
                      {campaign.channel === "email" && <Mail size={14} className="text-blue-400" />}
                      {campaign.channel === "multi" && <Zap size={14} className="text-yellow-400" />}
                      {campaign.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{campaign.sent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-cyan-300">{campaign.openRate}%</td>
                  <td className="px-4 py-3 text-right text-amber-300">{campaign.ctr}%</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{campaign.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Channel Comparison & ROI */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Channel Comparison */}
        <Panel title="Perbandingan Channel">
          <div className="space-y-4">
            {channelComparison.map((ch, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ch.channel === "WhatsApp" && <MessageSquare size={18} className="text-green-400" />}
                    {ch.channel === "Email" && <Mail size={18} className="text-blue-400" />}
                    {ch.channel === "Instagram" && <Instagram size={18} className="text-pink-400" />}
                    <span className="font-semibold text-white">{ch.channel}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">Open Rate</span>
                      <span className="text-cyan-300">{ch.openRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${ch.openRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">CTR</span>
                      <span className="text-amber-300">{ch.ctr}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-amber-400" style={{ width: `${ch.ctr * 5}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">Conversion</span>
                      <span className="text-emerald-300">{ch.conversion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${ch.conversion * 10}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ROI Calculator */}
        <Panel title="ROI Calculator">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-sm font-semibold text-white">Input Biaya</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Biaya Platform</span>
                  <span className="text-white">Rp 500,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Biaya Konten</span>
                  <span className="text-white">Rp 200,000</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.07] pt-2">
                  <span className="font-medium text-white">Total Biaya</span>
                  <span className="text-lg font-semibold text-white">Rp 700,000</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="mb-3 text-sm font-semibold text-emerald-300">Return (Konversi)</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Konversi</span>
                  <span className="text-emerald-300">{totalConverted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nilai Rata-rata/Konversi</span>
                  <span className="text-emerald-300">Rp 150,000</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-400/20 pt-2">
                  <span className="font-medium text-white">Total Return</span>
                  <span className="text-lg font-semibold text-emerald-400">
                    Rp {(totalConverted * 150000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center">
              <p className="text-sm text-slate-400">ROI</p>
              <p className="mt-1 text-3xl font-bold text-cyan-400">
                {((totalConverted * 150000 - 700000) / 700000 * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
