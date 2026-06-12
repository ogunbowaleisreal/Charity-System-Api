"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardStatistics_1 = require("../../controllers/client/dashboardStatistics");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const dashboardStats = new dashboardStatistics_1.DashboardController();
router.use(auth_1.verifyClientToken);
//router.post('/create', planCtrl.createPlan)
router.get('/', dashboardStats.getDashboard);
exports.default = router;
