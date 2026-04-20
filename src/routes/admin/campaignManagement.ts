import { Router } from "express";
import { CampaignAdminController } from "../../controllers/admin/campaignController";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();

const campaignCtrl = new CampaignAdminController();

// =========================
// GLOBAL MIDDLEWARE
// =========================
router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

// =========================
// 📊 GET ALL CAMPAIGNS
// =========================
router.get(
    "/all-campaigns",
    authorize([ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]) as any,
    campaignCtrl.getAllCampaigns
);

// =========================
// 🎯 GET CAMPAIGN DETAILS
// =========================
router.get(
    "/details/:campaign_id",
    authorize([ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]) as any,
    campaignCtrl.getCampaignById
);

// =========================
// 💬 GET CAMPAIGN COMMENTS
// =========================
router.get(
    "/comments/:campaign_id",
    authorize([ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]) as any,
    campaignCtrl.getCampaignComments
);

// =========================
// 💰 GET CAMPAIGN DONATIONS
// =========================
router.get(
    "/donations/:campaign_id",
    authorize([ADMIN_PERMISSIONS.CAMPAIGNS.VIEW]) as any,
    campaignCtrl.getCampaignDonations
);

export default router;