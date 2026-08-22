import {
  BroadcastCampaignStatus,
  BroadcastChannel,
  BroadcastConnectionStatus,
  BroadcastDeliveryStatus,
  BroadcastProvider,
  Prisma,
} from "@prisma/client";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { ApiError } from "@/utils/ApiError";
import { isMailEnabled, sendMail, verifyMailConnection } from "@/lib/mailer";
import type {
  BroadcastCampaignInput,
  BroadcastCampaignUpdateInput,
  BroadcastConnectionCreateInput,
  BroadcastConnectionUpdateInput,
  BroadcastContactInput,
  BroadcastContactUpdateInput,
} from "@/validators/broadcast.validator";

type JsonRecord = Record<string, unknown>;

type SendableCampaign = {
  title: string;
  subject: string | null;
  message: string;
};

type DeliveryAttempt = {
  contactId: string | null;
  recipient: string;
  status: BroadcastDeliveryStatus;
  externalId?: string;
  errorMessage?: string;
  sentAt?: Date;
  connectionId?: string | null;
};

type ContactCandidate = {
  contactId: string;
  recipient: string;
};

type ConnectionPoolItem = {
  id: string;
  channel: BroadcastChannel;
  provider: BroadcastProvider;
  accountKey: string;
  label: string;
  senderIdentity: string | null;
  isPrimary: boolean;
  priority: number;
  weight: number;
  dailyLimit: number | null;
  hourlyLimit: number | null;
  config: JsonRecord;
  lastUsedAt: Date | null;
};

type PlannedSend = {
  contactId: string;
  recipient: string;
  preferredConnectionId: string;
  fallbackConnectionIds: string[];
};

type GatewayRequestCandidate = {
  url: string;
  init?: RequestInit;
};

type BroadcastConnectionSessionState =
  | "CONNECTED"
  | "QR_READY"
  | "PAIRING"
  | "DISCONNECTED"
  | "ERROR"
  | "UNKNOWN";

type BroadcastConnectionSession = {
  connectionId: string;
  provider: BroadcastProvider;
  sessionKey: string;
  state: BroadcastConnectionSessionState;
  qrCodeDataUrl: string | null;
  qrCodeText: string | null;
  /** Kode 8 karakter untuk "Tautkan dengan nomor telepon" — alternatif QR. */
  pairingCode: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  message: string | null;
  canScanQr: boolean;
  /** Perkiraan kedaluwarsa QR, dipakai UI untuk hitung mundur & auto-refresh. */
  qrExpiresAt: string | null;
  lastSyncedAt: string;
};

const MAX_CONTACTS = 500;

/**
 * QR WhatsApp berumur pendek (~20 detik di Baileys). Nilai ini hanya panduan
 * hitung mundur di UI — sumber kebenaran tetap status dari gateway.
 */
const QR_TTL_SECONDS = 45;

const PROVIDER_CHANNEL_MAP: Record<BroadcastProvider, BroadcastChannel> = {
  EMAIL_SMTP: BroadcastChannel.EMAIL,
  TELEGRAM_BOT: BroadcastChannel.TELEGRAM,
  WHATSAPP_BAILEYS: BroadcastChannel.WHATSAPP,
  WHATSAPP_OFFICIAL: BroadcastChannel.WHATSAPP,
  WHATSAPP_WAHA: BroadcastChannel.WHATSAPP,
  WHATSAPP_EVOLUTION: BroadcastChannel.WHATSAPP,
  INSTAGRAM_META: BroadcastChannel.INSTAGRAM,
  FACEBOOK_META: BroadcastChannel.FACEBOOK,
};

function asConfig(value: Prisma.JsonValue | null | undefined): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanUrl(value: unknown): string | null {
  const url = cleanString(value);
  return url ? url.replace(/\/+$/, "") : null;
}

function cleanPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function normalizeTags(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeConnectionConfig(config: BroadcastConnectionCreateInput["config"] | BroadcastConnectionUpdateInput["config"]) {
  return config !== undefined ? (config as Prisma.InputJsonValue) : undefined;
}

function assertProviderMatchesChannel(channel: BroadcastChannel, provider: BroadcastProvider) {
  if (PROVIDER_CHANNEL_MAP[provider] !== channel) {
    throw ApiError.badRequest("Provider tidak cocok dengan channel yang dipilih.");
  }
}

function getRecipient(
  contact: {
    email: string | null;
    phone: string | null;
    telegramChatId: string | null;
    instagramHandle: string | null;
    facebookPageScopedId: string | null;
  },
  channel: BroadcastChannel
) {
  switch (channel) {
    case "EMAIL":
      return cleanString(contact.email);
    case "TELEGRAM":
      return cleanString(contact.telegramChatId);
    case "WHATSAPP":
      return cleanPhone(contact.phone);
    case "INSTAGRAM":
      return cleanString(contact.instagramHandle);
    case "FACEBOOK":
      return cleanString(contact.facebookPageScopedId);
  }
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function requestJson(url: string, init: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await readJsonOrText(response);
    if (!response.ok) {
      const detail =
        payload && typeof payload === "object"
          ? JSON.stringify(payload).slice(0, 300)
          : String(payload ?? response.statusText).slice(0, 300);
      throw new Error(detail || `HTTP ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function collectStringValues(value: unknown, bucket: string[] = []) {
  if (typeof value === "string") {
    bucket.push(value);
    return bucket;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, bucket);
    return bucket;
  }
  if (isRecord(value)) {
    for (const item of Object.values(value)) collectStringValues(item, bucket);
  }
  return bucket;
}

function findValueByKeys(value: unknown, keys: string[]): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKeys(item, keys);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  if (!isRecord(value)) return undefined;

  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (keys.includes(entryKey.toLowerCase())) {
      return entryValue;
    }
  }

  for (const item of Object.values(value)) {
    const found = findValueByKeys(item, keys);
    if (found !== undefined) return found;
  }

  return undefined;
}

function extractFirstString(value: unknown, keys: string[]) {
  const found = findValueByKeys(value, keys);
  if (typeof found === "string") return cleanString(found);
  if (typeof found === "number") return String(found);
  return null;
}

function normalizeQrDataUrl(raw: string | null) {
  if (!raw) return null;
  if (raw.startsWith("data:image")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("iVBOR")) return `data:image/png;base64,${raw}`;
  return null;
}

function matchSessionState(value: string): BroadcastConnectionSessionState | null {
  if (/(pair|scan|pending|waiting|qr)/.test(value)) return "PAIRING";
  if (/(connected|authenticated|open|online|paired)/.test(value)) return "CONNECTED";
  if (/(error|failed|invalid|exception)/.test(value)) return "ERROR";
  if (/(disconnect|closed|logout|not found|missing|idle|offline|stopped)/.test(value)) {
    return "DISCONNECTED";
  }
  return null;
}

function inferSessionState(payload: unknown, qrCodeText: string | null, qrCodeDataUrl: string | null) {
  if (qrCodeText || qrCodeDataUrl) {
    return "QR_READY" as const;
  }

  // Field status eksplisit selalu menang. Pemindaian menyeluruh di bawah bisa
  // salah baca nilai lain — misalnya nama session "wa-scan-kantor" yang memuat
  // kata "scan" padahal akun sudah tersambung.
  const explicit = extractFirstString(payload, [
    "status",
    "state",
    "connection",
    "connectionstatus",
    "sessionstatus",
  ]);
  const explicitState = explicit ? matchSessionState(explicit.toLowerCase()) : null;
  if (explicitState) return explicitState;

  const values = collectStringValues(payload)
    .map((item) => item.toLowerCase())
    .slice(0, 100);
  if (values.some((item) => /(pair|scan|pending|waiting|qr)/.test(item))) {
    return "PAIRING" as const;
  }
  if (values.some((item) => /(connected|authenticated|open|online|paired)/.test(item))) {
    return "CONNECTED" as const;
  }
  if (values.some((item) => /(error|failed|invalid|exception)/.test(item))) {
    return "ERROR" as const;
  }
  if (values.some((item) => /(disconnect|closed|logout|not found|missing|idle|offline|stopped)/.test(item))) {
    return "DISCONNECTED" as const;
  }
  return "UNKNOWN" as const;
}

async function buildQrCodeDataUrl(qrCodeText: string | null, qrCodeDataUrl: string | null) {
  if (qrCodeDataUrl) return qrCodeDataUrl;
  if (!qrCodeText) return null;
  return QRCode.toDataURL(qrCodeText, { margin: 1, width: 320 });
}

function buildGatewayHeaders(apiKey: string | null, extraHeaders?: Record<string, string>) {
  return {
    Accept: "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
    ...extraHeaders,
  };
}

async function callGatewayCandidates(candidates: GatewayRequestCandidate[]) {
  let lastError = "Gateway tidak merespons.";

  for (const candidate of candidates) {
    try {
      return await requestJson(candidate.url, candidate.init ?? {});
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

async function runInBatches<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function next() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => next())
  );

  return results;
}

async function testTelegram(config: JsonRecord) {
  const botToken = cleanString(config.botToken);
  if (!botToken) throw new Error("botToken Telegram belum diisi.");
  const result = await requestJson(`https://api.telegram.org/bot${botToken}/getMe`);
  const username = cleanString(((result as JsonRecord).result as JsonRecord | undefined)?.username);
  return username ? `Bot Telegram @${username} siap digunakan.` : "Bot Telegram siap digunakan.";
}

async function testWhatsAppGateway(config: JsonRecord, provider: "waha" | "evolution") {
  const baseUrl = cleanUrl(config.baseUrl);
  const session = cleanString(config.session) ?? "default";
  const apiKey = cleanString(config.apiKey);
  if (!baseUrl) throw new Error("baseUrl WhatsApp gateway belum diisi.");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
  };

  const candidates =
    provider === "evolution"
      ? [
          `${baseUrl}/instance/connectionState/${session}`,
          `${baseUrl}/instance/fetchInstances`,
        ]
      : [
          `${baseUrl}/api/sessions/${session}`,
          `${baseUrl}/api/sessions`,
          `${baseUrl}/sessions/${session}`,
        ];

  let lastError = "Gateway WhatsApp tidak merespons.";
  for (const url of candidates) {
    try {
      await requestJson(url, { headers });
      return `Gateway WhatsApp (${provider}) merespons untuk sesi ${session}.`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

async function testBaileysGateway(config: JsonRecord) {
  const baseUrl = cleanUrl(config.baseUrl);
  const session = cleanString(config.session) ?? "default";
  const apiKey = cleanString(config.apiKey);
  if (!baseUrl) throw new Error("baseUrl Baileys gateway belum diisi.");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
  };
  const candidates = [
    `${baseUrl}/health`,
    `${baseUrl}/sessions/${session}`,
    `${baseUrl}/session/${session}`,
    `${baseUrl}/status/${session}`,
  ];

  let lastError = "Gateway Baileys tidak merespons.";
  for (const url of candidates) {
    try {
      await requestJson(url, { headers });
      return `Gateway Baileys merespons untuk sesi ${session}.`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
}

async function testWhatsAppOfficial(config: JsonRecord) {
  const accessToken = cleanString(config.accessToken);
  const phoneNumberId = cleanString(config.phoneNumberId);
  const apiVersion = cleanString(config.apiVersion) ?? "v21.0";
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Official membutuhkan phoneNumberId dan accessToken.");
  }

  const result = await requestJson(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name&access_token=${encodeURIComponent(accessToken)}`
  );
  const info = result as JsonRecord;
  const displayPhone = cleanString(info.display_phone_number);
  const verifiedName = cleanString(info.verified_name);
  return `WhatsApp Official aktif${verifiedName ? ` untuk ${verifiedName}` : ""}${displayPhone ? ` (${displayPhone})` : ""}.`;
}

async function testMetaConnection(config: JsonRecord, channel: "INSTAGRAM" | "FACEBOOK") {
  const accessToken = cleanString(config.accessToken);
  const pageId = cleanString(config.pageId);
  const apiVersion = cleanString(config.apiVersion) ?? "v21.0";
  if (!accessToken || !pageId) {
    throw new Error(`${channel} membutuhkan pageId dan accessToken.`);
  }
  const result = await requestJson(
    `https://graph.facebook.com/${apiVersion}/${pageId}?fields=name&access_token=${encodeURIComponent(accessToken)}`
  );
  return `Koneksi ${channel} aktif ke halaman ${String((result as JsonRecord).name ?? pageId)}.`;
}

async function sendTelegramMessage(config: JsonRecord, recipient: string, campaign: SendableCampaign) {
  const botToken = cleanString(config.botToken);
  if (!botToken) throw new Error("botToken Telegram belum diisi.");

  const payload = await requestJson(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: recipient,
      text: campaign.message,
      parse_mode: cleanString(config.parseMode) ?? "HTML",
      disable_web_page_preview: true,
    }),
  });

  return String((((payload as JsonRecord).result as JsonRecord | undefined)?.message_id ?? ""));
}

async function sendWhatsAppGatewayMessage(
  config: JsonRecord,
  recipient: string,
  campaign: SendableCampaign,
  provider: "waha" | "evolution"
) {
  const baseUrl = cleanUrl(config.baseUrl);
  const session = cleanString(config.session) ?? "default";
  const apiKey = cleanString(config.apiKey);
  const endpointOverride = cleanString(config.endpoint);
  if (!baseUrl) throw new Error("baseUrl WhatsApp gateway belum diisi.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
  };

  const endpoint =
    endpointOverride ??
    (provider === "evolution"
      ? `${baseUrl}/message/sendText/${session}`
      : `${baseUrl}/api/sendText`);

  const payload =
    provider === "evolution"
      ? { number: recipient, textMessage: { text: campaign.message } }
      : { session, chatId: `${recipient}@c.us`, text: campaign.message };

  const result = await requestJson(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  return String(
    (result as JsonRecord).id ??
      ((result as JsonRecord).message as JsonRecord | undefined)?.id ??
      ((result as JsonRecord).key as JsonRecord | undefined)?.id ??
      ""
  );
}

async function sendBaileysMessage(config: JsonRecord, recipient: string, campaign: SendableCampaign) {
  const baseUrl = cleanUrl(config.baseUrl);
  const session = cleanString(config.session) ?? "default";
  const apiKey = cleanString(config.apiKey);
  const endpoint = cleanString(config.endpoint) ?? `${baseUrl}/messages/send-text`;
  if (!baseUrl) throw new Error("baseUrl Baileys gateway belum diisi.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
  };

  const result = await requestJson(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      session,
      to: recipient,
      text: campaign.message,
    }),
  });

  return String(
    (result as JsonRecord).id ??
      ((result as JsonRecord).data as JsonRecord | undefined)?.id ??
      ((result as JsonRecord).key as JsonRecord | undefined)?.id ??
      ""
  );
}

async function sendWhatsAppOfficialMessage(config: JsonRecord, recipient: string, campaign: SendableCampaign) {
  const accessToken = cleanString(config.accessToken);
  const phoneNumberId = cleanString(config.phoneNumberId);
  const apiVersion = cleanString(config.apiVersion) ?? "v21.0";
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Official membutuhkan phoneNumberId dan accessToken.");
  }

  const result = await requestJson(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { preview_url: false, body: campaign.message },
      }),
    }
  );

  return String((((result as JsonRecord).messages as Array<JsonRecord> | undefined)?.[0]?.id ?? ""));
}

