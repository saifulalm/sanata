"use client";

import { forwardRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/clientPortal";

// ============================================================================
// Types
// ============================================================================

export interface ProjectCardProps {
  /** Project ID for linking */
  id: string;
  /** Project title/name */
  title: string;
  /** Project status */
  status: string;
  /** Status badge configuration */
  statusBadge?: {
    bg: string;
    text: string;
    label: string;
  };
  /** Progress percentage (0-100) */
  progress: number;
  /** Client name */
  clientName?: string;
  /** Project location */
  location?: string;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Thumbnail image URL */
  thumbnail?: string;
  /** Total value/budget */
  value?: string | number;
  /** Click handler - if provided, renders as button */
  onClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getProgressColor(percent: number): string {
  if (percent >= 90) return "bg-emerald-500";
  if (percent >= 70) return "bg-blue-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

function getDefaultThumbnail(title: string): string {
  // Generate a gradient based on the title
  const hash = title.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash % 360);
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 50%);stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360}, 70%, 40%);stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect fill="url(#grad)" width="400" height="200"/>
      <text x="200" y="100" font-family="system-ui" font-size="48" font-weight="bold" fill="white" text-anchor="middle" opacity="0.3">
        ${title.charAt(0).toUpperCase()}
      </text>
    </svg>
  `)}`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectCard - Display a project summary with thumbnail, status, and progress
 *
 * @example
 * ```tsx
 * <ProjectCard
 *   id="proj-123"
 *   title="Pembangunan Gedung A"
 *   status="IN_PROGRESS"
 *   progress={65}
 *   clientName="PT Contoh"
 *   startDate="2024-01-01"
 *   endDate="2024-06-30"
 * />
 * ```
 */
export const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    {
      id,
      title,
      status,
      statusBadge,
      progress,
      clientName,
      location,
      startDate,
      endDate,
      thumbnail,
      value,
      onClick,
      isLoading = false,
      className,
    },
    ref
  ) => {
    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={clsx(
            "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden",
            className
          )}
          role="status"
          aria-label="Loading project"
        >
          <div className="animate-pulse">
            {/* Thumbnail skeleton */}
            <div className="h-36 bg-slate-200 dark:bg-slate-700" />
            {/* Content skeleton */}
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-4" />
            </div>
          </div>
        </div>
      );
    }

    // Use custom onClick or link to project detail
    const content = (
      <>
        {/* Thumbnail */}
        <div className="relative h-36 overflow-hidden bg-slate-100 dark:bg-slate-700">
          <img
            src={thumbnail || getDefaultThumbnail(title)}
            alt={`${title} thumbnail`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to generated thumbnail on error
              e.currentTarget.src = getDefaultThumbnail(title);
            }}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Status badge */}
          {statusBadge && (
            <div className="absolute top-3 left-3">
              <span
                className={clsx(
                  "px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm",
                  statusBadge.bg,
                  statusBadge.text
                )}
              >
                {statusBadge.label}
              </span>
            </div>
          )}

          {/* View icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center shadow-lg">
              <ExternalLink className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>

          {/* Meta info */}
          <div className="space-y-1.5 mb-4">
            {clientName && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{clientName}</p>
            )}
            {location && (
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{location}</span>
              </p>
            )}
            {(startDate || endDate) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {startDate && formatDate(startDate, "short")}
                  {startDate && endDate && " - "}
                  {endDate && formatDate(endDate, "short")}
                </span>
              </p>
            )}
            {value && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {value}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Progress
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-500",
                  getProgressColor(progress)
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${Math.round(progress)}%`}
              />
            </div>
          </div>
        </div>
      </>
    );

    // Render as button with onClick
    if (onClick) {
      return (
        <div
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          className={clsx(
            "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden cursor-pointer",
            "group transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600",
            "hover:-translate-y-1 active:translate-y-0",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
            className
          )}
        >
          {content}
        </div>
      );
    }

    // Render as link
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden",
          "group transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600",
          "hover:-translate-y-1 active:translate-y-0",
          className
        )}
      >
        <Link href={`/client/project/${id}`} className="block focus:outline-none">
          {/* Focus ring for accessibility */}
          <span className="sr-only">View project {title}</span>
          {content}
        </Link>
      </div>
    );
  }
);

ProjectCard.displayName = "ProjectCard";

// ============================================================================
// Export
// ============================================================================

export default ProjectCard;
