"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gratuity_controller_1 = require("../../controllers/admin/gratuity.controller");
const adminAuth_1 = require("../../middleware/adminAuth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const admin_management_1 = require("../../types/admin.management");
const router = (0, express_1.Router)();
const gratuityCtrl = new gratuity_controller_1.AdminGratuityController();
// =========================
// 🔒 GLOBAL MIDDLEWARES
// =========================
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
// =========================
// 🧩 ROUTES
// =========================
// Get current config (admin view)
router.get("/config", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.GRATUITY?.VIEW]), gratuityCtrl.getConfig.bind(gratuityCtrl));
router.post("/create", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.GRATUITY?.CREATE]), gratuityCtrl.createGratuityConfig.bind(gratuityCtrl));
// Update config
router.put("/config/:gratuityId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.GRATUITY?.UPDATE]), gratuityCtrl.updateConfig.bind(gratuityCtrl));
// Toggle gratuity system
router.patch("/config/toggle/:gratuityId", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.GRATUITY?.UPDATE]), gratuityCtrl.toggleGratuity.bind(gratuityCtrl));
exports.default = router;
