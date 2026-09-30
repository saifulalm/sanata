"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPasswordReset } from "@/lib/clientPortal";
import {
  Lock,
  AlertCircle,
  ArrowRight,
  Loader2,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Password Strength Indicator
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; requirements: { met: boolean; text: string }[] } {
  const requirements = [
    { met: password.length >= 8, text: "Minimal 8 karakter" },
    { met: /[A-Z]/.test(password), text: "Huruf besar (A-Z)" },
    { met: /[a-z]/.test(password), text: "Huruf kecil (a-z)" },
    { met: /[0-9]/.test(password), text: "Angka (0-9)" },
    { met: /[^A-Za-z0-9]/.test(password), text: "Karakter khusus (!@#$%)" },
  ];

  const metCount = requirements.filter(r => r.met).length;
  let label = "";
  let color = "bg-slate-200";

  if (password.length === 0) {
    return { score: 0, label: "", color: "bg-slate-200", requirements };
  }

  if (metCount <= 1) { label = "Sangat Lemah"; color = "bg-red-500"; }
  else if (metCount <= 2) { label = "Lemah"; color = "bg-red-400"; }
  else if (metCount <= 3) { label = "Sedang"; color = "bg-amber-500"; }
  else if (metCount <= 4) { label = "Kuat"; color = "bg-blue-500"; }
  else { label = "Sangat Kuat"; color = "bg-emerald-500"; }

  return { score: metCount, label, color, requirements };
}

function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Kekuatan password:</span>
        <span className={clsx(
          "text-xs font-medium",
          strength.score <= 1 ? "text-red-500" :
          strength.score <= 2 ? "text-red-400" :
          strength.score <= 3 ? "text-amber-500" :
          strength.score <= 4 ? "text-blue-500" : "text-emerald-500"
        )}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-300", strength.color)}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
      <div className="space-y-1">
        {strength.requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            {req.met ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-slate-300" />
            )}
            <span className={clsx("text-xs", req.met ? "text-emerald-600" : "text-slate-400")}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Reset Password Inner Component
// ============================================================================

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const validate = useCallback(() => {
    let valid = true;
    setPasswordError("");
    setConfirmError("");

    if (!password) {
      setPasswordError("Password diperlukan");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError("Konfirmasi password diperlukan");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError("Password tidak cocok");
      valid = false;
    }

    return valid;
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;
    if (!token) return;

    setLoading(true);
    try {
      const result = await confirmPasswordReset(token, password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/client/login");
        }, 3000);
      } else {
        setError(result.message || "Gagal reset password");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [token, password, validate, router]);

  // Loading state while checking token
  if (token === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No token - redirect
  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/client/login";
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-3xl blur-xl opacity-70" />
              <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Password Berhasil Diubah!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Password Anda telah berhasil diubah. Silakan login dengan password baru.
                </p>
                <Link
                  href="/client/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-md mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">SANTRA</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Atur Ulang Password
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Masukkan password baru untuk akun Anda
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        className={clsx(
                          "w-full pl-12 pr-12 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all",
                          passwordError ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 pr-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                    {password && <PasswordStrengthIndicator password={password} />}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        required
                        className={clsx(
                          "w-full pl-12 pr-12 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all",
                          confirmError ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-0 pr-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmError && <p className="text-xs text-red-500">{confirmError}</p>}
                    {confirmPassword && password === confirmPassword && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="w-3 h-3" />
                        <span>Password cocok</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Ubah Password</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/client/login"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Kembali ke halaman login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} PT Sanata Bhakti Utama</p>
      </footer>
    </div>
  );
}

// ============================================================================
// Main Export with Suspense Boundary
// ============================================================================

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}
