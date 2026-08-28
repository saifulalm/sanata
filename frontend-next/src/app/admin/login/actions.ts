"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE, loginWithExpress, type LoginWithExpressResult } from "@/lib/adminAuth";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export type LoginState = {
  status: "idle" | "error" | "requiresTwoFactor";
  message?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const totpCode = String(formData.get("totpCode") ?? "") || undefined;
  const next = String(formData.get("next") ?? "/admin");

  console.log("[Login Action] Attempting login for:", email);

  let result: LoginWithExpressResult;
  try {
    result = await loginWithExpress(email, password, totpCode);
  } catch {
    return { status: "error", message: "Tidak dapat terhubung ke backend. Pastikan server backend berjalan." };
  }

  console.log("[Login Action] Login result:", result.ok ? "SUCCESS" : "FAILED - " + result.message);

  if (!result.ok) {
    if (result.errors?.requiresTwoFactor) {
      return { status: "requiresTwoFactor", message: result.message };
    }
    return { status: "error", message: result.message ?? "Email atau kata sandi salah." };
  }

  if (result.user.role === "USER") {
    return { status: "error", message: "Akun Anda tidak memiliki akses ke panel admin." };
  }

  const store = await cookies();
  console.log("[Login Action] Setting cookies...");
  console.log("[Login Action] Access token:", result.accessToken.substring(0, 30) + "...");
  console.log("[Login Action] Refresh token:", result.refreshToken ? result.refreshToken.substring(0, 30) + "..." : "NONE");

  // Note: ACCESS_COOKIE must NOT be httpOnly so client-side components can read the token
  // The token is short-lived (15 min) so this is acceptable for a SPA pattern
  store.set(ACCESS_COOKIE, result.accessToken, { sameSite: "lax", maxAge: ACCESS_MAX_AGE, path: "/" });
  if (result.refreshToken) {
    store.set(REFRESH_COOKIE, result.refreshToken, { httpOnly: true, sameSite: "lax", maxAge: REFRESH_MAX_AGE, path: "/" });
  }

  console.log("[Login Action] Cookies set successfully");

  redirect(next);
}
