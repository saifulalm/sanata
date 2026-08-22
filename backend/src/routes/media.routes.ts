import { Router } from "express";
import * as mediaController from "@/controllers/media.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { upload } from "@/middleware/upload";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), mediaController.list);
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), writeLimiter, upload.single("file"), mediaController.uploadMedia);
router.delete("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), mediaController.deleteMedia);

export default router;
