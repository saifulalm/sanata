import { Router } from "express";
import * as siteContentController from "@/controllers/siteContent.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

// Publik: satu payload berisi seluruh konten situs untuk dirender frontend.
router.get("/public", siteContentController.publicContent);

// Sisanya khusus admin/editor.
router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/collections", siteContentController.collections);
router.get("/settings", siteContentController.listSettings);
router.put("/settings", writeLimiter, siteContentController.updateSettings);
router.get("/items/:collection", siteContentController.listItems);
router.post("/items", writeLimiter, siteContentController.createItem);
router.put("/items/:id", writeLimiter, siteContentController.updateItem);
router.post("/items/:id/move", writeLimiter, siteContentController.moveItem);
router.delete("/items/:id", siteContentController.removeItem);

export default router;
