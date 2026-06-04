"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { validateRequest } from "@/middleware/validation";
const ratelimiter_1 = require("../../middleware/ratelimiter");
// import {
//     createFAQValidation,
//     updateFAQValidation,
//     faqQueryValidation,
// } from "@/validations/admin/faqValidation";
const admin_management_1 = require("../../types/admin.management");
const adminAuth_1 = require("../../middleware/adminAuth");
const faqController_1 = require("../../controllers/admin/faqController");
const router = (0, express_1.Router)();
const faqController = new faqController_1.FAQController();
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
router.get("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.FAQS.VIEW]), 
//validateRequest(faqQueryValidation),
faqController.getAllFAQs);
// Get FAQ statistics/analytics
// router.get(
//     "/statistics",
//     requireRole(["admin", "super_admin"]) as any,
//     authorize([ADMIN_PERMISSIONS.DASHBOARD.VIEW_FAQS_STATS]) as any,
//     faqController.getFAQStatistics as any
// );
// // Get FAQs by category
// router.get(
//     "/categories",
//     authorize([ADMIN_PERMISSIONS.FAQS.VIEW]) as any,
//     faqController.getFAQCategories as any
// );
// Get specific FAQ by ID
router.get("/:id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.FAQS.VIEW]), faqController.getFAQById);
// Create new FAQ
router.post("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.FAQS.CREATE]), 
//validateRequest(createFAQValidation),
faqController.createFAQ);
// Update FAQ
router.put("/:id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.FAQS.UPDATE]), 
//validateRequest(updateFAQValidation),
faqController.updateFAQ);
// Delete FAQ
router.delete("/:id", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.FAQS.DELETE]), faqController.deleteFAQ);
exports.default = router;
