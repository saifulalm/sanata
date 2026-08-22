import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "@/utils/asyncHandler";
import { prisma } from "@/lib/prisma";

export const summary = asyncHandler(async (_req: Request, res: Response) => {
  const [
    userCount,
    contentCount,
    publishedCount,
    productCount,
    activeProductCount,
    categoryCount,
    totalViewsAgg,
    recentContents,
    recentProducts,
    contentByStatus,
    topContent,
    inquiryByStatus,
    recentInquiries,
    rabByStatus,
    approvedRabValue,
    recentRabs,
    ahspCount,
    priceItemCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.content.count(),
    prisma.content.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.content.aggregate({ _sum: { views: true } }),
    prisma.content.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, createdAt: true } }),
    prisma.product.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, price: true, stock: true, createdAt: true } }),
    prisma.content.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.content.findMany({ take: 5, orderBy: { views: "desc" }, select: { id: true, title: true, views: true } }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inquiry.findMany({
      where: { status: "NEW" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, service: true, createdAt: true },
    }),
    prisma.rab.groupBy({ by: ["status"], _count: { _all: true }, _sum: { total: true } }),
    prisma.rab.aggregate({ where: { status: "APPROVED" }, _sum: { total: true } }),
    prisma.rab.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, number: true, title: true, status: true, total: true, createdAt: true },
    }),
    prisma.ahsp.count({ where: { isActive: true } }),
    prisma.priceItem.count({ where: { isActive: true } }),
  ]);

  const inquiryCounts = Object.fromEntries(inquiryByStatus.map((i) => [i.status, i._count._all]));

  res.json({
    success: true,
    data: {
      cards: {
        users: userCount,
        content: contentCount,
        publishedContent: publishedCount,
        products: productCount,
        activeProducts: activeProductCount,
        categories: categoryCount,
        totalViews: totalViewsAgg._sum.views ?? 0,
        newInquiries: inquiryCounts.NEW ?? 0,
        totalInquiries: inquiryByStatus.reduce((sum, i) => sum + i._count._all, 0),
        ahsp: ahspCount,
        priceItems: priceItemCount,
        // Nilai pipeline: total seluruh RAB, dan yang sudah disetujui.
        rabTotalValue: String(rabByStatus.reduce((sum, r) => sum.plus(r._sum.total ?? 0), new Prisma.Decimal(0))),
        rabApprovedValue: String(approvedRabValue._sum.total ?? 0),
        rabCount: rabByStatus.reduce((sum, r) => sum + r._count._all, 0),
      },
      contentByStatus: contentByStatus.map((c) => ({ status: c.status, count: c._count._all })),
      inquiryByStatus: inquiryByStatus.map((i) => ({ status: i.status, count: i._count._all })),
      rabByStatus: rabByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        total: String(r._sum.total ?? 0),
      })),
      topContent,
      recentContents,
      recentProducts,
      recentInquiries,
      recentRabs: recentRabs.map((r) => ({ ...r, total: String(r.total) })),
    },
  });
});
