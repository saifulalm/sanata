import { Router } from "express";
import * as contentController from "@/controllers/content.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.get("/", contentController.list);
// Publik: dipakai generator sitemap.xml di sisi Next.js.
router.get("/sitemap-data", contentController.sitemapData);
router.get("/slug/:slug", contentController.getBySlug);

// Rute SEO harus didaftarkan sebelum "/:id" agar tidak tertangkap sebagai id.
router.get("/seo/overview", requireAuth, requireRole("ADMIN", "EDITOR"), contentController.seoOverview);
router.post("/seo/analyze", requireAuth, requireRole("ADMIN", "EDITOR"), contentController.analyze);

router.get("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), contentController.getById);
router.post("/", requireAuth, requireRole("ADMIN", "EDITOR"), contentController.create);
router.put("/:id", requireAuth, requireRole("ADMIN", "EDITOR"), contentController.update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), contentController.remove);

export default router;
