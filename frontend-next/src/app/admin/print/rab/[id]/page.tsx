import { Fragment } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getRabById } from "@/lib/adminResources";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { getSiteContent, setting } from "@/lib/siteContent";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Dokumen RAB" };

/** Angka romawi untuk penomoran bagian, mengikuti konvensi dokumen RAB. */
function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rest = n;
  let out = "";
  for (const [value, symbol] of map) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

export default async function RabPrintPage({ params }: { params: Promise<{ id: string }> }) {
  // Halaman ini di luar layout dashboard, jadi sesi diperiksa sendiri di sini.
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let rab;
  try {
    rab = await getRabById(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

        const content = await getSiteContent();
        const companyName = setting(content, "site.company_name", "Sanata Construction");
        const tagline = setting(content, "site.tagline", "Mitra Konstruksi Terpercaya");

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <PrintButton />

      {/* Lebar dikunci ke A4 agar tampilan layar sama dengan hasil cetak. */}
      <article className="mx-auto max-w-[210mm] bg-white p-[15mm] text-[11px] leading-relaxed text-neutral-800 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-2 border-primary-900 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-primary-900">SANATA</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">{tagline}</p>
            </div>
            <div className="text-right">
              <h1 className="text-base font-bold uppercase tracking-wide text-primary-950">
                Rencana Anggaran Biaya
              </h1>
              <p className="font-mono text-[10px] text-neutral-500">{rab.number}</p>
            </div>
          </div>
        </header>

        <table className="mb-6 w-full text-[11px]">
          <tbody>
            <tr>
              <td className="w-28 py-0.5 text-neutral-500">Pekerjaan</td>
              <td className="py-0.5 font-medium">: {rab.title}</td>
              <td className="w-24 py-0.5 text-neutral-500">Tanggal</td>
                    <td className="py-0.5">: {formatDate(rab.projectDate ?? rab.createdAt)}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-500">Pemilik</td>
              <td className="py-0.5">: {rab.clientName ?? "-"}</td>
              <td className="py-0.5 text-neutral-500">Disusun oleh</td>
              <td className="py-0.5">: {rab.createdBy.name}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-500">Lokasi</td>
              <td className="py-0.5">: {rab.location ?? "-"}</td>
              <td className="py-0.5 text-neutral-500">Status</td>
              <td className="py-0.5">: {rab.status}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-primary-900 text-white">
              <th className="w-10 border border-primary-900 px-2 py-1.5 text-center font-semibold">No</th>
              <th className="border border-primary-900 px-2 py-1.5 text-left font-semibold">Uraian Pekerjaan</th>
              <th className="w-20 border border-primary-900 px-2 py-1.5 text-center font-semibold">Volume</th>
              <th className="w-16 border border-primary-900 px-2 py-1.5 text-center font-semibold">Satuan</th>
              <th className="w-28 border border-primary-900 px-2 py-1.5 text-right font-semibold">Harga Satuan</th>
              <th className="w-32 border border-primary-900 px-2 py-1.5 text-right font-semibold">Jumlah Harga</th>
            </tr>
          </thead>
          <tbody>
            {rab.sections.map((section, sectionIndex) => {
              const sectionTotal = section.items.reduce((sum, i) => sum + Number(i.amount), 0);
              return (
                <Fragment key={section.id}>
                  <tr className="bg-neutral-100 font-semibold">
                    <td className="border border-neutral-300 px-2 py-1.5 text-center">{toRoman(sectionIndex + 1)}</td>
                    <td className="border border-neutral-300 px-2 py-1.5 uppercase" colSpan={5}>
                      {section.name}
                    </td>
                  </tr>
                  {section.items.map((item, itemIndex) => (
                    <tr key={item.id}>
                      <td className="border border-neutral-300 px-2 py-1 text-center text-neutral-500">
                        {itemIndex + 1}
                      </td>
                      <td className="border border-neutral-300 px-2 py-1">{item.description}</td>
                      <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                        {formatNumber(item.volume, 3)}
                      </td>
                      <td className="border border-neutral-300 px-2 py-1 text-center">{item.unit}</td>
                      <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                        {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="border border-neutral-300 px-2 py-1" />
                    <td className="border border-neutral-300 px-2 py-1 text-right" colSpan={4}>
                      Jumlah {section.name}
                    </td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                      {formatRupiah(sectionTotal)}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="border border-neutral-300 px-2 py-1.5 text-right font-semibold" colSpan={5}>
                Subtotal
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right font-semibold tabular-nums">
                {formatRupiah(rab.subtotal, true)}
              </td>
            </tr>
            {Number(rab.discountAmount) > 0 && (
              <tr>
                <td className="border border-neutral-300 px-2 py-1.5 text-right" colSpan={5}>
                  Diskon ({rab.discountPct}%)
                </td>
                <td className="border border-neutral-300 px-2 py-1.5 text-right tabular-nums">
                  ({formatRupiah(rab.discountAmount, true)})
                </td>
              </tr>
            )}
            <tr>
              <td className="border border-neutral-300 px-2 py-1.5 text-right" colSpan={5}>
                PPN ({rab.taxPct}%)
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right tabular-nums">
                {formatRupiah(rab.taxAmount, true)}
              </td>
            </tr>
            <tr className="bg-primary-900 text-white">
              <td className="border border-primary-900 px-2 py-2 text-right font-bold uppercase" colSpan={5}>
                Total Anggaran
              </td>
              <td className="border border-primary-900 px-2 py-2 text-right font-bold tabular-nums">
                Rp {formatRupiah(rab.total, true)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Rekapitulasi bobot tiap bagian */}
        {rab.sectionSummary.length > 1 && (
          <section className="mt-6 break-inside-avoid">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primary-950">
              Rekapitulasi Bobot Pekerjaan
            </h2>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="w-10 border border-neutral-300 px-2 py-1 text-center font-semibold">No</th>
                  <th className="border border-neutral-300 px-2 py-1 text-left font-semibold">Bagian Pekerjaan</th>
                  <th className="w-32 border border-neutral-300 px-2 py-1 text-right font-semibold">Jumlah</th>
                  <th className="w-20 border border-neutral-300 px-2 py-1 text-right font-semibold">Bobot</th>
                </tr>
              </thead>
              <tbody>
                {rab.sectionSummary.map((section, index) => (
                  <tr key={section.id}>
                    <td className="border border-neutral-300 px-2 py-1 text-center text-neutral-500">
                      {toRoman(index + 1)}
                    </td>
                    <td className="border border-neutral-300 px-2 py-1">{section.name}</td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                      {formatRupiah(section.total)}
                    </td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                      {formatNumber(section.weightPct, 2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {rab.notes && (
          <section className="mt-6 break-inside-avoid">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary-950">Catatan</h2>
            <p className="whitespace-pre-line text-neutral-600">{rab.notes}</p>
          </section>
        )}

        <section className="mt-12 flex justify-end break-inside-avoid">
          <div className="w-56 text-center">
            <p className="text-neutral-500">Disusun oleh,</p>
            <div className="h-16" />
            <p className="border-t border-neutral-400 pt-1 font-semibold">{rab.createdBy.name}</p>
                <p className="text-[10px] text-neutral-500">{companyName}</p>
          </div>
        </section>
      </article>
    </div>
  );
}
