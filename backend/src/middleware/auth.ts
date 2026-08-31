import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/ApiError";
import { verifyAccessToken, AccessTokenPayload } from "@/lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 * Returns null if header is missing, invalid format, or empty
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (scheme.toLowerCase() !== "bearer") return null;

  if (!token || token.trim() === "") return null;

  return token;
}

/**
 * Validate token structure before verification
 * Checks for JWT format (3 parts separated by dots)
 */
function isValidJwtFormat(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  console.log("[Auth Middleware] === REQUEST INCOMING ===");
  console.log("[Auth Middleware] Authorization header:", authHeader ? `Bearer ${authHeader.substring(0, 40)}...` : "MISSING");

  // Step 1: Extract Bearer token
  const token = extractBearerToken(authHeader);

  if (!token) {
    console.log("[Auth Middleware] REJECTED: No valid Bearer token found");
    return next(ApiError.unauthorized("Missing access token"));
  }

  // Step 2: Validate JWT format
  if (!isValidJwtFormat(token)) {
    console.log("[Auth Middleware] REJECTED: Invalid JWT format");
    return next(ApiError.unauthorized("Invalid access token format"));
  }

  console.log("[Auth Middleware] Token length:", token.length);
  console.log("[Auth Middleware] Token preview:", token.substring(0, 30) + "...");

  try {
    // Step 3: Verify token
    req.user = verifyAccessToken(token);
    console.log("[Auth Middleware] SUCCESS: Token verified for user:", req.user?.sub);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.log("[Auth Middleware] REJECTED: Token expired");
      return next(ApiError.unauthorized("Access token has expired"));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      console.log("[Auth Middleware] REJECTED: Invalid token -", err.message);
      return next(ApiError.unauthorized("Invalid access token"));
    }
    console.log("[Auth Middleware] FAILED: Token verification error:", err instanceof Error ? err.message : "Unknown error");
    console.log("[Auth Middleware] FAILED: Error stack:", err instanceof Error ? err.stack : "N/A");
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: Array<"ADMIN" | "EDITOR" | "USER">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log("[Auth Middleware] requireRole: No user found in request");
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      console.log("[Auth Middleware] requireRole: User role", req.user.role, "not in allowed roles:", roles);
      return next(ApiError.forbidden("Insufficient permissions"));
    }

    console.log("[Auth Middleware] requireRole: User", req.user.sub, "authorized with role", req.user.role);
    next();
  };
}
