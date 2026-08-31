/**
 * Client-side API fetch wrapper for admin pages
 * Uses cookies for authentication
 */

import { ACCESS_COOKIE, isAccessTokenValid } from "@/lib/adminAuth";
import { fetchWithTimeout, isHttpRequestError, readJsonSafely } from "@/lib/http";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: unknown
  ) {
    super(message);
  }
}

/**
 * Get access token from cookie (client-side)
 */
function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(ACCESS_COOKIE + "=([^;]+)"));
  return match ? match[1] : null;
}

/**
 * Client-side admin fetch - uses ACCESS_COOKIE for auth
 * ACCESS_COOKIE is set with httpOnly: false so JavaScript can read it
 * REFRESH_COOKIE is httpOnly (server-only), so refresh must be handled server-side
 */
export async function adminFetch<T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<T> {
  const token = getAccessTokenFromCookie();

  // Check if token is expired
  if (token && !isAccessTokenValid(token)) {
    console.log("[adminFetch] Token expired, cannot refresh in client-side");
    // Don't throw - let the request try anyway, backend will return 401
  }

  const { raw, ...requestInit } = init;
  const isMultipart = requestInit.body instanceof FormData;

  let res: Response;
  try {
    const headers: Record<string, string> = {
      ...(requestInit.body && !isMultipart ? { "Content-Type": "application/json" } : {}),
      ...requestInit.headers as Record<string, string>,
    };

    // Add Authorization header if token exists
    const currentToken = getAccessTokenFromCookie();
    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    console.log("[adminFetch] Request:", path, "Has token:", !!currentToken);

    res = await fetchWithTimeout(`${API_URL}${path}`, {
      ...requestInit,
      headers,
      credentials: "include", // Important: include cookies in cross-origin requests
    });

    console.log("[adminFetch] Response:", path, "Status:", res.status);
  } catch (error) {
    console.error("[adminFetch] Network error:", error);
    if (isHttpRequestError(error)) {
      throw new AdminApiError(503, "Backend admin tidak dapat dijangkau. Pastikan server backend berjalan.");
    }
    throw new AdminApiError(500, "Terjadi gangguan saat menghubungi backend admin.");
  }

  // Handle 401 - backend will reject invalid/expired tokens
  if (res.status === 401) {
    console.log("[adminFetch] Got 401 - token may be invalid or expired");
    let errorMsg = "Unauthorized. Silakan login ulang.";
    try {
      const errorJson = await res.json() as { message?: string };
      errorMsg = errorJson.message ?? errorMsg;
    } catch {
      // Ignore parse errors
    }
    throw new AdminApiError(401, errorMsg);
  }

  if (raw) {
    const text = await res.text();
    if (!res.ok) throw new AdminApiError(res.status, "Request failed");
    return text as T;
  }

  const json = await readJsonSafely<{ message?: string; errors?: unknown } & T>(res);
  if (!res.ok) {
    throw new AdminApiError(res.status, json?.message ?? "Request failed", json?.errors);
  }
  if (!json) {
    throw new AdminApiError(502, "Respons backend admin tidak valid.");
  }
  return json as T;
}
