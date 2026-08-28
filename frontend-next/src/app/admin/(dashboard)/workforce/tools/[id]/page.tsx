import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Package,
  Clock,
  User,
  Calendar,
  ArrowRightLeft,
  History,
  QrCode,
  Printer,
  Wrench,
  MapPin,
  ShieldCheck,
  DollarSign,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { getTool, getLoans, getToolPhotos, getToolUtilization, getToolQrCode } from "@/lib/workforceApi.server";
import { Badge, Card, Button } from "@/components/admin/ExtendedUI";
import { PhotoGallery } from "@/components/admin/PhotoGallery";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import { AssetTagPrint } from "@/components/admin/AssetTagPrint";
import { MaintenanceSchedule } from "@/components/admin/MaintenanceSchedule";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Detail Alat - SANTRA",
};

const CONDITION_CONFIG: Record<string, { label: string; color: "success" | "warning" | "danger" | "neutral" }> = {
  GOOD: { label: "Baik", color: "success" },
  FAIR: { label: "Cukup", color: "warning" },
  DAMAGED: { label: "Rusak", color: "danger" },
  LOST: { label: "Hilang", color: "danger" },
};

const OWNER_CONFIG: Record<string, { label: string; color: "info" | "neutral" }> = {
  COMPANY: { label: "Perusahaan", color: "info" },
  PERSONAL: { label: "Pribadi", color: "neutral" },
  RENTED: { label: "Sewa", color: "neutral" },
};

const LOAN_STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "danger" }> = {
  OPEN: { label: "Dipinjam", color: "warning" },
  RETURNED: { label: "Kembali", color: "success" },
  LOST: { label: "Hilang", color: "danger" },
};

const CATEGORY_LABELS: Record<string, string> = {
  measurement: "Alat Ukur",
  safety: "Keselamatan",
  electrical: "Elektrik",
  plumbing: "Plumbing",
  carpentry: "Pertukangan Kayu",
  masonry: "Pertukangan Batu",
  welding: "Las",
  cutting: "Pemotongan",
  power_tool: "Power Tool",
  hand_tool: "Hand Tool",
  equipment: "Equipment",
  consumable: "Habis Pakai",
  general: "Umum",
};

