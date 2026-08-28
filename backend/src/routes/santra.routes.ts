/**
 * SANTRA Routes - Workforce, QC & Logistics
 */

import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import * as workerCtrl from "@/controllers/worker.controller";
import * as assessmentCtrl from "@/controllers/assessment.controller";
import * as assignmentCtrl from "@/controllers/assignment.controller";
import * as executionCtrl from "@/controllers/execution.controller";
import * as qcCtrl from "@/controllers/qc.controller";
import * as kpiCtrl from "@/controllers/kpi.controller";
import * as toolsCtrl from "@/controllers/tools.controller";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

// --- Workers ---
router.get("/workers", workerCtrl.list);
router.get("/workers/stats", workerCtrl.stats);
router.get("/workers/available", workerCtrl.available);
router.get("/workers/:id", workerCtrl.get);
router.post("/workers", workerCtrl.create);
router.put("/workers/:id", workerCtrl.update);
router.delete("/workers/:id", workerCtrl.remove);
router.post("/workers/:id/verify", workerCtrl.verify);

// --- Assessments ---
router.get("/assessments", assessmentCtrl.list);
router.get("/assessments/worker/:workerId", assessmentCtrl.byWorker);
router.get("/assessments/:id", assessmentCtrl.get);
router.post("/assessments", assessmentCtrl.create);
router.put("/assessments/:id", assessmentCtrl.update);
router.delete("/assessments/:id", assessmentCtrl.remove);

// --- Job Assignments ---
router.get("/assignments", assignmentCtrl.list);
router.get("/assignments/rab/:rabId", assignmentCtrl.byRab);
router.get("/assignments/:id", assignmentCtrl.get);
router.post("/assignments", assignmentCtrl.create);
router.put("/assignments/:id", assignmentCtrl.update);
router.post("/assignments/:id/status", assignmentCtrl.updateStatus);
router.post("/assignments/:id/assign", assignmentCtrl.assignPerson);

// --- Execution Logs ---
router.get("/executions", executionCtrl.list);
router.get("/executions/stats", executionCtrl.stats);
router.get("/executions/daily-summary", executionCtrl.dailySummary);
router.get("/executions/worker/:workerId", executionCtrl.byWorker);
router.get("/executions/assignment/:assignmentId", executionCtrl.byAssignment);
router.get("/executions/:id", executionCtrl.get);
router.post("/executions", executionCtrl.create);
router.put("/executions/:id", executionCtrl.update);
router.delete("/executions/:id", executionCtrl.remove);
router.post("/executions/:id/photos", executionCtrl.addPhoto);
router.delete("/executions/photos/:photoId", executionCtrl.deletePhoto);

// --- QC Records ---
router.get("/qc", qcCtrl.list);
router.get("/qc/stats", qcCtrl.stats);
router.get("/qc/:id", qcCtrl.get);
router.post("/qc", qcCtrl.create);
router.put("/qc/:id", qcCtrl.approve);
router.post("/qc/:id/approve", qcCtrl.approve);
router.post("/qc/:id/rework", qcCtrl.rework);
router.delete("/qc/:id", qcCtrl.remove);

// --- KPIs ---
router.get("/kpis", kpiCtrl.list);
router.get("/kpis/periods", kpiCtrl.periods);
router.get("/kpis/leaderboard", kpiCtrl.leaderboard);
router.get("/kpis/worker/:workerId", kpiCtrl.byWorker);
router.get("/kpis/:id", kpiCtrl.get);
router.post("/kpis", kpiCtrl.upsert);
router.delete("/kpis/:id", kpiCtrl.remove);

// --- Tools ---
router.get("/tools/categories", toolsCtrl.categories);
router.get("/tools/stats", toolsCtrl.stats);
router.get("/tools/code/:code", toolsCtrl.getToolByCode);
router.get("/tools", toolsCtrl.listTools);
router.get("/tools/enhanced", toolsCtrl.listToolsEnhanced);
router.get("/tools/:id", toolsCtrl.getTool);
router.get("/tools/:id/qrcode", toolsCtrl.getToolQrCode);
router.get("/tools/:id/utilization", toolsCtrl.getToolUtilization);
router.post("/tools", toolsCtrl.createTool);
router.put("/tools/:id", toolsCtrl.updateTool);
router.delete("/tools/:id", toolsCtrl.deleteTool);
router.put("/tools/:id/condition", toolsCtrl.updateCondition);

// Tool Photos
router.get("/tools/:id/photos", toolsCtrl.getToolPhotos);
router.post("/tools/:id/photos", toolsCtrl.addToolPhoto);
router.delete("/photos/:photoId", toolsCtrl.deleteToolPhoto);
router.put("/photos/:photoId/primary", toolsCtrl.setPrimaryPhoto);

// Tool Maintenance
router.get("/tools/:toolId/maintenance", toolsCtrl.getToolMaintenance);
router.get("/maintenance/upcoming", toolsCtrl.getUpcomingMaintenance);
router.get("/maintenance/calendar", toolsCtrl.getMaintenanceCalendar);
router.post("/maintenance", toolsCtrl.scheduleMaintenance);
router.put("/maintenance/:id/complete", toolsCtrl.completeMaintenance);

// Tool Activity Log
router.get("/tool-activities", toolsCtrl.getToolActivities);

// --- Tool Loans ---
router.get("/loans", toolsCtrl.listLoans);
router.get("/loans/:id", toolsCtrl.getLoan);
router.get("/loans/tool/:toolId", toolsCtrl.getLoansByTool);
router.get("/loans/worker/:workerId", toolsCtrl.getLoansByWorker);
router.post("/loans", toolsCtrl.issueTool);
router.put("/loans/:id/return", toolsCtrl.returnTool);
router.post("/loans/mark-overdue", toolsCtrl.markOverdue);

export default router;
