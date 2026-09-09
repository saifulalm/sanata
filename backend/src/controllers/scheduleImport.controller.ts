/**
 * Schedule Import Controller
 * Endpoint untuk import timeline dari Excel ke sistem SANATA
 */

import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parseDateOnly } from "@/utils/date";
import { asyncHandler } from "@/utils/asyncHandler";
import * as excelParser from "@/services/excelParser.service";

/**
 * POST /api/rab/import-timeline-excel
 * Import timeline dari file Excel TIME LINE (RE-SCHEDULE)
 */
export const importTimelineExcel = asyncHandler(async (req: Request, res: Response) => {
  // Check if file was uploaded
  if (!req.file) {
    throw ApiError.badRequest("No Excel file uploaded. Please upload a file with field name 'file'");
  }

  const file = req.file;

  // Validate file type
  const allowedMimeTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream"
  ];

  const allowedExtensions = [".xlsx", ".xls"];
  const fileExt = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));

  if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExt)) {
    throw ApiError.badRequest("Invalid file type. Please upload an Excel file (.xlsx or .xls)");
  }

  // Parse the Excel file
  let parsed: excelParser.ParsedTimeline;
  try {
    parsed = excelParser.parseTimelineExcel(file.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse Excel file";
    throw ApiError.badRequest(message);
  }

  // Validate parsed data
  const validation = excelParser.validateParsedTimeline(parsed);
  if (!validation.valid) {
    throw ApiError.badRequest(`Invalid timeline data: ${validation.errors.join("; ")}`);
  }

  // Convert to import format
  const importData = excelParser.timelineToImportFormat(parsed);

  // Check for duplicate RAB number
  const existing = await prisma.rab.findUnique({
    where: { number: importData.rab.number }
  });

  if (existing) {
    throw ApiError.badRequest(`RAB with number "${importData.rab.number}" already exists`);
  }

  // Create RAB with sections and items in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create RAB
    const newRab = await tx.rab.create({
      data: {
        number: importData.rab.number,
        title: importData.rab.title,
        clientName: importData.rab.clientName || null,
        location: importData.rab.location || null,
        projectDate: importData.rab.projectDate ? parseDateOnly(importData.rab.projectDate) : null,
        scheduleStart: parseDateOnly(importData.rab.scheduleStart),
        restDays: importData.rab.restDays || [0],
        notes: importData.rab.notes || null,
        status: "APPROVED",
        createdById: req.user!.sub
      }
    });

    // Create sections and items
    let sectionsCreated = 0;
    let itemsCreated = 0;

    for (const section of importData.sections) {
      const newSection = await tx.rabSection.create({
        data: {
          rabId: newRab.id,
          name: section.name,
          order: section.order
        }
      });
      sectionsCreated++;

      for (const item of section.items) {
        await tx.rabItem.create({
          data: {
            sectionId: newSection.id,
            description: item.description,
            unit: item.unit || "LS",
            volume: item.volume || 1,
            unitPrice: item.unitPrice || 0,
            amount: item.amount || 0,
            order: item.order,
            startOffsetDays: item.startOffsetDays || 0,
            durationDays: item.durationDays || 0
          }
        });
        itemsCreated++;
      }
    }

    return {
      rabId: newRab.id,
      number: newRab.number,
      title: newRab.title,
      scheduleStart: importData.rab.scheduleStart,
      sectionsCreated,
      itemsCreated,
      totalBobot: parsed.totalBobot
    };
  });

  res.status(201).json({
    success: true,
    message: "Timeline imported successfully from Excel file",
    data: result
  });
});

/**
 * POST /api/rab/import-timeline
 * Import timeline dari JSON (hasil parsing Excel)
 */
