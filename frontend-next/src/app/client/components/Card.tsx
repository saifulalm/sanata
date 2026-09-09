"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type CardVariant = "default" | "hoverable" | "elevated" | "glass" | "accent" | "interactive";
type StatColor = "primary" | "success" | "warning" | "danger" | "info";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  onClick?: () => void;
}

export function Card({ children, className = "", variant = "default", onClick }: CardProps) {
  const variantClasses: Record<CardVariant, string> = {
    default: "",
    hoverable: "cp-card-hoverable",
    elevated: "cp-card-elevated",
    glass: "cp-card-glass",
    accent: "cp-card-accent",
    interactive: "cp-card-interactive",
  };

  return (
    <div
      className={`cp-card ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={`cp-card-header ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return <h3 className={`cp-card-title ${className}`}>{children}</h3>;
}

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: StatColor;
  className?: string;
}

const colorClasses: Record<StatColor, string> = {
  primary: "cp-stat-primary",
  success: "cp-stat-success",
  warning: "cp-stat-warning",
  danger: "cp-stat-danger",
  info: "cp-stat-info",
};

export function StatCard({ icon: Icon, value, label, color = "primary", className = "" }: StatCardProps) {
  return (
    <Card className={`cp-stat ${colorClasses[color]} ${className}`}>
      <div className="cp-stat-icon">
        <Icon className="w-6 h-6" />
      </div>
      <div className="cp-stat-value">{value}</div>
      <div className="cp-stat-label">{label}</div>
    </Card>
  );
}
