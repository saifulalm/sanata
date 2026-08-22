"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type ProductActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function buildPayload(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: Number(formData.get("price") ?? 0),
    stock: Number(formData.get("stock") ?? 0),
    sku: String(formData.get("sku") ?? "") || null,
    isActive: formData.get("isActive") === "on",
    categoryId: categoryId || null,
  };
}

export async function createProductAction(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  try {
    await adminFetch("/products", { method: "POST", body: JSON.stringify(buildPayload(formData)) });
    revalidatePath("/admin/products");
    return { status: "success", message: "Layanan dibuat" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan layanan" };
  }
}

export async function updateProductAction(id: string, _prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  try {
    await adminFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(buildPayload(formData)) });
    revalidatePath("/admin/products");
    return { status: "success", message: "Layanan diperbarui" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan layanan" };
  }
}

export async function deleteProductAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/products/${id}`, { method: "DELETE" });
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus layanan" };
  }
}
