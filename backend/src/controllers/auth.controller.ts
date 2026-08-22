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
    path: "/api/auth",
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.register(input);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.login(input);
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("Missing refresh token");
  const { accessToken, refreshToken, user } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, data: { user, accessToken } });
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
