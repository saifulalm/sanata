/**
 * Validators for Tools & Loans
 */
import { z } from "zod";

const toolCondition = z.enum(["GOOD", "FAIR", "DAMAGED", "LOST"]);
const toolOwner = z.enum(["COMPANY", "PERSONAL", "RENTED"]);
const loanStatus = z.enum(["OPEN", "RETURNED", "OVERDUE", "LOST"]);
const maintenanceType = z.enum(["PREVENTIVE", "CORRECTIVE", "INSPECTION"]);
const activityType = z.enum(["CREATED", "CONDITION_UPDATE", "LOAN_ISSUED", "LOAN_RETURNED", "MAINTENANCE", "TRANSFER", "STOCK_UPDATE", "IMAGE_UPDATED"]);

export const createToolSchema = z.object({
  name: z.string().min(1, "Nama alat wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  trade: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  warrantyExpiry: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  purchasePrice: z.number().positive().optional(),
  minQuantity: z.number().int().positive().default(1),
  unit: z.string().default("pcs"),
  condition: toolCondition.default("GOOD"),
  owner: toolOwner.default("COMPANY"),
  personalOwnerId: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  needsMaintenance: z.boolean().default(false),
  maintenanceIntervalDays: z.number().int().positive().optional(),
  currentLocation: z.string().optional(),
});

export const updateToolSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  trade: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  minQuantity: z.number().int().positive().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  needsMaintenance: z.boolean().optional(),
  maintenanceIntervalDays: z.number().int().positive().optional().nullable(),
  currentLocation: z.string().optional(),
});

export const updateConditionSchema = z.object({
  condition: toolCondition,
});

export const issueLoanSchema = z.object({
  toolId: z.string().min(1, "ID alat wajib diisi"),
  workerId: z.string().min(1, "ID pekerja wajib diisi"),
  notes: z.string().optional(),
  issuedPhotoUrl: z.string().url().optional().or(z.literal("")),
  issuedLocation: z.string().optional(),
});

export const returnLoanSchema = z.object({
  condition: toolCondition,
  photoUrl: z.string().url().optional().or(z.literal("")),
  returnLocation: z.string().optional(),
});

export const maintenanceSchema = z.object({
  toolId: z.string().min(1, "ID alat wajib diisi"),
  type: maintenanceType.default("PREVENTIVE"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  scheduledDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  performedDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  cost: z.number().positive().optional(),
  vendor: z.string().optional(),
  performedById: z.string().optional(),
  conditionAfter: toolCondition.optional(),
  notes: z.string().optional(),
});

export const completeMaintenanceSchema = z.object({
  performedDate: z.string().datetime().transform(v => new Date(v)),
  cost: z.number().positive().optional(),
  vendor: z.string().optional(),
  conditionAfter: toolCondition.optional(),
  notes: z.string().optional(),
});

export const toolFiltersSchema = z.object({
  category: z.string().optional(),
  owner: toolOwner.optional(),
  status: z.enum(["available", "borrowed", "maintenance", "needs_maintenance"]).optional(),
  search: z.string().optional(),
  condition: toolCondition.optional(),
});

export const loanFiltersSchema = z.object({
  toolId: z.string().optional(),
  workerId: z.string().optional(),
  status: loanStatus.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const activityFiltersSchema = z.object({
  toolId: z.string().optional(),
  type: activityType.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;
export type IssueLoanInput = z.infer<typeof issueLoanSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;
export type ToolFilters = z.infer<typeof toolFiltersSchema>;
export type LoanFilters = z.infer<typeof loanFiltersSchema>;
export type ActivityFilters = z.infer<typeof activityFiltersSchema>;
