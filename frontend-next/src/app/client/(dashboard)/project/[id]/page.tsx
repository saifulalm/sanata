"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProjectDetails,
  getProjectProgress,
  getDailyReports,
  getQCRecords,
  getDocuments,
  type Project,
  type Progress,
  type DailyReport,
  type QCRecord,
} from "@/lib/clientPortalApi";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  FileText,
  Image,
  ClipboardCheck,
  DollarSign,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Ringkasan", icon: BarChart3 },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "reports", label: "Laporan Harian", icon: FileText },
  { id: "qc", label: "QC Records", icon: ClipboardCheck },
  { id: "documents", label: "Dokumen", icon: Image },
];

export default function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [projectData, progressData, reportsData, qcData] = await Promise.all([
        getProjectDetails(id),
        getProjectProgress(id),
        getDailyReports(id, { limit: 10 }),
        getQCRecords(id, { limit: 20 }),
      ]);

      setProject(projectData);
      setProgress(progressData);
      setReports(reportsData.reports);
      setQcRecords(qcData.records);
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Proyek tidak ditemukan</p>
        <Link href="/client/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <Link
        href="/client/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-blue-600">{project.project.number}</span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            {project.project.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.project.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {project.project.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {project.project.location}
            </span>
          )}
          {project.project.scheduleStart && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Mulai: {formatDate(project.project.scheduleStart)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {formatCurrency(project.project.total)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Progress Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900">
                {progress?.currentProgress?.toFixed(1) || 0}%
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${progress?.currentProgress || 0}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Total Item</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.sections.reduce((sum, s) => sum + s.items.length, 0)}
              </p>
              <p className="text-sm text-gray-400 mt-1">Pekerjaan</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">QC Passed</p>
              <p className="text-2xl font-bold text-gray-900">
                {qcRecords.filter((r) => r.result === "PASS").length}
              </p>
              <p className="text-sm text-gray-400 mt-1">dari {qcRecords.length} records</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Laporan Harian</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              <p className="text-sm text-gray-400 mt-1">Hari ini</p>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Kurva S - Rencana vs Realisasi</h3>
            {progress ? (
              <div className="space-y-4">
                <div className="h-64 flex items-end gap-2">
                  {/* Simple bar visualization */}
                  <div className="flex-1 flex items-end gap-1">
                    {(progress.plannedCurve || []).slice(0, 20).map((point, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-200 rounded-t"
                        style={{ height: `${point.planned}%` }}
                        title={`${point.date}: ${point.planned.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex-1 flex items-end gap-1">
                    {(progress.actualCurve || []).slice(0, 20).map((point, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-green-500 rounded-t"
                        style={{ height: `${point.actual}%` }}
                        title={`${point.date}: ${point.actual.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-200 rounded" />
                    Rencana
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded" />
                    Realisasi
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Data progress tidak tersedia</p>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada laporan harian</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(report.date)}
                      </span>
                      {report.weatherAfternoon && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {report.weatherAfternoon}
                        </span>
                      )}
                    </div>
                  </div>
                  {report.activities && (
                    <p className="text-gray-600 mb-3">{report.activities}</p>
                  )}
                  {report.photos.length > 0 && (
                    <div className="flex gap-2">
                      {report.photos.slice(0, 4).map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt={photo.caption || "Foto laporan"}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "qc" && (
          <div className="space-y-4">
            {qcRecords.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada record QC</p>
              </div>
            ) : (
              qcRecords.map((record) => (
                <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-mono text-gray-500">{record.qcCode}</span>
                      <h4 className="font-medium text-gray-900">{record.itemDesc || record.wbsStage}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        record.result === "PASS"
                          ? "bg-green-100 text-green-700"
                          : record.result === "FAIL"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {record.result}
                    </span>
                  </div>
                  {record.criteria && (
                    <p className="text-sm text-gray-500 mb-2">Kriteria: {record.criteria}</p>
                  )}
                  {record.measurement && (
                    <p className="text-sm text-gray-600">Hasil: {record.measurement}</p>
                  )}
                  {record.defectDesc && (
                    <p className="text-sm text-red-600 mt-2">Catatan: {record.defectDesc}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Surat-menyurat</h3>
            {project.billings && project.billings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.billings.map((doc: any) => (
                  <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{doc.number}</p>
                        <p className="text-sm text-gray-500">{doc.status}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Belum ada dokumen</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
