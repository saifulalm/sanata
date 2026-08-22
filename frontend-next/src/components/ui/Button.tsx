import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight } from "lucide-react";

type Variant = "primary" | "gold" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  primary: "border border-cyan-300/35 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20",
  gold: "border border-gold-400/35 bg-gold-500/15 text-amber-100 hover:bg-gold-500/25",
  outline: "border border-white/15 bg-white/[0.04] text-white hover:bg-white/10",
  ghost: "text-cyan-100 hover:bg-white/6",
};

const base =
  "group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all duration-300 font-accent backdrop-blur-xl";

export function Button({
  href,
  variant = "primary",
  className,
  children,
  withArrow = true,
  ...props
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  withArrow?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={clsx(base, variants[variant], className)} {...props}>
      {children}
      {withArrow && (
        <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </Link>
  );
}

export function ButtonAsButton({
  variant = "primary",
  className,
  children,
  ...props
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