export const importTimeline = asyncHandler(async (req: Request, res: Response) => {
  const {
    rab,
    sections,
    holidays = []
  } = req.body as {
    rab: {
      number: string;
      title: string;
      clientName?: string;
      location?: string;
      projectDate?: string;
      scheduleStart: string;
      restDays?: number[];
      notes?: string;
    };
    sections: {
      order: number;
      name: string;
      items: {
        order: number;
        description: string;
        unit?: string;
        volume?: number;
        unitPrice?: number;
        amount?: number;
        startOffsetDays: number;
        durationDays: number;
      }[];
    }[];
    holidays?: { date: string; name: string }[];
  };

  // Validasi input
  if (!rab?.number || !rab?.title || !rab?.scheduleStart) {
    throw ApiError.badRequest("Missing required fields: number, title, scheduleStart");
  }

  if (!sections || sections.length === 0) {
    throw ApiError.badRequest("Sections cannot be empty");
  }

  // Check duplicate RAB number
  const existing = await prisma.rab.findUnique({
    where: { number: rab.number }
  });

  if (existing) {
    throw ApiError.badRequest(`RAB with number "${rab.number}" already exists`);
  }

  // Create RAB with sections and items in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create RAB
    const newRab = await tx.rab.create({
      data: {
        number: rab.number,
        title: rab.title,
        clientName: rab.clientName || null,
        location: rab.location || null,
        projectDate: rab.projectDate ? parseDateOnly(rab.projectDate) : null,
        scheduleStart: parseDateOnly(rab.scheduleStart),
        restDays: rab.restDays || [0],
        notes: rab.notes || null,
        status: "APPROVED",
        createdById: req.user!.sub
      }
    });

    // Create sections and items
    let totalItems = 0;
    for (const section of sections) {
      const newSection = await tx.rabSection.create({
        data: {
          rabId: newRab.id,
          name: section.name,
          order: section.order
        }
      });

      for (const item of section.items) {
        await tx.rabItem.create({
          data: {
            sectionId: newSection.id,
            description: item.description,
            unit: item.unit || "LS",
            volume: item.volume || 1,
            unitPrice: item.unitPrice || 0,
            amount: item.amount || 0,
            order: item.order,
            startOffsetDays: item.startOffsetDays || 0,
            durationDays: item.durationDays || 0
          }
        });
        totalItems++;
      }
    }

    // Create holidays if any
    for (const holiday of holidays) {
      await tx.rabHoliday.create({
        data: {
          rabId: newRab.id,
          date: parseDateOnly(holiday.date),
          name: holiday.name
        }
      });
    }

    return {
      rabId: newRab.id,
      number: newRab.number,
      sectionsCreated: sections.length,
      itemsCreated: totalItems,
      holidaysCreated: holidays.length
    };
  });

  res.status(201).json({
    success: true,
    message: "Timeline imported successfully",
    data: result
  });
});

/**
 * POST /api/rab/:id/import-timeline
 * Update/Replace timeline dari JSON (untuk existing RAB)
 */
export const replaceTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    scheduleStart,
    restDays,
    sections,
    holidays = []
  } = req.body as {
    scheduleStart?: string;
    restDays?: number[];
    sections?: {
      order: number;
      name: string;
      items: {
        order: number;
        description: string;
        unit?: string;
        volume?: number;
        unitPrice?: number;
        amount?: number;
        startOffsetDays: number;
        durationDays: number;
      }[];
    }[];
    holidays?: { date: string; name: string }[];
  };

  // Check RAB exists
  const existingRab = await prisma.rab.findUnique({
    where: { id },
    include: {
      sections: {
        include: { items: true }
      }
    }
  });

  if (!existingRab) {
    throw ApiError.notFound("RAB not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update RAB schedule settings
    if (scheduleStart || restDays) {
      await tx.rab.update({
        where: { id },
        data: {
          ...(scheduleStart ? { scheduleStart: parseDateOnly(scheduleStart) } : {}),
          ...(restDays ? { restDays } : {})
        }
      });
    }

    let sectionsCreated = 0;
    let itemsCreated = 0;

    // If sections provided, replace all
    if (sections && sections.length > 0) {
      // Delete existing sections (cascade deletes items)
      await tx.rabSection.deleteMany({ where: { rabId: id } });

      // Create new sections and items
      for (const section of sections) {
        const newSection = await tx.rabSection.create({
          data: {
            rabId: id,
            name: section.name,
            order: section.order
          }
        });

        for (const item of section.items) {
          await tx.rabItem.create({
            data: {
              sectionId: newSection.id,
              description: item.description,
              unit: item.unit || "LS",
              volume: item.volume || 1,
              unitPrice: item.unitPrice || 0,
              amount: item.amount || 0,
              order: item.order,
              startOffsetDays: item.startOffsetDays || 0,
              durationDays: item.durationDays || 0
            }
          });
          itemsCreated++;
        }
        sectionsCreated++;
      }
    }

    // Update holidays if provided
    if (holidays !== undefined) {
      await tx.rabHoliday.deleteMany({ where: { rabId: id } });
      for (const holiday of holidays) {
        await tx.rabHoliday.create({
          data: {
            rabId: id,
            date: parseDateOnly(holiday.date),
            name: holiday.name
          }
        });
      }
    }

    return {
      rabId: id,
      sectionsCreated,
      itemsCreated,
      holidaysUpdated: holidays.length
    };
  });

  res.json({
    success: true,
    message: "Timeline replaced successfully",
    data: result
  });
});

