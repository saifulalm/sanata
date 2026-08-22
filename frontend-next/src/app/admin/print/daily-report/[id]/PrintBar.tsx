"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

/** Toolbar layar saja — disembunyikan saat dokumen dicetak. */
export function PrintBar({ backHref }: { backHref: string }) {
  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between print:hidden">
      <Link href={backHref} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-800">
        <ArrowLeft size={15} /> Kembali
      </Link>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
      >
        <Printer size={15} /> Cetak / Simpan PDF
      </button>
    </div>
  );
}
