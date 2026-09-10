"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Percent,
  Clock,
  Gift,
  Zap,
  Edit2,
  Trash2,
  Eye,
  Copy,
  ArrowRight,
  X,
  Calendar,
  Tag,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";
import { Panel, Badge, btn } from "@/components/admin/ui";

type OfferType = "DISCOUNT" | "PROMO" | "BUNDLE" | "FLASH_SALE";
type OfferStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DRAFT";

interface Offer {
  id: string;
  name: string;
  type: OfferType;
  status: OfferStatus;
  title: string;
  description: string;
  discountValue?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  minPurchase?: number;
  code?: string;
  startDate: string;
  endDate: string;
  usageCount: number;
  conversionCount: number;
  createdAt: string;
}

const mockOffers: Offer[] = [
  { id: "1", name: "中秋特惠", type: "DISCOUNT", status: "ACTIVE", title: "Mid-Autumn Festival Special", description: "Diskon spesial untuk节日中秋節", discountValue: 20, discountType: "PERCENTAGE", minPurchase: 100000, code: "MOON20", startDate: "2026-09-01", endDate: "2026-09-30", usageCount: 156, conversionCount: 45, createdAt: "2026-08-28" },
  { id: "2", name: "會員日", type: "PROMO", status: "ACTIVE", title: "Member Day Special", description: "Promo spesial untuk member aktif", discountValue: 15, discountType: "PERCENTAGE", minPurchase: 0, code: "MEMBER15", startDate: "2026-09-05", endDate: "2026-09-15", usageCount: 89, conversionCount: 32, createdAt: "2026-09-01" },
  { id: "3", name: "新產品套餐", type: "BUNDLE", status: "SCHEDULED", title: "New Product Bundle", description: "Bundle produk baru dengan harga spesial", discountValue: 50000, discountType: "FIXED", minPurchase: 0, code: "BUNDLE50K", startDate: "2026-09-20", endDate: "2026-10-20", usageCount: 0, conversionCount: 0, createdAt: "2026-09-10" },
  { id: "4", name: "閃購活動", type: "FLASH_SALE", status: "EXPIRED", title: "Flash Sale 24 Hours", description: "Flash sale 24 jam terbatas", discountValue: 30, discountType: "PERCENTAGE", minPurchase: 50000, code: "FLASH30", startDate: "2026-08-15", endDate: "2026-08-16", usageCount: 234, conversionCount: 78, createdAt: "2026-08-10" },
  { id: "5", name: "週末促銷", type: "PROMO", status: "DRAFT", title: "Weekend Special", description: "Diskon khusus週末", discountValue: 10, discountType: "PERCENTAGE", minPurchase: 0, code: "WEEKEND10", startDate: "2026-09-25", endDate: "2026-09-27", usageCount: 0, conversionCount: 0, createdAt: "2026-09-12" },
  { id: "6", name: "VIP專屬", type: "DISCOUNT", status: "ACTIVE", title: "VIP Exclusive Offer", description: "Diskon eksklusif untuk VIP會員", discountValue: 25, discountType: "PERCENTAGE", minPurchase: 0, code: "VIP25", startDate: "2026-09-01", endDate: "2026-12-31", usageCount: 67, conversionCount: 28, createdAt: "2026-08-25" },
];

const offerTypeIcons: Record<OfferType, typeof Percent> = {
  DISCOUNT: Percent,
  PROMO: Tag,
  BUNDLE: Gift,
  FLASH_SALE: Zap,
};

const offerTypeColors: Record<OfferType, string> = {
  DISCOUNT: "emerald",
  PROMO: "cyan",
  BUNDLE: "purple",
  FLASH_SALE: "amber",
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/30" },
  pink: { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/30" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/30" },
  slate: { bg: "bg-slate-500/15", text: "text-slate-300", border: "border-slate-500/30" },
};

