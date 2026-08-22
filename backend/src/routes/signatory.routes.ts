import { Router } from "express";
import * as signatoryController from "@/controllers/signatory.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/", signatoryController.list);
router.get("/:id", signatoryController.detail);
router.post("/", writeLimiter, signatoryController.create);
router.put("/:id", writeLimiter, signatoryController.update);
router.delete("/:id", requireRole("ADMIN"), signatoryController.remove);

export default router;
