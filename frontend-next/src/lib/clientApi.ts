/**
 * Client-side API helper for admin pages
 * Use this instead of adminApi for client components
 */

import { REFRESH_COOKIE, isAccessTokenValid, refreshWithExpress } from "@/lib/adminAuth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const ACCESS_COOKIE = "admin_access";

interface ApiError {
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Get access token from cookie (client-side)
 */
function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  // Fixed: Use correct regex pattern for cookie parsing
  const match = document.cookie.match(new RegExp(ACCESS_COOKIE + "=([^;]+)"));
  return match ? match[1] : null;
}

/**
 * Get refresh token from cookie (client-side)
 */
function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(REFRESH_COOKIE + "=([^;]+)"));
  return match ? match[1] : null;
}

/**
 * Set access token cookie (client-side)
 */
function setAccessTokenCookie(token: string, maxAge: number): void {
  if (typeof document === "undefined") return;

  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  document.cookie = `${ACCESS_COOKIE}=${token}; expires=${expires}; path=/; sameSite=lax`;
}

/**
 * Redirect to login page
 */
function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  window.location.href = "/admin/login";
}

/**
 * Try to refresh the access token using refresh cookie
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) {
    console.log("[clientApi] No refresh token available");
    return false;
  }

  try {
    const result = await refreshWithExpress(refreshToken);

    if (result.ok) {
      setAccessTokenCookie(result.accessToken, 15 * 60); // 15 minutes
      return true;
    }

    return false;
  } catch (error) {
    console.error("[clientApi] Token refresh error:", error);
    return false;
  }
}

/**
 * Check if token is valid and not expired
 */
function isTokenValid(): boolean {
  const token = getAccessTokenFromCookie();
  return isAccessTokenValid(token ?? undefined);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Check token validity
  if (!isTokenValid()) {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      redirectToLogin();
      throw new Error("Session expired. Silakan login ulang.");
    }
  }

  const accessToken = getAccessTokenFromCookie();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    credentials: "include",
  });

  // Handle 401 Unauthorized
  if (res.status === 401) {
    console.log("[clientApi] Got 401, attempting token refresh...");

    // Try to refresh the token
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      // Retry the request with new token
      const newToken = getAccessTokenFromCookie();
      if (newToken) {
        console.log("[clientApi] Retrying request with new token...");
        const retryRes = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          },
          credentials: "include",
        });

        if (retryRes.ok) {
          return retryRes.json();
        }

        if (retryRes.status === 401) {
          // Still unauthorized after refresh
          redirectToLogin();
          throw new Error("Unauthorized. Silakan login ulang.");
        }
      }
    }

    // Refresh failed or no new token
    redirectToLogin();
    const errorData = await res.json().catch(() => ({ message: "Unauthorized" }));
    throw new Error(errorData.message || "Unauthorized. Silakan login ulang.");
  }

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