async function sendMetaMessage(
  config: JsonRecord,
  recipient: string,
  campaign: SendableCampaign,
  channel: "INSTAGRAM" | "FACEBOOK"
) {
  const accessToken = cleanString(config.accessToken);
  const pageId = cleanString(config.pageId);
  const apiVersion = cleanString(config.apiVersion) ?? "v21.0";
  if (!accessToken || !pageId) {
    throw new Error(`${channel} membutuhkan pageId dan accessToken.`);
  }

  const result = await requestJson(
    `https://graph.facebook.com/${apiVersion}/${pageId}/messages?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_type: "MESSAGE_TAG",
        tag: cleanString(config.tag) ?? "ACCOUNT_UPDATE",
        ...(channel === "INSTAGRAM" ? { messaging_product: "instagram" } : {}),
        recipient: { id: recipient },
        message: { text: campaign.message },
      }),
    }
  );

  return String((result as JsonRecord).message_id ?? (result as JsonRecord).recipient_id ?? "");
}

function getBaileysGatewayConfig(connection: {
  id: string;
  provider: BroadcastProvider;
  accountKey: string;
  config: Prisma.JsonValue | null;
}) {
  if (connection.provider !== "WHATSAPP_BAILEYS") {
    throw ApiError.badRequest("QR session hanya tersedia untuk akun WhatsApp Baileys.");
  }

  const config = asConfig(connection.config);
  const baseUrl = cleanUrl(config.baseUrl);
  if (!baseUrl) {
    throw ApiError.badRequest("baseUrl Baileys gateway belum diisi pada konfigurasi akun.");
  }

  return {
    baseUrl,
    sessionKey: cleanString(config.session) ?? connection.accountKey,
    apiKey: cleanString(config.apiKey),
    initEndpoint: cleanString(config.sessionInitEndpoint),
    statusEndpoint: cleanString(config.sessionStatusEndpoint),
    qrEndpoint: cleanString(config.sessionQrEndpoint),
    refreshEndpoint: cleanString(config.sessionRefreshEndpoint),
    disconnectEndpoint: cleanString(config.sessionDisconnectEndpoint),
  };
}

/** Kode pairing WhatsApp: 8 karakter alfanumerik, kadang dikirim "ABCD-EFGH". */
function normalizePairingCode(raw: string | null) {
  if (!raw) return null;
  const compact = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return compact.length === 8 ? compact : null;
}

function extractPairingCode(payload: unknown) {
  return normalizePairingCode(
    extractFirstString(payload, ["paircode", "pairingcode", "pairing_code", "linkcode", "code"])
  );
}

async function parseBaileysSessionPayload(
  connection: { id: string; provider: BroadcastProvider },
  sessionKey: string,
  statusPayload: unknown,
  qrPayload?: unknown
): Promise<BroadcastConnectionSession> {
  const qrCodeText =
    extractFirstString(qrPayload ?? statusPayload, ["qr", "qrcode", "qrcodevalue", "qrtext"]) ??
    extractFirstString(qrPayload ?? statusPayload, ["code"]);
  const qrCodeDataUrl =
    normalizeQrDataUrl(
      extractFirstString(qrPayload ?? statusPayload, ["qrimagedataurl", "qrcodeimage", "qrimage", "dataurl", "image"])
    ) ?? (await buildQrCodeDataUrl(qrCodeText, normalizeQrDataUrl(extractFirstString(qrPayload ?? statusPayload, ["base64"]))));
  const state = inferSessionState(statusPayload ?? qrPayload, qrCodeText, qrCodeDataUrl);
  const message =
    extractFirstString(statusPayload, ["message", "detail", "description", "statusmessage"]) ??
    (state === "QR_READY"
      ? "QR siap dipindai dari WhatsApp akun ini."
      : state === "CONNECTED"
        ? "Akun WhatsApp sudah terhubung."
        : null);

  const pairingCode = extractPairingCode(qrPayload) ?? extractPairingCode(statusPayload);

  return {
    connectionId: connection.id,
    provider: connection.provider,
    sessionKey,
    state,
    qrCodeDataUrl,
    qrCodeText,
    pairingCode,
    phoneNumber:
      extractFirstString(statusPayload, ["phone", "phonenumber", "user", "wid"]) ??
      extractFirstString(statusPayload, ["id"]),
    displayName: extractFirstString(statusPayload, ["name", "pushname", "displayname", "verifiedname"]),
    message,
    canScanQr: state === "QR_READY" && Boolean(qrCodeDataUrl),
    qrExpiresAt: qrCodeDataUrl
      ? new Date(Date.now() + QR_TTL_SECONDS * 1000).toISOString()
      : null,
    lastSyncedAt: new Date().toISOString(),
  };
}

async function readBaileysSessionState(connection: {
  id: string;
  provider: BroadcastProvider;
  accountKey: string;
  config: Prisma.JsonValue | null;
}) {
  const gateway = getBaileysGatewayConfig(connection);
  const statusPayload = await callGatewayCandidates([
    ...(gateway.statusEndpoint
      ? [{ url: gateway.statusEndpoint, init: { headers: buildGatewayHeaders(gateway.apiKey) } }]
      : []),
    {
      url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}`,
      init: { headers: buildGatewayHeaders(gateway.apiKey) },
    },
    {
      url: `${gateway.baseUrl}/session/${gateway.sessionKey}`,
      init: { headers: buildGatewayHeaders(gateway.apiKey) },
    },
    {
      url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/status`,
      init: { headers: buildGatewayHeaders(gateway.apiKey) },
    },
    {
      url: `${gateway.baseUrl}/status/${gateway.sessionKey}`,
      init: { headers: buildGatewayHeaders(gateway.apiKey) },
    },
    {
      url: `${gateway.baseUrl}/health`,
      init: { headers: buildGatewayHeaders(gateway.apiKey) },
    },
  ]);

  let qrPayload: unknown = null;
  try {
    qrPayload = await callGatewayCandidates([
      ...(gateway.qrEndpoint
        ? [{ url: gateway.qrEndpoint, init: { headers: buildGatewayHeaders(gateway.apiKey) } }]
        : []),
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/qr`,
        init: { headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/session/${gateway.sessionKey}/qr`,
        init: { headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/qr/${gateway.sessionKey}`,
        init: { headers: buildGatewayHeaders(gateway.apiKey) },
      },
    ]);
  } catch {
    qrPayload = null;
  }

  return parseBaileysSessionPayload(connection, gateway.sessionKey, statusPayload, qrPayload);
}

async function syncConnectionSessionStatus(
  connectionId: string,
  session: BroadcastConnectionSession,
  fallbackMessage?: string
) {
  const mappedStatus =
    session.state === "CONNECTED"
      ? BroadcastConnectionStatus.CONNECTED
      : session.state === "ERROR"
        ? BroadcastConnectionStatus.ERROR
        : BroadcastConnectionStatus.DISCONNECTED;

  await prisma.broadcastChannelConnection.update({
    where: { id: connectionId },
    data: {
      status: mappedStatus,
      statusMessage: session.message ?? fallbackMessage ?? null,
      lastCheckedAt: new Date(),
    },
  });
}

