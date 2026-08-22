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
  return crypto.createHash("sha256").update(token).digest("hex");
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
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt },
  });

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
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token expired or revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw ApiError.unauthorized("User not found");

  await prisma.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });
  const tokens = await issueTokens(user);
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
