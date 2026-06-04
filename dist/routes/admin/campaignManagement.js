"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaignController_1 = require("../../controllers/admin/campaignController");
const adminAuth_1 = require("../../middleware/adminAuth");
const admin_management_1 = require("../../types/admin.management");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const campaignCtrl = new campaignController_1.CampaignAdminController();
// =========================
// GLOBAL MIDDLEWARE
// =========================
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
// =========================
// 📊 GET ALL CAMPAIGNS
// =========================
router.get("/all-campaigns", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]), campaignCtrl.getAllCampaigns);
// =========================
// 🎯 GET CAMPAIGN DETAILS
// =========================
router.get("/details/:campaignId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]), campaignCtrl.getCampaignById);
// =========================
// 💬 GET CAMPAIGN COMMENTS
// =========================
router.get("/comments/:campaignId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]), campaignCtrl.getCampaignComments);
router.get("/stats/:campaignId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]), campaignCtrl.getCampaignStats);
router.get("/suspend/:campaignId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.SUSPEND]), campaignCtrl.suspendCampaign);
router.get("/unsuspend/:campaignId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.SUSPEND]), campaignCtrl.unsuspendCampaign);
// =========================
// 💰 GET CAMPAIGN DONATIONS
// =========================
router.get("/donations/:campaignId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]), campaignCtrl.getCampaignDonations);
exports.default = router;