async function startBaileysSession(connection: {
  id: string;
  provider: BroadcastProvider;
  accountKey: string;
  config: Prisma.JsonValue | null;
}) {
  const gateway = getBaileysGatewayConfig(connection);
  const body = JSON.stringify({
    session: gateway.sessionKey,
    sessionId: gateway.sessionKey,
    name: gateway.sessionKey,
    accountKey: connection.accountKey,
  });

  try {
    await callGatewayCandidates([
      ...(gateway.initEndpoint
        ? [
            {
              url: gateway.initEndpoint,
              init: {
                method: "POST",
                headers: buildGatewayHeaders(gateway.apiKey, { "Content-Type": "application/json" }),
                body,
              },
            },
          ]
        : []),
      {
        url: `${gateway.baseUrl}/sessions`,
        init: {
          method: "POST",
          headers: buildGatewayHeaders(gateway.apiKey, { "Content-Type": "application/json" }),
          body,
        },
      },
      {
        url: `${gateway.baseUrl}/session`,
        init: {
          method: "POST",
          headers: buildGatewayHeaders(gateway.apiKey, { "Content-Type": "application/json" }),
          body,
        },
      },
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/init`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/session/${gateway.sessionKey}/init`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
    ]);
  } catch {
    // Beberapa gateway membuat session secara lazy. Lanjutkan membaca state terbaru.
  }

  return readBaileysSessionState(connection);
}

async function refreshBaileysSessionQr(connection: {
  id: string;
  provider: BroadcastProvider;
  accountKey: string;
  config: Prisma.JsonValue | null;
}) {
  const gateway = getBaileysGatewayConfig(connection);

  try {
    await callGatewayCandidates([
      ...(gateway.refreshEndpoint
        ? [{ url: gateway.refreshEndpoint, init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) } }]
        : []),
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/qr/refresh`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/session/${gateway.sessionKey}/qr/refresh`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/reconnect`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/session/${gateway.sessionKey}/reconnect`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
    ]);
  } catch {
    // Beberapa gateway cukup membaca ulang endpoint QR tanpa refresh eksplisit.
  }

  return readBaileysSessionState(connection);
}

