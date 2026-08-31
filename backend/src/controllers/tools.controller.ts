/**
 * Tools Controller - Enhanced with Maintenance & Activity Log
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as toolsService from "@/services/tools.service";
import {
  createToolSchema,
  updateToolSchema,
  updateConditionSchema,
  issueLoanSchema,
  returnLoanSchema,
  toolFiltersSchema,
  loanFiltersSchema,
  maintenanceSchema,
  completeMaintenanceSchema,
  activityFiltersSchema,
} from "@/validators/tools.validator";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const listTools = asyncHandler(async (req: Request, res: Response) => {
  try {
    const parsed = toolFiltersSchema.parse({
      category: req.query.category,
      owner: req.query.owner,
      status: req.query.status,
      search: req.query.search,
      condition: req.query.condition,
    });
    // Cast status to the service's narrow type
    const filters = {
      ...parsed,
      status: parsed.status as "available" | "borrowed" | "needs_maintenance" | undefined,
    };
    const tools = await toolsService.listTools(filters);
    res.json({ success: true, data: tools });
  } catch (error) {
    if (error instanceof ZodError) return res.status(422).json({ success: false, error: error.errors });
    throw error;
  }
});

export const getTool = asyncHandler(async (req: Request, res: Response) => {
  const tool = await toolsService.getTool(req.params.id);
  res.json({ success: true, data: tool });
});

export const getToolByCode = asyncHandler(async (req: Request, res: Response) => {
  const tool = await toolsService.getToolByCode(req.params.code);
  res.json({ success: true, data: tool });
});

export const createTool = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createToolSchema.parse(req.body);
    const tool = await toolsService.createTool(data, req.user!.sub);
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const updateTool = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = updateToolSchema.parse(req.body);
    const tool = await toolsService.updateTool(req.params.id, data, req.user!.sub);
    res.json({ success: true, data: tool });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const deleteTool = asyncHandler(async (req: Request, res: Response) => {
  await toolsService.deleteTool(req.params.id);
  res.json({ success: true });
});

export const updateCondition = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { condition } = updateConditionSchema.parse(req.body);
    const tool = await toolsService.updateCondition(req.params.id, condition, req.user!.sub);
    res.json({ success: true, data: tool });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

// Loans
export const listLoans = asyncHandler(async (req: Request, res: Response) => {
  try {
    const filters = loanFiltersSchema.parse({
      toolId: req.query.toolId,
      workerId: req.query.workerId,
      status: req.query.status,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    const result = await toolsService.listLoans(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const getLoan = asyncHandler(async (req: Request, res: Response) => {
  const loan = await toolsService.getLoan(req.params.id);
  res.json({ success: true, data: loan });
});

export const issueTool = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = issueLoanSchema.parse(req.body);
    const loan = await toolsService.borrowTool(
      data.toolId,
      {
        workerId: data.workerId,
        notes: data.notes,
        issuedPhotoUrl: data.issuedPhotoUrl,
        issuedLocation: data.issuedLocation,
      },
      req.user!.sub
    );
    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const returnTool = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { condition, photoUrl, returnLocation } = returnLoanSchema.parse(req.body);
    const notes = returnLocation ? `Lokasi: ${returnLocation}` : "";
    const loan = await toolsService.returnTool(
      req.params.id,
      condition,
      notes,
      req.user?.sub || "",
      photoUrl || undefined,
      returnLocation || undefined
    );
    res.json({ success: true, data: loan });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const markOverdue = asyncHandler(async (_req: Request, res: Response) => {
  const updated = await toolsService.markOverdueLoans();
  res.json({ success: true, data: { updated } });
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await toolsService.getLoanStats();
  res.json({ success: true, data: stats });
});

export const categories = asyncHandler(async (_req: Request, res: Response) => {
  const cats = await toolsService.getCategories();
  res.json({ success: true, data: cats });
});

export const getLoansByTool = asyncHandler(async (req: Request, res: Response) => {
  const loans = await toolsService.getLoansByTool(req.params.toolId);
  res.json({ success: true, data: loans });
});

export const getLoansByWorker = asyncHandler(async (req: Request, res: Response) => {
  const loans = await toolsService.getLoansByWorker(req.params.workerId);
  res.json({ success: true, data: loans });
});

// Maintenance
export const scheduleMaintenance = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { toolId, type, description, scheduledDate, notes } = maintenanceSchema.parse(req.body);
    if (!scheduledDate) {
      return res.status(400).json({ success: false, error: "Tanggal jadwal wajib diisi" });
    }
    const maintenance = await toolsService.scheduleMaintenance({
      toolId,
      type,
      scheduledDate,
      notes: description || notes,
    }, req.user?.sub);
    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const completeMaintenance = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { performedDate, notes, cost, vendor, conditionAfter } = completeMaintenanceSchema.parse(req.body);
    const maintenance = await toolsService.completeMaintenance(req.params.id, {
      performedDate,
      notes,
      cost,
      conditionAfter,
    });
    res.json({ success: true, data: maintenance });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const getToolMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const logs = await toolsService.getToolMaintenance(req.params.id);
  res.json({ success: true, data: logs });
});

// Activity Log
export const getToolActivities = asyncHandler(async (req: Request, res: Response) => {
  try {
    const filters = activityFiltersSchema.parse({
      toolId: req.query.toolId,
      type: req.query.type,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    const result = await toolsService.getToolActivities(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

// ============================================
// PHOTO GALLERY
// ============================================

export const getToolPhotos = asyncHandler(async (req: Request, res: Response) => {
  const photos = await toolsService.getToolPhotos(req.params.id);
  res.json({ success: true, data: photos });
});

export const addToolPhoto = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { url, caption, isPrimary, order } = req.body;
    const photo = await toolsService.addToolPhoto({
      toolId: req.params.id,
      url,
      caption,
      isPrimary,
      order,
    });
    res.status(201).json({ success: true, data: photo });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    throw error;
  }
});

export const deleteToolPhoto = asyncHandler(async (req: Request, res: Response) => {
  await toolsService.deleteToolPhoto(req.params.photoId);
  res.json({ success: true });
});

export const setPrimaryPhoto = asyncHandler(async (req: Request, res: Response) => {
  await toolsService.setPrimaryPhoto(req.params.photoId);
  res.json({ success: true });
});

// ============================================
// QR CODE
// ============================================

export const getToolQrCode = asyncHandler(async (req: Request, res: Response) => {
  const data = await toolsService.generateToolQrCode(req.params.id, {
    size: parseInt(req.query.size as string) || 300,
    margin: parseInt(req.query.margin as string) || 4,
  });
  res.json({ success: true, data });
});

// ============================================
// UTILIZATION STATS
// ============================================

export const getToolUtilization = asyncHandler(async (req: Request, res: Response) => {
  const stats = await toolsService.getToolUtilization(req.params.id);
  res.json({ success: true, data: stats });
});

// ============================================
// MAINTENANCE SCHEDULE
// ============================================

export const getUpcomingMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const schedule = await toolsService.getUpcomingMaintenance(days);
  res.json({ success: true, data: schedule });
});

export const getMaintenanceCalendar = asyncHandler(async (req: Request, res: Response) => {
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const calendar = await toolsService.getMaintenanceCalendar(month, year);
  res.json({ success: true, data: calendar });
});

// ============================================
// ENHANCED LIST
// ============================================

export const listToolsEnhanced = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 20, ...filters } = req.query;
  const result = await toolsService.listToolsEnhanced({
    ...filters,
    page: parseInt(page as string),
    pageSize: parseInt(pageSize as string),
  });
  res.json({ success: true, ...result });
});
