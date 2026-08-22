"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type AhspActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export interface AhspComponentPayload {
  priceItemId: string;
  coefficient: string;
}

interface AhspPayload {
  code: string;
  name: string;
  unit: string;
  category: string | null;
  overheadPct: string;
  notes: string | null;
  isActive: boolean;
  components: AhspComponentPayload[];
}

/**
 * Komponen dikirim sebagai JSON dari field tersembunyi karena jumlah barisnya
 * dinamis — jauh lebih andal daripada menebak nama field berindeks.
 */
function readForm(formData: FormData): AhspPayload {
  const raw = String(formData.get("components") ?? "[]");
  let components: AhspComponentPayload[] = [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      components = parsed
        .filter((c): c is AhspComponentPayload => Boolean(c) && typeof c === "object")
        .filter((c) => c.priceItemId && Number(c.coefficient) > 0)
        .map((c) => ({ priceItemId: String(c.priceItemId), coefficient: String(c.coefficient) }));
    }
  } catch {
    components = [];
  }

  return {
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    unit: String(formData.get("unit") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || null,
    overheadPct: String(formData.get("overheadPct") ?? "10").trim(),
    notes: String(formData.get("notes") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
    components,
  };
}

export async function createAhspAction(_prev: AhspActionState, formData: FormData): Promise<AhspActionState> {
  try {
    await adminFetch("/ahsp", { method: "POST", body: JSON.stringify(readForm(formData)) });
    revalidatePath("/admin/ahsp");
    return { status: "success", message: "AHSP dibuat" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan AHSP" };
  }
}

export async function updateAhspAction(
  id: string,
  _prev: AhspActionState,
  formData: FormData
): Promise<AhspActionState> {
  try {
    await adminFetch(`/ahsp/${id}`, { method: "PUT", body: JSON.stringify(readForm(formData)) });
    revalidatePath("/admin/ahsp");
    return { status: "success", message: "AHSP diperbarui" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal menyimpan AHSP" };
  }
}

export async function deleteAhspAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/ahsp/${id}`, { method: "DELETE" });
    revalidatePath("/admin/ahsp");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus AHSP" };
  }
}
