import { Router } from "express";
import * as productController from "@/controllers/product.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.get("/", productController.list);
router.get("/slug/:slug", productController.getBySlug);
router.get("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), productController.getById);
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), productController.create);
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), productController.update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), productController.remove);

export default router;
