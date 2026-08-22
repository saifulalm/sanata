"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Users, ShieldCheck, UserX, ShieldAlert, X } from "lucide-react";
import type { PaginatedMeta } from "@/lib/api";
import type { AdminUser } from "@/lib/adminResources";
import { formatDate } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, inputClass, selectClass } from "@/components/admin/ui";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { createUserAction, updateUserRoleAction, toggleUserActiveAction, deleteUserAction, type UserActionState } from "./actions";

const ROLES = ["ADMIN", "EDITOR", "USER"] as const;

const ROLE_STYLES: Record<string, { tone: "neutral" | "success" | "warning" | "danger" | "info"; label: string }> = {
  ADMIN: { tone: "danger", label: "Admin" },
  EDITOR: { tone: "info", label: "Editor" },
  USER: { tone: "neutral", label: "User" },
};

const initialState: UserActionState = { status: "idle" };

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useActionState(createUserAction, initialState);
  return (
    <Panel
      title="Pengguna Baru"
      description="Pendaftaran publik selalu menghasilkan role USER — ADMIN & EDITOR hanya dibuat dari sini."
      actions={
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200">
          <X size={13} />
        </button>
      }
    >
      <form action={formAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">Nama</span>
          <input name="name" required minLength={2} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">Email</span>
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">Password Awal</span>
          <input name="password" type="password" required minLength={8} placeholder="minimal 8 karakter" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-400">Role</span>
          <select name="role" defaultValue="EDITOR" className={selectClass}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 md:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-white/20 bg-transparent" />
          Akun langsung aktif
        </label>
        <div className="flex items-end md:col-span-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20">
            <Plus size={15} /> Simpan
          </button>
        </div>
        {state.message && (
          <p className={`rounded-xl border px-4 py-2.5 text-sm md:col-span-2 xl:col-span-4 ${
            state.status === "success"
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-red-400/20 bg-red-500/10 text-red-200"
          }`}>
            {state.message}
          </p>
        )}
      </form>
    </Panel>
  );
}

export function UsersBoard({
  users: initial,
  meta,
  search,
}: {
  users: AdminUser[];
  meta: PaginatedMeta;
  search: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [searchVal, setSearchVal] = useState(search);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChange = (id: string, nextRole: string) => {
    setError("");
    startTransition(async () => {
      const result = await updateUserRoleAction(id, nextRole);
      if (result.status === "error") setError(result.message ?? "Gagal memperbarui role");
      router.refresh();
    });
  };

  const handleToggleActive = (id: string, next: boolean) => {
    setError("");
    startTransition(async () => {
      const result = await toggleUserActiveAction(id, next);
      if (result.status === "error") setError(result.message ?? "Gagal memperbarui status");
      router.refresh();
    });
  };

  const remove = (u: AdminUser) =>
    ask({
      title: `Hapus "${u.name}"?`,
      description: "Akun akan dihapus permanen beserta sesi loginnya.",
      onConfirm: () =>
        startTransition(async () => {
          const result = await deleteUserAction(u.id);
          if (!result.ok) setError(result.message ?? "Gagal menghapus");
          else router.refresh();
        }),
    });

  const stats = {
    total: meta.total,
    admins: users.filter((u) => u.role === "ADMIN").length,
    editors: users.filter((u) => u.role === "EDITOR").length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  return (
    <div className="space-y-6">

      <PageHeader
        eyebrow="Sistem"
        title="Pengguna"
        description="Kelola akun pengguna yang memiliki akses ke panel admin."
        actions={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
          >
            <Plus size={14} /> Pengguna Baru
          </button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} hint="akun" icon={<Users size={18} />} animated={false} />
        <StatCard label="Admin" value={stats.admins} hint="akses penuh" icon={<ShieldAlert size={18} />} accentColor="red" animated={false} />
        <StatCard label="Editor" value={stats.editors} hint="baca & tulis" icon={<ShieldCheck size={18} />} accentColor="cyan" animated={false} />
        <StatCard label="Nonaktif" value={stats.inactive} hint={stats.inactive === 0 ? "tidak ada" : "perlu dicek"} icon={<UserX size={18} />} accentColor={stats.inactive > 0 ? "amber" : "slate"} tone={stats.inactive > 0 ? "attention" : "default"} animated={false} />
      </div>

      {/* Toolbar */}
      <Toolbar>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition-all"
          />
        </div>
      </Toolbar>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      {creating && <CreateUserForm onClose={() => setCreating(false)} />}

      {/* Table */}
      {users.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title={search ? "Tidak ada hasil" : "Belum ada pengguna"}
          description={search ? "Coba ubah kata kunci pencarian." : "Tambahkan pengguna pertama untuk mengakses panel admin."}
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Login Terakhir</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleMeta = ROLE_STYLES[u.role] ?? { tone: "neutral" as const, label: u.role };
                return (
                  <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                    <Td>
                      <p className="text-sm font-medium text-slate-200">{u.name}</p>
                    </Td>
                    <Td>
                      <span className="text-sm text-slate-400">{u.email}</span>
                    </Td>
                    <Td>
                      <select
                        value={u.role}
                        disabled={isPending}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`${selectClass} w-auto px-2.5 py-1 text-xs`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Td>
                    <Td>
                      <button
                        onClick={() => handleToggleActive(u.id, !u.isActive)}
                        disabled={isPending}
                        className="disabled:opacity-50"
                      >
                        <Badge tone={u.isActive ? "success" : "danger"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </button>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => remove(u)}
                        disabled={isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Halaman {meta.page} dari {meta.totalPages} · {meta.total} data</p>
          <div className="flex gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setParam("page", String(meta.page - 1))}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setParam("page", String(meta.page + 1))}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
