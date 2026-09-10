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

    // Calculate progress from actual RabProgress records
    const progressRecords = rab.sections.flatMap(s =>
      s.items.map(item => item.progress ? [item.progress] : [])
    ).flat();

    // If no progress data, estimate from workAssignments
    const totalProgress = progressRecords.length > 0
      ? progressRecords.reduce((a, b) => a + b, 0) / totalItems
      : 0;
    const progress = totalItems > 0 ? Math.min(100, Math.round(totalProgress)) : 0;

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
