import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Re-export from ui.tsx
export { Badge, EmptyState, PageHeader, Panel, Toolbar, TableWrap, Th, Td, Tr } from "./ui";
// Table helpers
export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition hover:bg-white/[0.03]", className)}>{children}</tr>;
}
export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("border-b border-white/5 px-4 py-3 align-middle text-slate-200", className)}>{children}</td>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-cyan-300/30 bg-cyan-300/12 text-cyan-100 hover:bg-cyan-300/20 hover:border-cyan-300/45",
  secondary: "border-white/12 bg-white/[0.05] text-slate-100 hover:bg-white/[0.09]",
  ghost: "border-transparent bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white",
  danger: "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/18",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2.5 text-sm",
  lg: "gap-2 px-6 py-3 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

// Dialog Component
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1626] p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 border-t border-white/10 pt-4">{footer}</div>}
      </div>
    </div>
  );
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10",
          error && "border-rose-500/40",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10",
          error && "border-rose-500/40",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10",
          error && "border-rose-500/40",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

// Card Component
interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/10 bg-white/[0.03] p-5",
      className
    )}>
      {children}
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm transition",
            p === page
              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
              : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/18 hover:bg-white/[0.07]"
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400 transition hover:border-white/18 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

// Tabs Component
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
            activeTab === tab.id
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/20"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Toast Hook
type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

// Re-export empty Toast component for compatibility
export function Toast() { return null; }

export function useToast() {
  const show = (message: string, type: ToastType = "info") => {
    // Simple alert for now - in production would use a toast library
    if (typeof window !== "undefined") {
      if (type === "success") {
        console.log(`✓ ${message}`);
      } else if (type === "error") {
        console.error(`✗ ${message}`);
      } else {
        console.log(message);
      }
    }
  };

  return { toast: show };
}
