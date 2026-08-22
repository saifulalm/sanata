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

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <PrintBar backHref={`/admin/rab/${report.rab.id}/daily-reports`} />

      {/* Lebar dikunci ke A4 agar tampilan layar sama dengan hasil cetak. */}
      <article className="mx-auto max-w-[210mm] bg-white p-[15mm] text-[11px] leading-relaxed text-neutral-800 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-primary-900 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-primary-900">SANATA</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">{tagline}</p>
            </div>
            <div className="text-right">
              <h1 className="text-base font-bold uppercase tracking-wide text-primary-950">Laporan Harian Proyek</h1>
              <p className="font-mono text-[10px] text-neutral-500">{report.rab.number}</p>
            </div>
          </div>
        </header>

        <table className="mb-6 w-full text-[11px]">
          <tbody>
            <tr>
              <td className="w-28 py-0.5 text-neutral-500">Pekerjaan</td>
              <td className="py-0.5 font-medium">: {report.rab.title}</td>
              <td className="w-24 py-0.5 text-neutral-500">Tanggal</td>
              <td className="py-0.5 font-medium">: {formatDate(report.date)}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-500">Lokasi</td>
              <td className="py-0.5">: {report.rab.location ?? "—"}</td>
              <td className="py-0.5 text-neutral-500">Cuaca</td>
              <td className="py-0.5">
                : {report.weatherMorning ? WEATHER_LABEL[report.weatherMorning] : "—"} (pagi) /{" "}
                {report.weatherAfternoon ? WEATHER_LABEL[report.weatherAfternoon] : "—"} (siang)
              </td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-500">Pemberi Tugas</td>
              <td className="py-0.5">: {report.rab.clientName ?? "—"}</td>
              <td className="py-0.5 text-neutral-500">Dicatat oleh</td>
              <td className="py-0.5">: {report.createdByName ?? "—"}</td>
            </tr>
          </tbody>
        </table>

        {workforce.length > 0 && (
          <Section title="Tenaga Kerja">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-neutral-100 text-left">
                  <th className="border border-neutral-300 px-2 py-1 font-semibold">Jabatan</th>
                  <th className="w-24 border border-neutral-300 px-2 py-1 text-right font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {workforce.map(([role, count]) => (
                  <tr key={role}>
                    <td className="border border-neutral-300 px-2 py-1">{role}</td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{count}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="border border-neutral-300 px-2 py-1">Total</td>
                  <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                    {report.workforceTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
        )}

        <Section title="Aktivitas Pekerjaan">
          <p className="whitespace-pre-line">{report.activities}</p>
        </Section>

        {report.equipment && (
          <Section title="Peralatan">
            <p className="whitespace-pre-line">{report.equipment}</p>
          </Section>
        )}
        {report.materials && (
          <Section title="Material Masuk">
            <p className="whitespace-pre-line">{report.materials}</p>
          </Section>
        )}
        {report.obstacles && (
          <Section title="Kendala">
            <p className="whitespace-pre-line">{report.obstacles}</p>
          </Section>
        )}
        {report.notes && (
          <Section title="Catatan">
            <p className="whitespace-pre-line">{report.notes}</p>
          </Section>
        )}

        {report.photos.length > 0 && (
          <Section title={`Dokumentasi (${report.photos.length} foto)`}>
            <div className="grid grid-cols-2 gap-3">
              {report.photos.map((photo) => (
                // `break-inside-avoid` menjaga foto dan keterangannya tetap satu
                // halaman saat dicetak.
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
          </Section>
        )}

        <div className="mt-10 grid grid-cols-3 gap-6 text-center text-[11px]">
          {["Dibuat oleh\nPelaksana", "Diperiksa oleh\nPengawas", "Mengetahui\nManajer Proyek"].map((role) => (
            <div key={role}>
              <p className="whitespace-pre-line text-neutral-500">{role}</p>
              <div className="mt-14 border-t border-neutral-400 pt-1 text-neutral-500">( ................... )</div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-1.5 border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-primary-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
