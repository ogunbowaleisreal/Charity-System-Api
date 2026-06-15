"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import {
//     validateRequest,
//     validateParams,
//     validateQuery,
// } from "@/middleware/validation";
const ratelimiter_1 = require("../../middleware/ratelimiter");
const admin_management_1 = require("../../types/admin.management");
const adminAuth_1 = require("../../middleware/adminAuth");
const categoryController_1 = require("../../controllers/admin/categoryController");
const router = (0, express_1.Router)();
const categoryController = new categoryController_1.CategoryController();
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
//Get all categories
router.get("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.VIEW]), 
//validateQuery(categoryQueryValidation),
categoryController.getAllCategories);
// Get categories with subcategories count
// router.get(
//   "/with-subcategories",
//   requireRole(["admin", "super_admin", "moderator"]) as any,
//   authorize([ADMIN_PERMISSIONS.CONTENT.VIEW]) as any,
//   validateQuery(categoryQueryValidation),
//   categoryController.getCategoriesWithSubcategoriesCount as any
// );
router.get("/:id", 
//requireRole(["admin", "super_admin", "moderator"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.VIEW]), 
//validateParams(categoryIdValidation),
categoryController.getCategoryById);
router.post("/create", 
//requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.CREATE]), 
//validateRequest(createCategoryValidation),
categoryController.createCategory);
router.put("/:id", 
//requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.UPDATE]), 
//validateParams(categoryIdValidation),
//validateRequest(updateCategoryValidation),
categoryController.updateCategory);
router.delete("/:id", 
//requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.DELETE]), 
//validateParams(categoryIdValidation),
categoryController.deleteCategory);
// Update category status
// not in postman yet
router.patch("/:id/status", (0, adminAuth_1.requireRole)(["admin", "super_admin"]), (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.UPDATE]), 
//validateParams(categoryIdValidation),
//validateRequest(categoryStatusValidation),
categoryController.updateCategoryStatus);
exports.default = router;
