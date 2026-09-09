"use client";

import { forwardRef } from "react";
import clsx from "clsx";
import { Mail, Phone, ExternalLink, MoreHorizontal, User } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface TeamMemberCardProps {
  /** Member ID */
  id: string;
  /** Member name */
  name: string;
  /** Member role/position */
  role?: string;
  /** Avatar image URL */
  avatar?: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Department */
  department?: string;
  /** Show contact buttons */
  showContactButtons?: boolean;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function generateAvatarColor(name: string): string {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
    "from-purple-500 to-violet-600",
    "from-cyan-500 to-sky-600",
    "from-indigo-500 to-purple-600",
    "from-red-500 to-pink-600",
  ];

  const hash = name.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// Component
// ============================================================================

/**
 * TeamMemberCard - Display a team member with avatar, name, role, and contact options
 *
 * @example
 * ```tsx
 * <TeamMemberCard
 *   id="user-1"
 *   name="Ahmad Wijaya"
 *   role="Project Manager"
 *   email="ahmad@santra.co.id"
 *   phone="+62 812 3456 7890"
 * />
 *
 * // Without contact buttons
 * <TeamMemberCard
 *   name="Budi Santoso"
 *   role="Site Engineer"
 *   showContactButtons={false}
 * />
 * ```
 */
export const TeamMemberCard = forwardRef<HTMLDivElement, TeamMemberCardProps>(
  (
    {
      id,
      name,
      role,
      avatar,
      phone,
      email,
      department,
      showContactButtons = true,
      onClick,
      onMoreClick,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const initials = getInitials(name);
    const avatarGradient = generateAvatarColor(name);

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={clsx(
            "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5",
            className
          )}
          role="status"
          aria-label="Loading team member"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mb-3" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5",
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
        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            {avatar ? (
              <img
                src={avatar}
                alt={`${name}'s avatar`}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-slate-800"
              />
            ) : (
              <div
                className={clsx(
                  "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold ring-4 ring-white dark:ring-slate-800",
                  avatarGradient
                )}
                role="img"
                aria-label={`${name}'s avatar`}
              >
                {initials}
              </div>
            )}

            {/* Online indicator (optional) */}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>

          {/* Name */}
          <h4 className="font-semibold text-slate-900 dark:text-white">{name}</h4>

          {/* Role */}
          {role && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{role}</p>
          )}

          {/* Department */}
          {department && !role && (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{department}</p>
          )}
        </div>

        {/* Contact buttons */}
        {showContactButtons && (phone || email) && (
          <div className="flex items-center justify-center gap-2">
            {phone && (
              <a
                href={`tel:${phone}`}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Telepon</span>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
          </div>
        )}

        {/* More button */}
        {onMoreClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoreClick();
            }}
            className={clsx(
              "absolute top-3 right-3 p-2 rounded-lg transition-colors",
              "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
              "dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700",
              "opacity-0 group-hover:opacity-100"
            )}
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

TeamMemberCard.displayName = "TeamMemberCard";

// ============================================================================
// Compact Variant
// ============================================================================

export interface TeamMemberCompactProps {
  name: string;
  role?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * TeamMemberCompact - Compact horizontal team member display
 *
 * @example
 * ```tsx
 * <TeamMemberCompact
 *   name="Ahmad Wijaya"
 *   role="Project Manager"
 *   phone="+62 812 3456 7890"
 * />
 * ```
 */
export const TeamMemberCompact = forwardRef<HTMLDivElement, TeamMemberCompactProps>(
  ({ name, role, avatar, phone, email, onClick, className }, ref) => {
    const initials = getInitials(name);
    const avatarGradient = generateAvatarColor(name);

    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-center gap-3 p-2 rounded-lg",
          "hover:bg-slate-50 dark:hover:bg-slate-800",
          onClick && "cursor-pointer transition-colors",
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Avatar */}
        {avatar ? (
          <img
            src={avatar}
            alt={`${name}'s avatar`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className={clsx(
              "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold",
              avatarGradient
            )}
          >
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{name}</p>
          {role && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{role}</p>
          )}
        </div>

        {/* Quick actions */}
        {(phone || email) && (
          <div className="flex items-center gap-1">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
);

TeamMemberCompact.displayName = "TeamMemberCompact";

// ============================================================================
// Export
// ============================================================================

export default TeamMemberCard;
