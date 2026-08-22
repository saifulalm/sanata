"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  Activity,
  BadgeCheck,
  Mail,
  Megaphone,
  MessageCircle,
  Plus,
  QrCode,
  RadioTower,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  Unplug,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { BroadcastActionState } from "./actions";
import {
  createBroadcastCampaignAction,
  createBroadcastConnectionAction,
  createBroadcastContactAction,
  deleteBroadcastCampaignAction,
  deleteBroadcastConnectionAction,
  deleteBroadcastContactAction,
  disconnectBroadcastConnectionSessionAction,
  getBroadcastConnectionSessionAction,
  saveBroadcastConnectionAction,
  sendBroadcastCampaignAction,
  testBroadcastConnectionAction,
} from "./actions";
import { WhatsAppQrDialog, type WhatsAppDialogTarget } from "./WhatsAppQrDialog";
import { btn, inputClass, selectClass } from "@/components/admin/ui";
import type {
  BroadcastCampaignRow,
  BroadcastContact,
  BroadcastChannel,
  BroadcastConnection,
  BroadcastConnectionSession,
  BroadcastConnectionMode,
  BroadcastOverview,
  BroadcastProvider,
} from "@/lib/adminResources";

const initialState: BroadcastActionState = { status: "idle" };

const channelIcons = {
  EMAIL: Mail,
  TELEGRAM: Send,
  WHATSAPP: MessageCircle,
  INSTAGRAM: Smartphone,
  FACEBOOK: Megaphone,
} satisfies Record<BroadcastChannel, typeof Mail>;

const providerOptions: Record<BroadcastChannel, Array<{ value: BroadcastProvider; label: string }>> = {
  EMAIL: [{ value: "EMAIL_SMTP", label: "SMTP" }],
  TELEGRAM: [{ value: "TELEGRAM_BOT", label: "Telegram Bot" }],
  WHATSAPP: [
    { value: "WHATSAPP_BAILEYS", label: "Baileys Gateway" },
    { value: "WHATSAPP_OFFICIAL", label: "WhatsApp Official" },
    { value: "WHATSAPP_WAHA", label: "WAHA" },
    { value: "WHATSAPP_EVOLUTION", label: "Evolution API" },
  ],
  INSTAGRAM: [{ value: "INSTAGRAM_META", label: "Meta Instagram" }],
  FACEBOOK: [{ value: "FACEBOOK_META", label: "Meta Messenger" }],
};

const providerHints: Record<BroadcastProvider, string> = {
  EMAIL_SMTP: "Menggunakan SMTP backend. JSON bisa dibiarkan minimal.",
  TELEGRAM_BOT: "Isi botToken dan opsional parseMode.",
  WHATSAPP_BAILEYS: "Gunakan gateway internal berbasis Baileys dengan baseUrl, session, apiKey, dan endpoint bila perlu.",
  WHATSAPP_OFFICIAL: "Isi phoneNumberId, accessToken, dan apiVersion Meta.",
  WHATSAPP_WAHA: "Isi baseUrl, session, dan apiKey untuk gateway WAHA.",
  WHATSAPP_EVOLUTION: "Isi baseUrl, session, dan apiKey Evolution API.",
  INSTAGRAM_META: "Isi pageId, accessToken, dan apiVersion.",
  FACEBOOK_META: "Isi pageId, accessToken, apiVersion, dan tag opsional.",
};

const modeLabels: Record<BroadcastConnectionMode, string> = {
  PRODUCTION: "Production",
  EXPERIMENTAL: "Experimental",
};

function statusTone(status: BroadcastConnection["status"] | BroadcastCampaignRow["status"]) {
  switch (status) {
    case "CONNECTED":
    case "SENT":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "PARTIAL":
    case "SENDING":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    case "ERROR":
    case "FAILED":
      return "border-red-400/30 bg-red-500/10 text-red-200";
    default:
      return "border-white/10 bg-white/[0.05] text-slate-300";
  }
}

function prettyJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-cyan-200">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ConnectionCard({
  connection,
  onLinkDevice,
}: {
  connection: BroadcastConnection;
  onLinkDevice: () => void;
}) {
  const [state, setState] = useState<BroadcastActionState>(initialState);
  const [sessionState, setSessionState] = useState<BroadcastActionState>(initialState);
  const [session, setSession] = useState<BroadcastConnectionSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const Icon = channelIcons[connection.channel];
  const isBaileysProvider = connection.provider === "WHATSAPP_BAILEYS";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await saveBroadcastConnectionAction(connection.id, formData);
          setState(result);
        });
      }}
      className="rounded-[1.8rem] border border-white/10 bg-[#07111e]/80 p-5"
    >
      <input type="hidden" name="channel" value={connection.channel} />
      <input type="hidden" name="accountKey" value={connection.accountKey} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
            <Icon size={18} />
          </span>
          <div>
            <p className="font-medium text-white">{connection.label}</p>
            <p className="text-xs text-slate-400">
              {connection.channel} · {connection.accountKey} · {providerHints[connection.provider]}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {connection.isPrimary && (
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
              Primary
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(connection.status)}`}
          >
            {connection.status}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Label</span>
              <input
                name="label"
                defaultValue={connection.label}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Sender Identity</span>
              <input
                name="senderIdentity"
                defaultValue={connection.senderIdentity ?? ""}
                placeholder="nomor, username, atau phoneNumberId"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Provider</span>
              <select
                name="provider"
                defaultValue={connection.provider}
                className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              >
                {providerOptions[connection.channel].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Mode</span>
              <select
                name="mode"
                defaultValue={connection.mode}
                className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              >
                {Object.entries(modeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Priority</span>
              <input
                name="priority"
                type="number"
                min={1}
                max={999}
                defaultValue={connection.priority}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Weight</span>
              <input
                name="weight"
                type="number"
                min={1}
                max={20}
                defaultValue={connection.weight}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Hourly Limit</span>
              <input
                name="hourlyLimit"
                type="number"
                min={1}
                defaultValue={connection.hourlyLimit ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Daily Limit</span>
              <input
                name="dailyLimit"
                type="number"
                min={1}
                defaultValue={connection.dailyLimit ?? ""}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Cooldown Until</span>
            <input
              name="cooldownUntil"
              type="datetime-local"
              defaultValue={connection.cooldownUntil ? connection.cooldownUntil.slice(0, 16) : ""}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>

          {/* Konfigurasi mentah disembunyikan: jalur normal WhatsApp kini lewat QR. */}
          <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 hover:text-white">
              Konfigurasi lanjutan (JSON)
            </summary>
            <textarea
              name="config"
              rows={10}
              defaultValue={prettyJson(connection.config)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs text-slate-200 focus:border-cyan-300/40 focus:outline-none"
            />
          </details>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                name="isEnabled"
                defaultChecked={connection.isEnabled}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Aktifkan akun ini
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                name="isPrimary"
                defaultChecked={connection.isPrimary}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Jadikan primary untuk channel ini
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Campaigns</p>
              <p className="mt-2 text-xl font-semibold text-white">{connection.metrics.campaigns}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Deliveries</p>
              <p className="mt-2 text-xl font-semibold text-white">{connection.metrics.deliveries}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Status terakhir</p>
            <p className="mt-2">{connection.statusMessage || "Belum pernah dites."}</p>
            <p className="mt-2 text-xs text-slate-500">Dicek: {formatDateTime(connection.lastCheckedAt)}</p>
            <p className="mt-1 text-xs text-slate-500">Dipakai: {formatDateTime(connection.lastUsedAt)}</p>
            <p className="mt-1 text-xs text-slate-500">Mode: {modeLabels[connection.mode]}</p>
          </div>

          {isBaileysProvider && (
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.05] p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Perangkat WhatsApp</p>
                  <p className="mt-1 text-sm text-white">
                    {(session?.state ?? connection.status).replaceAll("_", " ")}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-100">
                  {session?.sessionKey ?? connection.accountKey}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>Nomor: {session?.phoneNumber ?? connection.senderIdentity ?? "-"}</p>
                <p>Nama perangkat di WA: {session?.displayName ?? "-"}</p>
                <p>Sync: {formatDateTime(session?.lastSyncedAt ?? connection.lastCheckedAt)}</p>
              </div>

              {sessionState.message && (
                <p
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    sessionState.status === "success"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                      : "border-red-400/20 bg-red-500/10 text-red-200"
                  }`}
                >
                  {sessionState.message}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onLinkDevice}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100"
                >
                  <QrCode size={14} />
                  Tautkan / QR
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await getBroadcastConnectionSessionAction(connection.id);
                      if (result.data) setSession(result.data);
                      setSessionState(
                        result.ok
                          ? { status: "success", message: result.data?.message ?? "Status diperbarui" }
                          : { status: "error", message: result.message }
                      );
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
                >
                  <RefreshCw size={14} />
                  Cek Status
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await disconnectBroadcastConnectionSessionAction(connection.id);
                      if (result.data) setSession(result.data);
                      setSessionState(
                        result.ok
                          ? { status: "success", message: result.message ?? "Session diputus" }
                          : { status: "error", message: result.message }
                      );
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-200 disabled:opacity-60"
                >
                  <Unplug size={14} />
                  Putuskan
                </button>
              </div>
            </div>
          )}

          {state.message && (
            <p
              className={`rounded-2xl border px-4 py-3 text-sm ${
                state.status === "success"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/20 bg-red-500/10 text-red-200"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100 disabled:opacity-60"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await testBroadcastConnectionAction(connection.id);
                  setState(
                    result.ok
                      ? { status: "success", message: result.message }
                      : { status: "error", message: result.message }
                  );
                })
              }
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
            >
              Test Koneksi
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-red-200 disabled:opacity-60"
            >
              <Trash2 size={15} />
              Hapus
            </button>
          </div>

          <ConfirmDialog
            open={confirmDelete}
            title={`Hapus ${connection.label}?`}
            description="Akun pengirim dihapus dan session gateway diputus. Riwayat campaign tetap tersimpan tanpa akun terkait."
            pending={isPending}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() =>
              startTransition(async () => {
                const result = await deleteBroadcastConnectionAction(connection.id);
                setConfirmDelete(false);
                setState(
                  result.ok
                    ? { status: "success", message: result.message }
                    : { status: "error", message: result.message }
                );
              })
            }
          />
        </div>
      </div>
    </form>
  );
}

function CreateConnectionCard() {
  const [channel, setChannel] = useState<BroadcastChannel>("WHATSAPP");
  const [provider, setProvider] = useState<BroadcastProvider>("WHATSAPP_BAILEYS");
  const [state, action] = useActionState(createBroadcastConnectionAction, initialState);

  return (
    <div className="rounded-[1.8rem] border border-dashed border-cyan-300/25 bg-cyan-400/[0.04] p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
          <Plus size={18} />
        </span>
        <div>
          <p className="font-medium text-white">Tambah Account / Sender</p>
          <p className="text-xs text-slate-400">Buat akun baru untuk pool routing broadcast.</p>
        </div>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Channel</span>
            <select
              name="channel"
              value={channel}
              onChange={(event) => {
                const nextChannel = event.target.value as BroadcastChannel;
                setChannel(nextChannel);
                setProvider(providerOptions[nextChannel][0].value);
              }}
              className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            >
              {Object.keys(channelIcons).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Provider</span>
            <select
              name="provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value as BroadcastProvider)}
              className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            >
              {providerOptions[channel].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Mode</span>
            <select
              name="mode"
              defaultValue={channel === "WHATSAPP" && provider === "WHATSAPP_BAILEYS" ? "EXPERIMENTAL" : "PRODUCTION"}
              className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            >
              {Object.entries(modeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Account Key</span>
            <input
              name="accountKey"
              required
              placeholder="contoh: wa-baileys-c"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Label</span>
            <input
              name="label"
              required
              placeholder="Nama akun pengirim"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Sender Identity</span>
            <input
              name="senderIdentity"
              placeholder="nomor / username"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Config JSON</span>
            <textarea
              name="config"
              rows={1}
              defaultValue={"{}"}
              className="min-h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs text-slate-200 focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Priority</span>
            <input
              name="priority"
              type="number"
              defaultValue={100}
              min={1}
              max={999}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Weight</span>
            <input
              name="weight"
              type="number"
              defaultValue={1}
              min={1}
              max={20}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Hourly</span>
            <input
              name="hourlyLimit"
              type="number"
              min={1}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Daily</span>
            <input
              name="dailyLimit"
              type="number"
              min={1}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            <input type="checkbox" name="isEnabled" defaultChecked className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Enabled
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Primary
          </label>
        </div>

        {state.message && (
          <p
            className={`rounded-2xl border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/20 bg-red-500/10 text-red-200"
            }`}
          >
            {state.message}
          </p>
        )}

        <p className="text-xs text-slate-400">{providerHints[provider]}</p>

        <button
          type="submit"
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100"
        >
          Tambah Account
        </button>
      </form>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: BroadcastCampaignRow }) {
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[#07111e]/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{campaign.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
            {campaign.channel} · {campaign.audienceType.replaceAll("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(campaign.status)}`}
          >
            {campaign.status}
          </span>
          {campaign.connection ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
              {campaign.connection.label}
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Auto Route
            </span>
          )}
        </div>
      </div>

      {campaign.subject && (
        <p className="mt-3 text-sm text-slate-300">
          <span className="text-slate-500">Subjek:</span> {campaign.subject}
        </p>
      )}

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{campaign.message}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Target</p>
          <p className="mt-1 text-lg font-semibold text-white">{campaign.stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Sent</p>
          <p className="mt-1 text-lg font-semibold text-emerald-200">{campaign.stats.sent}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Failed</p>
          <p className="mt-1 text-lg font-semibold text-red-200">{campaign.stats.failed}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Last Send</p>
          <p className="mt-1 text-sm font-medium text-slate-200">{formatDateTime(campaign.sentAt)}</p>
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Dibuat oleh {campaign.createdBy.name}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending || campaign.status === "SENDING"}
            onClick={() => setConfirmDelete(true)}
            className={btn("danger", "sm")}
          >
            <Trash2 size={13} />
            Hapus
          </button>
          <button
            type="button"
            disabled={isPending || campaign.status === "SENDING"}
            onClick={() =>
              startTransition(async () => {
                const result = await sendBroadcastCampaignAction(campaign.id);
                setMessage(result.message ?? (result.ok ? "Broadcast diproses." : "Broadcast gagal."));
              })
            }
            className={btn("primary")}
          >
            {isPending ? "Mengirim..." : "Kirim Sekarang"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Hapus campaign "${campaign.title}"?`}
        description="Riwayat pengiriman kampanye ini ikut terhapus dan tidak bisa dikembalikan."
        pending={isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteBroadcastCampaignAction(campaign.id);
            setConfirmDelete(false);
            setMessage(result.message ?? (result.ok ? "Campaign dihapus." : "Gagal menghapus."));
          })
        }
      />
    </div>
  );
}

/** Kontak manual: tidak semua audiens datang lewat form kontak publik. */
function AddContactForm() {
  const [state, action] = useActionState(createBroadcastContactAction, initialState);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Nama</span>
        <input name="name" required minLength={2} className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Email</span>
        <input name="email" type="email" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">WhatsApp</span>
        <input name="phone" inputMode="numeric" placeholder="6281234567890" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Telegram Chat ID</span>
        <input name="telegramChatId" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Channel Utama</span>
        <select name="preferredChannel" defaultValue="" className={selectClass}>
          <option value="">Tidak ditentukan</option>
          {(Object.keys(channelIcons) as BroadcastChannel[]).map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Tag</span>
        <input name="tags" placeholder="vip, lead" className={inputClass} />
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
        <input type="checkbox" name="consent" className="h-4 w-4 rounded border-white/20 bg-transparent" />
        Sudah memberi consent
      </label>
      <div className="flex items-end">
        <button type="submit" className={btn("primary")}>
          <Plus size={15} />
          Tambah Kontak
        </button>
      </div>

      {state.message && (
        <p
          className={`rounded-xl border px-4 py-2.5 text-sm md:col-span-2 xl:col-span-4 ${
            state.status === "success"
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-red-400/20 bg-red-500/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function ContactRowActions({ contact }: { contact: BroadcastContact }) {
  const [confirmOff, setConfirmOff] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOff(true)}
        title="Nonaktifkan kontak"
        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/12 hover:text-red-300 disabled:opacity-40"
      >
        <Trash2 size={15} />
      </button>

      <ConfirmDialog
        open={confirmOff}
        title={`Nonaktifkan ${contact.name}?`}
        confirmLabel="Nonaktifkan"
        description="Kontak berhenti menerima broadcast. Riwayat pengiriman tetap tersimpan untuk audit."
        pending={isPending}
        onCancel={() => setConfirmOff(false)}
        onConfirm={() =>
          startTransition(async () => {
            await deleteBroadcastContactAction(contact.id);
            setConfirmOff(false);
          })
        }
      />
    </>
  );
}

