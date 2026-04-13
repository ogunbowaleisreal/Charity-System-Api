import { Router } from "express";
import { CampaignController } from "../../controllers/client/campaign.controller";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();

const campaignCtrl = new CampaignController();

// =============================
// 🔒 GLOBAL MIDDLEWARE
// =============================
router.use(rateLimiter.general);
router.use(verifyClientToken);

// =============================
// 🔹 CAMPAIGNS
// =============================
router.post("/campaign/create", campaignCtrl.createCampaign);

router.patch("/campaign/update/:campaignId", campaignCtrl.updateCampaign);

router.delete("/campaign/delete/:campaignId", campaignCtrl.deleteCampaign);

// =============================
// 🔹 FETCH CAMPAIGNS
// =============================
router.get("/campaigns", campaignCtrl.getAllCampaigns);

router.get("/campaign/:campaignId", campaignCtrl.getCampaignById);

router.get("/campaign/user/all", campaignCtrl.getUserCampaigns);

// =============================
// 🔹 STATS
// =============================
router.get("/campaign/stats/:campaignId", campaignCtrl.getCampaignStats);

router.get("/campaign/user/stats", campaignCtrl.getUserCampaignStats);

// =============================
// 🔹 DONATIONS
// =============================
router.get(
    "/campaign/:campaignId/donations",
    campaignCtrl.getCampaignDonations
);

// =============================
// 🔹 COMMENTS
// =============================
router.post(
    "/campaign/:campaignId/comment",
    campaignCtrl.addComment
);

router.get(
    "/campaign/:campaignId/comments",
    campaignCtrl.getCampaignComments
);

router.delete(
    "/campaign/comment/:commentId",
    campaignCtrl.deleteComment
);

// =============================
// 🔹 PREFERENCES
// =============================
router.patch(
    "/campaign/:campaignId/preferences",
    campaignCtrl.updatePreferences
);

// =============================
// 🔹 INTERNAL (WEBHOOK / SYSTEM)
// =============================
router.post(
    "/campaign/donation/confirm",
    campaignCtrl.confirmDonation
);

export default router;