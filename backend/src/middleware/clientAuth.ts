/**
 * Client Authentication Middleware
 * For verifying client portal JWT tokens
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/ApiError";
import { verifyAccessToken, AccessTokenPayload } from "@/lib/jwt";

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

export function requireClientAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(ApiError.unauthorized("Token akses diperlukan"));
  }

  try {
    const payload = verifyAccessToken(token) as AccessTokenPayload & { type?: string };

    // Verify this is a client token
    if (payload.type !== "client" && payload.role !== "CLIENT") {
      return next(ApiError.forbidden("Akses ditolak. Gunakan akun klien."));
    }

    // Cast and assign
    (req as any).user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized("Token sudah expired"));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized("Token tidak valid"));
    }
    next(ApiError.unauthorized("Token tidak valid"));
  }
}
