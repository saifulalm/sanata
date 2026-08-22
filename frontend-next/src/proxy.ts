import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, isAccessTokenValid, refreshWithExpress } from "@/lib/adminAuth";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (isAccessTokenValid(accessToken)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const result = await refreshWithExpress(refreshToken);
    if (result.ok) {
      const response = NextResponse.next();
      response.cookies.set(ACCESS_COOKIE, result.accessToken, {
        httpOnly: true,
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
    }
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
