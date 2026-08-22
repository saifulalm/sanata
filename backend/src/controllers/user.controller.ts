import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { prisma } from "@/lib/prisma";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { userCreateSchema, userUpdateSchema } from "@/validators/user.validator";
import { recordAudit } from "@/services/auditLog.service";

const selectPublic = { id: true, name: true, email: true, role: true, isActive: true, avatarUrl: true, lastLoginAt: true, createdAt: true };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;

  const where: Prisma.UserWhereInput = {
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
    ...(role ? { role: role as Prisma.EnumRoleFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: selectPublic }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(page, pageSize, total) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = userCreateSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.badRequest("Email sudah terdaftar.");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      isActive: input.isActive ?? true,
    },
    select: selectPublic,
  });

  // Password tidak pernah masuk audit meta.
  await recordAudit({
    userId: req.user!.sub,
    action: "CREATE",
    entity: "User",
    entityId: user.id,
    meta: { email: user.email, role: user.role },
  });

  res.status(201).json({ success: true, data: user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user!.sub && req.body.role && req.body.role !== "ADMIN") {
    throw ApiError.badRequest("You cannot demote your own account");
  }
  const input = userUpdateSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: input, select: selectPublic });
  await recordAudit({ userId: req.user!.sub, action: "UPDATE", entity: "User", entityId: user.id, meta: input });
  res.json({ success: true, data: user });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user!.sub) throw ApiError.badRequest("You cannot delete your own account");
  await prisma.user.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "User", entityId: req.params.id });
  res.json({ success: true, data: null });
});
