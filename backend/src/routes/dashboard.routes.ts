import { Router } from "express";
import * as dashboardController from "@/controllers/dashboard.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.get("/summary", requireAuth, requireRole("ADMIN", "EDITOR"), dashboardController.summary);

export default router;
