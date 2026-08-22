import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { categorySchema } from "@/validators/category.validator";
import * as categoryService from "@/services/category.service";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  res.json({ success: true, data: categories });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.parse(req.body);
  const category = await categoryService.createCategory(input);
  await recordAudit({ userId: req.user!.sub, action: "CREATE", entity: "Category", entityId: category.id, meta: { name: category.name } });
  res.status(201).json({ success: true, data: category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = categorySchema.parse(req.body);
  const category = await categoryService.updateCategory(req.params.id, input);
  await recordAudit({ userId: req.user!.sub, action: "UPDATE", entity: "Category", entityId: category.id, meta: input });
  res.json({ success: true, data: category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const inUse = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { contents: true, products: true } } },
  });
  if (!inUse) throw ApiError.notFound("Category not found");
  if (inUse._count.contents > 0 || inUse._count.products > 0) {
    throw ApiError.badRequest("Cannot delete category still in use by content or products");
  }
  await categoryService.deleteCategory(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Category", entityId: req.params.id });
  res.json({ success: true, data: null });
});
