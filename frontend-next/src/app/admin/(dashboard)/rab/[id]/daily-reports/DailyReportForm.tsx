"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, CloudRain, UserPlus, Building2, Clock, FlaskConical } from "lucide-react";
import { WEATHER_LABEL, type DailyReport, type Weather, type WeatherLogEntry, type WorkActivityEntry } from "@/lib/estimation";
import { todayIso } from "@/lib/format";
import { PhotoListField, type PhotoDraft } from "@/components/admin/PhotoListField";
import { saveDailyReportAction } from "../../actions";

const WEATHERS = Object.keys(WEATHER_LABEL) as Weather[];

/// Jam kerja yang dilacak: 08:00 - 03:00 (next day).
const WORK_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00", "24:00", "01:00", "02:00", "03:00",
];

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

  // Hourly weather log
  const [weatherLog, setWeatherLog] = useState<WeatherLogEntry[]>(
    report?.weatherLog ?? []
  );

  const [workforce, setWorkforce] = useState<WorkforceRow[]>(
    report?.workforce
      ? Object.entries(report.workforce).map(([role, count]) => ({ role, count: String(count) }))
      : [{ role: workforceRoles?.[0]?.label ?? "Pekerja", count: "1" }]
  );

  // Work activities per building
  const [workActivities, setWorkActivities] = useState<WorkActivityEntry[]>(
    report?.workActivities ?? [{ building: "Bangunan Utama", activities: [""] }]
  );

  const [equipment, setEquipment] = useState(report?.equipment ?? "");
  const [materials, setMaterials] = useState(report?.materials ?? "");
  const [activities, setActivities] = useState(report?.activities ?? "");
  const [testPerformed, setTestPerformed] = useState(report?.testPerformed ?? "");
  const [obstacles, setObstacles] = useState(report?.obstacles ?? "");
  const [notes, setNotes] = useState(report?.notes ?? "");
  const [photos, setPhotos] = useState<PhotoDraft[]>(
    report?.photos.map((p) => ({ url: p.url, caption: p.caption, location: p.location })) ?? []
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!report;

  // Helper to update weather log entry
  const updateWeatherLog = (hour: string, weather: Weather | null) => {
    setWeatherLog((prev) => {
      const filtered = prev.filter((w) => w.hour !== hour);
      if (weather) {
        return [...filtered, { hour, weather }].sort((a, b) => {
          // Sort by actual time, handling overnight hours
          const hourToNum = (h: string) => {
            const [hh] = h.split(":").map(Number);
            return hh >= 8 ? hh : hh + 24;
          };
          return hourToNum(a.hour) - hourToNum(b.hour);
        });
      }
      return filtered;
    });
  };

  // Helper to update building activity
  const updateBuildingActivity = (index: number, field: "building" | "activities", value: string | string[]) => {
    setWorkActivities((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add activity to a building
  const addActivityToBuilding = (buildingIndex: number) => {
    setWorkActivities((prev) => {
      const updated = [...prev];
      updated[buildingIndex] = {
        ...updated[buildingIndex],
        activities: [...updated[buildingIndex].activities, ""],
      };
      return updated;
    });
  };

  // Remove activity from building
  const removeActivityFromBuilding = (buildingIndex: number, activityIndex: number) => {
    setWorkActivities((prev) => {
      const updated = [...prev];
      const activities = updated[buildingIndex].activities.filter((_, i) => i !== activityIndex);
      updated[buildingIndex] = { ...updated[buildingIndex], activities };
      return updated;
    });
  };

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

    // Clean work activities - remove empty ones
    const cleanedWorkActivities = workActivities
      .map((wa) => ({
        building: wa.building.trim(),
        activities: wa.activities.filter((a) => a.trim().length > 0),
      }))
      .filter((wa) => wa.building.length > 0 && wa.activities.length > 0);

    startTransition(async () => {
      const result = await saveDailyReportAction(rabId, report?.id ?? null, {
        date,
        weatherMorning: weatherMorning || null,
        weatherAfternoon: weatherAfternoon || null,
        weatherLog: weatherLog.length > 0 ? weatherLog : null,
        workforce: Object.keys(workforceMap).length > 0 ? workforceMap : null,
        equipment: equipment.trim() || null,
        materials: materials.trim() || null,
        workActivities: cleanedWorkActivities.length > 0 ? cleanedWorkActivities : null,
        activities: activities.trim(),
        testPerformed: testPerformed.trim() || null,
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
      <div className="p-5 space-y-6">
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

        {/* ── Hourly Weather Log ─────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-slate-400">Log Cuaca Per Jam (08:00 - 03:00)</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {WORK_HOURS.map((hour) => {
                const entry = weatherLog.find((w) => w.hour === hour);
                const selectedWeather = entry?.weather ?? "";
                return (
                  <div key={hour} className="text-center">
                    <div className="mb-1 text-[10px] text-slate-500">{hour}</div>
                    <select
                      value={selectedWeather}
                      onChange={(e) => updateWeatherLog(hour, (e.target.value || null) as Weather | null)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] text-slate-300 focus:border-cyan-400/50 focus:outline-none"
                    >
                      <option value="">—</option>
                      {WEATHERS.map((w) => (
                        <option key={w} value={w}>{WEATHER_LABEL[w]}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.07] pt-2">
              {WEATHERS.map((w) => (
                <span key={w} className="text-[10px] text-slate-500">
                  <span className="font-medium text-slate-400">{w.charAt(0)}</span> = {WEATHER_LABEL[w]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Workforce ─────────────────────────────── */}
        <div>
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

        {/* ── Work Activities per Building ────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-cyan-400" />
              <span className="text-xs font-medium text-slate-400">Aktivitas Pekerjaan per Bangunan</span>
            </div>
            <button
              type="button"
              onClick={() => setWorkActivities((c) => [...c, { building: "", activities: [""] }])}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-400 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              <Plus size={12} /> Tambah Bangunan
            </button>
          </div>
          <div className="space-y-4">
            {workActivities.map((wa, buildingIndex) => (
              <div key={buildingIndex} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Building2 size={12} className="text-slate-500" />
                  <input
                    type="text"
                    value={wa.building}
                    onChange={(e) => updateBuildingActivity(buildingIndex, "building", e.target.value)}
                    placeholder="Nama Bangunan (contoh: Bangunan Utama, Rumah 1)"
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                  {workActivities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setWorkActivities((c) => c.filter((_, i) => i !== buildingIndex))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {wa.activities.map((activity, activityIndex) => (
                    <div key={activityIndex} className="flex items-center gap-2">
                      <span className="w-6 text-right text-xs text-slate-500">{activityIndex + 1}.</span>
                      <input
                        type="text"
                        value={activity}
                        onChange={(e) => {
                          const newActivities = [...wa.activities];
                          newActivities[activityIndex] = e.target.value;
                          updateBuildingActivity(buildingIndex, "activities", newActivities);
                        }}
                        placeholder={`Pekerjaan ${activityIndex + 1}`}
                        className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400/50 focus:outline-none"
                      />
                      {wa.activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeActivityFromBuilding(buildingIndex, activityIndex)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addActivityToBuilding(buildingIndex)}
                  className="mt-2 flex items-center gap-1 rounded-lg border border-dashed border-white/10 px-2.5 py-1 text-xs text-slate-500 transition-all hover:border-cyan-400/30 hover:text-cyan-400"
                >
                  <Plus size={10} /> Tambah Pekerjaan
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Text areas ────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TextAreaField
            id="dr-activities"
            label="Ringkasan Aktivitas *"
            value={activities}
            onChange={setActivities}
            rows={3}
            placeholder="Ringkasan umum aktivitas hari ini..."
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
          <TextAreaField
            id="dr-test"
            label="Hasil Pengujian"
            value={testPerformed}
            onChange={setTestPerformed}
            rows={2}
            icon={<FlaskConical size={12} className="text-amber-400" />}
          />
          <TextAreaField id="dr-notes" label="Catatan Lain" value={notes} onChange={setNotes} rows={2} />
        </div>

        {/* ── Photos ──────────────────────────────── */}
        <div>
          <PhotoListField photos={photos} onChange={setPhotos} withLocation max={30} label="Dokumentasi Lapangan" />
        </div>

        {/* ── Error ──────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Actions ──────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
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
  icon,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  icon?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={`${labelClass} flex items-center gap-1.5`}>
        {icon}
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} min-h-[64px] resize-y leading-relaxed`}
      />
    </div>
  );
}
