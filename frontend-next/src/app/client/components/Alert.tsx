"use client";

import { ReactNode } from "react";
import { LucideIcon, Info, CheckCircle, AlertTriangle, XCircle, AlertCircle } from "lucide-react";

type AlertVariant = "primary" | "success" | "warning" | "danger" | "info";

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  icon?: LucideIcon;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: LucideIcon; className: string }> = {
  primary: { icon: Info, className: "cp-alert-primary" },
  success: { icon: CheckCircle, className: "cp-alert-success" },
  warning: { icon: AlertTriangle, className: "cp-alert-warning" },
  danger: { icon: XCircle, className: "cp-alert-danger" },
  info: { icon: AlertCircle, className: "cp-alert-info" },
};

export function Alert({ children, variant = "info", title, icon, className = "" }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  return (
    <div className={`cp-alert ${config.className} ${className}`}>
      <Icon className="cp-alert-icon w-5 h-5" />
      <div className="cp-alert-content">
        {title && <h4 className="cp-alert-title">{title}</h4>}
        <div className="cp-alert-description">{children}</div>
      </div>
    </div>
  );
}
