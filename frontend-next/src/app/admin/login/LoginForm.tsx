"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

const fieldClass =
  "w-full rounded-2xl border border-cyan-300/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20";

function SubmitButton({ requiresTwoFactor }: { requiresTwoFactor: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
            className="w-full rounded-full border border-cyan-300/35 bg-cyan-300/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 transition-colors hover:bg-cyan-300/20 disabled:opacity-60"
    >
      {pending ? "Memproses..." : requiresTwoFactor ? "Verifikasi" : "Masuk"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const requiresTwoFactor = state.status === "requiresTwoFactor";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Email</label>
        <input name="email" type="email" required disabled={requiresTwoFactor} defaultValue="admin@sanata.id" className={fieldClass} />
      </div>
      <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Kata Sandi</label>
        <input name="password" type="password" required disabled={requiresTwoFactor} className={fieldClass} />
      </div>

      {requiresTwoFactor && (
        <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Kode Autentikasi (6 digit)</label>
          <input name="totpCode" inputMode="numeric" maxLength={6} required autoFocus className={fieldClass} />
        </div>
      )}

      {state.message && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-400/15 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {state.message}
        </div>
      )}

      <SubmitButton requiresTwoFactor={requiresTwoFactor} />
    </form>
  );
}
