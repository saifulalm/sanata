import { Router } from "express";
import * as priceItemController from "@/controllers/priceItem.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { writeLimiter } from "@/middleware/rateLimiters";

const router = Router();

// Master harga bersifat internal — seluruh endpoint butuh autentikasi.
router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/", priceItemController.list);
router.get("/:id", priceItemController.detail);
router.post("/", writeLimiter, priceItemController.create);
router.put("/:id", writeLimiter, priceItemController.update);
router.delete("/:id", requireRole("ADMIN"), priceItemController.remove);

export default router;
