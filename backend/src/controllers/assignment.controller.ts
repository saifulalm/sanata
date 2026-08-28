/**
 * Job Assignment Controller
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import * as assignmentService from "@/services/assignment.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.listAssignments({
    rabId: req.query.rabId as string,
    status: req.query.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    personId: req.query.personId as string,
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
  });
  res.json({ success: true, ...result });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentService.getAssignment(req.params.id);
  res.json({ success: true, data: assignment });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentService.createAssignment(req.body);
  res.status(201).json({ success: true, data: assignment });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentService.updateAssignment(req.params.id, req.body);
  res.json({ success: true, data: assignment });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const assignment = await assignmentService.updateStatus(req.params.id, status);
  res.json({ success: true, data: assignment });
});

export const assignPerson = asyncHandler(async (req: Request, res: Response) => {
  const { personId, mandorId } = req.body;
  const assignment = await assignmentService.assignPerson(req.params.id, personId, mandorId);
  res.json({ success: true, data: assignment });
});

export const byRab = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assignmentService.getByRab(req.params.rabId);
  res.json({ success: true, data: assignments });
});

export const myAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await assignmentService.getWorkerAssignments(req.user!.sub);
  res.json({ success: true, data: assignments });
});
