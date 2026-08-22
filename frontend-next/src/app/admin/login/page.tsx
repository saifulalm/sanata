import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_80%_18%,_rgba(239,135,69,0.15),_transparent_22%),linear-gradient(180deg,_#06111f_0%,_#081421_100%)] px-4 py-24">
      <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
                "linear-gradient(rgba(125,211,252,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.35) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
        }}
      />
          <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_35px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="mb-6 flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-white/10 font-display text-base font-bold text-cyan-100 shadow-[0_0_24px_rgba(56,189,248,0.16)]">
                SR
          </span>
        </div>
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Futuristic Control Access</p>
            <p className="mb-6 text-center text-sm text-slate-400">Masuk ke panel admin Sanata Construction</p>

        <LoginForm next={params.next ?? "/admin"} />

            <Link href="/" className="mt-6 block text-center text-xs uppercase tracking-[0.18em] text-slate-500 hover:text-cyan-300">
          &larr; Kembali ke situs
        </Link>
      </div>
    </div>
  );
}
