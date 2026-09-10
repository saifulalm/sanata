"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Users,
  MessageSquare,
  Mail,
  Edit2,
  Trash2,
  UserPlus,
  ChevronDown,
  X,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Panel, Badge, btn } from "@/components/admin/ui";

type ListType = "WHATSAPP" | "EMAIL" | "GENERAL";

interface BroadcastList {
  id: string;
  name: string;
  description?: string;
  type: ListType;
  contactCount: number;
  activeContacts: number;
  createdAt: string;
  updatedAt: string;
}

const mockLists: BroadcastList[] = [
  { id: "1", name: "VIP Customers", description: "Customer dengan transaksi tertinggi", type: "WHATSAPP", contactCount: 245, activeContacts: 240, createdAt: "2026-01-15", updatedAt: "2026-09-10" },
  { id: "2", name: "New Subscribers", description: "Langganan baru bulan ini", type: "EMAIL", contactCount: 580, activeContacts: 565, createdAt: "2026-02-20", updatedAt: "2026-09-11" },
  { id: "3", name: "Inactive Users", description: "Tidak aktif lebih dari 30 hari", type: "GENERAL", contactCount: 320, activeContacts: 0, createdAt: "2026-03-12", updatedAt: "2026-09-01" },
  { id: "4", name: "Product Interested", description: "Interested in produk tertentu", type: "WHATSAPP", contactCount: 180, activeContacts: 175, createdAt: "2026-04-08", updatedAt: "2026-09-08" },
  { id: "5", name: "Newsletter", description: "Pelanggan newsletter regular", type: "EMAIL", contactCount: 890, activeContacts: 850, createdAt: "2026-05-01", updatedAt: "2026-09-12" },
  { id: "6", name: "Flash Sale Target", description: "Target untuk flash sale campaign", type: "WHATSAPP", contactCount: 450, activeContacts: 445, createdAt: "2026-06-15", updatedAt: "2026-09-09" },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/30" },
  slate: { bg: "bg-slate-500/15", text: "text-slate-300", border: "border-slate-500/30" },
};

export default function BroadcastPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedList, setSelectedList] = useState<BroadcastList | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);

  const filteredLists = mockLists.filter((list) => {
    const matchesSearch = list.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || list.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: ListType) => {
    const icons: Record<ListType, typeof MessageSquare> = {
      WHATSAPP: MessageSquare,
      EMAIL: Mail,
      GENERAL: Users,
    };
    const Icon = icons[type];
    return Icon;
  };

  const getTypeColor = (type: ListType) => {
    const colors: Record<ListType, string> = {
      WHATSAPP: "emerald",
      EMAIL: "cyan",
      GENERAL: "slate",
    };
    return colors[type];
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
            Broadcast Lists
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola broadcast list untuk marketing campaign
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
          <Plus size={15} />
          List Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Lists", value: mockLists.length, icon: Users, color: "cyan" },
          { label: "WhatsApp Lists", value: mockLists.filter((l) => l.type === "WHATSAPP").length, icon: MessageSquare, color: "emerald" },
          { label: "Email Lists", value: mockLists.filter((l) => l.type === "EMAIL").length, icon: Mail, color: "slate" },
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
            placeholder="Cari broadcast list..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["ALL", "WHATSAPP", "EMAIL", "GENERAL"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                typeFilter === type
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {type === "ALL" ? "Semua" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLists.map((list) => {
          const Icon = getTypeIcon(list.type);
          const cc = colorMap[getTypeColor(list.type)];
          const inactiveCount = list.contactCount - list.activeContacts;

          return (
            <div
              key={list.id}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cc.bg}`}>
                    <Icon className={`h-6 w-6 ${cc.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{list.name}</h3>
                    <p className="text-xs text-slate-500">{list.type}</p>
                  </div>
                </div>
                <div className="relative">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {list.description && (
                <p className="text-sm text-slate-400">{list.description}</p>
              )}

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{list.contactCount}</p>
                  <p className="text-xs text-slate-500">Total Kontak</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-300">{list.activeContacts}</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
              </div>

              {/* Inactive Warning */}
              {inactiveCount > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px]">
                    {inactiveCount}
                  </span>
                  kontak tidak aktif
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
                <button
                  onClick={() => setSelectedList(list)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Users className="h-4 w-4" />
                  Lihat Kontak
                </button>
                <button
                  onClick={() => setShowAddContacts(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                  title="Tambah Kontak"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-white">Tidak ada list ditemukan</p>
          <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau buat list baru</p>
        </div>
      )}

      {/* List Contacts Modal */}
      {selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getTypeIcon(selectedList.type);
                  const cc = colorMap[getTypeColor(selectedList.type)];
                  return (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cc.bg}`}>
                      <Icon className={`h-5 w-5 ${cc.text}`} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold text-white">{selectedList.name}</h3>
                  <p className="text-xs text-slate-500">{selectedList.contactCount} kontak</p>
                </div>
              </div>
              <button onClick={() => setSelectedList(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-6">
              <div className="space-y-2">
                {[
                  { name: "陳大明", phone: "+6281234567890" },
                  { name: "王小美", phone: "+6282345678901" },
                  { name: "李小龍", phone: "+6283456789012" },
                  { name: "張小琳", phone: "+6284567890123" },
                  { name: "劉德華", phone: "+6285678901234" },
                  { name: "周杰倫", phone: "+6286789012345" },
                ].map((contact, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2.5 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-medium text-cyan-300">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.phone}</p>
                      </div>
                    </div>
                    <button className="text-xs text-slate-400 hover:text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between border-t border-white/10 px-6 py-4">
              <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                <UserPlus className="h-4 w-4" />
                Tambah Kontak
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-semibold text-white">Buat Broadcast List Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Nama List</label>
                <input
                  type="text"
                  placeholder="Contoh: VIP Customers"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Deskripsi</label>
                <textarea
                  placeholder="Deskripsi list ini..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Tipe Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["WHATSAPP", "EMAIL", "GENERAL"] as ListType[]).map((type) => {
                    const Icon = getTypeIcon(type);
                    const cc = colorMap[getTypeColor(type)];
                    return (
                      <button key={type} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition ${cc.border} ${cc.bg}`}>
                        <Icon className={`h-5 w-5 ${cc.text}`} />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button onClick={() => setShowCreateModal(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600">
                Buat List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
