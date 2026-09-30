import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

/* ─────────────────────────────────────────────────────────────────
   Surface Primitives — Sanata Brand Design System
   Surfaces are layered backgrounds for the Charcoal + Desert palette.
   ──────────────────────────────────────────────────────────────── */

/** Glass panel — primary surface for content cards. */
export function GlassPanel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/[0.07]",
        "bg-white/[0.03]",
        "shadow-brand-md",
        "backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Inset card — darker, for nested content. */
export function InsetCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/[0.05]",
        "bg-charcoal-800/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Charcoal surface — solid brand base. */
export function CharcoalSurface({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-charcoal-700/50",
        "bg-charcoal-800",
        "shadow-brand-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Desert accent tile — for icon containers. */
/** @deprecated Use DesertTile or CharcoalTile for brand-aligned tiles. */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center",
        "w-12 h-12",
        "rounded-xl",
        "border border-desert-400/20",
        "bg-desert-400/10",
        "text-desert-300",
        className
      )}
    >
      {children}
    </div>
  );
}
export function DesertTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center",
        "w-12 h-12",
        "rounded-xl",
        "border border-desert-400/20",
        "bg-desert-400/10",
        "text-desert-300",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Desert accent tile — large variant. */
export function DesertTileLg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center",
        "w-16 h-16",
        "rounded-2xl",
        "border border-desert-400/25",
        "bg-desert-400/8",
        "text-desert-300",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Charcoal tile — for neutral icon containers. */
export function CharcoalTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center",
        "w-12 h-12",
        "rounded-xl",
        "border border-charcoal-600/50",
        "bg-charcoal-700/60",
        "text-charcoal-200",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Divider with Desert accent. */
export function DesertDivider({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "h-px w-full",
        "bg-gradient-to-r from-transparent",
        "via-desert-400/40 to-transparent",
        className
      )}
    />
  );
}

/** Filter pill – category/tag selector. */
export function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={clsx(
        "inline-flex items-center",
        "rounded-full border px-4 py-1.5",
        "text-xs font-semibold uppercase tracking-[0.16em]",
        "transition-all duration-200",
        active
          ? "border-desert-400/50 bg-desert-400/12 text-desert-300"
          : "border-charcoal-600/40 bg-charcoal-800/40 text-charcoal-200/70 hover:border-desert-400/30 hover:text-desert-300"
      )}
    >
      {children}
    </a>
  );
}

/** Eyebrow label — small overline text above section headings. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx("eyebrow-desert", className)}>{children}</p>
  );
}

/** Empty state placeholder. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      className={clsx(
        "mt-12 rounded-3xl",
        "border border-dashed border-charcoal-600/40",
        "bg-charcoal-800/30",
        "p-12 text-center",
        "text-sm text-charcoal-400"
      )}
    >
      {children}
    </div>
  );
}

/** Brand input class — shared form input style. */
export const inputClass =
  "w-full rounded-xl border border-charcoal-600/50 bg-charcoal-800/50 " +
  "px-3 py-2.5 text-sm text-charcoal-100 " +
  "placeholder:text-charcoal-500 " +
  "focus:border-desert-400/50 focus:outline-none " +
  "focus:ring-2 focus:ring-desert-400/15 " +
  "transition-colors duration-200";
