import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Primitif tampilan panel admin.
 *
 * Sebelumnya halaman admin ditulis dengan markup bertema terang (`bg-white`,
 * `text-primary-950`, `border-neutral-200`) lalu dipaksa gelap oleh selektor
 * `!important` di `globals.css`. Cara itu rapuh: `[class*="bg-white"]` juga
 * mengenai `bg-white/[0.04]`, dan `[class*="text-primary-"]` meratakan seluruh
 * hierarki teks menjadi satu warna.
 *
 * Komponen di bawah menulis warna gelapnya sendiri, sehingga tidak bergantung
 * pada lapisan penimpa itu sama sekali.
 */

export const PANEL_SURFACE =
  "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl shadow-[0_18px_50px_rgba(2,6,23,0.28)]";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10";

export const selectClass =
  "w-full rounded-xl border border-white/10 bg-[#0a1626] px-3.5 py-2.5 text-sm text-white transition focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10";

export const textareaClass = `${inputClass} min-h-[96px] leading-relaxed`;

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-cyan-300/30 bg-cyan-300/12 text-cyan-100 hover:bg-cyan-300/20 hover:border-cyan-300/45",
  secondary: "border-white/12 bg-white/[0.05] text-slate-100 hover:bg-white/[0.09]",
  ghost: "border-transparent bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white",
  danger: "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/18",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2.5 text-sm",
};

/** Kelas tombol dipakai lewat `className` agar bisa dipasang di `button`, `a`, maupun `Link`. */
export function btn(variant: ButtonVariant = "secondary", size: ButtonSize = "md") {
  return `inline-flex items-center justify-center rounded-full border font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-55 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-white/12 bg-white/[0.06] text-slate-300",
  success: "border-emerald-400/25 bg-emerald-500/12 text-emerald-200",
  warning: "border-amber-400/25 bg-amber-500/12 text-amber-200",
  danger: "border-red-400/25 bg-red-500/12 text-red-200",
  info: "border-cyan-300/25 bg-cyan-300/12 text-cyan-100",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "",
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Dimatikan bila isinya tabel yang menempel ke tepi panel. */
  padded?: boolean;
}) {
  const hasHeader = Boolean(title || actions || description);

  return (
    <section className={`${PANEL_SURFACE} ${className}`}>
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`${padded ? "p-5" : ""} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
          {icon}
        </span>
      )}
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Tabel selalu bisa digulir sendiri agar halaman tidak ikut melebar. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="group relative overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:hidden" />
    </div>
  );
}

export function Th({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      className={`whitespace-nowrap border-b border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border-b border-white/[0.05] px-4 py-3 align-middle text-slate-200 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`transition hover:bg-white/[0.03] ${className}`}>{children}</tr>;
}

/** Baris ringkas "label → nilai" untuk daftar di dashboard. */
export function ListRow({
  href,
  primary,
  secondary,
  trailing,
}: {
  href?: string;
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
}) {
  const body = (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{primary}</p>
        {secondary && <p className="mt-0.5 truncate text-xs text-slate-500">{secondary}</p>}
      </div>
      {trailing && <div className="shrink-0 text-xs text-slate-400">{trailing}</div>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
