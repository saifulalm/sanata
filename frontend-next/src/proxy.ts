import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, isAccessTokenValid, refreshWithExpress } from "@/lib/adminAuth";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Handle authentication for admin routes (/admin/*)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Only apply to /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Debug logging
  console.log("[Middleware] Path:", pathname);
  console.log("[Middleware] ACCESS_COOKIE exists:", !!accessToken);
  console.log("[Middleware] REFRESH_COOKIE exists:", !!refreshToken);

  // Check if access token is valid
  if (accessToken && isAccessTokenValid(accessToken)) {
    // Token is valid, proceed
    console.log("[Middleware] Token is valid, proceeding");
    return NextResponse.next();
  }

  console.log("[Middleware] Token is invalid or missing, trying refresh...");

  // Token is missing or invalid, try refresh
  if (refreshToken) {
    try {
      const result = await refreshWithExpress(refreshToken);

      if (result.ok) {
        // Refresh succeeded, set new cookies and proceed
        console.log("[Middleware] Token refresh succeeded");
        const response = NextResponse.next();
        response.cookies.set(ACCESS_COOKIE, result.accessToken, {
          httpOnly: false, // Allow client-side access for API calls
          sameSite: "lax",
          maxAge: ACCESS_MAX_AGE,
          path: "/",
        });
        response.cookies.set(REFRESH_COOKIE, result.refreshToken ?? refreshToken, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: REFRESH_MAX_AGE,
          path: "/",
        });
        return response;
      } else {
        console.log("[Middleware] Token refresh returned ok=false");
      }
    } catch (error) {
      console.error("[Middleware] Token refresh error:", error);
    }
  } else {
    console.log("[Middleware] No refresh token available");
  }

  // No valid token or refresh failed, redirect to login
  console.log("[Middleware] Auth failed for path:", pathname);

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);

  // Clean up invalid cookies
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
