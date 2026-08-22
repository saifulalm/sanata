"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type InquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export async function updateInquiryStatusAction(
  id: string,
  status: InquiryStatus
): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/inquiries/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    revalidatePath("/admin/inquiries");
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal mengubah status" };
  }
}

export async function deleteInquiryAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await adminFetch(`/inquiries/${id}`, { method: "DELETE" });
    revalidatePath("/admin/inquiries");
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus pesan" };
  }
}
