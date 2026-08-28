"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  BadgeCheck,
  X,
  Filter,
  ChevronDown,
  UserPlus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getWorkers,
  deleteWorker,
  verifyWorker,
  type Worker,
  type WorkerStatus,
  type WorkerGrade,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Panel,
  Select,
  Tabs,
  Textarea,
  Toast,
  useToast,
  TableRow,
  TableCell,
} from "@/components/admin/ExtendedUI";
import { TableWrap, Th, Td } from "@/components/admin/ui";

const STATUS_COLORS: Record<WorkerStatus, string> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  ON_LEAVE: "warning",
  TERMINATED: "danger",
};

const STATUS_LABELS: Record<WorkerStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  ON_LEAVE: "Cuti",
  TERMINATED: "Diberhentikan",
};

const GRADE_COLORS: Record<WorkerGrade, string> = {
  A: "success",
  B: "info",
  C: "warning",
  D: "danger",
};

interface WorkersTableProps {
  initialWorkers: Worker[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function WorkersTable({ initialWorkers, initialMeta }: WorkersTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [workers, setWorkers] = useState(initialWorkers);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkerStatus | "">("");
  const [gradeFilter, setGradeFilter] = useState<WorkerGrade | "">("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<Worker | null>(null);
  const [verifyDialog, setVerifyDialog] = useState<Worker | null>(null);

  const fetchWorkers = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getWorkers({
          page,
          search: search || undefined,
          status: statusFilter || undefined,
          grade: gradeFilter || undefined,
          role: roleFilter || undefined,
        });
        setWorkers(result.data);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data tenaga kerja", "error");
      }
    });
  };

  const handleSearch = () => {
    fetchWorkers(1);
  };

  const handlePageChange = (page: number) => {
    fetchWorkers(page);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    startTransition(async () => {
      try {
        await deleteWorker(deleteDialog.id);
        toast(`Worker "${deleteDialog.name}" berhasil dihapus`, "success");
        setDeleteDialog(null);
        fetchWorkers(meta.page);
      } catch {
        toast("Gagal menghapus worker", "error");
      }
    });
  };

  const handleVerify = async (verified: boolean) => {
    if (!verifyDialog) return;
    startTransition(async () => {
      try {
        await verifyWorker(verifyDialog.id, verified);
        toast(
          verified
            ? `Worker "${verifyDialog.name}" berhasil diverifikasi`
            : `Verifikasi worker "${verifyDialog.name}" dibatalkan`,
          "success"
        );
        setVerifyDialog(null);
        fetchWorkers(meta.page);
      } catch {
        toast("Gagal memperbarui verifikasi", "error");
      }
    });
  };

  const filteredWorkers = workers;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Cari nama, kode, atau telepon..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as WorkerStatus | ""); fetchWorkers(1); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
          <option value="ON_LEAVE">Cuti</option>
          <option value="TERMINATED">Diberhentikan</option>
        </select>

        <select
          value={gradeFilter}
          onChange={(e) => { setGradeFilter(e.target.value as WorkerGrade | ""); fetchWorkers(1); }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="">Semua Grade</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
          <option value="D">Grade D</option>
        </select>

        <Link
          href="/admin/workforce/workers/new"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <UserPlus size={16} />
          Tambah Worker
        </Link>
      </div>

      {/* Table */}
      {filteredWorkers.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Belum ada tenaga kerja"
          description="Tambahkan tenaga kerja pertama untuk memulai."
          action={
            <Link
              href="/admin/workforce/workers/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              Tambah Worker
            </Link>
          }
        />
      ) : (
        <>
          <Panel padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <Th>Worker</Th>
                    <Th>Kode</Th>
                    <Th>Role</Th>
                    <Th>Grade</Th>
                    <Th>Status</Th>
                    <Th>Verifikasi</Th>
                    <Th className="text-right">Aksi</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                            {worker.facePhotoUrl ? (
                              <img
                                src={worker.facePhotoUrl}
                                alt={worker.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <Users size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{worker.name}</p>
                            <p className="text-xs text-slate-500">{worker.phone || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-cyan-400">{worker.workerCode}</span>
                      </TableCell>
                      <TableCell>
                        <Badge tone="neutral">{worker.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {worker.grade ? (
                          <Badge tone={GRADE_COLORS[worker.grade] as "success" | "warning" | "danger" | "info" | "neutral"}>
                            Grade {worker.grade}
                          </Badge>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge tone={STATUS_COLORS[worker.status] as "success" | "warning" | "danger" | "info" | "neutral"}>
                          {STATUS_LABELS[worker.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {worker.ktpVerified ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle size={14} />
                            <span className="text-xs">Terverifikasi</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <AlertTriangle size={14} />
                            <span className="text-xs">Belum</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/workforce/workers/${worker.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </Link>
                          {!worker.ktpVerified && (
                            <button
                              onClick={() => setVerifyDialog(worker)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                              title="Verifikasi"
                            >
                              <BadgeCheck size={14} />
                            </button>
                          )}
                          <Link
                            href={`/admin/workforce/workers/${worker.id}/edit`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-400"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteDialog(worker)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-400"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              pageSize={meta.pageSize}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        title="Hapus Worker"
        description={`Yakin ingin menghapus "${deleteDialog?.name}"? Data yang dihapus tidak dapat dikembalikan.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isPending}>
              Hapus
            </Button>
          </div>
        }
      />

      {/* Verify Dialog */}
      <Dialog
        open={!!verifyDialog}
        onClose={() => setVerifyDialog(null)}
        title="Verifikasi Worker"
        description={`Verifikasi "${verifyDialog?.name}" (${verifyDialog?.workerCode})? Worker yang terverifikasi bisa ditugaskan ke proyek.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setVerifyDialog(null)}>
              Batal
            </Button>
            <Button variant="secondary" onClick={() => handleVerify(false)} loading={isPending}>
              Tolak
            </Button>
            <Button variant="primary" onClick={() => handleVerify(true)} loading={isPending}>
              Verifikasi
            </Button>
          </div>
        }
      />
    </div>
  );
}
