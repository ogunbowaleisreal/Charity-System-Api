"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("../../controllers/client/campaign.controller");
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const campaignCtrl = new campaign_controller_1.CampaignController();
router.get("/", campaignCtrl.getAllCampaigns);
router.get("/:campaignId", campaignCtrl.getCampaignById);
router.get("/stats/:campaignId", campaignCtrl.getCampaignStats);
router.get("/:campaignId/donations", campaignCtrl.getCampaignDonations);
router.get("/:campaignId/comments", campaignCtrl.getCampaignComments);
// =============================
// 🔒 GLOBAL MIDDLEWARE
// =============================
router.use(ratelimiter_1.rateLimiter.general);
router.use(auth_1.verifyClientToken);
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
