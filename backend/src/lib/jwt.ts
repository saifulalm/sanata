import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "@/config/env";

export type AccessTokenPayload = {
  sub: string;
  role: "ADMIN" | "EDITOR" | "USER";
  name: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
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

  try {
    const decoded = jwt.decode(token) as { exp: number; iat: number; sub: string; role: string; name: string } | null;
    console.log("[JWT] Decoded header:", JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()));
    console.log("[JWT] Decoded payload:", decoded);
    console.log("[JWT] Access secret first 10 chars:", env.jwt.accessSecret.substring(0, 10));
    console.log("[JWT] Access secret length:", env.jwt.accessSecret.length);

    const result = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    console.log("[JWT] VERIFY SUCCESS");
    return result;
  } catch (err) {
    console.log("[JWT] VERIFY FAILED:", err instanceof Error ? err.message : "Unknown error");
    console.log("[JWT] Full error:", err);
    throw err;
  }
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: `${env.jwt.refreshExpiresDays}d` as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): { sub: string; exp: number; iat: number } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string; exp: number; iat: number };
}
