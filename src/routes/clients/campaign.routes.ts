import { Router } from "express";
import { CampaignController } from "../../controllers/client/campaign.controller";
import { verifyClientToken, optionalClientAuth } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { validate } from "../../middleware/validator";
import {
    createCampaignSchema,
    updateCampaignSchema,
    campaignFilterSchema,
    campaignParamsSchema
} from "../../validators/campaign.validators";

const router = Router();

const campaignCtrl = new CampaignController();

router.use(optionalClientAuth);

router.get("/",
    validate(campaignFilterSchema, "query"),
    campaignCtrl.getAllCampaigns);

router.get("/featured/campaigns",
    campaignCtrl.getFeaturedCampaign
)

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


// =============================
// 🔹 CAMPAIGNS
// =============================
router.post("/create",
    validate(createCampaignSchema),
    campaignCtrl.createCampaign);

router.get("/user/favorite",
    campaignCtrl.getUserFavouriteCampaign
);

router.get("/toggle-favorite/:campaignId",
    campaignCtrl.toggleCampaignFavourite
)

router.patch("/update/:campaignId",
    validate(updateCampaignSchema),
    campaignCtrl.updateCampaign);

router.delete("/delete/:campaignId",
    validate(campaignParamsSchema, "params"),
    campaignCtrl.deleteCampaign);


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