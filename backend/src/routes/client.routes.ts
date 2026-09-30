/**
 * Client Portal Routes
 * API endpoints for customer project monitoring
 */

import { Router } from "express";
import * as clientController from "@/controllers/clientPortal.controller";
import { requireClientAuth } from "@/middleware/clientAuth";

const router = Router();

// Public routes (no auth required)
router.post("/register", clientController.register);
router.post("/login", clientController.login);
router.post("/refresh", clientController.refresh);
router.post("/logout", clientController.logout);

// Password Reset (public - no auth required)
router.post("/password/reset/request", clientController.requestReset);
router.post("/password/reset/confirm", clientController.confirmReset);

// Protected routes (auth required)
router.get("/me", requireClientAuth, clientController.me);
router.patch("/me", requireClientAuth, clientController.updateProfile);

// Projects
router.get("/projects", requireClientAuth, clientController.getProjects);
router.get("/projects/:rabId", requireClientAuth, clientController.getProjectDetails);
router.get("/projects/:rabId/progress", requireClientAuth, clientController.getProjectProgress);

// Daily Reports
router.get("/projects/:rabId/daily-reports", requireClientAuth, clientController.getDailyReports);

// QC Records
router.get("/projects/:rabId/qc", requireClientAuth, clientController.getQCRecords);

// Documents
router.get("/projects/:rabId/documents", requireClientAuth, clientController.getDocuments);

// Notifications
router.get("/notifications", requireClientAuth, clientController.getNotifications);
router.patch("/notifications/:id/read", requireClientAuth, clientController.markRead);
router.post("/notifications/read-all", requireClientAuth, clientController.markAllRead);

// Notification Preferences
router.get("/notifications/preferences", requireClientAuth, clientController.getPreferences);
router.put("/notifications/preferences", requireClientAuth, clientController.updatePreferences);

// Password Change
router.post("/password/change", requireClientAuth, clientController.changePassword);

// Recent Documents
router.get("/documents/recent", requireClientAuth, clientController.getRecentDocuments);

// Project Extended Features
router.get("/projects/:rabId/team", requireClientAuth, clientController.getTeam);
router.get("/projects/:rabId/milestones", requireClientAuth, clientController.getMilestones);
router.get("/projects/:rabId/s-curve", requireClientAuth, clientController.getSCurve);
router.get("/projects/:rabId/s-curve/sections", requireClientAuth, clientController.getSectionLevelSCurveData);
router.get("/projects/:rabId/photos", requireClientAuth, clientController.getPhotos);

// Dashboard Stats (all projects summary)
router.get("/stats", requireClientAuth, clientController.getStats);

export default router;
