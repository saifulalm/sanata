import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "@/utils/asyncHandler";
import { inquirySchema, inquiryStatusSchema } from "@/validators/inquiry.validator";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { recordAudit } from "@/services/auditLog.service";
import { notifyNewInquiry, sendInquiryAutoReply } from "@/lib/mailer";
import { syncBroadcastContactFromInquiry } from "@/services/broadcast.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = inquirySchema.parse(req.body);
  const inquiry = await prisma.inquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      service: input.service || null,
      message: input.message,
      marketingConsent: Boolean(input.marketingConsent),
      preferredChannel: input.preferredChannel || null,
    },
  });

  await syncBroadcastContactFromInquiry({
    inquiryId: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    marketingConsent: inquiry.marketingConsent,
    preferredChannel: inquiry.preferredChannel,
  });
  // Tidak di-await: pesan sudah tersimpan, email tidak boleh menahan respons.
  notifyNewInquiry(inquiry);
  sendInquiryAutoReply(inquiry);

  res.status(201).json({ success: true, data: { id: inquiry.id } });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const where: Prisma.InquiryWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as Prisma.EnumInquiryStatusFilter["equals"] } : {}),
  };

  const [items, total, statusCounts] = await Promise.all([
    prisma.inquiry.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.inquiry.count({ where }),
    // Dihitung tanpa filter status supaya angka pada tab tetap menampilkan total sebenarnya.
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: buildMeta(page, pageSize, total),
    counts: Object.fromEntries(statusCounts.map((c) => [c.status, c._count._all])),
  });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = inquiryStatusSchema.parse(req.body);

  const existing = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Inquiry not found");

  const inquiry = await prisma.inquiry.update({
    where: { id: req.params.id },
    data: { status: input.status },
  });

  await recordAudit({
    userId: req.user!.sub,
    action: "UPDATE",
    entity: "Inquiry",
    entityId: inquiry.id,
    meta: { from: existing.status, to: inquiry.status },
  });

  res.json({ success: true, data: inquiry });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Inquiry not found");

  await prisma.inquiry.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Inquiry", entityId: req.params.id });

  res.json({ success: true, data: null });
});