export default async function ToolDetailPage({ params }: Props) {
  const { id } = await params;

  let tool;
  let loansData;
  let photos: Awaited<ReturnType<typeof getToolPhotos>> = [];
  let utilization;

  try {
    [tool, loansData] = await Promise.all([
      getTool(id),
      getLoans({ toolId: id, pageSize: 5 }),
    ]);

    // Get additional data
    try {
      [photos, utilization] = await Promise.all([
        getToolPhotos(id),
        getToolUtilization(id),
      ]);
    } catch {
      // Optional data, don't fail if not available
    }
  } catch {
    notFound();
  }

  const condition = CONDITION_CONFIG[tool.currentCondition] || { label: "Baik", color: "neutral" as const };
  const owner = OWNER_CONFIG[tool.owner] || { label: "Perusahaan", color: "info" as const };

  const recentLoans = loansData.data;
  const openLoan = recentLoans.find((l: { status: string }) => l.status === "OPEN");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return "-";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const getDaysBorrowed = (issuedAt: string) => {
    return Math.floor((Date.now() - new Date(issuedAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const toolUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/workforce/tools/${id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workforce/tools"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <PageHeader
            eyebrow="SANTRA"
            title={tool.name}
            description={`Kode: ${tool.toolCode}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/workforce/tools/${id}/loan`}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-400/20"
          >
            <ArrowRightLeft size={16} />
            Pinjam
          </Link>
          <Link
            href={`/admin/workforce/tools/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
          >
            <Edit size={16} />
            Edit
          </Link>
        </div>
      </div>

      {/* Current Status Alert */}
      {openLoan && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-medium text-amber-400">Sedang Dipinjam</p>
                <p className="text-sm text-slate-400">
                  Oleh {openLoan.worker.name} selama {getDaysBorrowed(openLoan.issuedAt)} hari
                </p>
              </div>
            </div>
            <Badge tone="warning">
              {getDaysBorrowed(openLoan.issuedAt)} hari
            </Badge>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Foto Alat</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{photos.length} foto</span>
              </div>
            </div>
            <PhotoGallery
              photos={photos}
              toolName={tool.name}
              editable={false}
            />
          </Card>

          {/* Specifications */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Spesifikasi</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kategori</p>
                  <p className="font-medium text-white">{CATEGORY_LABELS[tool.category] || tool.category}</p>
                </div>
              </div>

              {tool.brand && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Merek</p>
                    <p className="font-medium text-white">{tool.brand}</p>
                  </div>
                </div>
              )}

              {tool.model && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Model</p>
                    <p className="font-medium text-white">{tool.model}</p>
                  </div>
                </div>
              )}

              {tool.serialNumber && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Nomor Seri</p>
                    <p className="font-medium text-white font-mono">{tool.serialNumber}</p>
                  </div>
                </div>
              )}

              {tool.currentLocation && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Lokasi</p>
                    <p className="font-medium text-white">{tool.currentLocation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pemilik</p>
                  <p className="font-medium text-white">{owner.label}</p>
                </div>
              </div>

              {tool.purchasePrice && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Harga Beli</p>
                    <p className="font-medium text-white">{formatCurrency(tool.purchasePrice)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Warranty Info */}
            {tool.warrantyExpiry && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-500">Masa Garansi</p>
                <p className="mt-1 text-sm text-white">
                  Berakhir: {new Date(tool.warrantyExpiry).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {new Date(tool.warrantyExpiry) < new Date() && (
                    <Badge tone="danger" className="ml-2">Expired</Badge>
                  )}
                </p>
              </div>
            )}

            {/* Notes */}
            {tool.notes && (
              <div className="mt-4">
                <p className="text-xs text-slate-500">Catatan</p>
                <p className="mt-1 text-sm text-white">{tool.notes}</p>
              </div>
            )}
          </Card>

          {/* Maintenance History */}
          <Card className="p-6">
            <MaintenanceSchedule
              toolId={tool.id}
              toolName={tool.name}
              toolCode={tool.toolCode}
              maintenanceHistory={(tool as any).maintenanceLogs || []}
            />
          </Card>

          {/* Recent Loans */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Riwayat Peminjaman</h3>
              <Link
                href={`/admin/workforce/tools/${id}/loan`}
                className="text-xs text-cyan-400 hover:underline"
              >
                Lihat semua →
              </Link>
            </div>

            {recentLoans.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Belum ada riwayat peminjaman</p>
            ) : (
              <div className="space-y-3">
                {recentLoans.map((loan) => {
                  const status = LOAN_STATUS_CONFIG[loan.status] || { label: loan.status, color: "warning" as const };
                  const days = loan.returnedAt
                    ? Math.floor((new Date(loan.returnedAt).getTime() - new Date(loan.issuedAt).getTime()) / (1000 * 60 * 60 * 24))
                    : getDaysBorrowed(loan.issuedAt);

                  return (
                    <div key={loan.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      loan.status === "OPEN" ? "border-amber-500/30 bg-amber-500/5" : "border-white/10"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          loan.status === "OPEN"
                            ? "bg-amber-500/10 text-amber-400"
                            : loan.status === "RETURNED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{loan.worker.name}</p>
                          <p className="text-xs text-slate-500">{loan.worker.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge tone={status.color}>{status.label}</Badge>
                        <p className="mt-1 text-xs text-slate-500">{days} hari</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - QR, Stats, Actions */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">QR Code</h3>
            <div className="flex flex-col items-center">
              <QRCodeDisplay
                toolId={tool.id}
                toolCode={tool.toolCode}
                toolName={tool.name}
                apiUrl={apiUrl}
                size={180}
              />
            </div>
          </Card>

          {/* Asset Tag Print */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Label Asset</h3>
            <AssetTagPrint
              tool={{
                toolCode: tool.toolCode,
                name: tool.name,
                category: CATEGORY_LABELS[tool.category] || tool.category,
                brand: tool.brand,
                model: tool.model,
                serialNumber: tool.serialNumber,
                currentLocation: tool.currentLocation,
                currentCondition: tool.currentCondition,
                purchaseDate: tool.purchaseDate,
              }}
              toolUrl={toolUrl}
              compact={false}
            />
          </Card>

          {/* Utilization Stats */}
          {utilization && (
            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Statistik Penggunaan</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total Peminjaman</span>
                  <span className="font-medium text-white">{utilization.totalLoans}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Rata-rata Durasi</span>
                  <span className="font-medium text-white">{utilization.averageLoanDuration} hari</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Tingkat Penggunaan</span>
                  <span className="font-medium text-white">{utilization.utilizationRate}%</span>
                </div>
                {utilization.mostBorrowedBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Peminjam Terbanyak</span>
                    <span className="font-medium text-white">{utilization.mostBorrowedBy.workerName}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${utilization.utilizationRate}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tingkat penggunaan dalam 30 hari terakhir
                </p>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Aksi Cepat</h3>
            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/workforce/tools/${id}/loan`}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-400/20"
              >
                <ArrowRightLeft size={16} />
                {openLoan ? "Lihat Peminjaman" : "Catat Peminjaman"}
              </Link>
              <Link
                href={`/admin/workforce/tools/${id}/edit`}
                className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
              >
                <Edit size={16} />
                Edit Alat
              </Link>
              <Link
                href="/admin/workforce/loans"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:border-white/18 hover:text-white"
              >
                <History size={16} />
                Semua Peminjaman
              </Link>
            </div>
          </Card>

          {/* Timestamps */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Informasi</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Dibuat</span>
                <span className="text-xs text-white">
                  {new Date(tool.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Diperbarui</span>
                <span className="text-xs text-white">
                  {new Date(tool.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
