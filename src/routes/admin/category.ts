import { Router } from "express";
// import {
//     validateRequest,
//     validateParams,
//     validateQuery,
// } from "@/middleware/validation";
import { rateLimiter } from "../../middleware/ratelimiter";
import { ADMIN_PERMISSIONS } from "../../types/admin.management";
import {
    authorize,
    requireRole,
    verifyAdminToken,
} from "../../middleware/adminAuth";
import { CategoryController } from "../../controllers/admin/categoryController";

const router = Router();
const categoryController = new CategoryController();

router.use(verifyAdminToken as any);
router.use(rateLimiter.general);

//Get all categories
router.get(
    "/",
    authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
    //validateQuery(categoryQueryValidation),
    categoryController.getAllCategories as any
);

// Get categories with subcategories count
// router.get(
//   "/with-subcategories",
//   requireRole(["admin", "super_admin", "moderator"]) as any,
//   authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
//   validateQuery(categoryQueryValidation),
//   categoryController.getCategoriesWithSubcategoriesCount as any
// );

router.get(
    "/:id",
    //requireRole(["admin", "super_admin", "moderator"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
    //validateParams(categoryIdValidation),
    categoryController.getCategoryById as any
);

router.post(
    "/create",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.CREATE]) as any,
    //validateRequest(createCategoryValidation),
    categoryController.createCategory as any
);

router.put(
    "/:id",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.UPDATE]) as any,
    //validateParams(categoryIdValidation),
    //validateRequest(updateCategoryValidation),
    categoryController.updateCategory as any
);

router.delete(
    "/:id",
    //requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.DELETE]) as any,
    //validateParams(categoryIdValidation),
    categoryController.deleteCategory as any
);

// Update category status
// not in postman yet
router.patch(
    "/:id/status",
    requireRole(["admin", "super_admin"]) as any,
    authorize([ADMIN_PERMISSIONS.CONTENT.UPDATE]) as any,
    //validateParams(categoryIdValidation),
    //validateRequest(categoryStatusValidation),
    categoryController.updateCategoryStatus as any
);

export default router;
