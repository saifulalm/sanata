"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";
import type {
  BroadcastChannel,
  BroadcastConnectionSession,
  BroadcastConnectionMode,
  BroadcastProvider,
} from "@/lib/adminResources";

export type BroadcastActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function parseJsonConfig(raw: string) {
  if (!raw.trim()) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function parseNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error("Nilai angka tidak valid.");
  }
  return parsed;
}

function readConnectionForm(formData: FormData) {
  return {
    channel: String(formData.get("channel") ?? "").trim() as BroadcastChannel,
    provider: String(formData.get("provider") ?? "").trim() as BroadcastProvider,
    mode: String(formData.get("mode") ?? "PRODUCTION").trim() as BroadcastConnectionMode,
    accountKey: String(formData.get("accountKey") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    senderIdentity: String(formData.get("senderIdentity") ?? "").trim() || null,
    isEnabled: formData.get("isEnabled") === "on",
    isPrimary: formData.get("isPrimary") === "on",
    priority: parseNumber(formData.get("priority")),
    weight: parseNumber(formData.get("weight")),
    dailyLimit: parseNumber(formData.get("dailyLimit")),
    hourlyLimit: parseNumber(formData.get("hourlyLimit")),
    cooldownUntil: String(formData.get("cooldownUntil") ?? "").trim() || null,
    config: parseJsonConfig(String(formData.get("config") ?? "{}")),
  };
}

export async function createBroadcastConnectionAction(
  _prev: BroadcastActionState,
  formData: FormData
): Promise<BroadcastActionState> {
  try {
    await adminFetch("/broadcasts/connections", {
      method: "POST",
      body: JSON.stringify(readConnectionForm(formData)),
    });
    revalidatePath("/admin/broadcasts");
    return { status: "success", message: "Akun broadcast ditambahkan" };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { status: "error", message: "Format JSON konfigurasi tidak valid." };
    }
    return {
      status: "error",
      message: error instanceof AdminApiError ? error.message : "Gagal menambah akun broadcast",
    };
  }
}

export type WhatsAppConnectResult = {
  ok: boolean;
  connectionId?: string;
  data?: BroadcastConnectionSession;
  message?: string;
};

/**
 * Jalur cepat: buat akun WhatsApp Baileys hanya dari nama perangkat, lalu
 * langsung kembalikan session (biasanya sudah berisi QR) untuk dipindai.
 */
export async function quickConnectWhatsAppAction(
  input: { label: string; senderIdentity?: string; gatewayUrl?: string; apiKey?: string; isPrimary?: boolean }
): Promise<WhatsAppConnectResult> {
  try {
    const result = await adminFetch<{
      data: { connection: { id: string }; session: BroadcastConnectionSession | null };
    }>("/broadcasts/connections/whatsapp/quick-connect", {
      method: "POST",
      body: JSON.stringify({
        label: input.label,
        senderIdentity: input.senderIdentity?.trim() || null,
        gatewayUrl: input.gatewayUrl?.trim() || null,
        apiKey: input.apiKey?.trim() || null,
        isPrimary: input.isPrimary ?? false,
      }),
    });
    revalidatePath("/admin/broadcasts");
    return {
      ok: true,
      connectionId: result.data.connection.id,
      data: result.data.session ?? undefined,
      message: "Perangkat WhatsApp dibuat. Pindai QR untuk menautkan.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal membuat perangkat WhatsApp",
    };
  }
}

export async function requestWhatsAppPairingCodeAction(
  id: string,
  phoneNumber: string
): Promise<{ ok: boolean; data?: BroadcastConnectionSession; message?: string }> {
  try {
    const result = await adminFetch<{ data: BroadcastConnectionSession }>(
      `/broadcasts/connections/${id}/session/pair`,
      { method: "POST", body: JSON.stringify({ phoneNumber }) }
    );
    revalidatePath("/admin/broadcasts");
    return { ok: true, data: result.data, message: "Kode pairing dibuat" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal meminta kode pairing",
    };
  }
}

export async function deleteBroadcastConnectionAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/broadcasts/connections/${id}`, { method: "DELETE" });
    revalidatePath("/admin/broadcasts");
    return { ok: true, message: "Akun pengirim dihapus" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal menghapus akun pengirim",
    };
  }
}

export async function saveBroadcastConnectionAction(
  id: string,
  formData: FormData
): Promise<BroadcastActionState> {
  try {
    const payload = readConnectionForm(formData);
    await adminFetch(`/broadcasts/connections/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        provider: payload.provider,
        mode: payload.mode,
        label: payload.label,
        senderIdentity: payload.senderIdentity,
        isEnabled: payload.isEnabled,
        isPrimary: payload.isPrimary,
        priority: payload.priority,
        weight: payload.weight,
        dailyLimit: payload.dailyLimit,
        hourlyLimit: payload.hourlyLimit,
        cooldownUntil: payload.cooldownUntil,
        config: payload.config,
      }),
    });
    revalidatePath("/admin/broadcasts");
    return { status: "success", message: "Akun broadcast diperbarui" };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { status: "error", message: "Format JSON konfigurasi tidak valid." };
    }
    return {
      status: "error",
      message: error instanceof AdminApiError ? error.message : "Gagal menyimpan akun broadcast",
    };
  }
}

