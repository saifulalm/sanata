"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError, getAdminSession } from "@/lib/adminApi";

export interface UploadedMedia {
  id: string;
  url: string;
  filename: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Meneruskan berkas ke endpoint media Express. Berkas tidak pernah menyentuh
 * klien dengan token akses — Server Action yang melampirkannya.
 */
export async function uploadMediaAction(
  formData: FormData
): Promise<{ ok: true; media: UploadedMedia } | { ok: false; message: string }> {
  await getAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Tidak ada berkas dipilih" };
  }
  // Divalidasi ulang di backend; pemeriksaan di sini hanya agar pesannya cepat muncul.
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Ukuran berkas melebihi 5 MB" };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, message: "Format harus JPEG, PNG, WEBP, atau GIF" };
  }

  const payload = new FormData();
  payload.append("file", file);

  try {
    const res = await adminFetch<{ data: UploadedMedia }>("/media", { method: "POST", body: payload });
    return { ok: true, media: res.data };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal mengunggah berkas" };
  }
}

/** Unggah dari halaman Pustaka Media — daftar langsung disegarkan. */
export async function uploadLibraryMediaAction(
  _prev: { status: "idle" | "success" | "error"; message?: string },
  formData: FormData
): Promise<{ status: "idle" | "success" | "error"; message?: string }> {
  const result = await uploadMediaAction(formData);
  if (!result.ok) return { status: "error", message: result.message };

  revalidatePath("/admin/media");
  return { status: "success", message: `${result.media.filename} diunggah` };
}

export async function deleteMediaAction(id: string): Promise<{ ok: boolean; message?: string }> {
  await getAdminSession();

  try {
    await adminFetch(`/media/${id}`, { method: "DELETE" });
    revalidatePath("/admin/media");
    return { ok: true, message: "Berkas dihapus" };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof AdminApiError ? err.message : "Gagal menghapus berkas",
    };
  }
}
