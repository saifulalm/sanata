import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "@/config/env";

export type AccessTokenPayload = {
  sub: string;
  role: "ADMIN" | "EDITOR" | "USER";
  name: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: `${env.jwt.refreshExpiresDays}d` as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
}
