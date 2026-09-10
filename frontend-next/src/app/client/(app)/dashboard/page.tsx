"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getMe,
  getProjects,
  getRecentDocuments,
  formatCurrency,
  formatDate,
  getStatusBadge,
  type ProjectAccess,
  type Client,
  type RecentDocument,
} from "@/lib/clientPortal";
import {
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  Target,
  Zap,
  Activity,
  Briefcase,
  Home,
  FolderOpen,
  Download,
  Eye,
  TrendingDown,
  BarChart3,
  PieChart,
  Image,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Types
// ============================================================================

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalProgress: number;
  avgProgress: number;
}

interface TrendData {
  value: number;
  direction: "up" | "down" | "neutral";
  percentage: number;
}

// ============================================================================
// Logo Component
// ============================================================================

function ClientLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <g>
        <path d="M10 8 L22 8 L22 22 L32 22 L32 34 L10 34 Z" fill="url(#dashGrad)" opacity="0.15" />
        <path d="M8 8 L20 8 L20 20 L30 20 L30 34 L8 34 Z" fill="none" stroke="url(#dashGrad)" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="8" y1="14" x2="20" y2="14" stroke="url(#dashGrad)" strokeWidth="1.5" opacity="0.8" />
        <line x1="20" y1="26" x2="30" y2="26" stroke="url(#dashGrad)" strokeWidth="1.5" opacity="0.8" />
      </g>
      <circle cx="24" cy="11" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

// ============================================================================
// Completion Chart Component
// ============================================================================

