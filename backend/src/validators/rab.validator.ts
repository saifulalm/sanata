import { z } from "zod";

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^\d+(\.\d+)?$/.test(v.trim()), "Must be a non-negative number");

const percent = nonNegativeNumber.refine((v) => Number(v) <= 100, "Must be between 0 and 100");

const rabItemSchema = z.object({
  ahspId: z.string().min(1).optional().nullable(),
  description: z.string().min(1).max(500),
  unit: z.string().min(1).max(20),
  volume: nonNegativeNumber,
  unitPrice: nonNegativeNumber,
  order: z.number().int().min(0).optional(),
});

const rabSectionSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
  items: z.array(rabItemSchema).default([]),
});

export const rabSchema = z.object({
  number: z.string().min(1).max(60).optional(),
  title: z.string().min(2).max(255),
  clientName: z.string().max(200).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  projectDate: z.string().datetime().optional().nullable(),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
  taxPct: percent.optional(),
  discountPct: percent.optional(),
  notes: z.string().max(5000).optional().nullable(),
  sections: z.array(rabSectionSchema).default([]),
});

export const rabUpdateSchema = rabSchema.partial();

export type RabInput = z.infer<typeof rabSchema>;
export type RabUpdateInput = z.infer<typeof rabUpdateSchema>;
export type RabSectionInput = z.infer<typeof rabSectionSchema>;
