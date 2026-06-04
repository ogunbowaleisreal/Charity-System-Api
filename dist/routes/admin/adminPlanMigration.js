"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminMigrationPlan_1 = require("../../controllers/admin/adminMigrationPlan");
const router = (0, express_1.Router)();
const controller = new adminMigrationPlan_1.AdminPlanMigrationController();
// POST /admin/plans/migrate
router.post("/migrate", controller.migratePlan);
exports.default = router;