function CompletionChart({ projects }: { projects: ProjectAccess[] }) {
  const completionData = useMemo(() => {
    const completed = projects.filter(p => p.project.progress >= 100 || p.project.status === "COMPLETED").length;
    const inProgress = projects.filter(p => p.project.progress > 0 && p.project.progress < 100).length;
    const notStarted = projects.filter(p => p.project.progress === 0).length;
    const total = projects.length || 1;
    return {
      completed,
      inProgress,
      notStarted,
      completedPercent: Math.round((completed / total) * 100),
      inProgressPercent: Math.round((inProgress / total) * 100),
      notStartedPercent: Math.round((notStarted / total) * 100),
    };
  }, [projects]);

  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all hover:shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
          <PieChart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tingkat Penyelesaian</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan semua proyek</p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center py-6">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* Background circle */}
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-700" />
            {/* Completed */}
            {completionData.completedPercent > 0 && (
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray={`${completionData.completedPercent} ${100 - completionData.completedPercent}`}
                strokeDashoffset="0"
                className="transition-all duration-500"
              />
            )}
            {/* In Progress */}
            {completionData.inProgressPercent > 0 && (
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray={`${completionData.inProgressPercent} ${100 - completionData.inProgressPercent}`}
                strokeDashoffset={`-${completionData.completedPercent}`}
                className="transition-all duration-500"
              />
            )}
            {/* Not Started */}
            {completionData.notStartedPercent > 0 && (
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeDasharray={`${completionData.notStartedPercent} ${100 - completionData.notStartedPercent}`}
                strokeDashoffset={`-${completionData.completedPercent + completionData.inProgressPercent}`}
                className="transition-all duration-500"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{completionData.completedPercent}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{completionData.completed}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selesai</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{completionData.inProgress}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Berjalan</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{completionData.notStarted}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Belum</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Recent Documents Preview Component
// ============================================================================

function RecentDocumentsPreview({ documents }: { documents: RecentDocument[] }) {
  const getDocIcon = (type: string) => {
    switch (type) {
      case "drawing": return FileText;
      case "report": return BarChart3;
      case "contract": return FolderOpen;
      case "photo": return Image;
      default: return FileText;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case "drawing": return "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
      case "report": return "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400";
      case "contract": return "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400";
      case "photo": return "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400";
    }
  };

  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Dokumen Terbaru</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Dokumen dari semua proyek</p>
          </div>
        </div>
        <Link href="/client/documents" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          Lihat Semua <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Belum ada dokumen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.slice(0, 5).map((doc) => {
            const Icon = getDocIcon(doc.type);
            return (
              <Link
                key={doc.id}
                href={`/client/project/${doc.projectId}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getDocColor(doc.type))}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{doc.projectName} • {formatDate(doc.uploadDate, "short")}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.url} download className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Trend Indicator Component
// ============================================================================

function TrendIndicator({ trend, label }: { trend: TrendData; label: string }) {
  const isPositive = trend.direction === "up";
  const isNeutral = trend.direction === "neutral";

  return (
    <div className="flex items-center gap-2">
      <div className={clsx(
        "flex items-center gap-1 text-sm font-semibold",
        isNeutral ? "text-slate-500" : isPositive ? "text-emerald-600" : "text-red-500"
      )}>
        {isNeutral ? (
          <TrendingUp className="w-4 h-4" />
        ) : isPositive ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
        <span>{Math.abs(trend.percentage)}%</span>
      </div>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Building2;
  trend?: TrendData;
  gradient?: string;
  iconColor?: string;
  showTrend?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, gradient, iconColor = "from-blue-500 to-indigo-500", showTrend = true }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className={clsx(
            "w-14 h-14 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center",
            iconColor
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>

        {trend && showTrend && (
          <div className="mt-4">
            <TrendIndicator trend={trend} label="dari bulan lalu" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Project Card Component
// ============================================================================

interface ProjectCardProps {
  access: ProjectAccess;
  index: number;
}

function ProjectCard({ access, index }: ProjectCardProps) {
  const { project } = access;
  const badge = getStatusBadge(project.status);
  const progressColor = getProgressBg(project.progress);
  const daysLeft = getDaysRemaining(project.scheduleEnd);

  return (
    <Link
      href={`/client/project/${project.id}`}
      className="group block rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200/50 dark:hover:border-blue-700/50 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg">
              {project.number}
            </span>
            <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-lg", badge.bg, badge.text)}>
              {badge.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {project.title}
          </h3>
          {project.location && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500 dark:text-slate-400">Progress</span>
          <span className="font-bold text-slate-900 dark:text-white">{project.progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {daysLeft !== null && (
            <div className={clsx(
              "flex items-center gap-1.5",
              daysLeft <= 7 ? "text-amber-600" : "text-slate-500 dark:text-slate-400"
            )}>
              <Clock className="w-3.5 h-3.5" />
              <span>{daysLeft === 0 ? "Hari ini" : `${daysLeft} hari`}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{project.completedItems}/{project.totalItems}</span>
          </div>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(project.total, true)}
        </span>
      </div>
    </Link>
  );
}

// ============================================================================
// Activity Item Component
// ============================================================================

interface ActivityItemProps {
  icon: typeof Activity;
  title: string;
  description: string;
  time: string;
  color: string;
}

function ActivityItem({ icon: Icon, title, description, time, color }: ActivityItemProps) {
  return (
    <div className="flex gap-4">
      <div className={clsx(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        color
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getProgressBg(percent: number): string {
  if (percent >= 90) return "bg-gradient-to-r from-emerald-500 to-green-500";
  if (percent >= 50) return "bg-gradient-to-r from-blue-500 to-indigo-500";
  if (percent >= 25) return "bg-gradient-to-r from-amber-500 to-orange-500";
  return "bg-gradient-to-r from-slate-400 to-slate-500";
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function ClientDashboard() {
  const [projects, setProjects] = useState<ProjectAccess[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [user, setUser] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [userData, projectData, docsData] = await Promise.all([
        getMe().catch(() => null),
        getProjects().catch(() => []),
        getRecentDocuments(5).catch(() => []),
      ]);
      setUser(userData);
      setProjects(projectData);
      setRecentDocs(docsData);
    } catch {
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Calculate stats
  const stats = useMemo<DashboardStats>(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.project.progress >= 100 || p.project.status === "COMPLETED").length;
    const active = projects.filter(p => p.project.status !== "COMPLETED" && p.project.progress < 100).length;
    const totalProgress = projects.reduce((sum, p) => sum + p.project.progress, 0);
    const avgProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    return {
      totalProjects: total,
      activeProjects: active,
      completedProjects: completed,
      totalBudget: projects.reduce((sum, p) => sum + p.project.total, 0),
      totalProgress,
      avgProgress,
    };
  }, [projects]);

  // Mock activities
  const activities = [
    { icon: Target, title: "Progress Update", description: "Proyek Rukan会所 mencapai 75%", time: "2 jam lalu", color: "bg-emerald-100 text-emerald-600" },
    { icon: FileText, title: "Dokumen Baru", description: "Laporan mingguan berhasil diupload", time: "5 jam lalu", color: "bg-blue-100 text-blue-600" },
    { icon: CheckCircle2, title: "QC Passed", description: "Pekerjaan struktur lantai 2 lulus QC", time: "1 hari lalu", color: "bg-purple-100 text-purple-600" },
    { icon: Users, title: "Tim Baru", description: "2 anggota tim ditambahkan ke proyek", time: "2 hari lalu", color: "bg-amber-100 text-amber-600" },
  ];

  // Mock trends (in real app, this would come from backend)
  const mockTrends: Record<string, TrendData> = {
    projects: { value: 12, direction: "up", percentage: 12 },
    active: { value: 8, direction: "up", percentage: 8 },
    completed: { value: 4, direction: "up", percentage: 20 },
    budget: { value: 5, direction: "up", percentage: 5 },
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl mb-3" />
          <div className="h-5 w-96 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-white/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Projects Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-white/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-6">
          <RefreshCw className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Terjadi Kesalahan</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // Get greeting based on time of day
  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-sm font-medium">Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{getGreeting()}, {user?.name?.split(" ")[0] || "Klien"}! 👋</h1>
            <p className="text-blue-100 max-w-lg">
              Pantau progress proyek konstruksi Anda secara real-time. Lihat detail, unduh dokumen, dan berkomunikasi dengan tim proyek.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/client/projects"
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-colors font-medium"
            >
              <Briefcase className="w-5 h-5" />
              Lihat Semua Proyek
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Proyek"
          value={stats.totalProjects}
          subtitle="proyek aktif"
          icon={Building2}
          trend={mockTrends.projects}
          iconColor="from-blue-500 to-indigo-500"
        />
        <StatCard
          title="Sedang Berjalan"
          value={stats.activeProjects}
          subtitle="proyek dalam progress"
          icon={Activity}
          trend={mockTrends.active}
          iconColor="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Telah Selesai"
          value={stats.completedProjects}
          subtitle="proyek completed"
          icon={CheckCircle2}
          trend={mockTrends.completed}
          iconColor="from-emerald-500 to-green-500"
        />
        <StatCard
          title="Rata-rata Progress"
          value={`${stats.avgProgress}%`}
          subtitle="progress keseluruhan"
          icon={TrendingUp}
          iconColor="from-purple-500 to-pink-500"
          showTrend={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Proyek Terbaru</h2>
            <Link
              href="/client/projects"
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Belum Ada Proyek</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                Proyek Anda akan muncul di sini setelah admin memberikan akses.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((access, index) => (
                <ProjectCard key={access.accessId} access={access} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Completion Chart */}
          <CompletionChart projects={projects} />

          {/* Activity Feed */}
          <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aktivitas Terbaru</h2>
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Aksi Cepat</h3>
                <p className="text-sm text-blue-100">Akses fitur penting</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/client/notifications"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                <Target className="w-4 h-4" />
                Lihat Notifikasi
              </Link>
              <Link
                href="/client/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                Pengaturan Akun
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents Preview */}
      <div className="lg:hidden">
        <RecentDocumentsPreview documents={recentDocs} />
      </div>
    </div>
  );
}
