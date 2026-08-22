import { collection, getSiteContent, setting } from "@/lib/siteContent";
import { mediaSrc } from "@/lib/media";
import {
  WhatsAppWidget,
  type WhatsAppAgent,
  type WhatsAppWidgetConfig,
} from "@/components/layout/WhatsAppWidget";
import type { KnowledgeEntry } from "@/lib/whatsappAssistant";

/**
 * Pembungkus server untuk widget WhatsApp: membaca seluruh konfigurasi dari
 * CMS lalu menyerahkannya ke komponen klien.
 *
 * Semua yang tampil bisa diubah admin tanpa menyentuh kode — nomor, daftar
 * agen, sapaan, balasan cepat, jam layanan, dan saklar form prospek.
 */

function boolSetting(value: string, fallback: boolean): boolean {
  const normalized = value.trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return fallback;
}

/** "08:30" → 510 menit. Nilai tak terbaca dikembalikan sebagai `fallback`. */
function parseClock(value: string, fallback: number): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return fallback;
  return hours * 60 + minutes;
}

function parseDays(value: string): number[] {
  const days = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return [...new Set(days)];
}

export async function WhatsAppFloat() {
  const content = await getSiteContent();

  const enabled = boolSetting(setting(content, "contact.whatsapp_float", "true"), true);
  if (!enabled) return null;

  const fallbackNumber = setting(content, "contact.whatsapp").replace(/\D/g, "");

  // Agen dari CMS lebih diutamakan; nomor tunggal di Pengaturan Kontak menjadi
  // cadangan supaya situs yang belum mengisi daftar agen tetap punya widget.
  const agents: WhatsAppAgent[] = collection(content, "whatsapp_agents")
    .map((item, index) => ({
      id: item.id,
      name: item.title ?? `Tim ${index + 1}`,
      role: item.subtitle,
      note: item.body,
      avatarUrl: item.imageUrl?.trim() ? mediaSrc(item.imageUrl.trim()) : null,
      phone: (item.meta?.phone ?? "").replace(/\D/g, ""),
      hours: item.meta?.hours ?? null,
      keywords: item.meta?.keywords ?? null,
    }))
    .filter((agent) => agent.phone.length >= 8);

  if (agents.length === 0 && fallbackNumber.length >= 8) {
    agents.push({
      id: "default",
      name: setting(content, "site.company_name", "Sanata Construction"),
      role: null,
      note: null,
      avatarUrl: null,
      phone: fallbackNumber,
      hours: null,
      keywords: null,
    });
  }

  // Tanpa satu pun nomor yang sah, widget tidak ditampilkan sama sekali —
  // tombol yang membuka WhatsApp kosong lebih buruk daripada tidak ada tombol.
  if (agents.length === 0) return null;

  const config: WhatsAppWidgetConfig = {
    label: setting(content, "contact.whatsapp_label", "Chat WhatsApp"),
    panelTitle: setting(content, "contact.whatsapp_panel_title", "Sanata Construction"),
    panelSubtitle: setting(
      content,
      "contact.whatsapp_panel_subtitle",
      "Biasanya membalas dalam beberapa menit"
    ),
    greeting: setting(
      content,
      "contact.whatsapp_greeting",
      "Halo! Ada yang bisa kami bantu soal rencana bangun atau renovasi Anda?"
    ),
    quickReplies: setting(content, "contact.whatsapp_quick_replies", "")
      .split("|")
      .map((reply) => reply.trim())
      .filter(Boolean),
    offlineNote: setting(
      content,
      "contact.whatsapp_offline_note",
      "Di luar jam kerja. Tinggalkan pesan — tim kami membalas pada hari kerja berikutnya."
    ),
    captureLead: boolSetting(setting(content, "contact.whatsapp_capture_lead", "true"), true),
    assistantEnabled: boolSetting(setting(content, "contact.whatsapp_assistant", "true"), true),
    assistantIntro: setting(
      content,
      "contact.whatsapp_assistant_intro",
      "Ketik pertanyaan Anda — saya coba jawab dari daftar pertanyaan umum lebih dulu."
    ),
    assistantMiss: setting(
      content,
      "contact.whatsapp_assistant_miss",
      "Saya belum punya jawaban untuk itu. Lanjutkan ke tim kami lewat WhatsApp, ya."
    ),
    openMinute: parseClock(setting(content, "contact.whatsapp_hours_start", "08:00"), 8 * 60),
    closeMinute: parseClock(setting(content, "contact.whatsapp_hours_end", "17:00"), 17 * 60),
    workDays: parseDays(setting(content, "contact.whatsapp_hours_days", "1,2,3,4,5")),
    utcOffsetHours: Number(setting(content, "contact.whatsapp_timezone_offset", "7")) || 7,
    defaultMessage: setting(
      content,
      "contact.whatsapp_message",
      "Halo Sanata Construction, saya ingin konsultasi proyek."
    ),
  };

  // Basis pengetahuan asisten memakai koleksi FAQ yang sudah dikelola admin,
  // jadi menambah jawaban baru cukup lewat menu FAQ — tidak perlu menyentuh
  // kode maupun mengelola prompt terpisah.
  const knowledge: KnowledgeEntry[] = collection(content, "faq")
    .filter((item) => item.title?.trim() && item.body?.trim())
    .map((item) => ({ id: item.id, question: item.title!, answer: item.body! }));

  return <WhatsAppWidget agents={agents} config={config} knowledge={knowledge} />;
}
