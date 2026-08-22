"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Settings2,
  Smartphone,
  X,
} from "lucide-react";
import {
  getBroadcastConnectionSessionAction,
  quickConnectWhatsAppAction,
  refreshBroadcastConnectionQrAction,
  requestWhatsAppPairingCodeAction,
  startBroadcastConnectionSessionAction,
} from "./actions";
import type { BroadcastConnection, BroadcastConnectionSession } from "@/lib/adminResources";

/** Jeda polling status session. Cukup cepat untuk terasa langsung, cukup lambat
 *  agar tidak membanjiri gateway saat dialog dibiarkan terbuka. */
const POLL_MS = 3000;

export type WhatsAppDialogTarget =
  | { mode: "new" }
  | { mode: "existing"; connection: BroadcastConnection };

const STEP_HINTS = [
  "Buka WhatsApp di ponsel yang akan dipakai mengirim.",
  "Ketuk Menu (⋮) atau Pengaturan › Perangkat Tertaut.",
  "Ketuk Tautkan Perangkat, lalu arahkan kamera ke QR di layar ini.",
];

function secondsLeft(expiresAt: string | null, now: number) {
  if (!expiresAt) return null;
  const diff = Math.round((new Date(expiresAt).getTime() - now) / 1000);
  return diff > 0 ? diff : 0;
}

