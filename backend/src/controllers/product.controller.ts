import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { productSchema, productUpdateSchema } from "@/validators/product.validator";
import * as productService from "@/services/product.service";
import { recordAudit } from "@/services/auditLog.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.listProducts(req.query as never);
  res.json({ success: true, data: result.items, meta: result.meta });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.json({ success: true, data: product });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  res.json({ success: true, data: product });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = productSchema.parse(req.body);
  const product = await productService.createProduct(req.user!.sub, input);
  await recordAudit({ userId: req.user!.sub, action: "CREATE", entity: "Product", entityId: product.id, meta: { name: product.name } });
  res.status(201).json({ success: true, data: product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = productUpdateSchema.parse(req.body);
  const product = await productService.updateProduct(req.params.id, input);
  await recordAudit({ userId: req.user!.sub, action: "UPDATE", entity: "Product", entityId: product.id, meta: input });
  res.json({ success: true, data: product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);
  await recordAudit({ userId: req.user!.sub, action: "DELETE", entity: "Product", entityId: req.params.id });
  res.json({ success: true, data: null });
});
