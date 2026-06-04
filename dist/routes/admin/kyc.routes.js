"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_management_1 = require("../../types/admin.management");
const adminAuth_1 = require("../../middleware/adminAuth");
const kyc_controller_1 = require("../../controllers/admin/kyc.controller");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const kycCtrl = new kyc_controller_1.KYCAdminController();
// Apply middlewares globally
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
// Routes
// Submit BVN
router.get("/", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.KYC?.VIEW]), kycCtrl.getPendingKYC);
router.post("/approve/:userId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.KYC?.APPROVE, admin_management_1.ADMIN_PERMISSIONS.KYC?.REJECT, admin_management_1.ADMIN_PERMISSIONS.KYC?.VIEW]), kycCtrl.approveDocument);
router.put("/reject/:userId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.KYC?.REJECT]), kycCtrl.rejectDocument);
exports.default = router;
