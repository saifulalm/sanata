"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import {
  LETTER_TYPE_FULL,
  LETTER_TYPE_HINT,
  type DocAttachment,
  type LetterBody,
  type LetterClause,
  type LetterLine,
  type LetterType,
  type ProjectLetter,
} from "@/lib/projectDocs";
import { formatRupiah, todayIso } from "@/lib/format";
import { btn, inputClass, Panel, textareaClass } from "@/components/admin/ui";
import { AttachmentsField } from "@/components/admin/AttachmentsField";
import { letterDefaultsAction, saveLetterAction } from "../documents/actions";
import type { Signatory } from "@/lib/adminSignatories";

/** Surat berisi pasal (SPK, berita acara) versus surat berisi rincian nilai. */
function usesClauses(type: LetterType): boolean {
  return type === "SPK" || type === "BAPP" || type === "BAST";
}

function carriesAmount(type: LetterType): boolean {
  return type === "SPK" || type === "INVOICE" || type === "KWITANSI";
}

export function LetterForm({
  rabId,
  letter,
  type,
  signatories,
  onClose,
}: {
  rabId: string;
  letter: ProjectLetter | null;
  type: LetterType;
  signatories: Signatory[];
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(letter?.subject ?? "");
  const [letterDate, setLetterDate] = useState(letter?.letterDate ?? todayIso());
  const [dueDate, setDueDate] = useState(letter?.dueDate ?? "");
  const [recipientName, setRecipientName] = useState(letter?.recipientName ?? "");
  const [recipientCompany, setRecipientCompany] = useState(letter?.recipientCompany ?? "");
  const [recipientAddress, setRecipientAddress] = useState(letter?.recipientAddress ?? "");
  const [attentionTo, setAttentionTo] = useState(letter?.attentionTo ?? "");
  const [signerName, setSignerName] = useState(letter?.signerName ?? "");
  const [signerTitle, setSignerTitle] = useState(letter?.signerTitle ?? "Direktur");
  const [selectedSignatoryId, setSelectedSignatoryId] = useState(letter?.signatoryId ?? "");
  const [counterSignerName, setCounterSignerName] = useState(letter?.counterSignerName ?? "");
  const [counterSignerTitle, setCounterSignerTitle] = useState(letter?.counterSignerTitle ?? "");
  const [amount, setAmount] = useState(String(letter?.amount ?? ""));
  const [retentionAmount, setRetentionAmount] = useState(String(letter?.retentionAmount ?? "0"));
  const [taxPct, setTaxPct] = useState(String(letter?.taxPct ?? "0"));
  const [opening, setOpening] = useState(letter?.body.opening ?? "");
  const [closing, setClosing] = useState(letter?.body.closing ?? "");
  const [clauses, setClauses] = useState<LetterClause[]>(letter?.body.clauses ?? []);
  const [lines, setLines] = useState<LetterLine[]>(letter?.body.lines ?? []);
  const [fields, setFields] = useState<Record<string, string>>(letter?.body.fields ?? {});
  const [notes, setNotes] = useState(letter?.notes ?? "");
  const [attachments, setAttachments] = useState<DocAttachment[]>(letter?.attachments ?? []);
  const [links, setLinks] = useState({
    billingId: letter?.billing?.id ?? null,
    quotationId: letter?.quotation?.id ?? null,
    parentLetterId: letter?.parentLetter?.id ?? null,
  });

  const handleSignatoryChange = (id: string) => {
    setSelectedSignatoryId(id);
    if (id) {
      const s = signatories.find((x) => x.id === id);
      if (s) {
        setSignerName(s.name);
        setSignerTitle(s.title);
      }
    } else {
      setSignerName(letter?.signerName ?? "");
      setSignerTitle(letter?.signerTitle ?? "Direktur");
    }
  };

  const [error, setError] = useState("");
  const [loadingDefaults, setLoadingDefaults] = useState(!letter);
  const [isPending, startTransition] = useTransition();

  // Surat baru diisi lebih dulu dari data yang sudah ada di sistem — penawaran
  // yang diterima untuk SPK, termin terakhir untuk invoice, opname untuk berita
  // acara. Menyunting surat lama tidak menariknya lagi: isinya sudah miliknya.
  useEffect(() => {
    if (letter) return;
    let cancelled = false;

    void (async () => {
      const result = await letterDefaultsAction(rabId, type);
      if (cancelled) return;
      setLoadingDefaults(false);

      if (!result.ok || !result.defaults) {
        setError(result.message ?? "Gagal menyiapkan isi surat");
        return;
      }

      const d = result.defaults;
      setSubject(d.subject);
      setLetterDate(d.letterDate);
      setDueDate(d.dueDate ?? "");
      setRecipientName(d.recipientName);
      setRecipientCompany(d.recipientCompany);
      setAttentionTo(d.attentionTo ?? "");
      setSignerName(d.signerName);
      setSignerTitle(d.signerTitle);
      setCounterSignerName(d.counterSignerName ?? "");
      setCounterSignerTitle(d.counterSignerTitle ?? "");
      setAmount(String(d.amount ?? 0));
      setRetentionAmount(String(d.retentionAmount ?? 0));
      setTaxPct(String(d.taxPct ?? 0));
      setOpening(d.body.opening ?? "");
      setClosing(d.body.closing ?? "");
      setClauses(d.body.clauses ?? []);
      setLines(d.body.lines ?? []);
      setFields(d.body.fields ?? {});
      setLinks({
        billingId: d.billingId ?? null,
        quotationId: d.quotationId ?? null,
        parentLetterId: d.parentLetterId ?? null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [rabId, type, letter]);

  const taxable = Math.max(0, (Number(amount) || 0) - (Number(retentionAmount) || 0));
  const taxValue = (taxable * (Number(taxPct) || 0)) / 100;
  const total = taxable + taxValue;

  const handleSave = () => {
    setError("");
    if (!subject.trim()) return setError("Perihal surat wajib diisi");
    if (!recipientName.trim()) return setError("Penerima surat wajib diisi");
    if (!signerName.trim()) return setError("Nama penanda tangan wajib diisi");

    const body: LetterBody = {
      opening: opening.trim() || null,
      closing: closing.trim() || null,
      ...(usesClauses(type) ? { clauses: clauses.filter((c) => c.title.trim() || c.text.trim()) } : {}),
      ...(carriesAmount(type) && lines.length > 0 ? { lines } : {}),
      fields,
    };

    startTransition(async () => {
      const result = await saveLetterAction(
        {
          rabId,
          type,
          subject: subject.trim(),
          letterDate,
          dueDate: dueDate || null,
          recipientName: recipientName.trim(),
          recipientCompany: recipientCompany.trim() || null,
          recipientAddress: recipientAddress.trim() || null,
          attentionTo: attentionTo.trim() || null,
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim() || "Direktur",
          signatoryId: selectedSignatoryId || null,
          counterSignerName: counterSignerName.trim() || null,
          counterSignerTitle: counterSignerTitle.trim() || null,
          amount: carriesAmount(type) ? Number(amount) || 0 : 0,
          retentionAmount: carriesAmount(type) ? Number(retentionAmount) || 0 : 0,
          taxPct: carriesAmount(type) ? Number(taxPct) || 0 : 0,
          ...links,
          body,
          notes: notes.trim() || null,
          attachments: attachments.filter((a) => a.url.trim() && a.name.trim()),
        },
        letter?.id
      );

      if (!result.ok) return setError(result.message ?? "Gagal menyimpan surat");
      onClose();
    });
  };

  return (
    <Panel
      title={letter ? `Sunting ${letter.number}` : `Buat ${LETTER_TYPE_FULL[type]}`}
      description={LETTER_TYPE_HINT[type]}
      actions={
        <>
          <button type="button" onClick={onClose} className={btn("ghost", "sm")}>
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || loadingDefaults}
            className={btn("primary", "sm")}
          >
            {isPending ? "Menyimpan…" : "Simpan draf"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {loadingDefaults && (
          <p className="flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-2.5 text-sm text-cyan-100">
            <Sparkles size={14} /> Menarik isi surat dari penawaran, termin, dan opname proyek…
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Perihal">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tanggal surat">
            <input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Kepada">
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Perusahaan / instansi">
            <input
              value={recipientCompany}
              onChange={(e) => setRecipientCompany(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Alamat">
            <input
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="U.p. (opsional)">
            <input value={attentionTo} onChange={(e) => setAttentionTo(e.target.value)} className={inputClass} />
          </Field>
          {type === "INVOICE" && (
            <Field label="Jatuh tempo">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </Field>
          )}
        </div>

        {carriesAmount(type) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nilai pekerjaan">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Retensi ditahan">
                <input
                  type="number"
                  value={retentionAmount}
                  onChange={(e) => setRetentionAmount(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="PPN (%)">
                <input type="number" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <dl className="mt-4 space-y-1 border-t border-white/[0.07] pt-3 text-sm">
              <Row label="Setelah retensi" value={`Rp ${formatRupiah(taxable)}`} />
              <Row label={`PPN ${taxPct || 0}%`} value={`Rp ${formatRupiah(taxValue)}`} />
              <Row label="Total dibayar" value={`Rp ${formatRupiah(total)}`} strong />
            </dl>
          </div>
        )}

        <Field label="Paragraf pembuka">
          <textarea value={opening} onChange={(e) => setOpening(e.target.value)} className={textareaClass} />
        </Field>

        {usesClauses(type) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                {type === "SPK" ? "Pasal perjanjian" : "Rincian pekerjaan"}
              </span>
              <button
                type="button"
                onClick={() => setClauses((c) => [...c, { title: "", text: "" }])}
                className={btn("ghost", "sm")}
              >
                <Plus size={13} /> Tambah
              </button>
            </div>

            {clauses.map((clause, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex gap-2">
                  <input
                    value={clause.title}
                    onChange={(e) =>
                      setClauses((c) => c.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))
                    }
                    placeholder="Judul pasal"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setClauses((c) => c.filter((_, i) => i !== index))}
                    aria-label="Hapus pasal"
                    className={btn("danger", "sm")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  value={clause.text}
                  onChange={(e) =>
                    setClauses((c) => c.map((x, i) => (i === index ? { ...x, text: e.target.value } : x)))
                  }
                  className={textareaClass}
                />
              </div>
            ))}
          </div>
        )}

        {carriesAmount(type) && lines.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Rincian dari termin
            </p>
            <ul className="space-y-1 text-sm text-slate-300">
              {lines.map((line, index) => (
                <li key={index} className="flex justify-between gap-4">
                  <span className="truncate">{line.description}</span>
                  <span className="shrink-0 tabular-nums text-slate-200">Rp {formatRupiah(line.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(fields).length > 0 && (
          <div className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 md:grid-cols-2">
            {Object.entries(fields).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-xs">
                <span className="w-40 shrink-0 uppercase tracking-[0.14em] text-slate-400">{key}</span>
                <input
                  value={value}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  className={`${inputClass} py-1.5`}
                />
              </label>
            ))}
          </div>
        )}

        <Field label="Paragraf penutup">
          <textarea value={closing} onChange={(e) => setClosing(e.target.value)} className={textareaClass} />
        </Field>

        {signatories.length > 0 && (
          <Field label="Pilih penanda tangan dari daftar">
            <select
              value={selectedSignatoryId}
              onChange={(e) => handleSignatoryChange(e.target.value)}
              className={inputClass}
            >
              <option value="">— Tidak dari daftar —</option>
              {signatories.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.title})</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Penanda tangan (pihak kami)">
            <input value={signerName} onChange={(e) => { setSignerName(e.target.value); setSelectedSignatoryId(""); }} className={inputClass} />
          </Field>
          <Field label="Jabatan">
            <input value={signerTitle} onChange={(e) => { setSignerTitle(e.target.value); setSelectedSignatoryId(""); }} className={inputClass} />
          </Field>
          <Field label="Penanda tangan pihak kedua">
            <input
              value={counterSignerName}
              onChange={(e) => setCounterSignerName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Jabatan pihak kedua">
            <input
              value={counterSignerTitle}
              onChange={(e) => setCounterSignerTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Catatan internal">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaClass} />
        </Field>

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

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-white" : "text-slate-200"}`}>{value}</dd>
    </div>
  );
}
