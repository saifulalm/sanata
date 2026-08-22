import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth";
import { loginLimiter, registerLimiter } from "@/middleware/rateLimiters";

const router = Router();

router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

router.post("/2fa/setup", requireAuth, authController.setupTwoFactor);
router.post("/2fa/enable", requireAuth, authController.enableTwoFactor);
router.post("/2fa/disable", requireAuth, authController.disableTwoFactor);

export default router;
