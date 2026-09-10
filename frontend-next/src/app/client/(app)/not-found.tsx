"use client";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <svg viewBox="0 0 48 48" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="notFoundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <path d="M12 10 L28 10 L28 28 L40 28 L40 40 L12 40 Z" fill="url(#notFoundGrad)" opacity="0.3" />
          <path d="M10 10 L26 10 L26 26 L38 26 L38 40 L10 40 Z" fill="none" stroke="url(#notFoundGrad)" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="24" y="22" textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="bold">404</text>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-500 mb-6 max-w-md">
        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <div className="flex items-center gap-4">
        <Link href="/client/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30">
          <Home className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
        <button onClick={() => history.back()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Halaman Sebelumnya
        </button>
      </div>
    </div>
  );
}