export default function OffersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredOffers = mockOffers.filter((offer) => {
    const matchesSearch = offer.name.toLowerCase().includes(search.toLowerCase()) || offer.code?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || offer.status === statusFilter;
    const matchesType = typeFilter === "ALL" || offer.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: OfferStatus) => {
    const tones: Record<OfferStatus, string> = {
      ACTIVE: "success",
      SCHEDULED: "warning",
      EXPIRED: "neutral",
      DRAFT: "neutral",
    };
    return <Badge tone={tones[status] as any}>{status}</Badge>;
  };

  const formatDiscount = (offer: Offer) => {
    if (!offer.discountValue) return "-";
    if (offer.discountType === "PERCENTAGE") {
      return `${offer.discountValue}% OFF`;
    }
    return `Rp ${offer.discountValue.toLocaleString()} OFF`;
  };

  const getConversionRate = (offer: Offer) => {
    if (offer.usageCount === 0) return "0%";
    return `${((offer.conversionCount / offer.usageCount) * 100).toFixed(1)}%`;
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
            Offers & Promotions
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola promo, diskon, dan penawaran khusus
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
          <Plus size={15} />
          Buat Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Active Offers", value: mockOffers.filter((o) => o.status === "ACTIVE").length, icon: CheckCircle, color: "emerald" },
          { label: "Scheduled", value: mockOffers.filter((o) => o.status === "SCHEDULED").length, icon: Clock, color: "amber" },
          { label: "Total Usage", value: mockOffers.reduce((acc, o) => acc + o.usageCount, 0), icon: Users, color: "cyan" },
          { label: "Total Conversions", value: mockOffers.reduce((acc, o) => acc + o.conversionCount, 0), icon: TrendingUp, color: "purple" },
        ].map((stat) => {
          const Icon = stat.icon;
          const cc = colorMap[stat.color];
          return (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cc.bg}`}>
                  <Icon className={`h-5 w-5 ${cc.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari offer atau kode promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a1626] px-3 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="EXPIRED">Expired</option>
          <option value="DRAFT">Draft</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a1626] px-3 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
        >
          <option value="ALL">Semua Tipe</option>
          <option value="DISCOUNT">Discount</option>
          <option value="PROMO">Promo</option>
          <option value="BUNDLE">Bundle</option>
          <option value="FLASH_SALE">Flash Sale</option>
        </select>
      </div>

      {/* Offers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOffers.map((offer) => {
          const Icon = offerTypeIcons[offer.type];
          const typeColor = offerTypeColors[offer.type];
          const cc = colorMap[typeColor];
          const conversionRate = getConversionRate(offer);

          return (
            <div
              key={offer.id}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cc.bg}`}>
                    <Icon className={`h-6 w-6 ${cc.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{offer.name}</h3>
                    <p className="text-xs text-slate-500">{offer.type}</p>
                  </div>
                </div>
                {getStatusBadge(offer.status)}
              </div>

              {/* Title & Description */}
              <h4 className="font-medium text-white">{offer.title}</h4>
              <p className="mt-1 text-sm text-slate-400 line-clamp-2">{offer.description}</p>

              {/* Discount */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-300">{formatDiscount(offer)}</span>
                  {offer.code && (
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-white/10 px-3 py-1 text-sm font-mono text-cyan-300">{offer.code}</code>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {offer.startDate} - {offer.endDate}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">{offer.usageCount}</p>
                  <p className="text-[10px] text-slate-500">Used</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-cyan-300">{offer.conversionCount}</p>
                  <p className="text-[10px] text-slate-500">Converted</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-300">{conversionRate}</p>
                  <p className="text-[10px] text-slate-500">Rate</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4 opacity-0 transition group-hover:opacity-100">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOffers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign className="h-12 w-12 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-white">Tidak ada offer ditemukan</p>
          <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau buat offer baru</p>
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-semibold text-white">Buat Offer Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Nama Offer</label>
                <input
                  type="text"
                  placeholder="Contoh:中秋特惠"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Tipe</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["DISCOUNT", "PROMO", "BUNDLE", "FLASH_SALE"] as OfferType[]).map((type) => {
                    const Icon = offerTypeIcons[type];
                    const cc = colorMap[offerTypeColors[type]];
                    return (
                      <button key={type} className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition ${cc.border} ${cc.bg} hover:brightness-110`}>
                        <Icon className={`h-4 w-4 ${cc.text}`} />
                        {type.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Kode Promo</label>
                <input
                  type="text"
                  placeholder="Contoh: MOON20"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Nilai Diskon</label>
                  <input
                    type="number"
                    placeholder="20"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Tipe Diskon</label>
                  <select className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rp)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Tanggal Berakhir</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button onClick={() => setShowCreateModal(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600">
                Buat Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
