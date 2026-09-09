/**
 * Client Portal - Shared Components
 *
 * A comprehensive set of reusable components for the SANTRA Client Portal.
 * All components are TypeScript-first with proper types, accessible, and
 * styled with Tailwind CSS.
 *
 * @example
 * ```tsx
 * // Import individual components
 * import { StatsCard } from '@/app/client/components';
 *
 * // Or import multiple at once
 * import { StatsCard, ProjectCard, StatusBadge } from '@/app/client/components';
 * ```
 */

// ============================================================================
// Stats & Metrics
// ============================================================================

export { StatsCard, default as StatsCardDefault } from "./StatsCard";
export type { StatsCardProps, StatsCardTrend } from "./StatsCard";

export { ProgressRing, MiniProgressRing } from "./ProgressRing";
export type { ProgressRingProps, MiniProgressRingProps } from "./ProgressRing";

// ============================================================================
// Cards & Lists
// ============================================================================

export { ProjectCard } from "./ProjectCard";
export type { ProjectCardProps } from "./ProjectCard";

export { DocumentCard } from "./DocumentCard";
export type { DocumentCardProps, DocumentType } from "./DocumentCard";

export { TeamMemberCard, TeamMemberCompact } from "./TeamMemberCard";
export type { TeamMemberCardProps, TeamMemberCompactProps } from "./TeamMemberCard";

// ============================================================================
// Activity & Notifications
// ============================================================================

export { ActivityItem } from "./ActivityItem";
export type { ActivityItemProps, ActivityType } from "./ActivityItem";

export { NotificationItem, NotificationGroup } from "./NotificationItem";
export type { NotificationItemProps, NotificationType, NotificationGroupProps } from "./NotificationItem";

// ============================================================================
// Status & Badges
// ============================================================================

export { StatusBadge, StatusDot } from "./StatusBadge";
export type { StatusBadgeProps, StatusDotProps, StatusVariant } from "./StatusBadge";

// ============================================================================
// Feedback & Loading
// ============================================================================

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export {
  LoadingSkeleton as Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  StatsCardSkeleton,
  TableRowSkeleton,
  AvatarSkeleton,
  TextSkeleton,
} from "./LoadingSkeleton";
export type {
  LoadingSkeletonProps,
  CardSkeletonProps,
  ListItemSkeletonProps,
  StatsCardSkeletonProps,
  TableRowSkeletonProps,
  AvatarSkeletonProps,
  TextSkeletonProps,
  SkeletonVariant,
} from "./LoadingSkeleton";

// ============================================================================
// Re-exports from clientPortal library
// ============================================================================

// These are commonly used utilities that work well with the components
export { formatDate, formatCurrency, formatTime, getStatusBadge, getProgressBg } from "@/lib/clientPortal";
