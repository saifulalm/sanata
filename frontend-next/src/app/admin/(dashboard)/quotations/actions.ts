"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminFetch, AdminApiError } from "@/lib/adminApi";
import type { PaymentTerm, Quotation, QuotationStatus } from "@/lib/estimation";

export type QuotationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function readLetterFields(formData: FormData) {
  let paymentTerms: PaymentTerm[] | undefined;
  try {
    const parsed: unknown = JSON.parse(String(formData.get("paymentTerms") ?? "[]"));
    if (Array.isArray(parsed)) {
      paymentTerms = parsed
        .filter((t) => t && String(t.label).trim())
        .map((t) => ({ label: String(t.label), percent: Number(t.percent) || 0 }));
    }
  } catch {
    paymentTerms = undefined;
  }

  const rawValidUntil = String(formData.get("validUntil") ?? "").trim();
  const validUntil = rawValidUntil ? new Date(rawValidUntil) : null;
  const validForDays =
    validUntil && !Number.isNaN(validUntil.getTime())
      ? undefined
      : Number(formData.get("validForDays")) || 30;

  return {
    clientName: String(formData.get("clientName") ?? "").trim(),
    clientCompany: String(formData.get("clientCompany") ?? "").trim() || null,
    clientAddress: String(formData.get("clientAddress") ?? "").trim() || null,
    attentionTo: String(formData.get("attentionTo") ?? "").trim() || null,
    subject: String(formData.get("subject") ?? "").trim(),
    openingNote: String(formData.get("openingNote") ?? "").trim() || null,
    closingNote: String(formData.get("closingNote") ?? "").trim() || null,
    terms: String(formData.get("terms") ?? "").trim() || null,
    paymentTerms,
    signerName: String(formData.get("signerName") ?? "").trim(),
    signerTitle: String(formData.get("signerTitle") ?? "").trim(),
    signatoryId: String(formData.get("signatoryId") ?? "").trim() || null,
    ...(validUntil && !Number.isNaN(validUntil.getTime())
      ? { validUntil: validUntil.toISOString() }
      : { validForDays }),
  };
}

export async function createQuotationAction(
  rabId: string,
  _prev: QuotationActionState,
  formData: FormData
): Promise<QuotationActionState> {
  let id: string;
  try {
    const res = await adminFetch<{ data: Quotation }>("/quotations", {
      method: "POST",
      body: JSON.stringify({ rabId, ...readLetterFields(formData) }),
    });
    id = res.data.id;
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal membuat penawaran" };
  }
  // redirect() melempar internal, jadi harus di luar blok try.
  revalidatePath("/admin/quotations");
  redirect(`/admin/quotations/${id}`);
}

export async function updateQuotationAction(
  id: string,
  _prev: QuotationActionState,
  formData: FormData
): Promise<QuotationActionState> {
  try {
    await adminFetch(`/quotations/${id}`, { method: "PUT", body: JSON.stringify(readLetterFields(formData)) });
    revalidatePath("/admin/quotations");
    revalidatePath(`/admin/quotations/${id}`);
    return { status: "success", message: "Penawaran tersimpan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan penawaran" };
  }
}

export async function updateQuotationStatusAction(
  id: string,
  status: QuotationStatus
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/quotations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    revalidatePath("/admin/quotations");
    revalidatePath(`/admin/quotations/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal mengubah status" };
  }
}

export async function deleteQuotationAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/quotations/${id}`, { method: "DELETE" });
    revalidatePath("/admin/quotations");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus penawaran" };
  }
}
