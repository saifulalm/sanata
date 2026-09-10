"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Mail,
  MessageSquare,
  Eye,
  Download,
  X,
  ChevronDown,
  List,
  UserCheck,
  Clock,
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
} from "@/components/admin/ui";

interface BroadcastList {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  createdAt: string;
  lastUsed?: string;
  channels: string[];
}

interface ContactInList {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addedAt: string;
}

const sampleLists: BroadcastList[] = [
  { id: "1", name: "Pelanggan Aktif", description: "Kontak yang pernah bertransaksi", contactCount: 2340, createdAt: "2026-01-15", lastUsed: "2026-03-15", channels: ["whatsapp", "email"] },
  { id: "2", name: "Newsletter Subscribers", description: "Pelanggan langganan newsletter", contactCount: 1850, createdAt: "2026-01-20", lastUsed: "2026-03-14", channels: ["email"] },
  { id: "3", name: "WhatsApp Contacts", description: "Kontak WhatsApp terverifikasi", contactCount: 3200, createdAt: "2026-02-01", lastUsed: "2026-03-10", channels: ["whatsapp"] },
  { id: "4", name: "VIP Customers", description: "Pelanggan prioritas tinggi", contactCount: 156, createdAt: "2026-02-05", lastUsed: "2026-03-08", channels: ["whatsapp", "email"] },
  { id: "5", name: "Newsletter Mingguan", description: "Pelanggan yang subscribe mingguan", contactCount: 890, createdAt: "2026-02-10", lastUsed: "2026-03-05", channels: ["email"] },
];

const sampleContacts: ContactInList[] = [
  { id: "1", name: "Ahmad Fauzi", phone: "0812-3456-7890", email: "ahmad@email.com", addedAt: "2026-03-10" },
  { id: "2", name: "Budi Santoso", phone: "0813-9876-5432", email: "budi@email.com", addedAt: "2026-03-12" },
  { id: "3", name: "Dewi Lestari", phone: "0815-2345-6789", email: "dewi@email.com", addedAt: "2026-03-14" },
  { id: "4", name: "Eko Prasetyo", phone: "0821-5678-9012", email: "eko@email.com", addedAt: "2026-03-15" },
];

export default function BroadcastListsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedList, setSelectedList] = useState<BroadcastList | null>(null);

  const filteredLists = sampleLists.filter((list) =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openListContacts = (list: BroadcastList) => {
    setSelectedList(list);
    setShowContactsModal(true);
  };

  const totalContacts = sampleLists.reduce((acc, l) => acc + l.contactCount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Broadcast Lists"
        description="Kelola grup audience untuk kampanye"
        actions={
          <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
            <Plus size={15} />
            List Baru
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400">
              <List size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{sampleLists.length}</p>
              <p className="text-sm text-slate-400">Total Lists</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
              <Users size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{totalContacts.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Total Kontak</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {Math.round(totalContacts / sampleLists.length).toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Rata-rata per List</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Cari list..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* Lists Table */}
      {filteredLists.length > 0 ? (
        <Panel padded={false}>
          <TableWrap>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <Th>Nama List</Th>
                  <Th>Deskripsi</Th>
                  <Th>Channel</Th>
                  <Th className="text-right">Kontak</Th>
                  <Th>Terakhir Digunakan</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filteredLists.map((list) => (
                  <Tr key={list.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400">
                          <Users size={18} />
                        </div>
                        <span className="font-semibold text-white">{list.name}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-400">{list.description}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        {list.channels.includes("whatsapp") && (
                          <MessageSquare size={14} className="text-green-400" />
                        )}
                        {list.channels.includes("email") && (
                          <Mail size={14} className="text-blue-400" />
                        )}
                      </div>
                    </Td>
                    <Td className="text-right font-medium">{list.contactCount.toLocaleString()}</Td>
                    <Td className="text-slate-400">{list.lastUsed || "-"}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openListContacts(list)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                          title="Lihat Kontak"
                        >
                          <Users size={16} />
                        </button>
                        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                          <Edit3 size={16} />
                        </button>
                        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      ) : (
        <EmptyState
          icon={<Users size={24} />}
          title="Tidak ada list"
          description="Buat list audience pertama Anda"
          action={
            <button onClick={() => setShowCreateModal(true)} className={btn("primary")}>
              <Plus size={15} />
              Buat List
            </button>
          }
        />
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">List Baru</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Nama List</label>
                <input type="text" placeholder="Contoh: Pelanggan VIP" className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Deskripsi</label>
                <textarea
                  placeholder="Deskripsi list..."
                  className={inputClass}
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Channel</label>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-2 text-green-300">
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                  <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-slate-400">
                    <Mail size={16} />
                    Email
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateModal(false)} className={btn("secondary")}>
                  Batal
                </button>
                <button onClick={() => setShowCreateModal(false)} className={btn("primary")}>
                  Buat List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Modal */}
      {showContactsModal && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{selectedList.name}</h2>
                <p className="text-sm text-slate-400">{selectedList.contactCount.toLocaleString()} kontak</p>
              </div>
              <div className="flex items-center gap-2">
                <button className={btn("secondary", "sm")}>
                  <UserPlus size={14} />
                  Tambah
                </button>
                <button onClick={() => setShowContactsModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <TableWrap>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Nama</Th>
                      <Th>Telepon</Th>
                      <Th>Email</Th>
                      <Th> Ditambahkan</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleContacts.map((contact) => (
                      <Tr key={contact.id}>
                        <Td className="font-medium text-white">{contact.name}</Td>
                        <Td className="text-slate-400">{contact.phone}</Td>
                        <Td className="text-slate-400">{contact.email}</Td>
                        <Td className="text-slate-400">{contact.addedAt}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
