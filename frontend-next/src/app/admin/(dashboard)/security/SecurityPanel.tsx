"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { setupTwoFactorAction, enableTwoFactorAction, disableTwoFactorAction, type TwoFactorSetup, type TwoFactorState } from "./actions";
import { PageHeader, Panel } from "@/components/admin/ui";

const initialState: TwoFactorState = { status: "idle" };

function SubmitButton({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
        danger
          ? "border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/18"
          : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
      }`}
    >
      {pending ? "Memproses..." : label}
    </button>
  );
}

export function SecurityPanel({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [setupError, setSetupError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [enableState, enableAction] = useActionState(enableTwoFactorAction, initialState);
  const [disableState, disableAction] = useActionState(disableTwoFactorAction, initialState);

  const [prevActionStates, setPrevActionStates] = useState({ enableState, disableState });
  if (prevActionStates.enableState !== enableState || prevActionStates.disableState !== disableState) {
    setPrevActionStates({ enableState, disableState });
    if (enableState.status === "success" || disableState.status === "success") {
      setSetup(null);
    }
  }

  useEffect(() => {
    if (enableState.status === "success" || disableState.status === "success") {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableState, disableState]);

  const handleSetup = () => {
    setSetupError("");
    startTransition(async () => {
      const result = await setupTwoFactorAction();
      if (result.ok) setSetup(result.data);
      else setSetupError(result.message);
    });
  };

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        eyebrow="Sistem"
        title="Keamanan Akun"
        description="Kelola autentikasi dua faktor (2FA) untuk akun Anda."
      />

      <Panel>
        {twoFactorEnabled ? (
          <>
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              <p className="text-sm font-medium text-emerald-200">2FA aktif di akun Anda</p>
            </div>
            <form action={disableAction} className="space-y-4">
              <label className="block text-xs font-medium uppercase tracking-widest text-slate-400">
                Masukkan kode 2FA untuk menonaktifkan
              </label>
              <input
                name="code"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="000000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
              />
              {disableState.status === "error" && (
                <p className="text-sm text-red-400">{disableState.message}</p>
              )}
              <SubmitButton label="Nonaktifkan 2FA" danger />
            </form>
          </>
        ) : setup ? (
          <form action={enableAction} className="space-y-4">
            <p className="text-sm text-slate-400">
              Scan QR code berikut dengan aplikasi authenticator (Google Authenticator, Authy, dll), lalu masukkan kode 6 digit untuk konfirmasi.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrCodeDataUrl} alt="QR Code 2FA" className="mx-auto h-44 w-44 rounded-xl border border-white/10" />
            <p className="break-all rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center font-mono text-xs text-slate-400">
              {setup.secret}
            </p>
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-400">
              Kode Verifikasi (6 digit)
            </label>
            <input
              name="code"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              placeholder="000000"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10"
            />
            {enableState.status === "error" && (
              <p className="text-sm text-red-400">{enableState.message}</p>
            )}
            <SubmitButton label="Konfirmasi & Aktifkan" />
          </form>
        ) : (
          <>
            <p className="text-sm text-slate-400">
              2FA belum aktif. Aktifkan untuk menambah lapisan keamanan pada akun admin Anda.
            </p>
            {setupError && <p className="mt-2 text-sm text-red-400">{setupError}</p>}
            <button
              onClick={handleSetup}
              disabled={isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-60"
            >
              <ShieldCheck size={15} /> {isPending ? "Memuat..." : "Aktifkan 2FA"}
            </button>
          </>
        )}
      </Panel>
    </div>
  );
}
