import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as workforceRoleService from "@/services/workforceRole.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await workforceRoleService.listWorkforceRoles() });
});

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body as { isActive: boolean };
  const role = await workforceRoleService.toggleWorkforceRole(id, isActive);
  res.json({ success: true, data: role });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, order } = req.body as { label: string; order: number };
  const role = await workforceRoleService.updateWorkforceRoleLabel(id, label, order);
  res.json({ success: true, data: role });
});
