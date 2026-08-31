/**
 * Gateway REST API Routes
 * Endpoints untuk WhatsApp Gateway
 */

import { Router, type Request, type Response } from "express";
import { gateway } from "./whatsapp";

export function createGatewayRouter(): Router {
  const router = Router();

  /**
   * Health check endpoint
   * GET /gateway/health
   */
  router.get("/health", async (_req: Request, res: Response) => {
    try {
      const health = await gateway.healthCheck();
      res.json({ ok: true, ...health });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
  });

  /**
   * Create new session
   * POST /gateway/sessions
   * Body: { sessionId: string }
   */
  router.post("/sessions", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId || typeof sessionId !== "string") {
        res.status(400).json({ ok: false, error: "sessionId is required" });
        return;
      }

      const session = await gateway.createSession(sessionId);
      res.json({ ok: true, data: session });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create session",
      });
    }
  });

  /**
   * Get session status
   * GET /gateway/sessions/:sessionId
   */
  router.get("/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await gateway.getSession(sessionId);

      if (!session) {
        res.status(404).json({ ok: false, error: "Session not found" });
        return;
      }

      res.json({ ok: true, data: session });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to get session",
      });
    }
  });

  /**
   * Get QR code for session
   * GET /gateway/sessions/:sessionId/qr
   */
  router.get("/sessions/:sessionId/qr", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await gateway.getSession(sessionId);

      if (!session) {
        res.status(404).json({ ok: false, error: "Session not found" });
        return;
      }

      if (session.state === "CONNECTED") {
        res.json({
          ok: true,
          data: {
            state: "CONNECTED",
            phoneNumber: session.phoneNumber,
            displayName: session.displayName,
            message: "WhatsApp sudah terhubung",
          },
        });
        return;
      }

      if (!session.qrCode) {
        res.json({
          ok: true,
          data: {
            state: session.state,
            message: session.message || "Menunggu QR...",
          },
        });
        return;
      }

      res.json({
        ok: true,
        data: {
          state: session.state,
          qrCode: session.qrCode,
          expiresAt: session.expiresAt?.toISOString(),
          message: "Scan QR ini dari WhatsApp",
        },
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to get QR",
      });
    }
  });

  /**
   * Refresh QR code
   * POST /gateway/sessions/:sessionId/refresh
   */
  router.post("/sessions/:sessionId/refresh", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await gateway.refreshQR(sessionId);
      res.json({ ok: true, data: session });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to refresh QR",
      });
    }
  });

  /**
   * Send message
   * POST /gateway/sessions/:sessionId/send
   * Body: { to: string, text: string }
   */
  router.post("/sessions/:sessionId/send", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { to, text } = req.body;

      if (!to || !text) {
        res.status(400).json({ ok: false, error: "to and text are required" });
        return;
      }

      const messageId = await gateway.sendMessage(sessionId, { to, text });
      res.json({ ok: true, data: { messageId } });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to send message",
      });
    }
  });

  /**
   * Disconnect session
   * DELETE /gateway/sessions/:sessionId
   */
  router.delete("/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await gateway.disconnectSession(sessionId);
      res.json({ ok: true, data: session });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to disconnect session",
      });
    }
  });

  return router;
}
