/**
 * Client-side API fetch wrapper for admin pages
 * Uses the same API as server-side adminFetch but without cookies
 * Requires authentication to be handled separately (e.g., via headers)
 */

import { ACCESS_COOKIE, decodeAccessToken } from "@/lib/adminAuth";
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
 * Client-side admin fetch - uses cookies for auth
 */
export async function adminFetch<T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<T> {
  // Get token from cookie
  const cookieStore = typeof document !== "undefined"
    ? document.cookie
    : "";
  const tokenMatch = cookieStore.match(new RegExp(`${ACCESS_COOKIE}=([^;]+)`));
  const token = tokenMatch ? tokenMatch[1] : null;

  const { raw, ...requestInit } = init;
  const isMultipart = requestInit.body instanceof FormData;

  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_URL}${path}`, {
      ...requestInit,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(requestInit.body && !isMultipart ? { "Content-Type": "application/json" } : {}),
        ...requestInit.headers,
      },
      credentials: "include",
    });
  } catch (error) {
    if (isHttpRequestError(error)) {
      throw new AdminApiError(503, "Backend admin tidak dapat dijangkau. Pastikan server backend berjalan.");
    }
    throw new AdminApiError(500, "Terjadi gangguan saat menghubungi backend admin.");
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
