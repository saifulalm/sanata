import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as multiScheduleService from "@/services/multiSchedule.service";

/**
 * Get multiple RAB S-curves for comparison.
 * Query param: ids - comma-separated list of RAB IDs
 *
 * Example: GET /api/rab/multi-schedule?ids=id1,id2,id3
 */
export const getMultiSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.query;

  if (!ids || typeof ids !== "string") {
    res.status(400).json({
      success: false,
      error: "Missing required query parameter: ids (comma-separated RAB IDs)",
    });
    return;
  }

  const rabIds = ids.split(",").map((id) => id.trim()).filter((id) => id.length > 0);

  if (rabIds.length === 0) {
    res.status(400).json({
      success: false,
      error: "At least one RAB ID is required",
    });
    return;
  }

  if (rabIds.length > 20) {
    res.status(400).json({
      success: false,
      error: "Maximum 20 RABs can be compared at once",
    });
    return;
  }

  const data = await multiScheduleService.getMultiSchedule(rabIds);
  res.json({ success: true, data });
});

/**
 * Get interpolated comparison data at specific progress points.
 * Query params:
 *   - ids: comma-separated RAB IDs
 *   - points: comma-separated progress percentages (optional, defaults to 0,5,10,...,100)
 *
 * Example: GET /api/rab/multi-schedule/comparison?ids=id1,id2&points=0,25,50,75,100
 */
export const getComparison = asyncHandler(async (req: Request, res: Response) => {
  const { ids, points } = req.query;

  if (!ids || typeof ids !== "string") {
    res.status(400).json({
      success: false,
      error: "Missing required query parameter: ids (comma-separated RAB IDs)",
    });
    return;
  }

  const rabIds = ids.split(",").map((id) => id.trim()).filter((id) => id.length > 0);

  if (rabIds.length === 0) {
    res.status(400).json({
      success: false,
      error: "At least one RAB ID is required",
    });
    return;
  }

  // Parse custom progress points if provided
  let progressPoints: number[] | undefined;
  if (points && typeof points === "string") {
    progressPoints = points.split(",").map((p) => parseFloat(p.trim())).filter((p) => !isNaN(p) && p >= 0 && p <= 100);
  }

  const multiSchedule = await multiScheduleService.getMultiSchedule(rabIds);
  const comparison = multiScheduleService.getInterpolatedComparison(multiSchedule, progressPoints);

  res.json({ success: true, data: comparison });
});
