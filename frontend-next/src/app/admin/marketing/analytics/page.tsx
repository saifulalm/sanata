"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Mail,
  Image,
  DollarSign,
  Users,
  Send,
  Eye,
  MousePointerClick,
  Target,
  DollarSign as Dollar,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { Panel, Badge, btn } from "@/components/admin/ui";

const timeRanges = ["7 Hari", "30 Hari", "90 Hari", "1 Tahun"];

const channelStats = [
  { channel: "WhatsApp", icon: MessageSquare, color: "emerald", sent: 18500, delivered: 17800, opened: 15130, clicked: 5400, converted: 892 },
  { channel: "Email", icon: Mail, color: "cyan", sent: 12000, delivered: 11500, opened: 7820, clicked: 2340, converted: 345 },
  { channel: "Instagram", icon: Image, color: "pink", sent: 8500, delivered: 8200, opened: 5904, clicked: 2050, converted: 189 },
  { channel: "Offers", icon: DollarSign, color: "amber", sent: 6000, delivered: 5800, opened: 2610, clicked: 1160, converted: 487 },
];

const timelineData = [
  { date: "2026-09-05", campaigns: 2, sent: 1500, delivered: 1450, conversions: 45 },
  { date: "2026-09-06", campaigns: 3, sent: 2200, delivered: 2150, conversions: 67 },
  { date: "2026-09-07", campaigns: 1, sent: 800, delivered: 780, conversions: 23 },
  { date: "2026-09-08", campaigns: 4, sent: 3100, delivered: 3000, conversions: 89 },
  { date: "2026-09-09", campaigns: 2, sent: 1800, delivered: 1750, conversions: 52 },
  { date: "2026-09-10", campaigns: 5, sent: 4200, delivered: 4050, conversions: 134 },
  { date: "2026-09-11", campaigns: 3, sent: 2800, delivered: 2720, conversions: 78 },
];