/**
 * POST /api/rab/:id/update-schedule-dates
 * Update hanya schedule dates dan item offset/duration
 */
export const updateScheduleDates = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    scheduleStart,
    restDays,
    items
  } = req.body as {
    scheduleStart?: string;
    restDays?: number[];
    items?: { id: string; startOffsetDays: number; durationDays: number }[];
  };

  const existingRab = await prisma.rab.findUnique({ where: { id } });
  if (!existingRab) {
    throw ApiError.notFound("RAB not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update RAB
    if (scheduleStart || restDays) {
      await tx.rab.update({
        where: { id },
        data: {
          ...(scheduleStart ? { scheduleStart: parseDateOnly(scheduleStart) } : {}),
          ...(restDays ? { restDays } : {})
        }
      });
    }

    // Update items
    let itemsUpdated = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        await tx.rabItem.updateMany({
          where: { id: item.id, section: { rabId: id } },
          data: {
            startOffsetDays: item.startOffsetDays,
            durationDays: item.durationDays
          }
        });
        itemsUpdated++;
      }
    }

    return { rabId: id, itemsUpdated };
  });

  res.json({
    success: true,
    message: "Schedule dates updated",
    data: result
  });
});

/**
 * GET /api/rab/:id/schedule-preview
 * Preview schedule berdasarkan current offset/duration
 */
export const schedulePreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rab = await prisma.rab.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" }
          }
        }
      },
      holidays: { orderBy: { date: "asc" } }
    }
  });

  if (!rab) {
    throw ApiError.notFound("RAB not found");
  }

  if (!rab.scheduleStart) {
    throw ApiError.badRequest("Schedule start date not set");
  }

  // Calculate preview
  const startDate = new Date(rab.scheduleStart);
  const preview = {
    rabId: rab.id,
    number: rab.number,
    title: rab.title,
    scheduleStart: rab.scheduleStart,
    restDays: rab.restDays,
    totalSections: rab.sections.length,
    totalItems: rab.sections.reduce((sum, s) => sum + s.items.length, 0),
    scheduledItems: rab.sections.reduce(
      (sum, s) => sum + s.items.filter((i) => i.durationDays > 0).length,
      0
    ),
    holidays: rab.holidays.map((h) => ({
      date: h.date,
      name: h.name
    })),
    sections: rab.sections.map((section) => ({
      name: section.name,
      items: section.items.map((item) => ({
        description: item.description,
        startOffsetDays: item.startOffsetDays,
        durationDays: item.durationDays,
        startDate: item.durationDays > 0
          ? new Date(startDate.getTime() + item.startOffsetDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : null,
        endDate: item.durationDays > 0
          ? new Date(
              startDate.getTime() +
              (item.startOffsetDays + item.durationDays - 1) * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0]
          : null
      }))
    }))
  };

  res.json(preview);
});
