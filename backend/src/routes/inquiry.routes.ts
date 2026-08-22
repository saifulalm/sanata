import { Router } from "express";
import * as inquiryController from "@/controllers/inquiry.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { inquiryLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.post("/", inquiryLimiter, inquiryController.create);
router.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), inquiryController.list);
router.patch("/:id/status", requireAuth, requireRole("ADMIN", "EDITOR"), inquiryController.updateStatus);
router.delete("/:id", requireAuth, requireRole("ADMIN"), inquiryController.remove);

export default router;
