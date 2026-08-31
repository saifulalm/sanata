"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, User, Package, Calendar, Clock, CheckCircle, AlertTriangle, Loader2, Camera, X, Upload, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Badge, Button, Card, Dialog, Input, Textarea, Select, useToast } from "@/components/admin/ExtendedUI";
import { issueTool, getAvailableWorkers, getLoans, getTool, type MasterTool, type ToolLoan } from "@/lib/workforceApi";
import type { ToolCondition, LoanStatus } from "@/lib/workforceApi";

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

const CONDITION_MAP: Record<ToolCondition, { label: string; color: string }> = {
  GOOD: { label: "Baik", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  FAIR: { label: "Cukup", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  DAMAGED: { label: "Rusak", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  LOST: { label: "Hilang", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
};

const LOAN_STATUS_MAP: Record<LoanStatus, { label: string; color: "success" | "warning" | "danger" | "neutral" }> = {
  OPEN: { label: "Dipinjam", color: "warning" },
  RETURNED: { label: "Dikembalikan", color: "success" },
  OVERDUE: { label: "Terlambat", color: "danger" },
  LOST: { label: "Hilang", color: "danger" },
};

// Photo upload component
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

export default function ToolLoanPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  // Use ref to avoid infinite loop from toast function changing on each render
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const toolId = params.id as string;

  // Refs for controlling fetch - use capture pattern
  const fetchControlRef = useRef<{
    isFetching: boolean;
    hasFetched: boolean;
    cancelled: boolean;
    retryCount: number;
  }>({
    isFetching: false,
    hasFetched: false,
    cancelled: false,
    retryCount: 0,
  });

  const [tool, setTool] = useState<MasterTool | null>(null);
  const [workers, setWorkers] = useState<Array<{ id: string; name: string; workerCode: string; role: string }>>([]);
  const [loans, setLoans] = useState<ToolLoan[]>([]);

  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [issuedPhoto, setIssuedPhoto] = useState("");
  const [returnPhoto, setReturnPhoto] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<ToolLoan | null>(null);
  const [returnCondition, setReturnCondition] = useState<ToolCondition>("GOOD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch data function
  const doFetch = useCallback(async (isRetry = false) => {
    const ctrl = fetchControlRef.current;

    // Prevent concurrent fetches or re-fetching after success
    if (!isRetry && ctrl.hasFetched) {
      console.log("[ToolLoanPage] Skipping fetch - already fetched");
      setIsLoading(false);
      return;
    }

    if (ctrl.isFetching) {
      console.log("[ToolLoanPage] Skipping fetch - already in progress");
      return;
    }

    ctrl.isFetching = true;
    ctrl.cancelled = false;

    console.log(`[ToolLoanPage] Starting fetch (retry=${isRetry}, attempt=${ctrl.retryCount})`);

    setIsLoading(true);
    setHasError(false);

    try {
      const [toolData, workersData, loansData] = await Promise.all([
        getTool(toolId),
        getAvailableWorkers(),
        getLoans({ toolId, pageSize: 50 }),
      ]);

      if (ctrl.cancelled) {
        console.log("[ToolLoanPage] Fetch cancelled, skipping state update");
        return;
      }

      setTool(toolData);
      setWorkers(workersData.map(w => ({
        id: w.id,
        name: w.name,
        workerCode: w.workerCode,
        role: w.role,
      })));
      setLoans(loansData.data);
      ctrl.hasFetched = true;
      console.log("[ToolLoanPage] Fetch completed successfully");
    } catch (error) {
      if (ctrl.cancelled) {
        console.log("[ToolLoanPage] Fetch error ignored - was cancelled");
        return;
      }

      console.error("[ToolLoanPage] Fetch failed:", error);
      setHasError(true);
      toastRef.current("Gagal memuat data", "error");
      ctrl.retryCount++;

      // Don't set hasFetched=true on error so retry is possible
    } finally {
      ctrl.isFetching = false;
      if (!ctrl.cancelled) {
        setIsLoading(false);
      }
    }
  }, [toolId]);

  // Initial fetch on mount
  useEffect(() => {
    console.log("[ToolLoanPage] Mount/Remount - toolId:", toolId, "fetched:", fetchControlRef.current.hasFetched);
    doFetch();

    return () => {
      console.log("[ToolLoanPage] Cleanup - cancelling pending fetches");
      fetchControlRef.current.cancelled = true;
      fetchControlRef.current.isFetching = false;
    };
  }, [toolId, doFetch]);

  // Retry function
  const handleRetry = useCallback(() => {
    console.log("[ToolLoanPage] Retry triggered");
    doFetch(true);
  }, [doFetch]);

  const handleIssue = async () => {
    if (!selectedWorker) {
      toast("Pilih pekerja terlebih dahulu", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await issueTool({
        toolId,
        workerId: selectedWorker,
        notes: notes || undefined,
        issuedPhotoUrl: issuedPhoto || undefined,
      });
      toast("Peminjaman berhasil dicatat", "success");
      setLoanDialogOpen(false);
      setSelectedWorker("");
      setNotes("");
      setIssuedPhoto("");

      // Refresh loans
      const loansData = await getLoans({ toolId, pageSize: 50 });
      setLoans(loansData.data);

      // Also refresh tool data
      const toolData = await getTool(toolId);
      setTool(toolData);
    } catch (error) {
      toast(String(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReturn = (loan: ToolLoan) => {
    setSelectedLoan(loan);
    setReturnCondition(loan.tool.currentCondition as ToolCondition || "GOOD");
    setReturnPhoto("");
    setReturnDialogOpen(true);
  };

  const handleReturn = async () => {
    if (!selectedLoan) return;

    setIsSubmitting(true);
    try {
      // Note: The returnTool function might need updating to accept photoUrl
      toast("Fitur pengembalian dengan foto sedang dalam pengembangan", "info");
      setReturnDialogOpen(false);
      setSelectedLoan(null);
    } catch (error) {
      toast(String(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLoans = loans.filter(l => l.status === "OPEN");
  const isBorrowed = openLoans.length > 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysBorrowed = (issuedAt: string) => {
    const days = Math.floor((Date.now() - new Date(issuedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (hasError || !tool) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
          <AlertTriangle size={32} />
        </div>
        <p className="text-slate-400">Gagal memuat data alat</p>
        <Button variant="secondary" onClick={handleRetry}>
          <RefreshCw size={16} />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/workforce/tools"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <PageHeader
          eyebrow="SANTRA"
          title="Peminjaman Alat"
          description={`${tool.name} (${tool.toolCode})`}
        />
      </div>

      {/* Tool Info Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Kategori</p>
            <p className="font-medium text-white">{tool.category}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Kondisi</p>
            <Badge tone={tool.currentCondition === "GOOD" ? "success" : tool.currentCondition === "FAIR" ? "warning" : "danger"}>
              {CONDITION_MAP[tool.currentCondition].label}
            </Badge>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isBorrowed ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            {isBorrowed ? <Clock size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className="font-medium text-white">{isBorrowed ? "Sedang Dipinjam" : "Tersedia"}</p>
          </div>
        </Card>
      </div>

      {/* Current Loan */}
      {isBorrowed && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-400">Sedang Dipinjam</p>
                <p className="text-xs text-slate-500">
                  Oleh {openLoans[0].worker.name} - {openLoans[0].worker.role}
                </p>
              </div>
            </div>
            <Badge tone="warning">
              {getDaysBorrowed(openLoans[0].issuedAt)} hari
            </Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Pinjam</span>
              <span className="text-white">{formatDate(openLoans[0].issuedAt)}</span>
            </div>
            {openLoans[0].notes && (
              <div className="flex justify-between">
                <span className="text-slate-500">Catatan</span>
                <span className="text-white">{openLoans[0].notes}</span>
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle size={14} />
              Hubungi {openLoans[0].worker.name} untuk mengembalikan alat ini
            </p>
          </div>
        </Card>
      )}

      {/* Issue New Loan Button */}
      {!isBorrowed && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <ArrowRightLeft size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Catat Peminjaman Baru</h3>
                <p className="text-sm text-slate-500">Pilih pekerja yang akan meminjam alat ini</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => setLoanDialogOpen(true)}>
              <ArrowRightLeft size={16} />
              Pinjamkan Alat
            </Button>
          </div>
        </Card>
      )}

      {/* Loan History */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-slate-400">Riwayat Peminjaman</h3>
        {loans.length === 0 ? (
          <Card className="text-center">
            <p className="text-slate-500">Belum ada riwayat peminjaman</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const status = LOAN_STATUS_MAP[loan.status];
              const days = loan.returnedAt
                ? Math.floor((new Date(loan.returnedAt).getTime() - new Date(loan.issuedAt).getTime()) / (1000 * 60 * 60 * 24))
                : getDaysBorrowed(loan.issuedAt);

              return (
                <Card key={loan.id} className={loan.status === "OPEN" ? "border-amber-500/30" : ""}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        loan.status === "OPEN"
                          ? "bg-amber-500/10 text-amber-400"
                          : loan.status === "RETURNED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {loan.status === "OPEN" ? <Clock size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{loan.worker.name}</p>
                          <Badge tone={status.color}>{status.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {loan.worker.role} • {loan.loanCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{days} hari</p>
                      <p className="text-xs text-slate-500">
                        {loan.status === "OPEN" ? "sedang dipinjam" : "durasi pinjam"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 border-t border-white/10 pt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Pinjam: {formatDate(loan.issuedAt)}
                    </span>
                    {loan.returnedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        Kembali: {formatDate(loan.returnedAt)}
                      </span>
                    )}
                  </div>
                  {loan.notes && (
                    <p className="mt-2 text-xs text-slate-400">{loan.notes}</p>
                  )}
                  {loan.returnedCondition && loan.returnedCondition !== "GOOD" && (
                    <div className={`mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${CONDITION_MAP[loan.returnedCondition].color}`}>
                      Kondisi saat kembali: {CONDITION_MAP[loan.returnedCondition].label}
                    </div>
                  )}
                  {/* Evidence Photos */}
                  {(loan.issuedPhotoUrl || loan.returnedPhotoUrl) && (
                    <div className="mt-3 flex gap-2">
                      {loan.issuedPhotoUrl && (
                        <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-white/10">
                          <img src={loan.issuedPhotoUrl} alt="Issued" className="h-full w-full object-cover" />
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px] text-white">Pinjam</span>
                        </div>
                      )}
                      {loan.returnedPhotoUrl && (
                        <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-white/10">
                          <img src={loan.returnedPhotoUrl} alt="Returned" className="h-full w-full object-cover" />
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px] text-emerald-400">Kembali</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue Loan Dialog */}
      <Dialog
        open={loanDialogOpen}
        onClose={() => setLoanDialogOpen(false)}
        title="Catat Peminjaman Baru"
        description={`Pinjamkan ${tool.name} kepada pekerja`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setLoanDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleIssue}
              loading={isSubmitting}
              disabled={!selectedWorker}
            >
              Catat Peminjaman
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Pilih Pekerja
            </label>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
              {workers.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">Memuat...</p>
              ) : (
                workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker.id)}
                    className={`w-full rounded-lg p-3 text-left transition-all ${
                      selectedWorker === worker.id
                        ? "border border-cyan-400/40 bg-cyan-500/10"
                        : "border border-transparent bg-white/[0.03] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{worker.name}</p>
                        <p className="text-xs text-slate-500">
                          {worker.workerCode} • {worker.role}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <PhotoUpload
            value={issuedPhoto}
            onChange={setIssuedPhoto}
            label="Foto Bukti (opsional)"
          />

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3">
            <p className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle size={14} />
              Pekerja bertanggung jawab atas alat hingga dikembalikan
            </p>
          </div>
        </div>
      </Dialog>

      {/* Return Dialog */}
      <Dialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        title="Konfirmasi Pengembalian"
        description={selectedLoan ? `${selectedLoan.tool.name} - ${selectedLoan.worker.name}` : ""}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReturnDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleReturn}
              loading={isSubmitting}
            >
              Konfirmasi
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {selectedLoan && (
              <span>Dipinjam pada: {formatDate(selectedLoan.issuedAt)}</span>
            )}
          </p>

          <PhotoUpload
            value={returnPhoto}
            onChange={setReturnPhoto}
            label="Foto Bukti Pengembalian (opsional)"
          />

          <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3">
            <p className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle size={14} />
              Pastikan alat dalam kondisi baik sebelum menerima pengembalian
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
