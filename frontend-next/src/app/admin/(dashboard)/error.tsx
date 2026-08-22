"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, LayoutDashboard } from "lucide-react";

/**
 * Batas galat untuk seluruh panel admin. Tanpa ini, kegagalan API (mis. backend
 * mati) melempar ke root dan pengguna kehilangan sidebar beserta jalan kembali.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
          <AlertTriangle size={22} />
        </div>

              <h1 className="mt-5 font-display text-lg font-semibold text-white">Gagal memuat halaman</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Data tidak bisa diambil. Pastikan server API berjalan, lalu coba lagi.
        </p>

        {error.digest && (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-slate-500">
            Kode: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={reset}
                  className="flex items-center gap-2 rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20"
          >
            <RotateCw size={15} /> Coba Lagi
          </button>
          <Link
            href="/admin"
                  className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.04]"
          >
            <LayoutDashboard size={15} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
