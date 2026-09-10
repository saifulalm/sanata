"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { login } from "@/lib/clientPortal";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ============================================================================
// Feature Badge
// ============================================================================

function FeatureBadge({ icon: Icon, label, color }: { icon: typeof Shield; label: string; color: "emerald" | "amber" | "blue" }) {
  const colors = { emerald: "text-emerald-600 bg-emerald-50", amber: "text-amber-600 bg-amber-50", blue: "text-blue-600 bg-blue-50" };
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${colors[color]}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}

// ============================================================================
// Login Page - Standalone, no layout wrapper
// ============================================================================

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if ("ok" in result && result.ok === false) {
        setError(result.message || "Email atau password salah");
      } else {
        window.location.href = "/client/dashboard";
      }
    } catch {
      setError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-md mx-auto text-center">
          {/* Brand */}
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg viewBox="0 0 48 48" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e0e7ff" />
                  </linearGradient>
                </defs>
                <path d="M12 10 L28 10 L28 28 L40 28 L40 40 L12 40 Z" fill="url(#loginGrad)" opacity="0.3" />
                <path d="M10 10 L26 10 L26 26 L38 26 L38 40 L10 40 Z" fill="none" stroke="url(#loginGrad)" strokeWidth="2.5" strokeLinejoin="round" />
                <line x1="10" y1="17" x2="26" y2="17" stroke="url(#loginGrad)" strokeWidth="1.5" opacity="0.8" />
                <line x1="26" y1="31" x2="38" y2="31" stroke="url(#loginGrad)" strokeWidth="1.5" opacity="0.8" />
              </svg>
            </div>
            <div className="text-left">
              <span className="font-bold text-2xl text-slate-900 tracking-tight">SANTRA</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full uppercase tracking-wider">Portal</span>
            </div>
          </div>
          <p className="text-sm text-slate-500">Client Portal</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              <div className="p-8">
                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang</h1>
                  <p className="text-slate-500 text-sm">Masuk untuk memantau proyek konstruksi Anda</p>
                  <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <FeatureBadge icon={Shield} label="Aman" color="emerald" />
                    <FeatureBadge icon={CheckCircle2} label="Terpercaya" color="blue" />
                    <FeatureBadge icon={Sparkles} label="Real-time" color="amber" />
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Alamat Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@perusahaan.com"
                        required
                        autoComplete="email"
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password"
                        required
                        autoComplete="current-password"
                        disabled={loading}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
                      <span className="text-sm text-slate-600">Ingat saya</span>
                    </label>
                    <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Lupa password?</button>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></> : <><span>Masuk</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400">atau</span></div>
                </div>

                <p className="text-center text-sm text-slate-500">
                  Belum punya akun? <Link href="/client/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 group">Daftar di sini <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} PT Sanata Bhakti Utama. Hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
