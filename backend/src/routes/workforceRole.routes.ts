import { Router } from "express";
import * as workforceRoleController from "@/controllers/workforceRole.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", workforceRoleController.list);
router.put("/:id/toggle", workforceRoleController.toggle);
router.put("/:id", workforceRoleController.update);

export default router;
