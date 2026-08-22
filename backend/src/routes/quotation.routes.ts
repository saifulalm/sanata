import { Router } from "express";
import * as quotationController from "@/controllers/quotation.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/", quotationController.list);
router.get("/defaults", quotationController.defaults);
router.get("/:id", quotationController.detail);
router.post("/", writeLimiter, quotationController.create);
router.put("/:id", writeLimiter, quotationController.update);
router.patch("/:id/status", writeLimiter, quotationController.updateStatus);
router.delete("/:id", requireRole("ADMIN"), quotationController.remove);

export default router;
