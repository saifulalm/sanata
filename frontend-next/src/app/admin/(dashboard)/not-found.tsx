import Link from "next/link";
import { FileQuestion, LayoutDashboard } from "lucide-react";

/** 404 di dalam panel admin — tetap memakai kerangka admin, bukan 404 situs publik. */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-slate-400">
          <FileQuestion size={22} />
        </div>

        <h1 className="mt-5 font-display text-lg font-semibold text-white">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Data yang Anda cari sudah dihapus atau alamatnya keliru.
        </p>

        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20"
        >
          <LayoutDashboard size={15} /> Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
