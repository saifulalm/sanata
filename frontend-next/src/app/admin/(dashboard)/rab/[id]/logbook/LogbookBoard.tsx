"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Download, NotebookPen, Plus, Trash2 } from "lucide-react";
import {
  LOGBOOK_CATEGORY_LABEL,
  LOGBOOK_SEVERITY_LABEL,
  LOGBOOK_SEVERITY_TONE,
  type DocAttachment,
  type LogbookBoardData,
  type LogbookCategory,
  type LogbookEntry,
  type LogbookSeverity,
} from "@/lib/projectDocs";
import { formatDate, todayIso } from "@/lib/format";
import { Badge, btn, EmptyState, inputClass, Panel, selectClass, textareaClass, Toolbar } from "@/components/admin/ui";
import { StatCard } from "@/components/admin/StatCard";
import { AttachmentsField } from "@/components/admin/AttachmentsField";
import { ConfirmDialog, useConfirm } from "@/components/admin/ConfirmDialog";
import { deleteLogbookAction, exportLogbookCsvAction, saveLogbookAction } from "../documents/actions";

const CATEGORIES = Object.keys(LOGBOOK_CATEGORY_LABEL) as LogbookCategory[];
const SEVERITIES = Object.keys(LOGBOOK_SEVERITY_LABEL) as LogbookSeverity[];

