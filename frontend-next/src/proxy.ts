import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy/Middleware for authentication
 * Admin routes are protected server-side, client portal is handled client-side
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // CLIENT PORTAL - pass through (auth handled client-side)
  // ============================================
  if (pathname.startsWith("/client")) {
    return NextResponse.next();
  }

  // ============================================
  // ADMIN AUTHENTICATION (/admin/*)
  // ============================================
  const ACCESS_COOKIE = "access_token";
  const REFRESH_COOKIE = "refresh_token";
  const ACCESS_MAX_AGE = 15 * 60;

  // Skip auth check for login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Only apply to /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  // Check if access token exists and has valid structure
  // Simple JWT structure check (header.payload.signature)
  if (accessToken && accessToken.includes(".")) {
    const parts = accessToken.split(".");
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        const { exp } = JSON.parse(payload);
        if (exp && exp * 1000 > Date.now()) {
          return NextResponse.next();
        }
      } catch {
        // Invalid token structure
      }
    }
  }

  // No valid token - redirect to login
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/client/:path*",
  ],
};
