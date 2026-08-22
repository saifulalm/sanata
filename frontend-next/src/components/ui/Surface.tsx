import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

/**
 * Primitif permukaan untuk tema gelap situs publik.
 *
 * Sebelumnya halaman-halaman publik masih memakai kelas tema terang
 * (`bg-white`, `text-neutral-500`) lalu dipaksa gelap lewat aturan `!important`
 * global. Komponen di sini membuat gayanya eksplisit di markup, sehingga
 * lapisan paksaan itu bisa dilepas dan tampilannya bisa diprediksi.
 */

/** Kartu kaca — permukaan utama, dipakai untuk blok konten di atas latar gelap. */
export function GlassPanel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Kartu dalam — lebih pekat, untuk elemen yang bersarang di dalam GlassPanel. */
export function InsetCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-[1.4rem] border border-white/10 bg-slate-950/65", className)} {...props}>
      {children}
    </div>
  );
}

/** Bingkai ikon persegi dengan aksen sian. */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Chip filter kategori. */
export function FilterPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition",
        active
          ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
      )}
    >
      {children}
    </Link>
  );
}

/** Kelas bersama untuk input form di situs publik. */
export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/45 focus:outline-none focus:ring-2 focus:ring-cyan-300/20";

/** Label eyebrow kecil di atas judul bagian. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx("text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300", className)}>{children}</p>
  );
}

/** Teks saat daftar kosong. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="mt-12 rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-12 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}