export function LogbookBoard({ data }: { data: LogbookBoardData }) {
  const [editing, setEditing] = useState<LogbookEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<LogbookCategory | "ALL">("ALL");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { ask, dialogProps } = useConfirm(isPending);

  const rabId = data.rab.id;
  const visible = filter === "ALL" ? data.entries : data.entries.filter((e) => e.category === filter);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.message ?? "Gagal memproses catatan");
    });
  };

  const download = () => {
    startTransition(async () => {
      const result = await exportLogbookCsvAction(rabId);
      if (!result.ok || !result.csv) return setError(result.message ?? "Gagal mengunduh logbook");

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "logbook.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  if (editing || creating) {
    return (
      <LogbookForm
        rabId={rabId}
        entry={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total kejadian" value={data.summary.total} icon={<NotebookPen size={18} />} />
        <StatCard
          label="Belum selesai"
          value={data.summary.unresolved}
          icon={<AlertTriangle size={18} />}
          tone={data.summary.unresolved > 0 ? "attention" : "default"}
        />
        <StatCard
          label="Berat / kritis terbuka"
          value={data.summary.criticalOpen}
          icon={<AlertTriangle size={18} />}
          hint="Kejadian yang paling perlu ditangani"
          tone={data.summary.criticalOpen > 0 ? "attention" : "default"}
        />
      </div>

      <Toolbar>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as LogbookCategory | "ALL")}
          className={`${selectClass} w-56 py-1.5 text-xs`}
        >
          <option value="ALL">Semua kategori</option>
          {CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {LOGBOOK_CATEGORY_LABEL[key]}
            </option>
          ))}
        </select>
        <span className="ml-auto" />
        <button type="button" onClick={download} disabled={isPending} className={btn("secondary", "sm")}>
          <Download size={13} /> CSV
        </button>
        <button type="button" onClick={() => setCreating(true)} className={btn("primary", "sm")}>
          <Plus size={13} /> Catat kejadian
        </button>
      </Toolbar>

      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={20} />}
          title="Logbook masih kosong"
          description="Kunjungan klien, gangguan keamanan, kesalahan pemasangan — hal-hal di luar rencana yang tidak masuk laporan harian dicatat di sini."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((entry) => (
            <Panel
              key={entry.id}
              title={entry.title}
              description={`${formatDate(entry.date)}${entry.timeOfDay ? ` · ${entry.timeOfDay}` : ""} · ${LOGBOOK_CATEGORY_LABEL[entry.category]}${entry.createdByName ? ` · ${entry.createdByName}` : ""}`}
              actions={
                <>
                  <Badge tone={LOGBOOK_SEVERITY_TONE[entry.severity]}>{LOGBOOK_SEVERITY_LABEL[entry.severity]}</Badge>
                  {entry.isResolved ? (
                    <Badge tone="success">
                      <CheckCircle2 size={11} /> Selesai
                    </Badge>
                  ) : (
                    <Badge tone="warning">Belum selesai</Badge>
                  )}
                </>
              }
            >
              <div className="space-y-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{entry.description}</p>

                {entry.involvedParty && (
                  <p className="text-xs text-slate-400">
                    Pihak terlibat: <span className="text-slate-200">{entry.involvedParty}</span>
                  </p>
                )}
                {entry.actionTaken && (
                  <p className="text-xs text-slate-400">
                    Tindakan: <span className="text-slate-200">{entry.actionTaken}</span>
                  </p>
                )}
                {entry.followUp && (
                  <p className="text-xs text-slate-400">
                    Tindak lanjut: <span className="text-slate-200">{entry.followUp}</span>
                  </p>
                )}

                {entry.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.attachments.map((file) => (
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

                <div className="flex gap-2 border-t border-white/[0.07] pt-3">
                  <button type="button" onClick={() => setEditing(entry)} className={btn("secondary", "sm")}>
                    Sunting
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      ask({
                        title: "Hapus catatan ini?",
                        description: "Catatan kejadian sering jadi bukti saat terjadi klaim keterlambatan.",
                        onConfirm: () => run(() => deleteLogbookAction(rabId, entry.id)),
                      })
                    }
                    className={`${btn("danger", "sm")} ml-auto`}
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

function LogbookForm({
  rabId,
  entry,
  onClose,
}: {
  rabId: string;
  entry: LogbookEntry | null;
  onClose: () => void;
}) {
  const [date, setDate] = useState(entry?.date ?? todayIso());
  const [timeOfDay, setTimeOfDay] = useState(entry?.timeOfDay ?? "");
  const [category, setCategory] = useState<LogbookCategory>(entry?.category ?? "KUNJUNGAN_CLIENT");
  const [severity, setSeverity] = useState<LogbookSeverity>(entry?.severity ?? "INFO");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [involvedParty, setInvolvedParty] = useState(entry?.involvedParty ?? "");
  const [actionTaken, setActionTaken] = useState(entry?.actionTaken ?? "");
  const [followUp, setFollowUp] = useState(entry?.followUp ?? "");
  const [isResolved, setIsResolved] = useState(entry?.isResolved ?? false);
  const [attachments, setAttachments] = useState<DocAttachment[]>(entry?.attachments ?? []);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError("");
    if (!title.trim()) return setError("Judul kejadian wajib diisi");
    if (!description.trim()) return setError("Uraian kejadian wajib diisi");

    startTransition(async () => {
      const result = await saveLogbookAction(
        rabId,
        {
          date,
          timeOfDay: timeOfDay || null,
          category,
          severity,
          title: title.trim(),
          description: description.trim(),
          involvedParty: involvedParty.trim() || null,
          actionTaken: actionTaken.trim() || null,
          followUp: followUp.trim() || null,
          isResolved,
          attachments: attachments.filter((a) => a.url.trim() && a.name.trim()),
        },
        entry?.id
      );

      if (!result.ok) return setError(result.message ?? "Gagal menyimpan catatan");
      onClose();
    });
  };

  return (
    <Panel
      title={entry ? "Sunting catatan logbook" : "Catat kejadian lapangan"}
      description="Kejadian di luar rencana: kunjungan, gangguan, kesalahan kerja, kecelakaan."
      actions={
        <>
          <button type="button" onClick={onClose} className={btn("ghost", "sm")}>
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={isPending} className={btn("primary", "sm")}>
            {isPending ? "Menyimpan…" : "Simpan"}
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

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Tanggal">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Jam (opsional)">
            <input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Kategori">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LogbookCategory)}
              className={selectClass}
            >
              {CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {LOGBOOK_CATEGORY_LABEL[key]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tingkat">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as LogbookSeverity)}
              className={selectClass}
            >
              {SEVERITIES.map((key) => (
                <option key={key} value={key}>
                  {LOGBOOK_SEVERITY_LABEL[key]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Judul kejadian">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Baut angkur kolom K3 terpasang pada lubang yang salah"
            className={inputClass}
          />
        </Field>

        <Field label="Uraian">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${textareaClass} min-h-[140px]`}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Pihak terlibat">
            <input
              value={involvedParty}
              onChange={(e) => setInvolvedParty(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Tindakan yang diambil">
            <input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tindak lanjut">
            <input value={followUp} onChange={(e) => setFollowUp(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isResolved}
            onChange={(e) => setIsResolved(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/[0.06]"
          />
          Kejadian sudah selesai ditangani
        </label>

        <AttachmentsField value={attachments} onChange={setAttachments} label="Foto / dokumen pendukung" />
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
