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
      sameSite: "strict", // CSRF protection
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
      sameSite: "strict", // CSRF protection
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
      sameSite: "strict", // CSRF protection
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
// PASSWORD RESET (Public routes)
// ============================================================

export async function requestReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest("Email wajib diisi");
    }

    // Always return success to prevent email enumeration
    const result = await clientService.requestPasswordReset(email);

    // Even if email doesn't exist, we return success
    // In production, send email with reset link
    res.json({
      success: true,
      message: result
        ? "Link reset password telah dikirim ke email Anda"
        : "Jika email terdaftar, link reset password telah dikirim",
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw ApiError.badRequest("Token dan password baru wajib diisi");
    }

    if (password.length < 6) {
      throw ApiError.badRequest("Password minimal 6 karakter");
    }

    await clientService.resetPassword(token, password);

    res.json({
      success: true,
      message: "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// S-CURVE DATA
// ============================================================

export async function getProjectSCurveData(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const scurveData = await clientService.getProjectSCurve(clientId, rabId);
    res.json({ success: true, data: scurveData });
  } catch (err) {
    next(err);
  }
}

export async function getSectionLevelSCurveData(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const scurveData = await clientService.getSectionLevelSCurve(clientId, rabId);
    res.json({ success: true, data: scurveData });
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

// ============================================================
// RECENT DOCUMENTS
// ============================================================

export async function getRecentDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { limit } = req.query;
    const documents = await clientService.getRecentDocuments(clientId, limit ? parseInt(limit as string) : 5);
    res.json({ success: true, data: documents });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const stats = await clientService.getClientDashboardStats(clientId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PROJECT TEAM
// ============================================================

export async function getTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const team = await clientService.getProjectTeam(clientId, rabId);
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PROJECT MILESTONES
// ============================================================

export async function getMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const milestones = await clientService.getProjectMilestones(clientId, rabId);
    res.json({ success: true, data: milestones });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// S-CURVE DATA
// ============================================================

export async function getSCurve(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const sCurve = await clientService.getProjectSCurve(clientId, rabId);
    res.json({ success: true, data: sCurve });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PROJECT PHOTOS
// ============================================================

export async function getPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { rabId } = req.params;
    const { limit } = req.query;
    const photos = await clientService.getProjectPhotos(clientId, rabId, limit ? parseInt(limit as string) : 20);
    res.json({ success: true, data: photos });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PASSWORD CHANGE
// ============================================================

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest("Password saat ini dan password baru wajib diisi");
    }

    const result = await clientService.changeClientPassword(clientId, currentPassword, newPassword);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export async function getPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const preferences = await clientService.getNotificationPreferences(clientId);
    res.json({ success: true, data: preferences });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.sub;
    const { preferences } = req.body;

    if (!preferences || !Array.isArray(preferences)) {
      throw ApiError.badRequest("Preferensi harus berupa array");
    }

    const result = await clientService.updateNotificationPreferences(clientId, preferences);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
}