const topCampaigns = [
  { name: "中秋特惠促銷", channel: "WhatsApp", sent: 5200, conversions: 234, rate: 4.5 },
  { name: "VIP會員專屬", channel: "Email", sent: 1800, conversions: 89, rate: 4.9 },
  { name: "新品發布通知", channel: "Instagram", sent: 3500, conversions: 156, rate: 4.5 },
  { name: "週末特賣", channel: "WhatsApp", sent: 2100, conversions: 78, rate: 3.7 },
  { name: "會員日促銷", channel: "Email", sent: 1500, conversions: 56, rate: 3.7 },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/30" },
  pink: { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/30" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/30" },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30 Hari");

  const totalSent = channelStats.reduce((acc, c) => acc + c.sent, 0);
  const totalDelivered = channelStats.reduce((acc, c) => acc + c.delivered, 0);
  const totalOpened = channelStats.reduce((acc, c) => acc + c.opened, 0);
  const totalClicked = channelStats.reduce((acc, c) => acc + c.clicked, 0);
  const totalConverted = channelStats.reduce((acc, c) => acc + c.converted, 0);

  const avgDeliveryRate = ((totalDelivered / totalSent) * 100).toFixed(1);
  const avgOpenRate = ((totalOpened / totalDelivered) * 100).toFixed(1);
  const avgClickRate = ((totalClicked / totalOpened) * 100).toFixed(1);
  const avgConversionRate = ((totalConverted / totalClicked) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Marketing
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Lihat performa marketing campaign Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.05] p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  timeRange === range
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className={btn("secondary")}>
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send, color: "cyan", trend: "+12%" },
          { label: "Delivery Rate", value: `${avgDeliveryRate}%`, icon: Send, color: "emerald", trend: "+2%" },
          { label: "Open Rate", value: `${avgOpenRate}%`, icon: Eye, color: "amber", trend: "+5%" },
          { label: "Conversion Rate", value: `${avgConversionRate}%`, icon: Target, color: "pink", trend: "+8%" },
        ].map((stat) => {
          const Icon = stat.icon;
          const cc = colorMap[stat.color];
          return (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cc.bg}`}>
                  <Icon className={`h-5 w-5 ${cc.text}`} />
                </div>
                <span className="flex items-center gap-1 text-xs text-emerald-300">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline Chart */}
        <Panel title="Campaign Timeline" description={`Performa ${timeRange}`}>
          <div className="space-y-3">
            {timelineData.map((day, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 text-xs text-slate-500">{day.date}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-8 flex-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/40 to-cyan-500/20 rounded-lg transition-all"
                      style={{ width: `${(day.sent / 4200) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {day.sent.toLocaleString()} sent
                    </div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-medium text-emerald-300">{day.conversions}</span>
                  <span className="text-xs text-slate-500"> conv</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Funnel */}
        <Panel title="Conversion Funnel" description="Performa dari sent hingga conversion">
          <div className="space-y-4">
            {[
              { label: "Sent", value: totalSent, color: "cyan", icon: Send },
              { label: "Delivered", value: totalDelivered, color: "emerald", icon: Send, rate: avgDeliveryRate },
              { label: "Opened", value: totalOpened, color: "amber", icon: Eye, rate: avgOpenRate },
              { label: "Clicked", value: totalClicked, color: "pink", icon: MousePointerClick, rate: avgClickRate },
              { label: "Converted", value: totalConverted, color: "purple", icon: Target, rate: avgConversionRate },
            ].map((stage, i) => {
              const Icon = stage.icon;
              const cc = colorMap[stage.color];
              const width = 100 - (i * 15);

              return (
                <div key={stage.label} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cc.text}`} />
                      <span className="text-sm text-white">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{stage.value.toLocaleString()}</span>
                      {stage.rate && (
                        <Badge tone="neutral">{stage.rate}%</Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-3 rounded-lg bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-lg ${cc.bg} transition-all`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Channel Performance */}
      <Panel title="Performa per Channel" description="Statistik detail untuk setiap channel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channelStats.map((channel) => {
            const Icon = channel.icon;
            const cc = colorMap[channel.color];
            const deliveryRate = ((channel.delivered / channel.sent) * 100).toFixed(1);
            const openRate = ((channel.opened / channel.delivered) * 100).toFixed(1);
            const clickRate = ((channel.clicked / channel.opened) * 100).toFixed(1);
            const convRate = ((channel.converted / channel.clicked) * 100).toFixed(1);

            return (
              <div key={channel.channel} className={`rounded-xl border ${cc.border} ${cc.bg} p-4`}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-black/20`}>
                    <Icon className={`h-5 w-5 ${cc.text}`} />
                  </div>
                  <span className="font-semibold text-white">{channel.channel}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Sent</span>
                    <span className="font-medium text-white">{channel.sent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Delivered</span>
                    <div className="text-right">
                      <span className="font-medium text-white">{channel.delivered.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-slate-500">({deliveryRate}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Opened</span>
                    <div className="text-right">
                      <span className="font-medium text-white">{channel.opened.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-amber-400">({openRate}%)</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Clicked</span>
                    <div className="text-right">
                      <span className="font-medium text-white">{channel.clicked.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-pink-400">({clickRate}%)</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
                    <span className="text-slate-400">Converted</span>
                    <div className="text-right">
                      <span className="font-semibold text-emerald-300">{channel.converted.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-emerald-400">({convRate}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Top Campaigns */}
      <Panel title="Top Performing Campaigns" description="Campaign dengan conversion rate tertinggi">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Campaign</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Channel</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Sent</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Conversions</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {topCampaigns.map((campaign, i) => {
                const colors: Record<string, string> = {
                  WhatsApp: "emerald",
                  Email: "cyan",
                  Instagram: "pink",
                };
                const cc = colorMap[colors[campaign.channel] || "slate"];

                return (
                  <tr key={i} className="hover:bg-white/[0.03]">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-medium text-cyan-400">
                          {i + 1}
                        </span>
                        <span className="font-medium text-white">{campaign.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${cc.bg} ${cc.text}`}>
                        {campaign.channel}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300">{campaign.sent.toLocaleString()}</td>
                    <td className="py-3 text-right font-medium text-emerald-300">{campaign.conversions}</td>
                    <td className="py-3 text-right">
                      <Badge tone="success">{campaign.rate}%</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Additional Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Contact Growth" description="Pertumbuhan database kontak">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-white">12,450</p>
                <p className="text-sm text-slate-400">Total Kontak</p>
              </div>
              <span className="flex items-center gap-1 text-sm text-emerald-300">
                <TrendingUp className="h-4 w-4" />
                +8.5%
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: "New (7 days)", value: 156, color: "emerald" },
                { label: "Active (30 days)", value: 4520, color: "cyan" },
                { label: "Inactive (90 days)", value: 2340, color: "amber" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={`font-medium ${item.color === "emerald" ? "text-emerald-300" : item.color === "cyan" ? "text-cyan-300" : "text-amber-300"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Revenue Attribution" description="Revenue dari campaign marketing">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-white">Rp 125M</p>
                <p className="text-sm text-slate-400">Total Revenue</p>
              </div>
              <span className="flex items-center gap-1 text-sm text-emerald-300">
                <TrendingUp className="h-4 w-4" />
                +18%
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: "WhatsApp", value: "45%", amount: "Rp 56.25M" },
                { label: "Email", value: "25%", amount: "Rp 31.25M" },
                { label: "Instagram", value: "18%", amount: "Rp 22.5M" },
                { label: "Offers", value: "12%", amount: "Rp 15M" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white">{item.amount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500/40 to-cyan-500/20"
                      style={{ width: item.value }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Engagement Score" description="Rata-rata engagement per channel">
          <div className="space-y-4">
            {channelStats.map((channel) => {
              const Icon = channel.icon;
              const cc = colorMap[channel.color];
              const engagementScore = ((channel.clicked + channel.converted * 2) / channel.sent * 100).toFixed(1);

              return (
                <div key={channel.channel} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cc.bg}`}>
                    <Icon className={`h-4 w-4 ${cc.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white">{channel.channel}</span>
                      <span className="font-semibold text-cyan-300">{engagementScore}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${cc.bg}`}
                        style={{ width: `${Math.min(parseFloat(engagementScore) * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
