import { Router } from "express";
import * as userController from "@/controllers/user.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/", userController.list);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

export default router;
