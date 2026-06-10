"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../../controllers/admin/dashboardController");
const adminAuth_1 = require("../../middleware/adminAuth");
const admin_management_1 = require("../../types/admin.management");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const dashboardCtrl = new dashboardController_1.DashboardController();
// =========================
// GLOBAL MIDDLEWARE
// =========================
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
// =========================
// 📊 GET DASHBOARD STATS
// =========================
router.get("/stats", (0, adminAuth_1.authorize)([admin_management_1.ADMIN_PERMISSIONS.DASHBOARD.OVERVIEW]), dashboardCtrl.getDashboardStats);
exports.default = router;
