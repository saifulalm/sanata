"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

type Result = { ok: boolean; message?: string };

function fail(err: unknown, fallback: string): Result {
  return { ok: false, message: err instanceof AdminApiError ? err.message : fallback };
}

// ─────────────────────────────────────────────────────────────────────────────
// Workforce Roles
// ─────────────────────────────────────────────────────────────────────────────

export async function toggleWorkforceRoleAction(
  id: string,
  isActive: boolean,
): Promise<Result> {
  try {
    await adminFetch(`/workforce-roles/${id}/toggle`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    });
    revalidatePath("/admin/roles");
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal mengubah status role.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Signatories
// ─────────────────────────────────────────────────────────────────────────────

// Only SIGNATORY_ROLES are accepted by the backend for signatories
const SIGNATORY_ROLE_VALUES = [
  "DIREKTUR_UTAMA",
  "DIREKTUR",
  "MANAGER_PROYEK",
  "SITE_MANAGER",
  "PIMPINAN_PROYEK",
  "STAF",
  "LAINNYA",
] as const;
type SignatoryRoleValue = (typeof SIGNATORY_ROLE_VALUES)[number];

export type SignatoryPayload = {
  name: string;
  title: string;
  role: SignatoryRoleValue | null;
  department: string | null;
};

export async function createSignatoryAction(
  payload: SignatoryPayload,
): Promise<Result> {
  try {
    await adminFetch("/signatories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/roles");
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menambahkan penanda tangan.");
  }
}

export async function updateSignatoryAction(
  id: string,
  payload: SignatoryPayload,
): Promise<Result> {
  try {
    await adminFetch(`/signatories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/roles");
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menyimpan perubahan.");
  }
}

export async function deleteSignatoryAction(id: string): Promise<Result> {
  try {
    await adminFetch(`/signatories/${id}`, { method: "DELETE" });
    revalidatePath("/admin/roles");
    return { ok: true };
  } catch (err) {
    return fail(err, "Gagal menghapus penanda tangan.");
  }
}
