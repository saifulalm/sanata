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
} from "lucide-react";
import clsx from "clsx";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "completed" | "on_hold";

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-6" />
            <div className="h-3 bg-slate-200 rounded w-full mb-2" />
            <div className="h-2 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded w-48" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <FolderKanban className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        Tidak Ada Proyek
      </h3>
      <p className="text-slate-500 text-center max-w-md mb-6">
        Anda belum memiliki akses ke proyek manapun. Hubungi tim kami untuk
        informasi lebih lanjut.
      </p>
      <Link
        href="/client/contact"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Phone className="w-4 h-4" />
        Hubungi Kami
      </Link>
    </div>
  );
}

function ProjectCard({ access }: { access: ProjectAccess }) {
  const daysLeft = getDaysRemaining(access.project.scheduleEnd);
  const progressColor = getProgressBg(access.project.progress);
  const badge = getStatusBadge(access.project.status);

  return (
    <Link
      href={`/client/project/${access.project.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {access.project.number}
            </span>
            <span
              className={clsx(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                badge.bg,
                badge.text
              )}
            >
              {badge.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {access.project.title}
          </h3>
          {access.project.location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              {access.project.location}
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-900">
            {access.project.progress}%
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all", progressColor)}
            style={{ width: `${access.project.progress}%` }}
          />
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {daysLeft !== null && (
            <div
              className={clsx(
                "flex items-center gap-1",
                daysLeft <= 7 ? "text-amber-600" : ""
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {access.project.completedItems}/{access.project.totalItems}
            </span>
          </div>
        </div>
        <span className="font-medium text-slate-700">
          {formatCurrency(access.project.total, true)}
        </span>
      </div>
    </Link>
  );
}

function ProjectListItem({ access }: { access: ProjectAccess }) {
  const daysLeft = getDaysRemaining(access.project.scheduleEnd);
  const progressColor = getProgressBg(access.project.progress);
  const badge = getStatusBadge(access.project.status);

  return (
    <Link
      href={`/client/project/${access.project.id}`}
      className="group block bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {access.project.number}
            </span>
            <span
              className={clsx(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                badge.bg,
                badge.text
              )}
            >
              {badge.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {access.project.title}
          </h3>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
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
              <span
                className={clsx(
                  "flex items-center gap-1",
                  daysLeft <= 7 ? "text-amber-600" : ""
                )}
              >
                <Clock className="w-3 h-3" />
                {daysLeft === 0
                  ? "Hari ini"
                  : `${daysLeft} hari lagi`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress */}
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-900">
              {access.project.progress}%
            </div>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className={clsx("h-full rounded-full", progressColor)}
                style={{ width: `${access.project.progress}%` }}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-slate-900">
              {formatCurrency(access.project.total, true)}
            </div>
            <div className="text-xs text-slate-500">
              {access.project.billingCount} tagihan
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    // Status filter
    if (statusFilter !== "all") {
      const project = access.project;
      if (statusFilter === "active" && project.status !== "IN_PROGRESS")
        return false;
      if (
        statusFilter === "completed" &&
        project.status !== "COMPLETED" &&
        project.progress < 100
      )
        return false;
      if (statusFilter === "on_hold" && project.status !== "ON_HOLD")
        return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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
  const activeProjects = projects.filter(
    (p) => p.project.status === "IN_PROGRESS"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.project.progress >= 100 || p.project.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Proyek Saya
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {totalProjects} proyek • {activeProjects} aktif •{" "}
          {completedProjects} selesai
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalProjects}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Proyek
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
            <Construction className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeProjects}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Sedang Berjalan
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {completedProjects}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Selesai</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari proyek..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-white dark:bg-slate-600 text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-white dark:bg-slate-600 text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
            )}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            onClick={loadProjects}
            className="p-1.5 hover:bg-red-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton viewMode={viewMode} />}

      {/* Empty State */}
      {!loading && !error && filteredProjects.length === 0 && (
        <EmptyState />
      )}

      {/* Projects Grid/List */}
      {!loading && !error && filteredProjects.length > 0 && (
        <>
          {viewMode === "grid" ? (
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
