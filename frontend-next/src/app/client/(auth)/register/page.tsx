"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { register } from "@/lib/clientPortal";
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

function FeatureBadge({ icon: Icon, label, color }: { icon: typeof Shield; label: string; color: "emerald" | "amber" | "blue" }) {
  const colors = { emerald: "text-emerald-600 bg-emerald-50", amber: "text-amber-600 bg-amber-50", blue: "text-blue-600 bg-blue-50" };
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${colors[color]}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}

export default function ClientRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Nama lengkap diperlukan";
    if (!form.email.trim()) newErrors.email = "Email diperlukan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Format email tidak valid";
    if (!form.password) newErrors.password = "Password diperlukan";
    else if (form.password.length < 6) newErrors.password = "Minimal 6 karakter";
    if (!form.confirmPassword) newErrors.confirmPassword = "Konfirmasi password diperlukan";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Password tidak cocok";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, phone: form.phone.trim() || undefined, companyName: form.company.trim() || undefined });
      if ("success" in result && result.success) {
        window.location.href = "/client/dashboard";
      } else if ("message" in result) {
        setError(result.message || "Registrasi gagal");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch { setError("Terjadi gangguan koneksi."); } finally { setLoading(false); }
  }, [form, validate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg viewBox="0 0 48 48" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="regGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#e0e7ff" /></linearGradient></defs>
                <path d="M12 10 L28 10 L28 28 L40 28 L40 40 L12 40 Z" fill="url(#regGrad)" opacity="0.3" />
                <path d="M10 10 L26 10 L26 26 L38 26 L38 40 L10 40 Z" fill="none" stroke="url(#regGrad)" strokeWidth="2.5" strokeLinejoin="round" />
                <line x1="10" y1="17" x2="26" y2="17" stroke="url(#regGrad)" strokeWidth="1.5" opacity="0.8" />
                <line x1="26" y1="31" x2="38" y2="31" stroke="url(#regGrad)" strokeWidth="1.5" opacity="0.8" />
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
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              <div className="p-8">
                <div className="text-center mb-5">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Buat Akun Baru</h1>
                  <p className="text-slate-500 text-sm">Daftar untuk memantau proyek konstruksi Anda</p>
                  <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <FeatureBadge icon={Shield} label="Aman" color="emerald" />
                    <FeatureBadge icon={CheckCircle2} label="Gratis" color="blue" />
                    <FeatureBadge icon={Sparkles} label="Mudah" color="amber" />
                  </div>
                </div>

                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Masukkan nama lengkap" required className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.name ? "border-red-300 bg-red-50/50" : "border-slate-200"}`} />
                    </div>
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="nama@perusahaan.com" required className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.email ? "border-red-300 bg-red-50/50" : "border-slate-200"}`} />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setField("password", e.target.value)} placeholder="Min 6 karakter" required className={`w-full pl-12 pr-10 py-3.5 bg-slate-50/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.password ? "border-red-300 bg-red-50/50" : "border-slate-200"}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 pr-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><span className="text-xs">{showPassword ? "Sembunyi" : "Lihat"}</span></button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Konfirmasi <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} placeholder="Ulangi password" required className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.confirmPassword ? "border-red-300 bg-red-50/50" : "border-slate-200"}`} />
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Telepon</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="08xxxxxxxxxx" className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Perusahaan</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" value={form.company} onChange={(e) => setField("company", e.target.value)} placeholder="PT Contoh" className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Dengan mendaftar, Anda menyetujui <button type="button" className="text-blue-600 hover:underline">Syarat & Ketentuan</button> dan <button type="button" className="text-blue-600 hover:underline">Kebijakan Privasi</button>.
                  </p>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></> : <><span>Daftar Sekarang</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400">atau</span></div>
                </div>

                <p className="text-center text-sm text-slate-500">
                  Sudah punya akun? <Link href="/client/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 group">Masuk di sini <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /></Link>
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
