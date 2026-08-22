"use client";

import { useState, useTransition, Fragment } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Package,
  Plus,
  Send,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_TONE,
  SUBMISSION_TYPE_HINT,
  SUBMISSION_TYPE_LABEL,
  type Submission,
  type SubmissionType,
} from "@/lib/projectDocs";
import { formatDate, formatDateTime, formatNumber, formatRupiah } from "@/lib/format";
import { Badge, btn, EmptyState, Panel, Td, Th, TableWrap, Toolbar, Tr } from "@/components/admin/ui";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import {
  applyTimeExtensionAction,
  cancelSubmissionAction,
  clientDecisionAction,
  deleteSubmissionAction,
  forwardSubmissionAction,
  reviewSubmissionAction,
  submitSubmissionAction,
} from "../documents/actions";
import { SubmissionForm } from "./SubmissionForm";

const TYPE_ICON: Record<SubmissionType, typeof Package> = {
  ALAT: Truck,
  MATERIAL: Package,
  WAKTU: CalendarClock,
  RENCANA_WAKTU: CalendarClock,
};

const TYPE_FILTERS: (SubmissionType | "ALL")[] = ["ALL", "ALAT", "MATERIAL", "WAKTU", "RENCANA_WAKTU"];

export function SubmissionBoard({
  rabId,
  submissions,
  canDecide,
}: {
  rabId: string;
  submissions: Submission[];
  /** Hanya admin yang memutuskan; editor mengajukan saja. */
  canDecide: boolean;
}) {
  const [filter, setFilter] = useState<SubmissionType | "ALL">("ALL");
  const [editing, setEditing] = useState<Submission | null>(null);
  const [creatingType, setCreatingType] = useState<SubmissionType | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const visible = filter === "ALL" ? submissions : submissions.filter((s) => s.type === filter);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Gagal memproses pengajuan");
    });
  };

  if (editing || creatingType) {
    return (
      <SubmissionForm
        rabId={rabId}
        submission={editing}
        type={editing?.type ?? creatingType!}
        onClose={() => {
          setEditing(null);
          setCreatingType(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Toolbar>
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={btn(filter === type ? "primary" : "ghost", "sm")}
          >
            {type === "ALL" ? "Semua" : SUBMISSION_TYPE_LABEL[type]}
          </button>
        ))}
        <span className="ml-auto" />
        {(["ALAT", "MATERIAL", "WAKTU", "RENCANA_WAKTU"] as SubmissionType[]).map((type) => (
          <button key={type} type="button" onClick={() => setCreatingType(type)} className={btn("secondary", "sm")}>
            <Plus size={13} /> {SUBMISSION_TYPE_LABEL[type]}
          </button>
        ))}
      </Toolbar>

      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Send size={20} />}
          title="Belum ada pengajuan"
          description="Ajuan alat, material, dan waktu dari lapangan akan muncul di sini beserta jejak persetujuannya."
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Jenis</Th>
                <Th>Perihal</Th>
                <Th>Dibutuhkan</Th>
                <Th className="text-right">Perkiraan biaya</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {visible.map((submission) => {
                const Icon = TYPE_ICON[submission.type];
                const isOpen = expanded === submission.id;

                return (
                  <Fragment key={submission.id}>
                    <Tr>
                      <Td className="font-mono text-xs text-slate-300">{submission.number}</Td>
                      <Td>
                        <span className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Icon size={14} /> {SUBMISSION_TYPE_LABEL[submission.type]}
                        </span>
                      </Td>
                      <Td>
                        <p className="font-medium text-white">{submission.title}</p>
                        <p className="text-xs text-slate-500">Diajukan {submission.requestedByName}</p>
                      </Td>
                      <Td className="whitespace-nowrap text-xs">
                        {submission.neededDate ? formatDate(submission.neededDate) : "—"}
                        {submission.isOverdue && (
                          <span className="ml-1.5 text-[11px] font-semibold text-amber-300">lewat</span>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {submission.type === "WAKTU"
                          ? `${submission.requestedDays ?? 0} hari`
                          : `Rp ${formatRupiah(submission.estimatedCost)}`}
                      </Td>
                      <Td>
                        <Badge tone={SUBMISSION_STATUS_TONE[submission.status]}>
                          {SUBMISSION_STATUS_LABEL[submission.status]}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : submission.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? "Tutup rincian" : "Buka rincian"}
                          className={btn("ghost", "sm")}
                        >
                          <ChevronDown size={14} className={isOpen ? "rotate-180 transition" : "transition"} />
                        </button>
                      </Td>
                    </Tr>

                    {isOpen && (
                      <tr key={`${submission.id}-detail`}>
                        <td colSpan={7} className="border-b border-white/[0.05] bg-white/[0.02] px-4 py-5">
                          <SubmissionDetail
                            submission={submission}
                            canDecide={canDecide}
                            isPending={isPending}
                            onEdit={() => setEditing(submission)}
                            onSubmit={() => run(() => submitSubmissionAction(rabId, submission.id))}
                            onReview={(decision, note) =>
                              run(() => reviewSubmissionAction(rabId, submission.id, decision, note))
                            }
                            onForward={() => run(() => forwardSubmissionAction(rabId, submission.id))}
                            onClientDecision={(decision, by, note) =>
                              run(() => clientDecisionAction(rabId, submission.id, decision, by, note))
                            }
                            onApplySchedule={() =>
                              ask({
                                title: "Terapkan ke jadwal proyek?",
                                description: `${submission.requestedDays} hari akan ditambahkan sebagai hari libur proyek mulai hari ini, sehingga kurva rencana ikut mundur. Ambil baseline lebih dulu bila rencana awal masih perlu dibandingkan.`,
                                confirmLabel: "Terapkan",
                                tone: "primary",
                                onConfirm: () => run(() => applyTimeExtensionAction(rabId, submission.id)),
                              })
                            }
                            onCancel={() =>
                              ask({
                                title: "Batalkan pengajuan ini?",
                                description: "Nomornya tetap tercatat agar jejak dokumennya tidak berlubang.",
                                confirmLabel: "Batalkan",
                                onConfirm: () => run(() => cancelSubmissionAction(rabId, submission.id)),
                              })
                            }
                            onDelete={() =>
                              ask({
                                title: "Hapus draf pengajuan?",
                                description: "Draf yang belum dikirim akan hilang permanen.",
                                onConfirm: () => run(() => deleteSubmissionAction(rabId, submission.id)),
                              })
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

/** Rincian dan tombol aksi sesuai tahap yang sedang berjalan. */
function SubmissionDetail({
  submission,
  canDecide,
  isPending,
  onEdit,
  onSubmit,
  onReview,
  onForward,
  onClientDecision,
  onApplySchedule,
  onCancel,
  onDelete,
}: {
  submission: Submission;
  canDecide: boolean;
  isPending: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  onReview: (decision: "APPROVED" | "REJECTED", note: string | null) => void;
  onForward: () => void;
  onClientDecision: (decision: "APPROVED" | "REJECTED", by: string, note: string | null) => void;
  onApplySchedule: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState("");
  const [clientName, setClientName] = useState(submission.rab.clientName ?? "");
  const editable = submission.status === "DRAFT" || submission.status === "REJECTED";

  return (
    <div className="space-y-5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {SUBMISSION_TYPE_HINT[submission.type]}
      </p>

      {submission.reason && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Alasan</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-200">{submission.reason}</p>
        </div>
      )}

      {submission.items.length > 0 && (
        <TableWrap>
          <thead>
            <tr>
              <Th>Uraian</Th>
              <Th>Spesifikasi</Th>
              <Th className="text-right">Volume</Th>
              <Th className="text-right">Harga satuan</Th>
              <Th className="text-right">Jumlah</Th>
            </tr>
          </thead>
          <tbody>
            {submission.items.map((item) => (
              <Tr key={item.id}>
                <Td>{item.name}</Td>
                <Td className="text-xs text-slate-400">{item.spec ?? "—"}</Td>
                <Td className="text-right tabular-nums">
                  {formatNumber(item.quantity)} {item.unit}
                </Td>
                <Td className="text-right tabular-nums">{formatRupiah(item.unitPrice)}</Td>
                <Td className="text-right tabular-nums text-white">{formatRupiah(item.amount)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {submission.type === "WAKTU" && (
        <p className="text-sm text-slate-300">
          Diminta tambahan <strong className="text-white">{submission.requestedDays} hari</strong>
          {submission.newTargetDate && <> · target baru {formatDate(submission.newTargetDate)}</>}
        </p>
      )}

      <Trail submission={submission} />

      {submission.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {submission.attachments.map((file) => (
            <a
              key={file.url}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300 hover:text-white"
            >
              {file.name}
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
        {editable && (
          <>
            <button type="button" onClick={onEdit} className={btn("secondary", "sm")}>
              Sunting
            </button>
            <button type="button" onClick={onSubmit} disabled={isPending} className={btn("primary", "sm")}>
              <Send size={13} /> Kirim ke atasan
            </button>
          </>
        )}

        {canDecide && submission.status === "SUBMITTED" && (
          <>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan pemeriksaan (opsional)"
              className="w-56 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => onReview("APPROVED", note || null)}
              disabled={isPending}
              className={btn("primary", "sm")}
            >
              <Check size={13} /> Setujui
            </button>
            <button
              type="button"
              onClick={() => onReview("REJECTED", note || null)}
              disabled={isPending}
              className={btn("danger", "sm")}
            >
              <X size={13} /> Tolak
            </button>
          </>
        )}

        {canDecide && submission.status === "APPROVED_INTERNAL" && submission.needsClientApproval && (
          <button type="button" onClick={onForward} disabled={isPending} className={btn("primary", "sm")}>
            <ArrowRight size={13} /> Teruskan ke klien
          </button>
        )}

        {canDecide && submission.status === "FORWARDED_CLIENT" && (
          <>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nama pemberi keputusan"
              className="w-48 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => onClientDecision("APPROVED", clientName.trim() || "Klien", note || null)}
              disabled={isPending || !clientName.trim()}
              className={btn("primary", "sm")}
            >
              <Check size={13} /> Klien setuju
            </button>
            <button
              type="button"
              onClick={() => onClientDecision("REJECTED", clientName.trim() || "Klien", note || null)}
              disabled={isPending || !clientName.trim()}
              className={btn("danger", "sm")}
            >
              <X size={13} /> Klien tolak
            </button>
          </>
        )}

        {canDecide && submission.status === "APPROVED_CLIENT" && submission.type === "WAKTU" && (
          <button type="button" onClick={onApplySchedule} disabled={isPending} className={btn("primary", "sm")}>
            <CalendarClock size={13} /> Terapkan ke jadwal
          </button>
        )}

        <span className="ml-auto flex gap-2">
          {submission.status === "DRAFT" && (
            <button type="button" onClick={onDelete} disabled={isPending} className={btn("danger", "sm")}>
              <Trash2 size={13} /> Hapus
            </button>
          )}
          {!["DRAFT", "CANCELLED"].includes(submission.status) && (
            <button type="button" onClick={onCancel} disabled={isPending} className={btn("ghost", "sm")}>
              Batalkan
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

/** Jejak persetujuan, dibaca berurutan dari pengajuan sampai keputusan terakhir. */
function Trail({ submission }: { submission: Submission }) {
  const steps = [
    submission.submittedAt && { label: `Dikirim ${submission.requestedByName}`, at: submission.submittedAt },
    submission.reviewedAt && {
      label: `Diperiksa ${submission.reviewedByName ?? "atasan"}${submission.reviewNote ? ` — ${submission.reviewNote}` : ""}`,
      at: submission.reviewedAt,
    },
    submission.forwardedAt && { label: "Diteruskan ke pemilik proyek", at: submission.forwardedAt },
    submission.clientDecidedAt && {
      label: `Keputusan ${submission.clientDecidedBy ?? "klien"}${submission.clientNote ? ` — ${submission.clientNote}` : ""}`,
      at: submission.clientDecidedAt,
    },
  ].filter(Boolean) as { label: string; at: string }[];

  if (steps.length === 0) return null;

  return (
    <ol className="space-y-1.5 border-l border-white/10 pl-4 text-xs text-slate-400">
      {steps.map((step) => (
        <li key={step.at}>
          <span className="text-slate-200">{step.label}</span>
          <span className="ml-2 text-slate-500">{formatDateTime(step.at)}</span>
        </li>
      ))}
    </ol>
  );
}
