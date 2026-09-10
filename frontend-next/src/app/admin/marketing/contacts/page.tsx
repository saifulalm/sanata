"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Tag,
  Mail,
  MessageSquare,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Edit3,
  Eye,
  Phone,
  User,
  Calendar,
  CheckSquare,
  Square,
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

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  status: "active" | "inactive";
  createdAt: string;
  lastContact?: string;
  source: string;
}

const sampleContacts: Contact[] = [
  { id: "1", name: "Ahmad Fauzi", email: "ahmad.fauzi@email.com", phone: "0812-3456-7890", tags: ["priority", "whatsapp"], status: "active", createdAt: "2026-01-15", lastContact: "2026-03-15", source: "Website" },
  { id: "2", name: "Budi Santoso", email: "budi.s@email.com", phone: "0813-9876-5432", tags: ["newsletter"], status: "active", createdAt: "2026-01-20", lastContact: "2026-03-14", source: "Newsletter" },
  { id: "3", name: "Dewi Lestari", email: "dewi.lestari@email.com", phone: "0815-2345-6789", tags: ["whatsapp", "vip"], status: "active", createdAt: "2026-02-01", lastContact: "2026-03-10", source: "WhatsApp" },
  { id: "4", name: "Eko Prasetyo", email: "eko.pras@email.com", phone: "0821-5678-9012", tags: ["newsletter"], status: "active", createdAt: "2026-02-05", lastContact: "2026-03-08", source: "Website" },
  { id: "5", name: "Fitri Handayani", email: "fitri.h@email.com", phone: "0852-3456-7890", tags: ["priority"], status: "inactive", createdAt: "2026-02-10", lastContact: "2026-02-20", source: "Referral" },
  { id: "6", name: "Gunawan Wijaya", email: "gunawan.w@email.com", phone: "0878-9012-3456", tags: ["whatsapp"], status: "active", createdAt: "2026-02-15", lastContact: "2026-03-12", source: "WhatsApp" },
  { id: "7", name: "Hendra Kusuma", email: "hendra.k@email.com", phone: "0896-7890-1234", tags: ["newsletter", "priority"], status: "active", createdAt: "2026-02-20", lastContact: "2026-03-05", source: "Newsletter" },
];

