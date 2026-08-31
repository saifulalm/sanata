import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError, adminFetch } from "@/lib/adminApi";
import { formatDate } from "@/lib/format";
import { getSiteContent, setting } from "@/lib/siteContent";
import { mediaSrc } from "@/lib/media";
import { WEATHER_LABEL, type DailyReport } from "@/lib/estimation";
import { PrintBar } from "./PrintBar";

export const metadata: Metadata = { title: "Laporan Harian" };

type PrintableReport = DailyReport & {
  rab: { id: string; number: string; title: string; location: string | null; clientName: string | null };
};

/// Jam kerja: 08:00 - 03:00 (next day).
const WORK_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00", "24:00", "01:00", "02:00", "03:00",
];

const WEATHER_SYMBOLS: Record<string, string> = {
  CERAH: "●",
  BERAWAN: "◐",
  GERIMIS: "•",
  HUJAN: "▼",
  HUJAN_LEBAT: "▼",
};

export default async function DailyReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  // Halaman ini di luar layout dashboard, jadi sesi diperiksa sendiri di sini.
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let report: PrintableReport;
  try {
    const res = await adminFetch<{ data: PrintableReport }>(`/rab/daily-reports/${id}`);
    report = res.data;
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  const content = await getSiteContent();
  const tagline = setting(content, "site.tagline", "Mitra Konstruksi Terpercaya");
  const workforce = Object.entries(report.workforce ?? {});

  // Build weather log map for quick lookup
  const weatherLogMap = new Map((report.weatherLog ?? []).map((w) => [w.hour, w.weather]));

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <PrintBar backHref={`/admin/rab/${report.rab.id}/daily-reports`} />

      {/* Lebar dikunci ke A4 agar tampilan layar sama dengan hasil cetak. */}
      <article className="mx-auto max-w-[210mm] bg-white p-[15mm] text-[11px] leading-relaxed text-neutral-800 shadow-lg print:max-w-none print:p-0 print:shadow-none">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="mb-4 border-b-2 border-primary-900 pb-3">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-display text-2xl font-bold tracking-tight text-primary-900">DAILY WORK REPORT</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">PT. SANATA CIPTA SEJAHTERA</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500">No. Ref: <span className="font-mono font-semibold">{report.rab.number}</span></p>
            </div>
          </div>
        </header>

        {/* ── Info Table ──────────────────────────────────────── */}
        <table className="mb-4 w-full text-[11px]">
          <tbody>
            <tr>
              <td className="w-28 py-0.5 text-neutral-500">Tanggal</td>
              <td className="py-0.5 font-medium">: {formatDate(report.date)}</td>
              <td className="w-20 py-0.5 text-neutral-500">Lokasi</td>
              <td className="py-0.5">: {report.rab.location ?? "—"}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-500">Pekerjaan</td>
              <td className="py-0.5">: {report.rab.title}</td>
              <td className="py-0.5 text-neutral-500">Pemberi Tugas</td>
              <td className="py-0.5">: {report.rab.clientName ?? "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Workforce Table ──────────────────────────────────── */}
        {workforce.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
              Tenaga Kerja
            </h2>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-neutral-100 text-left">
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Jabatan</th>
                  <th className="w-20 border border-neutral-300 px-2 py-1 text-center font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {workforce.map(([role, count]) => (
                  <tr key={role}>
                    <td className="border border-neutral-300 px-2 py-1">{role}</td>
                    <td className="border border-neutral-300 px-2 py-1 text-center tabular-nums">{count} Orang</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-neutral-50">
                  <td className="border border-neutral-300 px-2 py-1">Total</td>
                  <td className="border border-neutral-300 px-2 py-1 text-center tabular-nums">{report.workforceTotal} Orang</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* ── Work Activities per Building ─────────────────────── */}
        {report.workActivities && report.workActivities.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
              Aktivitas Pekerjaan
            </h2>
            {report.workActivities.map((wa, idx) => (
              <div key={idx} className="mb-3">
                <h3 className="mb-1 text-[11px] font-semibold text-primary-800">{wa.building}</h3>
                <ol className="list-decimal list-inside space-y-0.5 pl-4 text-[10px]">
                  {wa.activities.map((activity, actIdx) => (
                    <li key={actIdx}>{activity}</li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        )}

        {/* ── Activities (Legacy / Summary) ────────────────────── */}
        <section className="mb-4">
          <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
            Ringkasan Aktivitas
          </h2>
          <p className="whitespace-pre-line text-[11px]">{report.activities}</p>
        </section>

        {/* ── Test Performed ───────────────────────────────────── */}
        {report.testPerformed && (
          <section className="mb-4">
            <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
              Hasil Pengujian / Test Performed
            </h2>
            <p className="whitespace-pre-line text-[11px]">{report.testPerformed}</p>
          </section>
        )}

        {/* ── Equipment & Materials ─────────────────────────────── */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {report.equipment && (
            <section>
              <h2 className="mb-1 border-b border-neutral-300 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                Peralatan
              </h2>
              <p className="whitespace-pre-line text-[10px]">{report.equipment}</p>
            </section>
          )}
          {report.materials && (
            <section>
              <h2 className="mb-1 border-b border-neutral-300 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                Material Masuk
              </h2>
              <p className="whitespace-pre-line text-[10px]">{report.materials}</p>
            </section>
          )}
        </div>

        {/* ── Hourly Weather Report ────────────────────────────── */}
        <section className="mb-4">
          <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
            Laporan Cuaca / Weather Report
          </h2>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-neutral-100">
                {WORK_HOURS.map((hour) => (
                  <th key={hour} className="border border-neutral-300 px-0.5 py-0.5 text-center font-medium">
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {WORK_HOURS.map((hour) => {
                  const weather = weatherLogMap.get(hour);
                  return (
                    <td key={hour} className="border border-neutral-300 px-0.5 py-1 text-center text-base" title={weather ? WEATHER_LABEL[weather as keyof typeof WEATHER_LABEL] : ""}>
                      {weather ? WEATHER_SYMBOLS[weather] ?? "●" : "—"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          {/* Weather Legend */}
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[9px] text-neutral-500">
            {Object.entries(WEATHER_SYMBOLS).slice(0, 5).map(([w, sym]) => (
              <span key={w}>
                <span className="font-medium text-neutral-700">{sym}</span> {WEATHER_LABEL[w as keyof typeof WEATHER_LABEL]}
              </span>
            ))}
          </div>
          {/* Summary */}
          {(report.weatherMorning || report.weatherAfternoon) && (
            <p className="mt-1 text-[9px] text-neutral-500">
              Ringkasan: {report.weatherMorning ? WEATHER_LABEL[report.weatherMorning] : "—"} (pagi) / {report.weatherAfternoon ? WEATHER_LABEL[report.weatherAfternoon] : "—"} (siang)
            </p>
          )}
        </section>

        {/* ── Obstacles & Notes ─────────────────────────────────── */}
        {report.obstacles && (
          <section className="mb-4">
            <h2 className="mb-1 border-b border-neutral-300 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
              Kendala / Hambatan
            </h2>
            <p className="whitespace-pre-line text-[10px]">{report.obstacles}</p>
          </section>
        )}
        {report.notes && (
          <section className="mb-4">
            <h2 className="mb-1 border-b border-neutral-300 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
              Catatan
            </h2>
            <p className="whitespace-pre-line text-[10px]">{report.notes}</p>
          </section>
        )}

        {/* ── Photos ───────────────────────────────────────────── */}
        {report.photos.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
              Dokumentasi / Attachment - Photograph
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {report.photos.map((photo) => (
                <figure key={photo.id} className="break-inside-avoid border border-neutral-300">
                  <span className="relative block h-40 bg-neutral-100">
                    <Image
                      src={mediaSrc(photo.url)}
                      alt={photo.caption ?? "Dokumentasi lapangan"}
                      fill
                      sizes="50vw"
                      className="object-cover"
                    />
                  </span>
                  <figcaption className="px-2 py-1 text-[10px] leading-4">
                    {photo.location && <span className="font-semibold">{photo.location}</span>}
                    {photo.location && photo.caption && " — "}
                    {photo.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Signature Block ───────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[10px]">
          {[
            { role: "Dibuat oleh\nPelaksana", name: report.createdByName ?? "...................." },
            { role: "Diperiksa oleh\nPengawas", name: "...................." },
            { role: "Mengetahui\nManajer Proyek", name: "...................." },
          ].map(({ role, name }) => (
            <div key={role}>
              <p className="whitespace-pre-line text-neutral-600">{role}</p>
              <div className="mt-10 border-t border-neutral-400 pt-1">
                <p className="font-medium">{name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="mt-6 border-t border-neutral-200 pt-2 text-center">
          <p className="text-[9px] text-neutral-400">
            Dicetak pada {new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} — {tagline}
          </p>
        </footer>
      </article>
    </div>
  );
}
