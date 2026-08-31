import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { registerSchema, loginSchema } from "@/validators/auth.validator";
import { twoFactorCodeSchema } from "@/validators/twoFactor.validator";
import * as authService from "@/services/auth.service";
import { env } from "@/config/env";

const REFRESH_COOKIE = "sanata_refresh";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.register(input);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log("[Auth] Login endpoint hit");
  console.log("[Auth] JWT_ACCESS_SECRET length:", env.jwt.accessSecret.length);
  console.log("[Auth] JWT_ACCESS_SECRET first 10 chars:", env.jwt.accessSecret.substring(0, 10));

  const input = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.login(input);

  console.log("[Auth] Generated token:", accessToken.substring(0, 30) + "...");
  console.log("[Auth] Token payload:", JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()));
  console.log("[Auth] Refresh token:", refreshToken ? refreshToken.substring(0, 20) + "..." : "NONE");

  setRefreshCookie(res, refreshToken);

  // Log the set-cookie header
  const setCookieHeader = res.getHeader("set-cookie");
  console.log("[Auth] set-cookie header:", setCookieHeader);

  res.json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  console.log("[Auth/Refresh] === REFRESH CALLED ===");
  console.log("[Auth/Refresh] Request cookies:", req.cookies);
  console.log("[Auth/Refresh] Request body:", req.body);

  // Accept token from body (for Server Components) or from cookie (for browser)
  const body = req.body as Record<string, unknown> | undefined;
  const bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
  const cookieToken = req.cookies?.[REFRESH_COOKIE];
  const token = bodyToken || cookieToken;

  console.log("[Auth/Refresh] Body token:", bodyToken ? "provided" : "missing");
  console.log("[Auth/Refresh] Cookie token:", cookieToken ? "provided" : "missing");
  console.log("[Auth/Refresh] Final token:", token ? `length=${token.length}` : "NONE");

  if (!token) {
    console.log("[Auth/Refresh] REJECTED: No token found");
    throw ApiError.unauthorized("Missing refresh token");
  }

  try {
    const { accessToken, refreshToken: newRefreshToken, user } = await authService.refresh(token);
    console.log("[Auth/Refresh] SUCCESS: Generated new access token");
    setRefreshCookie(res, newRefreshToken);
    res.json({ success: true, data: { user, accessToken } });
  } catch (err) {
    console.log("[Auth/Refresh] FAILED:", err instanceof Error ? err.message : "Unknown error");
    throw err;
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.json({ success: true, data: null });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.sub);
  res.json({ success: true, data: user });
});

export const setupTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.setupTwoFactor(req.user!.sub);
  res.json({ success: true, data: result });
});

export const enableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const { code } = twoFactorCodeSchema.parse(req.body);
  await authService.enableTwoFactor(req.user!.sub, code);
  res.json({ success: true, data: { twoFactorEnabled: true } });
});

export const disableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const { code } = twoFactorCodeSchema.parse(req.body);
  await authService.disableTwoFactor(req.user!.sub, code);
  res.json({ success: true, data: { twoFactorEnabled: false } });
});
