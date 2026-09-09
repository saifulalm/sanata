"use client";

import { forwardRef } from "react";
import clsx from "clsx";

// ============================================================================
// Types
// ============================================================================

export type SkeletonVariant = "card" | "list" | "text" | "avatar" | "circle" | "button" | "thumbnail";

export interface LoadingSkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Custom width */
  width?: string | number;
  /** Custom height */
  height?: string | number;
  /** Number of items (for list variant) */
  count?: number;
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Animation speed (default: 1.5s) */
  animationDuration?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRoundedClasses(rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full"): string {
  switch (rounded) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-sm";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "full":
      return "rounded-full";
    default:
      return "rounded-lg";
  }
}

// ============================================================================
// Single Skeleton Component
// ============================================================================

const Skeleton = forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  (
    {
      variant = "text",
      width,
      height,
      rounded,
      animationDuration = "1.5s",
      className,
    },
    ref
  ) => {
    // Base classes for the pulse animation
    const baseClasses = clsx(
      "bg-slate-200 dark:bg-slate-700",
      "animate-pulse"
    );

    // Variant-specific styles
    const getVariantClasses = () => {
      switch (variant) {
        case "card":
          return "h-48 rounded-xl";
        case "list":
          return "h-16 rounded-lg";
        case "text":
          return "h-4 rounded";
        case "avatar":
          return "w-12 h-12 rounded-full";
        case "circle":
          return "w-24 h-24 rounded-full";
        case "button":
          return "h-10 w-24 rounded-xl";
        case "thumbnail":
          return "w-full h-32 rounded-lg";
        default:
          return "";
      }
    };

    const roundedClass = rounded !== undefined ? getRoundedClasses(rounded) : undefined;

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading..."
        className={clsx(
          baseClasses,
          getVariantClasses(),
          roundedClass,
          className
        )}
        style={{
          width: width ?? undefined,
          height: height ?? undefined,
          animationDuration,
        }}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Alias for LoadingSkeleton
export const LoadingSkeleton = Skeleton;

// ============================================================================
// Compound Components
// ============================================================================

// Card Skeleton
export interface CardSkeletonProps extends LoadingSkeletonProps {
  showImage?: boolean;
  lines?: number;
}

export const CardSkeleton = forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ showImage = true, lines = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden",
          className
        )}
        role="status"
        aria-label="Loading card"
      >
        {showImage && (
          <Skeleton variant="thumbnail" className="rounded-none" {...props} />
        )}
        <div className="p-4 space-y-3">
          <Skeleton variant="text" width="75%" height={20} {...props} />
          {[...Array(lines - 1)].map((_, i) => (
            <Skeleton key={i} variant="text" width={i === lines - 2 ? "60%" : "100%"} {...props} />
          ))}
        </div>
      </div>
    );
  }
);

CardSkeleton.displayName = "CardSkeleton";

// List Item Skeleton
export interface ListItemSkeletonProps extends LoadingSkeletonProps {
  showAvatar?: boolean;
  showAction?: boolean;
}

export const ListItemSkeleton = forwardRef<HTMLDivElement, ListItemSkeletonProps>(
  ({ showAvatar = true, showAction = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg",
          className
        )}
        role="status"
        aria-label="Loading list item"
      >
        {showAvatar && (
          <Skeleton variant="avatar" {...props} />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={16} {...props} />
          <Skeleton variant="text" width="40%" {...props} />
        </div>
        {showAction && (
          <Skeleton variant="button" width={80} {...props} />
        )}
      </div>
    );
  }
);

ListItemSkeleton.displayName = "ListItemSkeleton";

// Stats Card Skeleton
export interface StatsCardSkeletonProps extends LoadingSkeletonProps {}

export const StatsCardSkeleton = forwardRef<HTMLDivElement, StatsCardSkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5",
          className
        )}
        role="status"
        aria-label="Loading statistics"
      >
        <div className="flex items-start justify-between mb-4">
          <Skeleton variant="circle" width={40} height={40} {...props} />
          <Skeleton variant="text" width={60} height={24} rounded="full" {...props} />
        </div>
        <Skeleton variant="text" width="50%" {...props} />
        <Skeleton variant="text" width="75%" height={28} className="mt-2" {...props} />
        <Skeleton variant="text" width="40%" className="mt-2" {...props} />
      </div>
    );
  }
);

StatsCardSkeleton.displayName = "StatsCardSkeleton";

// Table Row Skeleton
export interface TableRowSkeletonProps extends LoadingSkeletonProps {
  columns?: number;
}

export const TableRowSkeleton = forwardRef<HTMLTableRowElement, TableRowSkeletonProps>(
  ({ columns = 4, className, ...props }, ref) => {
    return (
      <tr ref={ref} role="status" aria-label="Loading row" className={className}>
        {[...Array(columns)].map((_, i) => (
          <td key={i} className="px-4 py-3">
            <Skeleton variant="text" width={i === 0 ? "80%" : "60%"} {...props} />
          </td>
        ))}
      </tr>
    );
  }
);

TableRowSkeleton.displayName = "TableRowSkeleton";

// Avatar Skeleton
export interface AvatarSkeletonProps extends LoadingSkeletonProps {
  size?: "sm" | "md" | "lg" | "xl";
}

export const AvatarSkeleton = forwardRef<HTMLDivElement, AvatarSkeletonProps>(
  ({ size = "md", className, ...props }, ref) => {
    const sizes = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
    };

    return (
      <Skeleton
        ref={ref}
        variant="circle"
        className={clsx(sizes[size], className)}
        {...props}
      />
    );
  }
);

AvatarSkeleton.displayName = "AvatarSkeleton";

// Text Lines Skeleton
export interface TextSkeletonProps extends LoadingSkeletonProps {
  lines?: number;
  lastLineWidth?: string;
}

export const TextSkeleton = forwardRef<HTMLDivElement, TextSkeletonProps>(
  ({ lines = 3, lastLineWidth = "60%", className, ...props }, ref) => {
    return (
      <div ref={ref} role="status" aria-label="Loading text" className={clsx("space-y-2", className)}>
        {[...Array(lines)].map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={i === lines - 1 ? lastLineWidth : "100%"}
            {...props}
          />
        ))}
      </div>
    );
  }
);

TextSkeleton.displayName = "TextSkeleton";

// ============================================================================
// Main Component (Default Export)
// ============================================================================

export { Skeleton };

export default Skeleton;
