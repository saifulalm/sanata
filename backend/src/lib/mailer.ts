import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

/**
 * Pengiriman email bersifat opsional: bila SMTP belum dikonfigurasi, seluruh
 * fungsi di sini menjadi no-op. Formulir publik tidak boleh gagal hanya karena
 * notifikasi tidak terkirim.
 */
let transporter: Transporter | null = null;

export function isMailEnabled(): boolean {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

export async function verifyMailConnection() {
  const mailer = getTransporter();
  if (!mailer) throw new Error("SMTP backend belum dikonfigurasi.");
  await mailer.verify();
}

function getTransporter(): Transporter | null {
  if (!isMailEnabled()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    // Port 465 memakai TLS implisit; selain itu STARTTLS.
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  return transporter;
}

export async function sendMail(options: { to: string; subject: string; html: string; replyTo?: string }) {
  const mailer = getTransporter();
  if (!mailer) {
    logger.debug("SMTP not configured; skipping email", { subject: options.subject });
    return;
  }

  await mailer.sendMail({
    from: env.smtp.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  });
}

/** Ambil detail kontak dari CMS agar email selalu memakai data terbaru. */
async function getContactDetails() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["contact.phone", "contact.email", "contact.address", "site.tagline"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    phone: map["contact.phone"] ?? "",
    email: map["contact.email"] ?? "",
    address: map["contact.address"] ?? "",
    tagline: map["site.tagline"] ?? "Mitra Konstruksi Terpercaya.",
  };
}

function layout(body: string, contact: { phone: string; email: string; address: string; tagline: string }) {
  return `
    <div style="background:#f5f5f4;padding:24px 0">
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
        <div style="background:#0f3d2b;padding:22px 28px">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em">SANATA</p>
          <p style="margin:2px 0 0;color:#c5a059;font-size:11px;letter-spacing:0.18em;text-transform:uppercase">
            ${escapeHtml(contact.tagline)}
          </p>
        </div>
        <div style="padding:28px">${body}</div>
        <div style="border-top:1px solid #e5e5e5;padding:18px 28px;color:#9ca3af;font-size:12px;line-height:1.7">
          ${contact.address ? `${escapeHtml(contact.address)}<br>` : ""}
          ${contact.phone ? `Telp: ${escapeHtml(contact.phone)}` : ""}
          ${contact.phone && contact.email ? " &middot; " : ""}
          ${contact.email ? `Email: ${escapeHtml(contact.email)}` : ""}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Memberi tahu tim saat ada permintaan penawaran baru. Sengaja tidak menunggu
 * (fire-and-forget) supaya respons API tetap cepat, dan kegagalannya dicatat
 * saja — pesan tetap tersimpan di database apa pun yang terjadi.
 */
export function notifyNewInquiry(inquiry: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
}) {
  if (!isMailEnabled() || !env.smtp.notifyTo) return;

  const rows: [string, string][] = [
    ["Nama", inquiry.name],
    ["Email", inquiry.email],
    ["Telepon", inquiry.phone ?? "-"],
    ["Layanan", inquiry.service ?? "-"],
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px">
      <h2 style="color:#0f3d2b;margin:0 0 4px">Permintaan Penawaran Baru</h2>
      <p style="color:#6b7280;margin:0 0 20px;font-size:13px">Masuk melalui formulir kontak situs Sanata.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:6px 0;color:#6b7280;width:110px">${label}</td>
            <td style="padding:6px 0;color:#111827"><strong>${escapeHtml(value)}</strong></td>
          </tr>`
          )
          .join("")}
      </table>
      <div style="margin-top:16px;padding:14px;background:#f9fafb;border-left:3px solid #c5a059">
        <p style="margin:0;color:#374151;font-size:14px;white-space:pre-line">${escapeHtml(inquiry.message)}</p>
      </div>
      <p style="margin-top:20px;font-size:12px;color:#9ca3af">
        Balas email ini untuk menghubungi pengirim, atau buka Admin &rarr; Pesan Masuk.
      </p>
    </div>
  `;

  void sendMail({
    to: env.smtp.notifyTo,
    subject: `Permintaan penawaran baru dari ${inquiry.name}`,
    html,
    // Balas langsung ke pengirim, bukan ke alamat sistem.
    replyTo: inquiry.email,
  }).catch((err) => {
    logger.error("Failed to send inquiry notification", { inquiryId: inquiry.id, err });
  });
}

/**
 * Balasan otomatis ke pengirim formulir: konfirmasi bahwa pesannya diterima,
 * berikut salinan isi pesan. Sama seperti notifikasi internal, tidak ditunggu
 * dan tidak boleh menggagalkan pengiriman formulir.
 */
export function sendInquiryAutoReply(inquiry: {
  id: string;
  name: string;
  email: string;
  service: string | null;
  message: string;
}) {
  if (!isMailEnabled()) return;

  void (async () => {
    const contact = await getContactDetails();

    const body = `
      <p style="margin:0 0 14px;color:#111827;font-size:15px">Halo ${escapeHtml(inquiry.name)},</p>
      <p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7">
        Terima kasih telah menghubungi <strong>Sanata Construction</strong>. Permintaan Anda sudah kami terima
        dan tim kami akan menindaklanjuti pada <strong>hari kerja berikutnya</strong>.
      </p>
      ${
        inquiry.service
          ? `<p style="margin:0 0 14px;color:#374151;font-size:14px">Layanan yang diminati: <strong>${escapeHtml(inquiry.service)}</strong></p>`
          : ""
      }
      <div style="margin:18px 0;padding:14px;background:#f9fafb;border-left:3px solid #c5a059">
        <p style="margin:0 0 6px;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Pesan Anda</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;white-space:pre-line">${escapeHtml(inquiry.message)}</p>
      </div>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7">
        Bila ada yang ingin ditambahkan, balas saja email ini.
      </p>
    `;

    await sendMail({
      to: inquiry.email,
      subject: "Terima kasih — permintaan Anda sudah kami terima",
      html: layout(body, contact),
      ...(env.smtp.notifyTo ? { replyTo: env.smtp.notifyTo } : {}),
    });
  })().catch((err) => {
    logger.error("Failed to send inquiry auto-reply", { inquiryId: inquiry.id, err });
  });
}
