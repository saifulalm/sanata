"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { Handshake, Plus, Search, CheckCircle, Clock, AlertTriangle, Package, User, Filter, Loader2, ImagePlus, X, Camera } from "lucide-react";
import {
  getLoans, getTools, getAvailableWorkers, issueTool, returnTool,
  type ToolLoan, type ToolCondition, type MasterTool, type LoanStatus,
} from "@/lib/workforceApi";
import { Badge, Button, Card, Dialog, Input, Textarea, useToast } from "@/components/admin/ExtendedUI";

const ACCESS_COOKIE = "admin_access";

/**
 * Get access token from cookie (client-side)
 */
function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  // Fixed: Use correct regex pattern for cookie parsing
  const match = document.cookie.match(new RegExp(ACCESS_COOKIE + "=([^;]+)"));
  return match ? match[1] : null;
}

const STATUS_MAP: Record<LoanStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  OPEN: { label: "Dipinjam", tone: "warning" },
  RETURNED: { label: "Kembali", tone: "success" },
  OVERDUE: { label: "Terlambat", tone: "danger" },
  LOST: { label: "Hilang", tone: "danger" },
};

const CONDITION_MAP: Record<ToolCondition, { label: string; color: string }> = {
  GOOD: { label: "Baik", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  FAIR: { label: "Cukup", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  DAMAGED: { label: "Rusak", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  LOST: { label: "Hilang", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
};

// Simple photo upload component for loans
function PhotoUpload({
  value,
  onChange,
  label = "Foto Evidence"
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Get access token from cookie
      const accessToken = getAccessTokenFromCookie();

      // Build headers
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (data.media?.url) {
        onChange(data.media.url);
      }
    } catch (e) {
      setError("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-400">{label}</label>

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Evidence"
            className="h-32 w-full rounded-lg object-cover border border-white/10"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 text-slate-500 transition-colors hover:border-cyan-400/40 hover:text-cyan-400"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <div className="text-center">
              <Camera size={20} className="mx-auto mb-1" />
              <span className="text-xs">Tambah Foto</span>
            </div>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export function LoansList({
  initialLoans,
  initialMeta,
}: {
  initialLoans: ToolLoan[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  const [loans, setLoans] = useState(initialLoans);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "">("");

  // Issue dialog
  const [issueOpen, setIssueOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [notes, setNotes] = useState("");
  const [issuedPhoto, setIssuedPhoto] = useState("");
  const [availableTools, setAvailableTools] = useState<MasterTool[]>([]);
  const [workers, setWorkers] = useState<Array<{ id: string; name: string; workerCode: string; role: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Return dialog
  const [returnOpen, setReturnOpen] = useState<ToolLoan | null>(null);
  const [retCond, setRetCond] = useState<ToolCondition>("GOOD");
  const [returnPhoto, setReturnPhoto] = useState("");

  // Tool search
  const [toolSearch, setToolSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");

  const fetchLoans = (page = 1, status?: LoanStatus | "") => {
    start(async () => {
      try {
        const r = await getLoans({ page, status: status || undefined });
        setLoans(r.data);
        setMeta(r.meta);
      } catch {
        toast("Gagal memuat", "error");
      }
    });
  };

  const handleOpenIssue = async () => {
    setIssueOpen(true);
    setLoadingOptions(true);
    try {
      const [toolsData, workersData] = await Promise.all([
        getTools({ status: "available" }),
        getAvailableWorkers(),
      ]);
      setAvailableTools(toolsData);
      setWorkers(workersData.map(w => ({
        id: w.id,
        name: w.name,
        workerCode: w.workerCode,
        role: w.role,
      })));
    } catch {
      toast("Gagal memuat data", "error");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleIssue = () => {
    if (!selectedTool || !selectedWorker) {
      toast("Pilih alat & pekerja", "warning");
      return;
    }
    start(async () => {
      try {
        await issueTool({
          toolId: selectedTool,
          workerId: selectedWorker,
          notes: notes || undefined,
          issuedPhotoUrl: issuedPhoto || undefined,
        });
        toast("Peminjaman dicatat", "success");
        setIssueOpen(false);
        setSelectedTool("");
        setSelectedWorker("");
        setNotes("");
        setIssuedPhoto("");
        setIssuedPhoto("");
        fetchLoans(1);
      } catch (e) { toast(String(e), "error"); }
    });
  };

  const handleReturn = () => {
    if (!returnOpen) return;
    start(async () => {
      try {
        await returnTool(returnOpen.id, { condition: retCond, photoUrl: returnPhoto || undefined });
        toast("Alat dikembalikan", "success");
        setReturnOpen(null);
        setReturnPhoto("");
        fetchLoans(meta.page);
      } catch (e) { toast(String(e), "error"); }
    });
  };

  const handleStatusFilter = (status: LoanStatus | "") => {
    setStatusFilter(status);
    fetchLoans(1, status);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const getDaysBorrowed = (issuedAt: string) => {
    return Math.floor((Date.now() - new Date(issuedAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredLoans = loans.filter((l) => {
    if (search) {
      const s = search.toLowerCase();
      if (!l.tool.name.toLowerCase().includes(s) &&
          !l.worker.name.toLowerCase().includes(s) &&
          !l.loanCode.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  const filteredTools = availableTools.filter(t =>
    !toolSearch || t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.toolCode.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const filteredWorkers = workers.filter(w =>
    !workerSearch || w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.workerCode.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const statusCounts = {
    all: meta.total,
    OPEN: loans.filter(l => l.status === "OPEN").length,
    RETURNED: loans.filter(l => l.status === "RETURNED").length,
    LOST: loans.filter(l => l.status === "LOST").length,
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
            placeholder="Cari kode, alat, atau pekerja..."
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {([
            { value: "", label: "Semua", count: statusCounts.all },
            { value: "OPEN", label: "Dipinjam", count: statusCounts.OPEN },
            { value: "RETURNED", label: "Kembali", count: statusCounts.RETURNED },
            { value: "LOST", label: "Hilang", count: statusCounts.LOST },
          ] as const).map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => handleStatusFilter(value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === value
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                statusFilter === value ? "bg-cyan-500/20" : "bg-white/10"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <Button onClick={handleOpenIssue}>
          <Plus size={16} /> Catat Pinjaman
        </Button>
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <Card className="text-center py-12">
          <Handshake className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <p className="text-slate-400">Belum ada data peminjaman</p>
          <Button onClick={handleOpenIssue} className="mt-4">
            <Plus size={16} /> Catat Pinjaman Pertama
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {filteredLoans.map((loan) => {
              const s = STATUS_MAP[loan.status];
              const days = getDaysBorrowed(loan.issuedAt);
              const isOverdue = loan.status === "OPEN" && days > 7;

              return (
                <Card
                  key={loan.id}
                  className={`${loan.status === "OPEN" ? "border-amber-500/30" : loan.status === "LOST" ? "border-rose-500/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        loan.status === "OPEN"
                          ? isOverdue ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                          : loan.status === "RETURNED" ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {loan.status === "OPEN" ? <Clock size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-cyan-400">{loan.loanCode}</span>
                          <Badge tone={s.tone}>{s.label}</Badge>
                          {isOverdue && <Badge tone="danger">Terlambat {days} hari</Badge>}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm">
                          <span className="text-white">{loan.tool.name}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-white">{loan.worker.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Package size={12} />
                            {loan.tool.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {loan.worker.role}
                          </span>
                          <span>{fmt(loan.issuedAt)}</span>
                          {loan.returnedAt && (
                            <span className="text-emerald-400">Kembali: {fmt(loan.returnedAt)}</span>
                          )}
                        </div>
                        {loan.notes && (
                          <p className="mt-2 text-xs text-slate-400 bg-white/5 rounded-lg px-2 py-1 inline-block">
                            {loan.notes}
                          </p>
                        )}
                        {loan.returnedCondition && loan.returnedCondition !== "GOOD" && (
                          <div className={`mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${CONDITION_MAP[loan.returnedCondition].color}`}>
                            <AlertTriangle size={12} />
                            Kondisi kembali: {CONDITION_MAP[loan.returnedCondition].label}
                          </div>
                        )}
                        {/* Evidence Photos */}
                        {(loan.issuedPhotoUrl || loan.returnedPhotoUrl) && (
                          <div className="mt-2 flex gap-1">
                            {loan.issuedPhotoUrl && (
                              <img src={loan.issuedPhotoUrl} alt="Issued" className="h-8 w-12 rounded border border-white/10 object-cover" />
                            )}
                            {loan.returnedPhotoUrl && (
                              <img src={loan.returnedPhotoUrl} alt="Returned" className="h-8 w-12 rounded border border-white/10 object-cover" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{days} hari</p>
                        <p className="text-xs text-slate-500">
                          {loan.status === "OPEN" ? "sedang dipinjam" : "durasi"}
                        </p>
                      </div>
                      {loan.status === "OPEN" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setReturnOpen(loan); setRetCond("GOOD"); }}
                          className="text-amber-400 hover:text-amber-300"
                        >
                          <CheckCircle size={14} /> Kembalikan
                        </Button>
                      )}
                      <Link
                        href={`/admin/workforce/tools/${loan.toolId}/loan`}
                        className="text-xs text-slate-500 hover:text-cyan-400"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => fetchLoans(meta.page - 1)}
                disabled={meta.page <= 1}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 transition hover:border-white/18 disabled:opacity-40"
              >
                ←
              </button>
              <span className="text-sm text-slate-500">
                Halaman {meta.page} dari {meta.totalPages}
              </span>
              <button
                onClick={() => fetchLoans(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 transition hover:border-white/18 disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* Issue Dialog */}
      <Dialog
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Catat Peminjaman Baru"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>Batal</Button>
            <Button
              onClick={handleIssue}
              loading={pending}
              disabled={!selectedTool || !selectedWorker}
            >
              Catat Peminjaman
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Catat peminjaman alat kepada pekerja. Pekerja bertanggung jawab atas alat hingga dikembalikan.
          </p>

          {loadingOptions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              {/* Tool Selection */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Pilih Alat <span className="text-rose-400">*</span>
                </label>
                <input
                  type="search"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Cari alat..."
                  className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
                  {filteredTools.length === 0 ? (
                    <p className="p-2 text-xs text-slate-500">Tidak ada alat tersedia</p>
                  ) : (
                    filteredTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        className={`w-full rounded-lg p-2 text-left text-sm transition ${
                          selectedTool === tool.id
                            ? "border border-cyan-400/40 bg-cyan-500/10"
                            : "border border-transparent hover:bg-white/5"
                        }`}
                      >
                        <span className="font-medium text-white">{tool.name}</span>
                        <span className="ml-2 text-xs text-slate-500">{tool.toolCode}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Worker Selection */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Pilih Pekerja <span className="text-rose-400">*</span>
                </label>
                <input
                  type="search"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  placeholder="Cari pekerja..."
                  className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
                  {filteredWorkers.length === 0 ? (
                    <p className="p-2 text-xs text-slate-500">Tidak ada pekerja</p>
                  ) : (
                    filteredWorkers.map((worker) => (
                      <button
                        key={worker.id}
                        onClick={() => setSelectedWorker(worker.id)}
                        className={`w-full rounded-lg p-2 text-left text-sm transition ${
                          selectedWorker === worker.id
                            ? "border border-cyan-400/40 bg-cyan-500/10"
                            : "border border-transparent hover:bg-white/5"
                        }`}
                      >
                        <span className="font-medium text-white">{worker.name}</span>
                        <span className="ml-2 text-xs text-slate-500">{worker.workerCode}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Catatan (opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  rows={2}
                />
              </div>

              {/* Photo Evidence */}
              <PhotoUpload
                value={issuedPhoto}
                onChange={setIssuedPhoto}
                label="Foto Evidence (opsional)"
              />
            </>
          )}

          <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3">
            <p className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle size={14} />
              Pastikan alat dalam kondisi baik sebelum dipinjamkan
            </p>
          </div>
        </div>
      </Dialog>

      {/* Return Dialog */}
      <Dialog
        open={!!returnOpen}
        onClose={() => setReturnOpen(null)}
        title="Konfirmasi Pengembalian"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReturnOpen(null)}>Batal</Button>
            <Button onClick={handleReturn} loading={pending}>Konfirmasi</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {returnOpen?.tool.name} — dipinjam oleh {returnOpen?.worker.name}
          </p>
          <div>
            <p className="mb-2 text-xs text-slate-500">Kondisi saat dikembalikan:</p>
            <div className="grid grid-cols-2 gap-2">
              {(["GOOD", "FAIR", "DAMAGED", "LOST"] as ToolCondition[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setRetCond(c)}
                  className={`rounded-xl border p-3 text-left ${
                    retCond === c ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/18"
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    c === "GOOD" ? "text-emerald-400" : c === "FAIR" ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {CONDITION_MAP[c].label}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {c === "GOOD" ? "Alat berfungsi normal" : c === "FAIR" ? "Ada sedikit cacat" : "Perlu perbaikan/hilang"}
                  </p>
                </button>
              ))}
            </div>
          </div>
          {retCond === "DAMAGED" && (
            <div className="rounded-lg border border-rose-400/20 bg-rose-500/5 p-3">
              <p className="text-xs text-rose-400">
                ⚠️ Alat mengalami kerusakan. Kondisi alat akan diupdate dan pihak terkait akan diberitahu.
              </p>
            </div>
          )}
          {retCond === "LOST" && (
            <div className="rounded-lg border border-rose-400/20 bg-rose-500/5 p-3">
              <p className="text-xs text-rose-400">
                ⚠️ Alat dinyatakan hilang. Status peminjaman akan diperbarui dan perlu investigasi lebih lanjut.
              </p>
            </div>
          )}

          {/* Return Photo Evidence */}
          <PhotoUpload
            value={returnPhoto}
            onChange={setReturnPhoto}
            label="Foto Evidence Pengembalian (opsional)"
          />
        </div>
      </Dialog>
    </div>
  );
}
