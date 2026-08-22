"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type CategoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createCategoryAction(_prev: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  const name = String(formData.get("name") ?? "");
  try {
    await adminFetch("/categories", { method: "POST", body: JSON.stringify({ name }) });
    revalidatePath("/admin/categories");
    return { status: "success", message: "Kategori dibuat" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan kategori" };
  }
}

export async function updateCategoryAction(id: string, _prev: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  const name = String(formData.get("name") ?? "");
  try {
    await adminFetch(`/categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
    revalidatePath("/admin/categories");
    return { status: "success", message: "Kategori diperbarui" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan kategori" };
  }
}

/** Backend menolak jika kategori masih dipakai, jadi pesannya dikembalikan bukan dilempar. */
export async function deleteCategoryAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/categories/${id}`, { method: "DELETE" });
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus kategori" };
  }
}
