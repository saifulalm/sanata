"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Copy,
  MoreHorizontal,
  Tag,
  Percent,
  Calendar,
  Users,
  TrendingUp,
  X,
  Image,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
  EmptyState,
  inputClass,
} from "@/components/admin/ui";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: string;
  status: "active" | "scheduled" | "expired" | "draft";
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  conversions: number;
  targetAudience: string;
}

const sampleOffers: Offer[] = [
  {
    id: "1",
    title: "Diskon 20% Layanan AHSP",
    description: "Dapatkan diskon spesial untuk konsultasi dan pembuatan AHSP",
    discount: "20%",
    image: "",
    status: "active",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    views: 1234,
    clicks: 456,
    conversions: 89,
    targetAudience: "Semua Kontak",
  },
  {
    id: "2",
    title: "Gratis Template RAB",
    description: "Dapatkan template RAB gratis untuk proyek pertama Anda",
    discount: "GRATIS",
    image: "",
    status: "active",
    startDate: "2026-02-15",
    endDate: "2026-04-15",
    views: 890,
    clicks: 234,
    conversions: 67,
    targetAudience: "Newsletter",
  },
  {
    id: "3",
    title: "Promo Ramadan Bundle",
    description: "Paket lengkap konsultasi + template + follow-up",
    discount: "35%",
    image: "",
    status: "scheduled",
    startDate: "2026-03-20",
    endDate: "2026-04-10",
    views: 0,
    clicks: 0,
    conversions: 0,
    targetAudience: "Pelanggan Prioritas",
  },
  {
    id: "4",
    title: "Referral Bonus",
    description: "Dapatkan bonus untuk setiap referral yang berhasil",
    discount: "Rp 500K",
    image: "",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    views: 567,
    clicks: 189,
    conversions: 45,
    targetAudience: "Semua Kontak",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge tone="success">Aktif</Badge>;
    case "scheduled":
      return <Badge tone="warning">Terjadwal</Badge>;
    case "expired":
      return <Badge tone="neutral">Kadaluarsa</Badge>;
    case "draft":
      return <Badge tone="neutral">Draf</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export default function OffersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredOffers = sampleOffers.filter((offer) => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openOfferDetail = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  };

  const totalActive = sampleOffers.filter(o => o.status === "active").length;
  const totalViews = sampleOffers.reduce((acc, o) => acc + o.views, 0);
  const totalConversions = sampleOffers.reduce((acc, o) => acc + o.conversions, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Penawaran"
        description="Kelola promo, diskon, dan penawaran khusus"
        actions={
          <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
            <Plus size={15} />
            Penawaran Baru
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-400">
              <Tag size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{sampleOffers.length}</p>
              <p className="text-sm text-slate-400">Total Penawaran</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalActive}</p>
              <p className="text-sm text-slate-400">Aktif</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
              <Eye size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalViews.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Total Views</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
              <Percent size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalConversions}</p>
              <p className="text-sm text-slate-400">Konversi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari penawaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="scheduled">Terjadwal</option>
          <option value="expired">Kadaluarsa</option>
          <option value="draft">Draf</option>
        </select>
        <button className={btn("secondary", "sm")}>
          <Filter size={14} />
          Filter
        </button>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden transition hover:border-cyan-300/30"
            >
              {/* Image Placeholder */}
              <div className="relative h-40 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 flex items-center justify-center">
                <Image size={40} className="text-white/20" />
                <div className="absolute right-3 top-3">
                  {getStatusBadge(offer.status)}
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="rounded-lg bg-black/60 px-3 py-1 text-lg font-bold text-white">
                    {offer.discount}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white">{offer.title}</h3>
                <p className="mt-1 text-sm text-slate-400 line-clamp-2">{offer.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {offer.startDate} - {offer.endDate}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{offer.views} views</span>
                    <span>•</span>
                    <span>{offer.conversions} konversi</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => openOfferDetail(offer)}
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
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Tag size={24} />}
          title="Tidak ada penawaran"
          description="Buat penawaran pertama untuk memulai promo"
          action={
            <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
              <Plus size={15} />
              Buat Penawaran
            </button>
          }
        />
      )}

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Penawaran Baru</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Judul Penawaran</label>
                <input type="text" placeholder="Contoh: Diskon 20%" className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Deskripsi</label>
                <textarea
                  placeholder="Jelaskan detail penawaran..."
                  className={inputClass}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Diskon</label>
                  <input type="text" placeholder="20% atau Rp 500K" className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Target Audience</label>
                  <select className="w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white">
                    <option>Semua Kontak</option>
                    <option>Pelanggan Prioritas</option>
                    <option>Newsletter</option>
                    <option>WhatsApp</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tanggal Mulai</label>
                  <input type="date" className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tanggal Berakhir</label>
                  <input type="date" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Gambar</label>
                <div className="flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6">
                  <div className="text-center">
                    <Image size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-400">Klik untuk upload</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateModal(false)} className={btn("secondary")}>
                  Batal
                </button>
                <button onClick={() => setShowCreateModal(false)} className={btn("primary")}>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Detail Modal */}
      {showDetailModal && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{selectedOffer.title}</h2>
                <div className="mt-1">{getStatusBadge(selectedOffer.status)}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-300">{selectedOffer.description}</p>
            </div>

            {/* Analytics */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-2xl font-semibold text-white">{selectedOffer.views}</p>
                <p className="text-xs text-slate-400">Views</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-2xl font-semibold text-cyan-400">{selectedOffer.clicks}</p>
                <p className="text-xs text-slate-400">Clicks</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-2xl font-semibold text-emerald-400">{selectedOffer.conversions}</p>
                <p className="text-xs text-slate-400">Konversi</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Diskon</span>
                <span className="font-semibold text-amber-400">{selectedOffer.discount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Periode</span>
                <span className="text-white">{selectedOffer.startDate} - {selectedOffer.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target</span>
                <span className="text-white">{selectedOffer.targetAudience}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className={`${btn("secondary")} flex-1`}>
                <Edit3 size={15} />
                Edit
              </button>
              <button className={`${btn("primary")} flex-1`}>
                <BarChart3 size={15} />
                Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
