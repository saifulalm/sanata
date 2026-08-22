import { Router } from "express";
import * as projectDoc from "@/controllers/projectDoc.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

/**
 * Surat resmi proyek: SPK, invoice, kwitansi, BAPP, BAST.
 *
 * Menyusun draf terbuka untuk editor, tetapi menerbitkan surat tertutup untuk
 * admin. Penerbitanlah yang mengambil nomor pasti dan membekukan nilai — sejak
 * saat itu dokumennya mengikat perusahaan terhadap pihak luar, dan itu bukan
 * keputusan administrasi.
 */
const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/defaults", projectDoc.getLetterDefaults);
router.get("/:letterId", projectDoc.getLetter);

router.post("/", writeLimiter, projectDoc.createLetter);
router.put("/:letterId", writeLimiter, projectDoc.updateLetter);
router.post("/:letterId/issue", writeLimiter, requireRole("ADMIN"), projectDoc.issueLetter);
router.put("/:letterId/status", writeLimiter, requireRole("ADMIN"), projectDoc.setLetterStatus);
router.delete("/:letterId", writeLimiter, projectDoc.removeLetter);

export default router;
