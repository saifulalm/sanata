"use client";

type ProgressSize = "sm" | "md" | "lg" | "xl";
type ProgressColor = "primary" | "success" | "warning" | "danger";

interface ProgressProps {
  value: number;
  size?: ProgressSize;
  color?: ProgressColor;
  animated?: boolean;
  showLabel?: boolean;
  className?: string;
}

const sizeClasses: Record<ProgressSize, string> = {
  sm: "cp-progress-sm",
  md: "",
  lg: "cp-progress-lg",
  xl: "cp-progress-xl",
};

const colorClasses: Record<ProgressColor, string> = {
  primary: "cp-progress-primary",
  success: "cp-progress-success",
  warning: "cp-progress-warning",
  danger: "cp-progress-danger",
};

function getAutoColor(percent: number): ProgressColor {
  if (percent >= 90) return "success";
  if (percent >= 70) return "primary";
  if (percent >= 50) return "warning";
  return "danger";
}

function getAutoSize(percent: number): ProgressSize {
  if (percent >= 90) return "md";
  return "sm";
}

export function Progress({
  value,
  size,
  color,
  animated = false,
  showLabel = false,
  className = "",
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const autoColor = color || getAutoColor(clampedValue);
  const autoSize = size || getAutoSize(clampedValue);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">Progress</span>
          <span className="font-medium text-slate-900">{clampedValue.toFixed(1)}%</span>
        </div>
      )}
      <div className={`cp-progress ${sizeClasses[autoSize]} ${animated ? "cp-progress-animated" : ""}`}>
        <div
          className={`cp-progress-bar ${colorClasses[autoColor]}`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  planned?: number;
  className?: string;
}

export function ProgressBar({ value, planned, className = "" }: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Progress</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      {planned !== undefined && (
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-200 rounded" />
            Rencana
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded" />
            Realisasi
          </span>
        </div>
      )}
    </div>
  );
}
