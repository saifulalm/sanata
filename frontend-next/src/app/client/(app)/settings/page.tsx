"use client";

import { useEffect, useState } from "react";
import { updateProfile, type Client } from "@/lib/clientPortal";
import {
  User,
  Mail,
  Phone,
  Building2,
  Bell,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import clsx from "clsx";

type Theme = "light" | "dark";

interface SettingsState {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  notifyProgress: boolean;
  notifyDocuments: boolean;
  notifyMessages: boolean;
  preferredLanguage: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-64 bg-white rounded-xl border border-slate-200 shadow-sm" />
      <div className="h-48 bg-white rounded-xl border border-slate-200 shadow-sm" />
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SettingsState>({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    notifyProgress: true,
    notifyDocuments: true,
    notifyMessages: true,
    preferredLanguage: "id",
  });

  useEffect(() => {
    // Load user data
    fetch("/api/client/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data) {
          const client = res.data as Client;
          setUser(client);
          setForm({
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            companyName: client.companyName || "",
            notifyProgress: client.notifyProgress ?? true,
            notifyDocuments: client.notifyDocuments ?? true,
            notifyMessages: client.notifyMessages ?? true,
            preferredLanguage: client.preferredLanguage || "id",
          });
        }
      })
      .finally(() => setLoading(false));

    // Load theme
    const storedTheme = localStorage.getItem("client_theme") as Theme | null;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setTheme(storedTheme ?? (systemPrefersDark ? "dark" : "light"));
  }, []);

  const handleThemeToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("client_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProfile({
        name: form.name,
        phone: form.phone || null,
        companyName: form.companyName || null,
        notifyProgress: form.notifyProgress,
        notifyDocuments: form.notifyDocuments,
        notifyMessages: form.notifyMessages,
        preferredLanguage: form.preferredLanguage,
      });

      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Gagal menyimpan pengaturan");
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Pengaturan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi akun dan preferensi Anda
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <Check className="w-5 h-5 shrink-0" />
          <p>Pengaturan berhasil disimpan</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Informasi Akun
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Perbarui informasi profil Anda
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <User className="w-4 h-4" />
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                readOnly
                disabled
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">
                Email tidak dapat diubah
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <Phone className="w-4 h-4" />
                Nomor Telepon
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <label
                htmlFor="company"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <Building2 className="w-4 h-4" />
                Nama Perusahaan
              </label>
              <input
                id="company"
                type="text"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="PT Contoh Indonesia"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Preferensi Notifikasi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pilih notifikasi yang ingin Anda terima
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Notify Progress */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Update Progress
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Notifikasi saat ada perubahan progress proyek
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.notifyProgress}
                onChange={(e) =>
                  setForm({ ...form, notifyProgress: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            {/* Notify Documents */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Dokumen Baru
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Notifikasi saat ada dokumen baru diupload
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.notifyDocuments}
                onChange={(e) =>
                  setForm({ ...form, notifyDocuments: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            {/* Notify Messages */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Pesan Baru
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Notifikasi saat ada pesan baru dari tim proyek
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.notifyMessages}
                onChange={(e) =>
                  setForm({ ...form, notifyMessages: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Tampilan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Atur tampilan aplikasi
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "light" ? (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Mode Tema
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {theme === "light" ? "Tema terang" : "Tema gelap"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleThemeToggle}
                className={clsx(
                  "relative w-14 h-8 rounded-full transition-colors",
                  theme === "light" ? "bg-blue-600" : "bg-slate-600"
                )}
                aria-label="Toggle theme"
              >
                <span
                  className={clsx(
                    "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform flex items-center justify-center",
                    theme === "light" ? "left-1" : "left-7"
                  )}
                >
                  {theme === "light" ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Bahasa
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Bahasa antarmuka
                  </p>
                </div>
              </div>
              <select
                value={form.preferredLanguage}
                onChange={(e) =>
                  setForm({ ...form, preferredLanguage: e.target.value })
                }
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}
