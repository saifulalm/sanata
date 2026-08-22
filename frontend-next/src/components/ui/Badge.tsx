import type { ReactNode } from "react";
import clsx from "clsx";

const tones = {
  neutral: "border-white/15 bg-white/10 text-slate-200",
  success: "border-emerald-300/35 bg-emerald-400/15 text-emerald-100",
  gold: "border-amber-300/35 bg-amber-400/15 text-amber-100",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
