"use client";

import { useState, useCallback, useEffect } from "react";
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
  Fingerprint,
  Smartphone,
  KeyRound,
  Globe,
  ChevronRight,
  Star,
  Zap,
  ShieldCheck,
  LockKeyhole,
  EyeOff as EyeOffIcon,
} from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Feature Badge Component
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
// Password Strength Indicator
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string; width: string } {
  let score = 0;
  if (!password) return { score: 0, label: "", color: "bg-slate-200", width: "0%" };
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Lemah", color: "bg-red-500", width: "25%" };
  if (score <= 3) return { score, label: "Sedang", color: "bg-amber-500", width: "50%" };
  if (score <= 4) return { score, label: "Kuat", color: "bg-blue-500", width: "75%" };
  return { score, label: "Sangat Kuat", color: "bg-emerald-500", width: "100%" };
}

function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Kekuatan password:</span>
        <span className={clsx(
          "text-xs font-medium",
          strength.score <= 2 ? "text-red-500" : strength.score <= 3 ? "text-amber-500" : strength.score <= 4 ? "text-blue-500" : "text-emerald-500"
        )}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-300", strength.color)}
          style={{ width: strength.width }}
        />
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={clsx(
              "h-1 flex-1 rounded-full transition-colors",
              strength.score >= level * 1.5 ? strength.color : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Social Login Button
// ============================================================================

interface SocialButtonProps {
  provider: "google" | "apple";
  onClick: () => void;
  loading?: boolean;
}

function SocialButton({ provider, onClick, loading }: SocialButtonProps) {
  const isGoogle = provider === "google";
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isGoogle ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      )}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {isGoogle ? "Masuk dengan Google" : "Masuk dengan Apple"}
      </span>
    </button>
  );
}

// ============================================================================
// Forgot Password Modal
// ============================================================================

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Import the API function dynamically
      const { requestPasswordReset } = await import("@/lib/clientPortal");
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Terjadi kesalahan");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lupa Password?</h2>
            <p className="text-slate-500 mt-2">Masukkan email Anda untuk mengatur ulang password</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Email Terkirim!</h3>
              <p className="text-slate-500 mt-2">Silakan cek inbox email Anda untuk instruksi reset password. Link akan kadaluarsa dalam 1 jam.</p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl"
              >
                Tutup
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Link Reset</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                Batal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Session Timeout Warning
// ============================================================================

interface SessionInfoProps {
  lastActivity: Date;
}

function SessionInfo({ lastActivity }: SessionInfoProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((Date.now() - lastActivity.getTime()) / 1000);
      if (seconds < 60) setTimeAgo(`${seconds} detik`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)} menit`);
      else setTimeAgo(`${Math.floor(seconds / 3600)} jam`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>Aktif {timeAgo} lalu</span>
    </div>
  );
}

// ============================================================================
// Main Login Page
// ============================================================================

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTOTP, setShowTOTP] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [sessionStart] = useState(new Date());

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if ("ok" in result && result.ok === false) {
        setError(result.message || "Email atau password salah");
      } else {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem("client_remember_email", email);
        } else {
          localStorage.removeItem("client_remember_email");
        }
        // Use window.location for clean redirect after auth
        window.location.href = "/client/dashboard";
      }
    } catch {
      setError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe]);

  const handleSocialLogin = useCallback(async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    // Social login integration point - placeholder for OAuth flow
    // In production, this would redirect to OAuth provider
    // For now, show a toast message
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSocialLoading(null);
    setError(`Login dengan ${provider === "google" ? "Google" : "Apple"} akan segera hadir. Gunakan login email untuk saat ini.`);
  }, []);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("client_remember_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative p-6">
        <div className="max-w-md mx-auto text-center">
          {/* Brand */}
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-30" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="loginGradV2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#e0e7ff" />
                    </linearGradient>
                  </defs>
                  <path d="M12 10 L28 10 L28 28 L40 28 L40 40 L12 40 Z" fill="url(#loginGradV2)" opacity="0.3" />
                  <path d="M10 10 L26 10 L26 26 L38 26 L38 40 L10 40 Z" fill="none" stroke="url(#loginGradV2)" strokeWidth="2.5" strokeLinejoin="round" />
                  <line x1="10" y1="17" x2="26" y2="17" stroke="url(#loginGradV2)" strokeWidth="1.5" opacity="0.8" />
                  <line x1="26" y1="31" x2="38" y2="31" stroke="url(#loginGradV2)" strokeWidth="1.5" opacity="0.8" />
                </svg>
              </div>
            </div>
            <div className="text-left">
              <span className="font-bold text-2xl text-slate-900 dark:text-white tracking-tight">SANTRA</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full uppercase tracking-wider">Portal</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Portal Klien Konstruksi</p>
          
          {/* Session indicator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <SessionInfo lastActivity={sessionStart} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              <div className="p-8">
                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Masuk untuk memantau proyek konstruksi Anda</p>
                  <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <FeatureBadge icon={ShieldCheck} label="Aman" color="emerald" />
                    <FeatureBadge icon={Zap} label="Real-time" color="blue" />
                    <FeatureBadge icon={Star} label="Modern" color="amber" />
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                      {error.includes("2FA") && (
                        <button 
                          onClick={() => setShowTOTP(true)}
                          className="text-xs text-red-600 dark:text-red-400 underline mt-1"
                        >
                          Gunakan kode autentikasi
                        </button>
                      )}
                    </div>
                  </div>
                )}

                  <div className="space-y-3 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
                      Login sosial akan segera hadir
                    </p>
                    <SocialButton provider="google" onClick={() => handleSocialLogin("google")} loading={socialLoading === "google"} />
                    <div className="mt-2">
                      <SocialButton provider="apple" onClick={() => handleSocialLogin("apple")} loading={socialLoading === "apple"} />
                    </div>
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-4 bg-white dark:bg-slate-800 text-slate-400">atau masuk dengan email</span></div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Alamat Email</label>
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
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
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
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={password} />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 cursor-pointer bg-white dark:bg-slate-800" 
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Ingat saya</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Lupa password?
                    </button>
                  </div>

                  {/* Security Info */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <LockKeyhole className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Koneksi terenkripsi dengan TLS 1.3
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white dark:bg-slate-800 text-slate-400">atau</span></div>
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum punya akun?{" "}
                  <Link href="/client/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                    Daftar di sini
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Kebijakan Privasi</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Syarat & Ketentuan</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Bantuan</Link>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative p-6 text-center">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} PT Sanata Bhakti Utama. Hak cipta dilindungi.</p>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  );
}
