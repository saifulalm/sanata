"use client";

import { useState, useCallback, useEffect } from "react";
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
  Eye,
  EyeOff,
  Check,
  X,
  FileText,
  ShieldCheck,
  Globe,
  Info,
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

function getPasswordStrength(password: string): { score: number; label: string; color: string; requirements: { met: boolean; text: string }[] } {
  const requirements = [
    { met: password.length >= 8, text: "Minimal 8 karakter" },
    { met: /[A-Z]/.test(password), text: "Huruf besar (A-Z)" },
    { met: /[a-z]/.test(password), text: "Huruf kecil (a-z)" },
    { met: /[0-9]/.test(password), text: "Angka (0-9)" },
    { met: /[^A-Za-z0-9]/.test(password), text: "Karakter khusus (!@#$%)" },
  ];

  const metCount = requirements.filter(r => r.met).length;
  let score = metCount;
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

  return { score, label, color, requirements };
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
              <X className="w-3 h-3 text-slate-300" />
            )}
            <span className={clsx("text-xs", req.met ? "text-slate-600" : "text-slate-400")}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Requirements List Component
// ============================================================================

interface RequirementsListProps {
  requirements: { met: boolean; text: string }[];
}

function RequirementsList({ requirements }: RequirementsListProps) {
  return (
    <div className="space-y-1.5 mt-2">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2">
          {req.met ? (
            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
          )}
          <span className={clsx("text-xs", req.met ? "text-emerald-600" : "text-slate-400")}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Terms Modal Component
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {children}
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Success Modal Component
// ============================================================================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

function SuccessModal({ isOpen, onClose, email }: SuccessModalProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  useEffect(() => {
    if (isOpen && countdown === 0) {
      window.location.href = "/client/login";
    }
  }, [isOpen, countdown]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrasi Berhasil">
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Akun Berhasil Dibuat!
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Selamat datang di Portal Klien Sanata Construction. Kami telah mengirimkan link verifikasi ke:
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <Mail className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-700 dark:text-blue-300">{email}</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
          Halaman akan dialihkan dalam {countdown} detik...
        </p>
        <button
          onClick={() => window.location.href = "/client/login"}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Klik di sini jika tidak dialihkan otomatis
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// Terms Content
// ============================================================================

const termsContent = `
**Syarat dan Ketentuan Penggunaan Portal Klien Sanata Construction**

*Terakhir diperbarui: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*

Dengan mengakses dan menggunakan Portal Klien Sanata Construction ("Portal"), Anda agree untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak setuju dengan syarat ini, mohon untuk tidak menggunakan Portal.

**1. Penerimaan Syarat**
Dengan mendaftar dan menggunakan Portal, Anda mengakui bahwa Anda telah membaca, memahami, dan setuju untuk terikat oleh Syarat dan Ketentuan ini serta Kebijakan Privasi kami.

**2. Deskripsi Layanan**
Portal Klien Sanata Construction menyediakan akses ke informasi proyek konstruksi Anda, termasuk:
- Melihat progres dan status proyek
- Mengakses dokumen dan laporan
- Melihat notifikasi dan pembaruan
- Mengelola pengaturan akun

**3. Hak Akses**
Akses ke Portal diberikan kepada klien yang telah terdaftar dan disetujui oleh Sanata Construction. Akses dapat dibatasi atau dicabut sewaktu-waktu sesuai kebijakan perusahaan.

**4. Kewajiban Pengguna**
Anda bertanggung jawab untuk:
- Menjaga kerahasiaan informasi akun Anda
- Tidak membagikan akses kepada pihak ketiga
- Menggunakan Portal sesuai dengan tujuan yang dimaksud
- Tidak melakukan tindakan yang dapat merusak atau mengganggu sistem

**5. Kekayaan Intelektual**
Seluruh konten, desain, dan material di Portal adalah milik Sanata Construction dan dilindungi oleh hak cipta.

**6. Privasi**
Pengumpulan dan penggunaan data pribadi Anda dijelaskan dalam Kebijakan Privasi kami.

**7. Penolakan Jaminan**
Portal disediakan "sebagaimana adanya". Sanata Construction tidak menjamin bahwa Portal akan selalu tersedia atau bebas dari kesalahan.

**8. Pembatasan Tanggung Jawab**
Sanata Construction tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan Portal.

**9. Perubahan Syarat**
Sanata Construction berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui Portal.

**10. Hukum yang Berlaku**
Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia.

**11. Hubungi Kami**
Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di info@sanata.id
`;

const privacyContent = `
**Kebijakan Privasi Portal Klien Sanata Construction**

*Terakhir diperbarui: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*

Sanata Construction ("kami", "milik kami") menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan mengamankan informasi Anda.

**1. Informasi yang Kami Kumpulkan**

*Informasi yang Anda Berikan:*
- Nama lengkap
- Alamat email
- Nomor telepon
- Nama perusahaan
- Informasi akun lain yang Anda berikan

*Informasi yang Dikumpulkan Otomatis:*
- Alamat IP
- Jenis browser dan perangkat
- Halaman yang dikunjungi
- Waktu dan tanggal kunjungan
- Preferensi pengguna

**2. Penggunaan Informasi**

Kami menggunakan informasi Anda untuk:
- Memberikan akses ke Portal
- Mengirim notifikasi tentang proyek Anda
- Meningkatkan layanan kami
- Mengirim komunikasi pemasaran (dengan persetujuan)
- Kepatuhan hukum

**3. Perlindungan Data**

Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi informasi Anda, termasuk:
- Enkripsi data saat transmisi
- Akses terbatas ke informasi pribadi
- Pemantauan keamanan reguler

**4. Berbagi Informasi**

Kami tidak menjual informasi pribadi Anda. Informasi dapat dibagikan dengan:
- Tim proyek internal
- Penyedia layanan pihak ketiga (dengan kontrak)
- Otoritas hukum jika diperlukan

**5. Hak Anda**

Anda memiliki hak untuk:
- Mengakses informasi Anda
- Mengoreksi informasi yang tidak akurat
- Menghapus informasi Anda (dengan batasan hukum)
- Menarik persetujuan pemasaran
- Mengajukan keberatan atas pemrosesan

**6. Cookie**

Portal menggunakan cookies untuk:
- Autentikasi dan keamanan
- Preferensi pengguna
- Analitik

**7. Retensi Data**

Kami menyimpan informasi Anda selama akun Anda aktif atau sesuai kebutuhan layanan.

**8. Perubahan Kebijakan**

Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email.

**9. Hubungi Kami**

Untuk pertanyaan tentang kebijakan privasi ini:
- Email: privacy@sanata.id
- Alamat: Jakarta, Indonesia
`;

// ============================================================================
// Form Input Component
// ============================================================================

interface FormInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon: React.ElementType;
  disabled?: boolean;
}

function FormInput({ label, type, value, onChange, placeholder, required, error, icon: Icon, disabled }: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={clsx(
            "w-full pl-12 pr-",
            isPassword ? "pr-12" : "pr-4",
            "py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border rounded-2xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all",
            error 
              ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10" 
              : "border-slate-200 dark:border-slate-700",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 pr-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// Main Register Page
// ============================================================================

export default function ClientRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    company: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const setField = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const n = { ...e };
        delete n[field];
        return n;
      });
    }
  };

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = "Nama lengkap diperlukan";
    else if (form.name.trim().length < 2) newErrors.name = "Nama minimal 2 karakter";
    
    if (!form.email.trim()) newErrors.email = "Email diperlukan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Format email tidak valid";
    
    if (!form.password) newErrors.password = "Password diperlukan";
    else if (form.password.length < 8) newErrors.password = "Minimal 8 karakter";
    
    if (!form.confirmPassword) newErrors.confirmPassword = "Konfirmasi password diperlukan";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Password tidak cocok";
    
    if (!form.agreeTerms) newErrors.agreeTerms = "Anda harus menyetujui syarat dan ketentuan";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const result = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        companyName: form.company.trim() || undefined,
      });
      
      if ("success" in result && result.success) {
        setShowSuccessModal(true);
      } else if ("message" in result) {
        setError(result.message || "Registrasi gagal");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch {
      setError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [form, validate]);

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <header className="relative p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-30" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                <svg viewBox="0 0 48 48" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="regGradV2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#e0e7ff" /></linearGradient></defs>
                  <path d="M12 10 L28 10 L28 28 L40 28 L40 40 L12 40 Z" fill="url(#regGradV2)" opacity="0.3" />
                  <path d="M10 10 L26 10 L26 26 L38 26 L38 40 L10 40 Z" fill="none" stroke="url(#regGradV2)" strokeWidth="2.5" strokeLinejoin="round" />
                  <line x1="10" y1="17" x2="26" y2="17" stroke="url(#regGradV2)" strokeWidth="1.5" opacity="0.8" />
                  <line x1="26" y1="31" x2="38" y2="31" stroke="url(#regGradV2)" strokeWidth="1.5" opacity="0.8" />
                </svg>
              </div>
            </div>
            <div className="text-left">
              <span className="font-bold text-2xl text-slate-900 dark:text-white tracking-tight">SANTRA</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full uppercase tracking-wider">Portal</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Portal Klien Konstruksi</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              <div className="p-8">
                <div className="text-center mb-5">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Buat Akun Baru</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Daftar untuk memantau proyek konstruksi Anda</p>
                  <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <FeatureBadge icon={ShieldCheck} label="Aman" color="emerald" />
                    <FeatureBadge icon={Globe} label="Gratis" color="blue" />
                    <FeatureBadge icon={Sparkles} label="Mudah" color="amber" />
                  </div>
                </div>

                {error && (
                  <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormInput
                    label="Nama Lengkap"
                    type="text"
                    value={form.name}
                    onChange={(v) => setField("name", v)}
                    placeholder="Masukkan nama lengkap"
                    required
                    error={errors.name}
                    icon={User}
                    disabled={loading}
                  />

                  <FormInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setField("email", v)}
                    placeholder="nama@perusahaan.com"
                    required
                    error={errors.email}
                    icon={Mail}
                    disabled={loading}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormInput
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={(v) => setField("password", v)}
                        placeholder="Minimal 8 karakter"
                        required
                        error={errors.password}
                        icon={Lock}
                        disabled={loading}
                      />
                      {form.password && (
                        <div className="mt-1">
                          <PasswordStrengthIndicator password={form.password} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <FormInput
                        label="Konfirmasi"
                        type="password"
                        value={form.confirmPassword}
                        onChange={(v) => setField("confirmPassword", v)}
                        placeholder="Ulangi password"
                        required
                        error={errors.confirmPassword}
                        icon={Lock}
                        disabled={loading}
                      />
                      {form.confirmPassword && form.password === form.confirmPassword && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                          <Check className="w-3 h-3" />
                          <span>Password cocok</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Telepon"
                      type="tel"
                      value={form.phone}
                      onChange={(v) => setField("phone", v)}
                      placeholder="08xxxxxxxxxx"
                      icon={Phone}
                      disabled={loading}
                    />
                    <FormInput
                      label="Perusahaan"
                      type="text"
                      value={form.company}
                      onChange={(v) => setField("company", v)}
                      placeholder="PT Contoh"
                      icon={Building2}
                      disabled={loading}
                    />
                  </div>

                  {/* Terms Agreement */}
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={(e) => setField("agreeTerms", e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Saya setuju dengan{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          Syarat & Ketentuan
                        </button>
                        {" "}dan{" "}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          Kebijakan Privasi
                        </button>
                      </div>
                    </label>
                    {errors.agreeTerms && (
                      <p className="text-xs text-red-500 ml-8">{errors.agreeTerms}</p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Penting:</p>
                      <p>Setelah mendaftar, admin akan memberikan akses ke proyek Anda. Hubungi tim kami jika membutuhkan bantuan.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftar Sekarang</span>
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
                  Sudah punya akun?{" "}
                  <Link href="/client/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                    Masuk di sini
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
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

      {/* Modals */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Syarat & Ketentuan">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{termsContent}</div>
        </div>
      </Modal>

      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Kebijakan Privasi">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{privacyContent}</div>
        </div>
      </Modal>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        email={form.email}
      />
    </div>
  );
}
