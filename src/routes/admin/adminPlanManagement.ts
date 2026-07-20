import { Router } from "express";
import { AdminPlanController } from "../../controllers/admin/adminPlanManagement";
import { verifyAdminToken, authorize } from "../../middleware/adminAuth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { AdminPlanMigrationController } from "../../controllers/admin/adminMigrationPlan";


const router = Router();
const controller = new AdminPlanController();
const migrationController = new AdminPlanMigrationController();
router.use(rateLimiter.general);
router.use(verifyAdminToken as any);


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

export default router;