const tagColors: Record<string, string> = {
  priority: "bg-amber-400/10 border-amber-400/30 text-amber-300",
  whatsapp: "bg-green-400/10 border-green-400/30 text-green-300",
  newsletter: "bg-blue-400/10 border-blue-400/30 text-blue-300",
  vip: "bg-purple-400/10 border-purple-400/30 text-purple-300",
};

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const itemsPerPage = 10;

  const filteredContacts = sampleContacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedContacts.length === paginatedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(paginatedContacts.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const openContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Marketing"
        title="Kontak"
        description="Kelola database kontak dan audience"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImportModal(true)} className={btn("secondary")}>
              <Upload size={15} />
              Impor CSV
            </button>
            <button className={btn("primary")}>
              <Plus size={15} />
              Tambah Kontak
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm text-slate-400">Total Kontak</p>
          <p className="mt-1 text-2xl font-semibold text-white">5,430</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm text-slate-400">Aktif</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">4,125</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm text-slate-400">WhatsApp</p>
          <p className="mt-1 text-2xl font-semibold text-green-400">3,200</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm text-slate-400">Email</p>
          <p className="mt-1 text-2xl font-semibold text-blue-400">1,850</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
          <span className="text-sm text-cyan-200">{selectedContacts.length} kontak dipilih</span>
          <button onClick={() => setShowTagModal(true)} className={btn("secondary", "sm")}>
            <Tag size={14} />
            Beri Tag
          </button>
          <button className={btn("secondary", "sm")}>
            <Mail size={14} />
            Kirim Email
          </button>
          <button className={btn("secondary", "sm")}>
            <MessageSquare size={14} />
            Kirim WA
          </button>
          <button className={btn("danger", "sm")}>
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      )}

      {/* Filters */}
      <Panel padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, email, atau telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
            style={{ width: "auto" }}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>

          <button className={btn("secondary", "sm")}>
            <Filter size={14} />
            Filter Lanjutan
          </button>

          <button className={btn("secondary", "sm")}>
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Contacts Table */}
        {filteredContacts.length > 0 ? (
          <>
            <TableWrap>
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr>
                    <Th>
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === paginatedContacts.length && paginatedContacts.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-white/20 bg-white/5"
                      />
                    </Th>
                    <Th>Kontak</Th>
                    <Th>Telepon</Th>
                    <Th>Tags</Th>
                    <Th>Status</Th>
                    <Th>Terakhir Kontak</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContacts.map((contact) => (
                    <Tr key={contact.id}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          className="h-4 w-4 rounded border-white/20 bg-white/5"
                        />
                      </Td>
                      <Td>
                        <div>
                          <p className="font-medium text-white">{contact.name}</p>
                          <p className="text-xs text-slate-500">{contact.email}</p>
                        </div>
                      </Td>
                      <Td className="text-slate-400">{contact.phone}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${tagColors[tag] || "border-white/10 bg-white/5 text-slate-400"}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={contact.status === "active" ? "success" : "neutral"}>
                          {contact.status === "active" ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </Td>
                      <Td className="text-slate-400">{contact.lastContact || "-"}</Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openContactDetail(contact)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-cyan-300"
                          >
                            <Eye size={16} />
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

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-white/[0.07] p-4">
              <span className="text-sm text-slate-400">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredContacts.length)} dari{" "}
                {filteredContacts.length} kontak
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
            icon={<User size={24} />}
            title="Tidak ada kontak"
            description="Tambahkan kontak pertama atau impor dari CSV"
            action={
              <div className="flex gap-2">
                <button onClick={() => setShowImportModal(true)} className={btn("secondary")}>
                  <Upload size={15} />
                  Impor CSV
                </button>
                <button className={btn("primary")}>
                  <Plus size={15} />
                  Tambah Kontak
                </button>
              </div>
            }
          />
        )}
      </Panel>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Impor Kontak dari CSV</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8">
                <div className="text-center">
                  <Upload size={32} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm text-slate-300">Seret file CSV ke sini</p>
                  <p className="mt-1 text-xs text-slate-500">atau klik untuk memilih file</p>
                  <button className="mt-4 rounded-lg bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                    Pilih File
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">Format CSV yang didukung:</p>
                <p className="mt-1 text-xs text-slate-400">
                  name, email, phone, tags (pisahkan dengan koma)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowImportModal(false)} className={btn("secondary")}>
                  Batal
                </button>
                <button className={btn("primary")}>Impor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Detail Modal */}
      {showDetailModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Detail Kontak</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-400">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedContact.name}</h3>
                  <p className="text-sm text-slate-400">{selectedContact.email}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-white">{selectedContact.phone}</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-white">Bergabung {selectedContact.createdAt}</span>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-400">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${tagColors[tag] || "border-white/10 bg-white/5 text-slate-400"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button className={`${btn("primary")} flex-1`}>
                  <MessageSquare size={15} />
                  Kirim WhatsApp
                </button>
                <button className={`${btn("secondary")} flex-1`}>
                  <Mail size={15} />
                  Kirim Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1626] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Berikan Tag</h2>
              <button
                onClick={() => setShowTagModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {["priority", "whatsapp", "newsletter", "vip"].map((tag) => (
                <button
                  key={tag}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-white/5 ${tagColors[tag]}`}
                >
                  <CheckSquare size={16} />
                  <span className="capitalize">{tag}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowTagModal(false)} className={btn("secondary")}>
                Batal
              </button>
              <button onClick={() => setShowTagModal(false)} className={btn("primary")}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
