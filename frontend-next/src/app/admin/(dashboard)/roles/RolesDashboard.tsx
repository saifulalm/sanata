"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  ToggleLeft,
  ToggleRight,
  BadgeCheck,
  HardHat,
  Search,
  Plus,
  Pencil,
  Trash2,
  FileSignature,
  X,
} from "lucide-react";
import type { PaginatedMeta } from "@/lib/api";
import type { Signatory, WorkforceRole, ProjectRole } from "@/lib/adminSignatories";
import {
  PROJECT_ROLE_LABEL,
  FIELD_ROLES,
  SIGNATORY_ROLES,
  DEFAULT_ACTIVE_ROLES,
} from "@/lib/adminSignatories";
import {
  createSignatoryAction,
  updateSignatoryAction,
  deleteSignatoryAction,
  toggleWorkforceRoleAction,
  type SignatoryPayload,
} from "./actions";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { StatCard } from "@/components/admin/StatCard";
import {
  Badge,
  PageHeader,
  Panel,
  Toolbar,
  TableWrap,
  Th,
  Td,
  Tr,
  EmptyState,
  inputClass,
} from "@/components/admin/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Signatory Form (inline)
// ─────────────────────────────────────────────────────────────────────────────

function SignatoryForm({
  signatory,
  onClose,
  onSubmit,
}: {
  signatory?: Signatory;
  onClose: () => void;
  onSubmit: (payload: SignatoryPayload) => void;
}) {
  const [error, setError] = useState("");
  const isEdit = !!signatory;
  // Only roles accepted by the backend for signatories
  const ROLES = SIGNATORY_ROLES;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const name = (data.get("name") as string)?.trim();
    const title = (data.get("title") as string)?.trim();

    if (!name || name.length < 2) { setError("Nama wajib diisi (minimal 2 karakter)."); return; }
    if (!title || title.length < 2) { setError("Jabatan wajib diisi (minimal 2 karakter)."); return; }

    const roleValue = (data.get("role") as string) || null;
    onSubmit({
      name,
      title,
      role: roleValue as SignatoryPayload["role"],
      department: (data.get("department") as string)?.trim() || null,
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isEdit ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"}`}>
            {isEdit ? <Pencil size={15} /> : <Plus size={15} />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {isEdit ? `Sunting: ${signatory.name}` : "Tambah Penanda Tangan Baru"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit ? "Ubah data penanda tangan resmi." : "Lengkapi data penanda tangan untuk surat dan dokumen."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Nama Lengkap <span className="text-red-400">*</span></label>
            <input name="name" type="text" defaultValue={signatory?.name ?? ""} placeholder="Ir. Hendra Kusuma" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Jabatan / Title <span className="text-red-400">*</span></label>
            <input name="title" type="text" defaultValue={signatory?.title ?? ""} placeholder="Directeur Utama" required className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Role / Posisi</label>
            <select name="role" defaultValue={signatory?.role ?? ""} className={inputClass}>
              <option value="">— Pilih role —</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{PROJECT_ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Departemen / Unit</label>
            <input name="department" type="text" defaultValue={signatory?.department ?? ""} placeholder="Divisi Konstruksi" className={inputClass} />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-600">* wajib diisi</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
              Batal
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20">
              <Plus size={14} /> {signatory ? "Simpan Perubahan" : "Tambah Penanda Tangan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Penanda Tangan
// ─────────────────────────────────────────────────────────────────────────────

function SignatoriesTab({
  initial,
  meta,
}: {
  initial: Signatory[];
  meta: PaginatedMeta;
}) {
  const router = useRouter();
  // Sync local state whenever server data changes (after router.refresh)
  const [signatories, setSignatories] = useState(initial);
  const [editing, setEditing] = useState<Signatory | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  // Keep local signatories in sync with server data after mutations
  useEffect(() => { setSignatories(initial); }, [initial]);

  const handleSubmit = (payload: SignatoryPayload) => {
    setError("");
    const action = editing
      ? updateSignatoryAction(editing.id, payload)
      : createSignatoryAction(payload);

    startTransition(async () => {
      const result = await action;
      if (result.ok) {
        setCreating(false);
        setEditing(null);
        router.refresh();
      } else {
        setError(result.message ?? "Gagal menyimpan");
      }
    });
  };

  const remove = (s: Signatory) =>
    ask({
      title: `Hapus "${s.name}"?`,
      description: "Penanda tangan akan dihapus dari daftar resmi.",
      onConfirm: () =>
        startTransition(async () => {
          const result = await deleteSignatoryAction(s.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus");
          else router.refresh();
        }),
    });

  const stats = {
    total: meta.total,
    active: signatories.filter((s) => s.isActive).length,
    inactive: signatories.filter((s) => !s.isActive).length,
  };

  const filtered = signatories.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.title ?? "").toLowerCase().includes(q) || (s.department ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats.total} hint="penanda tangan" icon={<FileSignature size={16} />} accentColor="cyan" animated={false} />
        <StatCard label="Aktif" value={stats.active} hint="siap menandatangani" icon={<BadgeCheck size={16} />} accentColor="emerald" animated={false} />
        <StatCard label="Nonaktif" value={stats.inactive} hint={stats.inactive === 0 ? "tidak ada" : "perlu perhatian"} icon={<Users size={16} />} accentColor={stats.inactive > 0 ? "amber" : "cyan"} tone={stats.inactive > 0 ? "attention" : "default"} animated={false} />
      </div>

      {/* Toolbar */}
      <Toolbar>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau jabatan..." className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all" />
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {(["", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.06] hover:text-slate-200"}`}>
              {f === "" ? "Semua" : f === "active" ? "Aktif" : "Nonaktif"}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setCreating(true); }} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20">
          <Plus size={13} /> Tambah
        </button>
      </Toolbar>

      {/* Error */}
      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Form */}
      {(creating || editing) && (
        <SignatoryForm
          signatory={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileSignature size={20} />}
          title={search ? "Tidak ada hasil" : "Belum ada penanda tangan"}
          description={search ? "Coba ubah kata kunci pencarian." : "Tambahkan penanda tangan pertama untuk surat dan dokumen."}
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Jabatan</Th>
                <Th>Role</Th>
                <Th>Departemen</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-white/[0.02]">
                  <Td><p className="text-sm font-medium text-slate-200">{s.name}</p></Td>
                  <Td><p className="text-sm text-slate-300">{s.title}</p></Td>
                  <Td>
                    {s.role ? (
                      <Badge tone="neutral">{PROJECT_ROLE_LABEL[s.role] ?? s.role}</Badge>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </Td>
                  <Td><span className="text-sm text-slate-400">{s.department ?? "—"}</span></Td>
                  <Td><Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Aktif" : "Nonaktif"}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setCreating(false); setEditing(s); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200" title={`Sunting ${s.name}`}>
                        <Pencil size={13} />
                      </button>
                      <button disabled={isPending} onClick={() => remove(s)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40" title={`Hapus ${s.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Jabatan Lapangan
// ─────────────────────────────────────────────────────────────────────────────

function classifyRole(role: ProjectRole): "signing" | "field" | "other" {
  if (SIGNATORY_ROLES.includes(role)) return "signing";
  if (FIELD_ROLES.includes(role)) return "field";
  return "other";
}

function RoleRow({ role }: { role: WorkforceRole }) {
  const [isPending, startTransition] = useTransition();
  const category = classifyRole(role.role);

  const toggle = (active: boolean) =>
    startTransition(async () => { await toggleWorkforceRoleAction(role.id, active); });

  const badgeTone = category === "signing" ? "warning" as const : category === "field" ? "info" as const : "neutral" as const;

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-400">
            {category === "signing" ? <BadgeCheck size={14} /> : category === "field" ? <HardHat size={14} /> : <ShieldCheck size={14} />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{role.label}</p>
            <p className="text-[11px] text-slate-600">{role.role}</p>
          </div>
        </div>
      </Td>
      <Td>
        <Badge tone={badgeTone}>
          {category === "signing" ? "Tanda Tangan" : category === "field" ? "Lapangan" : "Lain"}
        </Badge>
      </Td>
      <Td>
        <span className="text-xs text-slate-500">
          {DEFAULT_ACTIVE_ROLES.includes(role.role) ? "Bawaan sistem" : "Kustom"}
        </span>
      </Td>
      <Td className="text-right">
        <button
          type="button"
          disabled={isPending || DEFAULT_ACTIVE_ROLES.includes(role.role)}
          onClick={() => toggle(!role.isActive)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            role.isActive
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/50"
              : "border-white/10 bg-white/[0.04] text-slate-500 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {role.isActive ? (
            <><ToggleRight size={14} className="text-emerald-400" /> Aktif</>
          ) : (
            <><ToggleLeft size={14} /> Nonaktif</>
          )}
        </button>
      </Td>
    </Tr>
  );
}

function WorkforceTab({ initialRoles }: { initialRoles: WorkforceRole[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialRoles.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return PROJECT_ROLE_LABEL[r.role].toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.label.toLowerCase().includes(q);
  });

  const stats = {
    total: initialRoles.length,
    active: initialRoles.filter((r) => r.isActive).length,
    signing: initialRoles.filter((r) => r.isActive && SIGNATORY_ROLES.includes(r.role)).length,
    field: initialRoles.filter((r) => r.isActive && FIELD_ROLES.includes(r.role)).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats.total} hint={`${stats.active} aktif`} icon={<ShieldCheck size={16} />} accentColor="cyan" animated={false} />
        <StatCard label="Tanda Tangan" value={stats.signing} hint="berwenang menandatangani" icon={<BadgeCheck size={16} />} accentColor="amber" animated={false} />
        <StatCard label="Lapangan" value={stats.field} hint="di laporan harian" icon={<HardHat size={16} />} accentColor="cyan" animated={false} />
      </div>

      {/* Toolbar */}
      <Toolbar>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari jabatan..." className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all" />
        </div>
      </Toolbar>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-500/5 px-4 py-3">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-cyan-400" />
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Role tanda tangan</strong> dipakai di surat dan dokumen resmi.{" "}
          <strong className="text-slate-300">Role lapangan</strong> dipilih saat mencatat laporan harian. Toggle aktif/nonaktif untuk menampilkan di dropdown.
        </p>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Tidak ada jabatan"
          description={search ? `Tidak ada jabatan yang cocok dengan "${search}"` : "Belum ada jabatan dalam daftar."}
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama Peran</Th>
                <Th>Kategori</Th>
                <Th>Tipe</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((role) => (
                <RoleRow key={role.id} role={role} />
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function RolesDashboard({
  initialRoles,
  signatories,
  signatoriesMeta,
}: {
  initialRoles: WorkforceRole[];
  signatories: Signatory[];
  signatoriesMeta: PaginatedMeta;
}) {
  const [tab, setTab] = useState<"signatories" | "workforce">("signatories");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Sistem"
        title="Jabatan & Penanda Tangan"
        description="Kelola penanda tangan resmi dan daftar jabatan tenaga kerja lapangan."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
              <Users size={13} /> Pengguna
            </Link>
          </div>
        }
      />

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 w-fit">
        <button
          onClick={() => setTab("signatories")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            tab === "signatories"
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSignature size={15} /> Penanda Tangan
        </button>
        <button
          onClick={() => setTab("workforce")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            tab === "workforce"
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <HardHat size={15} /> Jabatan Lapangan
        </button>
      </div>

      {/* Tab Content */}
      {tab === "signatories" ? (
        <SignatoriesTab initial={signatories} meta={signatoriesMeta} />
      ) : (
        <WorkforceTab initialRoles={initialRoles} />
      )}
    </div>
  );
}
