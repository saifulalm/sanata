"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError, getAdminSession } from "@/lib/adminApi";

export type UserActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/** Satu-satunya jalan membuat akun ADMIN/EDITOR — pendaftaran publik selalu USER. */
export async function createUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await getAdminSession();

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { status: "error", message: "Password minimal 8 karakter" };
  }

  try {
    await adminFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        password,
        role: String(formData.get("role") ?? "EDITOR"),
        isActive: formData.get("isActive") !== null,
      }),
    });
    revalidatePath("/admin/users");
    return { status: "success", message: "Pengguna dibuat" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof AdminApiError ? err.message : "Gagal membuat pengguna",
    };
  }
}

export async function updateUserRoleAction(id: string, role: string): Promise<UserActionState> {
  const session = await getAdminSession();
  if (session.sub === id && role !== "ADMIN") {
    return { status: "error", message: "Anda tidak dapat menurunkan role akun sendiri" };
  }
  try {
    await adminFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify({ role }) });
    revalidatePath("/admin/users");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal memperbarui pengguna" };
  }
}

export async function toggleUserActiveAction(id: string, isActive: boolean): Promise<UserActionState> {
  try {
    await adminFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify({ isActive }) });
    revalidatePath("/admin/users");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Gagal memperbarui pengguna" };
  }
}

export async function deleteUserAction(id: string): Promise<{ ok: boolean; message?: string }> {
  const session = await getAdminSession();
  if (session.sub === id) {
    return { ok: false, message: "Anda tidak dapat menghapus akun sendiri" };
  }
  try {
    await adminFetch(`/users/${id}`, { method: "DELETE" });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal menghapus pengguna" };
  }
}
