"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  Mail,
  Phone,
  Tag,
  Edit2,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { Panel, Badge, btn } from "@/components/admin/ui";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tags: string[];
  lists: string[];
  totalReceived: number;
  totalOpened: number;
  lastReceived?: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
}

const mockContacts: Contact[] = [
  { id: "1", name: "陳大明", phone: "+6281234567890", email: "chen.daming@email.com", tags: ["VIP", "NEW"], lists: ["VIP Customers"], totalReceived: 45, totalOpened: 38, lastReceived: "2026-09-10", status: "ACTIVE", createdAt: "2026-01-15" },
  { id: "2", name: "王小美", phone: "+6282345678901", email: "wang.xiaomei@email.com", tags: ["REGULAR"], lists: ["Newsletter"], totalReceived: 32, totalOpened: 28, lastReceived: "2026-09-09", status: "ACTIVE", createdAt: "2026-02-20" },
  { id: "3", name: "李小龍", phone: "+6283456789012", email: "li.xiaolong@email.com", tags: ["VIP", "HIGH_VALUE"], lists: ["VIP Customers", "New Subscribers"], totalReceived: 78, totalOpened: 72, lastReceived: "2026-09-08", status: "ACTIVE", createdAt: "2025-11-05" },
  { id: "4", name: "張小琳", phone: "+6284567890123", email: "zhang.xiaolin@email.com", tags: ["NEW"], lists: ["New Subscribers"], totalReceived: 5, totalOpened: 4, lastReceived: "2026-09-07", status: "ACTIVE", createdAt: "2026-09-01" },
  { id: "5", name: "劉德華", phone: "+6285678901234", email: "liu.dehua@email.com", tags: ["INACTIVE"], lists: ["Inactive Users"], totalReceived: 12, totalOpened: 2, lastReceived: "2026-06-15", status: "INACTIVE", createdAt: "2025-08-10" },
  { id: "6", name: "周杰倫", phone: "+6286789012345", email: "zhou.jielun@email.com", tags: ["VIP"], lists: ["VIP Customers"], totalReceived: 89, totalOpened: 85, lastReceived: "2026-09-11", status: "ACTIVE", createdAt: "2025-05-20" },
  { id: "7", name: "林志玲", phone: "+6287890123456", email: "lin.zhiling@email.com", tags: ["REGULAR"], lists: ["Newsletter"], totalReceived: 28, totalOpened: 22, lastReceived: "2026-09-05", status: "ACTIVE", createdAt: "2026-03-12" },
  { id: "8", name: "郭富城", phone: "+6288901234567", email: "guo.fucheng@email.com", tags: ["BLOCKED"], lists: [], totalReceived: 15, totalOpened: 0, status: "BLOCKED", createdAt: "2025-09-08" },
];

