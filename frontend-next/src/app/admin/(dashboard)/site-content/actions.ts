"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";
import { SITE_CONTENT_TAG } from "@/lib/siteContent";

export type SiteContentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Setiap perubahan harus langsung terlihat di situs publik, jadi cache tag
 * konten situs di-invalidate — bukan hanya path admin-nya. `updateTag` dipakai
 * (bukan `revalidateTag`) karena dipanggil dari Server Action dan memberi
 * semantik read-your-own-writes, sehingga hasil edit langsung terbaca.
 */
function revalidateSite(collection?: string) {
  updateTag(SITE_CONTENT_TAG);
  revalidatePath("/admin/site-content");
  if (collection) revalidatePath(`/admin/site-content/${collection}`);
}

function readForm(formData: FormData, collection: string) {
  // Field pilihan dikirim dengan prefix "meta:" dan disatukan jadi satu objek
  // untuk kolom `meta`. Koleksi tanpa field pilihan mengirim `null`, yang
  // membuat backend menulis SQL NULL.
  const meta: Record<string, string | number> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("meta:")) {
      const token = String(value).trim();
      if (token) meta[key.slice("meta:".length)] = token;
      continue;
    }
    // Field angka dikirim terpisah karena harus sampai ke backend sebagai
    // number — validator menolak angka yang dikirim sebagai string.
    if (key.startsWith("num:")) {
      const parsed = Number(String(value).trim());
      // Nol adalah nilai yang sah untuk sebagian field (mis. "mulai minggu
      // ke-0"), jadi yang dibuang hanya isian kosong atau bukan angka.
      // Batas bawah tiap field ditegakkan validator, bukan di sini.
      if (Number.isFinite(parsed) && parsed >= 0) meta[key.slice("num:".length)] = parsed;
    }
  }

  return {
    collection,
    title: String(formData.get("title") ?? "").trim() || null,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    icon: String(formData.get("icon") ?? "").trim() || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    href: String(formData.get("href") ?? "").trim() || null,
    meta: Object.keys(meta).length > 0 ? meta : null,
    isActive: formData.get("isActive") === "on",
  };
}

export async function createItemAction(
  collection: string,
  _prev: SiteContentActionState,
  formData: FormData
): Promise<SiteContentActionState> {
  try {
    await adminFetch("/site-content/items", {
      method: "POST",
      body: JSON.stringify(readForm(formData, collection)),
    });
    revalidateSite(collection);
    return { status: "success", message: "Item ditambahkan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan" };
  }
}

export async function updateItemAction(
  id: string,
  collection: string,
  _prev: SiteContentActionState,
  formData: FormData
): Promise<SiteContentActionState> {
  try {
    await adminFetch(`/site-content/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(readForm(formData, collection)),
    });
    revalidateSite(collection);
    return { status: "success", message: "Item diperbarui" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan" };
  }
}

export async function deleteItemAction(
  id: string,
  collection: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/site-content/items/${id}`, { method: "DELETE" });
    revalidateSite(collection);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus" };
  }
}

export async function moveItemAction(
  id: string,
  collection: string,
  direction: "up" | "down"
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/site-content/items/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
    revalidateSite(collection);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal memindahkan" };
  }
}

export async function updateSettingsAction(
  _prev: SiteContentActionState,
  formData: FormData
): Promise<SiteContentActionState> {
  // Semua field setting dikirim dengan prefix "setting:" agar mudah dipisahkan.
  const settings = [...formData.entries()]
    .filter(([key]) => key.startsWith("setting:"))
    .map(([key, value]) => ({ key: key.slice("setting:".length), value: String(value) }));

  if (settings.length === 0) return { status: "error", message: "Tidak ada perubahan" };

  try {
    await adminFetch("/site-content/settings", { method: "PUT", body: JSON.stringify({ settings }) });
    revalidateSite();
    return { status: "success", message: "Pengaturan tersimpan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan" };
  }
}
