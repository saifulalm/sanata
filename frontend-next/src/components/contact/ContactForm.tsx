"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { submitInquiry, type ContactFormState } from "@/app/(public)/contact/actions";

const initialState: ContactFormState = { status: "idle" };

const fieldClass =
  "w-full rounded-2xl border border-cyan-300/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/15";

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-400";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-cyan-300/35 bg-cyan-300/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-300/20 disabled:opacity-60"
    >
      {pending ? "Mengirim..." : "Kirim Permintaan Penawaran"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitInquiry, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
      {state.status === "success" && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {state.message}
        </div>
      )}
      {state.status === "error" && state.message && !state.fieldErrors && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-400/15 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Nama Lengkap
          </label>
          <input id="contact-name" name="name" required className={fieldClass} placeholder="Nama Anda" />
          {state.fieldErrors?.name && <p className="mt-1 text-xs text-red-400">{state.fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className={fieldClass}
            placeholder="nama@email.com"
          />
          {state.fieldErrors?.email && <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className={labelClass}>
            Nomor Telepon
          </label>
          <input id="contact-phone" name="phone" className={fieldClass} placeholder="08xx-xxxx-xxxx" />
        </div>
        <div>
          <label htmlFor="contact-service" className={labelClass}>
            Layanan yang Diminati
          </label>
          <input id="contact-service" name="service" className={fieldClass} placeholder="Contoh: Renovasi Rumah" />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Pesan / Kebutuhan Proyek
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className={fieldClass}
          placeholder="Ceritakan kebutuhan proyek Anda..."
        />
        {state.fieldErrors?.message && <p className="mt-1 text-xs text-red-400">{state.fieldErrors.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-preferred-channel" className={labelClass}>
            Kanal Follow Up
          </label>
          <select
            id="contact-preferred-channel"
            name="preferredChannel"
            defaultValue="EMAIL"
            className={fieldClass}
          >
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="TELEGRAM">Telegram</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          <input
            type="checkbox"
            name="marketingConsent"
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent"
          />
          <span>
            Saya setuju dihubungi kembali melalui kanal yang dipilih untuk tindak lanjut penawaran.
          </span>
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
