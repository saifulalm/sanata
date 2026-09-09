"use client";

import { ReactNode } from "react";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";
type ProjectStatus = "planning" | "progress" | "hold" | "completed" | "cancelled";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "cp-badge-primary",
  secondary: "cp-badge-secondary",
  success: "cp-badge-success",
  warning: "cp-badge-warning",
  danger: "cp-badge-danger",
  info: "cp-badge-info",
  neutral: "cp-badge-neutral",
};

export function Badge({ children, variant = "neutral", dot = false, className = "" }: BadgeProps) {
  return (
    <span className={`cp-badge ${variantClasses[variant]} ${dot ? "cp-badge-dot" : ""} ${className}`}>
      {children}
    </span>
  );
}

interface ProjectStatusBadgeProps {
  status: ProjectStatus | string;
  className?: string;
}

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  planning: { variant: "neutral", label: "Planning" },
  progress: { variant: "primary", label: "In Progress" },
  APPROVED: { variant: "primary", label: "Aktif" },
  IN_PROGRESS: { variant: "primary", label: "In Progress" },
  hold: { variant: "warning", label: "On Hold" },
  PENDING: { variant: "warning", label: "Pending" },
  DRAFT: { variant: "neutral", label: "Draft" },
  completed: { variant: "success", label: "Completed" },
  ARCHIVED: { variant: "success", label: "Selesai" },
  COMPLETED: { variant: "success", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
  REJECTED: { variant: "danger", label: "Rejected" },
  FAIL: { variant: "danger", label: "Failed" },
};

export function ProjectStatusBadge({ status, className = "" }: ProjectStatusBadgeProps) {
  const config = statusConfig[status] || { variant: "neutral" as BadgeVariant, label: status };
  return <Badge variant={config.variant} dot className={className}>{config.label}</Badge>;
}
