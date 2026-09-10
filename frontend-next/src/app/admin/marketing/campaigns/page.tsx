"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Send,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Instagram,
  Zap,
  Megaphone,
  Calendar,
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

type CampaignStatus = "all" | "draft" | "scheduled" | "sending" | "completed" | "paused";
type CampaignType = "all" | "whatsapp" | "email" | "instagram" | "multi";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  date: string;
  scheduledDate?: string;
  audience: string;
}

const sampleCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Promo Ramadan 2026",
    type: "whatsapp",
    status: "completed",
    sent: 3250,
    delivered: 3180,
    opened: 1351,
    clicked: 456,
    converted: 89,
    date: "2026-03-15",
    audience: "Pelanggan Aktif",
  },
  {
    id: "2",
    name: "Layanan AHSP Baru",
    type: "email",
    status: "sending",
    sent: 1850,
    delivered: 1820,
    opened: 520,
    clicked: 145,
    converted: 0,
    date: "2026-03-14",
    audience: "Newsletter Subscribers",
  },
  {
    id: "3",
    name: "Follow-up Penawaran",
    type: "multi",
    status: "scheduled",
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    date: "2026-03-18",
    scheduledDate: "2026-03-20 09:00",
    audience: "Penawaran Pending",
  },
  {
    id: "4",
    name: "Instagram Story Promo",
    type: "instagram",
    status: "draft",
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    date: "",
    audience: "Followers Instagram",
  },
  {
    id: "5",
    name: "Promo Ulang Tahun",
    type: "whatsapp",
    status: "completed",
    sent: 890,
    delivered: 875,
    opened: 420,
    clicked: 180,
    converted: 45,
    date: "2026-03-10",
    audience: "Ulang Tahun Bulan Ini",
  },
  {
    id: "6",
    name: "Webinar Konstruksi",
    type: "email",
    status: "paused",
    sent: 450,
    delivered: 445,
    opened: 180,
    clicked: 65,
    converted: 12,
    date: "2026-03-08",
    scheduledDate: "2026-03-12 14:00",
    audience: "Profesional Konstruksi",
  },
  {
    id: "7",
    name: "Flash Sale Layanan",
    type: "multi",
    status: "completed",
    sent: 2100,
    delivered: 2050,
    opened: 890,
    clicked: 320,
    converted: 78,
    date: "2026-03-05",
    audience: "Pelanggan Prioritas",
  },
];

function getChannelIcon(type: CampaignType) {
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
      return <Badge tone="neutral">Dijeda</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <span className="text-emerald-400">✓</span>;
    case "sending":
      return <Send size={14} className="text-cyan-400" />;
    case "scheduled":
      return <Calendar size={14} className="text-amber-400" />;
    case "draft":
      return <Edit3 size={14} className="text-slate-400" />;
    case "paused":
      return <Pause size={14} className="text-amber-400" />;
    default:
      return <Megaphone size={14} className="text-slate-400" />;
  }
}

export default function CampaignsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus>("all");
  const [typeFilter, setTypeFilter] = useState<CampaignType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const itemsPerPage = 10;

  const filteredCampaigns = sampleCampaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedCampaigns.length === paginatedCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(paginatedCampaigns.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Hapus ${selectedCampaigns.length} kampanye yang dipilih?`)) {
      // In production, this would call an API
      setSelectedCampaigns([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Kampanye"
        description="Kelola dan pantau semua kampanye pemasaran"
        actions={
          <Link href="/admin/marketing/campaigns/new" className={btn("primary")}>
            <Plus size={15} />
            Kampanye Baru
          </Link>
        }
      />

      {/* Filters */}
      <Panel padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kampanye..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus)}
            className={selectClass}
            style={{ width: "auto" }}
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draf</option>
            <option value="scheduled">Terjadwal</option>
            <option value="sending">Mengirim</option>
            <option value="completed">Selesai</option>
            <option value="paused">Dijeda</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CampaignType)}
            className={selectClass}
            style={{ width: "auto" }}
          >
            <option value="all">Semua Channel</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram</option>
            <option value="multi">Multi-channel</option>
          </select>

          <button className={btn("secondary", "sm")}>
            <Filter size={14} />
            Filter Lanjutan
          </button>
        </div>
      </Panel>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
          <span className="text-sm text-cyan-200">
            {selectedCampaigns.length} kampanye dipilih
          </span>
          <button className={btn("danger", "sm")}>
            <Trash2 size={14} />
            Hapus
          </button>
          <button className={btn("secondary", "sm")}>
            <Copy size={14} />
            Duplikat
          </button>
          <button className={btn("secondary", "sm")}>
            <Pause size={14} />
            Jeda
          </button>
        </div>
      )}

      {/* Campaigns Table */}
      <Panel padded={false}>
        {filteredCampaigns.length > 0 ? (
          <>
            <TableWrap>
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr>
                    <Th>
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.length === paginatedCampaigns.length && paginatedCampaigns.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-white/20 bg-white/5"
                      />
                    </Th>
                    <Th>Kampanye</Th>
                    <Th>Channel</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Audience</Th>
                    <Th className="text-right">Terkirim</Th>
                    <Th className="text-right">Dibuka</Th>
                    <Th className="text-right">Konversi</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCampaigns.map((campaign) => (
                    <Tr key={campaign.id}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.includes(campaign.id)}
                          onChange={() => toggleSelect(campaign.id)}
                          className="h-4 w-4 rounded border-white/20 bg-white/5"
                        />
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/marketing/campaigns/${campaign.id}`}
                          className="font-medium text-cyan-200 hover:text-cyan-100"
                        >
                          {campaign.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {campaign.scheduledDate || campaign.date || "Tanpa tanggal"}
                        </p>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          {getChannelIcon(campaign.type)}
                          <span className="capitalize">{campaign.type}</span>
                        </div>
                      </Td>
                      <Td>{getStatusBadge(campaign.status)}</Td>
                      <Td className="text-right text-slate-400">{campaign.audience}</Td>
                      <Td className="text-right">{campaign.sent.toLocaleString()}</Td>
                      <Td className="text-right">
                        {campaign.delivered > 0
                          ? `${((campaign.opened / campaign.delivered) * 100).toFixed(1)}%`
                          : "-"}
                      </Td>
                      <Td className="text-right">
                        {campaign.converted > 0 ? (
                          <span className="text-emerald-400">{campaign.converted}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/marketing/campaigns/${campaign.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                            title="Lihat"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/marketing/campaigns/${campaign.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                            title="Duplikat"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-red-400"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-white/[0.07] p-4">
              <span className="text-sm text-slate-400">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} dari{" "}
                {filteredCampaigns.length} kampanye
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`${btn("secondary", "sm")} disabled:opacity-50`}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-sm ${
                      currentPage === page
                        ? "bg-cyan-300/20 text-cyan-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`${btn("secondary", "sm")} disabled:opacity-50`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Megaphone size={24} />}
            title="Tidak ada kampanye"
            description="Buat kampanye pertama untuk memulai pemasaran"
            action={
              <Link href="/admin/marketing/campaigns/new" className={btn("primary")}>
                <Plus size={15} />
                Buat Kampanye
              </Link>
            }
          />
        )}
      </Panel>
    </div>
  );
}
