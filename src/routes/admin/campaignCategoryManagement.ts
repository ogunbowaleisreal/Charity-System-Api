import { Router } from "express";
import { rateLimiter } from "../../middleware/ratelimiter";
import {
    authorize,
    requireRole,
    verifyAdminToken,
} from "../../middleware/adminAuth";
import { CampaignCategoryController } from "../../controllers/admin/campaignCategoryManagement";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();
const campaignCategoryController = new CampaignCategoryController();

// Apply token verification + rate limiter globally
router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

// -------------------------------------------
// GET ALL Campaign CATEGORIES
// -------------------------------------------
router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
    campaignCategoryController.getAllCampaignCategories as any
);

// -------------------------------------------
// GET CATEGORY BY ID
// -------------------------------------------
router.get(
    "/:categoryId",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
    campaignCategoryController.getCampaignCategoryById as any
);

// -------------------------------------------
// CREATE CATEGORY
// -------------------------------------------
router.post(
    "/create",
    // requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.CREATE]) as any,
    campaignCategoryController.createCampaignCategory as any
);

// -------------------------------------------
// UPDATE CATEGORY
// -------------------------------------------
router.put(
    "/:categoryId",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.UPDATE]) as any,
    campaignCategoryController.updateCampaignCategory as any
);

// -------------------------------------------
// DELETE CATEGORY
// -------------------------------------------
router.delete(
    "/:categoryId",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.DELETE]) as any,
    campaignCategoryController.deleteCampaignCategory as any
);

// -------------------------------------------
// UPDATE CATEGORY STATUS (active/inactive)
// -------------------------------------------
router.patch(
    "/:categoryId/status",
    // requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.UPDATE]) as any,
    campaignCategoryController.updateCampaignCategoryStatus as any
);

export default router;
