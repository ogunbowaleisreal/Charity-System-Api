"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("../../controllers/client/campaign.controller");
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const validator_1 = require("../../middleware/validator");
const campaign_validators_1 = require("../../validators/campaign.validators");
const router = (0, express_1.Router)();
const campaignCtrl = new campaign_controller_1.CampaignController();
router.use(auth_1.optionalClientAuth);
router.get("/", (0, validator_1.validate)(campaign_validators_1.campaignFilterSchema, "query"), campaignCtrl.getAllCampaigns);
router.get("/featured/campaigns", campaignCtrl.getFeaturedCampaign);
router.get("/:campaignId", campaignCtrl.getCampaignById);
router.get("/stats/:campaignId", campaignCtrl.getCampaignStats);
router.get("/:campaignId/donations", campaignCtrl.getCampaignDonations);
router.get("/:campaignId/comments", campaignCtrl.getCampaignComments);
// =============================
// 🔒 GLOBAL MIDDLEWARE
// =============================
router.use(ratelimiter_1.rateLimiter.general);
// =============================
// 🔹 CAMPAIGNS
// =============================
router.post("/create", (0, validator_1.validate)(campaign_validators_1.createCampaignSchema), campaignCtrl.createCampaign);
router.get("/user/favorite", campaignCtrl.getUserFavouriteCampaign);
router.get("/toggle-favorite/:campaignId", campaignCtrl.toggleCampaignFavourite);
router.patch("/update/:campaignId", (0, validator_1.validate)(campaign_validators_1.updateCampaignSchema), campaignCtrl.updateCampaign);
router.delete("/delete/:campaignId", (0, validator_1.validate)(campaign_validators_1.campaignParamsSchema, "params"), campaignCtrl.deleteCampaign);
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
router.post("/:campaignId/comment", campaignCtrl.addComment);
router.delete("/comment/:commentId", campaignCtrl.deleteComment);
// =============================
// 🔹 PREFERENCES
// =============================
router.patch("/:campaignId/preferences", campaignCtrl.updatePreferences);
// =============================
// 🔹 INTERNAL (WEBHOOK / SYSTEM)
// =============================
router.post("/donation/confirm", campaignCtrl.confirmDonation);
exports.default = router;
