/**
 * Client Portal Controller
 */

import { Request, Response, NextFunction } from "express";
import * as clientService from "@/services/clientPortal.service";
import { ApiError } from "@/utils/ApiError";

// ============================================================
// AUTH
// ============================================================

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, phone, companyName } = req.body;

    if (!email || !password || !name) {
      throw ApiError.badRequest("Email, password, dan nama wajib diisi");
    }

    if (password.length < 6) {
      throw ApiError.badRequest("Password minimal 6 karakter");
    }

    const result = await clientService.registerClient({ email, password, name, phone, companyName });

    res.cookie("client_refresh", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        client: result.client,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest("Email dan password wajib diisi");
    }

    const result = await clientService.loginClient({ email, password });

    res.cookie("client_refresh", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        client: result.client,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    // Try cookie first
    let refreshToken = req.cookies?.client_refresh;

    // Fallback to body
    if (!refreshToken && req.body?.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      throw ApiError.unauthorized("Refresh token diperlukan");
    }

    const result = await clientService.refreshClientToken(refreshToken);

    res.cookie("client_refresh", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        client: result.client,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.client_refresh || req.body?.refreshToken;

    if (refreshToken) {
      await clientService.logoutClient(refreshToken);
    }

    res.clearCookie("client_refresh");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const client = await clientService.getClientProfile(clientId);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const client = await clientService.updateClientProfile(clientId, req.body);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PROJECTS
// ============================================================

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const projects = await clientService.getClientProjects(clientId);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

export async function getProjectDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const details = await clientService.getProjectDetails(clientId, rabId);
    res.json({ success: true, data: details });
  } catch (err) {
    next(err);
  }
}

export async function getProjectProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const progress = await clientService.getProjectProgressData(clientId, rabId);
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// DAILY REPORTS
// ============================================================

export async function getDailyReports(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const { limit, offset, startDate, endDate } = req.query;

    const reports = await clientService.getProjectDailyReports(clientId, rabId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// QC RECORDS
// ============================================================

export async function getQCRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const { limit, offset, result } = req.query;

    const records = await clientService.getProjectQCRecords(clientId, rabId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      result: result as string,
    });

    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;

    const documents = await clientService.getProjectDocuments(clientId, rabId);
    res.json({ success: true, data: documents });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { unreadOnly, limit } = req.query;

    const result = await clientService.getClientNotifications(clientId, {
      unreadOnly: unreadOnly === "true",
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { id } = req.params;

    await clientService.markNotificationRead(clientId, id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    await clientService.markAllNotificationsRead(clientId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
