import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { prisma } from "@/lib/prisma";
import { parsePagination, buildMeta } from "@/utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
  const entity = req.query.entity as string | undefined;

  const where = entity ? { entity } : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(page, pageSize, total) });
});
