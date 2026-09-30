"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { login } from "@/lib/clientPortal";
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Client Portal Login Page
 * Theme: Sanata Brand (Charcoal #20282C + Desert #C9AD82) — matching admin login
 */
export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if ("ok" in result && result.ok === false) {
        setError(result.message || "Email atau kata sandi salah");
      } else {
        window.location.href = "/client/dashboard";
      }
    } catch {
      setError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  useEffect(() => {
    const remembered = localStorage.getItem("client_remember_email");
    if (remembered) setEmail(remembered);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      {/* Card wrapper */}
      <div className="relative w-full max-w-sm">
        {/* Glow */}
        <div className="absolute -inset-1 rounded-[2rem] bg-desert-400/5 blur-xl" />

        <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_35px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          {/* Brand mark */}
          <div className="mb-6 flex justify-center">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-desert-400/30 bg-white/5">
              <svg width="32" height="32" viewBox="0 0 40 40" aria-label="Sanata logo">
                <circle cx="16" cy="20" r="8" fill="#C9AD82" opacity="0.3" />
                <circle cx="16" cy="20" r="8" fill="none" stroke="#C9AD82" strokeWidth="2" />
                <circle cx="26" cy="16" r="6" fill="#C9AD82" opacity="0.3" />
                <circle cx="26" cy="16" r="6" fill="none" stroke="#C9AD82" strokeWidth="1.5" />
                <circle cx="22" cy="26" r="5" fill="#C9AD82" opacity="0.3" />
                <circle cx="22" cy="26" r="5" fill="none" stroke="#C9AD82" strokeWidth="1.5" />
                <line x1="16" y1="20" x2="26" y2="16" stroke="#C9AD82" strokeWidth="1" opacity="0.5" />
                <line x1="16" y1="20" x2="22" y2="26" stroke="#C9AD82" strokeWidth="1" opacity="0.5" />
                <line x1="26" y1="16" x2="22" y2="26" stroke="#C9AD82" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
          </div>

          <p className="mb-2 text-center font-accent text-[11px] font-semibold uppercase tracking-[0.28em] text-desert-400">
            Portal Klien
          </p>
          <p className="mb-6 text-center text-sm text-charcoal-300">
            Masuk ke akun klien Sanata Construction
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-charcoal-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-2xl border border-desert-400/15 bg-white/[0.04] pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-charcoal-500 focus:border-desert-400 focus:outline-none focus:ring-2 focus:ring-desert-400/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-charcoal-400">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-2xl border border-desert-400/15 bg-white/[0.04] pl-12 pr-12 py-3.5 text-sm text-white placeholder:text-charcoal-500 focus:border-desert-400 focus:outline-none focus:ring-2 focus:ring-desert-400/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 pr-4 text-charcoal-400 transition-colors hover:text-desert-400"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-desert-400/35 bg-desert-400/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-desert-300 transition-all hover:bg-desert-400/20 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <Link
            href="/"
            className="mt-6 block text-center text-xs uppercase tracking-[0.18em] text-charcoal-400 transition-colors hover:text-desert-400"
          >
            ← Kembali ke situs
          </Link>
        </div>
      </div>
    </div>
  );
}
