"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const adminAuth_1 = require("../../middleware/adminAuth");
const businessCategoryManagement_1 = require("../../controllers/admin/businessCategoryManagement");
const admin_management_1 = require("../../types/admin.management");
const router = (0, express_1.Router)();
const businessCategoryController = new businessCategoryManagement_1.BusinessCategoryController();
// Apply token verification + rate limiter globally
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
// -------------------------------------------
// GET ALL BUSINESS CATEGORIES
// -------------------------------------------
router.get("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.VIEW]), businessCategoryController.getAllBusinessCategories);
// -------------------------------------------
// GET CATEGORY BY ID
// -------------------------------------------
router.get("/:categoryId", 
//requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.VIEW]), businessCategoryController.getBusinessCategoryById);
// -------------------------------------------
// CREATE CATEGORY
// -------------------------------------------
router.post("/create", 
// requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.CREATE]), businessCategoryController.createBusinessCategory);
// -------------------------------------------
// UPDATE CATEGORY
// -------------------------------------------
router.put("/:categoryId", 
//requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.UPDATE]), businessCategoryController.updateBusinessCategory);
// -------------------------------------------
// DELETE CATEGORY
// -------------------------------------------
router.delete("/:categoryId", 
//requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.DELETE]), businessCategoryController.deleteBusinessCategory);
// -------------------------------------------
// UPDATE CATEGORY STATUS (active/inactive)
// -------------------------------------------
router.patch("/:categoryId/status", 
// requireRole(["admin", "super_admin"]) as any,
(0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.CONTENT.UPDATE]), businessCategoryController.updateBusinessCategoryStatus);
exports.default = router;
