"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getProjects,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getProgressBg,
  type ProjectAccess,
} from "@/lib/clientPortal";
import {
  FolderKanban,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Grid3X3,
  List,
  Construction,
  Phone,
  X,
  Building2,
} from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Types
// ============================================================================

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "completed" | "on_hold";

interface FilterState {
  status: StatusFilter;
  search: string;
  viewMode: ViewMode;
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

// ============================================================================
// Logo Component
// ============================================================================

function ClientLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="projGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <g>
        <path d="M10 8 L22 8 L22 22 L32 22 L32 34 L10 34 Z" fill="url(#projGrad)" opacity="0.15" />
        <path d="M8 8 L20 8 L20 20 L30 20 L30 34 L8 34 Z" fill="none" stroke="url(#projGrad)" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="8" y1="14" x2="20" y2="14" stroke="url(#projGrad)" strokeWidth="1.5" opacity="0.8" />
        <line x1="20" y1="26" x2="30" y2="26" stroke="url(#projGrad)" strokeWidth="1.5" opacity="0.8" />
      </g>
      <circle cx="24" cy="11" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 p-5">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-600 rounded mb-4" />
              <div className="h-2 bg-slate-100 dark:bg-slate-600 rounded-full mb-4" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-600 rounded mb-2" />
              <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-600 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center">
          <FolderKanban className="w-12 h-12 text-blue-500" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Tidak Ada Proyek
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
        Anda belum memiliki akses ke proyek manapun. Hubungi tim kami untuk informasi lebih lanjut.
      </p>
      <Link
        href="/client/contact"
        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
      >
        <Phone className="w-4 h-4" />
        Hubungi Kami
      </Link>
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof Building2;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 p-4 transition-all hover:shadow-md">
      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Project Card (Grid View)
// ============================================================================

function ProjectCard({ access }: { access: ProjectAccess }) {
  const daysLeft = getDaysRemaining(access.project.scheduleEnd);
  const progressColor = getProgressBg(access.project.progress);
  const badge = getStatusBadge(access.project.status);

  return (
    <Link
      href={`/client/project/${access.project.id}`}
      className="group block rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200/50 dark:hover:border-blue-700/50 hover:-translate-y-1"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg">
              {access.project.number}
            </span>
            <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-lg", badge.bg, badge.text)}>
              {badge.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {access.project.title}
          </h3>
          {access.project.location && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{access.project.location}</span>
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
          <span className="font-bold text-slate-900 dark:text-white">{access.project.progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${access.project.progress}%` }}
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
            <span>{access.project.completedItems}/{access.project.totalItems}</span>
          </div>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(access.project.total, true)}
        </span>
      </div>
    </Link>
  );
}

// ============================================================================
// Project List Item (List View)
// ============================================================================

function ProjectListItem({ access }: { access: ProjectAccess }) {
  const daysLeft = getDaysRemaining(access.project.scheduleEnd);
  const progressColor = getProgressBg(access.project.progress);
  const badge = getStatusBadge(access.project.status);

  return (
    <Link
      href={`/client/project/${access.project.id}`}
      className="group flex items-center gap-6 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-700/50"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg">
            {access.project.number}
          </span>
          <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-lg", badge.bg, badge.text)}>
            {badge.label}
          </span>
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {access.project.title}
        </h3>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
          {access.project.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {access.project.location}
            </span>
          )}
          {access.project.scheduleStart && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(access.project.scheduleStart, "short")}
            </span>
          )}
          {daysLeft !== null && (
            <span className={clsx(
              "flex items-center gap-1",
              daysLeft <= 7 ? "text-amber-600" : ""
            )}>
              <Clock className="w-3 h-3" />
              {daysLeft === 0 ? "Hari ini" : `${daysLeft} hari`}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="text-right hidden sm:block">
        <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          {access.project.progress}%
        </div>
        <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all", progressColor)}
            style={{ width: `${access.project.progress}%` }}
          />
        </div>
      </div>

      {/* Budget */}
      <div className="text-right hidden md:block">
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          {formatCurrency(access.project.total, true)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {access.project.billingCount} tagihan
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ============================================================================
// Main Projects Page
// ============================================================================

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    search: "",
    viewMode: "grid",
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      setError("Gagal memuat proyek");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter projects
  const filteredProjects = projects.filter((access) => {
    if (filters.status !== "all") {
      const project = access.project;
      if (filters.status === "active" && project.status !== "IN_PROGRESS") return false;
      if (filters.status === "completed" && project.status !== "COMPLETED" && project.progress < 100) return false;
      if (filters.status === "on_hold" && project.status !== "ON_HOLD") return false;
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      return (
        access.project.title.toLowerCase().includes(query) ||
        access.project.number.toLowerCase().includes(query) ||
        access.project.location?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.project.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter(p => p.project.progress >= 100 || p.project.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Proyek</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Proyek Saya
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {totalProjects} proyek • {activeProjects} aktif • {completedProjects} selesai
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Proyek"
          value={totalProjects}
          icon={FolderKanban}
          color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <StatCard
          label="Sedang Berjalan"
          value={activeProjects}
          icon={Construction}
          color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
        <StatCard
          label="Selesai"
          value={completedProjects}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Cari proyek..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors backdrop-blur-sm"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as StatusFilter })}
            className="px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none backdrop-blur-sm"
          >
            <option value="all">Semua Status</option>
            <option value="active">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1.5 bg-white/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setFilters({ ...filters, viewMode: "grid" })}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              filters.viewMode === "grid"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setFilters({ ...filters, viewMode: "list" })}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              filters.viewMode === "list"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={loadProjects} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton viewMode={filters.viewMode} />}

      {/* Empty State */}
      {!loading && !error && filteredProjects.length === 0 && (
        <EmptyState />
      )}

      {/* Projects Grid/List */}
      {!loading && !error && filteredProjects.length > 0 && (
        <>
          {filters.viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((access) => (
                <ProjectCard key={access.accessId} access={access} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((access) => (
                <ProjectListItem key={access.accessId} access={access} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Results count */}
      {!loading && filteredProjects.length > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Menampilkan {filteredProjects.length} dari {totalProjects} proyek
        </p>
      )}
    </div>
  );
}
