import { fetchWithTimeout, isHttpRequestError, readJsonSafely } from "@/lib/http";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const ACCESS_COOKIE = "admin_access";
export const REFRESH_COOKIE = "admin_refresh";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "USER";
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}

export interface LoginErrorDetails {
  requiresTwoFactor?: boolean;
  [key: string]: unknown;
}

export type LoginWithExpressResult =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string | null;
      user: AdminUser;
    }
  | {
      ok: false;
      status: number;
      message: string;
      errors?: LoginErrorDetails;
    };

interface DecodedAccessToken {
  sub: string;
  role: string;
  name: string;
  exp: number;
  iat: number;
}

export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(json) as DecodedAccessToken;
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token: string | undefined, skewSeconds = 10): boolean {
  if (!token) return false;
  const decoded = decodeAccessToken(token);
  if (!decoded) return false;
  return decoded.exp * 1000 > Date.now() + skewSeconds * 1000;
}

function extractCookieValue(setCookieHeader: string, name: string): string | null {
  const match = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export async function loginWithExpress(email: string, password: string, totpCode?: string): Promise<LoginWithExpressResult> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode }),
    });

    const json = await readJsonSafely<{ message?: string; errors?: LoginErrorDetails; data?: { accessToken: string; user: AdminUser } }>(res);

    if (!res.ok) {
      return {
        ok: false as const,
        status: res.status,
        message: json?.message ?? "Login gagal. Silakan coba lagi.",
        errors: json?.errors,
      };
    }

    if (!json?.data?.accessToken || !json?.data?.user) {
      return {
        ok: false as const,
        status: 502,
        message: "Respons login dari backend tidak valid.",
        errors: undefined,
      };
    }

    const setCookie = res.headers.get("set-cookie") ?? "";
    const refreshToken = extractCookieValue(setCookie, "sanata_refresh");

    return {
      ok: true as const,
      accessToken: json.data.accessToken,
      refreshToken,
      user: json.data.user,
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 503,
      message: isHttpRequestError(error)
        ? "Backend tidak dapat dijangkau. Pastikan server backend berjalan lalu coba lagi."
        : "Terjadi gangguan saat menghubungi server. Silakan coba lagi.",
      errors: undefined,
    };
  }
}

export async function refreshWithExpress(refreshToken: string) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `sanata_refresh=${refreshToken}` },
    });

    if (!res.ok) return { ok: false as const };

    const json = await readJsonSafely<{ data?: { accessToken: string; user: AdminUser } }>(res);
    if (!json?.data?.accessToken || !json?.data?.user) return { ok: false as const };

    const setCookie = res.headers.get("set-cookie") ?? "";
    const newRefreshToken = extractCookieValue(setCookie, "sanata_refresh");

    return {
      ok: true as const,
      accessToken: json.data.accessToken,
      refreshToken: newRefreshToken ?? refreshToken,
      user: json.data.user,
    };
  } catch {
    return { ok: false as const };
  }
}

export async function logoutFromExpress(refreshToken: string) {
  await fetchWithTimeout(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { Cookie: `sanata_refresh=${refreshToken}` },
  }).catch(() => {});
}
