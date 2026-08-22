"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, CloudRain, UserPlus } from "lucide-react";
import { WEATHER_LABEL, type DailyReport, type Weather } from "@/lib/estimation";
import { todayIso } from "@/lib/format";
import { PhotoListField, type PhotoDraft } from "@/components/admin/PhotoListField";
import { saveDailyReportAction } from "../../actions";

const WEATHERS = Object.keys(WEATHER_LABEL) as Weather[];

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-400";

interface WorkforceRow {
  role: string;
  count: string;
}

export function DailyReportForm({
  rabId,
  report,
  workforceRoles,
  onClose,
}: {
  rabId: string;
  report: DailyReport | null;
  workforceRoles?: Array<{ role: string; label: string }>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(report?.date ?? todayIso());
  const [weatherMorning, setWeatherMorning] = useState<string>(report?.weatherMorning ?? "");
  const [weatherAfternoon, setWeatherAfternoon] = useState<string>(report?.weatherAfternoon ?? "");
  const [workforce, setWorkforce] = useState<WorkforceRow[]>(
    report?.workforce
      ? Object.entries(report.workforce).map(([role, count]) => ({ role, count: String(count) }))
      : [{ role: workforceRoles?.[0]?.label ?? "Pekerja", count: "1" }]
  );
  const [equipment, setEquipment] = useState(report?.equipment ?? "");
  const [materials, setMaterials] = useState(report?.materials ?? "");
  const [activities, setActivities] = useState(report?.activities ?? "");
  const [obstacles, setObstacles] = useState(report?.obstacles ?? "");
  const [notes, setNotes] = useState(report?.notes ?? "");
  const [photos, setPhotos] = useState<PhotoDraft[]>(
    report?.photos.map((p) => ({ url: p.url, caption: p.caption, location: p.location })) ?? []
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!report;

  const submit = () => {
    setError("");
    if (activities.trim().length === 0) {
      setError("Aktivitas pekerjaan wajib diisi — itu inti laporan harian.");
      return;
    }

    const workforceMap: Record<string, number> = {};
    for (const row of workforce) {
      const role = row.role.trim();
      const count = Number(row.count);
      if (!role || !Number.isFinite(count) || count <= 0) continue;
      workforceMap[role] = (workforceMap[role] ?? 0) + Math.trunc(count);
    }

    startTransition(async () => {
      const result = await saveDailyReportAction(rabId, report?.id ?? null, {
        date,
        weatherMorning: weatherMorning || null,
        weatherAfternoon: weatherAfternoon || null,
        workforce: Object.keys(workforceMap).length > 0 ? workforceMap : null,
        equipment: equipment.trim() || null,
        materials: materials.trim() || null,
        activities: activities.trim(),
        obstacles: obstacles.trim() || null,
        notes: notes.trim() || null,
        photos: photos.map((p) => ({ url: p.url, caption: p.caption, location: p.location ?? null })),
      });

      if (result.ok) onClose();
      else setError(result.message ?? "Gagal menyimpan laporan.");
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      {/* ── Panel Header ─────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isEdit ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"}`}>
            <CloudRain size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              {isEdit ? `Sunting Laporan ${report.date}` : "Laporan Harian Baru"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit ? `Mengedit laporan tanggal ${report.date}.` : "Catat aktivitas lapangan hari ini."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all hover:border-white/18 hover:bg-white/[0.06] hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      {/* ── Form Body ─────────────────────────────── */}
      <div className="p-5">
        {/* Tanggal + Cuaca row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="dr-date" className={labelClass}>Tanggal</label>
            <input
              id="dr-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="dr-wm" className={labelClass}>Cuaca Pagi</label>
            <select
              id="dr-wm"
              value={weatherMorning}
              onChange={(e) => setWeatherMorning(e.target.value)}
              className={fieldClass}
            >
              <option value="">— Tidak dicatat —</option>
              {WEATHERS.map((w) => (
                <option key={w} value={w}>{WEATHER_LABEL[w]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dr-wa" className={labelClass}>Cuaca Siang</label>
            <select
              id="dr-wa"
              value={weatherAfternoon}
              onChange={(e) => setWeatherAfternoon(e.target.value)}
              className={fieldClass}
            >
              <option value="">— Tidak dicatat —</option>
              {WEATHERS.map((w) => (
                <option key={w} value={w}>{WEATHER_LABEL[w]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Workforce ─────────────────────────────── */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tenaga Kerja</span>
            <button
              type="button"
              onClick={() => setWorkforce((c) => [...c, { role: "", count: "1" }])}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              <UserPlus size={12} /> Tambah Baris
            </button>
          </div>
          <div className="space-y-2">
            {workforce.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  list="dr-roles"
                  value={row.role}
                  onChange={(e) =>
                    setWorkforce((c) => c.map((r, i) => (i === index ? { ...r, role: e.target.value } : r)))
                  }
                  placeholder="Jabatan"
                  aria-label={`Jabatan baris ${index + 1}`}
                  className={fieldClass}
                />
                <input
                  type="number"
                  min={0}
                  value={row.count}
                  onChange={(e) =>
                    setWorkforce((c) => c.map((r, i) => (i === index ? { ...r, count: e.target.value } : r)))
                  }
                  aria-label={`Jumlah orang baris ${index + 1}`}
                  className={`${fieldClass} w-24 text-right`}
                />
                <button
                  type="button"
                  onClick={() => setWorkforce((c) => c.filter((_, i) => i !== index))}
                  aria-label={`Hapus baris ${index + 1}`}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <datalist id="dr-roles">
            {(workforceRoles ?? []).map((r) => (
              <option key={r.role} value={r.label} />
            ))}
            {!workforceRoles?.length && (
              <>
                <option value="Pekerja" />
                <option value="Tukang Batu" />
                <option value="Tukang Kayu" />
                <option value="Tukang Besi" />
                <option value="Mandor" />
                <option value="Kepala Tukang" />
                <option value="Operator" />
              </>
            )}
          </datalist>
        </div>

        {/* ── Text areas ────────────────────────────── */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TextAreaField
            id="dr-activities"
            label="Aktivitas Pekerjaan *"
            value={activities}
            onChange={setActivities}
            rows={3}
          />
          <TextAreaField
            id="dr-obstacles"
            label="Kendala"
            value={obstacles}
            onChange={setObstacles}
            rows={3}
          />
          <TextAreaField id="dr-equipment" label="Peralatan Dipakai" value={equipment} onChange={setEquipment} rows={2} />
          <TextAreaField id="dr-materials" label="Material Masuk" value={materials} onChange={setMaterials} rows={2} />
          <TextAreaField id="dr-notes" label="Catatan Lain" value={notes} onChange={setNotes} rows={2} />
        </div>

        {/* ── Photos ──────────────────────────────── */}
        <div className="mt-5">
          <PhotoListField photos={photos} onChange={setPhotos} withLocation max={30} label="Dokumentasi Lapangan" />
        </div>

        {/* ── Error ──────────────────────────────── */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Actions ──────────────────────────────── */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-600">* wajib diisi</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Laporan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} min-h-[64px] resize-y leading-relaxed`}
      />
    </div>
  );
}
