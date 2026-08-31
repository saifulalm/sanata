/**
 * Client-side Authentication Helper
 *
 * This module provides utilities for managing authentication tokens
 * on the client side (frontend). It handles:
 * - Token storage and retrieval
 * - Token refresh logic
 * - Automatic token inclusion in requests
 * - Error handling for auth failures
 */

const ACCESS_TOKEN_KEY = "sanata_access_token";
const REFRESH_TOKEN_KEY = "sanata_refresh_token";
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // Refresh 1 minute before actual expiry

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "USER";
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    accessToken: string;
  };
  error?: string;
}

/**
 * Parse JWT payload without verification (client-side only)
 */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if access token is expired or about to expire
 */
export function isTokenExpiredOrExpiringSoon(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;

  const expiryTime = payload.exp * 1000;
  return expiryTime - TOKEN_EXPIRY_BUFFER_MS < Date.now();
}

/**
 * Get time remaining until token expires (in milliseconds)
 * Returns 0 if expired or invalid
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return 0;

  const expiryTime = payload.exp * 1000;
  return Math.max(0, expiryTime - Date.now());
}

/**
 * Store tokens in memory (more secure than localStorage)
 * Note: For production, consider using httpOnly cookies set by the server
 */
class InMemoryTokenStore {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    // Also store in sessionStorage as backup (cleared on tab close)
    try {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch {
      // Storage might be full or disabled
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;

    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  restoreFromStorage(): boolean {
    try {
      const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        // Verify tokens are not expired
        if (!isTokenExpiredOrExpiringSoon(accessToken)) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          return true;
        }
        // Clean up expired tokens
        this.clearTokens();
      }
    } catch {
      // Storage might be disabled
    }
    return false;
  }
}

export const tokenStore = new InMemoryTokenStore();

/**
 * Make authenticated API request with automatic token refresh
 */
export async function authenticatedFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  apiBaseUrl: string = "/api"
): Promise<T> {
  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${apiBaseUrl}${url}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies for refresh token
    });
  };

  // Try with current access token
  let accessToken = tokenStore.getAccessToken();
  let response = await doFetch(accessToken);

  // If unauthorized, try to refresh the token
  if (response.status === 401) {
    const refreshToken = tokenStore.getRefreshToken();

    if (refreshToken) {
      // Attempt to refresh
      const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json() as AuthResponse;
        if (refreshData.success && refreshData.data) {
          // Store new tokens and retry
          tokenStore.setTokens({
            accessToken: refreshData.data.accessToken,
            refreshToken: refreshToken, // Refresh token stays the same
          });
          response = await doFetch(refreshData.data.accessToken);
        }
      }

      // If refresh failed, clear tokens
      if (!response.ok) {
        tokenStore.clearTokens();
      }
    } else {
      tokenStore.clearTokens();
    }
  }

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await response.json() as { error?: string };
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Response might not be JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * API client for common authentication operations
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string, totpCode?: string): Promise<AuthUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...(totpCode && { totpCode }) }),
      credentials: "include",
    });

    const data = await response.json() as AuthResponse;

    if (!data.success || !data.data) {
      throw new Error(data.error || "Login failed");
    }

    tokenStore.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: "", // Server sets refresh token in httpOnly cookie
    });

    return data.data.user;
  },

  /**
   * Register new user
   */
  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      credentials: "include",
    });

    const data = await response.json() as AuthResponse;

    if (!data.success || !data.data) {
      throw new Error(data.error || "Registration failed");
    }

    tokenStore.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: "",
    });

    return data.data.user;
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<AuthUser> {
    return authenticatedFetch<AuthResponse>("/auth/me").then(data => {
      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to get user");
      }
      return data.data.user;
    });
  },

  /**
   * Refresh access token
   */
  async refresh(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken();

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    const data = await response.json() as AuthResponse;

    if (!data.success || !data.data) {
      tokenStore.clearTokens();
      throw new Error(data.error || "Token refresh failed");
    }

    tokenStore.setTokens({
      accessToken: data.data.accessToken,
      refreshToken: refreshToken || "",
    });
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      tokenStore.clearTokens();
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = tokenStore.getAccessToken();
    return !!accessToken && !isTokenExpiredOrExpiringSoon(accessToken);
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return tokenStore.getAccessToken();
  },

  /**
   * Get Authorization header value
   */
  getAuthHeader(): Record<string, string> {
    const token = tokenStore.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  /**
   * Initialize auth state from storage
   */
  initialize(): boolean {
    return tokenStore.restoreFromStorage();
  },
};

export default authApi;
