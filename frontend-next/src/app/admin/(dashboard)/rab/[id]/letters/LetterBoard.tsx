"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, BadgeCheck, FileSignature, Plus, Send, Trash2, Wallet } from "lucide-react";
import {
  LETTER_STATUS_LABEL,
  LETTER_STATUS_TONE,
  LETTER_TYPE_FULL,
  LETTER_TYPE_HINT,
  LETTER_TYPE_LABEL,
  type LetterBoardData,
  type LetterStatus,
  type LetterType,
  type ProjectLetter,
} from "@/lib/projectDocs";
import { formatDate, formatRupiah } from "@/lib/format";
import { Badge, btn, EmptyState, Panel, Td, Th, TableWrap, Toolbar, Tr } from "@/components/admin/ui";
import { StatCard } from "@/components/admin/StatCard";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { deleteLetterAction, issueLetterAction, setLetterStatusAction } from "../documents/actions";
import { LetterForm } from "./LetterForm";
import type { Signatory } from "@/lib/adminSignatories";

const TYPES: LetterType[] = ["SPK", "INVOICE", "KWITANSI", "BAPP", "BAST"];

/** Status berikutnya yang masuk akal per jenis surat. */
function nextStatuses(letter: ProjectLetter): LetterStatus[] {
  if (letter.status === "DRAFT" || letter.status === "CANCELLED") return [];
  const money = letter.type === "INVOICE" || letter.type === "KWITANSI";
  return letter.status === "ISSUED"
    ? money
      ? ["PAID", "CANCELLED"]
      : ["SIGNED", "CANCELLED"]
    : letter.status === "SIGNED"
      ? money
        ? ["PAID", "CANCELLED"]
        : ["CANCELLED"]
      : ["CANCELLED"];
}

export function LetterBoard({ data, signatories, canIssue }: { data: LetterBoardData; signatories: Signatory[]; canIssue: boolean }) {
  const [filter, setFilter] = useState<LetterType | "ALL">("ALL");
  const [editing, setEditing] = useState<ProjectLetter | null>(null);
  const [creatingType, setCreatingType] = useState<LetterType | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const rabId = data.rab.id;
  const visible = filter === "ALL" ? data.letters : data.letters.filter((l) => l.type === filter);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Gagal memproses surat");
    });
  };

  if (editing || creatingType) {
    return (
      <LetterForm
        rabId={rabId}
        letter={editing}
        type={editing?.type ?? creatingType!}
        signatories={signatories}
        onClose={() => {
          setEditing(null);
          setCreatingType(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total surat" value={data.summary.total} icon={<FileSignature size={18} />} />
        <StatCard label="Masih draf" value={data.summary.drafts} icon={<Send size={18} />} hint="Belum bernomor pasti" />
        <StatCard
          label="Nilai ditagih"
          value={`Rp ${formatRupiah(data.summary.invoicedTotal)}`}
          icon={<Wallet size={18} />}
          hint={`Lunas Rp ${formatRupiah(data.summary.paidTotal)}`}
        />
        <StatCard
          label="Invoice jatuh tempo"
          value={data.summary.overdueInvoices}
          icon={<AlertTriangle size={18} />}
          tone={data.summary.overdueInvoices > 0 ? "attention" : "default"}
        />
      </div>

      <Toolbar>
        <button type="button" onClick={() => setFilter("ALL")} className={btn(filter === "ALL" ? "primary" : "ghost", "sm")}>
          Semua
        </button>
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            title={LETTER_TYPE_FULL[type]}
            className={btn(filter === type ? "primary" : "ghost", "sm")}
          >
            {LETTER_TYPE_LABEL[type]}
          </button>
        ))}
        <span className="ml-auto" />
        {TYPES.map((type) => (
          <button
            key={`new-${type}`}
            type="button"
            onClick={() => setCreatingType(type)}
            title={LETTER_TYPE_HINT[type]}
            className={btn("secondary", "sm")}
          >
            <Plus size={13} /> {LETTER_TYPE_LABEL[type]}
          </button>
        ))}
      </Toolbar>

      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileSignature size={20} />}
          title="Belum ada surat"
          description="SPK, invoice, kwitansi, BAPP, dan BAST proyek ini akan tampil di sini. Isinya terisi otomatis dari penawaran dan termin yang sudah ada."
        />
      ) : (
        <Panel padded={false}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Jenis</Th>
                <Th>Perihal</Th>
                <Th>Tanggal</Th>
                <Th className="text-right">Nilai</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {visible.map((letter) => (
                <Tr key={letter.id} className={letter.isOverdue ? "bg-amber-500/[0.06]" : undefined}>
                  <Td className="font-mono text-xs text-slate-300">
                    {letter.status === "DRAFT" ? (
                      <span className="text-slate-500">belum bernomor</span>
                    ) : (
                      letter.number
                    )}
                  </Td>
                  <Td>
                    <span title={LETTER_TYPE_FULL[letter.type]} className="text-xs text-slate-300">
                      {LETTER_TYPE_LABEL[letter.type]}
                    </span>
                  </Td>
                  <Td>
                    <p className="font-medium text-white">{letter.subject}</p>
                    <p className="text-xs text-slate-500">
                      {letter.recipientName}
                      {letter.billing && ` · dari ${letter.billing.number}`}
                      {letter.parentLetter && ` · lanjutan ${letter.parentLetter.number}`}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {formatDate(letter.letterDate)}
                    {letter.dueDate && (
                      <span className={letter.isOverdue ? "block text-amber-300" : "block text-slate-500"}>
                        jatuh tempo {formatDate(letter.dueDate)}
                      </span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums text-white">
                    {Number(letter.totalAmount) > 0 ? `Rp ${formatRupiah(letter.totalAmount)}` : "—"}
                  </Td>
                  <Td>
                    <Badge tone={LETTER_STATUS_TONE[letter.status]}>{LETTER_STATUS_LABEL[letter.status]}</Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {letter.status === "DRAFT" && (
                        <>
                          <button type="button" onClick={() => setEditing(letter)} className={btn("ghost", "sm")}>
                            Sunting
                          </button>
                          {canIssue && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                ask({
                                  title: "Terbitkan surat ini?",
                                  description:
                                    "Nomor resmi diberikan sekarang dan nilainya dibekukan. Setelah terbit, isinya tidak bisa diubah lagi.",
                                  confirmLabel: "Terbitkan",
                                  tone: "primary",
                                  onConfirm: () => run(() => issueLetterAction(rabId, letter.id)),
                                })
                              }
                              className={btn("primary", "sm")}
                            >
                              <BadgeCheck size={13} /> Terbitkan
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              ask({
                                title: "Hapus draf surat?",
                                description: "Draf belum punya nomor resmi, jadi menghapusnya tidak melubangi arsip.",
                                onConfirm: () => run(() => deleteLetterAction(rabId, letter.id)),
                              })
                            }
                            aria-label="Hapus draf"
                            className={btn("danger", "sm")}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}

                      {canIssue &&
                        nextStatuses(letter).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={isPending}
                            onClick={() => run(() => setLetterStatusAction(rabId, letter.id, status))}
                            className={btn(status === "CANCELLED" ? "danger" : "secondary", "sm")}
                          >
                            {LETTER_STATUS_LABEL[status]}
                          </button>
                        ))}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
