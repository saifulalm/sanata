"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Plus,
  Eye,
  MapPin,
  Calendar,
  Image,
  Clock,
  User,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import {
  getExecutions,
  getWorkers,
  getAssignments,
  type ExecutionLog,
  type Worker,
  type JobAssignment,
} from "@/lib/workforceApi";
import {
  Badge,
  EmptyState,
  Pagination,
  Toast,
  useToast,
} from "@/components/admin/ExtendedUI";
import { TableWrap, Th, Td } from "@/components/admin/ui";

interface ExecutionsListProps {
  initialExecutions: ExecutionLog[];
  initialMeta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function ExecutionsList({ initialExecutions, initialMeta }: ExecutionsListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [executions, setExecutions] = useState(initialExecutions);
  const [meta, setMeta] = useState(initialMeta);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [workers, setWorkers] = useState<Pick<Worker, "id" | "name" | "workerCode">[]>([]);
  const [assignments, setAssignments] = useState<Pick<JobAssignment, "id" | "assignmentCode" | "workItem">[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load workers and assignments on demand
  const loadFilters = async () => {
    if (dataLoaded) return;
    try {
      const [workersRes, assignmentsRes] = await Promise.all([
        getWorkers({ pageSize: 100 }),
        getAssignments({ pageSize: 100 }),
      ]);
      setWorkers(workersRes.data.map(w => ({ id: w.id, name: w.name, workerCode: w.workerCode })));
      setAssignments(assignmentsRes.data.map(a => ({ id: a.id, assignmentCode: a.assignmentCode, workItem: a.workItem })));
      setDataLoaded(true);
    } catch {
      // silent fail
    }
  };

  const fetchExecutions = async (page = 1) => {
    startTransition(async () => {
      try {
        const result = await getExecutions({
          page,
          startDate: dateFilter || undefined,
          endDate: dateFilter || undefined,
          workerId: workerFilter || undefined,
          assignmentId: assignmentFilter || undefined,
        });
        setExecutions(result.data);
        setMeta(result.meta);
      } catch {
        toast("Gagal memuat data execution", "error");
      }
    });
  };

  const handleFilter = () => {
    fetchExecutions(1);
  };

  const clearFilters = () => {
    setDateFilter("");
    setWorkerFilter("");
    setAssignmentFilter("");
    setSearch("");
    fetchExecutions(1);
  };

  const hasActiveFilters = dateFilter || workerFilter || assignmentFilter || search;

  const handlePageChange = (page: number) => {
    fetchExecutions(page);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter executions client-side for search
  const filteredExecutions = search
    ? executions.filter(
        (e) =>
          e.logCode.toLowerCase().includes(search.toLowerCase()) ||
          e.description?.toLowerCase().includes(search.toLowerCase()) ||
          e.worker.name.toLowerCase().includes(search.toLowerCase())
      )
    : executions;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari log code atau deskripsi..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          <button
            onClick={() => {
              setShowFilters(!showFilters);
              if (!showFilters) loadFilters();
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18"
            }`}
          >
            <Filter size={16} />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs text-cyan-300">
                {(dateFilter ? 1 : 0) + (workerFilter ? 1 : 0) + (assignmentFilter ? 1 : 0)}
              </span>
            )}
          </button>

          <Link
            href="/admin/workforce/executions/new"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-400/20"
          >
            <Camera size={16} />
            Log Pekerjaan
          </Link>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1.5 block text-xs text-slate-500">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-xs text-slate-500">Worker</label>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                onClick={loadFilters}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
              >
                <option value="">Semua Worker</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.workerCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-xs text-slate-500">Assignment</label>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                onClick={loadFilters}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
              >
                <option value="">Semua Assignment</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assignmentCode} - {a.workItem.substring(0, 30)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-400/20"
              >
                Terapkan
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 hover:border-white/18 hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid View */}
      {filteredExecutions.length === 0 ? (
        <EmptyState
          icon={<Camera size={24} />}
          title="Belum ada execution log"
          description="Catat pekerjaan hari ini dengan foto dan lokasi GPS."
          action={
            <Link
              href="/admin/workforce/executions/new"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300"
            >
              <Plus size={16} />
              Log Pekerjaan
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExecutions.map((log) => (
              <Link
                key={log.id}
                href={`/admin/workforce/executions/${log.id}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-cyan-500/30 hover:bg-white/[0.06]"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm text-cyan-400">{log.logCode}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(log.logDate)} • {formatTime(log.logDate)}
                    </p>
                  </div>
                  {log.progressPct !== null && (
                    <Badge tone="info">{log.progressPct}%</Badge>
                  )}
                </div>

                {/* Worker & Assignment */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    <span className="text-sm text-white">{log.worker.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera size={14} className="text-slate-500" />
                    <span className="text-sm text-slate-300 line-clamp-1">{log.assignment.workItem}</span>
                  </div>
                </div>

                {/* Description */}
                {log.description && (
                  <p className="mt-3 text-sm text-slate-400 line-clamp-2">{log.description}</p>
                )}

                {/* Location & GPS */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  {log.locationName && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {log.locationName}
                    </div>
                  )}
                  {log.latitude && log.longitude && (
                    <Badge tone="neutral" className="text-[10px]">
                      GPS
                    </Badge>
                  )}
                </div>

                {/* Photos Preview */}
                {log.photos.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-hidden">
                    {log.photos.slice(0, 3).map((photo) => (
                      <div
                        key={photo.id}
                        className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {log.photos.length > 3 && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-slate-500">
                        +{log.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-slate-500">{log.worker.role}</span>
                  <Eye size={14} className="text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              pageSize={meta.pageSize}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
