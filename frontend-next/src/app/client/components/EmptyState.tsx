"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { type LucideIcon, FolderOpen } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface EmptyStateProps {
  /** Icon component (default: FolderOpen) */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
    variant?: "primary" | "secondary" | "outline";
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
  /** Custom illustration */
  illustration?: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * EmptyState - Display an empty state with illustration, title, and action
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No projects found"
 *   description="Start by creating your first project"
 *   action={{ label: "Create Project", onClick: handleCreate }}
 * />
 *
 * // With custom icon
 * <EmptyState
 *   icon={FileText}
 *   title="No documents"
 *   description="Upload your first document to get started"
 *   action={{ label: "Upload", href: "/upload" }}
 * />
 * ```
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon: Icon = FolderOpen,
      title,
      description,
      action,
      secondaryAction,
      illustration,
      size = "md",
      className,
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        iconWrapper: "w-12 h-12",
        icon: "w-6 h-6",
        title: "text-base",
        description: "text-sm",
        spacing: "gap-3",
      },
      md: {
        iconWrapper: "w-16 h-16",
        icon: "w-8 h-8",
        title: "text-lg",
        description: "text-sm",
        spacing: "gap-4",
      },
      lg: {
        iconWrapper: "w-20 h-20",
        icon: "w-10 h-10",
        title: "text-xl",
        description: "text-base",
        spacing: "gap-5",
      },
    };

    const config = sizeConfig[size];

    // Button variant classes
    const getButtonClasses = (variant: "primary" | "secondary" | "outline" = "primary") => {
      switch (variant) {
        case "primary":
          return "bg-blue-600 text-white hover:bg-blue-700 shadow-sm";
        case "secondary":
          return "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600";
        case "outline":
          return "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800";
        default:
          return "bg-blue-600 text-white hover:bg-blue-700";
      }
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={clsx(
          "flex flex-col items-center justify-center text-center p-8",
          config.spacing,
          className
        )}
      >
        {/* Illustration or Icon */}
        <div className="mb-2">
          {illustration ? (
            illustration
          ) : (
            <div
              className={clsx(
                "rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center",
                config.iconWrapper
              )}
            >
              <Icon
                className={clsx(
                  "text-slate-400 dark:text-slate-500",
                  config.icon
                )}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={clsx("font-semibold text-slate-900 dark:text-white", config.title)}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className={clsx("text-slate-500 dark:text-slate-400 max-w-sm", config.description)}>
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            {action && (
              action.href ? (
                <a
                  href={action.href}
                  className={clsx(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
                    getButtonClasses(action.variant)
                  )}
                >
                  {action.icon && <action.icon className="w-4 h-4" aria-hidden="true" />}
                  {action.label}
                </a>
              ) : (
                <button
                  onClick={action.onClick}
                  className={clsx(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
                    getButtonClasses(action.variant)
                  )}
                >
                  {action.icon && <action.icon className="w-4 h-4" aria-hidden="true" />}
                  {action.label}
                </button>
              )
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}

        {/* Screen reader announcement */}
        <span className="sr-only">
          {title}. {description}
        </span>
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

// ============================================================================
// Export
// ============================================================================

export default EmptyState;
