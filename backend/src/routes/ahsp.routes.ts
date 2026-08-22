import { Router } from "express";
import * as ahspController from "@/controllers/ahsp.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/", ahspController.list);
router.get("/categories", ahspController.categories);
router.get("/:id", ahspController.detail);
router.post("/", writeLimiter, ahspController.create);
router.put("/:id", writeLimiter, ahspController.update);
router.delete("/:id", requireRole("ADMIN"), ahspController.remove);

export default router;