async function disconnectBaileysSession(connection: {
  id: string;
  provider: BroadcastProvider;
  accountKey: string;
  config: Prisma.JsonValue | null;
}) {
  const gateway = getBaileysGatewayConfig(connection);
  let message = "Session Baileys diputus.";
  let state: BroadcastConnectionSessionState = "DISCONNECTED";

  try {
    await callGatewayCandidates([
      ...(gateway.disconnectEndpoint
        ? [{ url: gateway.disconnectEndpoint, init: { method: "DELETE", headers: buildGatewayHeaders(gateway.apiKey) } }]
        : []),
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}`,
        init: { method: "DELETE", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/session/${gateway.sessionKey}`,
        init: { method: "DELETE", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/logout`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
      {
        url: `${gateway.baseUrl}/session/${gateway.sessionKey}/logout`,
        init: { method: "POST", headers: buildGatewayHeaders(gateway.apiKey) },
      },
    ]);
  } catch (error) {
    message = error instanceof Error ? error.message : "Gateway Baileys gagal memutus session.";
    state = "ERROR";
  }

  const session: BroadcastConnectionSession = {
    connectionId: connection.id,
    provider: connection.provider,
    sessionKey: gateway.sessionKey,
    state,
    qrCodeDataUrl: null,
    qrCodeText: null,
    pairingCode: null,
    phoneNumber: null,
    displayName: null,
    message,
    canScanQr: false,
    qrExpiresAt: null,
    lastSyncedAt: new Date().toISOString(),
  };

  await syncConnectionSessionStatus(connection.id, session, message);
  return session;
}

/**
 * Pairing lewat kode 8 karakter: admin memasukkan nomor WhatsApp, gateway
 * membalas kode yang diketik di ponsel. Lebih mudah daripada QR bila panel
 * admin dibuka di perangkat yang sama dengan WhatsApp.
 */
async function requestBaileysPairingCode(
  connection: {
    id: string;
    provider: BroadcastProvider;
    accountKey: string;
    config: Prisma.JsonValue | null;
  },
  phoneNumber: string
) {
  const gateway = getBaileysGatewayConfig(connection);
  const digits = cleanPhone(phoneNumber);
  if (!digits) {
    throw ApiError.badRequest("Nomor WhatsApp tidak valid. Gunakan format 62812xxxxxxx.");
  }

  const body = JSON.stringify({
    session: gateway.sessionKey,
    sessionId: gateway.sessionKey,
    phoneNumber: digits,
    phone: digits,
    number: digits,
  });
  const headers = buildGatewayHeaders(gateway.apiKey, { "Content-Type": "application/json" });

  let payload: unknown = null;
  try {
    payload = await callGatewayCandidates([
      { url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/pair`, init: { method: "POST", headers, body } },
      { url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/pairing-code`, init: { method: "POST", headers, body } },
      { url: `${gateway.baseUrl}/session/${gateway.sessionKey}/pair`, init: { method: "POST", headers, body } },
      {
        url: `${gateway.baseUrl}/sessions/${gateway.sessionKey}/pair?phone=${digits}`,
        init: { headers: buildGatewayHeaders(gateway.apiKey) },
      },
    ]);
  } catch (error) {
    throw ApiError.badRequest(
      error instanceof Error
        ? `Gateway tidak mendukung pairing code: ${error.message}`
        : "Gateway tidak mendukung pairing code."
    );
  }

  const pairingCode = extractPairingCode(payload);
  if (!pairingCode) {
    throw ApiError.badRequest("Gateway tidak mengembalikan kode pairing 8 karakter.");
  }

  const session = await readBaileysSessionState(connection);
  return {
    ...session,
    pairingCode,
    phoneNumber: session.phoneNumber ?? digits,
    message: `Masukkan kode ${pairingCode} di WhatsApp › Perangkat Tertaut › Tautkan dengan nomor telepon.`,
  } satisfies BroadcastConnectionSession;
}

async function testConnectionProvider(connection: {
  channel: BroadcastChannel;
  provider: BroadcastProvider;
  config: Prisma.JsonValue | null;
}) {
  const config = asConfig(connection.config);

  switch (connection.provider) {
    case "EMAIL_SMTP":
      if (!isMailEnabled()) throw new Error("SMTP backend belum dikonfigurasi.");
      await verifyMailConnection();
      return "SMTP backend terhubung.";
    case "TELEGRAM_BOT":
      return testTelegram(config);
    case "WHATSAPP_BAILEYS":
      return testBaileysGateway(config);
    case "WHATSAPP_WAHA":
      return testWhatsAppGateway(config, "waha");
    case "WHATSAPP_EVOLUTION":
      return testWhatsAppGateway(config, "evolution");
    case "WHATSAPP_OFFICIAL":
      return testWhatsAppOfficial(config);
    case "INSTAGRAM_META":
      return testMetaConnection(config, "INSTAGRAM");
    case "FACEBOOK_META":
      return testMetaConnection(config, "FACEBOOK");
  }
}

async function sendThroughConnection(
  connection: ConnectionPoolItem,
  recipient: string,
  campaign: SendableCampaign
) {
  switch (connection.provider) {
    case "EMAIL_SMTP":
      if (!isMailEnabled()) throw new Error("SMTP backend belum dikonfigurasi.");
      await sendMail({
        to: recipient,
        subject: campaign.subject ?? campaign.title,
        html: campaign.message.replace(/\n/g, "<br />"),
      });
      return "";
    case "TELEGRAM_BOT":
      return sendTelegramMessage(connection.config, recipient, campaign);
    case "WHATSAPP_BAILEYS":
      return sendBaileysMessage(connection.config, recipient, campaign);
    case "WHATSAPP_WAHA":
      return sendWhatsAppGatewayMessage(connection.config, recipient, campaign, "waha");
    case "WHATSAPP_EVOLUTION":
      return sendWhatsAppGatewayMessage(connection.config, recipient, campaign, "evolution");
    case "WHATSAPP_OFFICIAL":
      return sendWhatsAppOfficialMessage(connection.config, recipient, campaign);
    case "INSTAGRAM_META":
      return sendMetaMessage(connection.config, recipient, campaign, "INSTAGRAM");
    case "FACEBOOK_META":
      return sendMetaMessage(connection.config, recipient, campaign, "FACEBOOK");
  }
}

function computeCampaignStats(deliveries: Array<{ status: BroadcastDeliveryStatus }>) {
  return deliveries.reduce(
    (acc, delivery) => {
      acc.total += 1;
      if (delivery.status === "SENT") acc.sent += 1;
      if (delivery.status === "FAILED") acc.failed += 1;
      if (delivery.status === "SKIPPED") acc.skipped += 1;
      if (delivery.status === "PENDING") acc.pending += 1;
      return acc;
    },
    { total: 0, sent: 0, failed: 0, skipped: 0, pending: 0 }
  );
}

function mapCampaign(row: Awaited<ReturnType<typeof listCampaigns>>[number]) {
  return row;
}

function mapConnectionMetrics<T extends { config: Prisma.JsonValue | null; _count: { campaigns: number; deliveries: number } }>(
  row: T
) {
  const { _count, ...rest } = row;
  return {
    ...rest,
    config: asConfig(row.config),
    metrics: {
      campaigns: _count.campaigns,
      deliveries: _count.deliveries,
    },
  };
}

async function ensureSinglePrimary(channel: BroadcastChannel, keepId: string) {
  await prisma.broadcastChannelConnection.updateMany({
    where: { channel, id: { not: keepId } },
    data: { isPrimary: false },
  });
}

async function validateSelectedConnection(channel: BroadcastChannel, connectionId: string | null | undefined) {
  if (!connectionId) return null;
  const connection = await prisma.broadcastChannelConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw ApiError.badRequest("Koneksi channel tidak ditemukan.");
  if (connection.channel !== channel) {
    throw ApiError.badRequest("Koneksi tidak cocok dengan channel kampanye.");
  }
  return connection;
}

async function listEligibleConnections(channel: BroadcastChannel, pinnedConnectionId?: string | null) {
  const now = new Date();
  const rows = pinnedConnectionId
    ? await prisma.broadcastChannelConnection.findMany({
        where: { id: pinnedConnectionId, channel, isEnabled: true },
      })
    : await prisma.broadcastChannelConnection.findMany({
        where: {
          channel,
          isEnabled: true,
          OR: [{ cooldownUntil: null }, { cooldownUntil: { lte: now } }],
        },
        orderBy: [
          { isPrimary: "desc" },
          { priority: "asc" },
          { lastUsedAt: "asc" },
          { createdAt: "asc" },
        ],
      });

  return rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    provider: row.provider,
    accountKey: row.accountKey,
    label: row.label,
    senderIdentity: row.senderIdentity,
    isPrimary: row.isPrimary,
    priority: row.priority,
    weight: Math.max(row.weight, 1),
    dailyLimit: row.dailyLimit,
    hourlyLimit: row.hourlyLimit,
    config: asConfig(row.config),
    lastUsedAt: row.lastUsedAt,
  })) satisfies ConnectionPoolItem[];
}

async function getUsageCounts(connectionIds: string[]) {
  if (connectionIds.length === 0) {
    return { hour: new Map<string, number>(), day: new Map<string, number>() };
  }

  const [hourRows, dayRows] = await Promise.all([
    prisma.broadcastDelivery.groupBy({
      by: ["connectionId"],
      where: {
        connectionId: { in: connectionIds },
        status: BroadcastDeliveryStatus.SENT,
        sentAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      _count: { _all: true },
    }),
    prisma.broadcastDelivery.groupBy({
      by: ["connectionId"],
      where: {
        connectionId: { in: connectionIds },
        status: BroadcastDeliveryStatus.SENT,
        sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      _count: { _all: true },
    }),
  ]);

  return {
    hour: new Map(hourRows.map((row) => [row.connectionId ?? "", row._count._all])),
    day: new Map(dayRows.map((row) => [row.connectionId ?? "", row._count._all])),
  };
}

function buildWeightedPool(connections: ConnectionPoolItem[]) {
  return connections.flatMap((connection) =>
    Array.from({ length: Math.min(Math.max(connection.weight, 1), 20) }, () => connection.id)
  );
}

function canUseConnection(
  connection: ConnectionPoolItem,
  usage: { hour: Map<string, number>; day: Map<string, number> }
) {
  const hourCount = usage.hour.get(connection.id) ?? 0;
  const dayCount = usage.day.get(connection.id) ?? 0;
  if (connection.hourlyLimit && hourCount >= connection.hourlyLimit) return false;
  if (connection.dailyLimit && dayCount >= connection.dailyLimit) return false;
  return true;
}

function planConnectionRouting(
  contacts: ContactCandidate[],
  connections: ConnectionPoolItem[]
) {
  if (connections.length === 0) {
    throw ApiError.badRequest("Belum ada akun pengirim aktif untuk channel ini.");
  }

  const usage = {
    hour: new Map<string, number>(),
    day: new Map<string, number>(),
  };
  const weightedPool = buildWeightedPool(connections);
  let cursor = 0;

  return getUsageCounts(connections.map((connection) => connection.id)).then((persistedUsage) => {
    usage.hour = persistedUsage.hour;
    usage.day = persistedUsage.day;

    return contacts.map((contact) => {
      let selectedConnectionId: string | null = null;

      for (let offset = 0; offset < weightedPool.length; offset += 1) {
        const idx = (cursor + offset) % weightedPool.length;
        const candidateId = weightedPool[idx];
        const candidate = connections.find((connection) => connection.id === candidateId);
        if (!candidate || !canUseConnection(candidate, usage)) continue;
        selectedConnectionId = candidate.id;
        cursor = (idx + 1) % weightedPool.length;
        usage.hour.set(candidate.id, (usage.hour.get(candidate.id) ?? 0) + 1);
        usage.day.set(candidate.id, (usage.day.get(candidate.id) ?? 0) + 1);
        break;
      }

      if (!selectedConnectionId) {
        throw ApiError.badRequest("Semua akun pengirim telah mencapai limit atau sedang cooldown.");
      }

      return {
        contactId: contact.contactId,
        recipient: contact.recipient,
        preferredConnectionId: selectedConnectionId,
        fallbackConnectionIds: connections
          .filter((connection) => connection.id !== selectedConnectionId)
          .map((connection) => connection.id),
      } satisfies PlannedSend;
    });
  });
}

async function resolveContactsForCampaign(campaign: {
  channel: BroadcastChannel;
  audienceType: string;
  audienceFilter: Prisma.JsonValue | null;
}) {
  const tagFilter = normalizeTags(
    (asConfig(campaign.audienceFilter).tags as Prisma.JsonValue | undefined) ?? null
  );
  const contacts = await prisma.broadcastContact.findMany({
    where: {
      isActive: true,
      ...(campaign.audienceType === "CONSENTED_ONLY" || campaign.audienceType === "TAGGED"
        ? { consent: true }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_CONTACTS,
  });

  return contacts
    .filter((contact) => {
      if (campaign.audienceType !== "TAGGED" || tagFilter.length === 0) return true;
      const contactTags = normalizeTags(contact.tags);
      return tagFilter.some((tag) => contactTags.includes(tag));
    })
    .map((contact) => ({
      contactId: contact.id,
      recipient: getRecipient(contact, campaign.channel),
    }))
    .filter((contact): contact is ContactCandidate => Boolean(contact.recipient));
}

export async function syncBroadcastContactFromInquiry(params: {
  inquiryId: string;
  name: string;
  email: string;
  phone?: string | null;
  marketingConsent: boolean;
  preferredChannel?: BroadcastChannel | null;
}) {
  const phone = cleanPhone(params.phone);
  const canCreate =
    Boolean(cleanString(params.email)) ||
    Boolean(phone) ||
    Boolean(params.preferredChannel === "TELEGRAM");

  if (!params.marketingConsent || !canCreate) return null;

  return prisma.broadcastContact.upsert({
    where: { inquiryId: params.inquiryId },
    update: {
      name: params.name,
      email: params.email,
      phone,
      preferredChannel: params.preferredChannel ?? null,
      consent: true,
      consentSource: "public-contact-form",
      isActive: true,
    },
    create: {
      inquiryId: params.inquiryId,
      name: params.name,
      email: params.email,
      phone,
      preferredChannel: params.preferredChannel ?? null,
      consent: true,
      consentSource: "public-contact-form",
      isActive: true,
      tags: ["inquiry", "website"] as Prisma.JsonArray,
    },
  });
}

export async function listConnections() {
  const rows = await prisma.broadcastChannelConnection.findMany({
    orderBy: [
      { channel: "asc" },
      { isPrimary: "desc" },
      { priority: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      _count: {
        select: { campaigns: true, deliveries: true },
      },
    },
  });

  return rows.map(mapConnectionMetrics);
}

export async function createConnection(input: BroadcastConnectionCreateInput) {
  assertProviderMatchesChannel(input.channel, input.provider);

  const created = await prisma.$transaction(async (tx) => {
    const connection = await tx.broadcastChannelConnection.create({
      data: {
        channel: input.channel,
        provider: input.provider,
        mode: input.mode,
        accountKey: input.accountKey,
        label: input.label,
        senderIdentity: cleanString(input.senderIdentity),
        isEnabled: input.isEnabled ?? false,
        isPrimary: input.isPrimary ?? false,
        priority: input.priority ?? 100,
        weight: input.weight ?? 1,
        dailyLimit: input.dailyLimit ?? null,
        hourlyLimit: input.hourlyLimit ?? null,
        cooldownUntil: parseDate(input.cooldownUntil),
        // `DbNull` menulis SQL NULL, bukan nilai JSON `null`. Pada kolom JSONB
        // PostgreSQL keduanya nilai yang berbeda, jadi pilihannya harus eksplisit.
        config:
          normalizeConnectionConfig(input.config) !== undefined
            ? normalizeConnectionConfig(input.config)!
            : Prisma.DbNull,
      },
      include: {
        _count: {
          select: { campaigns: true, deliveries: true },
        },
      },
    });

    if (connection.isPrimary) {
      await tx.broadcastChannelConnection.updateMany({
        where: { channel: input.channel, id: { not: connection.id } },
        data: { isPrimary: false },
      });
    }

    return connection;
  });

  return mapConnectionMetrics(created);
}

export async function updateConnection(id: string, input: BroadcastConnectionUpdateInput) {
  const existing = await prisma.broadcastChannelConnection.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Broadcast connection not found");

  const provider = input.provider ?? existing.provider;
  assertProviderMatchesChannel(existing.channel, provider);

  const updated = await prisma.$transaction(async (tx) => {
    const connection = await tx.broadcastChannelConnection.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.provider !== undefined ? { provider } : {}),
        ...(input.mode !== undefined ? { mode: input.mode } : {}),
        ...(input.senderIdentity !== undefined
          ? { senderIdentity: cleanString(input.senderIdentity) }
          : {}),
        ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
        ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.dailyLimit !== undefined ? { dailyLimit: input.dailyLimit ?? null } : {}),
        ...(input.hourlyLimit !== undefined ? { hourlyLimit: input.hourlyLimit ?? null } : {}),
        ...(input.cooldownUntil !== undefined
          ? { cooldownUntil: parseDate(input.cooldownUntil) }
          : {}),
        ...(input.config !== undefined
          ? { config: normalizeConnectionConfig(input.config)! }
          : {}),
        ...(input.isEnabled === false
          ? {
              status: BroadcastConnectionStatus.DISCONNECTED,
              statusMessage: "Akun pengirim dinonaktifkan.",
            }
          : {}),
      },
      include: {
        _count: {
          select: { campaigns: true, deliveries: true },
        },
      },
    });

    if (input.isPrimary === true) {
      await tx.broadcastChannelConnection.updateMany({
        where: { channel: existing.channel, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return connection;
  });

  return mapConnectionMetrics(updated);
}

function slugifyAccountKey(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "wa";
}

/** Account key unik per channel — dipakai juga sebagai nama session di gateway. */
async function nextAvailableAccountKey(channel: BroadcastChannel, base: string) {
  const taken = await prisma.broadcastChannelConnection.findMany({
    where: { channel, accountKey: { startsWith: base } },
    select: { accountKey: true },
  });
  const used = new Set(taken.map((row) => row.accountKey));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 200; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Jalur cepat "hubungkan WhatsApp": admin cukup memberi nama perangkat.
 * Semua konfigurasi gateway diambil dari env, session langsung dibuat sehingga
 * QR bisa tampil pada respons yang sama.
 */
export async function quickConnectWhatsApp(input: {
  label: string;
  senderIdentity?: string | null;
  gatewayUrl?: string | null;
  apiKey?: string | null;
  isPrimary?: boolean;
}) {
  const baseUrl = cleanUrl(input.gatewayUrl) ?? (env.baileys.gatewayUrl || null);
  if (!baseUrl) {
    throw ApiError.badRequest(
      "Gateway Baileys belum dikonfigurasi. Isi BAILEYS_GATEWAY_URL di server atau masukkan URL gateway pada form."
    );
  }

  const apiKey = cleanString(input.apiKey) ?? (env.baileys.apiKey || null);
  const accountKey = await nextAvailableAccountKey(
    BroadcastChannel.WHATSAPP,
    slugifyAccountKey(input.label)
  );

  const connection = await prisma.$transaction(async (tx) => {
    const created = await tx.broadcastChannelConnection.create({
      data: {
        channel: BroadcastChannel.WHATSAPP,
        provider: BroadcastProvider.WHATSAPP_BAILEYS,
        mode: "EXPERIMENTAL",
        accountKey,
        label: input.label,
        senderIdentity: cleanPhone(input.senderIdentity) ?? cleanString(input.senderIdentity),
        isEnabled: true,
        isPrimary: input.isPrimary ?? false,
        status: BroadcastConnectionStatus.DISCONNECTED,
        statusMessage: "Menunggu pemindaian QR.",
        config: {
          baseUrl,
          session: accountKey,
          ...(apiKey ? { apiKey } : {}),
        } as Prisma.InputJsonValue,
      },
      include: { _count: { select: { campaigns: true, deliveries: true } } },
    });

    if (created.isPrimary) {
      await tx.broadcastChannelConnection.updateMany({
        where: { channel: BroadcastChannel.WHATSAPP, id: { not: created.id } },
        data: { isPrimary: false },
      });
    }

    return created;
  });

  // Gateway yang belum siap tidak boleh membatalkan pembuatan akun — QR bisa
  // dicoba lagi dari kartu koneksi.
  let session: BroadcastConnectionSession | null = null;
  try {
    session = await startBaileysSession(connection);
    await syncConnectionSessionStatus(connection.id, session);
  } catch (error) {
    await prisma.broadcastChannelConnection.update({
      where: { id: connection.id },
      data: {
        status: BroadcastConnectionStatus.ERROR,
        statusMessage: error instanceof Error ? error.message : "Gateway Baileys tidak merespons.",
        lastCheckedAt: new Date(),
      },
    });
  }

  return { connection: mapConnectionMetrics(connection), session };
}

export async function deleteConnection(id: string) {
  const connection = await prisma.broadcastChannelConnection.findUnique({ where: { id } });
  if (!connection) throw ApiError.notFound("Broadcast connection not found");

  // Session gateway ikut diputus supaya perangkat tidak tertinggal tertaut.
  if (connection.provider === "WHATSAPP_BAILEYS") {
    try {
      await disconnectBaileysSession(connection);
    } catch {
      // Gateway mati bukan alasan untuk menahan penghapusan akun lokal.
    }
  }

  // Campaign & delivery memakai onDelete: SetNull, jadi riwayat tetap utuh.
  await prisma.broadcastChannelConnection.delete({ where: { id } });
  return { id };
}

export async function testConnection(id: string) {
  const connection = await prisma.broadcastChannelConnection.findUnique({ where: { id } });
  if (!connection) throw ApiError.notFound("Broadcast connection not found");

  let status: BroadcastConnectionStatus = BroadcastConnectionStatus.CONNECTED;
  let statusMessage = "Koneksi siap digunakan.";

  try {
    statusMessage = await testConnectionProvider(connection);
  } catch (error) {
    status = BroadcastConnectionStatus.ERROR;
    statusMessage = error instanceof Error ? error.message : "Koneksi gagal diuji.";
  }

  return prisma.broadcastChannelConnection.update({
    where: { id },
    data: {
      status,
      statusMessage,
      lastCheckedAt: new Date(),
    },
  });
}

async function requireBaileysConnection(id: string) {
  const connection = await prisma.broadcastChannelConnection.findUnique({ where: { id } });
  if (!connection) throw ApiError.notFound("Broadcast connection not found");
  if (connection.provider !== "WHATSAPP_BAILEYS") {
    throw ApiError.badRequest("QR session hanya tersedia untuk akun WhatsApp Baileys.");
  }
  return connection;
}

export async function getConnectionSession(id: string) {
  const connection = await requireBaileysConnection(id);
  const session = await readBaileysSessionState(connection);
  await syncConnectionSessionStatus(connection.id, session);
  return session;
}

export async function startConnectionSession(id: string) {
  const connection = await requireBaileysConnection(id);
  const session = await startBaileysSession(connection);
  await syncConnectionSessionStatus(connection.id, session);
  return session;
}

export async function refreshConnectionSessionQr(id: string) {
  const connection = await requireBaileysConnection(id);
  const session = await refreshBaileysSessionQr(connection);
  await syncConnectionSessionStatus(connection.id, session);
  return session;
}

export async function requestConnectionPairingCode(id: string, phoneNumber: string) {
  const connection = await requireBaileysConnection(id);
  const session = await requestBaileysPairingCode(connection, phoneNumber);
  await syncConnectionSessionStatus(connection.id, session);
  return session;
}

export async function disconnectConnectionSession(id: string) {
  const connection = await requireBaileysConnection(id);
  return disconnectBaileysSession(connection);
}

export async function deleteCampaign(id: string) {
  const campaign = await prisma.broadcastCampaign.findUnique({ where: { id } });
  if (!campaign) throw ApiError.notFound("Broadcast campaign not found");
  if (campaign.status === BroadcastCampaignStatus.SENDING) {
    throw ApiError.badRequest("Kampanye sedang berjalan, tunggu sampai selesai.");
  }

  // Delivery ikut terhapus lewat onDelete: Cascade.
  await prisma.broadcastCampaign.delete({ where: { id } });
  return { id };
}

/** Kontak yang ditambahkan manual — mis. daftar klien lama di luar form publik. */
export async function createContact(input: BroadcastContactInput) {
  const phone = cleanPhone(input.phone);
  const email = cleanString(input.email);

  if (!email && !phone && !cleanString(input.telegramChatId)) {
    throw ApiError.badRequest("Isi minimal satu kanal: email, nomor WhatsApp, atau Telegram chat id.");
  }

  return prisma.broadcastContact.create({
    data: {
      name: input.name,
      email,
      phone,
      telegramChatId: cleanString(input.telegramChatId),
      instagramHandle: cleanString(input.instagramHandle),
      facebookPageScopedId: cleanString(input.facebookPageScopedId),
      preferredChannel: input.preferredChannel ?? null,
      consent: input.consent ?? false,
      consentSource: input.consent ? "admin-manual" : null,
      notes: cleanString(input.notes),
      tags: (input.tags?.length ? input.tags : ["manual"]) as Prisma.InputJsonValue,
      isActive: true,
    },
  });
}

export async function updateContact(id: string, input: BroadcastContactUpdateInput) {
  const existing = await prisma.broadcastContact.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Broadcast contact not found");

  return prisma.broadcastContact.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: cleanString(input.email) } : {}),
      ...(input.phone !== undefined ? { phone: cleanPhone(input.phone) } : {}),
      ...(input.telegramChatId !== undefined
        ? { telegramChatId: cleanString(input.telegramChatId) }
        : {}),
      ...(input.instagramHandle !== undefined
        ? { instagramHandle: cleanString(input.instagramHandle) }
        : {}),
      ...(input.facebookPageScopedId !== undefined
        ? { facebookPageScopedId: cleanString(input.facebookPageScopedId) }
        : {}),
      ...(input.preferredChannel !== undefined
        ? { preferredChannel: input.preferredChannel ?? null }
        : {}),
      ...(input.consent !== undefined
        ? { consent: input.consent, consentSource: input.consent ? existing.consentSource ?? "admin-manual" : null }
        : {}),
      ...(input.notes !== undefined ? { notes: cleanString(input.notes) } : {}),
      ...(input.tags !== undefined ? { tags: input.tags as Prisma.InputJsonValue } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

/** Penghapusan bersifat lunak: riwayat delivery tetap bisa diaudit. */
export async function deactivateContact(id: string) {
  const existing = await prisma.broadcastContact.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Broadcast contact not found");

  await prisma.broadcastContact.update({
    where: { id },
    data: { isActive: false, consent: false },
  });
  return { id };
}

export async function listContacts() {
  const rows = await prisma.broadcastContact.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
  });

  return rows.map(({ _count, ...row }) => ({
    ...row,
    tags: normalizeTags(row.tags),
    metrics: { deliveries: _count.deliveries },
  }));
}

export async function listCampaigns() {
  const rows = await prisma.broadcastCampaign.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    include: {
      connection: true,
      createdBy: { select: { id: true, name: true, email: true } },
      deliveries: { select: { status: true } },
    },
  });

  return rows.map(({ deliveries, ...row }) => ({
    ...row,
    audienceFilter: asConfig(row.audienceFilter),
    connection: row.connection
      ? { ...row.connection, config: asConfig(row.connection.config) }
      : null,
    stats: computeCampaignStats(deliveries),
  }));
}

export async function createCampaign(userId: string, input: BroadcastCampaignInput) {
  const connection = await validateSelectedConnection(input.channel, input.connectionId);

  return prisma.broadcastCampaign.create({
    data: {
      title: input.title,
      channel: input.channel,
      connectionId: connection?.id ?? null,
      audienceType: input.audienceType,
      audienceFilter: input.tags?.length
        ? ({ tags: input.tags } as Prisma.InputJsonValue)
        : Prisma.DbNull,
      subject: input.subject ?? null,
      message: input.message,
      createdById: userId,
    },
  });
}

export async function updateCampaign(id: string, input: BroadcastCampaignUpdateInput) {
  const existing = await prisma.broadcastCampaign.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Broadcast campaign not found");
  if (existing.status === BroadcastCampaignStatus.SENT) {
    throw ApiError.badRequest("Kampanye yang sudah terkirim tidak dapat diubah.");
  }

  const channel = input.channel ?? existing.channel;
  let connectionId = existing.connectionId;

  if (input.connectionId !== undefined) {
    const connection = await validateSelectedConnection(channel, input.connectionId);
    connectionId = connection?.id ?? null;
  } else if (input.channel && existing.connectionId) {
    const existingConnection = await prisma.broadcastChannelConnection.findUnique({
      where: { id: existing.connectionId },
    });
    if (!existingConnection || existingConnection.channel !== channel) {
      connectionId = null;
    }
  }

  return prisma.broadcastCampaign.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.channel !== undefined ? { channel } : {}),
      ...(input.audienceType !== undefined ? { audienceType: input.audienceType } : {}),
      ...(input.tags !== undefined
        ? {
            audienceFilter: input.tags.length
              ? ({ tags: input.tags } as Prisma.InputJsonValue)
              : Prisma.DbNull,
          }
        : {}),
      ...(input.subject !== undefined ? { subject: input.subject ?? null } : {}),
      ...(input.message !== undefined ? { message: input.message } : {}),
      ...(input.connectionId !== undefined || input.channel !== undefined
        ? { connectionId }
        : {}),
    },
  });
}

export async function sendCampaign(id: string, force = false) {
  const campaign = await prisma.broadcastCampaign.findUnique({
    where: { id },
    include: { connection: true },
  });
  if (!campaign) throw ApiError.notFound("Broadcast campaign not found");
  if (campaign.status === BroadcastCampaignStatus.SENT && !force) {
    throw ApiError.badRequest("Kampanye ini sudah pernah dikirim.");
  }

  const contacts = await resolveContactsForCampaign(campaign);
  if (contacts.length === 0) {
    throw ApiError.badRequest("Belum ada kontak yang cocok untuk channel kampanye ini.");
  }

  const connections = await listEligibleConnections(campaign.channel, campaign.connectionId);
  if (connections.length === 0) {
    throw ApiError.badRequest("Belum ada akun pengirim aktif untuk channel kampanye ini.");
  }

  const routingPlan = await planConnectionRouting(contacts, connections);
  const connectionMap = new Map(connections.map((connection) => [connection.id, connection]));
  const sendableCampaign: SendableCampaign = {
    title: campaign.title,
    subject: campaign.subject,
    message: campaign.message,
  };

  await prisma.broadcastCampaign.update({
    where: { id },
    data: {
      status: BroadcastCampaignStatus.SENDING,
      sentAt: null,
    },
  });

  if (force || campaign.status !== BroadcastCampaignStatus.SENT) {
    await prisma.broadcastDelivery.deleteMany({ where: { campaignId: id } });
  }

  let attempts: DeliveryAttempt[] = [];

  try {
    attempts = await runInBatches(routingPlan, 5, async (planned) => {
      const orderedConnectionIds = [planned.preferredConnectionId, ...planned.fallbackConnectionIds];
      let lastError = "Pengiriman gagal.";

      for (const connectionId of orderedConnectionIds) {
        const connection = connectionMap.get(connectionId);
        if (!connection) continue;

        try {
          const externalId = await sendThroughConnection(connection, planned.recipient, sendableCampaign);
          return {
            contactId: planned.contactId,
            recipient: planned.recipient,
            status: BroadcastDeliveryStatus.SENT,
            externalId,
            sentAt: new Date(),
            connectionId: connection.id,
          } satisfies DeliveryAttempt;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "Pengiriman gagal.";
        }
      }

      return {
        contactId: planned.contactId,
        recipient: planned.recipient,
        status: BroadcastDeliveryStatus.FAILED,
        errorMessage: lastError,
        connectionId: planned.preferredConnectionId,
      } satisfies DeliveryAttempt;
    });
  } catch (error) {
    await prisma.broadcastCampaign.update({
      where: { id },
      data: {
        status: BroadcastCampaignStatus.FAILED,
        sentAt: null,
      },
    });
    throw ApiError.badRequest(error instanceof Error ? error.message : "Pengiriman kampanye gagal.");
  }

  if (attempts.length > 0) {
    await prisma.broadcastDelivery.createMany({
      data: attempts.map((attempt) => ({
        campaignId: campaign.id,
        channel: campaign.channel,
        recipient: attempt.recipient,
        status: attempt.status,
        externalId: attempt.externalId,
        errorMessage: attempt.errorMessage,
        sentAt: attempt.sentAt,
        contactId: attempt.contactId,
        connectionId: attempt.connectionId ?? null,
      })),
    });
  }

  const usedConnectionIds = Array.from(
    new Set(
      attempts
        .filter((attempt) => attempt.status === BroadcastDeliveryStatus.SENT)
        .map((attempt) => attempt.connectionId)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (usedConnectionIds.length > 0) {
    await prisma.broadcastChannelConnection.updateMany({
      where: { id: { in: usedConnectionIds } },
      data: { lastUsedAt: new Date() },
    });
  }

  const sentCount = attempts.filter((attempt) => attempt.status === BroadcastDeliveryStatus.SENT).length;
  const failedCount = attempts.filter((attempt) => attempt.status === BroadcastDeliveryStatus.FAILED).length;
  const dominantConnectionId =
    attempts.find((attempt) => attempt.status === BroadcastDeliveryStatus.SENT)?.connectionId ??
    campaign.connectionId;

  const nextStatus =
    sentCount > 0 && failedCount === 0
      ? BroadcastCampaignStatus.SENT
      : sentCount > 0
        ? BroadcastCampaignStatus.PARTIAL
        : BroadcastCampaignStatus.FAILED;

  return prisma.broadcastCampaign.update({
    where: { id },
    data: {
      status: nextStatus,
      sentAt: sentCount > 0 ? new Date() : null,
      connectionId: dominantConnectionId ?? null,
    },
    include: {
      connection: true,
      deliveries: { select: { status: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getOverview() {
  const [connections, contacts, campaigns] = await Promise.all([
    listConnections(),
    listContacts(),
    listCampaigns(),
  ]);

  const summary = {
    totalContacts: contacts.length,
    consentedContacts: contacts.filter((contact) => contact.consent).length,
    enabledConnections: connections.filter((connection) => connection.isEnabled).length,
    activeChannels: new Set(
      connections.filter((connection) => connection.isEnabled).map((connection) => connection.channel)
    ).size,
    draftCampaigns: campaigns.filter((campaign) => campaign.status === "DRAFT").length,
    sentCampaigns: campaigns.filter((campaign) => campaign.status === "SENT").length,
    partialCampaigns: campaigns.filter((campaign) => campaign.status === "PARTIAL").length,
  };

  return {
    summary,
    connections,
    contacts,
    campaigns: campaigns.map(mapCampaign),
  };
}
