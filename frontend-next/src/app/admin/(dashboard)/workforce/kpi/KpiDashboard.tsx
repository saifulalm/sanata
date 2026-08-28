"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Trophy,
  Medal,
  Calendar,
  User,
  Save,
  Trash2,
} from "lucide-react";
import {
  getKpis,
  getKpiLeaderboard,
  getKpiPeriods,
  getAvailableWorkers,
  upsertKpi,
  deleteKpi,
  type KpiRecord,
} from "@/lib/workforceApi";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Pagination,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";
import { TableWrap, Th, Td } from "@/components/admin/ui";

interface KpiDashboardProps {
  initialKpis: KpiRecord[];
  initialLeaderboard: KpiRecord[];
  initialPeriods: { value: string; label: string; start: string; end: string }[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface KpiFormData {
  workerId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  qualityScore: number | null;
  productivityScore: number | null;
  attendanceScore: number | null;
  safetyScore: number | null;
  reworkCount: number;
  defectCount: number;
  completedTasks: number;
  lateDays: number;
  notes: string;
}

const initialFormData: KpiFormData = {
  workerId: "",
  period: "",
  periodStart: "",
  periodEnd: "",
  qualityScore: null,
  productivityScore: null,
  attendanceScore: null,
  safetyScore: null,
  reworkCount: 0,
  defectCount: 0,
  completedTasks: 0,
  lateDays: 0,
  notes: "",
};

export function KpiDashboard({ initialKpis, initialLeaderboard, initialPeriods, initialMeta }: KpiDashboardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [kpis, setKpis] = useState(initialKpis);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [meta, setMeta] = useState(initialMeta);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriods[0]?.value || "");
  const [createDialog, setCreateDialog] = useState(false);
  const [workers, setWorkers] = useState<Array<{ id: string; name: string; workerCode: string; role: string }>>([]);
  const [formData, setFormData] = useState<KpiFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkers = async () => {
    try {
      console.log("fetchWorkers: calling API...");
      const available = await getAvailableWorkers();
      console.log("fetchWorkers: got", available.length, "workers");
      setWorkers(available.map((w) => ({ id: w.id, name: w.name, workerCode: w.workerCode, role: w.role })));
    } catch (err) {
      console.error("fetchWorkers error:", err);
      toast("Gagal memuat daftar pekerja", "error");
    }
  };

  const fetchKpis = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getKpis({
          page,
          period: selectedPeriod || undefined,
        });
        setKpis(result.data);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data KPI", "error");
      }
    });
  };

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    try {
      const [kpisResult, leaderboardResult] = await Promise.all([
        getKpis({ period: period || undefined }),
        getKpiLeaderboard(period || undefined),
      ]);
      setKpis(kpisResult.data);
      setMeta(kpisResult.meta);
      setLeaderboard(leaderboardResult);
    } catch {
      toast("Gagal memuat data KPI", "error");
    }
  };

  const handlePageChange = (page: number) => {
    fetchKpis(page);
  };

  const handleOpenCreateDialog = () => {
    setFormData(initialFormData);
    fetchWorkers();
    // Set default period to current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const period = `${year}-${month}`;
    const periodObj = initialPeriods.find((p) => p.value === period);

    setFormData((prev) => ({
      ...prev,
      period,
      periodStart: periodObj?.start || `${year}-${month}-01`,
      periodEnd: periodObj?.end || `${year}-${month}-28`,
    }));
    setCreateDialog(true);
  };

  const handlePeriodSelectChange = (periodValue: string) => {
    const periodObj = initialPeriods.find((p) => p.value === periodValue);
    setFormData((prev) => ({
      ...prev,
      period: periodValue,
      periodStart: periodObj?.start || "",
      periodEnd: periodObj?.end || "",
    }));
  };

  const handleScoreChange = (field: keyof KpiFormData, value: string) => {
    const numValue = value === "" ? null : Math.min(100, Math.max(0, parseInt(value) || 0));
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleCountChange = (field: keyof KpiFormData, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = async () => {
    if (!formData.workerId) {
      toast("Pilih worker terlebih dahulu", "error");
      return;
    }
    if (!formData.period) {
      toast("Pilih periode terlebih dahulu", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertKpi({
        workerId: formData.workerId,
        period: formData.period,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        qualityScore: formData.qualityScore ?? undefined,
        productivityScore: formData.productivityScore ?? undefined,
        attendanceScore: formData.attendanceScore ?? undefined,
        safetyScore: formData.safetyScore ?? undefined,
        reworkCount: formData.reworkCount,
        defectCount: formData.defectCount,
        completedTasks: formData.completedTasks,
        lateDays: formData.lateDays,
        notes: formData.notes || undefined,
      });
      toast("KPI berhasil disimpan", "success");
      setCreateDialog(false);
      fetchKpis();
    } catch {
      toast("Gagal menyimpan KPI", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus KPI ini?")) return;
    try {
      await deleteKpi(id);
      toast("KPI berhasil dihapus", "success");
      fetchKpis();
    } catch {
      toast("Gagal menghapus KPI", "error");
    }
  };

  const formatScore = (score: number | null) => {
    if (score === null) return "—";
    return `${score}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} className="text-amber-400" />;
      case 2:
        return <Medal size={20} className="text-slate-300" />;
      case 3:
        return <Medal size={20} className="text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-slate-400">#{rank}</span>;
    }
  };

  const calculateOverall = (kpi: KpiRecord) => {
    const scores = [
      kpi.qualityScore,
      kpi.productivityScore,
      kpi.attendanceScore,
      kpi.safetyScore,
    ].filter((s): s is number => s !== null);

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
          >
            <option value="">Semua Periode</option>
            {initialPeriods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreateDialog}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
        >
          <Plus size={16} />
          Input KPI
        </button>
      </div>

      {/* Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leaderboard Panel */}
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada data ranking</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((kpi, index) => (
                <div
                  key={kpi.id}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">{kpi.worker.name}</p>
                    <p className="text-xs text-slate-500">{kpi.worker.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">{formatScore(kpi.overallScore)}</p>
                    {kpi.worker.grade && (
                      <Badge tone="info" className="text-xs">Grade {kpi.worker.grade}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* KPI Table */}
        <div className="lg:col-span-2">
          {kpis.length === 0 ? (
            <EmptyState
              icon={<Star size={24} />}
              title="Belum ada data KPI"
              description="Input KPI worker untuk periode ini."
              action={
                <button
                  onClick={handleOpenCreateDialog}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
                >
                  <Plus size={16} />
                  Input KPI
                </button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Quality</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Productivity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Attendance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Safety</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Overall</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Rework</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Tasks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Late</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((kpi) => (
                      <tr key={kpi.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-white">{kpi.worker.name}</p>
                            <p className="text-xs text-slate-500">{kpi.worker.workerCode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {kpi.qualityScore !== null && (
                              kpi.qualityScore >= 80 ? (
                                <TrendingUp size={14} className="text-emerald-400" />
                              ) : kpi.qualityScore < 60 ? (
                                <TrendingDown size={14} className="text-rose-400" />
                              ) : null
                            )}
                            <span className="text-sm text-white">{formatScore(kpi.qualityScore)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">{formatScore(kpi.productivityScore)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">{formatScore(kpi.attendanceScore)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">{formatScore(kpi.safetyScore)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={calculateOverall(kpi)! >= 80 ? "success" : calculateOverall(kpi)! >= 60 ? "warning" : "danger"}>
                            {formatScore(calculateOverall(kpi))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-amber-400">{kpi.reworkCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">{kpi.completedTasks}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-rose-400">{kpi.lateDays}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(kpi.id)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    page={meta.page}
                    pageSize={meta.pageSize}
                    total={meta.total}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create KPI Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        title="Input KPI Worker"
        description="Catat KPI untuk periode yang dipilih."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
              <Save size={16} />
              Simpan
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Worker Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Worker</label>
            <select
              value={formData.workerId}
              onChange={(e) => setFormData((prev) => ({ ...prev, workerId: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            >
              <option value="">Pilih Worker</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.workerCode})
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Periode</label>
            <select
              value={formData.period}
              onChange={(e) => handlePeriodSelectChange(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            >
              <option value="">Pilih Periode</option>
              {initialPeriods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Score Inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Quality Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.qualityScore ?? ""}
                onChange={(e) => handleScoreChange("qualityScore", e.target.value)}
                placeholder="0-100"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Productivity Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.productivityScore ?? ""}
                onChange={(e) => handleScoreChange("productivityScore", e.target.value)}
                placeholder="0-100"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Attendance Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.attendanceScore ?? ""}
                onChange={(e) => handleScoreChange("attendanceScore", e.target.value)}
                placeholder="0-100"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Safety Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.safetyScore ?? ""}
                onChange={(e) => handleScoreChange("safetyScore", e.target.value)}
                placeholder="0-100"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Count Inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Rework Count</label>
              <input
                type="number"
                min="0"
                value={formData.reworkCount}
                onChange={(e) => handleCountChange("reworkCount", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Defect Count</label>
              <input
                type="number"
                min="0"
                value={formData.defectCount}
                onChange={(e) => handleCountChange("defectCount", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Completed Tasks</label>
              <input
                type="number"
                min="0"
                value={formData.completedTasks}
                onChange={(e) => handleCountChange("completedTasks", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Late Days</label>
              <input
                type="number"
                min="0"
                value={formData.lateDays}
                onChange={(e) => handleCountChange("lateDays", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Catatan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none resize-none"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
