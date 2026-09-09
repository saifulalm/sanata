"use client";

import { forwardRef } from "react";
import clsx from "clsx";
import {
  FileText,
  Image,
  File,
  FolderOpen,
  Download,
  Eye,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "@/lib/clientPortal";

// ============================================================================
// Types
// ============================================================================

export type DocumentType = "pdf" | "doc" | "xls" | "img" | "drawing" | "contract" | "report" | "other";

export interface DocumentCardProps {
  /** Document ID */
  id: string;
  /** Document name */
  name: string;
  /** Document type */
  type?: DocumentType;
  /** Document size (e.g., "2.5 MB") */
  size?: string;
  /** Upload date */
  date?: string;
  /** Category */
  category?: string;
  /** Download URL */
  downloadUrl?: string;
  /** Preview URL */
  previewUrl?: string;
  /** Show preview button */
  showPreview?: boolean;
  /** Show download button */
  showDownload?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** More options handler */
  onMoreClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDocumentIcon(type: DocumentType): LucideIcon {
  switch (type) {
    case "pdf":
    case "doc":
    case "xls":
      return FileText;
    case "img":
      return Image;
    case "drawing":
    case "contract":
      return FolderOpen;
    case "report":
      return FileText;
    default:
      return File;
  }
}

function getDocumentColors(type: DocumentType): { bg: string; text: string; border: string } {
  switch (type) {
    case "pdf":
      return { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" };
    case "doc":
      return { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" };
    case "xls":
      return { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" };
    case "img":
      return { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-200" };
    case "drawing":
      return { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" };
    case "contract":
      return { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-200" };
    case "report":
      return { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
  }
}

function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() ?? "" : "";
}

// ============================================================================
// Component
// ============================================================================

/**
 * DocumentCard - Display a document/file with icon, metadata, and actions
 *
 * @example
 * ```tsx
 * <DocumentCard
 *   id="doc-1"
 *   name="Gambar Arsitektur.pdf"
 *   type="pdf"
 *   size="2.5 MB"
 *   date="2024-01-15"
 *   downloadUrl="/docs/file.pdf"
 * />
 *
 * // With preview
 * <DocumentCard
 *   name="Foto Site 01.jpg"
 *   type="img"
 *   size="4.5 MB"
 *   showPreview
 *   previewUrl="/photos/1.jpg"
 *   downloadUrl="/photos/1.jpg"
 * />
 * ```
 */
export const DocumentCard = forwardRef<HTMLDivElement, DocumentCardProps>(
  (
    {
      id,
      name,
      type = "other",
      size,
      date,
      category,
      downloadUrl,
      previewUrl,
      showPreview = true,
      showDownload = true,
      onClick,
      onMoreClick,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const Icon = getDocumentIcon(type);
    const colors = getDocumentColors(type);
    const extension = getFileExtension(name);

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={clsx(
            "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4",
            className
          )}
          role="status"
          aria-label="Loading document"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4",
          "group transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600",
          className
        )}
        role="button"
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={clsx(
              "relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              colors.bg
            )}
          >
            {extension ? (
              <span className={clsx("text-xs font-bold", colors.text)}>{extension}</span>
            ) : (
              <Icon className={clsx("w-6 h-6", colors.text)} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4
              className="font-medium text-slate-900 dark:text-white text-sm truncate"
              title={name}
            >
              {name}
            </h4>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {category && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{category}</span>
              )}
              {category && (size || date) && (
                <span className="text-slate-300 dark:text-slate-600">•</span>
              )}
              {size && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{size}</span>
              )}
              {date && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(date, "short")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Preview button */}
            {showPreview && (previewUrl || downloadUrl) && (
              <a
                href={previewUrl || downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                )}
                onClick={(e) => e.stopPropagation()}
                aria-label="Preview document"
              >
                <Eye className="w-4 h-4" />
              </a>
            )}

            {/* Download button */}
            {showDownload && downloadUrl && (
              <a
                href={downloadUrl}
                download
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                )}
                onClick={(e) => e.stopPropagation()}
                aria-label="Download document"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* More button */}
          {onMoreClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick();
              }}
              className={clsx(
                "p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
                "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

DocumentCard.displayName = "DocumentCard";

// ============================================================================
// Export
// ============================================================================

export default DocumentCard;
