"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Share2,
  Printer,
  Download,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  Image,
  File,
  FileCheck,
  FolderOpen,
  Camera,
  TrendingUp,
  Users,
  Building2,
  X,
  MessageSquare,
  Send,
  Upload,
  AlertTriangle,
  Check,
  Star,
  BarChart3,
  PieChart,
  Target,
  Wrench,
  Truck,
  HardHat,
  Shield,
  Thermometer,
  CloudRain,
  Cloud,
  Sun,
  ExternalLink,
  Filter,
  Grid3X3,
  List,
  Eye,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  getProject,
  getProgress,
  getDailyReports,
  getQCRecords,
  getDocuments,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getProgressBg,
  type Project,
  type Progress,
  type DailyReport,
  type QCRecord,
} from "@/lib/clientPortal";

// ============================================================================
// Types
// ============================================================================

type TabId = "overview" | "progress" | "documents" | "team" | "updates";

interface ProjectWithDates {
  id: string;
  number: string;
  title: string;
  clientName?: string;
  location?: string;
  status: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  taxPct: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  type: "drawing" | "contract" | "report" | "photo";
  category: string;
  size: string;
  uploadDate: string;
  url: string;
}

interface ProjectUpdate {
  id: string;
  type: "progress" | "document" | "photo" | "milestone" | "comment" | "status";
  title: string;
  description: string;
  timestamp: string;
  photos?: { id: string; url: string; caption?: string }[];
  author?: string;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  progress: number;
  status: "complete" | "in_progress" | "upcoming" | "pending";
}

interface PhaseProgress {
  phaseName: string;
  progress: number;
  startDate: string;
  endDate: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function getWeatherIcon(weather?: string | null): typeof Cloud | typeof Sun | typeof CloudRain | null {
  if (!weather) return null;
  const w = weather.toLowerCase();
  if (w.includes("rain") || w.includes("glurar")) return CloudRain;
  if (w.includes("cloud") || w.includes("menang")) return Cloud;
  return Sun;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  return formatDate(dateStr, "short");
}

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getDocumentIcon(type: string) {
  switch (type) {
    case "drawing": return FileText;
    case "contract": return FolderOpen;
    case "report": return BarChart3;
    case "photo": return Camera;
    default: return File;
  }
}

function getUpdateIcon(type: string) {
  switch (type) {
    case "progress": return TrendingUp;
    case "document": return FileText;
    case "photo": return Image;
    case "milestone": return Target;
    case "comment": return MessageSquare;
    case "status": return CheckCircle2;
    default: return AlertCircle;
  }
}

function getUpdateColor(type: string): string {
  switch (type) {
    case "progress": return "text-emerald-600";
    case "document": return "text-blue-600";
    case "photo": return "text-pink-600";
    case "milestone": return "text-indigo-600";
    case "comment": return "text-cyan-600";
    case "status": return "text-amber-600";
    default: return "text-slate-600";
  }
}

function getUpdateBg(type: string): string {
  switch (type) {
    case "progress": return "bg-emerald-100";
    case "document": return "bg-blue-100";
    case "photo": return "bg-pink-100";
    case "milestone": return "bg-indigo-100";
    case "comment": return "bg-cyan-100";
    case "status": return "bg-amber-100";
    default: return "bg-slate-100";
  }
}

// ============================================================================
// Loading Skeletons
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-800 rounded-2xl p-6 md:p-8 text-white">
        <div className="pl-6 px-8 pt-6">
          <div className="h-8 w-96 mb-4 bg-white/20 rounded-lg">
            <p className="font-bold text-2xl text-white">[project]</p>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl p-5 shadow-sm">
            <div className="h-4 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-36 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonRing(props: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${props.className}`} />;
}

// ============================================================================
// Error Boundary
// ============================================================================

class ErrorBoundary extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorBoundary";
  }
}

function ErrorState(props: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Terjadi Kesalahan</h3>
      <p className="text-slate-500 text-center mb-6 max-w-md">
        Gagal memuat data proyek. Silakan coba lagi nanti.
      </p>
      <button
        onClick={props.onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Coba Lagi
      </button>
    </div>
  );
}

// ============================================================================
// Circular Progress Component
// ============================================================================

