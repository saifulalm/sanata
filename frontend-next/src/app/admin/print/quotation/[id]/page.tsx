import { Fragment } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole, AdminApiError } from "@/lib/adminApi";
import { getQuotationById } from "@/lib/adminResources";
import { getSiteContent, setting } from "@/lib/siteContent";
import { formatNumber, formatRupiah } from "@/lib/format";
import { PrintButton } from "@/app/admin/print/rab/[id]/PrintButton";

export const metadata: Metadata = { title: "Surat Penawaran" };

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

const longDate = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** Terbilang — nilai kontrak pada surat resmi lazim ditulis dalam huruf. */
function terbilang(value: number): string {
  const units = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

  const convert = (n: number): string => {
    if (n < 12) return units[n];
    if (n < 20) return `${convert(n - 10)} belas`;
    if (n < 100) return `${convert(Math.floor(n / 10))} puluh ${convert(n % 10)}`.trim();
    if (n < 200) return `seratus ${convert(n - 100)}`.trim();
    if (n < 1000) return `${convert(Math.floor(n / 100))} ratus ${convert(n % 100)}`.trim();
    if (n < 2000) return `seribu ${convert(n - 1000)}`.trim();
    if (n < 1_000_000) return `${convert(Math.floor(n / 1000))} ribu ${convert(n % 1000)}`.trim();
    if (n < 1_000_000_000) return `${convert(Math.floor(n / 1_000_000))} juta ${convert(n % 1_000_000)}`.trim();
    return `${convert(Math.floor(n / 1_000_000_000))} miliar ${convert(n % 1_000_000_000)}`.trim();
  };

  const rounded = Math.floor(Math.abs(value));
  if (rounded === 0) return "nol rupiah";
  return `${convert(rounded).replace(/\s+/g, " ")} rupiah`;
}

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  // Di luar layout dashboard, jadi sesi diperiksa sendiri di sini.
  await requireAdminRole("ADMIN", "EDITOR");
  const { id } = await params;

  let quotation: Awaited<ReturnType<typeof getQuotationById>>;
  try {
    quotation = await getQuotationById(id);
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 404) notFound();
    throw err;
  }

  // Kop surat memakai data kontak dari CMS agar selalu sinkron dengan situs.
  const content = await getSiteContent();
        const address = setting(content, "contact.address", "Jl. Konstruksi Raya No. 12, Jakarta Selatan");
        const phone = setting(content, "contact.phone", "");
        const email = setting(content, "contact.email", "");
        const tagline = setting(content, "site.tagline", "Mitra Konstruksi Terpercaya.");
        const companyName = setting(content, "site.company_name", "Sanata Construction");

  const { snapshot } = quotation;
  const snapshotSections = snapshot && Array.isArray((snapshot as unknown as Record<string, unknown>).sections)
    ? (snapshot as unknown as { sections: Array<{ name: string; total: string; items: Array<{ description: string; unit: string; volume: string; unitPrice: string; amount: string }> }> }).sections
    : [];
  const termsList = (quotation.terms ?? "").split("\n").map((t) => t.trim()).filter(Boolean);
  const paymentTerms = quotation.paymentTerms ?? [];
  const totalValue = Number(quotation.total);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <PrintButton />

      <article className="mx-auto max-w-[210mm] bg-white p-[18mm] text-[11px] leading-relaxed text-neutral-800 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        {/* Kop surat */}
        <header className="mb-6 flex items-start justify-between gap-6 border-b-2 border-primary-900 pb-4">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-primary-900">SANATA</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-600">{tagline}</p>
          </div>
          <div className="text-right text-[10px] leading-relaxed text-neutral-500">
            <p className="max-w-[62mm] whitespace-pre-line">{address}</p>
            {phone && <p>Telp: {phone}</p>}
            {email && <p>{email}</p>}
          </div>
        </header>

        {/* Identitas surat */}
        <div className="mb-5 flex items-start justify-between gap-8">
          <table className="text-[11px]">
            <tbody>
              <tr>
                <td className="w-20 py-0.5 align-top text-neutral-500">Nomor</td>
                <td className="py-0.5 align-top">: {quotation.number}</td>
              </tr>
              <tr>
                <td className="py-0.5 align-top text-neutral-500">Lampiran</td>
                <td className="py-0.5 align-top">: 1 (satu) berkas</td>
              </tr>
              <tr>
                <td className="py-0.5 align-top text-neutral-500">Perihal</td>
                <td className="py-0.5 align-top font-semibold">: {quotation.subject}</td>
              </tr>
            </tbody>
          </table>
          <p className="shrink-0 pt-0.5 text-neutral-600">Jakarta, {longDate(quotation.issuedAt)}</p>
        </div>

        {/* Tujuan */}
        <div className="mb-5">
          <p className="text-neutral-600">Kepada Yth.</p>
          <p className="font-semibold text-primary-950">{quotation.clientCompany || quotation.clientName}</p>
          {quotation.attentionTo && <p>Up. {quotation.attentionTo}</p>}
          {quotation.clientAddress && (
            <p className="max-w-[100mm] whitespace-pre-line text-neutral-600">{quotation.clientAddress}</p>
          )}
        </div>

        <p className="mb-3">Dengan hormat,</p>
        {quotation.openingNote && <p className="mb-4 text-justify">{quotation.openingNote}</p>}

        {/* Rincian pekerjaan — angka dari snapshot, bukan RAB terkini */}
        <table className="mb-4 w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-primary-900 text-white">
              <th className="w-9 border border-primary-900 px-2 py-1.5 text-center font-semibold">No</th>
              <th className="border border-primary-900 px-2 py-1.5 text-left font-semibold">Uraian Pekerjaan</th>
              <th className="w-16 border border-primary-900 px-2 py-1.5 text-center font-semibold">Volume</th>
              <th className="w-14 border border-primary-900 px-2 py-1.5 text-center font-semibold">Satuan</th>
              <th className="w-24 border border-primary-900 px-2 py-1.5 text-right font-semibold">Harga Satuan</th>
              <th className="w-28 border border-primary-900 px-2 py-1.5 text-right font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {snapshotSections.map((section, sectionIndex) => (
              <Fragment key={`${section.name}-${sectionIndex}`}>
                <tr className="bg-neutral-100 font-semibold">
                  <td className="border border-neutral-300 px-2 py-1.5 text-center">{toRoman(sectionIndex + 1)}</td>
                  <td className="border border-neutral-300 px-2 py-1.5 uppercase" colSpan={5}>
                    {section.name}
                  </td>
                </tr>
                {section.items.map((item, itemIndex) => (
                  <tr key={`${section.name}-${itemIndex}`}>
                    <td className="border border-neutral-300 px-2 py-1 text-center text-neutral-500">{itemIndex + 1}</td>
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
                    {formatRupiah(section.total)}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="border border-neutral-300 px-2 py-1.5 text-right font-semibold" colSpan={5}>
                Subtotal
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right font-semibold tabular-nums">
                {formatRupiah(quotation.subtotal, true)}
              </td>
            </tr>
            {Number(quotation.discountAmount) > 0 && (
              <tr>
                <td className="border border-neutral-300 px-2 py-1.5 text-right" colSpan={5}>
                  Diskon ({Number(quotation.discountAmount) > 0 ? Math.round(Number(quotation.discountAmount) / (Number(quotation.subtotal) + Number(quotation.discountAmount)) * 100) : 0}%)
                </td>
                <td className="border border-neutral-300 px-2 py-1.5 text-right tabular-nums">
                  ({formatRupiah(quotation.discountAmount, true)})
                </td>
              </tr>
            )}
            <tr>
              <td className="border border-neutral-300 px-2 py-1.5 text-right" colSpan={5}>
                PPN ({Number(quotation.taxPct)}%)
              </td>
              <td className="border border-neutral-300 px-2 py-1.5 text-right tabular-nums">
                {formatRupiah(quotation.taxAmount, true)}
              </td>
            </tr>
            <tr className="bg-primary-900 text-white">
              <td className="border border-primary-900 px-2 py-2 text-right font-bold uppercase" colSpan={5}>
                Total Penawaran
              </td>
              <td className="border border-primary-900 px-2 py-2 text-right font-bold tabular-nums">
                Rp {formatRupiah(quotation.total, true)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mb-5 text-[10.5px] italic text-neutral-600">
          Terbilang: <span className="capitalize">{terbilang(totalValue)}</span>
        </p>

        {/* Termin pembayaran */}
        {paymentTerms.length > 0 && (
          <section className="mb-5 break-inside-avoid">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primary-950">Termin Pembayaran</h2>
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="w-9 border border-neutral-300 px-2 py-1 text-center font-semibold">No</th>
                  <th className="border border-neutral-300 px-2 py-1 text-left font-semibold">Tahap</th>
                  <th className="w-16 border border-neutral-300 px-2 py-1 text-right font-semibold">Porsi</th>
                  <th className="w-28 border border-neutral-300 px-2 py-1 text-right font-semibold">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {paymentTerms.map((term, index) => (
                  <tr key={`${term.label}-${index}`}>
                    <td className="border border-neutral-300 px-2 py-1 text-center text-neutral-500">{index + 1}</td>
                    <td className="border border-neutral-300 px-2 py-1">{term.label}</td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{term.percent}%</td>
                    <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">
                      {formatRupiah((totalValue * term.percent) / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Syarat & ketentuan */}
        {termsList.length > 0 && (
          <section className="mb-5 break-inside-avoid">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primary-950">Syarat &amp; Ketentuan</h2>
            <ol className="list-decimal space-y-1 pl-5 text-[10.5px] text-neutral-700">
              {termsList.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ol>
          </section>
        )}

        <p className="mb-5 break-inside-avoid text-[10.5px]">
          Penawaran ini berlaku sampai dengan{" "}
          <strong>{longDate(quotation.validUntil)}</strong>.
        </p>

        {quotation.closingNote && <p className="mb-8 text-justify">{quotation.closingNote}</p>}

        {/* Tanda tangan */}
        <section className="flex justify-end break-inside-avoid">
          <div className="w-60 text-center">
            <p className="text-neutral-600">Hormat kami,</p>
                <p className="font-semibold text-primary-900">{companyName}</p>
            <div className="h-20" />
            <p className="border-t border-neutral-400 pt-1 font-semibold">{quotation.signerName}</p>
            <p className="text-[10px] text-neutral-500">{quotation.signerTitle}</p>
          </div>
        </section>
      </article>
    </div>
  );
}
