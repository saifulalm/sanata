import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */

type Variant = "primary" | "secondary" | "ghost" | "desert" | "outline";
type Size = "sm" | "md" | "lg";

/* ── Variant Styles ────────────────────────────────────────────────── */

const variants: Record<Variant, string> = {
  /**
   * Primary – solid Desert fill.
   * Used for the most important CTA on a section.
   */
  primary:
    "bg-desert-400 text-charcoal-900 font-semibold border border-transparent " +
    "hover:bg-desert-300 hover:shadow-desert-md active:bg-desert-500",

  /**
   * Secondary – outline with Desert border.
   * Used for secondary actions.
   */
  secondary:
    "bg-transparent text-desert-400 border border-desert-400/60 " +
    "hover:bg-desert-400/10 hover:border-desert-400 hover:shadow-desert-subtle active:bg-desert-400/15",

  /**
   * Outline – white border, transparent bg.
   * Backwards-compatible alias used by existing pages.
   */
  outline:
    "bg-transparent text-charcoal-50 border border-charcoal-400/40 " +
    "hover:bg-white/[0.05] hover:border-charcoal-300/60",

  /**
   * Ghost – no background, Desert text.
   * Used for tertiary actions or inline links.
   */
  ghost:
    "bg-transparent text-desert-400 border border-transparent " +
    "hover:text-desert-300 hover:bg-desert-400/8",

  /**
   * Desert – Charcoal bg with Desert border accent.
   * Used for featured/highlight cards.
   */
  desert:
    "bg-charcoal-800 text-desert-200 border border-desert-400/30 " +
    "hover:bg-charcoal-700 hover:border-desert-400/50 hover:shadow-desert-subtle",
};

/* ── Size Styles ───────────────────────────────────────────────────── */

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase rounded-full gap-1.5",
  md: "px-6 py-3 text-sm font-semibold tracking-[0.14em] uppercase rounded-full gap-2",
  lg: "px-8 py-4 text-base font-semibold tracking-[0.12em] uppercase rounded-full gap-2.5",
};

/* ── Base ──────────────────────────────────────────────────────────── */

const base =
  "inline-flex items-center justify-center " +
  "transition-all duration-250 ease-brand cursor-pointer select-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-desert-400";

const disabled = "opacity-40 cursor-not-allowed pointer-events-none";

/* ── Icon animation ───────────────────────────────────────────────── */

const iconBase = "transition-transform duration-250 ease-brand shrink-0";

/* ── Arrow icon ───────────────────────────────────────────────────── */

function ArrowIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Components ───────────────────────────────────────────────────── */

/**
 * Button as anchor (`<a>` / Next.js Link)
 */
export function Button({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  withArrow = false,
  loading = false,
  disabled: isDisabled = false,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  withArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const arrowSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <Link
      href={href}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        (isDisabled || loading) && disabled,
        className
      )}
      aria-disabled={isDisabled || loading}
      {...props}
    >
      {loading && <Loader2 size={arrowSize} className={`${iconBase} animate-spin`} />}
      {!loading && children}
      {!loading && withArrow && <ArrowIcon size={arrowSize} className={iconBase} />}
    </Link>
  );
}

/**
 * Button as `<button>` element
 */
export function ButtonAsButton({
  variant = "primary",
  size = "md",
  className,
  children,
  withArrow = false,
  loading = false,
  disabled: isDisabled = false,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  withArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const arrowSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        (isDisabled || loading) && disabled,
        className
      )}
      disabled={isDisabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 size={arrowSize} className={`${iconBase} animate-spin`} />}
      {!loading && children}
      {!loading && withArrow && <ArrowIcon size={arrowSize} className={iconBase} />}
    </button>
  );
}
