"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit3,
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
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  PageHeader,
  Panel,
  Badge,
  btn,
  EmptyState,
  TableWrap,
  Th,
  Td,
  Tr,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  cancelCampaign,
  type Campaign,
  type CampaignType,
  type CampaignStatus,
  MarketingApiError,
} from "@/lib/marketingApi";

// Types
type FilterStatus = "all" | CampaignStatus;
type FilterType = "all" | CampaignType;

function getChannelIcon(type: CampaignType | string) {
  switch (type) {
    case "WHATSAPP":
      return <MessageSquare size={14} className="text-green-400" />;
    case "EMAIL":
      return <Mail size={14} className="text-blue-400" />;
    case "INSTAGRAM":
      return <Instagram size={14} className="text-pink-400" />;
    case "MULTI":
      return <Zap size={14} className="text-yellow-400" />;
    default:
      return <Megaphone size={14} className="text-slate-400" />;
  }
}

function getChannelLabel(type: CampaignType | string) {
  switch (type) {
    case "WHATSAPP":
      return "WhatsApp";
    case "EMAIL":
      return "Email";
    case "INSTAGRAM":
      return "Instagram";
    case "MULTI":
      return "Multi-channel";
    default:
      return type;
  }
}

function getStatusBadge(status: CampaignStatus | string) {
  switch (status) {
    case "COMPLETED":
      return <Badge tone="success">Selesai</Badge>;
    case "SENDING":
      return <Badge tone="info">Mengirim</Badge>;
    case "SCHEDULED":
      return <Badge tone="warning">Terjadwal</Badge>;
    case "DRAFT":
      return <Badge tone="neutral">Draf</Badge>;
    case "PAUSED":
      return <Badge tone="warning">Dijeda</Badge>;
    case "CANCELLED":
      return <Badge tone="danger">Dibatalkan</Badge>;
    case "FAILED":
      return <Badge tone="danger">Gagal</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export default function CampaignsListPage() {
  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCampaigns({
        page: currentPage,
        pageSize: itemsPerPage,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter as CampaignType,
        search: searchTerm || undefined,
      });
      setCampaigns(result.data);
      setTotalCount(result.meta.total);
    } catch (err) {
      setError(err instanceof MarketingApiError ? err.message : "Gagal memuat kampanye");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Filter locally for search
  const filteredCampaigns = searchTerm
    ? campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : campaigns;

  // Actions
  const handleSend = async (id: string) => {
    setActionLoading(id);
    try {
      await sendCampaign(id);
      setActionSuccess("Kampanye berhasil dikirim!");
      setTimeout(() => setActionSuccess(null), 3000);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof MarketingApiError ? err.message : "Gagal mengirim kampanye");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await updateCampaign(id, { status: "PAUSED" } as any);
      setActionSuccess("Kampanye dijeda");
      setTimeout(() => setActionSuccess(null), 3000);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof MarketingApiError ? err.message : "Gagal menjeda kampanye");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(id);
    try {
      await updateCampaign(id, { status: "SENDING" } as any);
      setActionSuccess("Kampanye dilanjutkan");
      setTimeout(() => setActionSuccess(null), 3000);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof MarketingApiError ? err.message : "Gagal melanjutkan kampanye");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Batalkan kampanye ini?")) return;
    setActionLoading(id);
    try {
      await cancelCampaign(id);
      setActionSuccess("Kampanye dibatalkan");
      setTimeout(() => setActionSuccess(null), 3000);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof MarketingApiError ? err.message : "Gagal membatalkan kampanye");
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kampanye ini?")) return;
    try {
      await deleteCampaign(id);
      setActionSuccess("Kampanye dihapus");
      setTimeout(() => setActionSuccess(null), 3000);
      loadCampaigns();
    } catch (err) {
      setActionError(err instanceof MarketingApiError ? err.message : "Gagal menghapus kampanye");
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedCampaigns.length} kampanye yang dipilih?`)) return;
    for (const id of selectedCampaigns) {
      try {
        await deleteCampaign(id);
      } catch {
        // Continue with others
      }
    }
    setActionSuccess(`${selectedCampaigns.length} kampanye dihapus`);
    setTimeout(() => setActionSuccess(null), 3000);
    setSelectedCampaigns([]);
    loadCampaigns();
  };

  const toggleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleStatusFilterChange = (value: FilterStatus) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: FilterType) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 shadow-xl">
          <AlertCircle size={18} />
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400 shadow-xl">
          <CheckCircle size={18} />
          {actionSuccess}
        </div>
      )}

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
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as FilterStatus)}
            className={selectClass}
            style={{ width: "auto" }}
          >
            <option value="all">Semua Status</option>
            <option value="DRAFT">Draf</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="SENDING">Mengirim</option>
            <option value="COMPLETED">Selesai</option>
            <option value="PAUSED">Dijeda</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value as FilterType)}
            className={selectClass}
            style={{ width: "auto" }}
          >
            <option value="all">Semua Channel</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="MULTI">Multi-channel</option>
          </select>

          <button onClick={loadCampaigns} className={btn("secondary", "sm")}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </Panel>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-desert-400/20 bg-desert-400/10 p-3">
          <span className="text-sm text-desert-200">
            {selectedCampaigns.length} kampanye dipilih
          </span>
          <button onClick={handleBulkDelete} className={btn("danger", "sm")}>
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-desert-400" />
          <span className="ml-3 text-slate-400">Memuat kampanye...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 py-16">
          <AlertCircle size={48} className="text-red-400" />
          <h3 className="mt-4 text-lg font-semibold text-white">Gagal memuat kampanye</h3>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={loadCampaigns} className={`${btn("primary")} mt-4`}>
            <RefreshCw size={15} />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Campaigns Table */}
      {!isLoading && !error && (
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
                          checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
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
                    {filteredCampaigns.map((campaign) => (
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
                            className="font-medium text-desert-200 hover:text-desert-200"
                          >
                            {campaign.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {campaign.scheduledAt
                              ? new Date(campaign.scheduledAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : campaign.completedAt
                              ? `Selesai ${new Date(campaign.completedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}`
                              : "Tanpa tanggal"}
                          </p>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1.5">
                            {getChannelIcon(campaign.type)}
                            <span>{getChannelLabel(campaign.type)}</span>
                          </div>
                        </Td>
                        <Td>{getStatusBadge(campaign.status)}</Td>
                        <Td className="text-right text-slate-400">
                          {campaign.audience?.name || "-"}
                        </Td>
                        <Td className="text-right">
                          {(campaign.statistics?.sent || 0).toLocaleString("id-ID")}
                        </Td>
                        <Td className="text-right">
                          {campaign.statistics?.delivered && campaign.statistics.delivered > 0
                            ? `${((campaign.statistics.opened / campaign.statistics.delivered) * 100).toFixed(1)}%`
                            : "-"}
                        </Td>
                        <Td className="text-right">
                          {campaign.statistics?.converted && campaign.statistics.converted > 0 ? (
                            <span className="text-emerald-400">{campaign.statistics.converted}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            {actionLoading === campaign.id ? (
                              <Loader2 size={16} className="animate-spin text-desert-400" />
                            ) : (
                              <>
                                {/* Status Actions */}
                                {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
                                  <button
                                    onClick={() => handleSend(campaign.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                                    title="Kirim Sekarang"
                                  >
                                    <Send size={16} />
                                  </button>
                                )}
                                {campaign.status === "SENDING" && (
                                  <button
                                    onClick={() => handlePause(campaign.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400"
                                    title="Jeda"
                                  >
                                    <Pause size={16} />
                                  </button>
                                )}
                                {campaign.status === "PAUSED" && (
                                  <button
                                    onClick={() => handleResume(campaign.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                                    title="Lanjutkan"
                                  >
                                    <Play size={16} />
                                  </button>
                                )}
                                {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED" || campaign.status === "PAUSED") && (
                                  <button
                                    onClick={() => handleCancel(campaign.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                    title="Batalkan"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                                <Link
                                  href={`/admin/marketing/campaigns/${campaign.id}`}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-desert-400"
                                  title="Lihat"
                                >
                                  <Eye size={16} />
                                </Link>
                                <Link
                                  href={`/admin/marketing/campaigns/${campaign.id}?edit=true`}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                                  title="Edit"
                                >
                                  <Edit3 size={16} />
                                </Link>
                                <button
                                  onClick={() => handleDelete(campaign.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
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
                  {Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} kampanye
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`${btn("secondary", "sm")} disabled:opacity-50`}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-sm ${
                        currentPage === page
                          ? "bg-desert-400/20 text-desert-400"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="text-slate-500">...</span>}
                  {totalPages > 5 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`h-8 w-8 rounded-lg text-sm ${
                        currentPage === totalPages
                          ? "bg-desert-400/20 text-desert-400"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
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
              description={
                searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Tidak ada hasil untuk filter yang dipilih"
                  : "Buat kampanye pertama untuk memulai pemasaran"
              }
              action={
                <Link href="/admin/marketing/campaigns/new" className={btn("primary")}>
                  <Plus size={15} />
                  Buat Kampanye
                </Link>
              }
            />
          )}
        </Panel>
      )}
    </div>
  );
}
