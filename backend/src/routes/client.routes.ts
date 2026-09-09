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

export default router;
