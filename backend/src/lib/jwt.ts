import jwt, { type SignOptions, type VerifyOptions, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { env } from "@/config/env";

export type AccessTokenPayload = {
  sub: string;
  role: "ADMIN" | "EDITOR" | "USER" | "CLIENT";
  name: string;
  type?: "client" | "admin";
};

export type RefreshTokenPayload = {
  sub: string;
  exp: number;
  iat: number;
  type?: "client" | "admin";
};

/**
 * Decode token without verification (for debugging/logging)
 */
export function decodeToken(token: string): { header: object; payload: object } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return { header, payload };
  } catch {
    return null;
  }
}

/**
 * Check if token is expired without full verification
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded || typeof decoded.exp !== "number") return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpiresIn(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number; iat?: number } | null;
    if (!decoded || typeof decoded.exp !== "number" || typeof decoded.iat !== "number") return null;
    return (decoded.exp - decoded.iat) * 1000;
  } catch {
    return null;
  }
}

/**
 * Get time until token expires in milliseconds
 * Returns negative value if already expired
 */
export function getTimeUntilExpiry(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded || typeof decoded.exp !== "number") return null;
    return decoded.exp * 1000 - Date.now();
  } catch {
    return null;
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const token = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires as SignOptions["expiresIn"],
  });
  console.log("[JWT] Signed access token:", token.substring(0, 30) + "...");
  console.log("[JWT] Access secret length:", env.jwt.accessSecret.length);
  return token;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  console.log("[JWT] === VERIFY CALLED ===");
  console.log("[JWT] Token length:", token.length);
  console.log("[JWT] Token preview:", token.substring(0, 30) + "...");

  const decoded = decodeToken(token);
  if (!decoded) {
    console.log("[JWT] VERIFY FAILED: Invalid token format");
    throw new JsonWebTokenError("Invalid token format");
  }

  // Check expiration before verification
  if (isTokenExpired(token)) {
    throw new TokenExpiredError("jwt expired", new Date());
  }

  // Restrict to single algorithm to prevent algorithm confusion attacks
  const verifyOptions: VerifyOptions = {
    algorithms: ["HS256"],
  };

  try {
    const result = jwt.verify(token, env.jwt.accessSecret, verifyOptions) as AccessTokenPayload;
    return result;
  } catch (err) {
    if (err instanceof TokenExpiredError) throw err;
    if (err instanceof JsonWebTokenError) throw err;
    throw err;
  }
}

export function signRefreshToken(userId: string, type?: "client" | "admin"): string {
  return jwt.sign({ sub: userId, type }, env.jwt.refreshSecret, {
    expiresIn: `${env.jwt.refreshExpiresDays}d` as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new JsonWebTokenError("Invalid token format");
  }

  if (isTokenExpired(token)) {
    throw new TokenExpiredError("Refresh token expired", new Date());
  }

  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}
