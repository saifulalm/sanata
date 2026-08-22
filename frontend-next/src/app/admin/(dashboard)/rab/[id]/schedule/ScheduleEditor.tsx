"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Download, Plus, Save, Trash2 } from "lucide-react";
import type { RabSchedule, ScheduleHoliday } from "@/lib/estimation";
import { formatRupiah, todayIso } from "@/lib/format";
import { PhotoListField, type PhotoDraft } from "@/components/admin/PhotoListField";
import {
  exportScheduleCsvAction,
  recordProgressAction,
  saveScheduleAction,
  type ScheduleItemPayload,
} from "../../actions";
import { inputClass } from "@/components/admin/ui";

const DAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const cardClass = "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-5";

export function ScheduleEditor({ schedule }: { schedule: RabSchedule }) {
  const [start, setStart] = useState(schedule.rab.scheduleStart ?? "");
  const [rows, setRows] = useState<ScheduleItemPayload[]>(
    schedule.items.map((i) => ({
      id: i.id,
      startOffsetDays: i.startOffsetDays,
      durationDays: i.durationDays,
    }))
  );
  const [restDays, setRestDays] = useState<number[]>(schedule.rab.restDays);
  const [holidays, setHolidays] = useState<ScheduleHoliday[]>(schedule.holidays);
  const [opnameDate, setOpnameDate] = useState(todayIso());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleRestDay = (day: number) =>
    setRestDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()));

  const patch = (id: string, field: "startOffsetDays" | "durationDays", raw: string) => {
    const value = Math.max(0, Math.trunc(Number(raw) || 0));
    setRows((current) => current.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, okMessage: string) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await fn();
      if (result.ok) setMessage(okMessage);
      else setError(result.message ?? "Gagal memproses");
    });
  };

  const download = () => {
    setError("");
    startTransition(async () => {
      const result = await exportScheduleCsvAction(schedule.rab.id);
      if (!result.ok || !result.csv) { setError(result.message ?? "Gagal mengunduh kurva S"); return; }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "kurva-s.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end gap-4 ${cardClass}`}>
        <div>
          <label htmlFor="schedule-start" className="mb-1.5 block text-xs font-medium text-slate-400">
            Tanggal Mulai Pelaksanaan
          </label>
          <input
            id="schedule-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">
            Semua jadwal item dihitung sebagai selisih hari dari tanggal ini.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            run(
              () =>
                saveScheduleAction(
                  schedule.rab.id,
                  start || null,
                  rows,
                  restDays,
                  holidays.map((h) => ({ date: h.date, name: h.name }))
                ),
              "Jadwal tersimpan"
            )
          }
          disabled={isPending}
          className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-60 transition"
        >
          <Save size={15} /> {isPending ? "Menyimpan..." : "Simpan Jadwal"}
        </button>

        <button
          type="button"
          onClick={download}
          disabled={isPending || schedule.buckets.length === 0}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-50 transition"
        >
          <Download size={15} /> Kurva S (CSV)
        </button>

        <div className="ml-auto">
          <label htmlFor="opname-date" className="mb-1.5 block text-xs font-medium text-slate-400">
            Tanggal Opname
          </label>
          <input
            id="opname-date"
            type="date"
            value={opnameDate}
            onChange={(e) => setOpnameDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className={`grid gap-4 ${cardClass} lg:grid-cols-2`}>
        <div>
          <p className="text-xs font-medium text-slate-400">Hari Libur Mingguan</p>
          <p className="mt-1 text-xs text-slate-500">
            Durasi tiap pekerjaan dihitung dalam hari kerja, jadi hari yang dicentang di sini dilewati saat
            menghitung tanggal.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => {
              const active = restDays.includes(day);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleRestDay(day)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 text-slate-500 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {restDays.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Tidak ada hari libur mingguan — jadwal memakai hari kalender penuh.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Hari Libur Khusus</p>
            <button
              type="button"
              onClick={() => setHolidays((c) => [...c, { date: start || todayIso(), name: "" }])}
              className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-400/20 transition"
            >
              <Plus size={13} /> Tambah
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Libur nasional, cuti bersama, atau penghentian kerja.</p>

          <div className="mt-3 space-y-2">
            {holidays.length === 0 && <p className="text-xs text-slate-500">Belum ada hari libur khusus.</p>}
            {holidays.map((holiday, index) => (
              <div key={`${holiday.id ?? "new"}-${index}`} className="flex items-center gap-2">
                <input
                  type="date"
                  value={holiday.date}
                  aria-label={`Tanggal libur ${index + 1}`}
                  onChange={(e) =>
                    setHolidays((c) => c.map((h, i) => (i === index ? { ...h, date: e.target.value } : h)))
                  }
                  className={`${inputClass} w-40`}
                />
                <input
                  value={holiday.name}
                  placeholder="Keterangan"
                  aria-label={`Keterangan libur ${index + 1}`}
                  onChange={(e) =>
                    setHolidays((c) => c.map((h, i) => (i === index ? { ...h, name: e.target.value } : h)))
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setHolidays((c) => c.filter((_, i) => i !== index))}
                  aria-label={`Hapus libur ${index + 1}`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="group relative overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <table className="w-full min-w-[64rem] text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Pekerjaan</th>
              <th className="px-4 py-3 text-right">Nilai</th>
              <th className="px-4 py-3 text-right">Bobot</th>
              <th className="px-4 py-3 text-right">Mulai Hari Ke</th>
              <th className="px-4 py-3 text-right">Durasi (hari)</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3 text-right">Realisasi</th>
              <th className="px-4 py-3">Catat Opname</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {schedule.items.map((item) => {
              const row = rows.find((r) => r.id === item.id);
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{item.description}</p>
                    <p className="text-xs text-slate-500">
                      {item.sectionName} · {item.volume} {item.unit}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                    Rp {formatRupiah(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-cyan-300">
                    {Number(item.weightPct).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={0}
                      value={row?.startOffsetDays ?? 0}
                      onChange={(e) => patch(item.id, "startOffsetDays", e.target.value)}
                      aria-label={`Mulai hari ke berapa untuk ${item.description}`}
                      className={`${inputClass} w-24 text-right`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={0}
                      value={row?.durationDays ?? 0}
                      onChange={(e) => patch(item.id, "durationDays", e.target.value)}
                      aria-label={`Durasi hari untuk ${item.description}`}
                      className={`${inputClass} w-24 text-right`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {item.startDate ? (
                      <>
                        {item.startDate} <span className="text-slate-600">s/d</span> {item.endDate}
                      </>
                    ) : (
                      <span className="text-slate-600">belum dijadwalkan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-medium text-cyan-300">{Number(item.progressPct).toFixed(0)}%</span>
                    {item.lastProgressDate && (
                      <p className="text-xs text-slate-500">{item.lastProgressDate}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressInput
                      disabled={isPending}
                      defaultValue={item.progressPct}
                      itemDescription={item.description}
                      onSubmit={(percent, note, photos) =>
                        run(
                          () => recordProgressAction(schedule.rab.id, item.id, opnameDate, percent, note, photos),
                          `Opname ${item.description} tersimpan`
                        )
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <CalendarClock size={14} className="mt-0.5 shrink-0" />
        Persentase opname bersifat kumulatif — isi total pekerjaan yang sudah terpasang sampai
        tanggal itu, bukan tambahan sejak opname sebelumnya. Mengisi ulang tanggal yang sama akan
        menimpa catatan lama.
      </p>
    </div>
  );
}

function ProgressInput({
  defaultValue,
  disabled,
  itemDescription,
  onSubmit,
}: {
  defaultValue: string;
  disabled: boolean;
  itemDescription: string;
  onSubmit: (percent: number, note: string | null, photos: { url: string; caption: string | null }[]) => void;
}) {
  const [value, setValue] = useState(Number(defaultValue).toFixed(0));
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);

  const submit = () => {
    onSubmit(
      Math.max(0, Math.min(100, Number(value) || 0)),
      note.trim() || null,
      photos.map((p) => ({ url: p.url, caption: p.caption }))
    );
    setExpanded(false);
    setNote("");
    setPhotos([]);
  };

  return (
    <div className="min-w-[13rem]">
      <div className="flex items-center gap-1.5">
        <input
          type="number" min={0} max={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`Persentase opname ${itemDescription}`}
          className={`${inputClass} w-20 text-right`}
        />
        <span className="text-xs text-slate-500">%</span>
        <button
          type="button"
          disabled={disabled}
          onClick={submit}
          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-50 transition"
        >
          Catat
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="rounded-lg px-1.5 py-1.5 text-xs text-slate-500 hover:text-cyan-400"
        >
          {expanded ? "Tutup" : photos.length > 0 ? `Bukti (${photos.length})` : "+ Bukti"}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan opname"
            aria-label={`Catatan opname ${itemDescription}`}
            className={inputClass}
          />
          <PhotoListField photos={photos} onChange={setPhotos} max={6} label="Foto bukti" />
        </div>
      )}
    </div>
  );
}
