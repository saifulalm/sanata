"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type ContentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function buildPayload(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  return {
    title: String(formData.get("title") ?? ""),
    excerpt: String(formData.get("excerpt") ?? "") || undefined,
    body: String(formData.get("body") ?? ""),
    type: String(formData.get("type") ?? "POST"),
    status: String(formData.get("status") ?? "DRAFT"),
    categoryId: categoryId || null,

    // SEO — string kosong dikirim sebagai null agar backend memakai nilai jatuh-balik.
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || null,
    metaDescription: String(formData.get("metaDescription") ?? "").trim() || null,
    ogImage: String(formData.get("ogImage") ?? "").trim() || null,
    canonicalUrl: String(formData.get("canonicalUrl") ?? "").trim() || null,
    focusKeyword: String(formData.get("focusKeyword") ?? "").trim() || null,
    noIndex: formData.get("noIndex") === "on",
  };
}

export async function createContentAction(_prev: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    await adminFetch("/contents", { method: "POST", body: JSON.stringify(buildPayload(formData)) });
    revalidatePath("/admin/contents");
    revalidatePath("/admin/seo");
    return { status: "success", message: "Konten dibuat" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan konten" };
  }
}

export async function updateContentAction(id: string, _prev: ContentActionState, formData: FormData): Promise<ContentActionState> {
  try {
    await adminFetch(`/contents/${id}`, { method: "PUT", body: JSON.stringify(buildPayload(formData)) });
    revalidatePath("/admin/contents");
    revalidatePath("/admin/seo");
    return { status: "success", message: "Konten diperbarui" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan konten" };
  }
}

export async function deleteContentAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/contents/${id}`, { method: "DELETE" });
    revalidatePath("/admin/contents");
    revalidatePath("/admin/seo");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus konten" };
  }
}
