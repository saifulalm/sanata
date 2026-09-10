"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  FolderOpen,
  Camera,
  TrendingUp,
  Users,
  Building2,
  X,
  MessageSquare,
  Send,
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
  Sun,
  Cloud,
  CloudRain,
  Eye,
  ZoomIn,
  ChevronLeft,
  ChevronUp,
  EyeOff,
  Maximize2,
  Grid3X3,
  List,
} from "lucide-react";
import {
  getProject,
  getProgress,
  getDailyReports,
  getQCRecords,
  getProjectTeam,
  getProjectMilestones,
  getProjectPhotos,
  getSCurveData,
  downloadDocument,
  formatCurrency,
  formatDate,
  getStatusBadge,
  getProgressBg,
  type Project,
  type Progress,
  type DailyReport,
  type TeamMember,
  type Milestone,
  type Photo,
  type SCurveDataPoint,
} from "@/lib/clientPortal";

// ============================================================================
// Types
// ============================================================================

type TabId = "overview" | "progress" | "documents" | "team" | "updates" | "photos";

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

// TeamMember interface is now imported from clientPortal

interface ProjectDocument {
  id: string;
  name: string;
  type: "drawing" | "contract" | "report" | "photo" | "invoice" | "other";
  category: string;
  size: string;
  uploadDate: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
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

// Milestone interface is now imported from clientPortal

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
// Photo Lightbox Component
// ============================================================================

function PhotoLightbox({
  photos,
  initialIndex = 0,
  onClose,
}: {
  photos: Photo[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  const currentPhoto = photos[currentIndex];

  const goNext = useCallback(() => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </span>
          {currentPhoto.caption && (
            <span className="text-sm text-white/70">{currentPhoto.caption}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Prev Button */}
        <button
          onClick={goPrev}
          className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Image */}
        <div className="relative max-w-5xl max-h-[80vh] mx-20">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || "Photo"}
            className={clsx(
              "max-w-full max-h-[80vh] object-contain transition-opacity",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
          />
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {photos.slice(0, 12).map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => {
                setIsLoading(true);
                setCurrentIndex(index);
              }}
              className={clsx(
                "shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-blue-500 opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-16 h-12 object-cover"
              />
            </button>
          ))}
          {photos.length > 12 && (
            <span className="shrink-0 px-3 py-1 bg-white/10 rounded-lg text-white text-sm">
              +{photos.length - 12} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
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
    <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>

      <div className="relative">
        {/* Back Navigation */}
        <Link href="/client" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={props.onShare}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            title="Bagikan"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={props.onPrint}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            title="Cetak"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            title="Unduh Laporan"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Project Info */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-blue-200 bg-white/10 px-3 py-1 rounded-lg">
                {props.project.number}
              </span>
              <span className="px-3 py-1 text-xs bg-white/20 backdrop-blur-sm rounded-lg font-medium">
                {badge.label}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-4">{props.project.title}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
              {props.project.location && (
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <MapPin className="w-4 h-4" />
                  {props.project.location}
                </span>
              )}
              {props.project.scheduleStart && (
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  {formatDate(props.project.scheduleStart)}
                </span>
              )}
              {daysLeft !== null && (
                <span className={clsx(
                  "flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-lg",
                  daysLeft <= 7 ? "bg-amber-500/30 text-amber-200" : "bg-white/10"
                )}>
                  <Clock className="w-4 h-4" />
                  {daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}
                </span>
              )}
              {props.project.total > 0 && (
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(props.project.total)}
                </span>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${props.progress * 2.83} 283`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold">{props.progress}%</p>
                  <p className="text-xs text-blue-200">Progress</p>
                </div>
              </div>
            </div>
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
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all hover:shadow-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Item</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{props.project.sections.reduce((s, sec) => s + sec.items.length, 0)}</p>
          <p className="text-xs text-slate-400 mt-1">Pekerjaan</p>
        </div>
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all hover:shadow-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">QC Passed</p>
          <p className="text-2xl font-bold text-emerald-600">{props.progress ? Math.round(props.progress.currentProgress) : 0}%</p>
          <p className="text-xs text-slate-400 mt-1">Progress</p>
        </div>
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all hover:shadow-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tanggal Mulai</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{proj.scheduleStart ? formatDate(proj.scheduleStart) : "-"}</p>
          <p className="text-xs text-slate-400 mt-1">Mulai Proyek</p>
        </div>
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-5 transition-all hover:shadow-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Target Selesai</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{proj.scheduleEnd ? formatDate(proj.scheduleEnd) : "-"}</p>
          <p className="text-xs text-slate-400 mt-1">Deadline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Milestones Timeline */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Milestone Utama</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pencapaian penting proyek</p>
            </div>
          </div>

          <div className="space-y-4">
            {props.milestones.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Belum ada milestone</p>
              </div>
            ) : (
              props.milestones.map((milestone, index) => {
                const Icon = milestone.status === "complete" ? CheckCircle2 :
                            milestone.status === "in_progress" ? Loader2 : AlertCircle;
                const color = milestone.status === "complete" ? "text-emerald-500" :
                             milestone.status === "in_progress" ? "text-blue-500" : "text-slate-400";

                return (
                  <div key={milestone.id} className="relative flex gap-4">
                    {index < props.milestones.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                    )}
                    <div className={clsx(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                      milestone.status === "complete" ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/25" :
                      milestone.status === "in_progress" ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/25" :
                      "bg-slate-100 dark:bg-slate-700 text-slate-400"
                    )}>
                      <Icon className={clsx("w-5 h-5", color, milestone.status === "in_progress" && "animate-spin")} />
                    </div>
                    <div className="flex-1 pb-6 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{milestone.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(milestone.date)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full transition-all",
                              milestone.status === "complete" ? "bg-gradient-to-r from-emerald-400 to-green-500" :
                              "bg-gradient-to-r from-blue-500 to-indigo-500"
                            )}
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{milestone.progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rincian Budget</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Breakdown biaya proyek</p>
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
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {budgetData.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={clsx("w-4 h-4 rounded-lg", item.color)} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Map Placeholder */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Lokasi Proyek</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{proj.location || "Lokasi tidak tersedia"}</p>
          </div>
        </div>
        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Peta lokasi akan ditampilkan di sini</p>
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
  sCurveData?: SCurveDataPoint[];
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

  // Use real S-curve data or fall back to progress data
  const chartData = useMemo(() => {
    if (props.sCurveData && props.sCurveData.length > 0) {
      return props.sCurveData;
    }
    // Fallback to progress curve data
    return props.progress?.plannedCurve?.map((p, i) => ({
      date: p.date,
      planned: p.planned,
      actual: props.progress?.actualCurve?.[i]?.actual || 0,
      cumulativePlanned: p.planned,
      cumulativeActual: props.progress?.actualCurve?.[i]?.actual || 0,
    })) || [];
  }, [props.sCurveData, props.progress]);

  return (
    <div className="space-y-8">
      {/* Enhanced S-Curve Chart */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Kurva S - Rencana vs Realisasi</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Perbandingan progress rencana dan aktual</p>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded" />
                <span className="text-slate-600 dark:text-slate-400">Rencana</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded" />
                <span className="text-slate-600 dark:text-slate-400">Realisasi</span>
              </div>
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <>
            {/* SVG S-Curve Chart */}
            <div className="relative h-72 w-full">
              <svg viewBox="0 0 800 280" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((tick) => (
                  <g key={tick}>
                    <line
                      x1="50"
                      y1={280 - (tick / 100) * 240 - 20}
                      x2="780"
                      y2={280 - (tick / 100) * 240 - 20}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x="45"
                      y={280 - (tick / 100) * 240 - 16}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px]"
                    >
                      {tick}%
                    </text>
                  </g>
                ))}

                {/* Planned curve */}
                <path
                  d={chartData.reduce((path, point, i) => {
                    const x = 50 + (i / (chartData.length - 1)) * 730;
                    const y = 260 - (point.cumulativePlanned / 100) * 240;
                    return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
                  }, "")}
                  fill="none"
                  stroke="url(#plannedGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Actual curve */}
                <path
                  d={chartData.reduce((path, point, i) => {
                    const x = 50 + (i / (chartData.length - 1)) * 730;
                    const y = 260 - (point.cumulativeActual / 100) * 240;
                    return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
                  }, "")}
                  fill="none"
                  stroke="url(#actualGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient id="plannedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Legend */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 text-xs text-slate-500 dark:text-slate-400">
                <span>{chartData[0]?.date ? formatDate(chartData[0].date, "short") : "-"}</span>
                <span>{chartData[chartData.length - 1]?.date ? formatDate(chartData[chartData.length - 1].date, "short") : "-"}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">Rencana</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {chartData[chartData.length - 1]?.cumulativePlanned?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">Realisasi</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {chartData[chartData.length - 1]?.cumulativeActual?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">Deviasi</p>
                <p className={clsx(
                  "text-2xl font-bold",
                  (chartData[chartData.length - 1]?.cumulativeActual || 0) >= (chartData[chartData.length - 1]?.cumulativePlanned || 0)
                    ? "text-emerald-600"
                    : "text-red-600"
                )}>
                  {(chartData[chartData.length - 1]?.cumulativeActual - chartData[chartData.length - 1]?.cumulativePlanned || 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <p className={clsx(
                  "text-lg font-bold",
                  (chartData[chartData.length - 1]?.cumulativeActual || 0) >= (chartData[chartData.length - 1]?.cumulativePlanned || 0)
                    ? "text-emerald-600"
                    : "text-amber-600"
                )}>
                  {(chartData[chartData.length - 1]?.cumulativeActual || 0) >= (chartData[chartData.length - 1]?.cumulativePlanned || 0) ? "On Track" : "Delayed"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Data kurva S tidak tersedia</p>
            </div>
          </div>
        )}
      </div>

      {/* Phase Progress */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Progress per Fase</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Detail progress setiap tahapan</p>
          </div>
        </div>
        <div className="space-y-6">
          {props.phases.length === 0 ? (
            props.project.sections.map((section, idx) => {
              const completedItems = Math.round(section.items.length * (idx === 0 ? 0.8 : idx === 1 ? 0.5 : idx === 2 ? 0.2 : 0));
              const progress = section.items.length > 0 ? (completedItems / section.items.length) * 100 : 0;
              return (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{section.name}</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", getProgressBg(progress))}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{completedItems} dari {section.items.length} item selesai</p>
                </div>
              );
            })
          ) : (
            props.phases.map((phase, idx) => {
              const bgColor = phase.progress >= 90 ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                            phase.progress >= 50 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                            "bg-gradient-to-r from-amber-500 to-orange-500";
              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{phase.phaseName}</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(phase.progress)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all", bgColor)}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Gantt-style Timeline */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all overflow-x-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Timeline Pekerjaan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Jadwal dan durasi pekerjaan</p>
          </div>
        </div>
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="flex border-b-2 border-slate-200 dark:border-slate-700 pb-3 mb-4">
            <div className="w-1/3 font-semibold text-sm text-slate-600 dark:text-slate-400">Pekerjaan</div>
            <div className="w-1/6 font-semibold text-sm text-slate-600 dark:text-slate-400 text-center">Start</div>
            <div className="w-1/6 font-semibold text-sm text-slate-600 dark:text-slate-400 text-center">Durasi</div>
            <div className="w-1/3 font-semibold text-sm text-slate-600 dark:text-slate-400">Progress</div>
          </div>
          {/* Items */}
          <div className="space-y-3">
            {ganttData.items.map((item) => (
              <div key={item.id} className="flex items-center hover:bg-slate-50/50 dark:hover:bg-slate-700/30 -mx-2 px-2 py-2 rounded-xl transition-colors">
                <div className="w-1/3 min-w-0 pr-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.section}</p>
                </div>
                <div className="w-1/6 text-center">
                  <span className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">Hari {item.startOffset}</span>
                </div>
                <div className="w-1/6 text-center">
                  <span className="inline-block px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg">{item.duration} hari</span>
                </div>
                <div className="w-1/3">
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <div className="inline-flex items-center gap-1 p-1 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
            {categories.map(cat => (
              <button
                key={cat.id || "all"}
                onClick={() => setFilter(cat.id)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  filter === cat.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              viewMode === "grid"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            )}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              viewMode === "list"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Tidak ada dokumen</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => {
            const Icon = getDocumentIcon(doc.type);
            const iconBg = doc.type === "drawing" ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white" :
                         doc.type === "contract" ? "bg-gradient-to-br from-purple-400 to-pink-500 text-white" :
                         doc.type === "report" ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                         "bg-gradient-to-br from-pink-400 to-rose-500 text-white";
            return (
              <div
                key={doc.id}
                className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-4 shadow-sm hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-700/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg", iconBg)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate" title={doc.name}>{doc.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{doc.category}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{doc.size}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(doc.uploadDate)}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
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
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50">
              <tr>
                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Nama</th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Kategori</th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Ukuran</th>
                <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Tanggal</th>
                <th className="text-right px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredDocs.map(doc => {
                const Icon = getDocumentIcon(doc.type);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-900 dark:text-white">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.category}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.size}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(doc.uploadDate)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
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
    <div className="space-y-8">
      {/* Project Manager */}
      {props.projectManager && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-600/5 to-indigo-600/5 dark:from-blue-500/5 dark:to-indigo-500/5 border border-slate-200/50 dark:border-slate-700/50 p-8 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Project Manager</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Penanggung jawab proyek</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-500/25">
              {props.projectManager.name.charAt(0)}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{props.projectManager.name}</h4>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{props.projectManager.role}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {props.projectManager.phone && (
                  <a
                    href={`tel:${props.projectManager.phone}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">{props.projectManager.phone}</span>
                  </a>
                )}
                {props.projectManager.email && (
                  <a
                    href={`mailto:${props.projectManager.email}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">{props.projectManager.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Tim Proyek</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{props.teamMembers.length} anggota tim</p>
          </div>
        </div>

        {props.teamMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
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
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xl font-bold shadow group-hover:shadow-lg transition-shadow">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">{member.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{member.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
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
    <div className="space-y-8">
      {/* Comment Input */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Tanya / Komentar</h3>
        <div className="flex gap-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis pertanyaan atau komentar Anda..."
            className="flex-1 px-5 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-900 dark:text-white"
            rows={3}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            className={clsx(
              "px-5 py-4 rounded-xl font-semibold transition-all self-end",
              newComment.trim() && !submitting
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
                : "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Updates Feed */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Aktivitas Terbaru</h3>

        {allUpdates.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
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
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                  )}
                  <div className={clsx(
                    "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                    bgClass, colorClass
                  )}>
                    <Icon className={clsx("w-5 h-5")} />
                  </div>
                  <div className="flex-1 pb-6 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{update.title}</h4>
                        {update.author && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">oleh {update.author}</p>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{update.description}</p>
                        {update.photos && update.photos.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {update.photos.slice(0, 4).map((photo, i) => (
                              <div key={photo.id || i} className="relative group">
                                <img
                                  src={photo.url}
                                  alt={photo.caption || "Foto"}
                                  className="w-20 h-20 object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ))}
                            {update.photos.length > 4 && (
                              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                                +{update.photos.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{timeAgo(update.timestamp)}</span>
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
// Photos Tab
// ============================================================================

function PhotosTab(props: {
  photos: Photo[];
  projectTitle: string;
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid");
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (photo: Photo) => {
    setDownloading(photo.id);
    try {
      await downloadDocument(photo.id, `photo-${photo.id}.jpg`);
    } catch {
      // Fallback to direct download
      const a = document.createElement("a");
      a.href = photo.url;
      a.download = `photo-${photo.id}.jpg`;
      a.click();
    }
    setDownloading(null);
  };

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{props.projectTitle}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{props.photos.length} foto</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              viewMode === "grid"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            )}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("masonry")}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              viewMode === "masonry"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            )}
            aria-label="Masonry view"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      {props.photos.length === 0 ? (
        <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Camera className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Tidak ada foto</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {props.photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative group rounded-2xl overflow-hidden aspect-square cursor-pointer"
              onClick={() => setSelectedPhoto(index)}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || "Photo"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.caption && (
                  <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                )}
                {photo.location && (
                  <p className="text-white/70 text-xs">{photo.location}</p>
                )}
                {photo.takenAt && (
                  <p className="text-white/60 text-xs">{formatDate(photo.takenAt, "short")}</p>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(index);
                  }}
                  className="p-2 bg-white/90 rounded-lg text-slate-700 hover:bg-white transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photo);
                  }}
                  disabled={downloading === photo.id}
                  className="p-2 bg-white/90 rounded-lg text-slate-700 hover:bg-white transition-colors"
                >
                  {downloading === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {props.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-2xl overflow-hidden cursor-pointer break-inside-avoid"
              onClick={() => setSelectedPhoto(props.photos.indexOf(photo))}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || "Photo"}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto !== null && (
        <PhotoLightbox
          photos={props.photos}
          initialIndex={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
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
  const [team, setTeam] = useState<{ projectManager: TeamMember | null; members: TeamMember[] }>({ projectManager: null, members: [] });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sCurveData, setSCurveData] = useState<SCurveDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proj, prog, reps, teamData, milestoneData, photoData, sCurve] = await Promise.all([
        getProject(id).catch(() => null),
        getProgress(id).catch(() => null),
        getDailyReports(id, { limit: 20 }).catch(() => ({ reports: [] })),
        getProjectTeam(id).catch(() => ({ projectManager: null, members: [] })),
        getProjectMilestones(id).catch(() => []),
        getProjectPhotos(id, 50).catch(() => []),
        getSCurveData(id).catch(() => []),
      ]);
      setProject(proj);
      setProgress(prog);
      setReports(reps.reports || []);
      setTeam(teamData);
      setMilestones(milestoneData);
      setPhotos(photoData);
      setSCurveData(sCurve);
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
  const tabs: { id: TabId; label: string; icon: typeof BarChart3; badge?: number }[] = [
    { id: "overview", label: "Ringkasan", icon: BarChart3 },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "documents", label: "Dokumen", icon: FileText },
    { id: "team", label: "Tim", icon: Users, badge: team.members.length > 0 ? team.members.length + 1 : undefined },
    { id: "photos", label: "Foto", icon: Camera, badge: photos.length > 0 ? photos.length : undefined },
    { id: "updates", label: "Updates", icon: AlertTriangle },
  ];

  // Mock data for demonstration (used when API data is not available)
  const mockMilestones: Milestone[] = milestones.length > 0 ? milestones : [
    { id: "1", name: "Persiapan Lokasi", date: "2024-01-15", progress: 100, status: "complete", description: "Pembersihan dan perataan lokasi", deliverable: "Site cleared" },
    { id: "2", name: "Pondasi", date: "2024-02-28", progress: 100, status: "complete", description: "Pekerjaan pondasi lengkap", deliverable: "Foundation certificate" },
    { id: "3", name: "Struktur", date: "2024-04-15", progress: 75, status: "in_progress", description: "Kolom dan balok lantai 1-2", deliverable: "Structural drawings" },
    { id: "4", name: "Atap & Langit-langit", date: "2024-05-30", progress: 30, status: "in_progress", description: "Penempatan atap dan ceiling", deliverable: "Roofing completion" },
    { id: "5", name: "Finishing", date: "2024-06-30", progress: 0, status: "upcoming", description: "Pengecatan dan finishing interior", deliverable: "Handover package" },
    { id: "6", name: "Serah Terima", date: "2024-07-30", progress: 0, status: "pending", description: "Project completion & handover", deliverable: "BAST document" },
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

  // Use real team data or fall back to mock
  const mockProjectManager: TeamMember = team.projectManager || {
    id: "pm1",
    name: "Ahmad Wijaya",
    role: "Project Manager",
    phone: "+62 812 3456 7890",
    email: "ahmad.wijaya@santra.co.id",
    isProjectManager: true,
  };

  const mockTeamMembers: TeamMember[] = team.members.length > 0 ? team.members : [
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

  // Tab Button Component
  function TabButton(props: { id: TabId; label: string; icon: typeof BarChart3; active: boolean; onClick: () => void; badge?: number }) {
    const Icon = props.icon;
    return (
      <button
        onClick={props.onClick}
        className={clsx(
          "flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all relative",
          props.active
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
        )}
      >
        <Icon className={clsx("w-4 h-4", props.active ? "text-white" : "text-slate-400")} />
        <span>{props.label}</span>
        {props.badge !== undefined && props.badge > 0 && (
          <span className={clsx(
            "ml-1 px-2 py-0.5 text-xs font-bold rounded-full",
            props.active ? "bg-white/20 text-white" : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
          )}>
            {props.badge > 99 ? "99+" : props.badge}
          </span>
        )}
      </button>
    );
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
      <div className="flex gap-2 p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm overflow-x-auto">
        {tabs.map(t => (
          <TabButton
            key={t.id}
            id={t.id}
            label={t.label}
            icon={t.icon}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
            badge={t.badge}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tab === "overview" && (
          <OverviewTab project={project} progress={progress} milestones={mockMilestones} />
        )}

        {tab === "progress" && (
          <ProgressTab project={project} progress={progress} phases={mockPhases} sCurveData={sCurveData} />
        )}

        {tab === "documents" && (
          <DocumentsTab documents={mockDocuments} />
        )}

        {tab === "team" && (
          <TeamTab projectManager={mockProjectManager} teamMembers={mockTeamMembers} />
        )}

        {tab === "photos" && (
          <PhotosTab photos={photos} projectTitle={project.project.title} />
        )}

        {tab === "updates" && (
          <UpdatesTab updates={mockUpdates} reports={reports} />
        )}
      </div>
    </div>
  );
}
