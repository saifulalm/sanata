import { Router } from "express";
import * as rabController from "@/controllers/rab.controller";
import * as projectDoc from "@/controllers/projectDoc.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/daily-reports/summary", rabController.dailyReportSummary);
router.get("/", rabController.list);
router.get("/:id", rabController.detail);
router.get("/:id/export.csv", rabController.exportCsv);
router.get("/:id/takeoff", rabController.takeoff);
router.get("/:id/takeoff.csv", rabController.exportTakeoffCsv);
router.get("/:id/schedule", rabController.schedule);
router.get("/:id/schedule.csv", rabController.exportScheduleCsv);
router.put("/:id/schedule", writeLimiter, rabController.updateSchedule);

// Opname: pencatatan bebas untuk editor, pemeriksaan khusus admin.
router.get("/:id/progress", rabController.listProgress);
router.post("/items/:itemId/progress", writeLimiter, rabController.addProgress);
router.post("/progress/:progressId/review", writeLimiter, requireRole("ADMIN"), rabController.reviewProgress);
router.delete("/progress/:progressId", writeLimiter, rabController.removeProgress);

// Baseline jadwal.
router.get("/:id/baselines", rabController.listBaselines);
router.post("/:id/baselines", writeLimiter, rabController.captureBaseline);
router.delete("/baselines/:baselineId", writeLimiter, rabController.removeBaseline);

// Laporan harian lapangan.
router.get("/:id/daily-reports", rabController.listDailyReports);
router.post("/:id/daily-reports", writeLimiter, rabController.createDailyReport);
router.get("/daily-reports/:reportId", rabController.getDailyReport);
router.put("/daily-reports/:reportId", writeLimiter, rabController.updateDailyReport);
router.delete("/daily-reports/:reportId", writeLimiter, rabController.removeDailyReport);

// Termin berbasis progres.
router.get("/:id/billings", rabController.listBillings);
router.post("/:id/billings/preview", rabController.previewBilling);
router.post("/:id/billings", writeLimiter, requireRole("ADMIN"), rabController.createBilling);
router.get("/billings/:billingId", rabController.getBillingDetail);
router.get("/billings/:billingId/export.csv", rabController.exportBillingCsv);
router.put("/billings/:billingId/status", writeLimiter, requireRole("ADMIN"), rabController.setBillingStatus);
router.delete("/billings/:billingId", writeLimiter, requireRole("ADMIN"), rabController.removeBilling);
// Laporan mingguan & bulanan — rekap turunan, jadi hanya bisa dibaca.
router.get("/:id/reports/weekly", projectDoc.weeklyReports);
router.get("/:id/reports/weekly.csv", projectDoc.exportWeeklyCsv);
router.get("/:id/reports/monthly", projectDoc.monthlyReports);
router.get("/:id/reports/monthly.csv", projectDoc.exportMonthlyCsv);

// Logbook kejadian lapangan.
router.get("/:id/logbook", projectDoc.listLogbook);
router.get("/:id/logbook.csv", projectDoc.exportLogbookCsv);
router.post("/:id/logbook", writeLimiter, projectDoc.createLogbookEntry);
router.put("/logbook/:entryId", writeLimiter, projectDoc.updateLogbookEntry);
router.delete("/logbook/:entryId", writeLimiter, projectDoc.removeLogbookEntry);

// Daftar dokumen milik satu proyek. Pembuatan dan perubahannya ada di
// routernya masing-masing (/site-memos, /letters, /submissions).
router.get("/:id/memos", projectDoc.listMemos);
router.get("/:id/letters", projectDoc.listLetters);

router.post("/", writeLimiter, rabController.create);
router.put("/:id", writeLimiter, rabController.update);
router.delete("/:id", requireRole("ADMIN"), rabController.remove);

export default router;
