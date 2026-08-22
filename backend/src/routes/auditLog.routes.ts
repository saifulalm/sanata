import { Router } from "express";
import * as auditLogController from "@/controllers/auditLog.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN"), auditLogController.list);

export default router;
