/**
 * Client Portal Service
 * Backend service for customer project monitoring
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { env } from "@/config/env";

// Token hashing
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Public client data (without sensitive fields)
function publicClient(client: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
  notifyProgress: boolean;
  notifyDocuments: boolean;
  notifyMessages: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: client.id,
    email: client.email,
    name: client.name,
    phone: client.phone,
    companyName: client.companyName,
    avatarUrl: client.avatarUrl,
    preferredLanguage: client.preferredLanguage,
    notifyProgress: client.notifyProgress,
    notifyDocuments: client.notifyDocuments,
    notifyMessages: client.notifyMessages,
    lastLoginAt: client.lastLoginAt?.toISOString() || null,
    createdAt: client.createdAt.toISOString(),
  };
}

// Issue JWT tokens for client
async function issueClientTokens(client: { id: string; name: string; email: string }) {
  const accessToken = signAccessToken({
    sub: client.id,
    role: "CLIENT" as any,
    name: client.name,
    type: "client"
  });
  const refreshToken = signRefreshToken(client.id, "client");

  const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);

  await prisma.clientRefreshToken.create({
    data: { tokenHash: hashToken(refreshToken), clientId: client.id, expiresAt },
  });

  return { accessToken, refreshToken };
}

// ============================================================
// AUTHENTICATION
// ============================================================

export async function registerClient(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  companyName?: string;
}) {
  // Check if email exists
  const existingEmail = await prisma.client.findUnique({ where: { email: input.email } });
  if (existingEmail) {
    throw ApiError.conflict("Email sudah terdaftar");
  }

  // Check if email exists in User table too
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw ApiError.conflict("Email sudah terdaftar sebagai user");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const client = await prisma.client.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone || null,
      companyName: input.companyName || null,
    },
  });

  const tokens = await issueClientTokens(client);
  return { client: publicClient(client), ...tokens };
}

export async function loginClient(input: { email: string; password: string }) {
  const client = await prisma.client.findUnique({ where: { email: input.email } });

  if (!client) {
    throw ApiError.unauthorized("Email atau password salah");
  }

  if (!client.isActive) {
    throw ApiError.unauthorized("Akun tidak aktif. Hubungi kami untuk bantuan.");
  }

  const valid = await bcrypt.compare(input.password, client.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Email atau password salah");
  }

  // Update last login
  await prisma.client.update({
    where: { id: client.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await issueClientTokens(client);
  return { client: publicClient(client), ...tokens };
}

export async function refreshClientToken(refreshToken: string) {
  let payload: { sub: string; exp: number; iat: number; type?: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Token tidak valid");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.clientRefreshToken.findUnique({ where: { tokenHash } });

  if (!stored) {
    throw ApiError.unauthorized("Token expired atau revoked");
  }

  if (stored.revokedAt) {
    throw ApiError.unauthorized("Token sudah dicabut");
  }

  if (stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Token expired");
  }

  const client = await prisma.client.findUnique({ where: { id: payload.sub } });
  if (!client || !client.isActive) {
    throw ApiError.unauthorized("Client tidak ditemukan");
  }

  // Revoke old token
  await prisma.clientRefreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueClientTokens(client);
  return { client: publicClient(client), ...tokens };
}

export async function logoutClient(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.clientRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getClientProfile(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw ApiError.notFound("Client tidak ditemukan");
  return publicClient(client);
}

export async function updateClientProfile(clientId: string, data: {
  name?: string;
  phone?: string;
  companyName?: string;
  preferredLanguage?: string;
  notifyProgress?: boolean;
  notifyDocuments?: boolean;
  notifyMessages?: boolean;
}) {
  const client = await prisma.client.update({
    where: { id: clientId },
    data,
  });
  return publicClient(client);
}

// ============================================================
// PASSWORD RESET
// ============================================================

export async function requestPasswordReset(email: string): Promise<{ token: string } | null> {
  const client = await prisma.client.findUnique({ where: { email } });
  
  // Always return success to prevent email enumeration
  // Even if email doesn't exist, we don't reveal it
  
  if (!client || !client.isActive) {
    return null;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create reset token record
  await prisma.clientPasswordResetToken.create({
    data: {
      token: resetToken,
      tokenHash,
      clientId: client.id,
      expiresAt,
    },
  });

  // TODO: Send email with reset link
  // For now, return the token (in production, this would be sent via email)
  return { token: resetToken };
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  
  const resetToken = await prisma.clientPasswordResetToken.findUnique({
    where: { tokenHash },
    include: { client: true },
  });

  if (!resetToken) {
    throw ApiError.badRequest("Token tidak valid");
  }

  if (resetToken.usedAt) {
    throw ApiError.badRequest("Token sudah digunakan");
  }

  if (resetToken.expiresAt < new Date()) {
    throw ApiError.badRequest("Token sudah kadaluarsa");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update password and mark token as used
  await prisma.$transaction([
    prisma.client.update({
      where: { id: resetToken.clientId },
      data: { passwordHash },
    }),
    prisma.clientPasswordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all existing refresh tokens
    prisma.clientRefreshToken.updateMany({
      where: { clientId: resetToken.clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return true;
}

// ============================================================
// PROJECT ACCESS
// ============================================================

export async function getClientProjects(clientId: string) {
  const accesses = await prisma.clientProjectAccess.findMany({
    where: {
      clientId,
      status: "ACTIVE",
    },
    include: {
      rab: {
        include: {
          sections: {
            include: {
              items: true,
            },
            orderBy: { order: "asc" },
          },
          baselines: {
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
          billings: {
            orderBy: { periodEnd: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  // Collect all item IDs for progress query
  const allItemIds: string[] = [];
  accesses.forEach(access => {
    access.rab.sections.forEach(section => {
      section.items.forEach(item => {
        allItemIds.push(item.id);
      });
    });
  });

  // Query all progress records in one query
  let progressMap: Record<string, number> = {};
  if (allItemIds.length > 0) {
    const progressRecords = await prisma.rabProgress.findMany({
      where: {
        itemId: { in: allItemIds },
        status: "APPROVED"
      },
      select: { itemId: true, percent: true }
    });
    progressRecords.forEach(p => {
      progressMap[p.itemId] = Number(p.percent);
    });
  }

  return accesses.map((access) => {
    const rab = access.rab;
    const totalItems = rab.sections.reduce((sum, s) => sum + s.items.length, 0);

    // Calculate max offset days for schedule end
    let scheduleEnd: string | null = null;
    if (rab.scheduleStart && totalItems > 0) {
      const maxOffsetDays = Math.max(
        ...rab.sections.flatMap(s => s.items.map(i => (i.startOffsetDays || 0) + (i.durationDays || 0)))
      );
      if (maxOffsetDays > 0) {
        const endDate = new Date(rab.scheduleStart);
        endDate.setDate(endDate.getDate() + maxOffsetDays);
        scheduleEnd = endDate.toISOString();
      }
    }

    // Calculate progress from progressMap
    let totalProgress = 0;
    let progressCount = 0;
    rab.sections.forEach(section => {
      section.items.forEach(item => {
        if (progressMap[item.id] !== undefined) {
          totalProgress += progressMap[item.id];
          progressCount++;
        }
      });
    });
    const progress = progressCount > 0
      ? Math.min(100, Math.round(totalProgress / totalItems))
      : 0;

    return {
      accessId: access.id,
      accessLevel: access.accessLevel,
      grantedAt: access.grantedAt,
      expiresAt: access.expiresAt,
      project: {
        id: rab.id,
        number: rab.number,
        title: rab.title,
        clientName: rab.clientName,
        location: rab.location,
        status: rab.status,
        scheduleStart: rab.scheduleStart?.toISOString() || null,
        scheduleEnd,
        total: Number(rab.total),
        progress,
        totalItems,
        completedItems: Math.round((progress / 100) * totalItems),
        billingCount: rab.billings.length,
      },
    };
  });
}

export async function getProjectDetails(clientId: string, rabId: string) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: {
      clientId_rabId: { clientId, rabId },
    },
  });

  if (!access || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke proyek ini");
  }

  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      sections: {
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      baselines: {
        orderBy: { capturedAt: "desc" },
        take: 1,
      },
      billings: {
        orderBy: { periodEnd: "desc" },
      },
    },
  });

  if (!rab) {
    throw ApiError.notFound("Proyek tidak ditemukan");
  }

  // Calculate schedule end from max offset days
  let scheduleEnd: string | null = null;
  if (rab.scheduleStart) {
    const allItems = rab.sections.flatMap(s => s.items);
    if (allItems.length > 0) {
      const maxOffsetDays = Math.max(
        ...allItems.map(i => (i.startOffsetDays || 0) + (i.durationDays || 0))
      );
      if (maxOffsetDays > 0) {
        const endDate = new Date(rab.scheduleStart);
        endDate.setDate(endDate.getDate() + maxOffsetDays);
        scheduleEnd = endDate.toISOString();
      }
    }
  }

  return {
    access: {
      canViewProgress: access.canViewProgress,
      canViewDailyReports: access.canViewDailyReports,
      canViewPhotos: access.canViewPhotos,
      canViewQC: access.canViewQC,
      canViewDocuments: access.canViewDocuments,
      canViewFinancials: access.canViewFinancials,
    },
    project: {
      id: rab.id,
      number: rab.number,
      title: rab.title,
      clientName: rab.clientName,
      location: rab.location,
      status: rab.status,
      scheduleStart: rab.scheduleStart?.toISOString() || null,
      scheduleEnd,
      subtotal: Number(rab.subtotal),
      discountAmount: Number(rab.discountAmount),
      taxAmount: Number(rab.taxAmount),
      total: Number(rab.total),
      taxPct: Number(rab.taxPct),
    },
    sections: rab.sections.map((s) => ({
      id: s.id,
      name: s.name,
      items: s.items.map((i) => ({
        id: i.id,
        description: i.description,
        unit: i.unit,
        volume: Number(i.volume),
        unitPrice: Number(i.unitPrice),
        amount: Number(i.amount),
        startOffsetDays: i.startOffsetDays,
        durationDays: i.durationDays,
      })),
    })),
    baseline: rab.baselines[0] ? {
      capturedAt: rab.baselines[0].capturedAt,
      name: rab.baselines[0].name,
    } : null,
    billings: access.canViewFinancials ? rab.billings.map((b) => ({
      id: b.id,
      number: b.number,
      status: b.status,
      periodEnd: b.periodEnd,
      currentValue: Number(b.currentValue),
      cumulativeValue: Number(b.cumulativeValue),
      taxAmount: Number(b.taxAmount),
      netAmount: Number(b.netAmount),
    })) : undefined,
  };
}

// ============================================================
// DAILY REPORTS
// ============================================================

export async function getProjectDailyReports(clientId: string, rabId: string, options?: {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } },
  });

  if (!access || !access.canViewDailyReports || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke laporan harian proyek ini");
  }

  const reports = await prisma.dailyReport.findMany({
    where: {
      rabId,
      ...(options?.startDate && { date: { gte: options.startDate } }),
      ...(options?.endDate && { date: { lte: options.endDate } }),
    },
    orderBy: { date: "desc" },
    take: options?.limit || 30,
    skip: options?.offset || 0,
    include: {
      photos: {
        orderBy: { order: "asc" },
        take: 10,
      },
    },
  });

  const total = await prisma.dailyReport.count({ where: { rabId } });

  return {
    reports: reports.map((r) => ({
      id: r.id,
      date: r.date,
      weatherAfternoon: r.weatherAfternoon,
      workforce: r.workforce,
      activities: r.activities,
      equipment: r.equipment,
      materials: r.materials,
      notes: r.notes,
      photos: r.photos.map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        location: p.location,
      })),
    })),
    total,
    hasMore: (options?.offset || 0) + reports.length < total,
  };
}

// ============================================================
// QC RECORDS
// ============================================================

export async function getProjectQCRecords(clientId: string, rabId: string, options?: {
  limit?: number;
  offset?: number;
  result?: string;
}) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } },
  });

  if (!access || !access.canViewQC || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke QC proyek ini");
  }

  // Get job assignments for this RAB
  const assignments = await prisma.jobAssignment.findMany({
    where: { rabId },
    select: { id: true },
  });
  const assignmentIds = assignments.map((a) => a.id);

  const records = await prisma.qcRecord.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      ...(options?.result && { result: options.result as any }),
    },
    orderBy: { checkDate: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
    include: {
      photos: true,
    },
  });

  const total = await prisma.qcRecord.count({
    where: { assignmentId: { in: assignmentIds } },
  });

  return {
    records: records.map((r) => ({
      id: r.id,
      qcCode: r.qcCode,
      checkDate: r.checkDate,
      wbsStage: r.wbsStage,
      itemDesc: r.itemDesc,
      criteria: r.criteria,
      measurement: r.measurement,
      result: r.result,
      defectDesc: r.defectDesc,
      isRework: r.isRework,
      holdPoint: r.holdPoint,
      isReleased: r.isReleased,
      weather: r.weather,
      notes: r.notes,
      photos: r.photos.map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
      })),
    })),
    total,
    hasMore: (options?.offset || 0) + records.length < total,
    summary: {
      total: total,
      passed: await prisma.qcRecord.count({ where: { assignmentId: { in: assignmentIds }, result: "PASS" } }),
      failed: await prisma.qcRecord.count({ where: { assignmentId: { in: assignmentIds }, result: "FAIL" } }),
      rework: await prisma.qcRecord.count({ where: { assignmentId: { in: assignmentIds }, result: "REWORK" } }),
    },
  };
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function getProjectDocuments(clientId: string, rabId: string) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } },
  });

  if (!access || !access.canViewDocuments || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke dokumen proyek ini");
  }

  const [letters, submissions] = await Promise.all([
    prisma.projectLetter.findMany({
      where: { rabId },
      orderBy: { letterDate: "desc" },
    }),
    prisma.projectSubmission.findMany({
      where: { rabId },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return {
    letters: letters.map((l) => ({
      id: l.id,
      number: l.number,
      type: l.type,
      status: l.status,
      subject: l.subject,
      letterDate: l.letterDate,
      issuedAt: l.issuedAt,
      signedAt: l.signedAt,
      amount: access.canViewFinancials ? Number(l.totalAmount) : undefined,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      number: s.number,
      type: s.type,
      status: s.status,
      title: s.title,
      submittedAt: s.submittedAt,
      clientNote: s.clientNote,
    })),
  };
}

// ============================================================
// PROGRESS DATA (for S-Curve)
// ============================================================

export async function getProjectProgressData(clientId: string, rabId: string) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } },
  });

  if (!access || !access.canViewProgress || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke progress proyek ini");
  }

  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      baselines: {
        orderBy: { capturedAt: "asc" },
        take: 1,
      },
      sections: {
        include: {
          items: {
            orderBy: { startOffsetDays: "asc" },
          },
        },
      },
    },
  });

  if (!rab) {
    throw ApiError.notFound("Proyek tidak ditemukan");
  }

  // Calculate planned progress from schedule
  const scheduleStart = rab.scheduleStart ? new Date(rab.scheduleStart) : new Date();
  const baseline = rab.baselines[0];

  // Build planned curve data points
  const plannedCurve: Array<{ date: string; planned: number }> = [];

  if (baseline?.snapshot) {
    const snapshot = baseline.snapshot as any;
    const items = snapshot.items as Array<{
      id: string;
      description: string;
      startOffsetDays: number;
      durationDays: number;
      amount: number;
    }> | undefined;

    if (items && items.length > 0) {
      const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
      const maxDay = Math.max(...items.map(i => i.startOffsetDays + i.durationDays));
      const days = maxDay + 1;

      for (let d = 0; d <= days; d += 7) { // Weekly points
        const date = new Date(scheduleStart);
        date.setDate(date.getDate() + d);

        // Calculate cumulative planned progress
        const completedAmount = items
          .filter(i => i.startOffsetDays + i.durationDays <= d)
          .reduce((sum, i) => sum + (i.amount || 0), 0);

        plannedCurve.push({
          date: date.toISOString().split("T")[0],
          planned: totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0,
        });
      }
    }
  }

  // Get actual progress from RabProgress
  const progressRecords = await prisma.rabProgress.findMany({
    where: {
      item: {
        section: { rabId },
      },
      status: "APPROVED",
    },
    orderBy: { date: "asc" },
  });

  // Calculate actual curve
  const actualCurve: Array<{ date: string; actual: number }> = [];
  const totalAmount = rab.sections.reduce(
    (sum, s) => sum + s.items.reduce((s2, i) => s2 + Number(i.amount), 0),
    0
  );

  // Group by week
  const weeklyProgress: Record<string, number> = {};
  for (const p of progressRecords) {
    const weekStart = new Date(p.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    weeklyProgress[weekKey] = (weeklyProgress[weekKey] || 0) + Number(p.percent);
  }

  // Convert to curve
  let cumulative = 0;
  const sortedWeeks = Object.keys(weeklyProgress).sort();
  for (const week of sortedWeeks) {
    cumulative = Math.min(100, cumulative + (weeklyProgress[week] / 100) * 50);
    actualCurve.push({ date: week, actual: cumulative });
  }

  return {
    project: {
      id: rab.id,
      number: rab.number,
      title: rab.title,
      scheduleStart: rab.scheduleStart,
      status: rab.status,
      totalAmount,
    },
    plannedCurve,
    actualCurve,
    currentProgress: actualCurve.length > 0
      ? actualCurve[actualCurve.length - 1].actual
      : 0,
  };
}

// ============================================================
// SECTION-LEVEL S-CURVE DATA (Multiple Sections)
// ============================================================

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getClientNotifications(clientId: string, options?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  const notifications = await prisma.clientNotification.findMany({
    where: {
      clientId,
      ...(options?.unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 20,
  });

  const unreadCount = await prisma.clientNotification.count({
    where: { clientId, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markNotificationRead(clientId: string, notificationId: string) {
  const notification = await prisma.clientNotification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.clientId !== clientId) {
    throw ApiError.notFound("Notification tidak ditemukan");
  }

  await prisma.clientNotification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead(clientId: string) {
  await prisma.clientNotification.updateMany({
    where: { clientId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// ============================================================
// RECENT DOCUMENTS
// ============================================================

export async function getRecentDocuments(clientId: string, limit = 5) {
  // Get client's accessible projects
  const accesses = await prisma.clientProjectAccess.findMany({
    where: { clientId, status: "ACTIVE" },
    select: { rabId: true }
  });

  const rabIds = accesses.map(a => a.rabId);
  if (rabIds.length === 0) return [];

  // Get recent submissions and letters from accessible projects
  const [submissions, letters] = await Promise.all([
    prisma.projectSubmission.findMany({
      where: { rabId: { in: rabIds } },
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: {
        requestedBy: { select: { name: true } }
      }
    }),
    prisma.projectLetter.findMany({
      where: { rabId: { in: rabIds } },
      orderBy: { issuedAt: "desc" },
      take: limit,
      include: {
        createdBy: { select: { name: true } }
      }
    })
  ]);

  // Transform submissions to documents
  const submissionDocs = submissions.map(s => ({
    id: s.id,
    name: s.title,
    type: "report" as const,
    category: s.type,
    projectId: s.rabId,
    uploadDate: s.submittedAt?.toISOString() || new Date().toISOString(),
    url: `#`,
    description: s.reason || null,
  }));

  // Transform letters to documents
  const letterDocs = letters.map(l => ({
    id: l.id,
    name: l.subject,
    type: l.type === "KWITANSI" ? "invoice" as const : "contract" as const,
    category: l.type,
    projectId: l.rabId,
    uploadDate: l.issuedAt?.toISOString() || new Date().toISOString(),
    url: `#`,
    description: l.notes || null,
  }));

  // Combine and sort by date
  const allDocs = [...submissionDocs, ...letterDocs]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, limit);

  // Add project names
  const rabMap = new Map();
  for (const rabId of rabIds) {
    const rab = await prisma.rab.findUnique({
      where: { id: rabId },
      select: { id: true, title: true }
    });
    if (rab) rabMap.set(rab.id, rab.title);
  }

  return allDocs.map(doc => ({
    ...doc,
    projectName: rabMap.get(doc.projectId) || "Unknown Project"
  }));
}

// ============================================================
// PROJECT TEAM
// ============================================================

export async function getProjectTeam(clientId: string, rabId: string) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } }
  });

  if (!access || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke proyek ini");
  }

  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true }
      }
    }
  });

  if (!rab) {
    throw ApiError.notFound("Proyek tidak ditemukan");
  }

  // For client portal, we show the RAB creator as Project Manager
  // In a full implementation, there would be a separate project team assignment
  const projectManager = rab.createdBy ? {
    id: rab.createdBy.id,
    name: rab.createdBy.name,
    role: "Project Manager",
    avatar: rab.createdBy.avatarUrl,
    email: rab.createdBy.email,
    department: "Construction",
    isProjectManager: true,
  } : null;

  // Get daily report authors as team members (representing site team)
  const dailyReportAuthors = await prisma.dailyReport.findMany({
    where: { rabId },
    select: { createdById: true },
    distinct: ["createdById"],
    take: 5,
    orderBy: { date: "desc" }
  });

  const authorIds = dailyReportAuthors
    .map(d => d.createdById)
    .filter((id): id is string => id !== null);
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, email: true, avatarUrl: true }
  });

  const members = authors.map(a => ({
    id: a.id,
    name: a.name,
    role: "Site Engineer",
    avatar: a.avatarUrl,
    email: a.email,
    department: "Engineering",
    isProjectManager: false,
  }));

  return { projectManager, members };
}

// ============================================================
// PROJECT MILESTONES
// ============================================================

export async function getProjectMilestones(clientId: string, rabId: string) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } }
  });

  if (!access || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke proyek ini");
  }

  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      sections: {
        include: {
          items: {
            orderBy: { order: "asc" }
          }
        },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!rab) {
    throw ApiError.notFound("Proyek tidak ditemukan");
  }

  // Calculate milestones from RAB sections (treat each section as a milestone group)
  const today = new Date();
  const scheduleStart = rab.scheduleStart ? new Date(rab.scheduleStart) : today;

  const milestones = [];
  let sectionIndex = 0;
  const totalSections = rab.sections.length;

  for (const section of rab.sections) {
    sectionIndex++;
    const sectionItems = section.items;
    
    // Calculate section progress from RabProgress records
    const itemIds = sectionItems.map(i => i.id);
    let completedItems = 0;
    let totalProgress = 0;
    
    if (itemIds.length > 0) {
      const progressRecords = await prisma.rabProgress.findMany({
        where: { itemId: { in: itemIds }, status: "APPROVED" },
        select: { percent: true }
      });
      completedItems = progressRecords.filter(p => Number(p.percent) >= 100).length;
      totalProgress = progressRecords.reduce((sum, p) => sum + Number(p.percent), 0);
    }
    
    const totalItems = sectionItems.length;
    const progress = totalItems > 0 ? Math.round(totalProgress / totalItems) : 0;

    // Calculate dates
    const maxDuration = sectionItems.reduce((max, i) => {
      const end = (i.startOffsetDays || 0) + (i.durationDays || 0);
      return Math.max(max, end);
    }, 0);

    const startDate = new Date(scheduleStart);
    const endDate = new Date(scheduleStart);
    endDate.setDate(endDate.getDate() + maxDuration);

    // Determine status
    let status: "complete" | "in_progress" | "upcoming" | "pending" = "pending";
    if (progress >= 100) status = "complete";
    else if (progress > 0) status = "in_progress";
    else if (endDate < today) status = "upcoming";

    milestones.push({
      id: section.id,
      name: section.name,
      date: endDate.toISOString(),
      progress,
      status,
      description: `${completedItems}/${totalItems} item selesai`,
      deliverable: null,
    });
  }

  // Add final handover milestone
  const finalDate = new Date(scheduleStart);
  finalDate.setDate(finalDate.getDate() + 
    Math.max(...rab.sections.flatMap(s => 
      s.items.map(i => (i.startOffsetDays || 0) + (i.durationDays || 0))
    ), 0) + 30
  );

  const overallProgress = milestones.length > 0
    ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
    : 0;

  milestones.push({
    id: "handover",
    name: "Serah Terima",
    date: finalDate.toISOString(),
    progress: overallProgress >= 100 ? 100 : 0,
    status: overallProgress >= 100 ? "complete" as const : (overallProgress > 0 ? "in_progress" as const : "pending" as const),
    description: "Project completion & handover",
    deliverable: "BAST document",
  });

  return milestones;
}

// ============================================================
// S-CURVE DATA
// ============================================================

export async function getProjectSCurve(clientId: string, rabId: string) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } }
  });

  if (!access || !access.canViewProgress || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke progress proyek ini");
  }

  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    include: {
      baselines: {
        orderBy: { capturedAt: "asc" },
        take: 1,
      },
      sections: {
        include: {
          items: {
            orderBy: { startOffsetDays: "asc" }
          }
        }
      }
    }
  });

  if (!rab) {
    throw ApiError.notFound("Proyek tidak ditemukan");
  }

  const scheduleStart = rab.scheduleStart ? new Date(rab.scheduleStart) : new Date();
  const baseline = rab.baselines[0];

  // Calculate total amount for percentage calculation
  const totalAmount = rab.sections.reduce(
    (sum, s) => sum + s.items.reduce((s2, i) => s2 + Number(i.amount), 0),
    0
  );

  // Build planned S-curve from baseline or items
  const plannedCurve: Array<{ date: string; planned: number; cumulativePlanned: number }> = [];

  let items: Array<{
    id: string;
    description: string;
    startOffsetDays: number;
    durationDays: number;
    amount: number;
  }> = [];

  if (baseline?.snapshot) {
    const snapshot = baseline.snapshot as any;
    items = snapshot.items || [];
  } else {
    items = rab.sections.flatMap(s => s.items.map(i => ({
      id: i.id,
      description: i.description,
      startOffsetDays: i.startOffsetDays || 0,
      durationDays: i.durationDays || 0,
      amount: Number(i.amount),
    })));
  }

  if (items.length > 0) {
    const maxDay = Math.max(...items.map(i => i.startOffsetDays + i.durationDays));
    const days = maxDay + 1;

    // Weekly data points for S-curve
    for (let d = 0; d <= days; d += 7) {
      const date = new Date(scheduleStart);
      date.setDate(date.getDate() + d);

      // Calculate cumulative planned value
      const completedAmount = items
        .filter(i => i.startOffsetDays + i.durationDays <= d)
        .reduce((sum, i) => sum + i.amount, 0);

      const planned = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;
      const cumulativePlanned = Math.min(100, planned);

      plannedCurve.push({
        date: date.toISOString().split("T")[0],
        planned: Math.round(planned * 10) / 10,
        cumulativePlanned: Math.round(cumulativePlanned * 10) / 10,
      });
    }
  }

  // Get actual progress from RabProgress
  const progressRecords = await prisma.rabProgress.findMany({
    where: {
      item: {
        section: { rabId },
      },
      status: "APPROVED",
    },
    orderBy: { date: "asc" },
    include: {
      item: { select: { amount: true } }
    }
  });

  // Calculate actual S-curve
  const actualCurve: Array<{ date: string; actual: number; cumulativeActual: number }> = [];

  // Group progress by week
  const weeklyProgress: Record<string, number> = {};
  for (const p of progressRecords) {
    const weekStart = new Date(p.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    const itemAmount = Number(p.item?.amount || 0);
    weeklyProgress[weekKey] = (weeklyProgress[weekKey] || 0) + (itemAmount / totalAmount) * 100;
  }

  // Convert to curve
  let cumulative = 0;
  const sortedWeeks = Object.keys(weeklyProgress).sort();
  for (const week of sortedWeeks) {
    cumulative = Math.min(100, cumulative + weeklyProgress[week]);
    actualCurve.push({
      date: week,
      actual: Math.round(cumulative * 10) / 10,
      cumulativeActual: Math.round(cumulative * 10) / 10,
    });
  }

  // Add current week point if no data
  if (actualCurve.length === 0 || actualCurve[actualCurve.length - 1].date !== new Date().toISOString().split("T")[0]) {
    actualCurve.push({
      date: new Date().toISOString().split("T")[0],
      actual: 0,
      cumulativeActual: actualCurve.length > 0 ? actualCurve[actualCurve.length - 1].cumulativeActual : 0,
    });
  }

  return {
    plannedCurve,
    actualCurve,
    currentProgress: actualCurve.length > 0 ? actualCurve[actualCurve.length - 1].cumulativeActual : 0,
    totalAmount,
  };
}

// ============================================================
// PROJECT PHOTOS
// ============================================================

export async function getProjectPhotos(clientId: string, rabId: string, limit = 20) {
  // Verify access
  const access = await prisma.clientProjectAccess.findUnique({
    where: { clientId_rabId: { clientId, rabId } }
  });

  if (!access || !access.canViewPhotos || access.status !== "ACTIVE") {
    throw ApiError.forbidden("Anda tidak memiliki akses ke foto proyek ini");
  }

  // Get daily report photos
  const dailyReports = await prisma.dailyReport.findMany({
    where: { rabId },
    select: { id: true, date: true },
    orderBy: { date: "desc" }
  });

  const reportIds = dailyReports.map(r => r.id);

  const photos = await prisma.dailyReportPhoto.findMany({
    where: { reportId: { in: reportIds } },
    orderBy: { order: "asc" },
    take: limit,
  });

  // Get work assignments with execution logs for more photos
  const assignments = await prisma.jobAssignment.findMany({
    where: { rabId },
    select: { id: true }
  });

  const assignmentIds = assignments.map(a => a.id);

  const executionPhotos = await prisma.executionPhoto.findMany({
    where: { logId: { in: assignmentIds } },
    orderBy: { takenAt: "desc" },
    take: limit,
    include: {
      log: {
        select: {
          logDate: true,
          locationName: true,
        }
      }
    }
  });

  // Combine and format photos
  const allPhotos = [
    ...photos.map(p => ({
      id: p.id,
      url: p.url,
      thumbnailUrl: p.url, // In production, generate actual thumbnail
      caption: p.caption || p.location || "Site Photo",
      location: p.location,
      takenAt: p.takenAt?.toISOString() || new Date().toISOString(),
    })),
    ...executionPhotos.map(p => ({
      id: p.id,
      url: p.url,
      thumbnailUrl: p.url,
      caption: p.caption || "Work Photo",
      location: p.log?.locationName || null,
      takenAt: p.takenAt?.toISOString() || new Date().toISOString(),
    }))
  ]
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
    .slice(0, limit);

  return allPhotos;
}

// ============================================================
// PASSWORD CHANGE
// ============================================================

export async function changeClientPassword(
  clientId: string,
  currentPassword: string,
  newPassword: string
) {
  if (newPassword.length < 6) {
    throw ApiError.badRequest("Password baru minimal 6 karakter");
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw ApiError.notFound("Client tidak ditemukan");
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, client.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Password saat ini salah");
  }

  // Hash and update new password
  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.client.update({
    where: { id: clientId },
    data: { passwordHash: newHash }
  });

  // Revoke all existing refresh tokens (force re-login)
  await prisma.clientRefreshToken.updateMany({
    where: { clientId },
    data: { revokedAt: new Date() }
  });

  return { success: true, message: "Password berhasil diubah. Silakan login kembali." };
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export async function getNotificationPreferences(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      notifyProgress: true,
      notifyDocuments: true,
      notifyMessages: true,
    }
  });

  if (!client) {
    throw ApiError.notFound("Client tidak ditemukan");
  }

  return [
    { type: "progress", label: "Update Progress Proyek", emailEnabled: false, pushEnabled: client.notifyProgress, inAppEnabled: client.notifyProgress },
    { type: "document", label: "Dokumen Baru", emailEnabled: false, pushEnabled: client.notifyDocuments, inAppEnabled: client.notifyDocuments },
    { type: "qc", label: "Hasil QC", emailEnabled: false, pushEnabled: true, inAppEnabled: true },
    { type: "billing", label: "Tagihan & Pembayaran", emailEnabled: true, pushEnabled: false, inAppEnabled: true },
    { type: "message", label: "Pesan dari Tim Proyek", emailEnabled: false, pushEnabled: client.notifyMessages, inAppEnabled: client.notifyMessages },
    { type: "milestone", label: "Milestone Pencapaian", emailEnabled: false, pushEnabled: true, inAppEnabled: true },
    { type: "photo", label: "Foto Site Baru", emailEnabled: false, pushEnabled: false, inAppEnabled: client.notifyDocuments },
  ];
}

export async function updateNotificationPreferences(
  clientId: string,
  preferences: Array<{ type: string; emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean }>
) {
  // Find the client
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw ApiError.notFound("Client tidak ditemukan");
  }

  // Map preferences to client fields
  const progressPref = preferences.find(p => p.type === "progress");
  const documentPref = preferences.find(p => p.type === "document");
  const messagePref = preferences.find(p => p.type === "message");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      notifyProgress: progressPref?.pushEnabled ?? client.notifyProgress,
      notifyDocuments: documentPref?.pushEnabled ?? client.notifyDocuments,
      notifyMessages: messagePref?.pushEnabled ?? client.notifyMessages,
    }
  });

  return { success: true, message: "Preferensi notifikasi berhasil disimpan" };
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getClientDashboardStats(clientId: string) {
  // Get all active project accesses for this client
  const accesses = await prisma.clientProjectAccess.findMany({
    where: {
      clientId,
      status: "ACTIVE",
    },
    include: {
      rab: {
        include: {
          sections: {
            include: { items: true },
            orderBy: { order: "asc" },
          },
          baselines: {
            orderBy: { capturedAt: "desc" },
            take: 1,
          },
          billings: true,
        },
      },
    },
  });

  // Collect all item IDs for progress
  const allItemIds: string[] = [];
  accesses.forEach(access => {
    access.rab.sections.forEach(section => {
      section.items.forEach(item => {
        allItemIds.push(item.id);
      });
    });
  });

  // Query progress records
  let progressMap: Record<string, number> = {};
  if (allItemIds.length > 0) {
    const progressRecords = await prisma.rabProgress.findMany({
      where: {
        itemId: { in: allItemIds },
        status: "APPROVED"
      },
      select: { itemId: true, percent: true }
    });
    progressRecords.forEach(p => {
      progressMap[p.itemId] = Number(p.percent);
    });
  }

  // Calculate stats per project
  const projectStats = accesses.map((access) => {
    const rab = access.rab;
    const totalItems = rab.sections.reduce((sum, s) => sum + s.items.length, 0);

    let totalProgress = 0;
    let progressCount = 0;
    rab.sections.forEach(section => {
      section.items.forEach(item => {
        if (progressMap[item.id] !== undefined) {
          totalProgress += progressMap[item.id];
          progressCount++;
        }
      });
    });
    const progress = progressCount > 0
      ? Math.min(100, Math.round(totalProgress / totalItems))
      : 0;

    return {
      id: rab.id,
      title: rab.title,
      number: rab.number,
      status: rab.status,
      progress,
      totalBudget: Number(rab.total),
      completedBillings: rab.billings.filter(b => b.status === "PAID").length,
      totalBillings: rab.billings.length,
    };
  });

  // Aggregate stats
  const totalProjects = accesses.length;
  const completedProjects = projectStats.filter(p => p.progress >= 100 || p.status === "APPROVED").length;
  const activeProjects = totalProjects - completedProjects;
  const totalBudget = projectStats.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalProgress = projectStats.reduce((sum, p) => sum + p.progress, 0);
  const avgProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

  // Calculate trends (mock for now - in production would compare with historical data)
  const trends = {
    projects: { direction: "neutral" as const, percentage: 0 },
    active: { direction: "neutral" as const, percentage: 0 },
    completed: { direction: "neutral" as const, percentage: 0 },
    budget: { direction: "neutral" as const, percentage: 0 },
  };

  // Chart data: completion by status
  const completionData = {
    completed: completedProjects,
    inProgress: activeProjects,
    notStarted: totalProjects > 0 ? Math.max(0, totalProjects - completedProjects - activeProjects) : 0,
  };

  // Monthly progress (last 6 months mock data)
  const monthlyProgress = generateMonthlyProgressData();

  return {
    stats: {
      totalProjects,
      activeProjects,
      completedProjects,
      avgProgress,
      totalBudget,
    },
    trends,
    projectStats: projectStats.slice(0, 10), // Return top 10 projects
    completionData,
    monthlyProgress,
  };
}

// Generate mock monthly progress data
function generateMonthlyProgressData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"];
  const baseProgress = 20;
  return months.map((month, i) => ({
    month,
    planned: Math.min(100, baseProgress + i * 15),
    actual: Math.min(100, baseProgress + i * 15 + (Math.random() - 0.3) * 10),
  }));
}
