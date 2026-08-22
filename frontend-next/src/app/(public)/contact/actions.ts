"use server";

import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
  marketingConsent: z.boolean().optional().default(false),
  preferredChannel: z
    .enum(["EMAIL", "TELEGRAM", "WHATSAPP", "INSTAGRAM", "FACEBOOK"])
    .optional()
    .nullable(),
});

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitInquiry(_prevState: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    service: String(formData.get("service") ?? ""),
    message: String(formData.get("message") ?? ""),
    marketingConsent: formData.get("marketingConsent") === "on",
    preferredChannel: String(formData.get("preferredChannel") ?? "").trim() || null,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { status: "error", message: "Periksa kembali data yang Anda isi.", fieldErrors };
  }

  try {
    const res = await fetch(`${API_URL}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      return { status: "error", message: "Gagal mengirim pesan. Silakan coba lagi." };
    }

    return { status: "success", message: "Pesan terkirim! Tim Sanata akan segera menghubungi Anda." };
  } catch {
    return { status: "error", message: "Gagal terhubung ke server. Silakan coba lagi nanti." };
  }
}
