import { Router } from "express";
import { rateLimiter } from "../../middleware/ratelimiter";
import {
    authorize,
    requireRole,
    verifyAdminToken,
} from "../../middleware/adminAuth";
import { BusinessCategoryController } from "../../controllers/admin/businessCategoryManagement";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";

const router = Router();
const businessCategoryController = new BusinessCategoryController();

// Apply token verification + rate limiter globally
router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

// -------------------------------------------
// GET ALL BUSINESS CATEGORIES
// -------------------------------------------
router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
    businessCategoryController.getAllBusinessCategories as any
);

// -------------------------------------------
// GET CATEGORY BY ID
// -------------------------------------------
router.get(
    "/:categoryId",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
    businessCategoryController.getBusinessCategoryById as any
);

// -------------------------------------------
// CREATE CATEGORY
// -------------------------------------------
router.post(
    "/create",
    // requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.CREATE]) as any,
    businessCategoryController.createBusinessCategory as any
);

// -------------------------------------------
// UPDATE CATEGORY
// -------------------------------------------
router.put(
    "/:categoryId",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.UPDATE]) as any,
    businessCategoryController.updateBusinessCategory as any
);

// -------------------------------------------
// DELETE CATEGORY
// -------------------------------------------
router.delete(
    "/:categoryId",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.DELETE]) as any,
    businessCategoryController.deleteBusinessCategory as any
);

// -------------------------------------------
// UPDATE CATEGORY STATUS (active/inactive)
// -------------------------------------------
router.patch(
    "/:categoryId/status",
    // requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.UPDATE]) as any,
    businessCategoryController.updateBusinessCategoryStatus as any
);

export default router;
