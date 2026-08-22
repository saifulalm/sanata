import { Router } from "express";
import * as categoryController from "@/controllers/category.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.get("/", categoryController.list);
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), categoryController.create);
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), categoryController.update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), categoryController.remove);

export default router;
