"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProjectDetails, getProjectProgress, getDailyReports, getQCRecords } from "@/lib/clientPortalApi";
import { ArrowLeft, MapPin, Calendar, TrendingUp, BarChart3, FileText, ClipboardCheck, Image, DollarSign } from "lucide-react";

interface Project {
  access: { canViewProgress: boolean; canViewDailyReports: boolean; canViewQC: boolean; canViewDocuments: boolean; canViewFinancials: boolean };
  project: { id: string; number: string; title: string; clientName: string | null; location: string | null; status: string; scheduleStart: string | null; total: number; taxPct: number };
  sections: Array<{ id: string; name: string; items: any[] }>;
  baseline: { capturedAt: string; name: string } | null;
  billings?: Array<{ id: string; number: string; status: string; periodEnd: string; currentValue: number; taxAmount: number; netAmount: number }>;
}

interface Progress {
  project: { id: string; number: string; title: string; scheduleStart: string | null; status: string; totalAmount: number };
  plannedCurve: Array<{ date: string; planned: number }>;
  actualCurve: Array<{ date: string; actual: number }>;
  currentProgress: number;
}

interface DailyReport {
  id: string; date: string; weatherAfternoon: string | null; activities: string | null; notes: string | null;
  photos: Array<{ id: string; url: string; caption: string | null }>;
}

interface QCRecord {
  id: string; qcCode: string; checkDate: string; wbsStage: string | null; itemDesc: string | null; result: string; defectDesc: string | null; photos: Array<{ id: string; url: string }>;
}

type Tab = "overview" | "progress" | "reports" | "qc" | "documents";

export default function ClientProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<Tab>("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [proj, prog, reps, qcs] = await Promise.all([
        getProjectDetails(id).catch(() => null),
        getProjectProgress(id).catch(() => null),
        getDailyReports(id, { limit: 20 }).catch(() => ({ reports: [] })),
        getQCRecords(id, { limit: 50 }).catch(() => ({ records: [] })),
      ]);
      setProject(proj);
      setProgress(prog);
      setReports(reps.reports || []);
      setQcRecords(qcs.records || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded-xl" /></div>;
  if (!project) return <div className="p-6 text-center text-gray-500">Proyek tidak ditemukan. <Link href="/client/dashboard" className="text-blue-600 hover:underline">Kembali</Link></div>;

  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: "overview", label: "Ringkasan", icon: BarChart3 },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "reports", label: "Laporan Harian", icon: FileText },
    { id: "qc", label: "QC Records", icon: ClipboardCheck },
    { id: "documents", label: "Dokumen", icon: Image },
  ];

  return (
    <div className="p-6">
      <Link href="/client/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />Kembali
      </Link>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-blue-600">{project.project.number}</span>
        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">{project.project.status}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{project.project.title}</h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
        {project.project.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{project.project.location}</span>}
        {project.project.scheduleStart && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(project.project.scheduleStart)}</span>}
        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatCurrency(project.project.total)}</span>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progress?.currentProgress?.toFixed(1) || 0}%</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${progress?.currentProgress || 0}%` }} /></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Total Item</p>
              <p className="text-2xl font-bold text-gray-900">{project.sections.reduce((s, sec) => s + sec.items.length, 0)}</p><p className="text-sm text-gray-400 mt-1">Pekerjaan</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">QC Passed</p>
              <p className="text-2xl font-bold text-gray-900">{qcRecords.filter(r => r.result === "PASS").length}</p><p className="text-sm text-gray-400 mt-1">dari {qcRecords.length} records</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Laporan Harian</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p><p className="text-sm text-gray-400 mt-1">Total laporan</p>
            </div>
          </div>
        )}

        {tab === "progress" && progress && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Kurva S - Rencana vs Realisasi</h3>
            <div className="space-y-4">
              <div className="flex items-end gap-1 h-48">
                <div className="flex-1 flex items-end gap-px">
                  {progress.plannedCurve.slice(0, 26).map((p, i) => (
                    <div key={i} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${p.planned}%` }} title={`${p.date}: ${p.planned.toFixed(1)}%`} />
                  ))}
                </div>
                <div className="flex-1 flex items-end gap-px">
                  {progress.actualCurve.slice(0, 26).map((p, i) => (
                    <div key={i} className="flex-1 bg-green-500 rounded-t" style={{ height: `${p.actual}%` }} title={`${p.date}: ${p.actual.toFixed(1)}%`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-200 rounded" />Rencana</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded" />Realisasi</span>
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Belum ada laporan harian</div>
            ) : reports.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{formatDate(r.date)}</span>
                  {r.weatherAfternoon && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{r.weatherAfternoon}</span>}
                </div>
                {r.activities && <p className="text-gray-600 mb-2">{r.activities}</p>}
                {r.photos?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.photos.slice(0, 4).map(p => (
                      <img key={p.id} src={p.url} alt={p.caption || ""} className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "qc" && (
          <div className="space-y-4">
            {qcRecords.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Belum ada QC records</div>
            ) : qcRecords.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-gray-500">{r.qcCode}</span>
                    <h4 className="font-medium text-gray-900">{r.itemDesc || r.wbsStage}</h4>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${r.result === "PASS" ? "bg-green-100 text-green-700" : r.result === "FAIL" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{r.result}</span>
                </div>
                {r.defectDesc && <p className="text-sm text-red-600 mt-2">{r.defectDesc}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === "documents" && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            {project.billings?.length ? (
              <div className="space-y-4 text-left">
                {project.billings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                    <div className="flex-1"><p className="font-medium text-gray-900">{b.number}</p><p className="text-sm text-gray-500">{b.status}</p></div>
                    <span className="text-sm text-gray-700">{formatCurrency(b.netAmount)}</span>
                  </div>
                ))}
              </div>
            ) : "Tidak ada dokumen"}
          </div>
        )}
      </div>
    </div>
  );
}
