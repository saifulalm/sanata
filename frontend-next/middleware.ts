import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't need auth
const PUBLIC_ADMIN_ROUTES = [
  "/admin/login",
];

// Routes that need authentication
const PROTECTED_ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/ahsp",
  "/admin/audit-log",
  "/admin/broadcasts",
  "/admin/categories",
  "/admin/contents",
  "/admin/daily-reports",
  "/admin/inquiries",
  "/admin/media",
  "/admin/price-items",
  "/admin/products",
  "/admin/quotations",
  "/admin/rab",
  "/admin/roles",
  "/admin/scraper",
  "/admin/security",
  "/admin/settings",
  "/admin/signatories",
  "/admin/site-content",
  "/admin/submissions",
  "/admin/users",
  "/admin/workforce",
];

// Client portal routes - handled client-side in layout.tsx
// DO NOT add middleware auth for /client/* routes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip client portal routes - auth handled by layout.tsx
  if (pathname.startsWith("/client")) {
    return NextResponse.next();
  }

  // Allow public admin routes
  if (PUBLIC_ADMIN_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Check if it's a protected admin route
  const isProtectedAdminRoute = PROTECTED_ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedAdminRoute) {
    return NextResponse.next();
  }

  // Check for admin access token
  const adminToken = request.cookies.get("access_token")?.value;

  // If no token, redirect to login
  if (!adminToken) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/client/:path*",
  ],
};
