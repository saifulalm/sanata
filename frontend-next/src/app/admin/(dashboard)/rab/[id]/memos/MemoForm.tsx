"use client";

import { useState, useTransition } from "react";
import {
  MEMO_CATEGORY_LABEL,
  MEMO_DIRECTION_LABEL,
  type DocAttachment,
  type MemoCategory,
  type MemoDirection,
  type SiteMemo,
} from "@/lib/projectDocs";
import { todayIso } from "@/lib/format";
import { btn, inputClass, Panel, selectClass, textareaClass } from "@/components/admin/ui";
import { AttachmentsField } from "@/components/admin/AttachmentsField";
import { saveMemoAction } from "../documents/actions";

/**
 * Tiga cara formulir ini dibuka. Membalas bukan sekadar "buat baru dengan
 * kolom terisi": arah surat, lawan bicara, dan kaitan ke surat aslinya sudah
 * ditentukan, dan pemakai tidak boleh bisa mengubahnya menjadi tidak konsisten.
 */
export type MemoDraft =
  | { mode: "create"; rabId: string; direction: MemoDirection }
  | { mode: "edit"; rabId: string; memo: SiteMemo }
  | { mode: "reply"; rabId: string; parent: SiteMemo; direction: MemoDirection };

const CATEGORIES = Object.keys(MEMO_CATEGORY_LABEL) as MemoCategory[];

/** Berapa hari sejak tanggal surat sebuah komplain wajar dijawab. */
const DEFAULT_REPLY_DAYS = 7;

function addDaysIso(iso: string, days: number): string {
  const base = new Date(`${iso}T00:00:00Z`);
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

export function MemoForm({
  draft,
  clientName,
  onClose,
}: {
  draft: MemoDraft;
  clientName: string | null;
  onClose: () => void;
}) {
  const existing = draft.mode === "edit" ? draft.memo : null;
  const parent = draft.mode === "reply" ? draft.parent : null;
  const direction = existing?.direction ?? (draft.mode === "create" || draft.mode === "reply" ? draft.direction : "INCOMING");
  const incoming = direction === "INCOMING";

  const contractor = "Sanata Konstruksi";
  const counterparty = clientName ?? "Pemilik proyek";

  const [category, setCategory] = useState<MemoCategory>(
    existing?.category ?? (incoming ? "KOMPLAIN" : parent ? "APPROVAL" : "LAINNYA")
  );
  const [subject, setSubject] = useState(
    existing?.subject ?? (parent ? `Tanggapan atas ${parent.number} — ${parent.subject}` : "")
  );
  const [body, setBody] = useState(
    existing?.body ??
      (parent
        ? `Menanggapi surat nomor ${parent.number} perihal ${parent.subject}, bersama ini kami sampaikan hal-hal sebagai berikut:\n\n1. `
        : "")
  );
  const [fromParty, setFromParty] = useState(
    existing?.fromParty ?? (parent ? parent.toParty : incoming ? counterparty : contractor)
  );
  const [toParty, setToParty] = useState(
    existing?.toParty ?? (parent ? parent.fromParty : incoming ? contractor : counterparty)
  );
  const [letterDate, setLetterDate] = useState(existing?.letterDate ?? todayIso());
  const [handledAt, setHandledAt] = useState(existing?.handledAt ?? "");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [attachments, setAttachments] = useState<DocAttachment[]>(existing?.attachments ?? []);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError("");
    if (!subject.trim()) return setError("Perihal surat wajib diisi");
    if (!body.trim()) return setError("Isi surat wajib diisi");
    if (!fromParty.trim() || !toParty.trim()) return setError("Pengirim dan penerima wajib diisi");

    startTransition(async () => {
      const result = await saveMemoAction(
        {
          rabId: draft.rabId,
          direction,
          category,
          subject: subject.trim(),
          body: body.trim(),
          fromParty: fromParty.trim(),
          toParty: toParty.trim(),
          letterDate,
          handledAt: handledAt || null,
          // Surat masuk tanpa tenggat cenderung terlupakan, jadi diberi tenggat
          // wajar bila pemakai tidak mengisinya sendiri.
          dueDate: dueDate || (incoming ? addDaysIso(letterDate, DEFAULT_REPLY_DAYS) : null),
          parentId: parent?.id ?? null,
          attachments: attachments.filter((a) => a.url.trim() && a.name.trim()),
        },
        existing?.id
      );

      if (!result.ok) return setError(result.message ?? "Gagal menyimpan surat");
      onClose();
    });
  };

  const title = existing
    ? `Sunting ${existing.number}`
    : parent
      ? `Balas ${parent.number}`
      : `Catat ${MEMO_DIRECTION_LABEL[direction]}`;

  return (
    <Panel
      title={title}
      description={
        incoming
          ? "Surat yang diterima dari klien, konsultan, atau instansi — biasanya komplain atau instruksi."
          : "Surat yang dikirim kontraktor: tanggapan, approval, atau addendum."
      }
      actions={
        <>
          <button type="button" onClick={onClose} className={btn("ghost", "sm")}>
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={isPending} className={btn("primary", "sm")}>
            {isPending ? "Menyimpan…" : "Simpan surat"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Perihal">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Kategori">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MemoCategory)}
              className={selectClass}
            >
              {CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {MEMO_CATEGORY_LABEL[key]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dari">
            <input value={fromParty} onChange={(e) => setFromParty(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Kepada">
            <input value={toParty} onChange={(e) => setToParty(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tanggal surat">
            <input
              type="date"
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={incoming ? "Tanggal diterima" : "Tanggal dikirim"}>
            <input
              type="date"
              value={handledAt}
              onChange={(e) => setHandledAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          {incoming && (
            <Field label={`Tenggat jawaban (kosong = ${DEFAULT_REPLY_DAYS} hari)`}>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </Field>
          )}
        </div>

        <Field label="Isi surat">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${textareaClass} min-h-[200px]`}
          />
        </Field>

        <AttachmentsField value={attachments} onChange={setAttachments} label="Lampiran / hasil pindai surat" />
      </div>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}
