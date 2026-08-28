import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateSecret, verify, generateURI } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { env } from "@/config/env";
import type { RegisterInput, LoginInput } from "@/validators/auth.validator";

function hashToken(token: string) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  console.log("[AuthService/hashToken] Token length:", token.length);
  console.log("[AuthService/hashToken] Hash:", hash.substring(0, 20) + "...");
  return hash;
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

async function issueTokens(user: { id: string; name: string; email: string; role: "ADMIN" | "EDITOR" | "USER" }) {
  console.log("[AuthService/issueTokens] Starting for user:", user.id);
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);
  console.log("[AuthService/issueTokens] Refresh token expiresAt:", expiresAt.toISOString());
  console.log("[AuthService/issueTokens] Refresh token expiry (Unix):", Math.floor(expiresAt.getTime() / 1000));

  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt },
  });
  console.log("[AuthService/issueTokens] Refresh token stored in DB");

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("Email already registered");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: "USER" },
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function login(input: LoginInput & { totpCode?: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  if (user.twoFactorEnabled) {
    if (!input.totpCode) {
      throw new ApiError(401, "Two-factor authentication code required", { requiresTwoFactor: true });
    }
    const result = await verify({ secret: user.twoFactorSecret!, token: input.totpCode });
    if (!result.valid) {
      throw new ApiError(401, "Invalid two-factor authentication code", { requiresTwoFactor: true });
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  console.log("[AuthService/refresh] Starting refresh...");
  let payload: { sub: string; exp: number; iat: number };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    console.log("[AuthService/refresh] Token verification failed:", err instanceof Error ? err.message : "Unknown");
    throw ApiError.unauthorized("Invalid refresh token");
  }

  console.log("[AuthService/refresh] Token payload:", payload);
  console.log("[AuthService/refresh] Token exp (Unix):", payload.exp);
  console.log("[AuthService/refresh] Current time (Unix):", Math.floor(Date.now() / 1000));
  console.log("[AuthService/refresh] Token expired?", payload.exp < Math.floor(Date.now() / 1000));

  const tokenHash = hashToken(refreshToken);
  console.log("[AuthService/refresh] Looking for tokenHash:", tokenHash.substring(0, 20) + "...");

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  console.log("[AuthService/refresh] Stored token found:", stored ? "YES" : "NO");
  if (stored) {
    console.log("[AuthService/refresh] Stored expiresAt:", stored.expiresAt);
    console.log("[AuthService/refresh] Stored revokedAt:", stored.revokedAt);
    console.log("[AuthService/refresh] expiresAt < now?", stored.expiresAt < new Date());
  }

  if (!stored) {
    console.log("[AuthService/refresh] REJECTED: Token not found in database");
    throw ApiError.unauthorized("Refresh token expired or revoked");
  }
  if (stored.revokedAt) {
    console.log("[AuthService/refresh] REJECTED: Token was revoked");
    throw ApiError.unauthorized("Refresh token expired or revoked");
  }
  if (stored.expiresAt < new Date()) {
    console.log("[AuthService/refresh] REJECTED: Token expired");
    throw ApiError.unauthorized("Refresh token expired or revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    console.log("[AuthService/refresh] REJECTED: User not found or inactive");
    throw ApiError.unauthorized("User not found");
  }

  console.log("[AuthService/refresh] SUCCESS: About to revoke old token and issue new ones");
  await prisma.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });
  const tokens = await issueTokens(user);
  console.log("[AuthService/refresh] SUCCESS: New tokens issued");
  return { user: publicUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return publicUser(user);
}

export async function setupTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const secret = generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });

  const otpauthUrl = generateURI({ issuer: "Sanata Construction", label: user.email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, otpauthUrl, qrCodeDataUrl };
}

export async function enableTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) throw ApiError.badRequest("Run 2FA setup first");

  const result = await verify({ secret: user.twoFactorSecret, token: code });
  if (!result.valid) throw ApiError.badRequest("Invalid verification code");

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
}

export async function disableTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) throw ApiError.badRequest("Two-factor authentication is not enabled");

  const result = await verify({ secret: user.twoFactorSecret, token: code });
  if (!result.valid) throw ApiError.badRequest("Invalid verification code");

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
}
