"use server";

import { revalidatePath } from "next/cache";
import { adminFetch, AdminApiError } from "@/lib/adminApi";

export type TwoFactorState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export async function setupTwoFactorAction(): Promise<{ ok: true; data: TwoFactorSetup } | { ok: false; message: string }> {
  try {
    const res = await adminFetch<{ data: TwoFactorSetup }>("/auth/2fa/setup", { method: "POST" });
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, message: err instanceof AdminApiError ? err.message : "Gagal memulai setup 2FA" };
  }
}

export async function enableTwoFactorAction(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const code = String(formData.get("code") ?? "");
  try {
    await adminFetch("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code }) });
    revalidatePath("/admin/security");
    return { status: "success", message: "2FA berhasil diaktifkan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Kode tidak valid" };
  }
}

export async function disableTwoFactorAction(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  const code = String(formData.get("code") ?? "");
  try {
    await adminFetch("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ code }) });
    revalidatePath("/admin/security");
    return { status: "success", message: "2FA berhasil dinonaktifkan" };
  } catch (err) {
    return { status: "error", message: err instanceof AdminApiError ? err.message : "Kode tidak valid" };
  }
}
