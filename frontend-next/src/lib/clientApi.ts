/**
 * Client-side API helper for admin pages
 * Use this instead of adminApi for client components
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface ApiError {
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = typeof window !== "undefined"
    ? document.cookie.split("; ").find(row => row.startsWith("access_token="))?.split("=")[1]
    : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const adminApi = {
  // Generic fetch wrapper
  fetch: <T = unknown>(endpoint: string, options?: RequestInit): Promise<T> =>
    request<T>(endpoint, options),

  // Convenience methods
  get: <T = unknown>(endpoint: string) => request<T>(endpoint),
  post: <T = unknown>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T = unknown>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T = unknown>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};
