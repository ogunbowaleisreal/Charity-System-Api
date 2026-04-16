import { Router } from "express";
import { CampaignController } from "../../controllers/client/campaign.controller";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();

const campaignCtrl = new CampaignController();

router.get("/", campaignCtrl.getAllCampaigns);

router.get("/:campaignId", campaignCtrl.getCampaignById);

router.get("/stats/:campaignId", campaignCtrl.getCampaignStats);

router.get(
    "/:campaignId/donations",
    campaignCtrl.getCampaignDonations
);
router.get(
    "/:campaignId/comments",
    campaignCtrl.getCampaignComments
);


// =============================
// 🔒 GLOBAL MIDDLEWARE
// =============================
router.use(rateLimiter.general);
router.use(verifyClientToken);

// =============================
// 🔹 CAMPAIGNS
// =============================
router.post("/create", campaignCtrl.createCampaign);

router.patch("/update/:campaignId", campaignCtrl.updateCampaign);

router.delete("/delete/:campaignId", campaignCtrl.deleteCampaign);


// =============================
// 🔹 FETCH CAMPAIGNS
// =============================


router.get("/user/all", campaignCtrl.getUserCampaigns);

// =============================
// 🔹 STATS
// =============================


router.get("/user/stats", campaignCtrl.getUserCampaignStats);

// =============================
// 🔹 DONATIONS
// =============================


// =============================
// 🔹 COMMENTS
// =============================
router.post(
    "/:campaignId/comment",
    campaignCtrl.addComment
);



router.delete(
    "/comment/:commentId",
    campaignCtrl.deleteComment
);

// =============================
// 🔹 PREFERENCES
// =============================
router.patch(
    "/:campaignId/preferences",
    campaignCtrl.updatePreferences
);

// =============================
// 🔹 INTERNAL (WEBHOOK / SYSTEM)
// =============================
router.post(
    "/donation/confirm",
    campaignCtrl.confirmDonation
);

export default router;