"use client";

import { useEffect, useState, forwardRef, useId } from "react";
import clsx from "clsx";

// ============================================================================
// Types
// ============================================================================

export interface ProgressRingProps {
  /** Progress percentage (0-100) */
  percent: number;
  /** Ring size in pixels (default: 120) */
  size?: number;
  /** Stroke width in pixels (default: auto-calculated) */
  strokeWidth?: number;
  /** Progress color (default: blue-500) */
  progressColor?: string;
  /** Background track color (default: slate-200) */
  trackColor?: string;
  /** Center content */
  children?: React.ReactNode;
  /** Animation duration in ms (default: 1000) */
  animationDuration?: number;
  /** Show percentage text in center (default: true) */
  showPercent?: boolean;
  /** Percent text size class (default: text-2xl) */
  percentTextSize?: string;
  /** Additional CSS classes for container */
  className?: string;
  /** Additional CSS classes for SVG */
  svgClassName?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProgressRing - SVG circular progress indicator with animation
 *
 * @example
 * ```tsx
 * <ProgressRing percent={75} size={120} />
 *
 * // With custom colors
 * <ProgressRing
 *   percent={90}
 *   progressColor="bg-emerald-500"
 *   trackColor="bg-emerald-100"
 * />
 *
 * // With custom center content
 * <ProgressRing percent={50}>
 *   <div className="text-center">
 *     <p className="text-2xl font-bold">50%</p>
 *     <p className="text-xs text-slate-500">Complete</p>
 *   </div>
 * </ProgressRing>
 * ```
 */
export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      percent,
      size = 120,
      strokeWidth,
      progressColor = "stroke-blue-500",
      trackColor = "stroke-slate-200",
      children,
      animationDuration = 1000,
      showPercent = true,
      percentTextSize = "text-2xl",
      className,
      svgClassName,
    },
    ref
  ) => {
    const id = useId();
    const [animatedPercent, setAnimatedPercent] = useState(0);

    // Calculate stroke width
    const stroke = strokeWidth ?? Math.max(size * 0.1, 8);

    // Calculate radius and dimensions
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;

    // Clamp percentage
    const clampedPercent = Math.min(100, Math.max(0, percent));

    // Calculate stroke dash
    const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;

    // Animate on mount and when percent changes
    useEffect(() => {
      const startTime = Date.now();
      const startValue = animatedPercent;
      const endValue = clampedPercent;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentValue = startValue + (endValue - startValue) * eased;
        setAnimatedPercent(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [clampedPercent, animationDuration]);

    return (
      <div
        ref={ref}
        className={clsx("relative inline-flex items-center justify-center", className)}
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${Math.round(clampedPercent)}%`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={clsx("-rotate-90", svgClassName)}
        >
          {/* Track (background circle) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className={clsx(trackColor, "dark:stroke-slate-700")}
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={clsx(progressColor, "transition-all duration-300")}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children ?? (
            showPercent && (
              <span className={clsx("font-bold text-slate-900 dark:text-white", percentTextSize)}>
                {Math.round(animatedPercent)}%
              </span>
            )
          )}
        </div>
      </div>
    );
  }
);

ProgressRing.displayName = "ProgressRing";

// ============================================================================
// Variant: Mini Progress Ring (for inline use)
// ============================================================================

export interface MiniProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  trackColor?: string;
  className?: string;
}

/**
 * MiniProgressRing - Compact SVG circular progress indicator
 *
 * @example
 * ```tsx
 * <MiniProgressRing percent={75} size={32} />
 * ```
 */
export const MiniProgressRing = forwardRef<HTMLDivElement, MiniProgressRingProps>(
  (
    {
      percent,
      size = 32,
      strokeWidth,
      progressColor = "stroke-blue-500",
      trackColor = "stroke-slate-200",
      className,
    },
    ref
  ) => {
    const stroke = strokeWidth ?? Math.max(size * 0.15, 3);
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;

    const clampedPercent = Math.min(100, Math.max(0, percent));
    const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

    return (
      <div
        ref={ref}
        className={clsx("relative inline-flex items-center justify-center", className)}
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${Math.round(clampedPercent)}%`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className={clsx(trackColor, "dark:stroke-slate-700")}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={clsx(progressColor, "transition-all duration-300")}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
      </div>
    );
  }
);

MiniProgressRing.displayName = "MiniProgressRing";

// ============================================================================
// Export
// ============================================================================

export default ProgressRing;
