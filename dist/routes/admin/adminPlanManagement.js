"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminPlanManagement_1 = require("../../controllers/admin/adminPlanManagement");
const adminAuth_1 = require("../../middleware/adminAuth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const adminMigrationPlan_1 = require("../../controllers/admin/adminMigrationPlan");
const router = (0, express_1.Router)();
const controller = new adminPlanManagement_1.AdminPlanController();
const migrationController = new adminMigrationPlan_1.AdminPlanMigrationController();
router.use(ratelimiter_1.rateLimiter.general);
router.use(adminAuth_1.verifyAdminToken);
// router.post("/",
//     authorize([ADMIN_PERMISSIONS.PLAN.CREATE]),
//     controller.createPlan
// );
// router.patch("/:planId",
//     authorize([ADMIN_PERMISSIONS.PLAN.UPDATE]),
//     controller.updatePlan);
// router.get("/:planId",
//     authorize([ADMIN_PERMISSIONS.PLAN.VIEW]),
//     controller.getPlan);
// router.get("/",
//     authorize([ADMIN_PERMISSIONS.PLAN.VIEW]),
//     controller.getAllPlans);
// router.post("/migrate-old-users",
//     authorize([ADMIN_PERMISSIONS.PLAN.MIGRATE]),
//     migrationController.migratePlan);
exports.default = router;
