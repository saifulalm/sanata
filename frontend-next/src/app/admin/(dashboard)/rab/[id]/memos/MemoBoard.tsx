"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Inbox, Plus, Reply, Trash2 } from "lucide-react";
import {
  MEMO_CATEGORY_LABEL,
  MEMO_DIRECTION_LABEL,
  MEMO_STATUS_LABEL,
  MEMO_STATUS_TONE,
  type MemoBoardData,
  type MemoDirection,
  type MemoStatus,
  type SiteMemo,
} from "@/lib/projectDocs";
import { formatDate } from "@/lib/format";
import { Badge, btn, EmptyState, Panel, selectClass, Toolbar } from "@/components/admin/ui";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { StatCard } from "@/components/admin/StatCard";
import { deleteMemoAction, setMemoStatusAction } from "../documents/actions";
import { MemoForm, type MemoDraft } from "./MemoForm";

const DIRECTION_FILTERS: (MemoDirection | "ALL")[] = ["ALL", "INCOMING", "OUTGOING"];

const STATUSES: MemoStatus[] = ["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"];

export function MemoBoard({ data, canDelete }: { data: MemoBoardData; canDelete: boolean }) {
  const [filter, setFilter] = useState<MemoDirection | "ALL">("ALL");
  const [draft, setDraft] = useState<MemoDraft | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const rabId = data.rab.id;
  const visible = filter === "ALL" ? data.memos : data.memos.filter((m) => m.direction === filter);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Gagal memproses surat");
    });
  };

  if (draft) {
    return <MemoForm draft={draft} clientName={data.rab.clientName} onClose={() => setDraft(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Surat masuk" value={data.summary.incoming} icon={<ArrowDownLeft size={18} />} />
        <StatCard label="Surat keluar" value={data.summary.outgoing} icon={<ArrowUpRight size={18} />} />
        <StatCard
          label="Belum ditangani"
          value={data.summary.open}
          icon={<Inbox size={18} />}
          tone={data.summary.open > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Lewat tenggat"
          value={data.summary.overdue}
          icon={<AlertTriangle size={18} />}
          hint="Komplain yang belum dijawab melewati batas"
          tone={data.summary.overdue > 0 ? "attention" : "default"}
        />
      </div>

      <Toolbar>
        {DIRECTION_FILTERS.map((direction) => (
          <button
            key={direction}
            type="button"
            onClick={() => setFilter(direction)}
            className={btn(filter === direction ? "primary" : "ghost", "sm")}
          >
            {direction === "ALL" ? "Semua" : MEMO_DIRECTION_LABEL[direction]}
          </button>
        ))}
        <span className="ml-auto" />
        <button
          type="button"
          onClick={() => setDraft({ mode: "create", rabId, direction: "INCOMING" })}
          className={btn("secondary", "sm")}
        >
          <Plus size={13} /> Surat masuk
        </button>
        <button
          type="button"
          onClick={() => setDraft({ mode: "create", rabId, direction: "OUTGOING" })}
          className={btn("secondary", "sm")}
        >
          <Plus size={13} /> Surat keluar
        </button>
      </Toolbar>

      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title="Belum ada surat"
          description="Komplain klien dan balasan kontraktor dicatat di sini sebagai satu utas, lengkap dengan tenggat jawabannya."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              canDelete={canDelete}
              isPending={isPending}
              onEdit={() => setDraft({ mode: "edit", rabId, memo })}
              onReply={() =>
                setDraft({
                  mode: "reply",
                  rabId,
                  parent: memo,
                  direction: memo.direction === "INCOMING" ? "OUTGOING" : "INCOMING",
                })
              }
              onStatus={(status) => run(() => setMemoStatusAction(rabId, memo.id, status))}
              onDelete={() =>
                ask({
                  title: `Hapus ${memo.number}?`,
                  description: "Surat yang sudah tercatat sebaiknya ditutup, bukan dihapus — riwayatnya ikut hilang.",
                  onConfirm: () => run(() => deleteMemoAction(rabId, memo.id)),
                })
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function MemoCard({
  memo,
  canDelete,
  isPending,
  onEdit,
  onReply,
  onStatus,
  onDelete,
}: {
  memo: SiteMemo;
  canDelete: boolean;
  isPending: boolean;
  onEdit: () => void;
  onReply: () => void;
  onStatus: (status: MemoStatus) => void;
  onDelete: () => void;
}) {
  const incoming = memo.direction === "INCOMING";
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;

  return (
    <Panel
      className={memo.isOverdue ? "border-amber-400/25" : undefined}
      title={memo.subject}
      description={`${memo.number} · ${formatDate(memo.letterDate)} · ${memo.fromParty} → ${memo.toParty}`}
      actions={
        <>
          <Badge tone={incoming ? "warning" : "info"}>
            <Icon size={11} /> {MEMO_DIRECTION_LABEL[memo.direction]}
          </Badge>
          <Badge>{MEMO_CATEGORY_LABEL[memo.category]}</Badge>
          <Badge tone={MEMO_STATUS_TONE[memo.status]}>{MEMO_STATUS_LABEL[memo.status]}</Badge>
        </>
      }
    >
      <div className="space-y-4">
        {memo.isOverdue && (
          <p className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-100">
            <AlertTriangle size={14} />
            Lewat tenggat {memo.daysOverdue} hari — tenggat jawaban {memo.dueDate ? formatDate(memo.dueDate) : "-"}
          </p>
        )}

        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{memo.body}</p>

        {memo.parent && (
          <p className="text-xs text-slate-400">
            Menjawab <span className="font-mono text-slate-300">{memo.parent.number}</span> — {memo.parent.subject}
          </p>
        )}

        {memo.replies.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Balasan</p>
            <ul className="space-y-1 text-xs text-slate-300">
              {memo.replies.map((reply) => (
                <li key={reply.id}>
                  <span className="font-mono text-slate-400">{reply.number}</span> · {formatDate(reply.letterDate)} ·{" "}
                  {reply.subject}
                </li>
              ))}
            </ul>
          </div>
        )}

        {memo.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {memo.attachments.map((file) => (
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
          <button type="button" onClick={onReply} disabled={isPending} className={btn("primary", "sm")}>
            <Reply size={13} /> Balas
          </button>
          <button type="button" onClick={onEdit} className={btn("secondary", "sm")}>
            Sunting
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Status
            <select
              value={memo.status}
              onChange={(e) => onStatus(e.target.value as MemoStatus)}
              disabled={isPending}
              className={`${selectClass} w-44 py-1.5 text-xs`}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {MEMO_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          {canDelete && (
            <button type="button" onClick={onDelete} disabled={isPending} className={`${btn("danger", "sm")} ml-auto`}>
              <Trash2 size={13} /> Hapus
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