const allTags = ["VIP", "REGULAR", "NEW", "HIGH_VALUE", "INACTIVE", "BLOCKED"];
const allLists = ["VIP Customers", "New Subscribers", "Inactive Users", "Newsletter", "Product Interested"];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", tags: [] as string[] });

  const filteredContacts = mockContacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search);
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => contact.tags.includes(tag));
    const matchesLists = selectedLists.length === 0 || selectedLists.some((list) => contact.lists.includes(list));
    return matchesSearch && matchesTags && matchesLists;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const toggleList = (list: string) => {
    setSelectedLists((prev) => (prev.includes(list) ? prev.filter((l) => l !== list) : [...prev, list]));
  };

  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedLists([]);
    setSearch("");
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedLists.length > 0 || search.length > 0;

  const getStatusBadge = (status: Contact["status"]) => {
    const tones: Record<Contact["status"], string> = {
      ACTIVE: "success",
      INACTIVE: "warning",
      BLOCKED: "danger",
    };
    return <Badge tone={tones[status] as any}>{status}</Badge>;
  };

  const tagColors: Record<string, string> = {
    VIP: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    REGULAR: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    NEW: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    HIGH_VALUE: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    INACTIVE: "bg-red-500/15 text-red-300 border-red-500/30",
    BLOCKED: "bg-gray-500/15 text-gray-400 border-gray-500/30",
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
            Contacts
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola kontak marketing Anda
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className={btn("secondary")}
          >
            <Upload size={15} />
            Import
          </button>
          <button className={btn("secondary")}>
            <Download size={15} />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className={btn("primary")}>
            <Plus size={15} />
            Tambah Kontak
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Kontak", value: mockContacts.length, icon: Users, color: "cyan" },
          { label: "Active", value: mockContacts.filter((c) => c.status === "ACTIVE").length, icon: Check, color: "emerald" },
          { label: "Inactive", value: mockContacts.filter((c) => c.status === "INACTIVE").length, icon: AlertCircle, color: "amber" },
          { label: "Blocked", value: mockContacts.filter((c) => c.status === "BLOCKED").length, icon: X, color: "red" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  stat.color === "cyan" ? "bg-cyan-500/15" :
                  stat.color === "emerald" ? "bg-emerald-500/15" :
                  stat.color === "amber" ? "bg-amber-500/15" : "bg-red-500/15"
                }`}>
                  <Icon className={`h-5 w-5 ${
                    stat.color === "cyan" ? "text-cyan-300" :
                    stat.color === "emerald" ? "text-emerald-300" :
                    stat.color === "amber" ? "text-amber-300" : "text-red-300"
                  }`} />
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
            placeholder="Cari nama, email, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            showFilters || hasActiveFilters
              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
              : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-xs text-white">
              {selectedTags.length + selectedLists.length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Panel bodyClassName="p-4" padded={false}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-medium text-white">Filter by Tags</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedTags.includes(tag)
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-medium text-white">Filter by Lists</h4>
              <div className="flex flex-wrap gap-2">
                {allLists.map((list) => (
                  <button
                    key={list}
                    onClick={() => toggleList(list)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedLists.includes(list)
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {list}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Contacts Table */}
      <Panel bodyClassName="p-0" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                  />
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Kontak
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Tags
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Lists
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Stats
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Terakhir
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <span key={tag} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagColors[tag]}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.lists.slice(0, 2).map((list) => (
                        <span key={list} className="text-xs text-slate-400">
                          {list}
                        </span>
                      ))}
                      {contact.lists.length > 2 && (
                        <span className="text-xs text-slate-500">+{contact.lists.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-white">{contact.totalReceived}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-cyan-300">{contact.totalOpened}</span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(contact.status)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{contact.lastReceived || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="h-12 w-12 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-white">Tidak ada kontak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba ubah filter atau tambahkan kontak baru</p>
          </div>
        )}
      </Panel>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0a1626] px-5 py-3 shadow-xl">
          <span className="text-sm text-slate-300">{selectedContacts.length} kontak dipilih</span>
          <div className="h-4 w-px bg-white/10" />
          <button className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">
            <Tag className="h-4 w-4" />
            Tambah Tag
          </button>
          <button className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">
            <Users className="h-4 w-4" />
            Tambah ke List
          </button>
          <button className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-semibold text-white">Tambah Kontak Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Nama</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Masukkan nama"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Telepon</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+628..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const tags = newContact.tags.includes(tag)
                          ? newContact.tags.filter((t) => t !== tag)
                          : [...newContact.tags, tag];
                        setNewContact({ ...newContact, tags });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        newContact.tags.includes(tag)
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                          : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button onClick={() => setShowAddModal(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1626] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-semibold text-white">Import Kontak</h3>
              <button onClick={() => setShowImportModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 p-8 transition hover:border-white/20">
                <Upload className="h-12 w-12 text-slate-500" />
                <p className="mt-4 text-sm font-medium text-white">Drop file di sini</p>
                <p className="mt-1 text-sm text-slate-400">atau klik untuk browse</p>
                <p className="mt-3 text-xs text-slate-500">CSV, XLSX (max 10MB)</p>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-medium text-white">Template Kolom</h4>
                <p className="mt-1 text-xs text-slate-400">name, email, phone, tags (pisahkan dengan koma)</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button onClick={() => setShowImportModal(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600">
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
