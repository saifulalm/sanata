"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type PriceItemActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function readForm(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "MATERIAL"),
    unit: String(formData.get("unit") ?? "").trim(),
    unitPrice: String(formData.get("unitPrice") ?? "0").trim(),
    region: String(formData.get("region") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
  };
}

export async function createPriceItemAction(
  _prev: PriceItemActionState,
  formData: FormData
): Promise<PriceItemActionState> {
  try {
    await adminFetch("/price-items", { method: "POST", body: JSON.stringify(readForm(formData)) });
    revalidatePath("/admin/price-items");
    return { status: "success", message: "Harga satuan ditambahkan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan" };
  }
}

export async function updatePriceItemAction(
  id: string,
  _prev: PriceItemActionState,
  formData: FormData
): Promise<PriceItemActionState> {
  try {
    await adminFetch(`/price-items/${id}`, { method: "PUT", body: JSON.stringify(readForm(formData)) });
    revalidatePath("/admin/price-items");
    return { status: "success", message: "Harga satuan diperbarui" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan" };
  }
}

/**
 * Menghapus bisa ditolak backend bila harga satuan masih dipakai AHSP, jadi
 * hasilnya dikembalikan (bukan throw) supaya pesannya bisa ditampilkan di tabel.
 */
export async function deletePriceItemAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/price-items/${id}`, { method: "DELETE" });
    revalidatePath("/admin/price-items");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus" };
  }
}
