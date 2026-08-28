import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  User,
  Calendar,
  Image,
  Edit,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { Badge, Card, Button } from "@/components/admin/ExtendedUI";
import { getExecution } from "@/lib/workforceApi.server";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Detail Execution - SANTRA",
};

export default async function ExecutionDetailPage({ params }: Props) {
  const { id } = await params;

  let execution;
  try {
    execution = await getExecution(id);
  } catch {
    notFound();
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/executions"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="font-mono text-sm text-cyan-400">{execution.logCode}</p>
            <h1 className="text-xl font-bold text-white">Execution Log</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/workforce/executions/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition-all hover:bg-amber-400/20"
          >
            <Edit size={16} />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Camera size={16} />
              Deskripsi Pekerjaan
            </h3>
            {execution.description ? (
              <p className="text-white leading-relaxed">{execution.description}</p>
            ) : (
              <p className="text-slate-600 italic">Tidak ada deskripsi</p>
            )}
          </Card>

          {/* Photos */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Image size={16} />
              Foto Dokumentasi ({execution.photos.length})
            </h3>
            {execution.photos.length === 0 ? (
              <p className="text-slate-600 italic">Tidak ada foto</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {execution.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-video overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={photo.url}
                      alt={photo.caption || "Execution photo"}
                      className="h-full w-full object-cover"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white line-clamp-1">{photo.caption}</p>
                      </div>
                    )}
                    {photo.location && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">
                        <MapPin size={10} />
                        {photo.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Assignment Info */}
          {execution.assignment && (
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
                <Camera size={16} />
                Assignment
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Kode</span>
                  <span className="font-mono text-sm text-cyan-400">{execution.assignment.assignmentCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Pekerjaan</span>
                  <span className="text-sm text-white text-right max-w-[200px] truncate">{execution.assignment.workItem}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Date & Time */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Calendar size={16} />
              Tanggal & Waktu
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tanggal</p>
                  <p className="font-medium text-white">{formatDate(execution.logDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Waktu</p>
                  <p className="font-medium text-white">{formatTime(execution.logDate)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Worker */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
              <User size={16} />
              Worker
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <User size={24} />
              </div>
              <div>
                <p className="font-medium text-white">{execution.worker.name}</p>
                <p className="text-xs text-slate-500">{execution.worker.role}</p>
                <p className="text-xs text-cyan-400">{execution.worker.workerCode}</p>
              </div>
            </div>
          </Card>

          {/* Location */}
          {(execution.locationName || execution.latitude) && (
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-400">
                <MapPin size={16} />
                Lokasi
              </h3>
              <div className="space-y-3">
                {execution.locationName && (
                  <p className="text-white">{execution.locationName}</p>
                )}
                {(execution.latitude && execution.longitude) && (
                  <div className="rounded-lg bg-white/5 p-3 font-mono text-xs text-slate-500">
                    {execution.latitude}, {execution.longitude}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Progress */}
          {execution.progressPct !== null && (
            <Card>
              <h3 className="mb-4 text-sm font-medium text-slate-400">Progress</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Kemajuan</span>
                    <span className="text-xl font-bold text-cyan-400">{execution.progressPct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      style={{ width: `${execution.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Meta */}
          <Card>
            <h3 className="mb-4 text-sm font-medium text-slate-400">Info</h3>
            <div className="space-y-2 text-xs text-slate-500">
              <p>Dibuat: {formatDate(execution.createdAt)}</p>
              <p>Diperbarui: {formatDate(execution.updatedAt)}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
