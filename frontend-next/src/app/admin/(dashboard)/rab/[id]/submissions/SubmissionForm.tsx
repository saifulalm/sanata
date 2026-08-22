"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  SUBMISSION_TYPE_HINT,
  SUBMISSION_TYPE_LABEL,
  type DocAttachment,
  type Submission,
  type SubmissionType,
} from "@/lib/projectDocs";
import { formatRupiah, todayIso } from "@/lib/format";
import { btn, inputClass, Panel, textareaClass } from "@/components/admin/ui";
import { AttachmentsField } from "@/components/admin/AttachmentsField";
import { saveSubmissionAction, type SubmissionItemPayload } from "../documents/actions";

interface ItemRow {
  name: string;
  spec: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  note: string;
}

const EMPTY_ROW: ItemRow = { name: "", spec: "", unit: "", quantity: "", unitPrice: "", note: "" };

/** Ajuan waktu tidak memerlukan rincian barang; sisanya wajib punya. */
function needsItems(type: SubmissionType): boolean {
  return type === "ALAT" || type === "MATERIAL";
}

export function SubmissionForm({
  rabId,
  submission,
  type,
  onClose,
}: {
  rabId: string;
  submission: Submission | null;
  type: SubmissionType;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(submission?.title ?? "");
  const [reason, setReason] = useState(submission?.reason ?? "");
  const [neededDate, setNeededDate] = useState(submission?.neededDate ?? todayIso());
  const [requestedDays, setRequestedDays] = useState(String(submission?.requestedDays ?? ""));
  const [newTargetDate, setNewTargetDate] = useState(submission?.newTargetDate ?? "");
  const [attachments, setAttachments] = useState<DocAttachment[]>(submission?.attachments ?? []);
  const [rows, setRows] = useState<ItemRow[]>(
    submission && submission.items.length > 0
      ? submission.items.map((item) => ({
          name: item.name,
          spec: item.spec ?? "",
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          note: item.note ?? "",
        }))
      : needsItems(type)
        ? [EMPTY_ROW]
        : []
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateRow = (index: number, patch: Partial<ItemRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const items: SubmissionItemPayload[] = rows
    .filter((row) => row.name.trim())
    .map((row) => ({
      name: row.name.trim(),
      spec: row.spec.trim() || null,
      unit: row.unit.trim() || "unit",
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unitPrice) || 0,
      note: row.note.trim() || null,
    }));

  const estimated = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSave = () => {
    setError("");

    if (!title.trim()) return setError("Perihal pengajuan wajib diisi");
    if (needsItems(type) && items.length === 0) return setError("Tambahkan minimal satu rincian barang");
    if (type === "WAKTU" && !Number(requestedDays)) {
      return setError("Sebutkan jumlah hari tambahan yang diminta");
    }

    startTransition(async () => {
      const result = await saveSubmissionAction(
        {
          rabId,
          type,
          title: title.trim(),
          reason: reason.trim() || null,
          neededDate: neededDate || null,
          requestedDays: type === "WAKTU" ? Number(requestedDays) : null,
          newTargetDate: newTargetDate || null,
          items,
          attachments: attachments.filter((a) => a.url.trim() && a.name.trim()),
        },
        submission?.id
      );

      if (!result.ok) return setError(result.message ?? "Gagal menyimpan pengajuan");
      onClose();
    });
  };

  return (
    <Panel
      title={submission ? `Sunting ${submission.number}` : `Buat ${SUBMISSION_TYPE_LABEL[type]}`}
      description={SUBMISSION_TYPE_HINT[type]}
      actions={
        <>
          <button type="button" onClick={onClose} className={btn("ghost", "sm")}>
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={isPending} className={btn("primary", "sm")}>
            {isPending ? "Menyimpan…" : "Simpan draf"}
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
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Permintaan sewa concrete vibrator"
              className={inputClass}
            />
          </Field>
          <Field label="Dibutuhkan tanggal">
            <input
              type="date"
              value={neededDate}
              onChange={(e) => setNeededDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {type === "WAKTU" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tambahan hari yang diminta">
              <input
                type="number"
                min={1}
                value={requestedDays}
                onChange={(e) => setRequestedDays(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Target selesai baru">
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Field label="Alasan / dasar pengajuan">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan mengapa pengajuan ini diperlukan — bagian inilah yang dibaca atasan sebelum memutuskan."
            className={textareaClass}
          />
        </Field>

        {needsItems(type) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Rincian</span>
              <button type="button" onClick={() => setRows((c) => [...c, EMPTY_ROW])} className={btn("ghost", "sm")}>
                <Plus size={13} /> Tambah baris
              </button>
            </div>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 md:grid-cols-12">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    placeholder="Nama barang"
                    className={`${inputClass} md:col-span-3`}
                  />
                  <input
                    value={row.spec}
                    onChange={(e) => updateRow(index, { spec: e.target.value })}
                    placeholder="Spesifikasi"
                    className={`${inputClass} md:col-span-3`}
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    placeholder="Volume"
                    className={`${inputClass} md:col-span-2`}
                  />
                  <input
                    value={row.unit}
                    onChange={(e) => updateRow(index, { unit: e.target.value })}
                    placeholder="Satuan"
                    className={`${inputClass} md:col-span-1`}
                  />
                  <input
                    type="number"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
                    placeholder="Harga satuan"
                    className={`${inputClass} md:col-span-2`}
                  />
                  <button
                    type="button"
                    onClick={() => setRows((c) => c.filter((_, i) => i !== index))}
                    aria-label="Hapus baris"
                    className={`${btn("danger", "sm")} md:col-span-1`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-right text-sm text-slate-300">
              Perkiraan biaya: <strong className="text-white">Rp {formatRupiah(estimated)}</strong>
            </p>
          </div>
        )}

        <AttachmentsField value={attachments} onChange={setAttachments} />
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