/** Ringkasan perangkat WhatsApp + pintu masuk utama pairing QR. */
function WhatsAppDeviceHub({
  devices,
  onConnect,
  onManage,
}: {
  devices: BroadcastConnection[];
  onConnect: () => void;
  onManage: (connection: BroadcastConnection) => void;
}) {
  const linked = devices.filter((device) => device.status === "CONNECTED").length;

  return (
    <div className="rounded-[1.8rem] border border-emerald-300/20 bg-emerald-400/[0.05] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-emerald-200">
            <Smartphone size={20} />
          </span>
          <div>
            <p className="font-medium text-white">Perangkat WhatsApp</p>
            <p className="text-xs text-slate-400">
              {devices.length > 0
                ? `${linked} dari ${devices.length} perangkat tertaut.`
                : "Belum ada perangkat. Tautkan nomor WhatsApp dengan memindai QR."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100"
        >
          <QrCode size={15} />
          Hubungkan WhatsApp
        </button>
      </div>

      {devices.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => onManage(device)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-emerald-300/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-white">{device.label}</p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusTone(device.status)}`}
                >
                  {device.status}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                {device.senderIdentity ?? "nomor belum tercatat"}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                {device.status === "CONNECTED" ? "Kelola perangkat" : "Pindai QR sekarang"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BroadcastCenter({ overview }: { overview: BroadcastOverview }) {
  const [campaignState, campaignAction] = useActionState(createBroadcastCampaignAction, initialState);
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel>("EMAIL");
  const [whatsappDialog, setWhatsappDialog] = useState<WhatsAppDialogTarget | null>(null);

  const whatsappDevices = useMemo(
    () => overview.connections.filter((connection) => connection.provider === "WHATSAPP_BAILEYS"),
    [overview.connections]
  );

  const groupedConnections = useMemo(() => {
    return overview.connections.reduce<Record<BroadcastChannel, BroadcastConnection[]>>(
      (acc, connection) => {
        acc[connection.channel].push(connection);
        return acc;
      },
      {
        EMAIL: [],
        TELEGRAM: [],
        WHATSAPP: [],
        INSTAGRAM: [],
        FACEBOOK: [],
      }
    );
  }, [overview.connections]);

  const channelConnections = useMemo(
    () => overview.connections.filter((connection) => connection.channel === selectedChannel),
    [overview.connections, selectedChannel]
  );

  return (
    <div className="space-y-8 text-slate-100">
      {whatsappDialog && (
        <WhatsAppQrDialog target={whatsappDialog} onClose={() => setWhatsappDialog(null)} />
      )}

      <div>
        <h1 className="text-2xl font-semibold text-white">Broadcast Center</h1>
        <p className="text-sm text-slate-400">
          Multi-account broadcast untuk Email, Telegram, WhatsApp Baileys, WhatsApp Official, Instagram, dan Facebook.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Kontak Aktif" value={overview.summary.totalContacts} icon={BadgeCheck} />
        <SummaryCard label="Consent OK" value={overview.summary.consentedContacts} icon={RadioTower} />
        <SummaryCard label="Akun Aktif" value={overview.summary.enabledConnections} icon={Activity} />
        <SummaryCard label="Channel Aktif" value={overview.summary.activeChannels} icon={Megaphone} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Sender Accounts</h2>
          <p className="text-sm text-slate-400">
            Tambahkan banyak akun per channel, atur provider, priority, weight, dan limit pengiriman.
          </p>
        </div>

        <WhatsAppDeviceHub
          devices={whatsappDevices}
          onConnect={() => setWhatsappDialog({ mode: "new" })}
          onManage={(connection) => setWhatsappDialog({ mode: "existing", connection })}
        />

        <details className="rounded-[1.8rem] border border-dashed border-white/12 bg-white/[0.02] p-2">
          <summary className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400 hover:text-white">
            Tambah akun manual (Email, Telegram, API resmi)
          </summary>
          <div className="p-2">
            <CreateConnectionCard />
          </div>
        </details>

        <div className="space-y-6">
          {(Object.keys(groupedConnections) as BroadcastChannel[]).map((channel) => (
            <div key={channel} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{channel}</h3>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                  {groupedConnections[channel].length} akun
                </span>
              </div>
              {groupedConnections[channel].length > 0 ? (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {groupedConnections[channel].map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      onLinkDevice={() => setWhatsappDialog({ mode: "existing", connection })}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-6 text-sm text-slate-400">
                  Belum ada akun untuk channel ini.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-[1.8rem] border border-white/10 bg-[#07111e]/80 p-6">
          <h2 className="text-lg font-semibold text-white">Buat Draft Campaign</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pilih akun tertentu atau biarkan auto-route membagi pengiriman ke beberapa akun aktif.
          </p>

          <form action={campaignAction} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Judul</span>
                <input
                  name="title"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Channel</span>
                <select
                  name="channel"
                  value={selectedChannel}
                  onChange={(event) => setSelectedChannel(event.target.value as BroadcastChannel)}
                  className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                >
                  {(Object.keys(channelIcons) as BroadcastChannel[]).map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Akun Pengirim</span>
                <select
                  name="connectionId"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                >
                  <option value="">Auto Route sesuai priority/weight</option>
                  {channelConnections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.label} ({connection.provider})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Audience</span>
                <select
                  name="audienceType"
                  defaultValue="CONSENTED_ONLY"
                  className="w-full rounded-2xl border border-white/10 bg-[#07111e] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                >
                  <option value="CONSENTED_ONLY">Consented Only</option>
                  <option value="ALL_CONTACTS">All Contacts</option>
                  <option value="TAGGED">Tagged Contacts</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Tag Filter</span>
              <input
                name="tags"
                placeholder="contoh: inquiry, vip, lead"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Subjek</span>
              <input
                name="subject"
                placeholder="Khusus email, opsional untuk channel lain"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-500">Pesan</span>
              <textarea
                name="message"
                rows={8}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              />
            </label>

            {campaignState.message && (
              <p
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  campaignState.status === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-red-400/20 bg-red-500/10 text-red-200"
                }`}
              >
                {campaignState.message}
              </p>
            )}

            <button
              type="submit"
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100"
            >
              Simpan Draft
            </button>
          </form>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#07111e]/80 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Campaign Queue</h2>
              <p className="text-sm text-slate-400">Riwayat draft dan hasil pengiriman terbaru.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
              {overview.campaigns.length} items
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {overview.campaigns.length > 0 ? (
              overview.campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
                Belum ada campaign.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-[#07111e]/80 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Audience Contacts</h2>
            <p className="text-sm text-slate-400">
              Kontak aktif yang siap dipakai untuk broadcast sesuai channel masing-masing.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
            {overview.contacts.length} kontak
          </span>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Tambah Kontak Manual</p>
          <AddContactForm />
        </div>

        {/* Desktop table view */}
        <div className="mt-5 hidden overflow-x-auto rounded-[1.4rem] border border-white/10 md:block">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.2fr,1.3fr,0.7fr,0.9fr,0.7fr,0.4fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Nama</span>
              <span>Identifiers</span>
              <span>Preferred</span>
              <span>Tags</span>
              <span>Consent</span>
              <span className="text-right">Aksi</span>
            </div>
            <div className="divide-y divide-white/10">
              {overview.contacts.length > 0 ? (
                overview.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="grid grid-cols-[1.2fr,1.3fr,0.7fr,0.9fr,0.7fr,0.4fr] gap-3 px-4 py-4 text-sm text-slate-200"
                  >
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(contact.updatedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      {contact.email && <p>Email: {contact.email}</p>}
                      {contact.phone && <p>WA: {contact.phone}</p>}
                      {contact.telegramChatId && <p>Telegram: {contact.telegramChatId}</p>}
                      {contact.instagramHandle && <p>Instagram: {contact.instagramHandle}</p>}
                      {contact.facebookPageScopedId && <p>Facebook: {contact.facebookPageScopedId}</p>}
                    </div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-300">
                      {contact.preferredChannel ?? "-"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {contact.tags.length > 0 ? contact.tags.join(", ") : "-"}
                    </div>
                    <div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          contact.consent
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/[0.05] text-slate-400"
                        }`}
                      >
                        {contact.consent ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <ContactRowActions contact={contact} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-400">Belum ada kontak broadcast aktif.</div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="mt-5 grid gap-3 md:hidden">
          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {overview.contacts.length} Kontak
          </div>
          {overview.contacts.length > 0 ? (
            overview.contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{contact.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(contact.updatedAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <ContactRowActions contact={contact} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  {contact.email && <p><span className="text-slate-500">Email:</span> {contact.email}</p>}
                  {contact.phone && <p><span className="text-slate-500">WA:</span> {contact.phone}</p>}
                  {contact.telegramChatId && <p><span className="text-slate-500">Telegram:</span> {contact.telegramChatId}</p>}
                  {contact.instagramHandle && <p><span className="text-slate-500">IG:</span> {contact.instagramHandle}</p>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                    {contact.preferredChannel ?? "-"}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    contact.consent ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/[0.05] text-slate-400"
                  }`}>
                    {contact.consent ? "Consent" : "No Consent"}
                  </span>
                  {contact.tags.map(tag => (
                    <span key={tag} className="rounded-full border border-cyan-400/20 bg-cyan-500/8 px-2 py-0.5 text-[11px] text-cyan-200">{tag}</span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
              Belum ada kontak broadcast aktif.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
