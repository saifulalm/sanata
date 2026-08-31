"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  MapPin,
  Clock,
  Image,
  Camera,
  Package,
  User,
  Calendar,
} from "lucide-react";
import {
  getExecution,
  updateExecution,
  type ExecutionLog,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";
import { GpsInput } from "@/components/admin/GpsInput";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditExecutionPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ExecutionLog | null>(null);
  const [gpsError, setGpsError] = useState<string>("");

  const [form, setForm] = useState({
    description: "",
    locationName: "",
    latitude: "",
    longitude: "",
    progressPct: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getExecution(resolvedParams.id);
        setData(result);
        setForm({
          description: result.description || "",
          locationName: result.locationName || "",
          latitude: result.latitude || "",
          longitude: result.longitude || "",
          progressPct: result.progressPct || 0,
        });
      } catch (err: any) {
        console.error("[EditExecution] Load error:", err);
        const errorMsg = err?.message || "Gagal memuat data";
        if (err?.status === 404) {
          toast("Execution tidak ditemukan", "error");
          router.push("/admin/workforce/executions");
        } else if (err?.status === 401) {
          toast("Sesi berakhir. Silakan login ulang.", "error");
          router.push("/admin/login");
        } else {
          toast(errorMsg, "error");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    try {
      await updateExecution(data.id, {
        description: form.description || undefined,
        locationName: form.locationName || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        progressPct: form.progressPct,
      });
      toast("Execution berhasil diperbarui", "success");
      router.push(`/admin/workforce/executions/${data.id}`);
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/workforce/executions/${data.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="font-mono text-sm text-cyan-400">{data.logCode}</p>
          <h1 className="text-xl font-bold text-white">Edit Execution</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Info Card */}
            <Card className="border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Detail Pelaksanaan</h3>
                  <p className="text-xs text-slate-400">Update informasi pekerjaan</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-slate-400">{new Date(data.logDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-slate-500" />
                  <span className="text-white">{data.worker.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-slate-400">{data.worker.role}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Image size={14} className="text-slate-500" />
                  <Badge tone="info">{data.photos.length} foto</Badge>
                </div>
              </div>
            </Card>

            {/* Deskripsi */}
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">1</span>
                Deskripsi Pekerjaan
              </h3>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                placeholder="Jelaskan pekerjaan yang dilakukan..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none"
              />
            </Card>

            {/* Progress */}
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">2</span>
                Progress Pelaksanaan
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.progressPct}
                    onChange={(e) => setForm({ ...form, progressPct: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="w-16 text-center font-mono text-xl font-bold text-cyan-400">{form.progressPct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${form.progressPct}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Lokasi dengan Search */}
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">3</span>
                Lokasi Pelaksanaan
              </h3>
              <GpsInput
                value={{
                  latitude: form.latitude,
                  longitude: form.longitude,
                  locationName: form.locationName,
                }}
                onChange={(gps) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: gps.latitude || "",
                    longitude: gps.longitude || "",
                    locationName: gps.locationName || "",
                  }));
                  setGpsError("");
                }}
                error={gpsError}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <h3 className="mb-4 text-sm font-medium text-slate-400">Informasi</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kode</span>
                  <span className="font-mono text-cyan-400">{data.logCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Worker</span>
                  <span className="text-white">{data.worker.name}</span>
                </div>
                {data.assignment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Assignment</span>
                    <span className="text-white">{data.assignment.assignmentCode}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Koordinat Info */}
            {form.latitude && form.longitude && (
              <Card className="border-emerald-400/20 bg-emerald-500/5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <MapPin size={14} />
                  Koordinat Tersimpan
                </h3>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lat:</span>
                    <span className="text-emerald-400">{form.latitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lng:</span>
                    <span className="text-emerald-400">{form.longitude}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Foto Preview */}
            {data.photos.length > 0 && (
              <Card>
                <h3 className="mb-4 text-sm font-medium text-slate-400">
                  Foto Dokumentasi ({data.photos.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {data.photos.slice(0, 6).map((photo) => (
                    <div key={photo.id} className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      <img
                        src={photo.url}
                        alt={photo.caption || ""}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {data.photos.length > 6 && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    +{data.photos.length - 6} foto lainnya
                  </p>
                )}
              </Card>
            )}

            {/* Tips */}
            <Card className="border-amber-400/20 bg-amber-500/5">
              <h3 className="mb-2 text-sm font-medium text-amber-400">💡 Tips</h3>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>• Cari lokasi dengan mengetik nama</li>
                <li>• Gunakan GPS untuk lokasi saat ini</li>
                <li>• Koordinat terisi otomatis</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
          <Link
            href={`/admin/workforce/executions/${data.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:bg-white/[0.07] hover:text-slate-200"
          >
            Batal
          </Link>
          <Button type="submit" loading={saving}>
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