export async function testBroadcastConnectionAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/broadcasts/connections/${id}/test`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    revalidatePath("/admin/broadcasts");
    return { ok: true, message: "Tes koneksi selesai" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Tes koneksi gagal",
    };
  }
}

export async function getBroadcastConnectionSessionAction(
  id: string
): Promise<{ ok: boolean; data?: BroadcastConnectionSession; message?: string }> {
  try {
    const result = await adminFetch<{ data: BroadcastConnectionSession }>(`/broadcasts/connections/${id}/session`);
    return { ok: true, data: result.data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Status session gagal diambil",
    };
  }
}

export async function startBroadcastConnectionSessionAction(
  id: string
): Promise<{ ok: boolean; data?: BroadcastConnectionSession; message?: string }> {
  try {
    const result = await adminFetch<{ data: BroadcastConnectionSession }>(`/broadcasts/connections/${id}/session`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    revalidatePath("/admin/broadcasts");
    return { ok: true, data: result.data, message: "Session Baileys diproses" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal memulai session Baileys",
    };
  }
}

export async function refreshBroadcastConnectionQrAction(
  id: string
): Promise<{ ok: boolean; data?: BroadcastConnectionSession; message?: string }> {
  try {
    const result = await adminFetch<{ data: BroadcastConnectionSession }>(
      `/broadcasts/connections/${id}/session/refresh`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
    revalidatePath("/admin/broadcasts");
    return { ok: true, data: result.data, message: "QR session diperbarui" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal refresh QR session",
    };
  }
}

export async function disconnectBroadcastConnectionSessionAction(
  id: string
): Promise<{ ok: boolean; data?: BroadcastConnectionSession; message?: string }> {
  try {
    const result = await adminFetch<{ data: BroadcastConnectionSession }>(`/broadcasts/connections/${id}/session`, {
      method: "DELETE",
    });
    revalidatePath("/admin/broadcasts");
    return { ok: true, data: result.data, message: "Session Baileys diputus" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal memutus session Baileys",
    };
  }
}

function readCampaignForm(formData: FormData) {
  const connectionId = String(formData.get("connectionId") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    channel: String(formData.get("channel") ?? "").trim(),
    connectionId: connectionId || null,
    audienceType: String(formData.get("audienceType") ?? "CONSENTED_ONLY"),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    subject: String(formData.get("subject") ?? "").trim() || null,
    message: String(formData.get("message") ?? "").trim(),
  };
}

export async function createBroadcastCampaignAction(
  _prev: BroadcastActionState,
  formData: FormData
): Promise<BroadcastActionState> {
  try {
    await adminFetch("/broadcasts/campaigns", {
      method: "POST",
      body: JSON.stringify(readCampaignForm(formData)),
    });
    revalidatePath("/admin/broadcasts");
    return { status: "success", message: "Draft broadcast dibuat" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof AdminApiError ? error.message : "Gagal membuat draft",
    };
  }
}

export async function sendBroadcastCampaignAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/broadcasts/campaigns/${id}/send`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    revalidatePath("/admin/broadcasts");
    revalidatePath("/admin");
    return { ok: true, message: "Broadcast diproses" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal mengirim broadcast",
    };
  }
}

export async function deleteBroadcastCampaignAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/broadcasts/campaigns/${id}`, { method: "DELETE" });
    revalidatePath("/admin/broadcasts");
    return { ok: true, message: "Campaign dihapus" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal menghapus campaign",
    };
  }
}

/** Kontak manual — mis. daftar klien lama yang tidak lewat form publik. */
export async function createBroadcastContactAction(
  _prev: BroadcastActionState,
  formData: FormData
): Promise<BroadcastActionState> {
  const channel = String(formData.get("preferredChannel") ?? "").trim();

  try {
    await adminFetch("/broadcasts/contacts", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        telegramChatId: String(formData.get("telegramChatId") ?? "").trim() || null,
        preferredChannel: channel || null,
        consent: formData.get("consent") === "on",
        notes: String(formData.get("notes") ?? "").trim() || null,
        tags: String(formData.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    revalidatePath("/admin/broadcasts");
    return { status: "success", message: "Kontak ditambahkan" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof AdminApiError ? error.message : "Gagal menambah kontak",
    };
  }
}

export async function deleteBroadcastContactAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/broadcasts/contacts/${id}`, { method: "DELETE" });
    revalidatePath("/admin/broadcasts");
    return { ok: true, message: "Kontak dinonaktifkan" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof AdminApiError ? error.message : "Gagal menonaktifkan kontak",
    };
  }
}
