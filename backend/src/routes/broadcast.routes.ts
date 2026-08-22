import { Router } from "express";
import * as broadcastController from "@/controllers/broadcast.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

router.get("/overview", broadcastController.overview);
router.get("/connections", broadcastController.listConnections);
router.post("/connections", broadcastController.createConnection);
router.post("/connections/whatsapp/quick-connect", broadcastController.quickConnectWhatsApp);
router.patch("/connections/:id", broadcastController.updateConnection);
router.delete("/connections/:id", broadcastController.deleteConnection);
router.post("/connections/:id/test", broadcastController.testConnection);
router.get("/connections/:id/session", broadcastController.getConnectionSession);
router.post("/connections/:id/session", broadcastController.startConnectionSession);
router.post("/connections/:id/session/refresh", broadcastController.refreshConnectionSessionQr);
router.post("/connections/:id/session/pair", broadcastController.requestConnectionPairingCode);
router.delete("/connections/:id/session", broadcastController.disconnectConnectionSession);
router.get("/contacts", broadcastController.listContacts);
router.post("/contacts", broadcastController.createContact);
router.patch("/contacts/:id", broadcastController.updateContact);
router.delete("/contacts/:id", broadcastController.deleteContact);
router.get("/campaigns", broadcastController.listCampaigns);
router.post("/campaigns", broadcastController.createCampaign);
router.patch("/campaigns/:id", broadcastController.updateCampaign);
router.delete("/campaigns/:id", broadcastController.deleteCampaign);
router.post("/campaigns/:id/send", broadcastController.sendCampaign);

export default router;
