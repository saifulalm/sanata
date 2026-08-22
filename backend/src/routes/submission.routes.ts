import { Router } from "express";
import * as projectDoc from "@/controllers/projectDoc.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

/**
 * Pengajuan alat, material, dan waktu.
 *
 * Pembagian perannya mengikuti rantai wewenang di proyek: editor mewakili site
 * engineer yang mengajukan, admin mewakili atasan yang memutuskan. Karena itu
 * pemeriksaan, penerusan ke pemilik proyek, dan penerapan perpanjangan waktu ke
 * jadwal hanya terbuka untuk admin — bukan sekadar disembunyikan tombolnya di
 * panel, tetapi ditutup di lapisan yang benar-benar menjaga.
 */
const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/", projectDoc.listSubmissions);
router.get("/:id", projectDoc.getSubmission);

router.post("/", writeLimiter, projectDoc.createSubmission);
router.put("/:id", writeLimiter, projectDoc.updateSubmission);
router.post("/:id/submit", writeLimiter, projectDoc.submitSubmission);
router.post("/:id/cancel", writeLimiter, projectDoc.cancelSubmission);

router.post("/:id/review", writeLimiter, requireRole("ADMIN"), projectDoc.reviewSubmission);
router.post("/:id/forward", writeLimiter, requireRole("ADMIN"), projectDoc.forwardSubmission);
router.post("/:id/client-decision", writeLimiter, requireRole("ADMIN"), projectDoc.clientDecision);
router.post("/:id/apply-schedule", writeLimiter, requireRole("ADMIN"), projectDoc.applyTimeExtension);

router.delete("/:id", writeLimiter, projectDoc.removeSubmission);

export default router;
