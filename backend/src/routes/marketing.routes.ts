import { Router } from "express";
import * as marketingController from "@/controllers/marketing.controller";
import { requireAuth, requireRole } from "@/middleware/auth";

const router = Router();

// All routes require authentication and ADMIN or EDITOR role
router.use(requireAuth, requireRole("ADMIN", "EDITOR"));

// ============== Campaign Routes =============

router.get("/campaigns", marketingController.listCampaigns);
router.post("/campaigns", marketingController.createCampaign);
router.get("/campaigns/:id", marketingController.getCampaign);
router.put("/campaigns/:id", marketingController.updateCampaign);
router.delete("/campaigns/:id", marketingController.deleteCampaign);
router.post("/campaigns/:id/send", marketingController.sendCampaign);
router.get("/campaigns/:id/stats", marketingController.getCampaignStats);

// ============== Contact Routes =============

router.get("/contacts", marketingController.listContacts);
router.post("/contacts", marketingController.createContact);
router.put("/contacts/:id", marketingController.updateContact);
router.delete("/contacts/:id", marketingController.deleteContact);
router.post("/contacts/import", marketingController.importContacts);

// ============== Template Routes =============

router.get("/templates", marketingController.listTemplates);
router.post("/templates", marketingController.createTemplate);
router.put("/templates/:id", marketingController.updateTemplate);
router.delete("/templates/:id", marketingController.deleteTemplate);

// ============== Offer Routes =============

router.get("/offers", marketingController.listOffers);
router.post("/offers", marketingController.createOffer);
router.put("/offers/:id", marketingController.updateOffer);
router.delete("/offers/:id", marketingController.deleteOffer);

// ============== Broadcast List Routes =============

router.get("/broadcast-lists", marketingController.listBroadcastLists);
router.post("/broadcast-lists", marketingController.createBroadcastList);
router.put("/broadcast-lists/:id", marketingController.updateBroadcastList);
router.post("/broadcast-lists/:id/contacts", marketingController.addContactsToBroadcastList);

// ============== Analytics Route =============

router.get("/analytics", marketingController.getAnalytics);

export default router;
