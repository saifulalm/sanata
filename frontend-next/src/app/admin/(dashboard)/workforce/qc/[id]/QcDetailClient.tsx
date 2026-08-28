"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Camera,
  User,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  getQcRecord,
  approveQcRecord,
  createRework,
  type QcRecord,
  type QcResult,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Dialog,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";

interface Props {
  params: { id: string };
  record: QcRecord;
}

const RESULT_CONFIG: Record<QcResult, { label: string; color: "success" | "warning" | "danger"; icon: React.ReactNode }> = {
  PASS: { label: "Pass", color: "success", icon: <CheckCircle size={14} /> },
  FAIL: { label: "Fail", color: "danger", icon: <XCircle size={14} /> },
  REWORK: { label: "Rework", color: "warning", icon: <RefreshCw size={14} /> },
};

export function QcDetailClient({ record: initialRecord }: { record: QcRecord }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [record, setRecord] = useState(initialRecord);
  const [approveDialog, setApproveDialog] = useState(false);
  const [reworkDialog, setReworkDialog] = useState(false);
  const [reworkNotes, setReworkNotes] = useState("");

  const result = RESULT_CONFIG[record.result] || { label: record.result, color: "neutral" as const, icon: null };

  const handleApprove = async () => {
    startTransition(async () => {
      try {
        await approveQcRecord(record.id);
        toast("QC berhasil disetujui", "success");
        setApproveDialog(false);
        router.refresh();
      } catch {
        toast("Gagal approve QC", "error");
      }
    });
  };

  const handleRework = async () => {
    if (!reworkNotes.trim()) {
      toast("Deskripsi rework wajib diisi", "warning");
      return;
    }
    startTransition(async () => {
      try {
        await createRework(record.id, {
          defectDesc: reworkNotes,
          workerId: record.workerId,
        });
        toast("Rework berhasil dibuat", "success");
        setReworkDialog(false);
        setReworkNotes("");
        router.refresh();
      } catch {
        toast("Gagal membuat rework", "error");
      }
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/workforce/qc" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="font-mono text-sm text-cyan-400">{record.qcCode}</p>
            <h1 className="text-xl font-bold text-white">Quality Control</h1>
          </div>
        </div>
        <Badge tone={result.color as "success" | "warning" | "danger"}>{result.icon}{result.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-white">Item & Criteria</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Item Description</p>
                <p className="mt-1 font-medium text-white">{record.itemDesc || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Criteria</p>
                <p className="mt-1 font-medium text-white">{record.criteria || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Measurement</p>
                <p className="mt-1 font-medium text-white">{record.measurement || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Defect Description</p>
                <p className="mt-1 text-rose-400">{record.defectDesc || "—"}</p>
              </div>
            </div>
          </Card>

          {record.defectDesc && (
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <AlertTriangle size={18} className="text-amber-400" />
                Defect Detail
              </h3>
              <p className="text-sm text-white leading-relaxed">{record.defectDesc}</p>
            </Card>
          )}

          {/* Photos */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Camera size={16} />
              Evidence Photos ({record.photos?.length || 0})
            </h3>
            {record.photos?.length ? (
              <div className="grid grid-cols-2 gap-3">
                {record.photos.map((p) => (
                  <div key={p.id} className="relative overflow-hidden rounded-xl border border-white/10">
                    <img src={p.url} alt={p.caption || ""} className="aspect-video w-full object-cover" />
                    {p.caption && (
                      <div className="bg-black/60 p-2 text-xs text-white">{p.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Tidak ada foto</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <User size={16} />
              Worker
            </h3>
            <p className="font-medium text-white">{record.worker.name}</p>
            <p className="text-xs text-slate-500">{record.worker.role}</p>
            <p className="mt-1 font-mono text-xs text-cyan-400">{record.worker.workerCode}</p>
          </Card>

          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Calendar size={16} />
              Tanggal & Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tanggal</span>
                <span className="text-white">{formatDate(record.checkDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <Badge tone={record.approvedAt ? "success" : record.isRework ? "warning" : "neutral"}>
                  {record.approvedAt ? "Approved" : record.isRework ? "Rework" : "Pending"}
                </Badge>
              </div>
              {record.approvedAt && (
                <div className="text-xs text-emerald-400">Approved {formatDate(record.approvedAt)}</div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="mb-4 text-sm font-medium text-slate-400">Aksi</h3>
            <div className="space-y-2">
              {record.result === "FAIL" && !record.approvedAt && (
                <>
                  <button
                    onClick={() => setApproveDialog(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    <CheckCircle size={16} />
                    Approve Despite Fail
                  </button>
                  <button
                    onClick={() => setReworkDialog(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    <RefreshCw size={16} />
                    Create Rework
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialog}
        onClose={() => setApproveDialog(false)}
        title="Approve QC"
        description={`Setujui "${record.qcCode}" walau hasilnya FAIL?`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setApproveDialog(false)}>Batal</Button>
            <Button variant="primary" onClick={handleApprove} loading={isPending}>
              <CheckCircle size={16} /> Approve
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-400">
          QC ini hasilnya <Badge tone="danger">FAIL</Badge> — lanjutkan approval?
        </p>
      </Dialog>

      {/* Rework Dialog */}
      <Dialog
        open={reworkDialog}
        onClose={() => { setReworkDialog(false); setReworkNotes(""); }}
        title="Create Rework"
        description={`Buat rework untuk "${record.qcCode}"`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setReworkDialog(false); setReworkNotes(""); }}>Batal</Button>
            <Button variant="primary" onClick={handleRework} loading={isPending} disabled={!reworkNotes.trim()}>
              <RefreshCw size={16} /> Create Rework
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Defect Description *</label>
            <textarea
              value={reworkNotes}
              onChange={(e) => setReworkNotes(e.target.value)}
              placeholder="Jelaskan defect yang ditemukan..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