function CircularProgress(props: { percent: number; width?: number; height?: number }) {
  const size = props.width || 128;
  const strokeWidth = props.height || Math.max(size * 0.1, 8);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashArray = circumference * ((props.percent || 0) / 100);
  const center = (size + 6) / 2;

  return (
    <div className="relative" style={{ width: size + 6, height: size + 6 }}>
      <svg width={size + 6} height={size + 6} viewBox={`0 0 ${size + 6} ${size + 6}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashArray} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-bold text-2xl text-slate-900">
          {Math.round(props.percent || 0)}%
        </p>
      </div>
    </div>
  );
}

function StatusBadge(props: { status: string }) {
  const badge = getStatusBadge(props.status);

  return (
    <span className={clsx("px-2 py-1 rounded-full text-xs font-medium", badge.bg, badge.text)}>
      {badge.label}
    </span>
  );
}

function TabButton(props: { id: TabId; label: string; icon: typeof AlertCircle; active: boolean; onClick: () => void }) {
  const Icon = props.icon;
  return (
    <button
      onClick={props.onClick}
      className={clsx("flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2",
        props.active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300",
        "transition-colors")}
    >
      <Icon className={clsx("w-4 h-4", props.active ? "text-blue-600" : "text-slate-400")} />
      <span>{props.label}</span>
    </button>
  );
}



// ============================================================================
// Hero Section
// ============================================================================

function HeroSection(props: {
  project: ProjectWithDates;
  progress: number;
  onShare: () => void;
  onPrint: () => void;
}) {
  const daysLeft = getDaysRemaining(props.project.scheduleEnd);
  const badge = getStatusBadge(props.project.status);

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white mb-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>

      <div className="relative">
        {/* Back Navigation */}
        <Link href="/client" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={props.onShare}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            title="Bagikan"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={props.onPrint}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            title="Cetak"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            title="Unduh Laporan"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Project Info */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-200">{props.project.number}</span>
              <span className={clsx("px-2 py-0.5 text-xs bg-white/20 rounded-full font-medium", badge.bg.replace("bg-", "text-"), badge.text.replace("bg-", "text-"))}>
                {badge.label}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{props.project.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
              {props.project.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {props.project.location}
                </span>
              )}
              {props.project.scheduleStart && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(props.project.scheduleStart)}
                </span>
              )}
              {daysLeft !== null && (
                <span className={clsx("flex items-center gap-1.5", daysLeft <= 7 ? "text-amber-300" : "")}>
                  <Clock className="w-4 h-4" />
                  {daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}
                </span>
              )}
              {props.project.total > 0 && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(props.project.total)}
                </span>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex-shrink-0">
            <CircularProgress percent={props.progress} width={140} />
            <p className="text-center text-sm text-blue-200 mt-2">Progress</p>
          </div>
        </div>
      </div>
    </header>
  );
}



// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab(props: {
  project: Project;
  progress: Progress | null;
  milestones: Milestone[];
}) {
  const { project: proj } = props.project;

  // Calculate budget breakdown
  const subtotal = proj.subtotal || 0;
  const discount = proj.discountAmount || 0;
  const tax = proj.taxAmount || 0;
  const total = proj.total || 0;

  const budgetData = [
    { label: "Subtotal", value: subtotal, color: "bg-blue-500", percent: subtotal > 0 ? (subtotal / total) * 100 : 0 },
    { label: "Diskon", value: discount, color: "bg-emerald-500", percent: discount > 0 ? (discount / total) * 100 : 0 },
    { label: "Pajak", value: tax, color: "bg-amber-500", percent: tax > 0 ? (tax / total) * 100 : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Item</p>
          <p className="text-2xl font-bold">{props.project.sections.reduce((s, sec) => s + sec.items.length, 0)}</p>
          <p className="text-xs text-slate-400 mt-1">Pekerjaan</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">QC Passed</p>
          <p className="text-2xl font-bold text-emerald-600">
            {props.progress ? Math.round(props.progress.currentProgress) : 0}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Tanggal Mulai</p>
          <p className="text-lg font-bold">{proj.scheduleStart ? formatDate(proj.scheduleStart) : "-"}</p>
          <p className="text-xs text-slate-400 mt-1">Mulai Proyek</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Tanggal Selesai</p>
          <p className="text-lg font-bold">{proj.scheduleEnd ? formatDate(proj.scheduleEnd) : "-"}</p>
          <p className="text-xs text-slate-400 mt-1">Target Selesai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Milestone Utama</h3>
              <p className="text-sm text-slate-500">Pencapaian penting proyek</p>
            </div>
          </div>

          <div className="space-y-4">
            {props.milestones.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Belum ada milestone</p>
              </div>
            ) : (
              props.milestones.map((milestone, index) => {
                const Icon = milestone.status === "complete" ? CheckCircle2 :
                            milestone.status === "in_progress" ? Clock : AlertCircle;
                const color = milestone.status === "complete" ? "text-emerald-500" :
                             milestone.status === "in_progress" ? "text-blue-500" : "text-slate-400";

                return (
                  <div key={milestone.id} className="relative flex gap-4">
                    {index < props.milestones.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200" />
                    )}
                    <div className={clsx("relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0", milestone.status === "complete" ? "bg-emerald-100" : milestone.status === "in_progress" ? "bg-blue-100" : "bg-slate-100")}>
                      <Icon className={clsx("w-5 h-5", color)} />
                    </div>
                    <div className="flex-1 pb-6 min-w-0">
                      <h4 className="font-medium text-slate-900">{milestone.name}</h4>
                      <p className="text-sm text-slate-500">{formatDate(milestone.date)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all", milestone.status === "complete" ? "bg-emerald-500" : "bg-blue-500")}
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{milestone.progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Rincian Budget</h3>
              <p className="text-sm text-slate-500">Breakdown biaya proyek</p>
            </div>
          </div>

          {/* Pie Chart Placeholder */}
          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {budgetData.reduce((acc, item, index) => {
                  const offset = acc.offset;
                  acc.elements.push(
                    <circle
                      key={index}
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth="4"
                      strokeDasharray={`${item.percent} ${100 - item.percent}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  acc.offset += item.percent;
                  return acc;
                }, { elements: [] as React.ReactElement[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold">{formatCurrency(total)}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {budgetData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx("w-3 h-3 rounded-full", item.color)} />
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Map Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Lokasi Proyek</h3>
            <p className="text-sm text-slate-500">{proj.location || "Lokasi tidak tersedia"}</p>
          </div>
        </div>
        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">Peta lokasi akan ditampilkan di sini</p>
          </div>
        </div>
      </div>
    </div>
  );
}



// ============================================================================
// Progress Tab
// ============================================================================

function ProgressTab(props: {
  project: Project;
  progress: Progress | null;
  phases: PhaseProgress[];
}) {
  const { project: proj } = props.project;

  // Generate Gantt-style data
  const ganttData = useMemo(() => {
    const items = props.project.sections.flatMap(section =>
      section.items.map((item, idx) => ({
        id: item.id,
        name: item.description,
        section: section.name,
        startOffset: item.startOffsetDays,
        duration: item.durationDays,
        progress: Math.min(100, Math.max(0, Math.random() * 100)), // Mock progress
      }))
    ).slice(0, 15); // Limit to 15 items for display

    const maxDuration = Math.max(...items.map(i => i.startOffset + i.duration));
    return { items, maxDuration };
  }, [props.project]);

  return (
    <div className="space-y-6">
      {/* S-Curve Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Kurva S - Rencana vs Realisasi</h3>
        <div className="h-64 flex items-end gap-1">
          <div className="flex-1 flex items-end gap-px">
            {(props.progress?.plannedCurve || Array(26).fill({ planned: 0 })).slice(0, 26).map((p, i) => (
              <div
                key={`plan-${i}`}
                className="flex-1 bg-blue-200 rounded-t transition-all hover:bg-blue-300"
                style={{ height: `${p.planned}%` }}
                title={`Rencana: ${p.date} - ${p.planned.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex-1 flex items-end gap-px">
            {(props.progress?.actualCurve || Array(26).fill({ actual: 0 })).slice(0, 26).map((p, i) => (
              <div
                key={`actual-${i}`}
                className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all hover:from-emerald-600 hover:to-emerald-500"
                style={{ height: `${p.actual}%` }}
                title={`Realisasi: ${p.date} - ${p.actual.toFixed(1)}%`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-200 rounded" />Rencana
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded" />Realisasi
          </span>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Progress per Fase</h3>
        <div className="space-y-4">
          {props.phases.length === 0 ? (
            props.project.sections.map((section, idx) => {
              const completedItems = Math.round(section.items.length * (idx === 0 ? 0.8 : idx === 1 ? 0.5 : idx === 2 ? 0.2 : 0));
              const progress = section.items.length > 0 ? (completedItems / section.items.length) * 100 : 0;
              return (
                <div key={section.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{section.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", getProgressBg(progress))}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{completedItems} dari {section.items.length} item selesai</p>
                </div>
              );
            })
          ) : (
            props.phases.map((phase, idx) => {
              const bgColor = phase.progress >= 90 ? "bg-emerald-500" : phase.progress >= 50 ? "bg-blue-500" : "bg-amber-500";
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{phase.phaseName}</span>
                    <span className="text-sm font-semibold text-slate-900">{Math.round(phase.progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", bgColor)}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Gantt-style Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="font-semibold text-slate-900 mb-4">Timeline Pekerjaan</h3>
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="flex border-b border-slate-200 pb-2 mb-4">
            <div className="w-1/3 font-medium text-sm text-slate-600">Pekerjaan</div>
            <div className="w-1/6 font-medium text-sm text-slate-600 text-center">Start</div>
            <div className="w-1/6 font-medium text-sm text-slate-600 text-center">Durasi</div>
            <div className="w-1/3 font-medium text-sm text-slate-600">Progress</div>
          </div>
          {/* Items */}
          <div className="space-y-3">
            {ganttData.items.map((item) => (
              <div key={item.id} className="flex items-center">
                <div className="w-1/3 min-w-0 pr-4">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.section}</p>
                </div>
                <div className="w-1/6 text-center">
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">Hari {item.startOffset}</span>
                </div>
                <div className="w-1/6 text-center">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{item.duration} hari</span>
                </div>
                <div className="w-1/3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", getProgressBg(item.progress))}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



// ============================================================================
// Documents Tab
// ============================================================================

function DocumentsTab(props: { documents: ProjectDocument[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = [
    { id: null, label: "Semua" },
    { id: "drawing", label: "Gambar Kerja" },
    { id: "contract", label: "Kontrak" },
    { id: "report", label: "Laporan" },
    { id: "photo", label: "Foto" },
  ];

  const filteredDocs = filter
    ? props.documents.filter(d => d.type === filter)
    : props.documents;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id || "all"}
              onClick={() => setFilter(cat.id)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Tidak ada dokumen</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => {
            const Icon = getDocumentIcon(doc.type);
            const iconBg = doc.type === "drawing" ? "bg-blue-100 text-blue-600" :
                         doc.type === "contract" ? "bg-purple-100 text-purple-600" :
                         doc.type === "report" ? "bg-amber-100 text-amber-600" :
                         "bg-pink-100 text-pink-600";
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate" title={doc.name}>{doc.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{doc.category}</p>
                    <p className="text-xs text-slate-400">{doc.size}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{formatDate(doc.uploadDate)}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Kategori</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Ukuran</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tanggal</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => {
                const Icon = getDocumentIcon(doc.type);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{doc.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{doc.size}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(doc.uploadDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



// ============================================================================
// Team Tab
// ============================================================================

function TeamTab(props: {
  projectManager: TeamMember | null;
  teamMembers: TeamMember[];
}) {
  return (
    <div className="space-y-6">
      {/* Project Manager */}
      {props.projectManager && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Project Manager</h3>
              <p className="text-sm text-slate-500">Penanggung jawab proyek</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {props.projectManager.name.charAt(0)}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-xl font-semibold text-slate-900">{props.projectManager.name}</h4>
              <p className="text-slate-500 mb-4">{props.projectManager.role}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {props.projectManager.phone && (
                  <a
                    href={`tel:${props.projectManager.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{props.projectManager.phone}</span>
                  </a>
                )}
                {props.projectManager.email && (
                  <a
                    href={`mailto:${props.projectManager.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{props.projectManager.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Tim Proyek</h3>
            <p className="text-sm text-slate-500">{props.teamMembers.length} anggota tim</p>
          </div>
        </div>

        {props.teamMembers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p>Belum ada data tim</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {props.teamMembers.map(member => {
              const roleIcons: Record<string, typeof HardHat> = {
                "Engineer": Wrench,
                "Supervisor": Shield,
                "Foreman": HardHat,
                "Driver": Truck,
              };
              const Icon = roleIcons[member.role] || Users;

              return (
                <div
                  key={member.id}
                  className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-lg font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{member.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">{member.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex-1 p-2 rounded-lg bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex-1 p-2 rounded-lg bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



// ============================================================================
// Updates Tab
// ============================================================================

function UpdatesTab(props: {
  updates: ProjectUpdate[];
  reports: DailyReport[];
}) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Combine updates from various sources
  const allUpdates = useMemo(() => {
    const updateItems: (ProjectUpdate & { source: string })[] = [
      ...props.updates.map(u => ({ ...u, source: "update" })),
      ...props.reports.slice(0, 10).map(r => ({
        id: r.id,
        type: "progress" as const,
        title: "Laporan Harian",
        description: r.activities || "Tidak ada aktivitas",
        timestamp: r.date,
        photos: r.photos,
        author: "Tim Proyek",
        source: "report",
      })),
    ];
    return updateItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [props.updates, props.reports]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    // Simulated comment submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setNewComment("");
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Tanya / Komentar</h3>
        <div className="flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis pertanyaan atau komentar Anda..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className={clsx(
              "px-4 py-3 rounded-xl font-medium transition-colors self-end",
              newComment.trim() && !submitting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Updates Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-6">Aktivitas Terbaru</h3>

        {allUpdates.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p>Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allUpdates.map((update, index) => {
              const Icon = getUpdateIcon(update.type);
              const colorClass = getUpdateColor(update.type);
              const bgClass = getUpdateBg(update.type);

              return (
                <div key={update.id} className="relative flex gap-4">
                  {index < allUpdates.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200" />
                  )}
                  <div className={clsx("relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0", bgClass)}>
                    <Icon className={clsx("w-5 h-5", colorClass)} />
                  </div>
                  <div className="flex-1 pb-6 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 text-sm">{update.title}</h4>
                        {update.author && (
                          <p className="text-xs text-slate-500 mt-0.5">oleh {update.author}</p>
                        )}
                        <p className="text-sm text-slate-600 mt-1">{update.description}</p>
                        {update.photos && update.photos.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {update.photos.slice(0, 4).map((photo, i) => (
                              <div key={photo.id || i} className="relative group">
                                <img
                                  src={photo.url}
                                  alt={photo.caption || "Foto"}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ))}
                            {update.photos.length > 4 && (
                              <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-sm font-medium">
                                +{update.photos.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{timeAgo(update.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



// ============================================================================
// Main Component
// ============================================================================

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabId>("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proj, prog, reps] = await Promise.all([
        getProject(id).catch(() => null),
        getProgress(id).catch(() => null),
        getDailyReports(id, { limit: 20 }).catch(() => ({ reports: [] })),
      ]);
      setProject(proj);
      setProgress(prog);
      setReports(reps.reports || []);
    } catch {
      setError("Gagal memuat data proyek");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (navigator.share && project) {
      try {
        await navigator.share({
          title: project.project.title,
          text: `Lihat progress proyek ${project.project.title}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link berhasil disalin!");
    }
  }, [project]);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Ringkasan", icon: BarChart3 },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "documents", label: "Dokumen", icon: FileText },
    { id: "team", label: "Tim", icon: Users },
    { id: "updates", label: "Updates", icon: AlertTriangle },
  ];

  // Mock data for demonstration
  const mockMilestones: Milestone[] = [
    { id: "1", name: "Persiapan Lokasi", date: "2024-01-15", progress: 100, status: "complete" },
    { id: "2", name: "Pondasi", date: "2024-02-28", progress: 100, status: "complete" },
    { id: "3", name: "Struktur", date: "2024-04-15", progress: 75, status: "in_progress" },
    { id: "4", name: "Atap & Langit-langit", date: "2024-05-30", progress: 30, status: "in_progress" },
    { id: "5", name: "Finishing", date: "2024-06-30", progress: 0, status: "upcoming" },
  ];

  const mockPhases: PhaseProgress[] = [
    { phaseName: "Persiapan", progress: 100, startDate: "2024-01-01", endDate: "2024-01-31" },
    { phaseName: "Pondasi", progress: 100, startDate: "2024-02-01", endDate: "2024-02-29" },
    { phaseName: "Struktur", progress: 75, startDate: "2024-03-01", endDate: "2024-04-30" },
    { phaseName: "Finishing", progress: 30, startDate: "2024-05-01", endDate: "2024-06-30" },
  ];

  const mockDocuments: ProjectDocument[] = [
    { id: "1", name: "Gambar Arsitektur", type: "drawing", category: "Gambar Kerja", size: "2.5 MB", uploadDate: "2024-01-10", url: "#" },
    { id: "2", name: "Gambar Struktur", type: "drawing", category: "Gambar Kerja", size: "1.8 MB", uploadDate: "2024-01-10", url: "#" },
    { id: "3", name: "Kontrak Utama", type: "contract", category: "Legal", size: "5.2 MB", uploadDate: "2024-01-05", url: "#" },
    { id: "4", name: "Laporan Progress Bulanan", type: "report", category: "Laporan", size: "3.1 MB", uploadDate: "2024-03-15", url: "#" },
    { id: "5", name: "Foto Site 01", type: "photo", category: "Dokumentasi", size: "4.5 MB", uploadDate: "2024-03-20", url: "#" },
    { id: "6", name: "RAB Revisi", type: "report", category: "Keuangan", size: "1.2 MB", uploadDate: "2024-02-01", url: "#" },
  ];

  const mockUpdates: ProjectUpdate[] = [
    { id: "1", type: "progress", title: "Progress Update 15%", description: "Pekerjaan struktur telah mencapai 15%", timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: "2", type: "milestone", title: "Milestone: Pondasi Selesai", description: "Pekerjaan pondasi telah selesai tepat waktu", timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: "3", type: "document", title: "Dokumen Baru Diupload", description: "Gambar arsitektur revisi telah diupload", timestamp: new Date(Date.now() - 259200000).toISOString() },
  ];

  const mockProjectManager: TeamMember = {
    id: "pm1",
    name: "Ahmad Wijaya",
    role: "Project Manager",
    phone: "+62 812 3456 7890",
    email: "ahmad.wijaya@santra.co.id",
  };

  const mockTeamMembers: TeamMember[] = [
    { id: "t1", name: "Budi Santoso", role: "Site Engineer", phone: "+62 812 3456 7891", email: "budi@santra.co.id" },
    { id: "t2", name: "Dewi Lestari", role: "QA Supervisor", phone: "+62 812 3456 7892" },
    { id: "t3", name: "Eko Prasetyo", role: "Foreman", phone: "+62 812 3456 7893" },
    { id: "t4", name: "Fitri Handayani", role: "Quantity Surveyor", email: "fitri@santra.co.id" },
  ];

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !project) {
    return <ErrorState onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        project={project.project}
        progress={progress?.currentProgress || 0}
        onShare={handleShare}
        onPrint={handlePrint}
      />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map(t => (
            <TabButton
              key={t.id}
              id={t.id}
              label={t.label}
              icon={t.icon}
              active={tab === t.id}
              onClick={() => setTab(t.id)}
            />
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in-50">
        {tab === "overview" && (
          <OverviewTab project={project} progress={progress} milestones={mockMilestones} />
        )}

        {tab === "progress" && (
          <ProgressTab project={project} progress={progress} phases={mockPhases} />
        )}

        {tab === "documents" && (
          <DocumentsTab documents={mockDocuments} />
        )}

        {tab === "team" && (
          <TeamTab projectManager={mockProjectManager} teamMembers={mockTeamMembers} />
        )}

        {tab === "updates" && (
          <UpdatesTab updates={mockUpdates} reports={reports} />
        )}
      </div>
    </div>
  );
}
