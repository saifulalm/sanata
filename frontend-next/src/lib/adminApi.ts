import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, decodeAccessToken } from "@/lib/adminAuth";
import { fetchWithTimeout, isHttpRequestError, readJsonSafely } from "@/lib/http";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export interface AdminSession {
  sub: string;
  role: "ADMIN" | "EDITOR" | "USER";
  name: string;
}

export async function getAdminSession(): Promise<AdminSession> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  const decoded = token ? decodeAccessToken(token) : null;
  if (!decoded) redirect("/admin/login");
  return { sub: decoded.sub, role: decoded.role as AdminSession["role"], name: decoded.name };
}

export async function requireAdminRole(...roles: Array<"ADMIN" | "EDITOR" | "USER">): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!roles.includes(session.role)) redirect("/admin");
  return session;
}

/**
 * `raw: true` mengembalikan body apa adanya sebagai teks — dipakai untuk endpoint
 * non-JSON seperti ekspor CSV.
 */
export async function adminFetch<T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<T> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  const { raw, ...requestInit } = init;

  // FormData harus menentukan boundary-nya sendiri, jadi Content-Type tidak
  // boleh dipaksa ke JSON untuk unggahan berkas.
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
      cache: "no-store",
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

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: unknown
  ) {
    super(message);
  }
}
