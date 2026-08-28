import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";
import { verifyAccessToken, AccessTokenPayload } from "@/lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  console.log("[Auth Middleware] === REQUEST INCOMING ===");
  console.log("[Auth Middleware] Authorization header:", header ? `Bearer ${header.substring(0, 40)}...` : "MISSING");

  if (!header?.startsWith("Bearer ")) {
    console.log("[Auth Middleware] REJECTED: No Bearer token");
    return next(ApiError.unauthorized("Missing access token"));
  }
  const token = header.slice("Bearer ".length);
  console.log("[Auth Middleware] Token length:", token.length);
  console.log("[Auth Middleware] Token preview:", token.substring(0, 30) + "...");

  try {
    req.user = verifyAccessToken(token);
    console.log("[Auth Middleware] SUCCESS: Token verified for user:", req.user?.sub);
    next();
  } catch (err) {
    console.log("[Auth Middleware] FAILED: Token verification error:", err instanceof Error ? err.message : "Unknown error");
    console.log("[Auth Middleware] FAILED: Error stack:", err instanceof Error ? err.stack : "N/A");
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: Array<"ADMIN" | "EDITOR" | "USER">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden("Insufficient permissions"));
    next();
  };
}