export function WhatsAppQrDialog({
  target,
  onClose,
}: {
  target: WhatsAppDialogTarget;
  onClose: () => void;
}) {
  const isExisting = target.mode === "existing";
  const [connectionId, setConnectionId] = useState<string | null>(
    isExisting ? target.connection.id : null
  );
  const [session, setSession] = useState<BroadcastConnectionSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pairingPhone, setPairingPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  // Mencegah beberapa permintaan refresh berjalan bersamaan saat QR kedaluwarsa.
  const refreshingRef = useRef(false);

  const connected = session?.state === "CONNECTED";
  const remaining = secondsLeft(session?.qrExpiresAt ?? null, now);

  const loadStatus = useCallback(async (id: string) => {
    const result = await getBroadcastConnectionSessionAction(id);
    if (result.data) setSession(result.data);
    else if (result.message) setError(result.message);
  }, []);

  const refreshQr = useCallback(async (id: string) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const result = await refreshBroadcastConnectionQrAction(id);
      if (result.data) setSession(result.data);
      if (!result.ok && result.message) setError(result.message);
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  // Akun yang sudah ada: langsung minta session supaya QR muncul tanpa klik lagi.
  useEffect(() => {
    if (!isExisting) return;
    const id = target.connection.id;
    startTransition(async () => {
      const result = await startBroadcastConnectionSessionAction(id);
      if (result.data) setSession(result.data);
      else if (result.message) setError(result.message);
    });
  }, [isExisting, target]);

  // Polling status + jam untuk hitung mundur QR.
  useEffect(() => {
    if (!connectionId || connected) return;

    const poll = setInterval(() => void loadStatus(connectionId), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [connectionId, connected, loadStatus]);

  // QR WhatsApp kedaluwarsa cepat — perbarui sendiri agar admin tidak melihat
  // kode mati yang gagal terus saat dipindai.
  useEffect(() => {
    if (!connectionId || connected || remaining === null || remaining > 0) return;
    void refreshQr(connectionId);
  }, [connectionId, connected, remaining, refreshQr]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleCreate(formData: FormData) {
    const label = String(formData.get("label") ?? "").trim();
    if (label.length < 2) {
      setError("Nama perangkat minimal 2 karakter.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await quickConnectWhatsAppAction({
        label,
        senderIdentity: String(formData.get("senderIdentity") ?? ""),
        gatewayUrl: String(formData.get("gatewayUrl") ?? ""),
        apiKey: String(formData.get("apiKey") ?? ""),
        isPrimary: formData.get("isPrimary") === "on",
      });

      if (!result.ok) {
        setError(result.message ?? "Gagal membuat perangkat WhatsApp.");
        return;
      }

      setConnectionId(result.connectionId ?? null);
      if (result.data) setSession(result.data);
      setNotice(result.message ?? null);
    });
  }

  function handlePairingCode() {
    if (!connectionId) return;
    const phone = pairingPhone.replace(/\D/g, "");
    if (phone.length < 8) {
      setError("Isi nomor WhatsApp lengkap, contoh 6281234567890.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await requestWhatsAppPairingCodeAction(connectionId, phone);
      if (result.data) setSession(result.data);
      if (!result.ok) setError(result.message ?? "Gagal meminta kode pairing.");
    });
  }

  const heading = isExisting
    ? `Tautkan ulang ${target.connection.label}`
    : "Hubungkan WhatsApp";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020617]/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.9rem] border border-white/10 bg-[#081421]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-emerald-200">
              <Smartphone size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">{heading}</h2>
              <p className="text-sm text-slate-400">
                Cukup beri nama perangkat, lalu pindai QR — tanpa menyentuh konfigurasi JSON.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </p>
        )}

        {!connectionId ? (
          <form
            action={handleCreate}
            className="mt-6 space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">
                Nama Perangkat
              </span>
              <input
                name="label"
                required
                autoFocus
                placeholder="contoh: WA Marketing 1"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">
                Nomor WhatsApp (opsional)
              </span>
              <input
                name="senderIdentity"
                inputMode="numeric"
                placeholder="6281234567890"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-white/20 bg-transparent" />
              Jadikan pengirim WhatsApp utama
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 hover:text-white"
              >
                <Settings2 size={14} />
                {showAdvanced ? "Sembunyikan" : "Pengaturan gateway (opsional)"}
              </button>
              {showAdvanced && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">
                      Gateway URL
                    </span>
                    <input
                      name="gatewayUrl"
                      placeholder="dibiarkan kosong = pakai setelan server"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">
                      API Key
                    </span>
                    <input
                      name="apiKey"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                    />
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
              {isPending ? "Menyiapkan..." : "Tampilkan QR"}
            </button>
          </form>
        ) : connected ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[1.6rem] border border-emerald-300/20 bg-emerald-400/[0.06] px-6 py-10 text-center">
            <CheckCircle2 size={44} className="text-emerald-300" />
            <p className="text-lg font-semibold text-white">WhatsApp tertaut</p>
            <p className="text-sm text-slate-300">
              {session?.displayName ?? "Perangkat"} · {session?.phoneNumber ?? "nomor tersembunyi"}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100"
            >
              Selesai
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,260px),1fr]">
            <div>
              {session?.qrCodeDataUrl ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-white p-3">
                  <Image
                    src={session.qrCodeDataUrl}
                    alt="QR pairing WhatsApp"
                    width={236}
                    height={236}
                    unoptimized
                    className="mx-auto h-[236px] w-[236px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] px-6 text-center text-xs text-slate-400">
                  <Loader2 size={22} className="animate-spin text-cyan-200" />
                  Menunggu QR dari gateway...
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  {remaining !== null && remaining > 0
                    ? `QR berlaku ${remaining} detik`
                    : "Menyegarkan QR..."}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => connectionId && void refreshQr(connectionId)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
                >
                  <RefreshCw size={12} />
                  QR baru
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <ol className="space-y-2.5">
                {STEP_HINTS.map((hint, index) => (
                  <li key={hint} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-[11px] font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    {hint}
                  </li>
                ))}
              </ol>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Tidak bisa memindai?
                </p>
                <p className="mt-1.5 text-sm text-slate-300">
                  Pakai kode 8 karakter — di WhatsApp pilih Tautkan dengan nomor telepon.
                </p>

                {session?.pairingCode ? (
                  <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-center font-mono text-2xl tracking-[0.28em] text-emerald-100">
                    {session.pairingCode}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      value={pairingPhone}
                      onChange={(event) => setPairingPhone(event.target.value)}
                      inputMode="numeric"
                      placeholder="6281234567890"
                      className="min-w-[180px] flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handlePairingCode}
                      className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 disabled:opacity-60"
                    >
                      Minta kode
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 size={13} className="animate-spin text-cyan-200" />
                Memantau status setiap {POLL_MS / 1000} detik · status sekarang:{" "}
                <span className="text-slate-300">{session?.state.replaceAll("_", " ") ?? "MEMUAT"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
