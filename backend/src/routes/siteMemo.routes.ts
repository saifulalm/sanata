import { Router } from "express";
import * as projectDoc from "@/controllers/projectDoc.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

/**
 * Site memo — surat masuk dan surat keluar proyek.
 *
 * Mencatat surat yang masuk adalah pekerjaan administrasi harian, jadi terbuka
 * untuk editor. Menghapus surat tidak: sekali sebuah komplain tercatat,
 * hilangnya dari sistem jauh lebih berbahaya daripada salah ketik yang
 * tertinggal, sehingga hanya admin yang boleh.
 */
const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/:memoId", projectDoc.getMemo);
router.get("/:memoId/reply-defaults", projectDoc.getMemoReplyDefaults);

router.post("/", writeLimiter, projectDoc.createMemo);
router.put("/:memoId", writeLimiter, projectDoc.updateMemo);
router.put("/:memoId/status", writeLimiter, projectDoc.setMemoStatus);
router.delete("/:memoId", writeLimiter, requireRole("ADMIN"), projectDoc.removeMemo);

export default router;
